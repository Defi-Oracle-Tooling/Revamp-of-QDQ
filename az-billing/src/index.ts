export * from './types/context';
export * from './costing/costingEngine';
export * from './keyvault/secrets';
export * from './pricing/azurePricingClient';
export * from './quota/quotaClient';

// High-level convenience API
import { CostingEngine } from './costing/costingEngine';
import { toDeploymentContext } from './types/context';
import type { NetworkLikeContext } from './types/context';

export async function runCostAnalysis(ctx: NetworkLikeContext, options: any = {}) {
  const deployment = toDeploymentContext(ctx);
  const engine = new CostingEngine(options);
  return engine.analyzeCosts(deployment);
}
