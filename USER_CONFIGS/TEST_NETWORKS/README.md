# TEST_NETWORKS

Purpose-built QA / staging network definitions.

Example (`azure-multi-region-staging.network.json`):
```jsonc
{
  "name": "azure-multi-region-staging",
  "clientType": "besu",
  "privacy": true,
  "validators": 4,
  "rpcNodes": 2,
  "azureEnable": true,
  "azureRegions": ["eastus", "westus2"],
  "monitoring": "loki",
  "explorer": "chainlens"
}
```
