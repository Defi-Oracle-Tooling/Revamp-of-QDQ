# Multi-Agent Branch Strategy

## Branch Structure

```
main (Mistress)
├── agent/infra           # Infrastructure Agent
├── agent/network         # Network Agent  
├── agent/validation      # Validation Agent
├── agent/documentation   # Documentation Agent
└── integration/staging   # Pre-merge integration testing
```

## Workflow

### Phase 1: Parallel Development
1. Each agent creates feature branch from `main`
2. Agents work independently on their scope areas
3. Continuous validation runs on each branch
4. Changes pushed to respective `agent/*` branches

### Phase 2: Integration Staging
1. `integration/staging` branch created from latest `main`
2. Agent branches merged sequentially based on dependencies:
   - `agent/validation` (foundational schemas)
   - `agent/network` (core logic)
   - `agent/infra` (cloud resources)  
   - `agent/documentation` (final updates)
3. Full integration tests run on staging branch
4. Merge conflicts resolved with deterministic rules

### Phase 3: Production Merge
1. Validated staging branch merged to `main`
2. Version tag created (`vX.Y.Z-qdq`)
3. Compatibility tag preserved for rollback (`vX.Y-compat`)

## Merge Gates

### Quality Requirements
- ✅ TypeScript compilation clean
- ✅ ESLint passes without errors
- ✅ Jest tests achieve >80% coverage
- ✅ Bicep/ARM templates validate
- ✅ Generated output deterministic

### Conflict Prevention
- **File Ownership**: Clear agent boundaries prevent overlapping edits
- **Template Standards**: Consistent Nunjucks formatting
- **JSON/YAML**: Sorted keys, consistent spacing
- **Documentation**: Atomic updates, clear section ownership

## Rollback Strategy

### Backward Compatibility Tags
- Major features tagged as `vX.Y-compat` before breaking changes
- CLI flags deprecated with migration warnings before removal
- Template changes maintain backward compatibility for 1 major version

### Emergency Rollback
1. Identify last known good compatibility tag
2. Create hotfix branch from compatibility tag
3. Apply minimal fix maintaining compatibility
4. Fast-track through reduced validation suite
5. Merge with expedited review process

## Coordination Rules

### Agent Scope Boundaries
- **Infra Agent**: `infra/`, cloud templates, deployment scripts
- **Network Agent**: `src/`, core logic, network building, topology resolution  
- **Validation Agent**: `tests/`, schemas, validation logic, quality gates
- **Documentation Agent**: `README.md`, `docs/`, `.github/`, examples

### Cross-Agent Communication
- Shared interfaces defined in `src/types.ts`
- Breaking changes require approval from affected agents
- Integration tests validate cross-agent compatibility
- Merge order respects dependency graph

### Merge Timing
- **Daily Integration**: Staging branch updated daily during active development
- **Weekly Releases**: Production merges weekly unless hotfix required
- **Feature Freeze**: 48-hour freeze before major releases for stability testing
- **Hotfix Window**: Emergency fixes can bypass normal merge gates with approval