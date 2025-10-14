# Regional Network Topology Configuration Specification

## Overview

This document specifies enhanced regional topology configuration options for Quorum networks, allowing users to specify regions with detailed node types and subtypes per region.

## Current Architecture Analysis

### Existing Configuration Methods

1. **Flat CLI Parameters**: Basic region list with simple node counts
2. **Placement DSL**: Role-based deployment type and region mapping
3. **JSON Topology Files**: Structured configuration with limited regional granularity

### Current Limitations

- No per-region node type specification
- Limited node subtype configuration
- Flat configuration doesn't support hierarchical regional planning
- No regional network topology awareness

## Enhanced Configuration Specification

### 1. Regional Distribution DSL

**Format**: `region:nodeConfig,region2:nodeConfig2`
**Node Config**: `nodeType=count+nodeType2=count2`

```bash
# Example: 3 validators + 2 RPC in east, 2 validators + 1 archive in west
--azureRegionalDistribution "eastus:validators=3+rpc=2+boot=1,westus2:validators=2+archive=1"
```

**Supported Node Types**:
- `validators` - Consensus validator nodes
- `rpc` - RPC endpoint nodes (can be specialized)
- `boot` - Network bootstrap nodes  
- `archive` - Archive/historical data nodes
- `member` - Member nodes for privacy networks
- `observer` - Read-only observer nodes

### 2. Enhanced JSON Topology Format

```json
{
  "strategy": "regional-distribution",
  "regions": {
    "regionName": {
      "isPrimary": boolean,
      "network": {
        "vnetCidr": "CIDR",
        "subnetPrefix": "prefix",
        "peeringTarget": "region"
      },
      "nodeDistribution": {
        "nodeType": {
          "count": number,
          "deploymentType": "aks|aca|vm|vmss",
          "vmSize": "string",
          "capabilities": ["list"],
          "scale": { "min": 1, "max": 10 },
          "storage": { "type": "standard|premium", "sizeGB": number }
        },
        "rpcNodes": {
          "subtype": {
            "type": "standard|admin|trace|debug",
            "count": number,
            "capabilities": ["eth", "web3", "admin", "debug"]
          }
        }
      }
    }
  },
  "globalSettings": {
    "consensus": "qbft|ibft|clique",
    "networkTopology": "flat|hub-spoke|mesh",
    "hubRegion": "region"
  }
}
```

### 3. Node Type Specialization

#### RPC Node Subtypes
- **Standard**: Basic eth/web3 API access
- **Admin**: Administrative operations (miner, admin namespace)
- **Trace**: Transaction tracing and debugging
- **Debug**: Advanced debugging capabilities
- **Archive**: Historical state access

#### Validator Node Subtypes  
- **Primary**: Full consensus participation
- **Backup**: Standby validators for failover
- **Observer**: Non-participating consensus observers

#### Member Node Subtypes (Privacy Networks)
- **Permissioned**: Permissioned transaction processing
- **Private**: Private transaction capability
- **Public**: Public transaction processing only

### 4. Network Topology Modes

#### Flat Network
- All regions in single virtual network
- Direct connectivity between all nodes
- Suitable for low-latency requirements

#### Hub-Spoke
- Central hub region with spoke regions
- Traffic routed through hub
- Cost-optimized for many regions

#### Mesh Network
- Full connectivity between all regions
- Highest availability and performance
- Higher cost due to multiple peering connections

## Implementation Strategy

### Phase 1: Enhanced DSL Support
1. Add `--azureRegionalDistribution` CLI parameter
2. Extend `parsePlacementDsl()` function for regional parsing
3. Update `resolveAzureTopology()` to handle per-region configuration

### Phase 2: JSON Schema Extension
1. Extend `TopologyFile` interface with regional structure
2. Add validation for regional node distribution
3. Implement regional network topology resolution

### Phase 3: Interactive Configuration
1. Add regional topology wizard to question flow
2. Visual region/node type selection interface
3. Configuration validation and preview

## CLI Parameter Extensions

### New Parameters
- `--azureRegionalDistribution <config>`: Per-region node allocation
- `--azureDeploymentMap <mapping>`: Node type to deployment type mapping  
- `--azureNetworkMode <mode>`: Network topology mode (flat|hub-spoke|mesh)
- `--azureHubRegion <region>`: Hub region for hub-spoke topology
- `--azureRegionalConfig <path>`: Path to enhanced regional JSON config

### Enhanced Existing Parameters
- `--azureTopologyFile`: Support new JSON schema format
- `--rpcNodeTypes`: Regional RPC node specialization
- `--azureNodePlacement`: Backward compatibility with enhanced parsing

## Validation Rules

### Regional Constraints
- At least one validator per region (for consensus participation)
- Boot nodes distributed across regions for resilience
- Primary region must contain at least 51% of validators
- Archive nodes should be distributed for redundancy

### Network Topology Constraints  
- Hub-spoke requires designated hub region
- Mesh topology limited to 5 regions (cost optimization)
- Flat network recommended for ≤3 regions

### Resource Constraints
- Total node count limits per subscription
- Regional capacity limits (varies by region)
- Cross-region bandwidth considerations

## Examples

### Multi-Region Development Network
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureRegionalDistribution "eastus:validators=3+rpc=2+boot=1,westus2:validators=2+rpc=1" \
  --azureNetworkMode hub-spoke \
  --azureHubRegion eastus
```

### Production Network with Specialization
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureTopologyFile ./production-topology.json \
  --rpcNodeTypes "api:standard:3;admin:admin:1;trace:trace:2" \
  --azureNetworkMode mesh
```

### Privacy Network Configuration  
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --azureRegionalDistribution "eastus:validators=4+member=3+rpc=2,centralus:member=2+rpc=1" \
  --memberNodeTypes "permissioned:2;private:3;public:1"
```

## Migration Path

### Backward Compatibility
- Existing `--azureRegions` and `--azureNodePlacement` parameters remain functional
- Enhanced parsing detects format and routes to appropriate handler
- Legacy topology files continue to work with defaults applied

### Migration Steps
1. **Assessment**: Analyze current configuration complexity
2. **Translation**: Convert flat parameters to regional format  
3. **Enhancement**: Add regional-specific optimizations
4. **Validation**: Test enhanced configuration functionality

## Technical Debt & Future Enhancements

### Potential Improvements
- **Auto-scaling**: Regional auto-scaling based on load
- **Cost Optimization**: Automatic region selection based on cost
- **Performance Monitoring**: Regional performance metrics
- **Disaster Recovery**: Cross-region backup and failover

### Known Limitations
- Regional network peering costs not automatically calculated
- Limited validation of cross-region latency impacts
- No automatic region selection based on compliance requirements
- Manual configuration complexity for large multi-region deployments