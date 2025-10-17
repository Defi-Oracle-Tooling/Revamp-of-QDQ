export * from './types/context';
export * from './costing/costingEngine';
export * from './keyvault/secrets';
export * from './pricing/azurePricingClient';
export * from './quota/quotaClient';
import type { NetworkLikeContext } from './types/context';
export declare function runCostAnalysis(ctx: NetworkLikeContext, options?: any): Promise<import("./costing/costingEngine").CostAnalysisReport>;
//# sourceMappingURL=index.d.ts.map