# NNETWORKS

(Network definitions pending) Store normalized network configuration manifests.

Manifest Structure (`*.network.json`):
```jsonc
{
  "name": "besu-poc-privacy",
  "clientType": "besu",
  "privacy": true,
  "validators": 4,
  "rpcNodes": 1,
  "monitoring": "loki",
  "explorer": "blockscout"
}
```
