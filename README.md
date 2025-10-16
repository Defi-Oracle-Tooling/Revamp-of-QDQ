# Multi-Agent Network Orchestrator

> Formerly "Quorum Dev Quickstart" – now a multi‑workflow, cloud‑aware network builder & validator.

```
 __  __       _ _   _        _          _              _            _             _            
|  \/  | __ _(_) |_| | ___  | |    __ _| |_ ___  _ __ | | ___   ___| | _____ _ __| |_ ___  ___ 
| |\/| |/ _` | | __| |/ _ \ | |   / _` | __/ _ \| '_ \| |/ _ \ / __| |/ / _ \ '__| __/ _ \/ __|
| |  | | (_| | | |_| |  __/ | |__| (_| | || (_) | |_) | |  __/ \__ \   <  __/ |  | ||  __/\__ \
|_|  |_|\__,_|_|\__|_|\___| |_____\__,_|\__\___/| .__/|_|\___| |___/_|\_\___|_|   \__\___||___/
                                                |_|                                            
   Multi-Agent Network Orchestrator • Local Dev • Cloud Infra • Validation • Migration Toolkit
```

An orchestration framework for rapidly generating and validating Hyperledger Besu / GoQuorum networks (local Docker Compose and optional Azure topologies), with integrated migration scripts, schema & semantic validation, and modular feature flags.

## Overview

CLI answers or flags become a `NetworkContext` consumed by the builder. Validation yields a structured `ValidationResult` instead of throwing, enabling dry-run CI.

## Key Features

| Domain | Capabilities |
| ------ | ------------ |
| **Wallet Integration** | **WalletConnect, Coinbase Wallet, unified wallet provider with React components** |
| **Smart Contracts** | **OpenZeppelin-based ERC20, ERC721, MultiSig, TimeLock, Governance contracts** |
| Local Dev | Deterministic Docker Compose; privacy (Tessera) toggle; explorers & monitoring; **dynamic node topology** |
| Cloud (Azure) | Region classification; multi-region placement DSL; hub-spoke / isolated modes; **Bicep templates; Kubernetes manifests** |
| **Network Topology** | **Configurable validators (1-10), RPC nodes (1-5), participants (0-10) with Nunjucks templating** |
| Validation | Aggregated issues; consensus & node count checks; Azure + RPC type verification |
| RPC Node Types | Role mapping DSL `api:standard:2;admin:admin:1` with type/count validation |
| Migration Toolkit | Safe Besu hot cutover scripts (checksum, drift detection, rollback) |
| Explorer & Monitoring | Blockscout / Chainlens; **Loki / Splunk / ELK logging stacks with unified selection** |
| Dry-Run / CI | `--validate --noFileWrite` for schema checks without artifact writes |
| **DApp Integration** | **Complete frontend with Next.js, Chakra UI, wagmi integration, deployment scripts** |
| Extensibility | Add feature flags by extending `NetworkContext` & templates; never overwrite existing user files |

## Quickstart

```bash
# Interactive
npx quorum-dev-quickstart

# Non-interactive minimal (Besu + privacy + Loki)
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --monitoring loki \
  --outputPath ./quorum-test-network

# Dry-run validation (no files written)
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --validate true \
  --noFileWrite true

# Advanced (Chainlink + Defender + CREATE2 + Multicall + FireFly + Bridges + Chain138)
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --monitoring loki \
  --chainlink "ethereum;ETH/USD=0xfeed:8,BTC/USD=0xfeed2:8" \
  --defender "relayer=0xrelayer;sentinel=HighValue:ethereum" \
  --create2 true \
  --multicall true \
  --firefly "https://firefly.local,org1" \
  --bridges "layerzero:1:137;wormhole:1:42161" \
  --chain138 "gov=GovToken:GOV:1000000;feed=priceFeed1:60" \
  --outputPath ./advanced-network
```

Scripts (`run.sh`, `stop.sh`, `resume.sh`, `remove.sh`, `list.sh`) retain executable mode; existing files are never overwritten.

## Validation Model

