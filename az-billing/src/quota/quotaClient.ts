// Quota evaluation stub (future implementation)
import { DefaultAzureCredential } from '@azure/identity';
import https from 'https';

export interface QuotaUsage { namespace:string; limit:number; current:number; unit:string; region:string; }
export interface QuotaEvaluation { shortages: { namespace:string; required:number; deficit:number; region:string }[]; summary:string; tokenAcquired?: boolean; subscription?: string; }

export interface AzureQuotaFetchOptions { subscriptionId: string; region: string; timeoutMs?: number; credential?: DefaultAzureCredential; }

// ARM endpoints (preview placeholders) – these need proper API versions when implementing fully
const COMPUTE_QUOTA_PATH = (sub:string, region:string)=>`/subscriptions/${sub}/providers/Microsoft.Compute/locations/${region}/usages?api-version=2023-07-01`;
const NETWORK_QUOTA_PATH = (sub:string, region:string)=>`/subscriptions/${sub}/providers/Microsoft.Network/locations/${region}/usages?api-version=2023-05-01`; // Example API version
// Additional namespaces (storage/public IP detail) placeholders – real API versions to be confirmed
const STORAGE_QUOTA_PATH = (sub:string, region:string)=>`/subscriptions/${sub}/providers/Microsoft.Storage/locations/${region}/usages?api-version=2023-01-01`;
// Public IP detail often surfaced under network usages; separate path kept for future granularity

async function getAzureToken(credential: DefaultAzureCredential): Promise<string> {
  const scope = 'https://management.azure.com/.default';
  const token = await credential.getToken(scope);
  if (!token) throw new Error('Failed to acquire Azure access token');
  return token.token;
}

function httpsJsonGet(host:string, path:string, token:string, timeout:number): Promise<any> {
  return new Promise((resolve,reject)=>{
    const req = https.request({ host, path, method:'GET', headers:{ Authorization: `Bearer ${token}` }, timeout }, res => {
      if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} for ${path}`)); return; }
      const chunks:Buffer[]=[]; res.on('data',c=>chunks.push(c)); res.on('end',()=>{ try{ resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));}catch(e){reject(e);} });
    });
    req.on('error',reject); req.on('timeout',()=>{ req.destroy(new Error('timeout')); }); req.end();
  });
}

export async function fetchRegionQuota(options: AzureQuotaFetchOptions): Promise<QuotaUsage[]> {
  const credential = options.credential || new DefaultAzureCredential();
  let token:string; try { token = await getAzureToken(credential); } catch (e) { return []; }
  const timeout = options.timeoutMs || 8000;
  const host = 'management.azure.com';
  const usages: QuotaUsage[] = [];
  try {
    const computeData = await httpsJsonGet(host, COMPUTE_QUOTA_PATH(options.subscriptionId, options.region), token, timeout);
    if (computeData?.value) {
      for (const u of computeData.value) {
        usages.push({ namespace: 'compute', limit: u.limit || 0, current: u.currentValue || 0, unit: u.unit || 'Count', region: options.region });
      }
    }
  } catch {/* swallow compute errors */}
  try {
    const netData = await httpsJsonGet(host, NETWORK_QUOTA_PATH(options.subscriptionId, options.region), token, timeout);
    if (netData?.value) {
      for (const u of netData.value) {
        usages.push({ namespace: 'network', limit: u.limit || 0, current: u.currentValue || 0, unit: u.unit || 'Count', region: options.region });
      }
    }
  } catch {/* swallow network errors */}
  // Storage account capacity (placeholder – some regions may not expose usage; treat missing as 0 current)
  try {
    const storageData = await httpsJsonGet(host, STORAGE_QUOTA_PATH(options.subscriptionId, options.region), token, timeout);
    if (storageData?.value) {
      for (const u of storageData.value) {
        usages.push({ namespace: 'storage', limit: u.limit || 0, current: u.currentValue || 0, unit: u.unit || 'Count', region: options.region });
      }
    }
  } catch {/* swallow storage errors */}
  // Public IP counts may already appear under network; kept for distinct namespace if future API clarifies
  // Pagination stub: if any response exposes nextLink, future enhancement would iterate similar to pricing client
  return usages;
}

export function evaluateQuota(plan: { regions:string[]; placements:Record<string, any> }, quota: QuotaUsage[]): QuotaEvaluation {
  // Heuristics:
  // - compute: validators (1:1)
  // - network (public IP): rpcNodes (1:1)
  // - storage: assume 1 storage account per region baseline
  const shortages: { namespace:string; required:number; deficit:number; region:string }[] = [];
  for (const region of plan.regions) {
    const validators = plan.placements.validators?.replicas || 0;
    const rpc = plan.placements.rpcNodes?.instanceCount || 0;
    const computeRegion = quota.filter(q=>q.region===region && q.namespace==='compute');
    const networkRegion = quota.filter(q=>q.region===region && q.namespace==='network');
    const storageRegion = quota.filter(q=>q.region===region && q.namespace==='storage');
    const computeAvail = computeRegion.reduce((s,q)=>s + (q.limit - q.current),0);
    const networkAvail = networkRegion.reduce((s,q)=>s + (q.limit - q.current),0);
    const storageAvail = storageRegion.reduce((s,q)=>s + (q.limit - q.current),0);
    const computeNeeded = validators;
    const networkNeeded = rpc;
    const storageNeeded = 1; // baseline storage account for logs/artifacts
    if (computeAvail < computeNeeded) shortages.push({ namespace:'compute', required: computeNeeded, deficit: computeNeeded - computeAvail, region });
    if (networkAvail < networkNeeded) shortages.push({ namespace:'network', required: networkNeeded, deficit: networkNeeded - networkAvail, region });
    if (storageRegion.length && storageAvail < storageNeeded) shortages.push({ namespace:'storage', required: storageNeeded, deficit: storageNeeded - storageAvail, region });
  }
  const summary = shortages.length === 0 ? 'All required quotas appear sufficient.' : `${shortages.length} quota shortage(s) detected.`;
  return { shortages, summary };
}
