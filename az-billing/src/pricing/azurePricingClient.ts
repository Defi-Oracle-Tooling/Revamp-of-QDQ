import https from 'https';
import { getPersistentPricingCache } from './cacheStore';

export interface PricingQueryOptions { region: string; currency: string; timeout?: number; persistentCache?: boolean; cacheFile?: string; ttlMs?: number; }
export interface PricingResult { pricePerHour: number; sku: string; resourceType: string; currency: string; source: 'estimated' | 'live' | 'cached'; }

interface CacheEntry { pricePerHour: number; ts: number; }
const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

function buildCacheKey(resourceType: string, sku: string, region: string, currency: string): string {
  return `${resourceType}|${sku}|${region}|${currency}`.toLowerCase();
}

export async function getPricingForResource(resourceType: string, sku: string, region: string, opts: PricingQueryOptions): Promise<PricingResult | null> {
  const key = buildCacheKey(resourceType, sku, region, opts.currency);
  const persistent = opts.persistentCache ? getPersistentPricingCache({ cacheFile: opts.cacheFile, ttlMs: opts.ttlMs }) : null;

  // Persistent first (allows sharing across runs)
  if (persistent) {
    const rec = persistent.get(key);
    if (rec) {
      memoryCache.set(key, rec); // hydrate in-memory for faster subsequent lookups
      return { pricePerHour: rec.pricePerHour, sku, resourceType, currency: opts.currency, source: 'cached' };
    }
  }

  // In-memory fallback
  const cached = memoryCache.get(key);
  if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
    return { pricePerHour: cached.pricePerHour, sku, resourceType, currency: opts.currency, source: 'cached' };
  }

  // Attempt live pricing via Azure Retail Prices API (public unauthenticated)
  // Enhanced filtering heuristics: armRegionName, currencyCode, skuName token, and serviceName/productName hints.
  const baseSkuFragment = sku.split('_')[0];
  // Map resourceType to likely serviceName/productName fragments
  const serviceHints: Record<string,{ service?: string; product?: string[] }> = {
    'aks-cluster': { service: 'Azure Kubernetes Service', product:['Managed Cluster'] },
    'aks-node-pool': { service: 'Azure Kubernetes Service', product:['Virtual Machine','Linux'] },
    'container-app': { service: 'Container Apps', product:['Container Apps'] },
    'virtual-machine': { service: 'Virtual Machines', product:['Virtual Machine','Linux'] },
    'virtual-machine-scale-set': { service: 'Virtual Machines', product:['Virtual Machine','Scale Set'] },
    'storage-account': { service: 'Storage', product:['General Purpose'] },
    'load-balancer': { service: 'Load Balancer', product:['Load Balancer'] },
    'public-ip': { service: 'Networking', product:['Public IP'] },
    'application-insights': { service: 'Monitoring', product:['Application Insights'] },
    'log-analytics': { service: 'Monitoring', product:['Log Analytics'] },
    'virtual-network': { service: 'Networking', product:['Virtual Network'] }
  };
  const hint = serviceHints[resourceType] || {};
  // Construct base filter; Retail Prices API uses OData syntax. We keep it moderate to avoid over-filtering.
  const apiSkuFilter = encodeURIComponent(baseSkuFragment);
  const baseFilter = `armRegionName eq '${region}' and currencyCode eq '${opts.currency}' and contains(skuName,'${apiSkuFilter}')`;
  const url = `https://prices.azure.com/api/retail/prices?$filter=${baseFilter}`;
  try {
    const allItems: any[] = [];
    let next = url;
    let pageCount = 0;
    while (next && pageCount < 3) { // limit pagination to 3 pages for performance
      const data = await fetchJson(next, opts.timeout || 8000);
      if (Array.isArray(data?.Items)) allItems.push(...data.Items);
      next = data?.NextPageLink || null;
      pageCount++;
    }
    const item = selectBestPriceMatch({ Items: allItems }, resourceType, sku, region, opts.currency, hint);
    if (item) {
      const entry = { pricePerHour: item, ts: Date.now() };
      memoryCache.set(key, entry);
      if (persistent) persistent.set(key, item);
      if (persistent) persistent.save();
      return { pricePerHour: item, sku, resourceType, currency: opts.currency, source: 'live' };
    }
  } catch (e) {
    // swallow, fallback to estimate
  }

  const estimated = estimateFallback(resourceType, sku);
  memoryCache.set(key, { pricePerHour: estimated, ts: Date.now() });
  if (persistent) { persistent.set(key, estimated); persistent.save(); }
  return { pricePerHour: estimated, sku, resourceType, currency: opts.currency, source: 'estimated' };
}

