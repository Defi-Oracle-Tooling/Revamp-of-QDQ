# AI Coding Agent Instructions

## Purpose

**Multi-Agent Network Orchestrator**: A sophisticated blockchain infrastructure toolkit that scaffolds Quorum (Hyperledger Besu/GoQuorum) dev networks with integrated financial connectors, cloud deployment automation, and enterprise-grade integrations. Evolved from "Quorum Dev Quickstart" into a comprehensive multi-domain orchestrator.

## Architecture Overview

### Core Domains (Modular Structure)
- **`modules/infra/`**: Cloud providers, costing engine, genesis factory, Azure billing
- **`modules/finance/`**: Value transfer systems, ISO reference, Wells Fargo integration  
- **`modules/integration/`**: Hub for bridges/Chainlink/Defender, Marionette exchange
- **`modules/ops/`**: Governance, observability, security baselines
- **`modules/core/`**: Shared protocols, question rendering, utilities

### Key Architecture Patterns
- **Entry Point**: `src/index.ts` → `build/src/index.js` (CLI supports interactive prompts OR yargs flags)
- **Network Building**: `NetworkContext` object drives `buildNetwork()` to render Nunjucks templates + copy static assets
- **Submodule Architecture**: Critical connectors (Azure billing, Wells Fargo, Tatum, UI) are git submodules for independent versioning
- **Multi-Cloud Support**: Azure-first with abstraction for AWS/GCP via `modules/infra/cloud-providers`

## Domain Priorities (Use-Case Driven Sequencing)
Focus implementation order on end-user workflows rather than raw module completeness:
- 1. Core Network Scaffold: Reliable POA + Privacy networks (validators, RPC, Tessera) – supports "learn Ethereum", "POC DApp", "private tx" use cases (see `files/besu/README.md`).
- 2. Wallet & Asset Operations: ChainID 138 governance + token feed provisioning (`--chain138`) powering virtual accounts & e-money flows.
- 3. Connector Onboarding for Account Linking: Tatum, Wells Fargo, Bank API – enabling dashboard-based wallet + bank account linking flows.
- 4. Cloud Deployment & Topology: Azure multi-region resilient layouts (topology resolver + costing) for production simulation.
- 5. Observability & Compliance: Monitoring stacks + banking compliance adapters (fraud, reconciliation, FX) before advanced bridges.
- 6. Cross-Chain & Bridges: Chainlink, Defender, Marionette exchange integrations once base financial + compliance flows stable.
Avoid parallelizing steps 2 & 3 until step 1 has green CI across Node versions; treat each step as a promotion gate.

## Dashboard-Centric Connector Pattern
End goal: Unified dashboard where users link crypto wallets, virtual accounts, and bank accounts.
Implementation guidance:
- Each external system adapter lives in its domain (e.g., banking in `modules/finance/value-transfer` or `src/integrations/bank/`).
- Standardize connector factory registration via a discrete case branch (`createConnector(type)`); no dynamic reflection.
- Expose three primary capability methods per financial connector (minimum contract):
  - `fetchBalances()` → normalized asset + fiat balances
  - `initiateTransfer(request)` → outbound payment / value movement
  - `listTransactions(criteria)` → recent ledger/statement items
- Enrich responses with unified metadata keys: `sourceSystem`, `referenceId`, `timestamp`, `accountType`.
- Simulation mode (`SIMULATION_MODE=true`) must produce deterministic sample payloads (seeded timestamps) to enable snapshot tests.
- Wallet linking flow ties on-chain addresses + bank account identifiers via a mapping record (persisted or generated artifact) – artifact template goes under `templates/common/integrations/` when variable substitution required.
Add new connectors with a minimal vertical slice: factory registration + balance retrieval + simulation fixtures + single integration test. Defer transfers until balances stable.

### Wallet ↔ Bank Account Mapping Artifacts
Mapping does not yet exist in repo; establish the following convention when implementing linking:
- Source of truth template: `templates/common/integrations/wallet-bank-mapping.json.njk`
- Rendered artifact per network: `<outputPath>/integrations/wallet-bank/mapping.json`
- Optional historical ledger snapshots: `<outputPath>/integrations/wallet-bank/ledger-snapshots/ledger-YYYYMMDD.json`
- If encryption required later: store encrypted form as `mapping.json.enc` alongside `mapping.meta.json` (key ID, algorithm).
Record shape (initial minimal):
```jsonc
{
  "version": 1,
  "generatedAt": "2025-10-18T00:00:00.000Z",
  "links": [
    {
      "walletAddress": "0xabc...",
      "bankAccountId": "WF-0012345",
      "connector": "wells-fargo",
      "network": 138,
      "accountType": "checking",
      "displayLabel": "Primary Ops Account"
    }
  ]
}
```
Add snapshot tests referencing the deterministic timestamp when `SIMULATION_MODE=true`.

