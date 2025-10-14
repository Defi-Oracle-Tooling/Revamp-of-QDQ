import { NetworkContext } from "../networkBuilder";

/**
 * Time periods supported for burn rate calculations
 */
export type CostPeriod =
    | "minute"
    | "hour"
    | "day"
    | "3-day"
    | "week"
    | "month"
    | "quarter"
    | "annual";

/**
 * Azure resource types that can be costed
 */
export type AzureResourceType =
    | "aks-cluster"
    | "aks-node-pool"
    | "container-app"
    | "virtual-machine"
    | "virtual-machine-scale-set"
    | "log-analytics"
    | "application-insights"
    | "storage-account"
    | "virtual-network"
    | "load-balancer"
    | "public-ip";

/**
 * Cost calculation result for a specific time period
 */
export interface PeriodCost {
    period: CostPeriod;
    cost: number;
    currency: string;
}

/**
 * Detailed cost breakdown by resource type
 */
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

/**
 * Complete cost analysis report
 */
export interface CostAnalysisReport {
    networkName: string;
    analysisDate: Date;
    region: string;
    deploymentStrategy: string;

    // Per-period burn rates
    burnRates: PeriodCost[];

    // Resource breakdown
    resourceBreakdown: ResourceCost[];

    // Totals
    totalHourlyCost: number;
    totalDailyCost: number;
    totalMonthlyCost: number;
    totalAnnualCost: number;

    currency: string;

    // Comparison data (if applicable)
    comparison?: DeploymentStrategyComparison;
}

/**
 * Comparison between different deployment strategies
 */
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

/**
 * Configuration options for costing analysis
 */
export interface CostingOptions {
    /** Include live pricing data (requires API calls) */
    useLivePricing: boolean;

    /** Azure region for pricing data */
    pricingRegion: string;

    /** Currency for cost calculations */
    currency: string;

    /** Time periods to calculate */
    periods: CostPeriod[];

    /** Enable deployment strategy comparison */
    enableComparison: boolean;

    /** Alternative strategies to compare against */
    comparisonStrategies?: string[];

    /** Output format for reports */
    outputFormat: "json" | "csv" | "html";

    /** Include detailed resource breakdown */
    includeResourceBreakdown: boolean;

    /** Apply discount factors (e.g., reserved instances) */
    discountFactors?: Record<AzureResourceType, number>;
}

/**
 * Default costing options
 */
export const DEFAULT_COSTING_OPTIONS: CostingOptions = {
    useLivePricing: true,
    pricingRegion: "eastus",
    currency: "USD",
    periods: ["hour", "day", "week", "month", "quarter", "annual"],
    enableComparison: true,
    outputFormat: "json",
    includeResourceBreakdown: true
};

/**
 * Main costing engine for Quorum network deployments
 *
 * Provides comprehensive cost analysis including:
 * - Live Azure pricing integration
 * - Multi-period burn rate calculations
 * - Deployment strategy comparisons
 * - Resource-level cost breakdown
 */
export class CostingEngine {
    private options: CostingOptions;

    constructor(options: Partial<CostingOptions> = {}) {
        this.options = { ...DEFAULT_COSTING_OPTIONS, ...options };
    }

    /**
     * Analyze costs for a given network configuration
     */
    async analyzeCosts(context: NetworkContext): Promise<CostAnalysisReport> {
        if (!context.azureEnable && !context.resolvedAzure) {
            throw new Error("Azure deployment must be enabled for cost analysis");
        }

        // Get resource configurations from network context
        const resources = await this.extractResourceConfigurations(context);

        // Calculate costs for each resource
        const resourceCosts = await this.calculateResourceCosts(resources);

        // Calculate burn rates for different periods
        const burnRates = this.calculateBurnRates(resourceCosts);

        // Generate deployment strategy comparison if requested
        let comparison: DeploymentStrategyComparison | undefined;
        if (this.options.enableComparison) {
            comparison = await this.generateStrategyComparison(context);
        }

        // Calculate totals
        const totalHourly = resourceCosts.reduce((sum, r) => sum + r.totalCost, 0);

        return {
            networkName: `${context.azureEnable ? 'azure-' : ''}${context.clientType}-network`,
            analysisDate: new Date(),
            region: this.options.pricingRegion,
            deploymentStrategy: this.getDeploymentStrategyName(context),
            burnRates,
            resourceBreakdown: resourceCosts,
            totalHourlyCost: totalHourly,
            totalDailyCost: totalHourly * 24,
            totalMonthlyCost: totalHourly * 24 * 30,
            totalAnnualCost: totalHourly * 24 * 365,
            currency: this.options.currency,
            comparison
        };
    }