function fetchJson(url: string, timeout: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout }, res => {
      if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks: Buffer[] = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8'))); } catch (err) { reject(err); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
  });
}

function selectBestPriceMatch(payload: any, resourceType: string, sku: string, region: string, currency: string, hint?: { service?: string; product?: string[] }): number | null {
  if (!payload || !Array.isArray(payload.Items)) return null;
  const sizeToken = deriveSizeToken(sku);
  const normalizedRegion = region.toLowerCase();
  const baseFragment = sku.split('_')[0];
  let best: { price:number; score:number } | null = null;
  for (const it of payload.Items) {
    if (typeof it.retailPrice !== 'number') continue;
    if (it.armRegionName?.toLowerCase() !== normalizedRegion) continue;
    if (it.currencyCode !== currency) continue;
    const skuName: string = it.skuName || '';
    let score = 0;
    if (skuName.includes(sizeToken)) score += 5;
    if (skuName.includes(baseFragment)) score += 3;
    if (hint?.service && (it.serviceName || '').includes(hint.service)) score += 4;
    if (hint?.product) {
      for (const p of hint.product) {
        if ((it.productName || '').includes(p)) score += 2;
      }
    }
    // Penalize non-hourly units (we expect hourly); if unit is per 1 Hour or 1 Hour we keep; else small penalty
    const unit = (it.unitOfMeasure || '').toLowerCase();
    if (unit.includes('hour')) score += 2; else score -= 2;
    // Slight preference for compute category when matching VM sizes
    if (resourceType.includes('virtual-machine') && /vm/i.test(skuName)) score += 1;
    if (!best || score > best.score) {
      best = { price: it.retailPrice, score };
    }
  }
  return best ? best.price : null;
}

function deriveSizeToken(sku: string): string {
  // e.g. Standard_D4s_v5 -> D4s
  const parts = sku.split('_');
  const size = parts.find(p => /^D\d+s?$/i.test(p));
  return size || sku;
}

function estimateFallback(resourceType: string, sku: string): number {
  const vmCosts: Record<string, number> = {
    'Standard_D2s_v5': 0.096,
    'Standard_D4s_v5': 0.192,
    'Standard_D8s_v5': 0.384,
    'Standard_D16s_v5': 0.768,
    'Standard_B2s': 0.041,
    'Standard_B4ms': 0.166
  };
  const map: Record<string, number> = {
    'aks-cluster': 0.10,
    'aks-node-pool': vmCosts[sku] || 0.10,
    'container-app': 0.05,
    'virtual-machine': vmCosts[sku] || 0.10,
    'virtual-machine-scale-set': vmCosts[sku] || 0.10,
    'log-analytics': 0.05,
    'application-insights': 0.01,
    'storage-account': 0.02,
    'virtual-network': 0.01,
    'load-balancer': 0.025,
    'public-ip': 0.005
  };
  return map[resourceType] || 0.01;
}

export function clearPricingCache(opts: { clearPersistent?: boolean } = {}): void {
  memoryCache.clear();
  if (opts.clearPersistent) {
    try {
      const store = getPersistentPricingCache();
      store.clear();
      store.save();
    } catch {/* ignore */}
  }
}
