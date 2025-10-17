// Generic deployment context stripped from main NetworkContext
export interface DeploymentContext {
  regions: string[];
  placements: Record<string, any>; // refine later
  deploymentDefault?: 'aks' | 'aca' | 'vm' | 'vmss';
  sizeMap?: Record<string,string>;
  scaleMap?: Record<string,{min:number;max:number}>;
  pricingRegion?: string;
  currency?: string;
  discountFactors?: Record<string, number>;
}

// Minimal shape accepted from root network builder
export interface NetworkLikeContext {
  resolvedAzure?: { regions: string[]; placements: Record<string, any> };
  azureDeploymentDefault?: 'aks' | 'aca' | 'vm' | 'vmss';
  azureSizeMap?: Record<string,string>;
  azureScaleMap?: Record<string,{min:number;max:number}>;
  azurePricingRegion?: string;
  costLivePricing?: boolean;
}

export function toDeploymentContext(nc: NetworkLikeContext): DeploymentContext {
  if (!nc.resolvedAzure) throw new Error('resolvedAzure topology required for cost analysis');
  return {
    regions: nc.resolvedAzure.regions,
    placements: nc.resolvedAzure.placements,
    deploymentDefault: nc.azureDeploymentDefault,
    sizeMap: nc.azureSizeMap,
    scaleMap: nc.azureScaleMap,
    pricingRegion: nc.azurePricingRegion || 'eastus',
    currency: 'USD'
  };
}
