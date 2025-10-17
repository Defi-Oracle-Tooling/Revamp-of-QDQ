import type { DeploymentContext } from '../types/context';
export type CostPeriod = "minute" | "hour" | "day" | "3-day" | "week" | "month" | "quarter" | "annual";
export type AzureResourceType = "aks-cluster" | "aks-node-pool" | "container-app" | "virtual-machine" | "virtual-machine-scale-set" | "log-analytics" | "application-insights" | "storage-account" | "virtual-network" | "load-balancer" | "public-ip";
export interface PeriodCost {
    period: CostPeriod;
    cost: number;
    currency: string;
}
export interface ResourceCost {
    resourceType: AzureResourceType;
    resourceName: string;
    region: string;
    sku: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    currency: string;
}
export interface DeploymentStrategyComparison {
    strategies: {
        name: string;
        description: string;
        monthlyCost: number;
        annualCost: number;
        resources: ResourceCost[];
    }[];
    recommendations: {
        strategy: string;
        reason: string;
        savings: number;
        tradeoffs: string[];
    }[];
}
export interface CostAnalysisReport {
    networkName: string;
    analysisDate: Date;
    region: string;
    deploymentStrategy: string;
    burnRates: PeriodCost[];
    resourceBreakdown: ResourceCost[];
    totalHourlyCost: number;
    totalDailyCost: number;
    totalMonthlyCost: number;
    totalAnnualCost: number;
    currency: string;
    comparison?: DeploymentStrategyComparison;
}
export interface CostingOptions {
    useLivePricing: boolean;
    pricingRegion: string;
    currency: string;
    periods: CostPeriod[];
    enableComparison: boolean;
    comparisonStrategies?: string[];
    outputFormat: "json" | "csv" | "html";
    includeResourceBreakdown: boolean;
    discountFactors?: Record<AzureResourceType, number>;
}
export declare const DEFAULT_COSTING_OPTIONS: CostingOptions;
export declare class CostingEngine {
    private options;
    constructor(options?: Partial<CostingOptions>);
    analyzeCosts(context: DeploymentContext): Promise<CostAnalysisReport>;
    private extractResourceConfigurations;
    private extractAksResources;
    private extractAcaResources;
    private extractVmResources;
    private extractVmssResources;
    private extractSharedResources;
    private calculateResourceCosts;
    private getResourceUnitCost;
    private getLivePricing;
    private getEstimatedCost;
    private calculateBurnRates;
    private generateStrategyComparison;
    compareDeploymentStrategies(base: DeploymentContext, strategies: string[]): Promise<DeploymentStrategyComparison>;
    private createAlternativeContext;
    private generateRecommendations;
    private getStrategyTradeoffs;
    private getDeploymentStrategyName;
}
//# sourceMappingURL=costingEngine.d.ts.map