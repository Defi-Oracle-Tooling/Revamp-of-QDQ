import type { DeploymentContext } from '../types/context';

// Ported types (trimmed to required subset for DeploymentContext usage)
export type CostPeriod = "minute" | "hour" | "day" | "3-day" | "week" | "month" | "quarter" | "annual";
export type AzureResourceType =
  | "aks-cluster" | "aks-node-pool" | "container-app" | "virtual-machine" | "virtual-machine-scale-set" |
  "log-analytics" | "application-insights" | "storage-account" | "virtual-network" | "load-balancer" | "public-ip";

export interface PeriodCost { period: CostPeriod; cost: number; currency: string; }
export interface ResourceCost { resourceType: AzureResourceType; resourceName: string; region: string; sku: string; quantity: number; unitCost: number; totalCost: number; currency: string; }
export interface DeploymentStrategyComparison { strategies: { name:string; description:string; monthlyCost:number; annualCost:number; resources: ResourceCost[]; }[]; recommendations: { strategy:string; reason:string; savings:number; tradeoffs:string[]; }[]; }
export interface CostAnalysisReport { networkName:string; analysisDate:Date; region:string; deploymentStrategy:string; burnRates:PeriodCost[]; resourceBreakdown:ResourceCost[]; totalHourlyCost:number; totalDailyCost:number; totalMonthlyCost:number; totalAnnualCost:number; currency:string; comparison?:DeploymentStrategyComparison; }
export interface CostingOptions { useLivePricing:boolean; pricingRegion:string; currency:string; periods:CostPeriod[]; enableComparison:boolean; comparisonStrategies?:string[]; outputFormat:"json"|"csv"|"html"; includeResourceBreakdown:boolean; discountFactors?:Record<AzureResourceType,number>; }
export const DEFAULT_COSTING_OPTIONS: CostingOptions = { useLivePricing:true, pricingRegion:"eastus", currency:"USD", periods:["hour","day","week","month","quarter","annual"], enableComparison:true, outputFormat:"json", includeResourceBreakdown:true };

interface AzureResourceConfig { resourceType: AzureResourceType; resourceName:string; region:string; sku:string; quantity:number; properties?:Record<string,any>; }

export class CostingEngine {
  private options: CostingOptions;
  constructor(options: Partial<CostingOptions> = {}) { this.options = { ...DEFAULT_COSTING_OPTIONS, ...options }; }

  async analyzeCosts(context: DeploymentContext): Promise<CostAnalysisReport> {
    if (!context.regions || context.regions.length === 0) throw new Error('Azure regions required for cost analysis');
    const resources = await this.extractResourceConfigurations(context);
    const resourceCosts = await this.calculateResourceCosts(resources);
    const burnRates = this.calculateBurnRates(resourceCosts);
    let comparison: DeploymentStrategyComparison | undefined;
    if (this.options.enableComparison) comparison = await this.generateStrategyComparison(context);
    const totalHourly = resourceCosts.reduce((sum,r)=>sum+r.totalCost,0);
    return { networkName: `azure-network`, analysisDate:new Date(), region:this.options.pricingRegion, deploymentStrategy:this.getDeploymentStrategyName(context), burnRates, resourceBreakdown:resourceCosts, totalHourlyCost:totalHourly, totalDailyCost: totalHourly*24, totalMonthlyCost: totalHourly*24*30, totalAnnualCost: totalHourly*24*365, currency:this.options.currency, comparison };
  }

  private async extractResourceConfigurations(context: DeploymentContext): Promise<AzureResourceConfig[]> {
    const configs: AzureResourceConfig[] = [];
    const deploymentType = context.deploymentDefault || 'aks';
    // Infer counts from placements heuristically
    const validators = (context.placements.validators?.replicas) || 4;
    const rpcNodes = (context.placements.rpcNodes?.instanceCount) || 1;
    for (const region of context.regions) {
      const deployment = { validators, rpcNodes, deploymentType };
      switch (deploymentType) {
        case 'aks': configs.push(...this.extractAksResources(region, deployment, context)); break;
        case 'aca': configs.push(...this.extractAcaResources(region, deployment, context)); break;
        case 'vm': configs.push(...this.extractVmResources(region, deployment, context)); break;
        case 'vmss': configs.push(...this.extractVmssResources(region, deployment, context)); break;
      }
      configs.push(...this.extractSharedResources(region, deployment, context));
    }
    return configs;
  }

