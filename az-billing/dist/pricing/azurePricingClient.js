"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPricingForResource = getPricingForResource;
exports.clearPricingCache = clearPricingCache;
const https_1 = __importDefault(require("https"));
const cacheStore_1 = require("./cacheStore");
const memoryCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
function buildCacheKey(resourceType, sku, region, currency) {
    return `${resourceType}|${sku}|${region}|${currency}`.toLowerCase();
}
async function getPricingForResource(resourceType, sku, region, opts) {
    const key = buildCacheKey(resourceType, sku, region, opts.currency);
    const persistent = opts.persistentCache ? (0, cacheStore_1.getPersistentPricingCache)({ cacheFile: opts.cacheFile, ttlMs: opts.ttlMs }) : null;
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
    const serviceHints = {
        'aks-cluster': { service: 'Azure Kubernetes Service', product: ['Managed Cluster'] },
        'aks-node-pool': { service: 'Azure Kubernetes Service', product: ['Virtual Machine', 'Linux'] },
        'container-app': { service: 'Container Apps', product: ['Container Apps'] },
        'virtual-machine': { service: 'Virtual Machines', product: ['Virtual Machine', 'Linux'] },
        'virtual-machine-scale-set': { service: 'Virtual Machines', product: ['Virtual Machine', 'Scale Set'] },
        'storage-account': { service: 'Storage', product: ['General Purpose'] },
        'load-balancer': { service: 'Load Balancer', product: ['Load Balancer'] },
        'public-ip': { service: 'Networking', product: ['Public IP'] },
        'application-insights': { service: 'Monitoring', product: ['Application Insights'] },
        'log-analytics': { service: 'Monitoring', product: ['Log Analytics'] },
        'virtual-network': { service: 'Networking', product: ['Virtual Network'] }
    };
    const hint = serviceHints[resourceType] || {};
    // Construct base filter; Retail Prices API uses OData syntax. We keep it moderate to avoid over-filtering.
    const apiSkuFilter = encodeURIComponent(baseSkuFragment);
    const baseFilter = `armRegionName eq '${region}' and currencyCode eq '${opts.currency}' and contains(skuName,'${apiSkuFilter}')`;
    const url = `https://prices.azure.com/api/retail/prices?$filter=${baseFilter}`;
    try {
        const allItems = [];
        let next = url;
        let pageCount = 0;
        while (next && pageCount < 3) { // limit pagination to 3 pages for performance
            const data = await fetchJson(next, opts.timeout || 8000);
            if (Array.isArray(data?.Items))
                allItems.push(...data.Items);
            next = data?.NextPageLink || null;
            pageCount++;
        }
        const item = selectBestPriceMatch({ Items: allItems }, resourceType, sku, region, opts.currency, hint);
        if (item) {
            const entry = { pricePerHour: item, ts: Date.now() };
            memoryCache.set(key, entry);
            if (persistent)
                persistent.set(key, item);
            if (persistent)
                persistent.save();
            return { pricePerHour: item, sku, resourceType, currency: opts.currency, source: 'live' };
        }
    }
    catch (e) {
        // swallow, fallback to estimate
    }
    const estimated = estimateFallback(resourceType, sku);
    memoryCache.set(key, { pricePerHour: estimated, ts: Date.now() });
    if (persistent) {
        persistent.set(key, estimated);
        persistent.save();
    }
    return { pricePerHour: estimated, sku, resourceType, currency: opts.currency, source: 'estimated' };
}
function fetchJson(url, timeout) {
    return new Promise((resolve, reject) => {
        const req = https_1.default.get(url, { timeout }, res => {
            if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
                }
                catch (err) {
                    reject(err);
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(new Error('timeout')); });
    });
}
function selectBestPriceMatch(payload, resourceType, sku, region, currency, hint) {
    if (!payload || !Array.isArray(payload.Items))
        return null;
    const sizeToken = deriveSizeToken(sku);
    const normalizedRegion = region.toLowerCase();
    const baseFragment = sku.split('_')[0];
    let best = null;
    for (const it of payload.Items) {
        if (typeof it.retailPrice !== 'number')
            continue;
        if (it.armRegionName?.toLowerCase() !== normalizedRegion)
            continue;
        if (it.currencyCode !== currency)
            continue;
        const skuName = it.skuName || '';
        let score = 0;
        if (skuName.includes(sizeToken))
            score += 5;
        if (skuName.includes(baseFragment))
            score += 3;
        if (hint?.service && (it.serviceName || '').includes(hint.service))
            score += 4;
        if (hint?.product) {
            for (const p of hint.product) {
                if ((it.productName || '').includes(p))
                    score += 2;
            }
        }
        // Penalize non-hourly units (we expect hourly); if unit is per 1 Hour or 1 Hour we keep; else small penalty
        const unit = (it.unitOfMeasure || '').toLowerCase();
        if (unit.includes('hour'))
            score += 2;
        else
            score -= 2;
        // Slight preference for compute category when matching VM sizes
        if (resourceType.includes('virtual-machine') && /vm/i.test(skuName))
            score += 1;
        if (!best || score > best.score) {
            best = { price: it.retailPrice, score };
        }
    }
    return best ? best.price : null;
}
function deriveSizeToken(sku) {
    // e.g. Standard_D4s_v5 -> D4s
    const parts = sku.split('_');
    const size = parts.find(p => /^D\d+s?$/i.test(p));
    return size || sku;
}
function estimateFallback(resourceType, sku) {
    const vmCosts = {
        'Standard_D2s_v5': 0.096,
        'Standard_D4s_v5': 0.192,
        'Standard_D8s_v5': 0.384,
        'Standard_D16s_v5': 0.768,
        'Standard_B2s': 0.041,
        'Standard_B4ms': 0.166
    };
    const map = {
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
function clearPricingCache(opts = {}) {
    memoryCache.clear();
    if (opts.clearPersistent) {
        try {
            const store = (0, cacheStore_1.getPersistentPricingCache)();
            store.clear();
            store.save();
        }
        catch { /* ignore */ }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXp1cmVQcmljaW5nQ2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3ByaWNpbmcvYXp1cmVQcmljaW5nQ2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBY0Esc0RBbUVDO0FBaUZELDhDQVNDO0FBM0tELGtEQUEwQjtBQUMxQiw2Q0FBeUQ7QUFNekQsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQXNCLENBQUM7QUFDbEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxTQUFTO0FBRTlDLFNBQVMsYUFBYSxDQUFDLFlBQW9CLEVBQUUsR0FBVyxFQUFFLE1BQWMsRUFBRSxRQUFnQjtJQUN4RixPQUFPLEdBQUcsWUFBWSxJQUFJLEdBQUcsSUFBSSxNQUFNLElBQUksUUFBUSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdEUsQ0FBQztBQUVNLEtBQUssVUFBVSxxQkFBcUIsQ0FBQyxZQUFvQixFQUFFLEdBQVcsRUFBRSxNQUFjLEVBQUUsSUFBeUI7SUFDdEgsTUFBTSxHQUFHLEdBQUcsYUFBYSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNwRSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFBLHNDQUF5QixFQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFN0gsZ0RBQWdEO0lBQ2hELElBQUksVUFBVSxFQUFFLENBQUM7UUFDZixNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDUixXQUFXLENBQUMsR0FBRyxDQUFDLEdB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