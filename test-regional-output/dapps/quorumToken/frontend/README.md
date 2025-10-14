# Quorum Token Frontend

A Next.js + Wagmi + Chakra UI decentralized application for interacting with a locally generated Quorum/Besu dev network produced by the Multi-Agent Network Orchestrator.

## Features
- Wallet connections (MetaMask, WalletConnect, Coinbase Wallet when available)
- ERC20 QuorumToken read & transfer components
- Modular wagmi configuration for local chain (ID 1337) + mainnet fallback
- Extensible hooks (planned: useTokenBalance)
- Optional health monitor integration (planned)

## Getting Started

```bash
npm install
npm run dev
```
The app runs on http://localhost:3001 by default.

## Environment Variables
Set in `.env.local` (created automatically when using orchestrator flag):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect v2 project identifier |
| `NEXT_PUBLIC_NETWORK_RPC` | Override local RPC endpoint (defaults to http://127.0.0.1:8545) |
| `NEXT_PUBLIC_HEALTH_ENDPOINT` | Health monitor API route or artifact reference |

Example:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=demo-project-id
NEXT_PUBLIC_NETWORK_RPC=http://127.0.0.1:8545
```

## Integration With Orchestrator
When the main CLI is run with:
```bash
node build/index.js --includeDapp quorumToken --outputPath ./my-network
```
The frontend is copied to `./my-network/dapps/quorumToken`. If `--walletconnectProjectId` is supplied an `.env.local` is generated.

### Post-Copy Instructions
The orchestrator generates `dapp-INSTRUCTIONS.md` with quick start steps:
1. `cd dapps/quorumToken`
2. `npm install`
3. `npm run dev`
4. Interact with deployed contracts using provided addresses.

## Scripts
| Script | Description |
|--------|-------------|
| `dev` | Start Next.js in development mode |
| `build` | Production build |
| `start` | Start production server |
| `typecheck` | Run TS type checking |

## Planned Enhancements
- `useTokenBalance` hook for reactive balance polling
- `/api/health` endpoint reading network artifacts
- Automatic build via `scripts/build_dapps.js` when `--buildDapps` flag is provided
- React Testing Library tests for wallet components

## CI Guidance
Recommended pipeline snippet:
```bash
node build/index.js --includeDapp quorumToken --outputPath ./network --noFileWrite=false
(cd ./network/dapps/quorumToken && npm ci && npm run build)
```
Cache `~/.npm` between runs for faster builds.

## Security Notes
- Do not commit private keys or secrets.
- Use read-only RPC endpoints in production contexts.
- Follow root `docs/security.md` for broader guidance.

## Troubleshooting
| Issue | Resolution |
|-------|------------|
| WalletConnect fails | Ensure valid `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` |
| Chain mismatch | Confirm local chain ID = 1337 in wagmi config |
| Health endpoint empty | Generate health artifacts via orchestrator monitoring options |

## License
Apache-2.0 (inherits root project license).
