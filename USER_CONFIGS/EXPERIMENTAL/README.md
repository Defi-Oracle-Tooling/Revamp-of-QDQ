# EXPERIMENTAL

Prototype configurations exploring new flags or topology DSLs.

Example (`rpc-node-types-experiment.network.json`):
```jsonc
{
  "name": "rpc-node-types-experiment",
  "clientType": "besu",
  "privacy": true,
  "rpcNodeTypes": "api:standard:2;admin:admin:1;trace:trace:1",
  "validators": 3,
  "rpcNodes": 4,
  "monitoring": "datadog"
}
```
