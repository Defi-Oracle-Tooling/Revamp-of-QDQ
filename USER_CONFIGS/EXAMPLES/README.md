# EXAMPLES

Reference CLI invocations for common scenarios.

Example Commands:
```bash
# Minimal POA
node build/src/index.js --clientType besu --privacy false --outputPath ./out-poa

# Privacy network with monitoring & explorer
node build/src/index.js --clientType besu --privacy true --monitoring loki --blockscout true --outputPath ./out-privacy

# ChainID 138 wallet + dapp
node build/src/index.js --clientType besu --chainId 138 --privacy true --includeDapp true --chain138 "gov=GovToken:GOV:1000000" --outputPath ./out-chain138
```