  private extractAksResources(region:string, deployment:any, context:DeploymentContext): AzureResourceConfig[] {
    const configs: AzureResourceConfig[] = [];
    configs.push({ resourceType:'aks-cluster', resourceName:`main-aks-${region}`, region, sku:'Standard', quantity:1, properties:{ version:'1.28', networkPlugin:'kubenet' } });
    if (deployment.validators>0) configs.push({ resourceType:'aks-node-pool', resourceName:`validators-${region}`, region, sku: context.sizeMap?.validators || 'Standard_D4s_v5', quantity: deployment.validators, properties:{ diskSize:128, osDiskType:'Premium_LRS' } });
    if (deployment.rpcNodes>0) configs.push({ resourceType:'aks-node-pool', resourceName:`rpc-${region}`, region, sku: context.sizeMap?.rpc || 'Standard_D2s_v5', quantity: deployment.rpcNodes, properties:{ diskSize:64, osDiskType:'Premium_LRS' } });
    return configs;
  }
  private extractAcaResources(region:string, deployment:any, _context:DeploymentContext): AzureResourceConfig[] {
    const configs: AzureResourceConfig[] = [];
    configs.push({ resourceType:'container-app', resourceName:`env-${region}`, region, sku:'Consumption', quantity:1, properties:{} });
    if (deployment.validators>0) configs.push({ resourceType:'container-app', resourceName:`validators-${region}`, region, sku:'Consumption', quantity: deployment.validators, properties:{ cpu:2, memory:'4Gi', storage:'32Gi' } });
    if (deployment.rpcNodes>0) configs.push({ resourceType:'container-app', resourceName:`rpc-${region}`, region, sku:'Consumption', quantity: deployment.rpcNodes, properties:{ cpu:1, memory:'2Gi', storage:'16Gi' } });
    return configs;
  }
  private extractVmResources(region:string, deployment:any, context:DeploymentContext): AzureResourceConfig[] {
    const totalNodes = deployment.validators + deployment.rpcNodes;
    return [{ resourceType:'virtual-machine', resourceName:`vms-${region}`, region, sku: context.sizeMap?.default || 'Standard_D4s_v5', quantity: totalNodes, properties:{ osDiskSize:128, osDiskType:'Premium_LRS', dataDiskSize:256, dataDiskType:'Premium_LRS' } }];
  }
  private extractVmssResources(region:string, deployment:any, context:DeploymentContext): AzureResourceConfig[] {
    const totalNodes = deployment.validators + deployment.rpcNodes;
    return [{ resourceType:'virtual-machine-scale-set', resourceName:`vmss-${region}`, region, sku: context.sizeMap?.default || 'Standard_D4s_v5', quantity: totalNodes, properties:{ osDiskSize:128, osDiskType:'Premium_LRS', dataDiskSize:256, dataDiskType:'Premium_LRS' } }];
  }
  private extractSharedResources(region:string, deployment:any, _context:DeploymentContext): AzureResourceConfig[] {
    const configs: AzureResourceConfig[] = [];
    configs.push({ resourceType:'virtual-network', resourceName:`vnet-${region}`, region, sku:'Standard', quantity:1, properties:{} });
    if (deployment.rpcNodes>0) {
      configs.push({ resourceType:'load-balancer', resourceName:`lb-${region}`, region, sku:'Standard', quantity:1, properties:{} });
      configs.push({ resourceType:'public-ip', resourceName:`ip-${region}`, region, sku:'Standard', quantity:1, properties:{} });
    }
    // Simplified monitoring assumption (always include insights + storage)
    configs.push({ resourceType:'application-insights', resourceName:`insights-${region}`, region, sku:'Standard', quantity:1, properties:{} });
    configs.push({ resourceType:'storage-account', resourceName:`st${region}`, region, sku:'Standard_LRS', quantity:1, properties:{} });
    return configs;
  }

