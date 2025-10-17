export interface DeploymentContext {
    regions: string[];
    placements: Record<string, any>;
    deploymentDefault?: 'aks' | 'aca' | 'vm' | 'vmss';
    sizeMap?: Record<string, string>;
    scaleMap?: Record<string, {
        min: number;
        max: number;
    }>;
    pricingRegion?: string;
    currency?: string;
    discountFactors?: Record<string, number>;
}
export interface NetworkLikeContext {
    resolvedAzure?: {
        regions: string[];
        placements: Record<string, any>;
    };
    azureDeploymentDefault?: 'aks' | 'aca' | 'vm' | 'vmss';
    azureSizeMap?: Record<string, string>;
    azureScaleMap?: Record<string, {
        min: number;
        max: number;
    }>;
    azurePricingRegion?: string;
    costLivePricing?: boolean;
}
export declare function toDeploymentContext(nc: NetworkLikeContext): DeploymentContext;
//# sourceMappingURL=context.d.ts.map