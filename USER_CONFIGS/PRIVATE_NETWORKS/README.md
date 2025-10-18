# PRIVATE_NETWORKS

Manifests emphasizing Tessera private transaction flows.

Example (`multi-party-privacy.network.json`):
```jsonc
{
  "name": "multi-party-privacy",
  "clientType": "goquorum",
  "privacy": true,
  "participants": 3,
  "validators": 4,
  "rpcNodes": 1,
  "monitoring": "elk",
  "explorer": "blockscout"
}
```
