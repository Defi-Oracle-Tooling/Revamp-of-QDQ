# CLI Reference

> **Status:** Active | **Last Updated:** 2025-10-14 | **Version:** 0.4.0

This document provides comprehensive documentation for all available CLI flags in the Quorum Developer Quickstart tool.

## Quick Start

```bash
# Interactive mode (recommended for beginners)
npx quorum-dev-quickstart

# Command-line mode
npx quorum-dev-quickstart --clientType besu --privacy true
```

## Table of Contents

- [Core Configuration](#core-configuration)
- [Network Topology](#network-topology)
- [Member Nodes](#member-nodes)
- [RPC Configuration](#rpc-configuration)
- [Explorer Services](#explorer-services)
- [Azure Cloud Deployment](#azure-cloud-deployment)
- [Cloud Integration](#cloud-integration)
- [Advanced Options](#advanced-options)

## Core Configuration

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--clientType` | `string` | ✅ | - | Ethereum client to use. |
| `--privacy` | `boolean` | ✅ | `false` | Enable support for private transactions |
| `--monitoring` | `string` | ❌ | `loki` | Monitoring / logging stack selection. |
| `--outputPath` | `string` | ❌ | `./quorum-test-network` | Location for config files. |

### `--clientType`

Ethereum client to use.

**Available choices:** `besu`, `goquorum`

**Type:** `string` *(required)*

### `--privacy`

Enable support for private transactions

**Type:** `boolean` *(required)* | **Default:** `false`

### `--monitoring`

Monitoring / logging stack selection.

**Available choices:** `loki`, `splunk`, `elk`

**Type:** `string` | **Default:** `loki`

### `--outputPath`

Location for config files.

**Type:** `string` | **Default:** `./quorum-test-network`

## Network Topology

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--validators` | `number` | ❌ | `4` | Validator node count (consensus dependent). |
| `--participants` | `number` | ❌ | `3` | Non-validator participant node count. |
| `--bootNodes` | `number` | ❌ | `1` | Count of dedicated boot nodes (experimental). |
| `--rpcNodes` | `number` | ❌ | `1` | Count of RPC-serving non-validator nodes. |
| `--archiveNodes` | `number` | ❌ | `0` | Count of archive nodes (full history). |
| `--consensus` | `string` | ❌ | - | Consensus mechanism selection (overrides preset if |

### `--validators`

Validator node count (consensus dependent).

**Type:** `number` | **Default:** `4`

### `--participants`

Non-validator participant node count.

**Type:** `number` | **Default:** `3`

### `--bootNodes`

Count of dedicated boot nodes (experimental).

**Type:** `number` | **Default:** `1`

### `--rpcNodes`

Count of RPC-serving non-validator nodes.

**Type:** `number` | **Default:** `1`

### `--archiveNodes`

Count of archive nodes (full history).

**Type:** `number` | **Default:** `0`

### `--consensus`

Consensus mechanism selection (overrides preset if

**Available choices:** `ibft`, `qbft`, `clique`, `ethash`

**Type:** `string`

## Member Nodes

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--memberAdmins` | `number` | ❌ | `0` | Admin member nodes (governance/policy). |
| `--memberPermissioned` | `number` | ❌ | `0` | Permissioned application member nodes. |
| `--memberPrivate` | `number` | ❌ | `0` | Private transaction focus member nodes. |
| `--memberPublic` | `string` | ❌ | - | Public interface member nodes. [number] [defaul... |

### `--memberAdmins`

Admin member nodes (governance/policy).

**Type:** `number` | **Default:** `0`

### `--memberPermissioned`

Permissioned application member nodes.

**Type:** `number` | **Default:** `0`

### `--memberPrivate`

Private transaction focus member nodes.

**Type:** `number` | **Default:** `0`

### `--memberPublic`

Public interface member nodes. [number] [default: 0]

**Type:** `string`

## RPC Configuration

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--rpcDefaultType` | `string` | ❌ | `standard` | Default RPC node type with capability preset. |
| `--rpcNodeTypes` | `string` | ❌ | - | RPC node type mapping (format: |

### `--rpcDefaultType`

Default RPC node type with capability preset.

**Type:** `string` | **Default:** `standard`

### `--rpcNodeTypes`

RPC node type mapping (format:

**Type:** `string`

## Explorer Services

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--explorer` | `string` | ❌ | - | Unified explorer selector (overrides individual |
| `--blockscout` | `boolean` | ❌ | `false` | Enable Blockscout explorer. |
| `--chainlens` | `string` | ❌ | - | Enable Chainlens explorer.[boolean] [default: f... |

### `--explorer`

Unified explorer selector (overrides individual

**Available choices:** `blockscout`, `chainlens`, `swapscout`, `both`, `none`

**Type:** `string`

### `--blockscout`

Enable Blockscout explorer.

**Type:** `boolean` | **Default:** `false`

### `--chainlens`

Enable Chainlens explorer.[boolean] [default: false]

**Type:** `string`

## Azure Cloud Deployment

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--azureEnable` | `boolean` | ❌ | `false` | Enable Azure deployment scaffold generation. |
| `--azureAllRegions` | `boolean` | ❌ | `false` | Use all regions of selected classification. |
| `--azureRegions` | `string` | ❌ | - | Comma-separated list of Azure regions (e.g. |
| `--azureRegionExclude` | `string` | ❌ | - | Exclude regions/countries (e.g. eastus,US,BR |
| `--azureRegionClass` | `string` | ❌ | - | Azure region classification filter. |
| `--azureDeploymentDefault` | `string` | ❌ | `aks` | Default deployment type for unspecified roles. |
| `--azureNodePlacement` | `string` | ❌ | - | Node placement DSL (format: |
| `--azureTopologyFile` | `string` | ❌ | - | Path to JSON topology file (overrides other azure |
| `--azureSizeMap` | `string` | ❌ | - | VM/node size mapping (format: role=sku,role=sku). |
| `--azureScaleMap` | `string` | ❌ | - | Scaling ranges (format: role=min:max,role=min:m... |
| `--azureTags` | `string` | ❌ | - | Resource tags (format: key=value,key=value). |
| `--azureNetworkMode` | `string` | ❌ | `flat` | Network topology pattern (experimental). |
| `--azureOutputDir` | `string` | ❌ | `./out/azure` | Output directory for generated Azure templates. |
| `--azureDryInfra` | `boolean` | ❌ | `false` | Generate only infrastructure templates (skip local |

### `--azureEnable`

Enable Azure deployment scaffold generation.

**Type:** `boolean` | **Default:** `false`

### `--azureAllRegions`

Use all regions of selected classification.

**Type:** `boolean` | **Default:** `false`

### `--azureRegions`

Comma-separated list of Azure regions (e.g.

**Type:** `string`

### `--azureRegionExclude`

Exclude regions/countries (e.g. eastus,US,BR

**Type:** `string`

### `--azureRegionClass`

Azure region classification filter.

**Available choices:** `commercial`, `gov`, `china`, `dod`

**Type:** `string`

### `--azureDeploymentDefault`

Default deployment type for unspecified roles.

**Available choices:** `aks`, `aca`, `vm`, `vmss`

**Type:** `string` | **Default:** `aks`

### `--azureNodePlacement`

Node placement DSL (format:

**Type:** `string`

### `--azureTopologyFile`

Path to JSON topology file (overrides other azure

**Type:** `string`

### `--azureSizeMap`

VM/node size mapping (format: role=sku,role=sku).

**Type:** `string`

### `--azureScaleMap`

Scaling ranges (format: role=min:max,role=min:max).

**Type:** `string`

### `--azureTags`

Resource tags (format: key=value,key=value).

**Type:** `string`

### `--azureNetworkMode`

Network topology pattern (experimental).

**Available choices:** `flat`, `hub-spoke`, `isolated`

**Type:** `string` | **Default:** `flat`

### `--azureOutputDir`

Output directory for generated Azure templates.

**Type:** `string` | **Default:** `./out/azure`

### `--azureDryInfra`

Generate only infrastructure templates (skip local

**Type:** `boolean` | **Default:** `false`

## Cloud Integration

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--cloudflareZone` | `string` | ❌ | - | Cloudflare DNS zone (e.g. example.com).     [st... |
| `--cloudflareApiTokenEnv` | `string` | ❌ | - | Environment variable name that will contain |

### `--cloudflareZone`

Cloudflare DNS zone (e.g. example.com).     [string]

**Type:** `string`

### `--cloudflareApiTokenEnv`

Environment variable name that will contain

**Type:** `string`

## Advanced Options

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--genesisPreset` | `string` | ❌ | - | Genesis configuration preset (Phase 1 experimen... |
| `--chainId` | `string` | ❌ | - | Explicit Chain ID override.                 [nu... |
| `--nodeLayoutFile` | `string` | ❌ | - | Path to JSON layout file overriding node role |
| `--validate` | `boolean` | ❌ | `false` | Validate configuration only. |
| `--noFileWrite` | `boolean` | ❌ | `false` | Dry-run: validate & summarize layout without wr... |

### `--genesisPreset`

Genesis configuration preset (Phase 1 experimental).

**Available choices:** `dev`, `ibft`, `qbft`, `clique`

**Type:** `string`

### `--chainId`

Explicit Chain ID override.                 [number]

**Type:** `string`

### `--nodeLayoutFile`

Path to JSON layout file overriding node role

**Type:** `string`

### `--validate`

Validate configuration only.

**Type:** `boolean` | **Default:** `false`

### `--noFileWrite`

Dry-run: validate & summarize layout without writing

**Type:** `boolean` | **Default:** `false`

## Complete Examples

### Basic Local Development
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --monitoring loki \
  --explorer blockscout
```

### Azure Multi-Region Production
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureEnable true \
  --azureRegions "eastus,westus2,northeurope" \
  --azureDeploymentDefault aks \
  --azureNetworkMode hub-spoke \
  --monitoring splunk \
  --validators 7
```

### Specialized RPC Configuration
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --rpcNodeTypes "api:standard:3;admin:admin:1;trace:trace:1;ws:websocket:2" \
  --azureNodePlacement "validators:aks:eastus+westus2;rpc:aca:northeurope"
```

### Validation Only (Dry Run)
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureRegions "eastus,westus" \
  --validate true \
  --noFileWrite true
```

### Custom Network Topology
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --validators 5 \
  --rpcNodes 3 \
  --archiveNodes 1 \
  --bootNodes 2 \
  --consensus qbft \
  --chainId 12345
```

