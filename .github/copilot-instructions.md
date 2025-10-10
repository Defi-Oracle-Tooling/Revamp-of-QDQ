# AI Coding Agent Instructions

## Purpose

Scaffold local Quorum (Hyperledger Besu / GoQuorum) dev networks using the CLI (`quorum-dev-quickstart`). The CLI renders Nunjucks templates (`templates/**`) and copies static assets (`files/**`) into a fresh output directory. Optimize for correctness, minimal surprise overwrites, and fast addition of new selectable features. Only modify files directly tied to the stated change (feature flag, template, question flow, or docs snippet).

## Architecture & Major Components

- **Entry Point:** `src/index.ts` (compiled to `build/index.js`). CLI can run interactively (question flow) or via yargs flags.
- **Network Generation:** Answers are mapped to a `NetworkContext` object, which drives `buildNetwork` to render templates and copy files.
- **Templates:** Use Nunjucks for files needing variable substitution. Only reference `NetworkContext` keys.
- **Static Assets:** Place in `files/**`. No template syntax. Executable scripts (e.g., `run.sh`, `stop.sh`) must retain mode.
- **Client Split:** Top-level `besu/` and `goquorum/` directories. Shared assets live in `common/` to prevent divergence.

## Developer Workflow

- **Build:** `npm install && npm run build`
- **Lint:** `npm run lint`
- **Run Interactive:** `node build/index.js`
- **Run Non-Interactive:** `node build/index.js --clientType besu --privacy true --monitoring loki --blockscout false --chainlens false --outputPath ./quorum-test-network`
- **Verify:** Ensure generated directory contains expected client subset and executable scripts retain mode.

## Project-Specific Patterns

- **Never overwrite existing user files:** `renderFileToDir` throws if target exists.
- **Add Feature Flags:** Update `NetworkContext`, question flow, yargs options, templates, and README example invocation.
- **Error Handling:** Always settle spinner (`succeed`/`fail`). Maintain top-level error formatting.
- **Parallelization:** Synchronous FS calls for deterministic ordering. Only parallelize independent template/question additions.
- **Scope Control:** Only change lines tied to the stated feature/bug. Document new flags with a single concise example.

## Integration Points

- **Docker Compose:** Generated networks rely on Docker and Docker Compose. See `README.md` for troubleshooting and platform-specific notes.
- **Smart Contracts & DApps:** Example contracts and DApps (e.g., Truffle Pet-Shop, Hardhat/Next.js DApp) are in `files/common/dapps/` and `files/besu/smart_contracts/`.
- **Monitoring/Logging:** Optional integration with Prometheus, Grafana, Splunk, ELK. Extend via enum and assets in `templates/common/` and `files/common/`.

## Release & Versioning

- Bump `version` in `package.json` (semver).
- Build and lint must be clean before commit.
- Commit message: `chore(release): vX.Y.Z` + tag.
- Publish only after verifying generated network with a smoke run.

## Example: Adding a Monitoring Provider

1. Extend `monitoring` union in `NetworkContext`.
2. Add option to question flow and yargs.
3. Add assets/templates as needed.
4. Update README with a single example command.

## References

- Main workflow: `src/index.ts`, `src/networkBuilder.ts`, `src/questionRenderer.ts`
- Templates: `templates/**`
- Static assets: `files/**`
- Example network README: `files/besu/README.md`, `files/goquorum/README.md`
- DApp example: `files/common/dapps/quorumToken/README.md`

---
