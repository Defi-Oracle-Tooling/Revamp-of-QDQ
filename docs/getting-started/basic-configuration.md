# Basic Configuration

🏠 [Documentation Home](../README.md) → [Docs](../docs/) → [Getting-started](../docs/getting-started/) → **basic-configuration**


> **Status:** Active | **Last Updated:** 2025-10-14 | **Version:** 0.4.0

This guide covers essential configuration options for Revamp of QDQ, helping you understand how to customize your blockchain networks for different use cases.

## Table of Contents

- [Configuration Overview](#configuration-overview)
- [Core Network Settings](#core-network-settings)
- [Node Topology Configuration](#node-topology-configuration)
- [Privacy Configuration](#privacy-configuration)
- [Monitoring and Observability](#monitoring-and-observability)
- [Integration Features](#integration-features)
- [Configuration Examples](#configuration-examples)

## Configuration Overview

Revamp of QDQ offers three ways to configure your network:

1. **Interactive Mode**: Guided setup with questions and validation
2. **Command Line**: Direct parameter specification for automation
3. **Configuration Files**: JSON/YAML files for complex scenarios

### Configuration Hierarchy
```
Command Line Parameters > Environment Variables > Configuration Files > Defaults
```

## Core Network Settings

### Client Selection
Choose between supported Ethereum clients:

```bash
# Hyperledger Besu (recommended for new projects)
--clientType besu

# GoQuorum (for existing GoQuorum projects)
--clientType goquorum
```

**Besu vs GoQuorum:**
- **Besu**: Better performance, active development, enterprise features
- **GoQuorum**: Legacy compatibility, existing project migration

### Consensus Mechanisms
Select the appropriate consensus algorithm:

```bash
# QBFT (recommended for production)
--consensus qbft

# IBFT (legacy, for compatibility)
--consensus ibft

# Clique (Proof of Authority)
--consensus clique

# Ethash (Proof of Work, testing only)
--consensus ethash
```

**Consensus Comparison:**
| Algorithm | Best For | Min Validators | Byzantine Fault Tolerance |
|-----------|----------|---------------|---------------------------|
| **QBFT** | Production | 4 | Yes (33% faulty nodes) |
| **IBFT** | Legacy compatibility | 4 | Yes (33% faulty nodes) |
| **Clique** | Development/testing | 1 | No |
| **Ethash** | Testing only | 1 | No |

### Network Identity
Configure network identification:

```bash
# Custom Chain ID (default: 1337)
--chainId 12345

# Custom network name (affects generated configs)
--outputPath ./my-custom-network
```

## Node Topology Configuration

### Basic Node Counts
Configure the fundamental network structure:

```bash
# Validator nodes (participate in consensus)
--validators 4          # Default: 4, Min: 1 for Clique, 4 for QBFT/IBFT

# Participant nodes (non-validator members)  
--participants 2        # Default: 3

# RPC nodes (API endpoints)
--rpcNodes 2           # Default: 1

# Archive nodes (full history)
--archiveNodes 1       # Default: 0

# Boot nodes (network discovery)
--bootNodes 1          # Default: 1
```

### Node Specialization
Configure specialized node types:

```bash
# RPC node types with capabilities
--rpcNodeTypes "api:standard:2;admin:admin:1;trace:trace:1"

# Member node types (privacy networks)
--memberNodeTypes "permissioned:2;private:1;public:1"
```

**RPC Node Types:**
- **standard**: Basic eth/web3 APIs
- **admin**: Administrative functions (miner, admin namespace)
- **trace**: Transaction tracing (debug_traceTransaction)
- **debug**: Full debugging capabilities
- **archive**: Historical state queries

### Network Sizing Guidelines

#### Development Networks
```bash
# Minimal (single developer)
--validators 1 --participants 0 --rpcNodes 1 --monitoring none

# Small team (2-5 developers)
--validators 1 --participants 1 --rpcNodes 1 --monitoring loki

# Medium team (5-10 developers) 
--validators 4 --participants 2 --rpcNodes 2 --monitoring loki
```

#### Testing Networks
```bash
# Integration testing
--validators 4 --participants 3 --rpcNodes 2 --archiveNodes 1

# Load testing
--validators 7 --participants 5 --rpcNodes 3 --archiveNodes 2
```

#### Production-Like Networks
```bash
# Single region production-like
--validators 7 --participants 4 --rpcNodes 3 --archiveNodes 2 --monitoring splunk

# Multi-region production-like
--azureRegionalDistribution "eastus:validators=4+rpc=2,westus2:validators=3+archive=1"
```

## Privacy Configuration

### Privacy Networks
Enable private transaction capabilities:

```bash
# Basic privacy (Tessera with Besu)
--clientType besu --privacy true

# Privacy with GoQuorum (Tessera/Constellation)
--clientType goquorum --privacy true
```

### Privacy Manager Configuration
```bash
# Tessera configuration (automatic with --privacy true)
# Privacy manager: Tessera
# Enclave: Built-in Tessera enclave
# Key generation: Automatic per node
```

**Privacy Features:**
- **Private Contracts**: Deploy contracts visible only to specified parties
- **Private Transactions**: Send transactions between specified participants
- **Privacy Groups**: Manage groups of nodes for private interactions

### Privacy Network Topology
```bash
# Privacy-enabled network with member specialization
--clientType besu --privacy true \
--validators 4 \
--memberPermissioned 2 \
--memberPrivate 3 \
--memberPublic 1
```

## Monitoring and Observability

### Monitoring Stack Selection
Choose appropriate monitoring for your environment:

```bash
# Development (lightweight)
--monitoring loki

# Production (full observability)
--monitoring splunk

# Enterprise (ELK stack)
--monitoring elk

# No monitoring (minimal resources)
--monitoring none
```

**Monitoring Comparison:**
| Stack | Best For | Components | Resource Usage |
|-------|----------|------------|----------------|
| **loki** | Development/testing | Loki, Grafana, Promtail | Low |
| **splunk** | Enterprise production | Splunk Enterprise | High |
| **elk** | Log analysis focus | Elasticsearch, Logstash, Kibana | Medium-High |
| **none** | Minimal setups | None | Minimal |

### Block Explorer Configuration
Enable blockchain explorers for network visibility:

```bash
# Blockscout (full-featured explorer)
--explorer blockscout

# Chainlens (enterprise analytics)
--explorer chainlens

# Both explorers
--explorer both

# No explorer
--explorer none
```

### Custom Monitoring Configuration
```bash
# Advanced monitoring with custom dashboards
--monitoring splunk \
--explorer blockscout \
--outputPath ./enterprise-network
```

## Integration Features

### Azure Cloud Integration
Configure Azure deployment capabilities:

```bash
# Enable Azure deployment scaffolding
--azureEnable true

# Basic Azure configuration
--azureRegions "eastus,westus2" \
--azureDeploymentDefault aks

# Advanced regional topology
--azureRegionalDistribution "eastus:validators=3+rpc=2,westus2:validators=2+archive=1" \
--azureNetworkMode hub-spoke \
--azureHubRegion eastus
```

### External Service Integration
```bash
# Cloudflare DNS integration
--cloudflareZone example.com \
--cloudflareApiTokenEnv CF_API_TOKEN
```

## Configuration Examples

### Simple Development Network
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy false \
  --validators 1 \
  --participants 1 \
  --monitoring loki \
  --outputPath ./dev-network
```

### Privacy-Enabled Testing Network
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --validators 4 \
  --participants 2 \
  --memberPrivate 2 \
  --monitoring loki \
  --explorer blockscout \
  --outputPath ./privacy-test-network
```

### Production-Ready Multi-Region Network
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --consensus qbft \
  --privacy true \
  --azureEnable true \
  --azureRegionalDistribution "eastus:validators=4+rpc=3+archive=1,westus2:validators=3+rpc=2,northeurope:archive=1" \
  --azureNetworkMode hub-spoke \
  --azureHubRegion eastus \
  --monitoring splunk \
  --explorer both \
  --outputPath ./production-network
```

### Enterprise Archive Network
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --consensus qbft \
  --validators 7 \
  --participants 3 \
  --rpcNodes 3 \
  --archiveNodes 3 \
  --rpcNodeTypes "api:standard:2;admin:admin:1;trace:trace:1" \
  --monitoring elk \
  --explorer both \
  --outputPath ./enterprise-archive-network
```

### Specialized DApp Testing Network
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --validators 4 \
  --participants 2 \
  --rpcNodes 3 \
  --rpcNodeTypes "api:standard:2;trace:trace:1" \
  --monitoring loki \
  --explorer blockscout \
  --chainId 138 \
  --outputPath ./dapp-testing-network
```

## Configuration Validation

### Pre-generation Validation
```bash
# Validate configuration without generating files
npx quorum-dev-quickstart \
  --validate true \
  --noFileWrite true \
  --clientType besu \
  --azureRegionalDistribution "eastus:validators=3+rpc=2"
```

### Configuration File Validation
```bash
# Validate JSON topology file
npx quorum-dev-quickstart \
  --azureTopologyFile ./topology.json \
  --validate true \
  --noFileWrite true
```

## Environment Variables

### Common Environment Variables
```bash
# Docker configuration
export COMPOSE_PROJECT_NAME=my-quorum-network
export COMPOSE_FILE=docker-compose.yml

# Resource limits
export BESU_OPTS="-Xmx2g"
export TESSERA_OPTS="-Xmx1g"

# Network configuration
export NETWORK_NAME=my-custom-network
export CHAIN_ID=12345
```

### Azure-Specific Variables
```bash
# Azure credentials
export AZURE_CLIENT_ID=your-client-id
export AZURE_CLIENT_SECRET=your-client-secret
export AZURE_TENANT_ID=your-tenant-id

# Resource configuration
export AZURE_SUBSCRIPTION_ID=your-subscription-id
export AZURE_RESOURCE_GROUP=quorum-rg
```

## Configuration Best Practices

### Development Best Practices
1. **Start Small**: Begin with minimal node counts (1 validator, 1 participant)
2. **Use Loki**: Lightweight monitoring for development
3. **Enable Explorer**: Blockscout for transaction visibility
4. **Disable Privacy**: Unless specifically testing privacy features

### Testing Best Practices
1. **Realistic Topology**: Use production-like validator counts (4-7)
2. **Include Archive Nodes**: For historical data testing
3. **Enable Full Monitoring**: Test observability features
4. **Test Privacy**: If production will use privacy features

### Production Preparation
1. **Multi-Region**: Plan for disaster recovery
2. **Monitoring**: Full observability stack (Splunk/ELK)
3. **Security**: Review security configuration
4. **Scaling**: Plan for growth and load

## Troubleshooting Configuration

### Common Configuration Errors
```bash
# Invalid parameter combinations
Error: --azureNetworkMode hub-spoke requires --azureHubRegion
Fix: --azureNetworkMode hub-spoke --azureHubRegion eastus

# Insufficient validators for consensus
Error: QBFT requires minimum 4 validators
Fix: --consensus qbft --validators 4

# Resource constraints
Error: Not enough system resources
Fix: Reduce node counts or disable monitoring
```

### Configuration Debugging
```bash
# Debug mode for detailed validation
export DEBUG=quorum-dev-quickstart:*
npx quorum-dev-quickstart --validate --clientType besu

# Dry run to see generated configuration
npx quorum-dev-quickstart --noFileWrite --clientType besu --privacy true
```

## Next Steps

After configuring your network:

1. **Generate Network**: Run the configuration to create your network
2. **Start Network**: Use `./run.sh` to start all services
3. **Verify Configuration**: Check that all services are running correctly
4. **Explore Features**: Test different aspects of your configured network

For more detailed information:
- **[CLI Reference](cli-reference.md)** - Complete parameter documentation
- **[Regional Topology](regional-topology.md)** - Advanced multi-region configuration
- **[Troubleshooting](../operations/troubleshooting.md)** - Common configuration issues

---

**Configuration Complete!** 🎉 Your network is ready to generate and deploy.
---

**📝 Edit this page**: [Edit on GitHub](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/edit/feat/regional-topology-config/docs/getting-started/basic-configuration.md)