  private async calculateResourceCosts(configs: AzureResourceConfig[]): Promise<ResourceCost[]> {
    const costs: ResourceCost[] = [];
    for (const c of configs) {
      const unit = await this.getResourceUnitCost(c);
      // Apply optional discount factor per resource type (e.g., reserved instances, savings plans)
      const discountFactor = this.options.discountFactors?.[c.resourceType];
      const effectiveUnit = discountFactor && discountFactor > 0 && discountFactor <= 1 ? unit * discountFactor : unit;
      costs.push({ resourceType:c.resourceType, resourceName:c.resourceName, region:c.region, sku:c.sku, quantity:c.quantity, unitCost:effectiveUnit, totalCost: effectiveUnit*c.quantity, currency:this.options.currency });
    }
    return costs;
  }
  private async getResourceUnitCost(config: AzureResourceConfig): Promise<number> {
    if (this.options.useLivePricing) {
      try {
        const live = await this.getLivePricing(config); if (live!==null) return live;
      } catch (e) { /* swallow */ }
    }
    return this.getEstimatedCost(config);
  }
  private async getLivePricing(config: AzureResourceConfig): Promise<number|null> {
    const { getPricingForResource } = await import('../pricing/azurePricingClient');
    const pricing = await getPricingForResource(config.resourceType, config.sku, config.region, { region:this.options.pricingRegion, currency:this.options.currency });
    return pricing ? pricing.pricePerHour : null;
  }
  private getEstimatedCost(config: AzureResourceConfig): number {
    const vmCost = (sku:string)=> { const map:Record<string,number>={ 'Standard_D2s_v5':0.096,'Standard_D4s_v5':0.192,'Standard_D8s_v5':0.384,'Standard_D16s_v5':0.768,'Standard_B2s':0.041,'Standard_B4ms':0.166 }; return map[sku]||0.10; };
    const containerCost = (c:AzureResourceConfig)=> { const cpu = c.properties?.cpu || 1; const memory = parseFloat(c.properties?.memory?.replace(/[^\d.]/g,'')||'2'); return cpu*0.000024*3600 + memory*0.000009*3600; };
    const base:Record<AzureResourceType,number> = {
      'aks-cluster':0.10,
      'aks-node-pool': vmCost(config.sku),
      'container-app': containerCost(config),
      'virtual-machine': vmCost(config.sku),
      'virtual-machine-scale-set': vmCost(config.sku),
      'log-analytics':0.05,
      'application-insights':0.01,
      'storage-account':0.02,
      'virtual-network':0.01,
      'load-balancer':0.025,
      'public-ip':0.005
    };
    return base[config.resourceType] || 0.01;
  }
  private calculateBurnRates(resourceCosts: ResourceCost[]): PeriodCost[] {
    const hourly = resourceCosts.reduce((s,r)=>s+r.totalCost,0);
    const mult:Record<CostPeriod,number>={ 'minute':1/60,'hour':1,'day':24,'3-day':24*3,'week':24*7,'month':24*30,'quarter':24*90,'annual':24*365 };
    return this.options.periods.map(p=>({ period:p, cost:hourly*mult[p], currency:this.options.currency }));
  }
  private async generateStrategyComparison(ctx: DeploymentContext): Promise<DeploymentStrategyComparison> {
    const strategies = this.options.comparisonStrategies || ['single-region-aks','multi-region-aks','single-region-vm','multi-region-vm','hybrid-aks-aca'];
    return this.compareDeploymentStrategies(ctx, strategies);
  }
  async compareDeploymentStrategies(base: DeploymentContext, strategies:string[]): Promise<DeploymentStrategyComparison> {
    const baseResources = await this.extractResourceConfigurations(base);
    const baseCosts = await this.calculateResourceCosts(baseResources);
    const baseMonthly = baseCosts.reduce((s,r)=>s+r.totalCost,0)*24*30;
    const analyses = [{ name:'current', description:this.getDeploymentStrategyName(base), monthlyCost:baseMonthly, annualCost:baseMonthly*12, resources:baseCosts }];
    for (const strat of strategies) {
      const alt = this.createAlternativeContext(base, strat);
      const altResources = await this.extractResourceConfigurations(alt);
      const altCosts = await this.calculateResourceCosts(altResources);
      const altMonthly = altCosts.reduce((s,r)=>s+r.totalCost,0)*24*30;
      analyses.push({ name:strat, description:this.getDeploymentStrategyName(alt), monthlyCost:altMonthly, annualCost:altMonthly*12, resources:altCosts });
    }
    const recommendations = this.generateRecommendations(analyses);
    return { strategies: analyses, recommendations };
  }
  private createAlternativeContext(base: DeploymentContext, strategy:string): DeploymentContext { const alt = { ...base }; switch(strategy){ case 'single-region-aks': alt.regions=[alt.regions[0]]; alt.deploymentDefault='aks'; break; case 'multi-region-aks': alt.regions= alt.regions.length>1?alt.regions: ['eastus','westus2','centralus']; alt.deploymentDefault='aks'; break; case 'single-region-vm': alt.regions=[alt.regions[0]]; alt.deploymentDefault='vm'; break; case 'multi-region-vm': alt.regions= alt.regions.length>1?alt.regions: ['eastus','westus2','centralus']; alt.deploymentDefault='vm'; break; case 'hybrid-aks-aca': alt.deploymentDefault='aks'; break; } return alt; }
  private generateRecommendations(strategies:{ name:string; description:string; monthlyCost:number; annualCost:number; resources?:ResourceCost[] }[]): { strategy:string; reason:string; savings:number; tradeoffs:string[] }[] {
    const recs: { strategy:string; reason:string; savings:number; tradeoffs:string[] }[] = [];
    const baseCost = strategies[0].monthlyCost;
    const cheapest = strategies.reduce((m,s)=> s.monthlyCost < m.monthlyCost ? s : m);
    if (cheapest.name !== 'current') { const savings = baseCost - cheapest.monthlyCost; const pct = ((savings/baseCost)*100).toFixed(1); recs.push({ strategy:cheapest.name, reason:`Lowest cost option - saves $${savings.toFixed(2)}/month (${pct}%)`, savings, tradeoffs:this.getStrategyTradeoffs(cheapest.name) }); }
    const multiRegion = strategies.find(s=>s.name.includes('multi-region'));
    if (multiRegion && multiRegion.name !== 'current') { const extra = multiRegion.monthlyCost - baseCost; recs.push({ strategy:multiRegion.name, reason:`High availability across regions (+$${extra.toFixed(2)}/month)`, savings:-extra, tradeoffs:['Higher cost','Better disaster recovery','Lower latency globally'] }); }
    return recs;
  }
  private getStrategyTradeoffs(strategy:string): string[] { const map:Record<string,string[]>={ 'single-region-vm':['Lower cost','Manual scaling','Single point of failure'], 'single-region-aks':['Moderate cost','Auto-scaling','Kubernetes complexity'], 'multi-region-aks':['Higher cost','High availability','Complex networking'], 'multi-region-vm':['Moderate cost','Geographic distribution','Manual coordination'], 'hybrid-aks-aca':['Flexible scaling','Mixed complexity','Service coordination'] }; return map[strategy] || ['Strategy-specific considerations apply']; }
  private getDeploymentStrategyName(ctx: DeploymentContext): string { const regionText = ctx.regions.length === 1 ? 'Single Region' : `${ctx.regions.length} Regions`; const deploy = (ctx.deploymentDefault || 'aks').toUpperCase(); return `${regionText} ${deploy}`; }
}