### Deterministic Simulation Payload Pattern
Seed simulations with a fixed epoch + incremental offsets for reproducibility:
```ts
// src/connectors/simulationPayload.ts
const BASE_TS = new Date('2025-01-01T00:00:00Z').getTime();
export function simulateBalances(seed = 0): RawBalanceRecord[] {
  const ts = new Date(BASE_TS + seed * 60_000).toISOString(); // 1 min increment
  return [
    { accountId: 'SIM-USD-001', currency: 'USD', available: 12500.55, ledger: 12500.55, asOf: ts },
    { accountId: 'SIM-EUR-001', currency: 'EUR', available: 8300.10, ledger: 8300.10, asOf: ts }
  ];
}
export function simulateTransactions(seed = 0): RawTransactionRecord[] {
  const ts = new Date(BASE_TS + seed * 60_000).toISOString();
  return [
    { accountId: 'SIM-USD-001', amount: 250.0, currency: 'USD', direction: 'credit', externalRef: `REF-${seed}-A`, bookingDate: ts },
    { accountId: 'SIM-USD-001', amount: 90.0, currency: 'USD', direction: 'debit', externalRef: `REF-${seed}-B`, bookingDate: ts }
  ];
}
```
Snapshot test example:
```ts
it('simulation balances deterministic', () => {
  expect(simulateBalances(0)).toMatchInlineSnapshot();
  expect(simulateBalances(1)).toMatchInlineSnapshot();
});
```
Metadata enrichment for unified dashboard rows:
```jsonc
{
  "sourceSystem": "wells-fargo",
  "referenceId": "REF-0-A",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "accountType": "checking"
}
```

## Promotion Gate Automation (CI/CD Commands)
Use scripted checks to promote between gates:
```bash
# Gate 1: Baseline
npm run build:guarded
npm run test:ci -- --selectProjects core
node scripts/smoke.js

# Gate 2: Compliance Ready
npm run test:ci -- --testPathPattern=wellsfargo.*reconciliation

# Gate 3: Cloud Topology Consistency
node build/src/index.js --clientType besu --azureEnable true --azureRegions "eastus,westus2" --validate true --noFileWrite true > topology.json
node scripts/costing-snapshot.js --regions "eastus,westus2" --output costing-current.json
diff -q costing-previous.json costing-current.json || echo "Costing drift detected (<2% threshold check script enforces)"

# Gate 4: Connector Integrity
npm run test:ci -- --testPathPattern=connectors/ --coverage
./scripts/submodules/verify.sh --strict

# Gate 5: Performance (optional)
node scripts/perf/benchmark-connectors.js --duration 30s
```
Example GitHub Actions snippet:
```yaml
jobs:
  promote-gate-3:
    if: github.ref == 'refs/heads/Mistress'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x
      - run: npm ci
      - run: npm run build:guarded
      - name: Azure topology dry run
        run: node build/src/index.js --clientType besu --azureEnable true --azureRegions "eastus,westus2" --validate true --noFileWrite true > topology.json
      - name: Costing snapshot
        run: node scripts/costing-snapshot.js --regions "eastus,westus2" --output costing-current.json
      - name: Drift check (<2%)
        run: node scripts/check-cost-drift.js costing-previous.json costing-current.json 0.02
```

## Testing Strategy (Use-Case First)
Prioritize tests that exercise end-to-end user journeys before peripheral edge cases:
1. Core Scaffold Flows: Generate POA network (no privacy), then privacy-enabled network; assert validator count, RPC availability, script executability.
2. Wallet + Account Linking: ChainID 138 network with `--includeDapp` + connector simulation; verify balance aggregation across Tatum + Wells Fargo mock.
3. Payment & Transfer Initiation: Simulated ACH / Wire transfer path producing reconciliation artifact.
4. Multi-Region Azure Dry Run: Topology resolution + costing baseline (no actual deployment) verifying region role allocation.
5. Compliance & Reconciliation: Ledger sync + fraud screening scenario tests (wells fargo suite) aggregated under a single Jest describe for rapid triage.
Post baseline stabilization: expand to negative scenarios (missing secrets, malformed topology DSL, partial connector outages). Avoid adding mutation/performance tests until all primary flows pass in CI matrix.

