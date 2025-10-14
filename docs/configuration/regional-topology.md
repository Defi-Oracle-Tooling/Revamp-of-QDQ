# Regional Network Topology Configuration

🏠 [Documentation Home](../README.md) → [Docs](../docs/) → [Configuration](../docs/configuration/) → **regional-topology**


> **Status:** Active | **Last Updated:** 2025-10-14 | **Version:** 0.4.0

This guide covers enhanced regional topology configuration options for Quorum networks, allowing users to specify regions with detailed node types and subtypes per region.

## Table of Contents

- [Overview](#overview)
- [Configuration Methods](#configuration-methods)
- [Node Types and Subtypes](#node-types-and-subtypes)
- [Network Topology Modes](#network-topology-modes)
- [CLI Parameters](#cli-parameters)
- [Implementation Examples](#implementation-examples)
- [Migration Strategy](#migration-strategy)

## Overview

The regional topology configuration system enables sophisticated multi-region Quorum network deployments with:

- **Per-region node type specification** - Define different node types in each region
- **Network topology modes** - Choose between flat, hub-spoke, or mesh architectures
- **Deployment type mapping** - Map node types to specific Azure deployment types
- **Scalability configuration** - Set scaling parameters per node type and region

### Current Architecture Analysis

#### Existing Configuration Methods

1. **Flat CLI Parameters**: Basic region list with simple node counts
2. **Placement DSL**: Role-based deployment type and region mapping
3. **JSON Topology Files**: Structured configuration with enhanced regional granularity

#### Previous Limitations (Now Resolved)

- ❌ No per-region node type specification → ✅ **Enhanced DSL format**
- ❌ Limited node subtype configuration → ✅ **Comprehensive node specialization**
- ❌ Flat configuration without hierarchical planning → ✅ **JSON topology files**
- ❌ No regional network topology awareness → ✅ **Network topology modes**

## Configuration Methods

### 1. Enhanced DSL Format (Recommended for Simple Cases)

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

### 2. Enhanced JSON Topology Format (Recommended for Complex Cases)

```json
{
  "strategy": "regional-distribution",
  "regions": {
    "eastus": {
      "isPrimary": true,
      "network": {
        "vnetCidr": "10.0.0.0/16",
        "subnetPrefix": "10.0",
        "peeringTarget": null
      },
      "nodeDistribution": {
        "validators": {
          "count": 3,
          "deploymentType": "aks",
          "vmSize": "Standard_D4s_v3",
          "capabilities": ["consensus", "rpc"],
          "scale": { "min": 3, "max": 5 },
          "storage": { "type": "premium", "sizeGB": 100 }
        },
        "rpcNodes": {
          "api": {
            "type": "standard",
            "count": 2,
            "capabilities": ["eth", "web3"],
            "deploymentType": "aca"
          },
          "admin": {
            "type": "admin", 
            "count": 1,
            "capabilities": ["eth", "web3", "admin"],
            "deploymentType": "vm"
          }
        },
        "bootNodes": {
          "count": 1,
          "deploymentType": "vm",
          "vmSize": "Standard_B2ms"
        }
      }
    },
    "westus2": {
      "isPrimary": false,
      "network": {
        "vnetCidr": "10.1.0.0/16", 
        "subnetPrefix": "10.1",
        "peeringTarget": "eastus"
      },
      "nodeDistribution": {
        "validators": {
          "count": 2,
          "deploymentType": "aks"
        },
        "archiveNodes": {
          "count": 1,
          "deploymentType": "vmss",
          "storage": { "type": "premium", "sizeGB": 500 }
        }
      }
    }
  },
  "globalSettings": {
    "consensus": "qbft",
    "networkTopology": "hub-spoke",
    "hubRegion": "eastus"
  }
}
```

### 3. Interactive Regional Wizard

```bash
npx quorum-dev-quickstart --interactive --azureRegionalWizard
```

**Flow**:
1. Select regions from Azure region list
2. Configure primary region designation
3. Specify node types per region with counts
4. Set deployment types and VM sizing
5. Configure network topology (flat/hub-spoke/mesh)
6. Review and confirm configuration

## Node Types and Subtypes

### Validator Node Subtypes
- **Primary**: Full consensus participation with block production
- **Backup**: Standby validators for automatic failover scenarios
- **Observer**: Non-participating consensus observers for monitoring

### RPC Node Subtypes
- **Standard**: Basic eth/web3 API access (`api:standard:2`)
- **Admin**: Administrative operations (`admin:admin:1`) - miner, admin namespace
- **Trace**: Transaction tracing (`trace:trace:1`) - debug_traceTransaction
- **Debug**: Advanced debugging capabilities - full debug namespace
- **Archive**: Historical state access with full state history

### Member Node Subtypes (Privacy Networks)
- **Permissioned**: Permissioned transaction processing with policy enforcement
- **Private**: Private transaction capability with Tessera/Orion
- **Public**: Public transaction processing only

### Archive Node Variants
- **Full**: Complete blockchain history with all state
- **Pruned**: Recent state with older state pruned
- **Snapshot**: Fast sync with periodic snapshots

## Network Topology Modes

### Flat Network
- All regions in single virtual network
- Direct connectivity between all nodes
- **Best for**: Low-latency requirements, ≤3 regions
- **Cost**: Moderate (single VNet)

### Hub-Spoke
- Central hub region with spoke regions
- Traffic routed through hub region
- **Best for**: Cost optimization with many regions
- **Requirements**: Designated hub region

```bash
--azureNetworkMode hub-spoke --azureHubRegion eastus
```

### Mesh Network
- Full connectivity between all regions
- Highest availability and performance
- **Best for**: High availability requirements
- **Limitations**: Cost scales quadratically, recommend ≤5 regions

## CLI Parameters

### New Regional Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `--azureRegionalDistribution` | Per-region node allocation DSL | `"eastus:validators=3+rpc=2"` |
| `--azureDeploymentMap` | Node type to deployment mapping | `"validators=aks,rpc=aca"` |
| `--azureRegionalConfig` | Path to enhanced JSON config | `"./topology.json"` |
| `--azureNetworkMode` | Network topology mode | `hub-spoke` |
| `--azureHubRegion` | Hub region designation | `eastus` |

### Enhanced Existing Parameters

| Parameter | Enhancement | Backward Compatible |
|-----------|-------------|-------------------|
| `--azureTopologyFile` | Support new JSON schema | ✅ Yes |
| `--rpcNodeTypes` | Regional RPC specialization | ✅ Yes |
| `--azureNodePlacement` | Enhanced parsing | ✅ Yes |

## Implementation Examples

### Multi-Region Development Network

```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureRegionalDistribution "eastus:validators=3+rpc=2+boot=1,westus2:validators=2+rpc=1" \
  --azureNetworkMode hub-spoke \
  --azureHubRegion eastus \
  --outputPath ./dev-multi-region
```

### Production Network with Specialization

```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureTopologyFile ./production-topology.json \
  --rpcNodeTypes "api:standard:3;admin:admin:1;trace:trace:2" \
  --azureNetworkMode mesh \
  --outputPath ./prod-network
```

### Privacy Network Configuration

```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --azureRegionalDistribution "eastus:validators=4+member=3+rpc=2,centralus:member=2+rpc=1" \
  --memberNodeTypes "permissioned:2;private:3;public:1" \
  --azureNetworkMode flat
```

### High Availability Archive Network

```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureRegionalDistribution "eastus:validators=3+archive=2,westus2:validators=2+archive=1,northeurope:archive=1" \
  --azureDeploymentMap "validators=aks,archive=vmss" \
  --azureNetworkMode mesh
```

## Validation Rules

### Regional Constraints
- **Minimum validators per region**: 1 (for consensus participation)
- **Boot node distribution**: Recommended across regions for resilience
- **Primary region requirement**: Must contain ≥51% of total validators
- **Archive node redundancy**: Recommended distribution across regions

### Network Topology Constraints
- **Hub-spoke**: Requires designated hub region with adequate capacity
- **Mesh topology**: Limited to 5 regions (cost optimization)
- **Flat network**: Recommended for ≤3 regions due to complexity

### Resource Constraints
- **Total node count**: Limited by Azure subscription quotas
- **Regional capacity**: Varies by Azure region availability
- **Cross-region bandwidth**: Consider network costs and latency

## Migration Strategy

### Backward Compatibility

All existing parameters remain functional:
- `--azureRegions "eastus,westus2"` → Works as before
- `--azureNodePlacement "validators:aks:eastus"` → Enhanced parsing
- Legacy topology files → Supported with defaults

### Migration Steps

#### From Flat Configuration
```bash
# Before (flat)
--azureRegions "eastus,westus2" --validators 4

# After (regional)
--azureRegionalDistribution "eastus:validators=2,westus2:validators=2"
```

#### From Basic DSL
```bash
# Before (basic DSL)
--azureNodePlacement "validators:aks:eastus+westus2"

# After (enhanced DSL)
--azureRegionalDistribution "eastus:validators=2,westus2:validators=2" \
--azureDeploymentMap "validators=aks"
```

#### To JSON Configuration
1. **Assessment**: Analyze current parameter complexity
2. **Translation**: Convert DSL to structured JSON
3. **Enhancement**: Add regional-specific optimizations
4. **Validation**: Test enhanced configuration

## Advanced Features

### Auto-scaling Configuration
```json
{
  "validators": {
    "scale": {
      "min": 3,
      "max": 7,
      "targetCPU": 70,
      "scaleUpDelay": "5m",
      "scaleDownDelay": "15m"
    }
  }
}
```

### Cost Optimization
- **Regional instance sizing**: Automatic size recommendations per region
- **Network topology costs**: Cost estimation for different topologies
- **Storage optimization**: Intelligent storage type selection

### Performance Monitoring
- **Regional latency metrics**: Cross-region communication monitoring
- **Consensus performance**: Regional validator performance tracking
- **Resource utilization**: Per-region resource usage analytics

## Troubleshooting

### Common Issues

#### Regional Validation Errors
```bash
# Error: Invalid region name
Error: Region 'eastus-invalid' not found in Azure regions list

# Solution: Use valid Azure region names
--azureRegionalDistribution "eastus:validators=2,westus2:validators=2"
```

#### Network Topology Conflicts
```bash
# Error: Hub region not specified for hub-spoke topology
Error: --azureNetworkMode hub-spoke requires --azureHubRegion

# Solution: Specify hub region
--azureNetworkMode hub-spoke --azureHubRegion eastus
```

#### Resource Quota Issues
```bash
# Error: Insufficient regional capacity
Error: Region 'westeurope' lacks capacity for 10 Standard_D4s_v3 VMs

# Solution: Adjust VM sizes or redistribute nodes
--azureSizeMap "validators=Standard_D2s_v3"
```

### Debug Mode
```bash
# Enable detailed validation logging
npx quorum-dev-quickstart \
  --validate true \
  --noFileWrite true \
  --azureRegionalDistribution "eastus:validators=3+rpc=2"
```

## Performance Considerations

### Scaling Recommendations
- **Small networks** (≤10 nodes): Single region with flat topology
- **Medium networks** (11-50 nodes): 2-3 regions with hub-spoke
- **Large networks** (50+ nodes): Multi-region mesh with archive distribution

### Cost Optimization Tips
1. **Use hub-spoke topology** for cost-sensitive deployments
2. **Distribute archive nodes** strategically based on access patterns
3. **Right-size VM instances** based on expected load
4. **Consider regional pricing differences** in Azure regions

## Future Enhancements

### Planned Features
- **Auto-scaling policies**: Dynamic node scaling based on load
- **Cost estimation**: Real-time cost calculation for configurations
- **Performance optimization**: Automatic region selection based on latency
- **Disaster recovery**: Cross-region backup and failover automation

### Experimental Features
- **Multi-cloud support**: Support for AWS and GCP regions
- **Edge deployment**: IoT and edge device integration
- **Advanced consensus**: Regional consensus with global finality

---

For additional information and examples, see:
- [CLI Reference](cli-reference.md) - Complete CLI parameter documentation
- [Azure Services Integration](../integrations/azure-services/) - Azure-specific deployment guides
- [Deployment Guide](../operations/deployment-guide.md) - Production deployment strategies
---

**📝 Edit this page**: [Edit on GitHub](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/edit/feat/regional-topology-config/docs/configuration/regional-topology.md)