    /**
     * Compare costs between different deployment strategies
     */
    async compareDeploymentStrategies(
        baseContext: NetworkContext,
        strategies: string[]
    ): Promise<DeploymentStrategyComparison> {
        const baseResources = await this.extractResourceConfigurations(baseContext);
        const baseCosts = await this.calculateResourceCosts(baseResources);
        const baseMonthlyCost = baseCosts.reduce((sum, r) => sum + r.totalCost, 0) * 24 * 30;

        const strategyAnalyses = [{
            name: "current",
            description: this.getDeploymentStrategyName(baseContext),
            monthlyCost: baseMonthlyCost,
            annualCost: baseMonthlyCost * 12,
            resources: baseCosts
        }];

        // Analyze alternative strategies
        for (const strategy of strategies) {
            const altContext = this.createAlternativeContext(baseContext, strategy);
            const altResources = await this.extractResourceConfigurations(altContext);
            const altCosts = await this.calculateResourceCosts(altResources);
            const altMonthlyCost = altCosts.reduce((sum, r) => sum + r.totalCost, 0) * 24 * 30;

            strategyAnalyses.push({
                name: strategy,
                description: this.getDeploymentStrategyName(altContext),
                monthlyCost: altMonthlyCost,
                annualCost: altMonthlyCost * 12,
                resources: altCosts
            });
        }

        // Generate recommendations
        const recommendations = this.generateRecommendations(strategyAnalyses);

        return {
            strategies: strategyAnalyses,
            recommendations
        };
    }

    /**
     * Extract Azure resource configurations from network context
     */
    private async extractResourceConfigurations(context: NetworkContext): Promise<AzureResourceConfig[]> {
        const configs: AzureResourceConfig[] = [];
        const topology = context.resolvedAzure;

        if (!topology) {
            throw new Error("No resolved Azure topology found");
        }

        // Extract compute resources based on deployment type
        for (const region of topology.regions) {
            const deploymentType = context.azureDeploymentDefault || "aks";
            const validators = context.validators || 4;
            const rpcNodes = context.rpcNodes || 1;

            // Create deployment structure for compatibility
            const deployment = {
                validators,
                rpcNodes,
                deploymentType
            };

            switch (deploymentType) {
                case "aks":
                    configs.push(...this.extractAksResources(region, deployment, context));
                    break;
                case "aca":
                    configs.push(...this.extractAcaResources(region, deployment, context));
                    break;
                case "vm":
                    configs.push(...this.extractVmResources(region, deployment, context));
                    break;
                case "vmss":
                    configs.push(...this.extractVmssResources(region, deployment, context));
                    break;
            }

            // Add shared resources (networking, monitoring, storage)
            configs.push(...this.extractSharedResources(region, deployment, context));
        }

        return configs;
    }

    /**
     * Extract AKS resource configurations
     */
    private extractAksResources(region: string, deployment: any, context: NetworkContext): AzureResourceConfig[] {
        const configs: AzureResourceConfig[] = [];

        // AKS cluster (control plane)
        configs.push({
            resourceType: "aks-cluster",
            resourceName: `${context.clientType}-aks-${region}`,
            region,
            sku: "Standard",
            quantity: 1,
            properties: {
                version: "1.28",
                networkPlugin: "kubenet"
            }
        });

        // Validator node pool
        if (deployment.validators > 0) {
            configs.push({
                resourceType: "aks-node-pool",
                resourceName: `validators-${region}`,
                region,
                sku: context.azureSizeMap?.validators || "Standard_D4s_v5",
                quantity: deployment.validators,
                properties: {
                    diskSize: 128,
                    osDiskType: "Premium_LRS"
                }
            });
        }

        // RPC node pool
        if (deployment.rpcNodes > 0) {
            configs.push({
                resourceType: "aks-node-pool",
                resourceName: `rpc-${region}`,
                region,
                sku: context.azureSizeMap?.rpc || "Standard_D2s_v5",
                quantity: deployment.rpcNodes,
                properties: {
                    diskSize: 64,
                    osDiskType: "Premium_LRS"
                }
            });
        }

        return configs;
    }

