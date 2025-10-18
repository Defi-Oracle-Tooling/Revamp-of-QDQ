# Multi-Repo Strategy & Connector Roadmap

## Overview
This project is evolving to a multi-repo architecture, with each connector and major module as a standalone repository. This enables independent CI, versioning, and release cycles, and simplifies cross-team collaboration.

## Current Submodules
- 6-DOF-4-HL-Chains
- az-billing
- wf-vantage-api
- (planned) marrionette-exchange
- (planned) BNI API connector
- Tatum connector (root-level submodule)
### Tatum Connector Submodule

The Tatum connector is integrated as a submodule at `tatum-connector/` from [absolute-realms/tatum-connector](https://github.com/absolute-realms/tatum-connector). Legacy import compatibility is provided via `src/tatum.ts` in the submodule.
 - (planned) azure-toolkit

## Separation Goals
- Autonomy: Each repo has its own CI, versioning, and release process.
- Dependency boundaries: Only stable APIs exposed; no deep imports.
- Documentation: Each repo maintains its own README and API docs.
- Security: Least-privilege tokens per repo.


## Recommended Tooling for Connector Repos

- **CI/CD:**
	- GitHub Actions: Automated lint, build, test, release workflows
	- Example workflow: `.github/workflows/ci.yml` with jobs for lint, test, build, publish
	- Status badges in README
- **Semantic Versioning:**
	- Use `npm version` or `git tag` for releases
	- Maintain `CHANGELOG.md` in each repo
	- Enforce semver via release workflow
- **Dependency Management:**
	- Use `package.json` for npm packages (if TypeScript/Node)
	- Pin dependencies and use `renovate.json` for automated updates
	- Document peer dependencies in README
- **Release Automation:**
	- Use GitHub Releases or npm publish (if applicable)
	- Automated changelog generation (e.g. `auto-changelog`)
- **Testing:**
	- Jest or Mocha for unit/integration tests
	- Contract tests for API boundaries
	- Coverage reporting via Codecov or Coveralls

## Planned Steps
1. Extract each connector to its own repo (if not already).
2. Add CI workflows (lint, build, test, release) to each repo.
3. Use semantic versioning and changelogs per repo.
4. Parent repo consumes connectors via submodules or npm packages.
5. Add contract tests and integration docs.

## Connector Abstraction
All connectors (Wells Fargo, BNI, Tatum, Marrionette, etc.) implement the shared `BankingConnector` interface in `src/connectors/bankingConnector.ts` and are instantiated through the `createConnector(type)` factory. Each adapter lives in its own file under `src/connectors/adapters/` to maintain lint constraints (single class per file) and simplify replacement with fully-featured submodule implementations.

### Logging & Error Handling Standard
Connectors must use the centralized logger in `src/connectors/logging.ts` (`pino` based) with helpers:
* `logConnectorInfo(context, message)`
* `logConnectorError(context, error)`
* `logSimulationFallback(context, reason)`

Context object fields: `connector`, `operation`, optional `accountId`, `referenceId`, `simulation`.

### Simulation Mode
### Exchange Abstraction
`MarrionetteConnector` implements `ExchangeConnector` (see `src/connectors/exchangeConnector.ts`) providing quote + swap execution (simulation-first). Future DEX connectors (Dodoex, Uniswap, etc.) should implement the same interface for unified routing.

### Environment Variable Standard
| Component | Variables | Notes |
|----------|-----------|-------|
| Wells Fargo | WELLS_FARGO_BASE_URL, WELLS_FARGO_CLIENT_ID, WELLS_FARGO_CLIENT_SECRET_REF | Secrets may be vault references |
| Tatum | TATUM_API_KEY, TATUM_TESTNET | Testnet boolean flag controls base URL |
| BNI | BNI_API_KEY, BNI_BASE_URL | Optional during early simulation phase |
| Simulation | SIMULATION_MODE | Global simulation toggle |
Setting `SIMULATION_MODE=true` forces offline behavior for supported connectors (currently Tatum; Wells Fargo & BNI fall back automatically if disabled). Simulation events are logged with `Simulation fallback` reason for observability. This enables deterministic CI runs without external API dependencies.


## Risks & Mitigations

- **Version Drift:**
	- Mitigation: Use contract tests, regular submodule syncs, and automated update scripts.
- **Breaking Changes:**
	- Mitigation: Enforce semantic versioning, changelog updates, and integration tests before merging.
- **Dependency Conflicts:**
	- Mitigation: Pin dependencies, use Renovate for updates, and document peer dependencies.
- **Cross-Repo API Changes:**
	- Mitigation: Document change process, require API contract tests, and automate dependency update PRs.
- **Security Risks:**
	- Mitigation: Use least-privilege tokens, rotate secrets, and audit submodule origins.
- **Onboarding Errors:**
	- Mitigation: Use standardized onboarding scripts and update documentation for each new connector.


## Migration Execution Checklist

1. Create remote repo for connector (e.g. Defi-Oracle-Tooling/tatum-connector)
2. Extract connector code to new repo
3. Add README, CHANGELOG, and .env.example to new repo
4. Set up CI/CD workflows (lint, test, build, release)
5. Add submodule to parent repo using `scripts/submodules/add-submodule.sh`
6. Update all code/scripts/docs to reference new submodule path
7. Validate integration with parent repo (run tests, scripts)
8. Document integration steps in both repos
9. Automate future submodule onboarding via script

## Expanded Multi-Repo Documentation

- Each connector repo maintains its own documentation, CI/CD, and changelog
- Parent repo references connectors via submodules and documents integration points
- Automated script (`add-submodule.sh`) standardizes onboarding for all future connectors
- Risks and mitigations documented for cross-repo changes, version drift, and dependency updates

## Execution Checklist
- [x] Assess submodules
- [x] Define separation goals
- [x] Plan repo extraction
- [x] Recommend tooling
- [ ] Risk & mitigation
- [x] Execution checklist
- [x] Add connector abstraction
- [x] Add docs for multi-repo
- [ ] Update README

## Roadmap
- Add Marionette exchange repo and connector ([Defi-Oracle-Tooling/marionette](https://github.com/Defi-Oracle-Tooling/marionette))
- Add BNI API repo and connector
- Add Tatum repo and connector
- Document integration and test strategy
