# Templates and Static Assets Review

## Summary of Findings

After reviewing `templates/**` and `files/**` directories, the following issues and opportunities were identified:

### Templates (`templates/**`)

#### Current Structure
```
templates/
├── besu/
│   ├── config/
│   └── docker-compose.yml
└── goquorum/
    └── docker-compose.yml
```

#### Issues Found
1. **Limited monitoring support**: Templates only support `elk` and `splunk`, but CLI now supports `loki`
2. **Explorer handling**: Uses separate `blockscout` and `chainlens` flags instead of unified `explorer` option
3. **Missing new variables**: Templates don't leverage new CLI flags like:
   - `azureEnable` and Azure-specific configurations
   - Enhanced node topology (`validators`, `rpcNodes`, `archiveNodes`, etc.)
   - New RPC configuration options
   - Genesis presets and consensus mechanism selection

#### Recommendations
1. **Add Loki support** to both Besu and GoQuorum templates
2. **Implement unified explorer logic** using `explorer` variable with fallback to individual flags
3. **Add Azure deployment sections** conditionally included when `azureEnable` is true
4. **Enhance node topology** to support variable validator/RPC node counts
5. **Add consensus-specific configurations** based on `consensus` variable

### Static Assets (`files/**`)

#### Current Structure
```
files/
├── besu/
│   ├── README.md ✅ (updated)
│   ├── config/
│   ├── quorum-explorer/
│   └── smart_contracts/
├── common/ 
│   ├── Scripts ✅ (list.sh updated)
│   ├── config/
│   ├── dapps/
│   ├── monitoring configs (loki/, splunk/, etc.)
│   └── smart_contracts/
└── goquorum/
    ├── README.md
    ├── config/ 
    ├── quorum-explorer/
    └── smart_contracts/
```

#### Issues Found
1. **Duplication**: Some configs exist in both `besu/` and `goquorum/` that could be in `common/`
2. **Missing Azure assets**: No Azure-specific configuration files or scripts
3. **Outdated monitoring configs**: Some monitoring configurations may not reflect latest versions

#### Recommendations  
1. **Move shared configs to `common/`**: 
   - Shared smart contracts
   - Common monitoring configurations
   - Reusable scripts and utilities
2. **Add Azure asset templates**:
   - Azure Container Apps configurations
   - AKS deployment manifests  
   - Parameter files for Bicep templates
3. **Update monitoring versions**: Ensure all monitoring stack versions are current

### Deduplication Opportunities

#### High Priority
- `smart_contracts/` - Move shared contracts to `common/smart_contracts/`
- `config/prometheus/` - Consolidate Prometheus configs
- `quorum-explorer/` - Evaluate if configurations can be shared

#### Medium Priority  
- Dockerfile templates that differ only in client type
- Shared utility scripts and helpers
- Common environment variable templates

### Template Variable Gaps

The following NetworkContext variables are not yet utilized in templates:

#### Missing in Templates
- `azureEnable` and all Azure-specific options
- `validators`, `rpcNodes`, `archiveNodes` (dynamic node counts)
- `consensus` mechanism selection
- `genesisPreset` for genesis configuration
- `chainId` for custom chain configuration
- `explorer` unified option (still using separate flags)
- `rpcNodeTypes` and `rpcDefaultType`
- `bootNodes`, `memberAdmins`, `memberPermissioned`, etc.

### Implementation Plan

#### Phase 1: Critical Updates
1. Add `loki` monitoring support to templates
2. Implement unified `explorer` logic
3. Add dynamic node count support

#### Phase 2: Enhancement
1. Add Azure deployment configurations
2. Move shared assets to `common/`
3. Add consensus mechanism templating

#### Phase 3: Optimization
1. Full deduplication of shared assets
2. Version updates for all monitoring stacks
3. Enhanced smart contract examples

### Template Update Examples

#### Loki Support Addition
```yaml
{% if monitoring == "loki" %}
  loki:
    image: grafana/loki:latest
    # ... loki configuration
{% endif %}
```

#### Unified Explorer Logic
```yaml
{% if (explorer == "blockscout") or (explorer == "both") or (blockscout and not explorer) %}
  blockscout:
    # ... blockscout configuration  
{% endif %}
```

#### Dynamic Node Topology
```yaml
{% for i in range(validators or 4) %}
  validator{{ i + 1 }}:
    # ... validator node configuration
{% endfor %}
```

### Validation Required

Before implementing changes:
1. Test template rendering with all new variables
2. Verify Docker Compose syntax after changes
3. Ensure backward compatibility with existing deployments
4. Validate Azure-specific templates with actual deployment

### Dependencies

Template updates depend on:
- NetworkContext interface stability (completed)
- CLI flag handling improvements (completed) 
- Topology resolution logic (completed)
- Documentation updates (completed)