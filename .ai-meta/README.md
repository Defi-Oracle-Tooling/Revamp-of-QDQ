# .ai-meta Directory

Holds orchestration metadata for multi-agent automation and task coordination.

## Current Artifacts

- `manifest.sample.yaml`: Defines agent roles, capabilities, and task sequences for coordinated development
- `diffmap.sample.json`: Maps input sources to generated outputs for change traceability and merge conflict prevention

## Orchestration Files

### Agent Coordination
- `agent-roles.yaml`: Defines specialized agent capabilities (Infra, Network, Validation, Documentation)
- `task-dependencies.json`: Maps inter-agent task dependencies and merge gates
- `branch-strategy.md`: Multi-agent branching and merge strategy documentation

### Validation & Quality
- `validation.log`: Real-time validation results from all agents
- `merge-gates.json`: Quality gate definitions and pass/fail criteria
- `lint-results.json`: Aggregated linting and type-checking results

### Runtime Context
- `run-context.json`: Current execution context, active agents, and coordination state
- `merge-plan.yaml`: Planned merge sequence and conflict resolution strategy
- `rollback-tags.json`: Compatibility tags for controlled rollbacks

## Usage Pattern

1. **Initialization**: Agents read `manifest.sample.yaml` to understand their scope and dependencies
2. **Execution**: Each agent updates `run-context.json` with progress and outputs
3. **Validation**: Continuous validation writes results to `validation.log`
4. **Merging**: `merge-plan.yaml` guides sequential integration with conflict detection
5. **Rollback**: Use `rollback-tags.json` for compatibility-preserved rollbacks

## Agent Isolation

- **Branch Strategy**: Each agent operates in isolated branches (`agent/infra`, `agent/network`, etc.)
- **Merge Control**: Automated merge gates prevent conflicts via dependency analysis
- **Quality Gates**: All changes must pass lint, validation, and integration tests
- **Deterministic Output**: YAML/JSON generation uses consistent formatting to prevent spurious conflicts
