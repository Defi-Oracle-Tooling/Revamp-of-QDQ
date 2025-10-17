"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRegionQuota = fetchRegionQuota;
exports.evaluateQuota = evaluateQuota;
// Quota evaluation stub (future implementation)
const identity_1 = require("@azure/identity");
const https_1 = __importDefault(require("https"));
// ARM endpoints (preview placeholders) – these need proper API versions when implementing fully
const COMPUTE_QUOTA_PATH = (sub, region) => `/subscriptions/${sub}/providers/Microsoft.Compute/locations/${region}/usages?api-version=2023-07-01`;
const NETWORK_QUOTA_PATH = (sub, region) => `/subscriptions/${sub}/providers/Microsoft.Network/locations/${region}/usages?api-version=2023-05-01`; // Example API version
// Additional namespaces (storage/public IP detail) placeholders – real API versions to be confirmed
const STORAGE_QUOTA_PATH = (sub, region) => `/subscriptions/${sub}/providers/Microsoft.Storage/locations/${region}/usages?api-version=2023-01-01`;
// Public IP detail often surfaced under network usages; separate path kept for future granularity
async function getAzureToken(credential) {
    const scope = 'https://management.azure.com/.default';
    const token = await credential.getToken(scope);
    if (!token)
        throw new Error('Failed to acquire Azure access token');
    return token.token;
}
function httpsJsonGet(host, path, token, timeout) {
    return new Promise((resolve, reject) => {
        const req = https_1.default.request({ host, path, method: 'GET', headers: { Authorization: `Bearer ${token}` }, timeout }, res => {
            if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`HTTP ${res.statusCode} for ${path}`));
                return;
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => { try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
            }
            catch (e) {
                reject(e);
            } });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(new Error('timeout')); });
        req.end();
    });
}
async function fetchRegionQuota(options) {
    const credential = options.credential || new identity_1.DefaultAzureCredential();
    let token;
    try {
        token = await getAzureToken(credential);
    }
    catch (e) {
        return [];
    }
    const timeout = options.timeoutMs || 8000;
    const host = 'management.azure.com';
    const usages = [];
    try {
        const computeData = await httpsJsonGet(host, COMPUTE_QUOTA_PATH(options.subscriptionId, options.region), token, timeout);
        if (computeData?.value) {
            for (const u of computeData.value) {
                usages.push({ namespace: 'compute', limit: u.limit || 0, current: u.currentValue || 0, unit: u.unit || 'Count', region: options.region });
            }
        }
    }
    catch { /* swallow compute errors */ }
    try {
        const netData = await httpsJsonGet(host, NETWORK_QUOTA_PATH(options.subscriptionId, options.region), token, timeout);
        if (netData?.value) {
            for (const u of netData.value) {
                usages.push({ namespace: 'network', limit: u.limit || 0, current: u.currentValue || 0, unit: u.unit || 'Count', region: options.region });
            }
        }
    }
    catch { /* swallow network errors */ }
    // Storage account capacity (placeholder – some regions may not expose usage; treat missing as 0 current)
    try {
        const storageData = await httpsJsonGet(host, STORAGE_QUOTA_PATH(options.subscriptionId, options.region), token, timeout);
        if (storageData?.value) {
            for (const u of storageData.value) {
                usages.push({ namespace: 'storage', limit: u.limit || 0, current: u.currentValue || 0, unit: u.unit || 'Count', region: options.region });
            }
        }
    }
    catch { /* swallow storage errors */ }
    // Public IP counts may already appear under network; kept for distinct namespace if future API clarifies
    // Pagination stub: if any response exposes nextLink, future enhancement would iterate similar to pricing client
    return usages;
}
function evaluateQuota(plan, quota) {
    // Heuristics:
    // - compute: validators (1:1)
    // - network (public IP): rpcNodes (1:1)
    // - storage: assume 1 storage account per region baseline
    const shortages = [];
    for (const region of plan.regions) {
        const validators = plan.placements.validators?.replicas || 0;
        const rpc = plan.placements.rpcNodes?.instanceCount || 0;
        const computeRegion = quota.filter(q => q.region === region && q.namespace === 'compute');
        const networkRegion = quota.filter(q => q.region === region && q.namespace === 'network');
        const storageRegion = quota.filter(q => q.region === region && q.namespace === 'storage');
        const computeAvail = computeRegion.reduce((s, q) => s + (q.limit - q.current), 0);
        const networkAvail = networkRegion.reduce((s, q) => s + (q.limit - q.current), 0);
        const storageAvail = storageRegion.reduce((s, q) => s + (q.limit - q.current), 0);
        const computeNeeded = validators;
        const networkNeeded = rpc;
        const storageNeeded = 1; // baseline storage account for logs/artifacts
        if (computeAvail < computeNeeded)
            shortages.push({ namespace: 'compute', required: computeNeeded, deficit: computeNeeded - computeAvail, region });
        if (networkAvail < networkNeeded)
            shortages.push({ namespace: 'network', required: networkNeeded, deficit: networkNeeded - networkAvail, region });
        if (storageRegion.length && storageAvail < storageNeeded)
            shortages.push({ namespace: 'storage', required: storageNeeded, deficit: storageNeeded - storageAvail, region });
    }
    const summary = shortages.length === 0 ? 'All required quotas appear sufficient.' : `${shortages.length} quota shortage(s) detected.`;
    return { shortages, summary };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVvdGFDbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcXVvdGEvcXVvdGFDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFpQ0EsNENBa0NDO0FBRUQsc0NBd0JDO0FBN0ZELGdEQUFnRDtBQUNoRCw4Q0FBeUQ7QUFDekQsa0RBQTBCO0FBTzFCLGdHQUFnRztBQUNoRyxNQUFNLGtCQUFrQixHQUFHLENBQUMsR0FBVSxFQUFFLE1BQWEsRUFBQyxFQUFFLENBQUEsa0JBQWtCLEdBQUcsMENBQTBDLE1BQU0sZ0NBQWdDLENBQUM7QUFDOUosTUFBTSxrQkFBa0IsR0FBRyxDQUFDLEdBQVUsRUFBRSxNQUFhLEVBQUMsRUFBRSxDQUFBLGtCQUFrQixHQUFHLDBDQUEwQyxNQUFNLGdDQUFnQyxDQUFDLENBQUMsc0JBQXNCO0FBQ3JMLG9HQUFvRztBQUNwRyxNQUFNLGtCQUFrQixHQUFHLENBQUMsR0FBVSxFQUFFLE1BQWEsRUFBQyxFQUFFLENBQUEsa0JBQWtCLEdBQUcsMENBQTBDLE1BQU0sZ0NBQWdDLENBQUM7QUFDOUosa0dBQWtHO0FBRWxHLEtBQUssVUFBVSxhQUFhLENBQUMsVUFBa0M7SUFDN0QsTUFBTSxLQUFLLEdBQUcsdUNBQXVDLENBQUM7SUFDdEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLElBQUksQ0FBQyxLQUFLO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO0lBQ3BFLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNyQixDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsSUFBVyxFQUFFLElBQVcsRUFBRSxLQUFZLEVBQUUsT0FBYztJQUMxRSxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxFQUFFO1FBQ25DLE1BQU0sR0FBRyxHQUFHLGVBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLEVBQUUsYUFBYSxFQUFFLFVBQVUsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRTtZQUNuSCxJQUFJLEdBQUcsQ0FBQyxVQUFVLElBQUksR0FBRyxDQUFDLFVBQVUsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxHQUFHLENBQUMsVUFBVSxRQUFRLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFBQyxPQUFPO1lBQUMsQ0FBQztZQUNqSCxNQUFNLE1BQU0sR0FBVSxFQUFFLENBQUM7WUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBQyxDQUFDLENBQUEsRUFBRSxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFDLEdBQUUsRUFBRSxHQUFFLElBQUcsQ0FBQztnQkFBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQSxDQUFDO1lBQUEsT0FBTSxDQUFDLEVBQUMsQ0FBQztnQkFBQSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUssQ0FBQyxDQUFDLENBQUM7UUFDSCxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBQyxNQUFNLENBQUMsQ0FBQztRQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFDLEdBQUUsRUFBRSxHQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsR0FBRyxDQUFDLEdB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