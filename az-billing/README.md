# AZ Billing Submodule

Purpose: Provide Azure cost analysis, pricing, (future) quota evaluation and FinOps recommendations for Quorum dev networks.

## Features
- Cost analysis across regions / deployment strategies
- Live vs estimated pricing abstraction (Azure Retail Prices API + fallback)
- Persistent pricing cache (shared across runs) & in-memory TTL cache
- Discount factor application per resource type (reserved instances / savings plans modeling)
- Key Vault secret resolution utilities
- Quota usage evaluation stubs (Compute, Network, Storage) with token acquisition (public IP detail forthcoming)
- HTML & CSV enriched reporting output (tables + burn rates + strategy comparison + quota badges)

## Install & Build
From repo root:
```
npm install
npm run build:az-billing
```

## Usage (from root code)
```ts
import { runCostAnalysis } from '../az-billing/dist/index.js';
const report = await runCostAnalysis(networkContext, {
	pricingRegion: 'eastus',
	useLivePricing: true,
	persistentCache: true,
	discountFactors: { 'aks-node-pool': 0.72 } // 28% savings plan assumed
});
console.log(report.totalMonthlyCost);
```

### Discount Factors
Pass `discountFactors: Record<AzureResourceType, number>` where value is a multiplier (0 < v ≤ 1). Example: `0.7` = 30% discount. Only supplied resource types are modified.

### Persistent Pricing Cache
Enabled by `persistentCache: true`. Default path: `az-billing/.pricing-cache.json`. Override with `cacheFile`. TTL configurable via `ttlMs`.

```ts
const report = await runCostAnalysis(ctx, { persistentCache: true, cacheFile: './custom-cache.json', ttlMs: 1000*60*30 });
```
Clear caches:
```ts
import { clearPricingCache } from '../az-billing/dist/pricing/azurePricingClient.js';
clearPricingCache({ clearPersistent: true });
```

### Output Formats
Choose via `outputFormat: 'json' | 'csv' | 'html'`.
- JSON: Structured `CostAnalysisReport`.
- CSV: Resource breakdown + blank line + burn rate table.
- HTML: Styled summary (hour/day/month/annual), resource table, burn rates, optional strategy comparison.

### Strategy Comparison
Enabled by default. Provide custom strategies via `comparisonStrategies: string[]`.
Example strategies: `single-region-aks`, `multi-region-aks`, `single-region-vm`, `multi-region-vm`, `hybrid-aks-aca`.

### Quota Evaluation (Stub)
`fetchRegionQuota({ subscriptionId, region })` attempts token acquisition (swallows errors) and queries placeholder ARM endpoints for:
- Compute usages
- Network usages (includes public IP counts in aggregate)
- Storage account capacity (provisional)

`evaluateQuota(plan, quota)` now heuristically checks required counts:
- compute: validators (1:1)
- network: rpc nodes (1:1 public IP)
- storage: baseline 1 storage account per region

Result injected into HTML report as shortage badges (red) or OK status. API versions are provisional; pagination limited to single page (future enhancement will iterate `nextLink`).

## CLI Integration
When root flags enable cost analysis, `networkBuilder` dynamically imports `runCostAnalysis`.

New root CLI flags (set at project root):
```
--costPersistentCache            Enable persistent pricing cache
--costDiscountFactors            Discount multipliers per resource type (e.g. aks-node-pool=0.72,virtual-machine=0.65)
--costQuotaCheck                 Enable quota evaluation (requires --azureSubscriptionId)
--azureSubscriptionId            Subscription ID used for quota API calls
```
Example invocation with discounts + persistent cache + quota:
```bash
node build/index.js \
	--clientType besu \
	--privacy true \
	--monitoring loki \
	--azureEnable true \
	--azureRegions "eastus,westus2" \
	--costAnalysis true \
	--costOutputFormat html \
	--costPersistentCache true \
	--costDiscountFactors "aks-node-pool=0.72,virtual-machine=0.65" \
	--costQuotaCheck true \
	--azureSubscriptionId YOUR-SUBSCRIPTION-ID \
	--outputPath ./network-with-costs
```

## Quota Roadmap
- Refine API version usage & error surface
- Incorporate additional namespaces (Storage, Container Instances, Public IPs detail)
- Export quota increase request template + JSON schema

## Directory Layout
- `src/costing` - costing engine & comparisons
- `src/pricing` - pricing client + persistent cache store
- `src/keyvault` - secret resolution
- `src/quota` - quota fetch & evaluation stubs
- `src/types` - shared interfaces / context adapters

## Development
```
cd az-billing
npm run build
```
Generated output in `az-billing/dist`.

Run local tests (from repo root):
```bash
npm test --silent
```

## Minimal Example
```ts
const report = await runCostAnalysis(ctx, {
	pricingRegion: 'eastus',
	periods: ['hour','day','month'],
	outputFormat: 'json',
	discountFactors: { 'aks-node-pool': 0.8 },
	persistentCache: true
});
```

## Follow-Ups
- Further refine Retail Prices API filtering (SKU vs meterName matching)
- Extend discount modeling (tiered reservations vs flat multiplier)
- Pagination & namespace expansion (e.g., detailed Public IP breakdown, Container Instances)
- Export quota increase request template generation

## License
Same license as parent repository.