`validateContext` returns `{ valid: boolean; issues: { field?: string; message: string }[] }`.

Design choices:
1. Aggregated – surfaces all misconfigurations in one pass.
2. Non-Throwing – simplifies CI & editor integrations.
3. Append-Only – new feature flags add isolated push rules.

Example:
```ts
import { validateContext } from './src/networkValidator';
const result = validateContext({ clientType: 'besu', privacy: true, validators: 0 });
if (!result.valid) {
  for (const issue of result.issues) {
    console.error(`[${issue.field ?? 'general'}] ${issue.message}`);
  }
}
```

Consensus specifics (e.g. IBFT recommended ≥4 validators) appear as advisory issues.

## RPC Node & Placement DSL

RPC mapping string: `role:type:count` separated by semicolons – e.g. `api:standard:2;archive:full:1`.
Azure placement DSL: `role:deploymentType:regionA+regionB` – e.g. `validators:aks:eastus+westus2;rpc:aca:centralus`.

## Azure Highlights

| Flag | Purpose |
| ---- | ------- |
| `--azureEnable` | Activate Azure validation & templates |
| `--azureRegions` | Comma-separated region list (required if Azure enabled) |
| `--azureDeploymentDefault` | Default deployment (aks, aca, vm, vmss) |
| `--azureNodePlacement` | Per-role placement DSL |
| `--azureNetworkMode` | `flat`, `hub-spoke`, `isolated` |
| `--azureTopologyFile` | External JSON topology ingestion |
| `--azureDryInfra` | Infra templates only (no network artifacts) |

