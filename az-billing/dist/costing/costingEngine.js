"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostingEngine = exports.DEFAULT_COSTING_OPTIONS = void 0;
exports.DEFAULT_COSTING_OPTIONS = { useLivePricing: true, pricingRegion: "eastus", currency: "USD", periods: ["hour", "day", "week", "month", "quarter", "annual"], enableComparison: true, outputFormat: "json", includeResourceBreakdown: true };
class CostingEngine {
    constructor(options = {}) { this.options = { ...exports.DEFAULT_COSTING_OPTIONS, ...options }; }
    async analyzeCosts(context) {
        if (!context.regions || context.regions.length === 0)
            throw new Error('Azure regions required for cost analysis');
        const resources = await this.extractResourceConfigurations(context);
        const resourceCosts = await this.calculateResourceCosts(resources);
        const burnRates = this.calculateBurnRates(resourceCosts);
        let comparison;
        if (this.options.enableComparison)
            comparison = await this.generateStrategyComparison(context);
        const totalHourly = resourceCosts.reduce((sum, r) => sum + r.totalCost, 0);
        return { networkName: `azure-network`, analysisDate: new Date(), region: this.options.pricingRegion, deploymentStrategy: this.getDeploymentStrategyName(context), burnRates, resourceBreakdown: resourceCosts, totalHourlyCost: totalHourly, totalDailyCost: totalHourly * 24, totalMonthlyCost: totalHourly * 24 * 30, totalAnnualCost: totalHourly * 24 * 365, currency: this.options.currency, comparison };
    }
    async extractResourceConfigurations(context) {
        const configs = [];
        const deploymentType = context.deploymentDefault || 'aks';
        // Infer counts from placements heuristically
        const validators = (context.placements.validators?.replicas) || 4;
        const rpcNodes = (context.placements.rpcNodes?.instanceCount) || 1;
        for (const region of context.regions) {
            const deployment = { validators, rpcNodes, deploymentType };
            switch (deploymentType) {
                case 'aks':
                    configs.push(...this.extractAksResources(region, deployment, context));
                    break;
                case 'aca':
                    configs.push(...this.extractAcaResources(region, deployment, context));
                    break;
                case 'vm':
                    configs.push(...this.extractVmResources(region, deployment, context));
                    break;
                case 'vmss':
                    configs.push(...this.extractVmssResources(region, deployment, context));
                    break;
            }
            configs.push(...this.extractSharedResources(region, deployment, context));
        }
        return configs;
    }
    extractAksResources(region, deployment, context) {
        const configs = [];
        configs.push({ resourceType: 'aks-cluster', resourceName: `main-aks-${region}`, region, sku: 'Standard', quantity: 1, properties: { version: '1.28', networkPlugin: 'kubenet' } });
        if (deployment.validators > 0)
            configs.push({ resourceType: 'aks-node-pool', resourceName: `validators-${region}`, region, sku: context.sizeMap?.validators || 'Standard_D4s_v5', quantity: deployment.validators, properties: { diskSize: 128, osDiskType: 'Premium_LRS' } });
        if (deployment.rpcNodes > 0)
            configs.push({ resourceType: 'aks-node-pool', resourceName: `rpc-${region}`, region, sku: context.sizeMap?.rpc || 'Standard_D2s_v5', quantity: deployment.rpcNodes, properties: { diskSize: 64, osDiskType: 'Premium_LRS' } });
        return configs;
    }
    extractAcaResources(region, deployment, _context) {
        const configs = [];
        configs.push({ resourceType: 'container-app', resourceName: `env-${region}`, region, sku: 'Consumption', quantity: 1, properties: {} });
        if (deployment.validators > 0)
            configs.push({ resourceType: 'container-app', resourceName: `validators-${region}`, region, sku: 'Consumption', quantity: deployment.validators, properties: { cpu: 2, memory: '4Gi', storage: '32Gi' } });
        if (deployment.rpcNodes > 0)
            configs.push({ resourceType: 'container-app', resourceName: `rpc-${region}`, region, sku: 'Consumption', quantity: deployment.rpcNodes, properties: { cpu: 1, memory: '2Gi', storage: '16Gi' } });
        return configs;
    }
    extractVmResources(region, deployment, context) {
        const totalNodes = deployment.validators + deployment.rpcNodes;
        return [{ resourceType: 'virtual-machine', resourceName: `vms-${region}`, region, sku: context.sizeMap?.default || 'Standard_D4s_v5', quantity: totalNodes, properties: { osDiskSize: 128, osDiskType: 'Premium_LRS', dataDiskSize: 256, dataDiskType: 'Premium_LRS' } }];
    }
    extractVmssResources(region, deployment, context) {
        const totalNodes = deployment.validators + deployment.rpcNodes;
        return [{ resourceType: 'virtual-machine-scale-set', resourceName: `vmss-${region}`, region, sku: context.sizeMap?.default || 'Standard_D4s_v5', quantity: totalNodes, properties: { osDiskSize: 128, osDiskType: 'Premium_LRS', dataDiskSize: 256, dataDiskType: 'Premium_LRS' } }];
    }
    extractSharedResources(region, deployment, _context) {
        const configs = [];
        configs.push({ resourceType: 'virtual-network', resourceName: `vnet-${region}`, region, sku: 'Standard', quantity: 1, properties: {} });
        if (deployment.rpcNodes > 0) {
            configs.push({ resourceType: 'load-balancer', resourceName: `lb-${region}`, region, sku: 'Standard', quantity: 1, properties: {} });
            configs.push({ resourceType: 'public-ip', resourceName: `ip-${region}`, region, sku: 'Standard', quantity: 1, properties: {} });
        }
        // Simplified monitoring assumption (always include insights + storage)
        configs.push({ resourceType: 'application-insights', resourceName: `insights-${region}`, region, sku: 'Standard', quantity: 1, properties: {} });
        configs.push({ resourceType: 'storage-account', resourceName: `st${region}`, region, sku: 'Standard_LRS', quantity: 1, properties: {} });
        return configs;
    }
    async calculateResourceCosts(configs) {
        const costs = [];
        for (const c of configs) {
            const unit = await this.getResourceUnitCost(c);
            // Apply optional discount factor per resource type (e.g., reserved instances, savings plans)
            const discountFactor = this.options.discountFactors?.[c.resourceType];
            const effectiveUnit = discountFactor && discountFactor > 0 && discountFactor <= 1 ? unit * discountFactor : unit;
            costs.push({ resourceType: c.resourceType, resourceName: c.resourceName, region: c.region, sku: c.sku, quantity: c.quantity, unitCost: effectiveUnit, totalCost: effectiveUnit * c.quantity, currency: this.options.currency });
        }
        return costs;
    }
    async getResourceUnitCost(config) {
        if (this.options.useLivePricing) {
            try {
                const live = await this.getLivePricing(config);
                if (live !== null)
                    return live;
            }
            catch (e) { /* swallow */ }
        }
        return this.getEstimatedCost(config);
    }
    async getLivePricing(config) {
        const { getPricingForResource } = await Promise.resolve().then(() => __importStar(require('../pricing/azurePricingClient')));
        const pricing = await getPricingForResource(config.resourceType, config.sku, config.region, { region: this.options.pricingRegion, currency: this.options.currency });
        return pricing ? pricing.pricePerHour : null;
    }
    getEstimatedCost(config) {
        const vmCost = (sku) => { const map = { 'Standard_D2s_v5': 0.096, 'Standard_D4s_v5': 0.192, 'Standard_D8s_v5': 0.384, 'Standard_D16s_v5': 0.768, 'Standard_B2s': 0.041, 'Standard_B4ms': 0.166 }; return map[sku] || 0.10; };
        const containerCost = (c) => { const cpu = c.properties?.cpu || 1; const memory = parseFloat(c.properties?.memory?.replace(/[^\d.]/g, '') || '2'); return cpu * 0.000024 * 3600 + memory * 0.000009 * 3600; };
        const base = {
            'aks-cluster': 0.10,
            'aks-node-pool': vmCost(config.sku),
            'container-app': containerCost(config),
            'virtual-machine': vmCost(config.sku),
            'virtual-machine-scale-set': vmCost(config.sku),
            'log-analytics': 0.05,
            'application-insights': 0.01,
            'storage-account': 0.02,
            'virtual-network': 0.01,
            'load-balancer': 0.025,
            'public-ip': 0.005
        };
        return base[config.resourceType] || 0.01;
    }
    calculateBurnRates(resourceCosts) {
        const hourly = resourceCosts.reduce((s, r) => s + r.totalCost, 0);
        const mult = { 'minute': 1 / 60, 'hour': 1, 'day': 24, '3-day': 24 * 3, 'week': 24 * 7, 'month': 24 * 30, 'quarter': 24 * 90, 'annual': 24 * 365 };
        return this.options.periods.map(p => ({ period: p, cost: hourly * mult[p], currency: this.options.currency }));
    }
    async generateStrategyComparison(ctx) {
        const strategies = this.options.comparisonStrategies || ['single-region-aks', 'multi-region-aks', 'single-region-vm', 'multi-region-vm', 'hybrid-aks-aca'];
        return this.compareDeploymentStrategies(ctx, strategies);
    }
    async compareDeploymentStrategies(base, strategies) {
        const baseResources = await this.extractResourceConfigurations(base);
        const baseCosts = await this.calculateResourceCosts(baseResources);
        const baseMonthly = baseCosts.reduce((s, r) => s + r.totalCost, 0) * 24 * 30;
        const analyses = [{ name: 'current', description: this.getDeploymentStrategyName(base), monthlyCost: baseMonthly, annualCost: baseMonthly * 12, resources: baseCosts }];
        for (const strat of strategies) {
            const alt = this.createAlternativeContext(base, strat);
            const altResources = await this.extractResourceConfigurations(alt);
            const altCosts = await this.calculateResourceCosts(altResources);
            const altMonthly = altCosts.reduce((s, r) => s + r.totalCost, 0) * 24 * 30;
            analyses.push({ name: strat, description: this.getDeploymentStrategyName(alt), monthlyCost: altMonthly, annualCost: altMonthly * 12, resources: altCosts });
        }
        const recommendations = this.generateRecommendations(analyses);
        return { strategies: analyses, recommendations };
    }
    createAlternativeContext(base, strategy) { const alt = { ...base }; switch (strategy) {
        case 'single-region-aks':
            alt.regions = [alt.regions[0]];
            alt.deploymentDefault = 'aks';
            break;
        case 'multi-region-aks':
            alt.regions = alt.regions.length > 1 ? alt.regions : ['eastus', 'westus2', 'centralus'];
            alt.deploymentDefault = 'aks';
            break;
        case 'single-region-vm':
            alt.regions = [alt.regions[0]];
            alt.deploymentDefault = 'vm';
            break;
        case 'multi-region-vm':
            alt.regions = alt.regions.length > 1 ? alt.regions : ['eastus', 'westus2', 'centralus'];
            alt.deploymentDefault = 'vm';
            break;
        case 'hybrid-aks-aca':
            alt.deploymentDefault = 'aks';
            break;
    } return alt; }
    generateRecommendations(strategies) {
        const recs = [];
        const baseCost = strategies[0].monthlyCost;
        const cheapest = strategies.reduce((m, s) => s.monthlyCost < m.monthlyCost ? s : m);
        if (cheapest.name !== 'current') {
            const savings = baseCost - cheapest.monthlyCost;
            const pct = ((savings / baseCost) * 100).toFixed(1);
            recs.push({ strategy: cheapest.name, reason: `Lowest cost option - saves $${savings.toFixed(2)}/month (${pct}%)`, savings, tradeoffs: this.getStrategyTradeoffs(cheapest.name) });
        }
        const multiRegion = strategies.find(s => s.name.includes('multi-region'));
        if (multiRegion && multiRegion.name !== 'current') {
            const extra = multiRegion.monthlyCost - baseCost;
            recs.push({ strategy: multiRegion.name, reason: `High availability across regions (+$${extra.toFixed(2)}/month)`, savings: -extra, tradeoffs: ['Higher cost', 'Better disaster recovery', 'Lower latency globally'] });
        }
        return recs;
    }
    getStrategyTradeoffs(strategy) { const map = { 'single-region-vm': ['Lower cost', 'Manual scaling', 'Single point of failure'], 'single-region-aks': ['Moderate cost', 'Auto-scaling', 'Kubernetes complexity'], 'multi-region-aks': ['Higher cost', 'High availability', 'Complex networking'], 'multi-region-vm': ['Moderate cost', 'Geographic distribution', 'Manual coordination'], 'hybrid-aks-aca': ['Flexible scaling', 'Mixed complexity', 'Service coordination'] }; return map[strategy] || ['Strategy-specific considerations apply']; }
    getDeploymentStrategyName(ctx) { const regionText = ctx.regions.length === 1 ? 'Single Region' : `${ctx.regions.length} Regions`; const deploy = (ctx.deploymentDefault || 'aks').toUpperCase(); return `${regionText} ${deploy}`; }
}
exports.CostingEngine = CostingEngine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29zdGluZ0VuZ2luZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3N0aW5nL2Nvc3RpbmdFbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBYWEsUUFBQSx1QkFBdUIsR0FBbUIsRUFBRSxjQUFjLEVBQUMsSUFBSSxFQUFFLGFBQWEsRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUMsQ0FBQyxNQUFNLEVBQUMsS0FBSyxFQUFDLE1BQU0sRUFBQyxPQUFPLEVBQUMsU0FBUyxFQUFDLFFBQVEsQ0FBQyxFQUFFLGdCQUFnQixFQUFDLElBQUksRUFBRSxZQUFZLEVBQUMsTUFBTSxFQUFFLHdCQUF3QixFQUFDLElBQUksRUFBRSxDQUFDO0FBSTVQLE1BQWEsYUFBYTtJQUV4QixZQUFZLFVBQW1DLEVBQUUsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsR0FBRywrQkFBdUIsRUFBRSxHQUFHLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVqSCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQTBCO1FBQzNDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUM7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7UUFDbEgsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsNkJBQTZCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEUsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkUsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pELElBQUksVUFBb0QsQ0FBQztRQUN6RCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCO1lBQUUsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9GLE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQSxHQUFHLEdBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUNyRSxPQUFPLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUMsSUFBSSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLEVBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBQyxhQUFhLEVBQUUsZUFBZSxFQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsV0FBVyxHQUFDLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEdBQUMsRUFBRSxHQUFDLEVBQUUsRUFBRSxlQUFlLEVBQUUsV0FBVyxHQUFDLEVBQUUsR0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDO0lBQ2pZLENBQUM7SUFFTyxLQUFLLENBQUMsNkJBQTZCLENBQUMsT0FBMEI7UUFDcEUsTUFBTSxPQUFPLEdBQTBCLEVBQUUsQ0FBQztRQUMxQyxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELDZDQUE2QztRQUM3QyxNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsRSxNQUFNLFFBQVEsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuRSxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQyxNQUFNLFVBQVUsR0FBRyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLENBQUM7WUFDNUQsUUFBUSxjQUFjLEVBQUUsQ0FBQztnQkFDdkIsS0FBSyxLQUFLO29CQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUFDLE1BQU07Z0JBQzFGLEtBQUssS0FBSztvQkFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUMxRixLQUFLLElBQUk7b0JBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDeEYsS0FBSyxNQUFNO29CQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUFDLE1BQU07WUFDOUYsQ0FBQztZQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU8sbUJBQW1CLENBQUMsTUFBYSxFQUFFLFVBQWMsRUFBRSxPQUF5QjtRQUNsRixNQUFNLE9BQU8sR0FBMEIsRUFBRSxDQUFDO1FBQzFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFZLEVBQUMsYUFBYSxFQUFFLFlBQVksRUFBQyxZQUFZLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUMsVUFBVSxFQUFFLFFBQVEsRUFBQyxDQUFDLEVBQUUsVUFBVSxFQUFDLEVBQUUsT0FBTyxFQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVLLElBQUksVUFBVSxDQUFDLFVBQVUsR0FBQyxDQUFDO1lBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFlBQVksRUFBQyxlQUFlLEVBQUUsWUFBWSxFQUFDLGNBQWMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsSUFBSSxpQkFBaUIsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUMsRUFBRSxRQUFRLEVBQUMsR0FBRyxFQUFFLFVBQVUsRUFBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeFEsSUFBSSxVQUFVLENBQUMsUUFBUSxHQUFDLENBQUM7WUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsWUFBWSxFQUFDLGVBQWUsRUFBRSxZQUFZLEVBQUMsT0FBTyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBQyxFQUFFLFFBQVEsRUFBQyxFQUFFLEVBQUUsVUFBVSxFQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNyUCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBQ08sbUJBQW1CLENBQUMsTUFBYSxFQUFFLFVBQWMsRUFBRSxRQUEwQjtRQUNuRixNQUFNLE9BQU8sR0FBMEIsRUFBRSxDQUFDO1FBQzFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFZLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBQyxPQUFPLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUMsYUFBYSxFQUFFLFFBQVEsRUFBQyxDQUFDLEVBQUUsVUFBVSxFQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkksSUFBSSxVQUFVLENBQUMsVUFBVSxHQUFDLENBQUM7WUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsWUFBWSxFQUFDLGVBQWUsRUFBRSxZQUFZLEVBQUMsY0FBYyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUMsRUFBRSxHQUFHLEVBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqTyxJQUFJLFVBQVUsQ0FBQyxRQUFRLEdBQUMsQ0FBQztZQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFZLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBQyxPQUFPLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBQyxFQUFFLEdBQUcsRUFBQyxDQUFDLEVBQUUsTUFBTSxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ROLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFDTyxrQkFBa0IsQ0FBQyxNQUFhLEVBQUUsVUFBYyxFQUFFLE9BQXlCO1FBQ2pGLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQztRQUMvRCxPQUFPLENBQUMsRUFBRSxZQUFZLEVBQUMsaUJBQWlCLEVBQUUsWUFBWSxFQUFDLE9BQU8sTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sSUFBSSxpQkFBaUIsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxFQUFFLFVBQVUsRUFBQyxHQUFHLEVBQUUsVUFBVSxFQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUMsR0FBRyxFQUFFLFlBQVksRUFBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDclEsQ0FBQztJQUNPLG9CQUFvQixDQUFDLE1BQWEsRUFBRSxVQUFjLEVBQUUsT0FBeUI7UUFDbkYsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDO1FBQy9ELE9BQU8sQ0FBQyxFQUFFLFlBQVksRUFBQywyQkFBMkIsRUFBRSxZQUFZLEVBQUMsUUFBUSxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxJQUFJLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFDLEVBQUUsVUFBVSxFQUFDLEdBQUcsRUFBRSxVQUFVLEVBQUMsYUFBYSxFQUFFLFlBQVksRUFBQyxHQUFHLEVBQUUsWUFBWSxFQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoUixDQUFDO0lBQ08sc0JBQXNCLENBQUMsTUFBYSxFQUFFLFVBQWMsRUFBRSxRQUEwQjtRQUN0RixNQUFNLE9BQU8sR0FBMEIsRUFBRSxDQUFDO1FBQzFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFZLEVBQUMsaUJBQWlCLEVBQUUsWUFBWSxFQUFDLFFBQVEsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBQyxVQUFVLEVBQUUsUUFBUSxFQUFDLENBQUMsRUFBRSxVQUFVLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuSSxJQUFJLFVBQVUsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxFQUFFLENBQUM7WUFDMUIsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFlBQVksRUFBQyxlQUFlLEVBQUUsWUFBWSxFQUFDLE1BQU0sTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBQyxVQUFVLEVBQUUsUUFBUSxFQUFDLENBQUMsRUFBRSxVQUFVLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvSCxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsWUFBWSxFQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUMsTUFBTSxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzdILENBQUM7UUFDRCx1RUFBdUU7UUFDdkUsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFlBQVksRUFBQyxzQkFBc0IsRUFBRSxZQUFZLEVBQUMsWUFBWSxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVJLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFZLEVBQUMsaUJBQWlCLEVBQUUsWUFBWSxFQUFDLEtBQUssTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBQyxjQUFjLEVBQUUsUUFBUSxFQUFDLENBQUMsRUFBRSxVQUFVLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNwSSxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU8sS0FBSyxDQUFDLHNCQUFzQixDQUFDLE9BQThCO1FBQ2pFLE1BQU0sS0FBSyxHQUFtQixFQUFFLENBQUM7UUFDakMsS0FBSyxNQUFNLENBQUMsSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUN4QixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQyw2RkFBNkY7WUFDN0YsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDdEUsTUFBTSxhQUFhLEdBQUcsY0FBYyxJQUFJLGNBQWMsR0FBRyxDQUFDLElBQUksY0FBYyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ2pILEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFZLEVBQUMsQ0FBQyxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUMsQ0FBQyxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxhQUFhLEdBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3pOLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFDTyxLQUFLLENBQUMsbUJBQW1CLENBQUMsTUFBMkI7UUFDM0QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQztnQkFDSCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQUMsSUFBSSxJQUFJLEtBQUcsSUFBSTtvQkFBRSxPQUFPLElBQUksQ0FBQztZQUMvRSxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ08sS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUEyQjtRQUN0RCxNQUFNLEVBQUUscUJBQXFCLEVBQUUsR0FBRyx3REFBYSwrQkFBK0IsR0FBQyxDQUFDO1FBQ2hGLE1BQU0sT0FBTyxHQUFHLE1BQU0scUJBQXFCLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNuSyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQy9DLENBQUM7SUFDTyxnQkFBZ0IsQ0FBQyxNQUEyQjtRQUNsRCxNQUFNLE1BQU0sR0FBRyxDQUFDLEdBQVUsRUFBQyxFQUFFLEdBQUcsTUFBTSxHQUFHLEdBQXVCLEVBQUUsaUJBQWlCLEVBQUMsS0FBSyxFQUFDLGlCQUFpQixFQUFDLEtBQUssRUFBQyxpQkFBaUIsRUFBQyxLQUFLLEVBQUMsa0JBQWtCLEVBQUMsS0FBSyxFQUFDLGNBQWMsRUFBQyxLQUFLLEVBQUMsZUFBZSxFQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFPLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBcUIsRUFBQyxFQUFFLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUMsRUFBRSxDQUFDLElBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsR0FBQyxRQUFRLEdBQUMsSUFBSSxHQUFHLE1BQU0sR0FBQyxRQUFRLEdBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ROLE1BQU0sSUFBSSxHQUFvQztZQUM1QyxhQUFhLEVBQUMsSUFBSTtZQUNsQixlQUFlLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDbkMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUM7WUFDdEMsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDckMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDL0MsZUFBZSxFQUFDLElBQUk7WUFDcEIsc0JBQXNCLEVBQUMsSUFBSTtZQUMzQixpQkFBaUIsRUFBQyxJQUFJO1lBQ3RCLGlCQUFpQixFQUFDLElBQUk7WUFDdEIsZUFBZSxFQUFDLEtBQUs7WUFDckIsV0FBVyxFQUFDLEtBQUs7U0FDbEIsQ0FBQztRQUNGLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDM0MsQ0FBQztJQUNPLGtCQUFrQixDQUFDLGFBQTZCO1FBQ3RELE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUM1RCxNQUFNLElBQUksR0FBMkIsRUFBRSxRQUFRLEVBQUMsQ0FBQyxHQUFDLEVBQUUsRUFBQyxNQUFNLEVBQUMsQ0FBQyxFQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsT0FBTyxFQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUMsTUFBTSxFQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUMsT0FBTyxFQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsU0FBUyxFQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsUUFBUSxFQUFDLEVBQUUsR0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNoSixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUEsRUFBRSxDQUFBLENBQUMsRUFBRSxNQUFNLEVBQUMsQ0FBQyxFQUFFLElBQUksRUFBQyxNQUFNLEdBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxRyxDQUFDO0lBQ08sS0FBSyxDQUFDLDBCQUEwQixDQUFDLEdBQXNCO1FBQzdELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLElBQUksQ0FBQyxtQkFBbUIsRUFBQyxrQkFBa0IsRUFBQyxrQkFBa0IsRUFBQyxpQkFBaUIsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3ZKLE9BQU8sSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBQ0QsS0FBSyxDQUFDLDJCQUEyQixDQUFDLElBQXVCLEVBQUUsVUFBbUI7UUFDNUUsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckUsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbkUsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFBLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxFQUFFLENBQUM7UUFDbkUsTUFBTSxRQUFRLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBQyxTQUFTLEVBQUUsV0FBVyxFQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxXQUFXLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBQyxXQUFXLEdBQUMsRUFBRSxFQUFFLFNBQVMsRUFBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ2pLLEtBQUssTUFBTSxLQUFLLElBQUksVUFBVSxFQUFFLENBQUM7WUFDL0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RCxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuRSxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNqRSxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUEsQ0FBQyxHQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxHQUFDLEVBQUUsQ0FBQztZQUNqRSxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFDLEtBQUssRUFBRSxXQUFXLEVBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxFQUFFLFdBQVcsRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFDLFVBQVUsR0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDdkosQ0FBQztRQUNELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvRCxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsQ0FBQztJQUNuRCxDQUFDO0lBQ08sd0JBQXdCLENBQUMsSUFBdUIsRUFBRSxRQUFlLElBQXVCLE1BQU0sR0FBRyxHQUFHLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFFBQU8sUUFBUSxFQUFDLENBQUM7UUFBQyxLQUFLLG1CQUFtQjtZQUFFLEdBQUcsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxHQUFHLENBQUMsaUJBQWlCLEdBQUMsS0FBSyxDQUFDO1lBQUMsTUFBTTtRQUFDLEtBQUssa0JBQWtCO1lBQUUsR0FBRyxDQUFDLE9BQU8sR0FBRSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUEsQ0FBQyxDQUFBLEdBQUcsQ0FBQyxPQUFPLENBQUEsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFDLFNBQVMsRUFBQyxXQUFXLENBQUMsQ0FBQztZQUFDLEdBQUcsQ0FBQyxpQkFBaUIsR0FBQyxLQUFLLENBQUM7WUFBQyxNQUFNO1FBQUMsS0FBSyxrQkFBa0I7WUFBRSxHQUFHLENBQUMsT0FBTyxHQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsR0FBRyxDQUFDLGlCQUFpQixHQUFDLElBQUksQ0FBQztZQUFDLE1BQU07UUFBQyxLQUFLLGlCQUFpQjtZQUFFLEdBQUcsQ0FBQyxPQUFPLEdBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFBLENBQUMsQ0FBQSxHQUFHLENBQUMsT0FBTyxDQUFBLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFBQyxHQUFHLENBQUMsaUJBQWlCLEdBQUMsSUFBSSxDQUFDO1lBQUMsTUFBTTtRQUFDLEtBQUssZ0JBQWdCO1lBQUUsR0FBRyxDQUFDLGlCQUFpQixHQUFDLEtBQUssQ0FBQztZQUFDLE1BQU07SUFBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzdwQix1QkFBdUIsQ0FBQyxVQUFrSDtRQUNoSixNQUFNLElBQUksR0FBNkUsRUFBRSxDQUFDO1FBQzFGLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDM0MsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRixJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFLENBQUM7WUFBQyxNQUFNLE9BQU8sR0FBRyxRQUFRLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQztZQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUMsUUFBUSxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQywrQkFBK0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxHQUFHLElBQUksRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUN0VCxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQSxFQUFFLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUN4RSxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQUMsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUM7WUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFDLHVDQUF1QyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFDLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBQyxDQUFDLGFBQWEsRUFBQywwQkFBMEIsRUFBQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUFDLENBQUM7UUFDMVQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ08sb0JBQW9CLENBQUMsUUFBZSxJQUFjLE1BQU0sR0FBRyxHQUF5QixFQUFFLGtCQUFrQixFQUFDLENBQUMsWUFBWSxFQUFDLGdCQUFnQixFQUFDLHlCQUF5QixDQUFDLEVBQUUsbUJBQW1CLEVBQUMsQ0FBQyxlQUFlLEVBQUMsY0FBYyxFQUFDLHVCQUF1QixDQUFDLEVBQUUsa0JBQWtCLEVBQUMsQ0FBQyxhQUFhLEVBQUMsbUJBQW1CLEVBQUMsb0JBQW9CLENBQUMsRUFBRSxpQkFBaUIsRUFBQyxDQUFDLGVBQWUsRUFBQyx5QkFBeUIsRUFBQyxxQkFBcUIsQ0FBQyxFQUFFLGdCQUFnQixFQUFDLENBQUMsa0JBQWtCLEVBQUMsa0JBQWtCLEVBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1aUIseUJBQXlCLENBQUMsR0FBc0IsSUFBWSxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sVUFBVSxDQUFDLENBQUMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUcsVUFBVSxJQUFJLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztDQUN4UTtBQW5KRCxzQ0FtSkMifQ==