    /**
     * Extract Container Apps resource configurations
     */
    private extractAcaResources(region: string, deployment: any, context: NetworkContext): AzureResourceConfig[] {
        const configs: AzureResourceConfig[] = [];

        // Container Apps Environment
        configs.push({
            resourceType: "container-app",
            resourceName: `${context.clientType}-env-${region}`,
            region,
            sku: "Consumption",
            quantity: 1,
            properties: {}
        });

        // Validator containers
        if (deployment.validators > 0) {
            configs.push({
                resourceType: "container-app",
                resourceName: `validators-${region}`,
                region,
                sku: "Consumption",
                quantity: deployment.validators,
                properties: {
                    cpu: 2,
                    memory: "4Gi",
                    storage: "32Gi"
                }
            });
        }

        // RPC containers
        if (deployment.rpcNodes > 0) {
            configs.push({
                resourceType: "container-app",
                resourceName: `rpc-${region}`,
                region,
                sku: "Consumption",
                quantity: deployment.rpcNodes,
                properties: {
                    cpu: 1,
                    memory: "2Gi",
                    storage: "16Gi"
                }
            });
        }

        return configs;
    }

    /**
     * Extract VM resource configurations
     */
    private extractVmResources(region: string, deployment: any, context: NetworkContext): AzureResourceConfig[] {
        const configs: AzureResourceConfig[] = [];
        const totalNodes = deployment.validators + deployment.rpcNodes;

        configs.push({
            resourceType: "virtual-machine",
            resourceName: `${context.clientType}-vms-${region}`,
            region,
            sku: context.azureSizeMap?.default || "Standard_D4s_v5",
            quantity: totalNodes,
            properties: {
                osDiskSize: 128,
                osDiskType: "Premium_LRS",
                dataDiskSize: 256,
                dataDiskType: "Premium_LRS"
            }
        });

        return configs;
    }

    /**
     * Extract VMSS resource configurations
     */
    private extractVmssResources(region: string, deployment: any, context: NetworkContext): AzureResourceConfig[] {
        const configs: AzureResourceConfig[] = [];
        const totalNodes = deployment.validators + deployment.rpcNodes;

        configs.push({
            resourceType: "virtual-machine-scale-set",
            resourceName: `${context.clientType}-vmss-${region}`,
            region,
            sku: context.azureSizeMap?.default || "Standard_D4s_v5",
            quantity: totalNodes,
            properties: {
                osDiskSize: 128,
                osDiskType: "Premium_LRS",
                dataDiskSize: 256,
                dataDiskType: "Premium_LRS"
            }
        });

        return configs;
    }

    /**
     * Extract shared resource configurations (networking, monitoring, storage)
     */
    private extractSharedResources(region: string, deployment: any, context: NetworkContext): AzureResourceConfig[] {
        const configs: AzureResourceConfig[] = [];

        // Virtual Network
        configs.push({
            resourceType: "virtual-network",
            resourceName: `${context.clientType}-vnet-${region}`,
            region,
            sku: "Standard",
            quantity: 1,
            properties: {}
        });

        // Load Balancer (if needed)
        if (deployment.rpcNodes > 0) {
            configs.push({
                resourceType: "load-balancer",
                resourceName: `${context.clientType}-lb-${region}`,
                region,
                sku: "Standard",
                quantity: 1,
                properties: {}
            });

            configs.push({
                resourceType: "public-ip",
                resourceName: `${context.clientType}-ip-${region}`,
                region,
                sku: "Standard",
                quantity: 1,
                properties: {}
            });
        }

        // Log Analytics Workspace
        if (context.monitoring && context.monitoring !== "loki") {
            configs.push({
                resourceType: "log-analytics",
                resourceName: `${context.clientType}-logs-${region}`,
                region,
                sku: "PerGB2018",
                quantity: 1,
                properties: {
                    retentionInDays: 30
                }
            });
        }

        // Application Insights
        configs.push({
            resourceType: "application-insights",
            resourceName: `${context.clientType}-insights-${region}`,
            region,
            sku: "Standard",
            quantity: 1,
            properties: {}
        });

        // Storage Account
        configs.push({
            resourceType: "storage-account",
            resourceName: `${context.clientType}st${region}`,
            region,
            sku: "Standard_LRS",
            quantity: 1,
            properties: {}
        });

        return configs;
    }