## Table of Contents

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Usage](#usage)
3. [Advanced Configuration](#advanced-configuration)
4. [Cloud Deployment](#cloud-deployment)
5. [Validation & Testing](#validation--testing)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

To run these tutorials, you must have the following installed:

- [Docker and Docker-compose](https://docs.docker.com/compose/install/) v2 or higher

| ⚠️ **Note**: If on MacOS or Windows, please ensure that you allow docker to use upto 4G of memory or 6G if running Privacy examples under the _Resources_ section. The [Docker for Mac](https://docs.docker.com/docker-for-mac/) and [Docker Desktop](https://docs.docker.com/docker-for-windows/) sites have details on how to do this at the "Resources" heading       |
| ---                                                                                                                                                                                                                                                                                                                                                                                |


| ⚠️ **Note**: This has only been tested on Windows 10 Build 19045, WSL2 and Docker Desktop                                                                                                                                                 |
| ---                                                                                                                                                                                                                                                                                                                                                                                |

- On Windows, please use WSL2 kernels 5.15x or higher
- You can use either Docker Desktop or docker-engine (with the compose plugin) within the WSL2 environment
- [Nodejs](https://nodejs.org/en/download/) or [Yarn](https://yarnpkg.com/cli/node)


## Usage 

Create artifacts (interactive): `npx quorum-dev-quickstart` then follow prompts (client, privacy, monitoring, explorer, Azure). Output directory must not pre-exist.

This prompts you to pick a quorum variant, whether you would like to try Privacy and the location for the artifacts. By 
default artifact files are stored at `./quorum-test-network`, change directory to the artifacts folder: 

```
$> cd quorum-test-network
``` 


Alternatively, you can use CLI options and skip the prompt above like so:

```bash
# Basic local development
npx quorum-dev-quickstart --clientType besu --outputPath ./quorum-test-network --monitoring loki --privacy true

# Advanced configuration with custom node topology
npx quorum-dev-quickstart \
  --clientType besu \
  --validators 4 \
  --rpcNodes 2 \
  --bootNodes 1 \
  --privacy true \
  --monitoring loki \
  --explorer blockscout \
  --outputPath ./my-network

# Validation/dry-run mode
npx quorum-dev-quickstart \
  --clientType besu \
  --validate true \
  --noFileWrite true \
  --outputPath ./test-validation
```

The arguments `--privacy` and `--clientType` are required, the others contain defaults if left blank.

### Configuration Refresh (Integration Secrets)

Use the standalone flag `--refreshConfig` to force a reload of integration configuration (environment variables + Azure Key Vault secrets) without supplying other required network flags. This is useful for:
* Rotating secrets (e.g. updating `TATUM_API_KEY`) while keeping the current process lightweight
* Validating that newly injected environment variables are picked up before a full network scaffold

Example:
```bash
node build/index.js --refreshConfig
```
Output contains a JSON summary:
```jsonc
{
  "wellsFargoEnabled": false,
  "wellsFargoBaseUrl": "",
  "tatumTestnet": false,
  "loadedAt": "2025-10-16T02:42:35.020Z"
}
```
If a required secret (like `TATUM_API_KEY`) is missing, the tool provides a placeholder during standalone refresh to avoid a hard failure; set the real value and re-run for accurate status.
See `docs/operations/config-refresh.md` for deeper operational guidance.

## Advanced Configuration

### Dynamic Network Topology Options

#### Basic Node Configuration
- `--validators <number>`: Number of validator nodes (1-10, default: 4)
- `--rpcNodes <number>`: Number of RPC nodes (1-5, default: 1) 
- `--participants <number>`: Number of member nodes for privacy (0-10, default: 3)
- `--bootNodes <number>`: Number of boot nodes (default: 1)
- `--consensus <type>`: Consensus mechanism (ibft, qbft, clique)
- `--chainId <number>`: Custom chain ID

#### Regional Node Distribution & Subtypes

**Simple Regional Distribution**
- `--azureRegions <regions>`: Comma-separated list of Azure regions
- `--azureNodePlacement <dsl>`: DSL format: `role:deployType:region+region2`

**Enhanced Regional Configuration**
- `--azureRegionalDistribution <config>`: Per-region node allocation
  ```bash
  # Format: "region1:nodeType=count+nodeType2=count,region2:..."
  --azureRegionalDistribution "eastus:validators=3+rpc=2+boot=1,westus2:validators=2+archive=1"
  ```

**Advanced Topology Files**
- `--azureTopologyFile <path>`: JSON/YAML file with comprehensive regional configuration
- `--azureRegionalConfig <path>`: Enhanced format supporting node subtypes per region

**Node Type Specialization**
- `--rpcNodeTypes <config>`: RPC node specialization per region
  ```bash  
  # Format: "role:type:count;role2:type2:count2"
  --rpcNodeTypes "api:standard:2;admin:admin:1;trace:trace:1"
  ```

**Examples:**
```bash
# Basic multi-region with different deployment types per role
npx quorum-dev-quickstart \
  --azureRegionalDistribution "eastus:validators=3+rpc=2,westus2:archive=1+rpc=1" \
  --azureDeploymentMap "validators=aks,rpc=aca,archive=vmss"

# Advanced regional topology with JSON configuration
npx quorum-dev-quickstart \
  --azureTopologyFile ./examples/enhanced-topology.json \
  --azureNetworkMode hub-spoke
```

### Wallet Integration & Smart Contracts
- **Frontend Components**: WalletConnect, Coinbase Wallet, unified wallet manager
- **Smart Contracts**: ERC20, ERC721, MultiSig, TimeLock, Governance (OpenZeppelin-based)
- **Deployment Scripts**: Hardhat-based deployment for all contracts
- **DApp Templates**: Next.js frontend with Chakra UI and wagmi integration

### Explorer & Monitoring
- `--explorer <type>`: Block explorer (blockscout, chainlens, swapscout, both, none)
- `--monitoring <type>`: Monitoring stack (loki, elk, splunk)
- `--swapscout`: Enable LI.FI Swapscout cross-chain analytics
- `--lifi`: LI.FI configuration (apiKey,analytics,chainIds,endpoint)
- **Unified Selection**: Conditional template logic supports all combinations

### Genesis Configuration
- `--genesisPreset <preset>`: Genesis template preset
- `--nodeLayoutFile <path>`: JSON file defining custom node layout

## 🚀 ChainID 138 Wallet Integration

This project includes comprehensive wallet integration capabilities for ChainID 138 with enterprise-grade features:

### Key Features
- **Virtual Account Management**: Full Tatum.io integration for virtual accounts and fiat wallets
- **Cross-Chain Bridging**: Lock-and-Mint bridge between ChainID 138 and other networks  
- **ISO-20022 Compliance**: Regulatory-compliant e-money tokens (EURC, USDC, USDT, DAI, M1 GRU)
- **Etherscan Integration**: Complete on-chain transaction visibility and verification
- **Hyperledger Firefly**: Enterprise blockchain messaging and namespace management
- **Bank API Integration**: OAuth 2.0 compliant connections to traditional banking systems

### Quick Start - Complete Ecosystem

```bash
# Deploy complete ChainID 138 ecosystem with all integrations
./scripts/deploy_chain138_ecosystem.sh

# Or generate network with advanced configuration
npx quorum-dev-quickstart \
  --clientType besu \
  --chainId 138 \
  --privacy true \
  --monitoring loki \
  --blockscout true \
  --chain138 "gov=ChainToken:CHAIN:1000000;feed=ethUsd:60" \
  --firefly "https://firefly.local,org1" \
  --bridges "layerzero:1:138;wormhole:137:138" \
  --includeDapp true \
  --outputPath ./chain138-network
```

### Access Points After Deployment
- **Wallet Frontend**: `http://localhost:3000` - Complete wallet management UI
- **Quorum RPC**: `http://localhost:8545` - Network JSON-RPC endpoint  
- **Block Explorer**: `http://localhost:26000` - Blockscout transaction explorer
- **Monitoring**: `http://localhost:3001` - Grafana dashboards

### Available Components
- **Smart Contracts**: ISO-20022 compliant e-money tokens, cross-chain bridge, compliance oracle
- **Frontend**: React components for virtual accounts, fiat wallets, cross-chain transfers
- **API Endpoints**: Tatum.io integration, Etherscan service, bank API connector
- **Testing**: Comprehensive integration tests for all components

### Configuration Examples

**Basic ChainID 138 with Wallet Integration:**
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --chainId 138 \
  --chain138 "gov=GovToken:GOV:1000000;feed=priceFeed:60"
```

**Advanced Multi-Chain Bridge Setup:**
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --chainId 138 \
  --bridges "layerzero:1:138;wormhole:137:138;polygon:137:138" \
  --firefly "https://firefly-prod.local,organization1"
```

See `files/common/dapps/quorumToken/README.md` for detailed wallet integration documentation.

## Agent Workflows

You can run specific agent workflows using CLI flags:

```bash
node build/index.js --infra --network --validation --documentation
```
## Example Agent Workflow Command

```bash
node build/index.js --infra --network --validation --documentation
```
## Cloud Deployment

### Azure Integration
Enable cloud deployment to Azure with comprehensive region and service configuration:

```bash
# Multi-region Azure deployment
npx quorum-dev-quickstart \
  --clientType besu \
  --azureEnable true \
  --azureRegions "eastus,westus2,centralus" \
  --azureDeploymentDefault aks \
  --azureNodePlacement "validators:aks:eastus+westus2;rpc:aca:centralus" \
  --azureOutputDir ./azure-deployment

# Azure with custom topology file
npx quorum-dev-quickstart \
  --clientType besu \
  --azureEnable true \
  --azureTopologyFile ./my-topology.json \
  --azureDryInfra true
```

### Azure Configuration Options
- `--azureEnable`: Enable Azure deployment integration
- `--azureRegions`: Comma-separated list of Azure regions
- `--azureRegionClass`: Region classification (commercial, gov, china, dod)
- `--azureDeploymentDefault`: Default deployment type (aks, aca, vm, vmss)
- `--azureNodePlacement`: Node placement DSL for role-specific deployment
- `--azureNetworkMode`: Network topology (flat, hub-spoke, isolated)
- `--azureDryInfra`: Generate infrastructure templates only

#### **Azure Infrastructure Templates**
- **Bicep Templates**: Multi-region deployment with compute, networking, monitoring
- **Kubernetes Manifests**: Complete AKS deployment with StatefulSets and Services
- **Global Networking**: Cross-region connectivity with VPN Gateway and Traffic Manager
- **Monitoring Integration**: Log Analytics, Application Insights, and custom dashboards
- **Deployment Automation**: Scripts for automated Kubernetes deployment

### Cloudflare DNS Integration
- `--cloudflareZone <domain>`: Configure DNS zone
- `--cloudflareApiTokenEnv <env_var>`: API token environment variable

## Besu Migration & Hot Cutover

End-to-end migration utilities are included to transition an existing single-host (VM / Docker) Besu network to a multi‑region containerized topology.

Key scripts (see `docs/besu_migration.md` for full flow):
- `connect_vm.sh` – establish SSH, seed `.besu_env`, create working dirs
- `locate_besu_assets.sh` – enumerate containers, mounts, produce JSON/text reports
- `backup_besu_data.sh` – selective backup (data/keys/config + Tessera/EthSigner) with optional Azure upload & checksum verification (`AZURE_VERIFY=first|all`)
- `sync_hot_cutover.sh` – incremental rsync loop until lock file appears
- `final_cutover.sh` – drift-checked validator stop + last sync + deployment trigger (dry-run supported via `DRY_RUN=true`)
- `verify_cutover.sh` – checksum & block-height verification + connectivity diagnostics
- `rollback.sh` – gated staging restore (`CONFIRM=true`) for safe recovery
- `prometheus_cutover_hook.sh` – emits cutover phase & last block metrics
- `connectivity_check.sh` – RPC, port, latency diagnostics

Hardening Highlights:
- Deterministic logging under `./logs` with per-phase log files
- Strict env variable schema (`docs/env.md`)
- Lock-file coordination (`$BESU_HOME/.lock`) for final sync boundary
- Block drift detection (`THRESHOLD_DRIFT`) during cutover validation
- Integrity verification modes: `AZURE_VERIFY=first|all`
- Secure rollback staging (no in-place overwrite) requiring explicit confirmation

CI Validation (`infra_validation.yml`): shellcheck, Bicep build, TS build/tests automatically run on pull requests touching infra/scripts.


## Validation & Testing

### ChainID 138 Wallet Integration

#### Run API and Smart Contract Tests

```bash
npm run test -- tests/tatumApi.test.ts
```

#### Deploy Frontend and Backend

```bash
chmod +x scripts/deploy_frontend_backend.sh
./scripts/deploy_frontend_backend.sh
```

#### Manual Steps

1. Start the frontend: `cd files/common/dapps/quorumToken/frontend && npm run dev`
2. Access wallet UI at `http://localhost:3000`
3. Use the wallet manager to create Virtual Accounts and Fiat Wallets
4. Verify Etherscan integration and transaction visibility

### Configuration Validation
```bash
# Validate configuration without generating files
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --validate true \
  --noFileWrite true

# Test Azure topology resolution
npx quorum-dev-quickstart \
  --azureEnable true \
  --azureRegions "eastus,westus" \
  --validate true \
  --azureDryInfra true
```

### Schema Validation
The tool includes comprehensive schema validation for:
- Network topology configuration
- Azure resource placement
- Node role assignments
- Genesis block parameters

**To start services and the network:**

Follow the README.md file of the generated artifact:
1. [Hyperledger Besu](./files/besu/README.md)
2. [GoQuorum](./files/goquorum/README.md)

### Development Workflow

```bash
# 1. Generate network
npx quorum-dev-quickstart --clientType besu --privacy true

# 2. Navigate to output directory
cd quorum-test-network
# 3. Start the network
./run.sh

# 4. View network status
./list.sh

# 5. Stop the network (preserves state)
./stop.sh

# 6. Resume the network
./resume.sh

# 7. Remove network and cleanup
./remove.sh
```

### Internal Test Hooks (Contributors Only)
Unit tests may inject a mocked file rendering layer without relying on environment variables. The `NetworkContext` exposes an optional `testHooks.fileRenderingModule` used only in tests:

```ts
const ctx: NetworkContext = {
  clientType: 'besu',
  outputPath: '/tmp/test-net',
  monitoring: 'loki',
  privacy: false,
  testHooks: {
    fileRenderingModule: {
      renderTemplateDir: jest.fn(),
      copyFilesDir: jest.fn(),
      validateDirectoryExists: jest.fn().mockReturnValue(true)
    }
  }
};
```

If provided, `buildNetwork` uses these functions instead of dynamically importing `src/fileRendering`. Avoid using this in production code or external examples; it is intentionally undocumented for end users and carries no backwards compatibility guarantees.

### Integration with Smart Contracts & DApps

The generated networks include comprehensive smart contracts and DApps:

#### **Built-in Smart Contracts**
- **ERC20Token**: Full-featured token with minting, burning, and access control
- **ERC721NFT**: Complete NFT implementation with metadata and enumerable extension
- **MultiSig**: Multi-signature wallet for secure transaction management
- **TimeLock**: Time-delayed execution controller for governance
- **StandardGovernor**: OpenZeppelin-based governance with voting and proposals
- **AccessControl**: Role-based permissions management

#### **Frontend Integration** 
- **Wallet Components**: WalletConnect, Coinbase Wallet, unified wallet provider
- **Next.js DApp**: Modern React frontend with Chakra UI design system
- **wagmi Integration**: Type-safe React hooks for Ethereum interactions
- **Deployment Automation**: Hardhat scripts for contract deployment

#### **Example DApps**
- **Truffle Pet-Shop**: Classic Ethereum tutorial DApp
- **Hardhat QuorumToken**: Modern development stack with Next.js frontend  
- **Privacy Examples**: Private transaction demonstrations

See [DApp Integration Guide](./files/common/dapps/quorumToken/README.md) for detailed setup instructions.

#### **Including the Quorum Token DApp**
Add the DApp to your generated network with flags:
```bash
# Basic DApp inclusion
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --monitoring loki \
  --includeDapp true \
  --walletconnectProjectId YOUR_PROJECT_ID \
  --outputPath ./network-with-dapp

# Advanced: DApp + Dual Explorers + LI.FI Analytics
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --explorer both \
  --swapscout true \
  --lifi "YOUR_API_KEY,analytics,1,137,https://explorer.li.fi" \
  --includeDapp true \
  --walletconnectProjectId YOUR_PROJECT_ID \
  --outputPath ./network-with-dual-explorers
```

**Results:**
- **DApp**: Copied to `./network-with-dapp/dapps/quorumToken` with env config
- **Blockscout**: Available at `http://localhost:25000`
- **Swapscout**: Available at `http://localhost:8082` (cross-chain analytics)
- **LI.FI Integration**: Bridge monitoring and DEX aggregation data
- **Instructions**: Detailed setup in `dapp-INSTRUCTIONS.md`

### New Integration Flags
| Flag | Description | Example |
|------|-------------|---------|
| `--chainlink` | Enable Chainlink (network;pair=address:decimals list) | `--chainlink "ethereum;ETH/USD=0xfeed:8"` |
| `--defender` | OpenZeppelin Defender (relayer & sentinels) | `--defender "relayer=0xrelayer;sentinel=HighValue:ethereum"` |
| `--create2` | Enable CREATE2 utility | `--create2 true` |
| `--multicall` | Enable Multicall batching | `--multicall true` |
| `--firefly` | FireFly adapter (baseUrl,namespace) | `--firefly "https://firefly.local,org1"` |
| `--bridges` | Bridge routes provider:source:dest | `--bridges "layerzero:1:137;wormhole:1:42161"` |
| `--chain138` | ChainID 138 config (gov + feeds) | `--chain138 "gov=GovToken:GOV:1000000;feed=price1:60"` |
| `--includeDapp` | Include Quorum Token Next.js dapp in output | `--includeDapp true` |
| `--walletconnectProjectId` | Inject WalletConnect project ID into dapp .env.local | `--walletconnectProjectId abcd1234` |
| `--swapscout` | Enable Swapscout (LI.FI) cross-chain analytics | `--swapscout true` |
| `--lifi` | LI.FI configuration (apiKey,analytics,chains,endpoint) | `--lifi "abc123,analytics,1,137"` |


## Internal Test Hooks & DI Integration

For contributors and advanced testing, the builder supports dependency injection (DI) for file rendering logic. This is used to mock or override file operations in tests without affecting production code.

**Example:**
```ts
import { buildNetwork } from './src/networkBuilder';
const mockFileRendering = {
  renderTemplateDir: jest.fn(),
  copyFilesDir: jest.fn(),
  validateDirectoryExists: jest.fn().mockReturnValue(true)
};
const context = {
  ...baseContext,
  testHooks: { fileRenderingModule: mockFileRendering }
};
buildNetwork(context);
```
This allows tests to intercept and assert file operations. Do not use this in production or user-facing code.

## Binary File Handling

The file rendering logic detects binary files using `isbinaryfile`. Binary files are copied as buffers, preserving their content and mode, without newline normalization. Text files are normalized to the platform's EOL. Tests include both unit and integration coverage for binary file handling.

---
## Versioning & Release

Semantic versioning workflow:
1. Bump `version` in `package.json`.
2. Run `npm test` & `npm run lint` (must pass).
3. Commit `chore(release): vX.Y.Z` and tag.
4. Run smoke test (`npm run smoke`) to verify network creation.

Internal spinner/log-update fallbacks are used in tests to avoid ESM parsing issues; external packages remain for legacy compatibility.

## Contributing

1. Install deps: `npm install`
2. Build & test: `npm run build && npm test`
3. Lint & fix: `npm run lintAndFix`
4. Generate CLI docs: `npm run docs:cli` (updates `docs/cli-flags.md`)
5. Submit PR with focused changes; avoid unrelated formatting.

Development guidelines:
- Validation should aggregate issues (no throws) via `validateContext`.
- Never overwrite an existing output file; `renderFileToDir` aborts instead.
- Keep Azure-specific logic in `src/cloud` & templates in `templates/**`.
- Prefer minimal advisory messages rather than hard failures for recommended counts.

Scripts:
| Script | Purpose |
| ------ | ------- |
| `scripts/smoke.js` | Minimal end-to-end generation & sanity checks |
| `scripts/generate-cli-docs.js` | Regenerates CLI flag reference |
| `scripts/set_exec_and_lint.sh` | Normalizes executable bits & runs lint |

Key docs:
- Migration: `docs/besu_migration.md`
- Environment Variables: `docs/env.md`
- CLI Flags Reference: `docs/cli-flags.md`
- Security Best Practices: `docs/security.md`

## Troubleshooting

### Besu only - `java.io.IOException: Permission denied` for volumes

The `besu` containers use user `besu` mapped to user:group 1000. On your local machine, if your userid is not 1000, you will see this error. To fix this either run as user 1000 or map
the container's user 1000 to your local user id so permissions will work like so in the compose file

```
image: some:img
user: $(id -u):$(id -g)
```

### `quorumengineering/tessera` can't be found on Mac OS and no match for platform 

Often, when trying to use tessera with `quorum-dev-quickstart` on Mac OS, you may encounter a message stating that the `tessera` image cannot be found and does not match the platform. 

```
failed to solve: quorumengineering/tessera:23.4.0: no match for platform in manifest sha256:fb436c0ac56b79ca7cda27b92a3f81273de77d1c5b813aba0183333ca483053e: not found
```

In this case, you can modify the `FROM` statement in the `Dockerfile` located at `quorum-test-network/config/tessera` as follows.

```
FROM --platform=linux/amd64 quorumengineering/tessera:${TESSERA_VERSION}
```

# Submodule Integration: React/Tailwind UI

This repository uses a submodule for the immersive UI frontend:

- **Path:** `ui/`
- **Source:** [Defi-Oracle-Tooling/6-DOF-4-HL-Chains](https://github.com/Defi-Oracle-Tooling/6-DOF-4-HL-Chains)

## Submodule Management Script

Use `scripts/submodules/update-all.sh` to initialize, sync, and optionally pull latest commits for all submodules.

Examples:
```bash
# Initialize & sync recorded commits
./scripts/submodules/update-all.sh

# Show status (paths & HEAD commits)
./scripts/submodules/update-all.sh --status

# Pull latest main/master inside each submodule (fast-forward only)
./scripts/submodules/update-all.sh --pull
```

After pulling, if submodule pointers changed (you advanced a submodule), commit the updated references:
```bash
git add ui 6-DOF-4-HL-Chains
git commit -m "chore(submodules): update submodule pointers"
```

Security note: For private submodules needing credentials, authenticate (SSH agent or PAT) before running `--pull`.

## Submodule Verification & Security

Use `scripts/submodules/verify.sh` to assert cleanliness & pointer integrity:
```bash
./scripts/submodules/verify.sh          # standard
./scripts/submodules/verify.sh --strict # adds detached HEAD & branch presence checks
```

Allowed origins are listed in `.gitmodules.lock`; add new submodules by appending a line and committing.

## Externalizing a Directory

Convert a tracked/untracked folder to an external repo + submodule:
```bash
./scripts/submodules/externalize.sh manual-dapp-test Defi-Oracle-Tooling manual-dapp-test --push
```
If the remote repo does not yet exist, create it in GitHub first or omit `--push` and push manually.

## CI Enforcement

Add a GitHub Actions workflow (`submodule-verify.yml`) invoking:
```bash
./scripts/submodules/verify.sh --strict
```
Failing verification aborts the build, preventing accidental dirty submodule commits.

## Secrets Hygiene

Environment files (`.env`) are ignored via `.gitignore`. If a secret (e.g. `GITHUB_PAT`, `TATUM_API_KEY`) was ever committed, rotate it immediately and purge from history (`git filter-repo` or GitHub UI secret rotation). Never embed tokens in submodule URLs permanently.

## Initializing the Submodule

After cloning this repository, run:

```bash
git submodule update --init --recursive
```

## Updating the Submodule

To pull the latest changes from the UI repo:

```bash
cd ui
git checkout main # or your target branch
git pull
cd ..
git add ui
git commit -m "chore: update UI submodule"
```


## Integration & Deployment Steps

### Backend (Docker)
1. Build and start backend services:
  ```bash
  docker-compose up --build -d
  ```
2. Confirm backend health:
  - Visit `http://localhost:3000` or use `curl http://localhost:3000/health`.

### UI (React/Tailwind)
1. Initialize submodule (if not done):
  ```bash
  git submodule update --init --recursive
  ```
2. Install UI dependencies:
  ```bash
  cd ui
  npm install
  ```
3. Start UI dev server:
  ```bash
  npm run dev
  ```
  - Access at `http://localhost:5173`.
  - Confirm Tailwind styles are applied.

### UI-Backend Integration Test
1. Test API/WebSocket communication:
  - Example: `curl http://localhost:3000/api/tatum` (should return mock response).

### Build & Test
1. Build UI for production:
  ```bash
  cd ui
  npm run build
  ```
2. Build and test backend:
  ```bash
  npm run build
  npm test
  ```

### CI/CD
1. Push changes to trigger CI/CD pipelines:
  ```bash
  git add .
  git commit -m "Trigger CI/CD pipelines"
  git push
  ```

### Dependency Audit
1. Review vulnerabilities:
  ```bash
  npm audit --audit-level=moderate
  cd ui && npm audit --audit-level=moderate
  ```
  - If none found, note in PR/commit.

### Submodule Update
1. Update UI submodule to latest commit:
  ```bash
  cd ui
  git checkout main
  git pull
  cd ..
  git add ui
  git commit -m "chore: update UI submodule"
  git push
  ```

---
These steps ensure a reproducible integration and deployment workflow for both backend and UI. For more details, see the respective `README.md` files in `ui/` and generated network folders.