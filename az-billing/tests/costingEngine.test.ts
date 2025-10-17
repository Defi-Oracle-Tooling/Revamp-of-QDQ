import { CostingEngine } from '../src/costing/costingEngine';
import { toDeploymentContext } from '../src/types/context';

function baseNetworkLike(overrides: any = {}) {
  return {
    resolvedAzure: {
      regions: ['eastus'],
      placements: {
        validators: { deploymentType: 'aks', regions: ['eastus'], replicas: 3 },
        rpcNodes: { deploymentType: 'aks', regions: ['eastus'], instanceCount: 1 }
      }
    },
    azureDeploymentDefault: 'aks',
    azureRegions: ['eastus'],
    azureSizeMap: { validators: 'Standard_D4s_v5', rpc: 'Standard_D2s_v5', default: 'Standard_D4s_v5' },
    ...overrides
  };
}

describe('CostingEngine basic costing', () => {
  test('AKS strategy produces resource breakdown', async () => {
    const ctx = toDeploymentContext(baseNetworkLike());
    const engine = new CostingEngine({ useLivePricing: false, enableComparison: false, periods: ['hour'] });
    const report = await engine.analyzeCosts(ctx);
    expect(report.resourceBreakdown.length).toBeGreaterThan(0);
    const nodePool = report.resourceBreakdown.find(r => r.resourceType === 'aks-node-pool');
    expect(nodePool).toBeTruthy();
  });

  test('VM strategy changes resource type composition', async () => {
    const network = baseNetworkLike({ azureDeploymentDefault: 'vm' });
    const ctx = toDeploymentContext(network);
    const engine = new CostingEngine({ useLivePricing: false, enableComparison: false, periods: ['hour'] });
    const report = await engine.analyzeCosts(ctx);
    const vmResources = report.resourceBreakdown.filter(r => r.resourceType === 'virtual-machine');
    expect(vmResources.length).toBe(1); // single aggregate virtual-machine entry
    const aksCluster = report.resourceBreakdown.find(r => r.resourceType === 'aks-cluster');
    expect(aksCluster).toBeUndefined();
  });
});

describe('Discount factor application', () => {
  test('Discount factor reduces unit cost', async () => {
    const ctx = toDeploymentContext(baseNetworkLike());
    const engineNoDiscount = new CostingEngine({ useLivePricing: false, enableComparison: false, periods: ['hour'] });
  const engineDiscount = new CostingEngine({ useLivePricing: false, enableComparison: false, periods: ['hour'], discountFactors: { 'aks-node-pool': 0.5 } as any });
    const baseReport = await engineNoDiscount.analyzeCosts(ctx);
    const discountReport = await engineDiscount.analyzeCosts(ctx);
    const basePool = baseReport.resourceBreakdown.find(r => r.resourceType === 'aks-node-pool');
    const discPool = discountReport.resourceBreakdown.find(r => r.resourceType === 'aks-node-pool');
    expect(basePool && discPool).toBeTruthy();
    expect(discPool!.unitCost).toBeCloseTo(basePool!.unitCost * 0.5, 6);
  });
});