    /**
     * Calculate costs for resource configurations using Azure pricing
     */
    private async calculateResourceCosts(configs: AzureResourceConfig[]): Promise<ResourceCost[]> {
        const costs: ResourceCost[] = [];

        for (const config of configs) {
            const unitCost = await this.getResourceUnitCost(config);
            const totalCost = unitCost * config.quantity;

            costs.push({
                resourceType: config.resourceType,
                resourceName: config.resourceName,
                region: config.region,
                sku: config.sku,
                quantity: config.quantity,
                unitCost,
                totalCost,
                currency: this.options.currency
            });
        }

        return costs;
    }

    /**
     * Get unit cost for a resource configuration
     */
    private async getResourceUnitCost(config: AzureResourceConfig): Promise<number> {
        // Try to get live pricing if enabled
        if (this.options.useLivePricing) {
            try {
                const liveCost = await this.getLivePricing(config);
                if (liveCost !== null) {
                    return liveCost;
                }
            } catch (error) {
                console.warn(`Failed to get live pricing for ${config.resourceType}/${config.sku}: ${error}`);
            }
        }

        // Fall back to estimated costs
        return this.getEstimatedCost(config);
    }

    /**
     * Get live pricing from Azure Pricing API
     */
    private async getLivePricing(config: AzureResourceConfig): Promise<number | null> {
        // Import the pricing client dynamically to avoid circular dependencies
        const { getPricingForResource } = await import('./azurePricingClient');

        const pricing = await getPricingForResource(
            config.resourceType,
            config.sku,
            config.region,
            {
                region: this.options.pricingRegion,
                currency: this.options.currency,
                timeout: 10000
            }
        );

        return pricing ? pricing.pricePerHour : null;
    }

    /**
     * Get estimated hourly cost for resource (fallback when live pricing unavailable)
     */
    private getEstimatedCost(config: AzureResourceConfig): number {
        const baseCosts: Record<AzureResourceType, number> = {
            "aks-cluster": 0.10,  // Control plane per hour
            "aks-node-pool": this.getVmCost(config.sku),
            "container-app": this.getContainerAppCost(config),
            "virtual-machine": this.getVmCost(config.sku),
            "virtual-machine-scale-set": this.getVmCost(config.sku),
            "log-analytics": 0.05,
            "application-insights": 0.01,
            "storage-account": 0.02,
            "virtual-network": 0.01,
            "load-balancer": 0.025,
            "public-ip": 0.005
        };

        return baseCosts[config.resourceType] || 0.01;
    }

    /**
     * Get VM cost based on SKU
     */
    private getVmCost(sku: string): number {
        const vmCosts: Record<string, number> = {
            "Standard_D2s_v5": 0.096,   // 2 vCPU, 8GB RAM
            "Standard_D4s_v5": 0.192,   // 4 vCPU, 16GB RAM
            "Standard_D8s_v5": 0.384,   // 8 vCPU, 32GB RAM
            "Standard_D16s_v5": 0.768,  // 16 vCPU, 64GB RAM
            "Standard_B2s": 0.041,      // 2 vCPU, 4GB RAM (burstable)
            "Standard_B4ms": 0.166      // 4 vCPU, 16GB RAM (burstable)
        };

        return vmCosts[sku] || 0.10; // Default fallback
    }

    /**
     * Get Container Apps cost based on resource allocation
     */
    private getContainerAppCost(config: AzureResourceConfig): number {
        const cpu = config.properties?.cpu || 1;
        const memory = parseFloat(config.properties?.memory?.replace(/[^\d.]/g, '') || '2');

        // Azure Container Apps pricing: $0.000024/vCPU/second + $0.000009/GB/second
        const cpuCostPerHour = cpu * 0.000024 * 3600;  // vCPU cost per hour
        const memoryCostPerHour = memory * 0.000009 * 3600;  // Memory cost per hour

        return cpuCostPerHour + memoryCostPerHour;
    }

    /**
     * Calculate burn rates for different time periods
     */
    private calculateBurnRates(resourceCosts: ResourceCost[]): PeriodCost[] {
        const hourly = resourceCosts.reduce((sum, r) => sum + r.totalCost, 0);

        const periodMultipliers: Record<CostPeriod, number> = {
            "minute": 1 / 60,
            "hour": 1,
            "day": 24,
            "3-day": 24 * 3,
            "week": 24 * 7,
            "month": 24 * 30,
            "quarter": 24 * 90,
            "annual": 24 * 365
        };

        return this.options.periods.map(period => ({
            period,
            cost: hourly * periodMultipliers[period],
            currency: this.options.currency
        }));
    }