## CI/CD Gating (Post Use-Case Completion)
Progressive gates activated only after all primary use cases pass:
- Gate 1 (Baseline): Build + unit + core E2E flows (network scaffold & wallet linking) – required now.
- Gate 2 (Compliance Ready): Add reconciliation & fraud suites as required checks.
- Gate 3 (Cloud Topology): Enforce Azure topology dry-run & costing snapshot consistency (`costingEngine` diff threshold < 2%).
- Gate 4 (Connector Integrity): Submodule verification strict + simulation parity tests.
- Gate 5 (Performance Optional): Introduce benchmark smoke once domain stability achieved.
Promotion rule: a gate cannot be enabled until previous gate is green across two consecutive main branch runs.


## Essential Developer Workflows

### Build & Test
```bash
# Core build (handles submodules gracefully)
npm run build:guarded

# Full test suite with coverage
npm run test:ci

# Lint and auto-fix
npm run lintAndFix

# Verify submodule integrity
./scripts/submodules/verify.sh --strict
```

### Network Generation
```bash
# Interactive mode (recommended for discovery)
node build/src/index.js

# Production-ready with all integrations
node build/src/index.js \
  --clientType besu \
  --chainId 138 \
  --privacy true \
  --monitoring loki \
  --azureEnable true \
  --azureRegions "eastus,westus2" \
  --chain138 "gov=GovToken:GOV:1000000;feed=ethUsd:60" \
  --includeDapp true \
  --outputPath ./production-network

# Config refresh (secrets/environment reload)
node build/src/index.js --refreshConfig
```

### Submodule Management
```bash
# Initialize all submodules
./scripts/init-submodules.sh

# Update to latest commits
./scripts/submodules/update-all.sh --pull

# Add new submodule with automation
./scripts/submodules/add-submodule.sh <repo-url> <target-path>
```

## Critical Project-Specific Patterns

### File Rendering Safety
- **NEVER overwrite existing files**: `renderFileToDir()` throws if target exists - preserve this invariant
- **Template vs Static**: Use `templates/**` for Nunjucks interpolation with `NetworkContext` keys; use `files/**` for static assets
- **Executable Scripts**: Maintain original file modes (`chmod +x`) - verify before commit
- **Binary Handling**: Use `isBinaryFileSync` detection; copy binaries as buffers without text normalization

### Feature Flag Addition (Atomic Pattern)
1. Extend `NetworkContext` interface in `src/networkBuilder.ts`
2. Add yargs option + question flow entry
3. Update templates/files if needed 
4. Add single README example
5. **Scope Gate**: Only modify files directly tied to the feature - no refactoring

### Banking/Financial Connector Integration
- **Interface**: All connectors implement `BankingConnector` from `src/connectors/bankingConnector.ts`
- **Simulation Mode**: Set `SIMULATION_MODE=true` for offline testing
- **Logging**: Use structured logging via `src/connectors/logging.ts` (connector, operation, accountId, simulation fields)
- **Error Classes**: `UpstreamApiError`, `SimulationFallbackError`, `ConfigurationError`

### Azure Cloud Integration
- **Topology Resolution**: `src/topologyResolver.ts` handles complex multi-region deployments
- **Costing**: `src/costing/costingEngine.ts` provides real-time Azure pricing analysis
- **Infrastructure**: Bicep templates in `infra/azure/bicep/` with global monitoring patterns

## Testing Patterns

### Test Organization
```bash
tests/
├── integration/           # End-to-end network generation
├── connectors/           # Banking connector unit tests
├── fixtures/             # Test data and mocks
└── *.test.ts            # Domain-specific test suites
```

### Key Test Categories
- **Network Validation**: `networkValidator.test.ts` - schema and topology validation
- **File Rendering**: `fileRendering.integration.test.ts` - template rendering with real contexts
- **Banking Integration**: `wellsfargo*.test.ts` - comprehensive financial connector testing
- **Azure Integration**: `regionalTopology.test.ts` - multi-region deployment scenarios

