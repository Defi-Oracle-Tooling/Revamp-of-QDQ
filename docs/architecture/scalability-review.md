# Scalability Review

Date: 2025-10-18
Status: Draft

## Purpose
Assess current module boundaries and identify areas needing further decomposition as features grow.

## Module Size & Complexity Indicators
| Domain | Module | Approx LOC (src) | Indicators | Action |
|--------|--------|------------------|------------|--------|
| finance | value-transfer | high | Multiple connectors, reconciliation logic growing | Plan split: connectors vs reconciliation engine |
| integration | hub | moderate | Heterogeneous adapters (bridges, oracle, defender) | Consider per-integration subpackages |
| infra | cloud-costing | very high | Large pricing & quota logic | Extract pricing core to `pricing-core` |
| production | healthMonitor | high | Benchmark + alerting + dashboards in one | Split: benchmark runner, collectors, exporters |

## Proposed Refactors (Phased)
1. Create `modules/finance/connectors-core` for shared banking abstractions.
2. Extract pricing math to `modules/infra/pricing-core` (pure functions, no I/O).
3. Move Firefly, Chainlink, Defender adapters into `integration/<name>` subfolders with local index exports.
4. Introduce interface package `@shared/logging` consolidating logging helpers.

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Refactor churn breaks imports | Provide barrel exports and deprecation layer for one minor release |
| Test coverage gaps during split | Add coverage gates on new packages and run mutation test dry-run |
| Increased build times | Enable incremental TS project references |

## KPIs Post-Refactor
| KPI | Target |
|-----|--------|
| Avg module build time | < 6s |
| Cross-module import density | -30% |
| Test coverage (critical modules) | > 70% |
| Cyclomatic complexity (top 10 files) | -20% |

---
Next Review: 2025-12-01