    /**
     * Generate deployment strategy comparison
     */
    private async generateStrategyComparison(
        context: NetworkContext
    ): Promise<DeploymentStrategyComparison> {
        const strategies = this.options.comparisonStrategies || [
            "single-region-aks",
            "multi-region-aks",
            "single-region-vm",
            "multi-region-vm",
            "hybrid-aks-aca"
        ];

        return this.compareDeploymentStrategies(context, strategies);
    }

    /**
     * Create alternative network context for strategy comparison
     */
    private createAlternativeContext(base: NetworkContext, strategy: string): NetworkContext {
        const alt = { ...base };

        switch (strategy) {
            case "single-region-aks":
                alt.azureRegions = [alt.azureRegions?.[0] || "eastus"];
                alt.azureDeploymentDefault = "aks";
                break;
            case "multi-region-aks":
                alt.azureRegions = alt.azureRegions || ["eastus", "westus2", "centralus"];
                alt.azureDeploymentDefault = "aks";
                break;
            case "single-region-vm":
                alt.azureRegions = [alt.azureRegions?.[0] || "eastus"];
                alt.azureDeploymentDefault = "vm";
                break;
            case "multi-region-vm":
                alt.azureRegions = alt.azureRegions || ["eastus", "westus2", "centralus"];
                alt.azureDeploymentDefault = "vm";
                break;
            case "hybrid-aks-aca":
                alt.azureDeploymentDefault = "aks";
                alt.azureNodePlacement = "validators:aks:eastus;rpc:aca:eastus";
                break;
        }

        return alt;
    }

    /**
     * Generate cost optimization recommendations
     */
    private generateRecommendations(strategies: {
        name: string;
        description: string;
        monthlyCost: number;
        annualCost: number;
    }[]): { strategy: string; reason: string; savings: number; tradeoffs: string[] }[] {
        const recommendations = [];
        const baseCost = strategies[0].monthlyCost;
        const cheapest = strategies.reduce((min, s) => s.monthlyCost < min.monthlyCost ? s : min);

        if (cheapest.name !== "current") {
            const savings = baseCost - cheapest.monthlyCost;
            const savingsPercent = ((savings / baseCost) * 100).toFixed(1);

            recommendations.push({
                strategy: cheapest.name,
                reason: `Lowest cost option - saves $${savings.toFixed(2)}/month (${savingsPercent}%)`,
                savings,
                tradeoffs: this.getStrategyTradeoffs(cheapest.name)
            });
        }

        // Add other strategic recommendations
        const multiRegion = strategies.find(s => s.name.includes("multi-region"));
        if (multiRegion && multiRegion.name !== "current") {
            const extraCost = multiRegion.monthlyCost - baseCost;
            recommendations.push({
                strategy: multiRegion.name,
                reason: `High availability across regions (+$${extraCost.toFixed(2)}/month)`,
                savings: -extraCost,
                tradeoffs: ["Higher cost", "Better disaster recovery", "Lower latency globally"]
            });
        }

        return recommendations;
    }

    /**
     * Get strategy-specific tradeoffs
     */
    private getStrategyTradeoffs(strategy: string): string[] {
        const tradeoffs: Record<string, string[]> = {
            "single-region-vm": ["Lower cost", "Manual scaling", "Single point of failure"],
            "single-region-aks": ["Moderate cost", "Auto-scaling", "Kubernetes complexity"],
            "multi-region-aks": ["Higher cost", "High availability", "Complex networking"],
            "multi-region-vm": ["Moderate cost", "Geographic distribution", "Manual coordination"],
            "hybrid-aks-aca": ["Flexible scaling", "Mixed complexity", "Service coordination"]
        };

        return tradeoffs[strategy] || ["Strategy-specific considerations apply"];
    }

    /**
     * Get deployment strategy name for display
     */
    private getDeploymentStrategyName(context: NetworkContext): string {
        const regionCount = context.azureRegions?.length || 1;
        const deploymentType = context.azureDeploymentDefault || "aks";
        const regionText = regionCount === 1 ? "Single Region" : `${regionCount} Regions`;

        return `${regionText} ${deploymentType.toUpperCase()}`;
    }
}

/**
 * Azure resource configuration for cost calculation
 */
interface AzureResourceConfig {
    resourceType: AzureResourceType;
    resourceName: string;
    region: string;
    sku: string;
    quantity: number;
    properties?: Record<string, any>;
}