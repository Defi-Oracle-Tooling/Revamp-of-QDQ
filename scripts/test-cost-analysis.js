#!/usr/bin/env node
// Quick harness to exercise az-billing cost analysis via networkBuilder adapter
(async () => {
  const path = require('path');
  const { runCostAnalysis } = await import('../az-billing/dist/index.js');
  const sampleContext = {
    resolvedAzure: { regions: ['eastus','westus2'], placements: { validators:{ replicas:4 }, rpcNodes:{ instanceCount:2 } } },
    azureDeploymentDefault: 'aks',
    azurePricingRegion: 'eastus'
  };
  const report = await runCostAnalysis(sampleContext, { pricingRegion:'eastus', periods:['hour','day','month'] });
  console.log(JSON.stringify({ hourly: report.totalHourlyCost, monthly: report.totalMonthlyCost }, null, 2));
})();