### DI Testing Pattern
```typescript
// Internal test hook for mocking file operations
const context: NetworkContext = {
  // ... standard config
  testHooks: {
    fileRenderingModule: {
      renderTemplateDir: jest.fn(),
      copyFilesDir: jest.fn(),
      validateDirectoryExists: jest.fn().mockReturnValue(true)
    }
  }
};
```

## Integration Points & Dependencies

### External Service Integration
- **Tatum.io**: Virtual accounts, fiat wallets (via `tatum-connector/` submodule)
- **Wells Fargo**: ACH, Wire, RTP, FX (comprehensive adapter suite)
- **Azure Services**: AKS, ACA, VM/VMSS, Log Analytics, Key Vault
- **Blockchain Tools**: Blockscout, Chainlens explorers; Prometheus/Grafana monitoring

### Environment Configuration
```bash
# Required for full functionality
TATUM_API_KEY=your_key
WELLS_FARGO_CLIENT_ID=your_id
WELLS_FARGO_CLIENT_SECRET_REF=vault_reference
AZURE_SUBSCRIPTION_ID=your_sub_id

# Simulation/Testing
SIMULATION_MODE=true
```

### Cross-Domain Communication
- **Shared Types**: `src/networkBuilder.ts` - `NetworkContext` interface
- **Validation**: `src/networkValidator.ts` - aggregates issues without throwing
- **Config Management**: `src/config/` - centralized env/secrets handling

## Release & CI/CD Patterns

### Version Management
```bash
# Semantic versioning workflow
npm version patch|minor|major
npm run build && npm run lint  # Must pass
git commit -m "chore(release): vX.Y.Z"
git tag vX.Y.Z
npm run smoke  # Verify network generation works
```

### CI/CD Integration
- **Multi-Node Testing**: GitHub Actions matrix (Node 18.x, 20.x)
- **Submodule Verification**: `./scripts/submodules/verify.sh --strict` in CI
- **Infrastructure Validation**: Bicep compilation + shellcheck for scripts
- **Coverage Gates**: Jest coverage reports with Codecov integration

## Advanced Integration Examples

### Adding Financial Connector
```typescript
// 1. Implement BankingConnector interface
export class NewBankConnector implements BankingConnector {
  async fetchBalances(): Promise<Balance[]> { /* */ }
  async initiateTransfer(req: TransferRequest): Promise<TransferResult> { /* */ }
}

// 2. Register in connector factory
export function createConnector(type: string): BankingConnector {
  switch (type) {
    case 'new-bank': return new NewBankConnector();
    // ...
  }
}

// 3. Add environment validation + simulation support
```

### Multi-Region Azure Deployment
```bash
# Regional topology with specialized node types
--azureRegionalDistribution "eastus:validators=3+rpc=2,westus2:archive=1+rpc=1"
--azureDeploymentMap "validators=aks,rpc=aca,archive=vmss"
--azureNetworkMode hub-spoke
```

## User Configuration Artifact Conventions
Persistent, versioned configuration examples live under `USER_CONFIGS/` (README + sample manifests tracked via .gitignore exceptions):
- `USER_CONFIGS/USE_CASES/` – workflow definition markdown (flag sets, success criteria)
- `USER_CONFIGS/LOCAL_NETWORKS/` – minimal single-host manifests
- `USER_CONFIGS/DEVNETS/` – developer-optimized presets
- `USER_CONFIGS/PRIVATE_NETWORKS/` – Tessera / privacy focused topologies
- `USER_CONFIGS/TEST_NETWORKS/` – staging & multi-region validation manifests
- `USER_CONFIGS/EXPERIMENTAL/` – prototype DSL / new flag explorations
- `USER_CONFIGS/DEFAULTS/` – `defaults.snapshot.json` captured from dry run + documented defaults

Network manifest schema: `schemas/network-manifest.schema.json` (strict, additionalProperties:false). When adding new manifest fields:
1. Extend `NetworkContext` in `src/networkBuilder.ts`
2. Add CLI flag & question (if interactive exposure needed)
3. Update schema enum/list accordingly
4. Include sample in appropriate `USER_CONFIGS/<domain>/` directory
5. Add a test validating manifest loads & maps to context

Generation script: `scripts/generate-user-config-manifests.sh` seeds baseline manifests and writes `defaults.snapshot.json`. Re-run after changing defaults or adding flags.
