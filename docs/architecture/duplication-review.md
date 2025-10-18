# Duplication Review

Date: 2025-10-18
Status: Initial

## Identified Duplication Areas

| Area | Files | Nature | Recommendation |
|------|-------|--------|----------------|
| Simulation Fallback Logging | `src/connectors/*`, `integrations/*` | Repeated pattern of simulation log lines | Extract `logSimulation(context, op, reason)` util |
| Env Var Parsing | Wells Fargo config, Tatum adapter, Firefly adapter | Ad-hoc parsing & validation | Centralize in `src/config/env.ts` with schema map |
| Offline/Online Flags | Multiple adapters using `process.env.SIMULATION_MODE` | Repetition of toggle logic | Create `getSimulationMode()` helper |
| Azure Topology Parsing vs Enhanced Topology | `topologyResolver.ts`, `regionalTopology.ts` | Overlap in DSL normalization | Unify into single parser with strategy pattern |
| Compliance Checks | Tatum AML/Sanctions simulation vs Wells Fargo compliance | Similar console logging + fallback | Shared compliance service interface |

## Quick Wins
1. Introduce `src/common/simulation.ts` exporting `isSimulation()`.
2. Create `src/common/logging/simulation.ts` for standardized simulation log wrapper.
3. Add `src/config/envSchema.ts` with declarative schema + validator.

## Deferred (Needs Design)
* Unified topology parser (risk: subtle behavior changes)
* Compliance abstraction (requires stable domain model)

## Metrics to Track
| Metric | Baseline | Target |
|--------|----------|--------|
| Lines duplicated (eslint rule estimate) | TBD | -25% |
| Adapters with custom simulation code | 8 | < 2 |
| Distinct env parsing functions | 6 | 1 |

---
Follow-up issues should reference this document and link specific sections.