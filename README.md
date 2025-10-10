# Multi-Agent Network Orchestrator (formerly the Quorum Dev Quickstart)

A comprehensive orchestration framework for deploying local and cloud-based Quorum (Hyperledger Besu / GoQuorum) development networks with advanced configuration options, cloud deployment support, and production-ready features.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Usage](#usage)
3. [Advanced Configuration](#advanced-configuration)
4. [Cloud Deployment](#cloud-deployment)
5. [Validation & Testing](#validation--testing)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

To run these tutorials, you must have the following installed:

- [Docker and Docker-compose](https://docs.docker.com/compose/install/) v2 or higher

| ⚠️ **Note**: If on MacOS or Windows, please ensure that you allow docker to use upto 4G of memory or 6G if running Privacy examples under the _Resources_ section. The [Docker for Mac](https://docs.docker.com/docker-for-mac/) and [Docker Desktop](https://docs.docker.com/docker-for-windows/) sites have details on how to do this at the "Resources" heading       |
| ---                                                                                                                                                                                                                                                                                                                                                                                |


| ⚠️ **Note**: This has only been tested on Windows 10 Build 19045, WSL2 and Docker Desktop                                                                                                                                                 |
| ---                                                                                                                                                                                                                                                                                                                                                                                |

- On Windows, please use WSL2 kernels 5.15x or higher
- You can use either Docker Desktop or docker-engine (with the compose plugin) within the WSL2 environment
- [Nodejs](https://nodejs.org/en/download/) or [Yarn](https://yarnpkg.com/cli/node)


## Usage 

Create the docker compose file and artifacts with 

```
$> npx quorum-dev-quickstart
              ___
             / _ \   _   _    ___    _ __   _   _   _ __ ___
            | | | | | | | |  / _ \  | '__| | | | | | '_ ' _ \
            | |_| | | |_| | | (_) | | |    | |_| | | | | | | |
             \__\_\  \__,_|  \___/  |_|     \__,_| |_| |_| |_|
     
        ____                          _
       |  _ \    ___  __   __   ___  | |   ___    _ __     ___   _ __
       | | | |  / _ \ \ \ / /  / _ \ | |  / _ \  | '_ \   / _ \ | '__|
       | |_| | |  __/  \ V /  |  __/ | | | (_) | | |_) | |  __/ | |
       |____/   \___|   \_/    \___| |_|  \___/  | .__/   \___| |_|
                                                 |_|
       ___            _          _            _                    _
      / _ \   _   _  (_)   ___  | | __  ___  | |_    __ _   _ __  | |_
     | | | | | | | | | |  / __| | |/ / / __| | __|  / _' | | '__| | __|
     | |_| | | |_| | | | | (__  |   <  \__ \ | |_  | (_| | | |    | |_ 
      \__\_\  \__,_| |_|  \___| |_|\_\ |___/  \__|  \__,_| |_|     \__|


Welcome to the Quorum Developer Quickstart utility. This tool can be used
to rapidly generate local Quorum blockchain networks for development purposes
using tools like GoQuorum, Besu, and Tessera.

To get started, be sure that you have both Docker and Docker Compose
installed, then answer the following questions.

Which Ethereum client would you like to run? Default: [1]
	1. Hyperledger Besu
	2. GoQuorum
  ...
  Do you wish to enable support for private transactions? [Y/n]
  ...
  Do you wish to enable support for logging with Splunk or ELK (Elasticsearch, Logstash & Kibana)? Default: [1]
	1. None
	2. Splunk
	3. ELK
...
Where should we create the config files for this network? Please
choose either an empty directory, or a path to a new directory that does
not yet exist. Default: ./quorum-test-network
```

This prompts you to pick a quorum variant, whether you would like to try Privacy and the location for the artifacts. By 
default artifact files are stored at `./quorum-test-network`, change directory to the artifacts folder: 

```
$> cd quorum-test-network
``` 


Alternatively, you can use CLI options and skip the prompt above like so:

```bash
# Basic local development
npx quorum-dev-quickstart --clientType besu --outputPath ./quorum-test-network --monitoring loki --privacy true

# Advanced configuration with custom node topology
npx quorum-dev-quickstart \
  --clientType besu \
  --validators 4 \
  --rpcNodes 2 \
  --bootNodes 1 \
  --privacy true \
  --monitoring loki \
  --explorer blockscout \
  --outputPath ./my-network

# Validation/dry-run mode
npx quorum-dev-quickstart \
  --clientType besu \
  --validate true \
  --noFileWrite true \
  --outputPath ./test-validation
```

The arguments `--privacy` and `--clientType` are required, the others contain defaults if left blank.

## Advanced Configuration

### Network Topology Options
- `--validators <number>`: Number of validator nodes (default: 4)
- `--rpcNodes <number>`: Number of RPC nodes (default: 1) 
- `--bootNodes <number>`: Number of boot nodes (default: 1)
- `--consensus <type>`: Consensus mechanism (ibft, qbft, clique)
- `--chainId <number>`: Custom chain ID

### Explorer & Monitoring
- `--explorer <type>`: Block explorer (blockscout, chainlens, both, none)
- `--monitoring <type>`: Monitoring stack (loki, elk, splunk, none)

### Genesis Configuration
- `--genesisPreset <preset>`: Genesis template preset
- `--nodeLayoutFile <path>`: JSON file defining custom node layout

## Agent Workflows

You can run specific agent workflows using CLI flags:

```bash
node build/index.js --infra --network --validation --documentation
```
## Example Agent Workflow Command

```bash
node build/index.js --infra --network --validation --documentation
```
## Cloud Deployment

### Azure Integration
Enable cloud deployment to Azure with comprehensive region and service configuration:

```bash
# Multi-region Azure deployment
npx quorum-dev-quickstart \
  --clientType besu \
  --azureEnable true \
  --azureRegions "eastus,westus2,centralus" \
  --azureDeploymentDefault aks \
  --azureNodePlacement "validators:aks:eastus+westus2;rpc:aca:centralus" \
  --azureOutputDir ./azure-deployment

# Azure with custom topology file
npx quorum-dev-quickstart \
  --clientType besu \
  --azureEnable true \
  --azureTopologyFile ./my-topology.json \
  --azureDryInfra true
```

### Azure Configuration Options
- `--azureEnable`: Enable Azure deployment integration
- `--azureRegions`: Comma-separated list of Azure regions
- `--azureRegionClass`: Region classification (commercial, gov, china, dod)
- `--azureDeploymentDefault`: Default deployment type (aks, aca, vm, vmss)
- `--azureNodePlacement`: Node placement DSL for role-specific deployment
- `--azureNetworkMode`: Network topology (flat, hub-spoke, isolated)
- `--azureDryInfra`: Generate infrastructure templates only

### Cloudflare DNS Integration
- `--cloudflareZone <domain>`: Configure DNS zone
- `--cloudflareApiTokenEnv <env_var>`: API token environment variable

## Validation & Testing

### Configuration Validation
```bash
# Validate configuration without generating files
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --validate true \
  --noFileWrite true

# Test Azure topology resolution
npx quorum-dev-quickstart \
  --azureEnable true \
  --azureRegions "eastus,westus" \
  --validate true \
  --azureDryInfra true
```

### Schema Validation
The tool includes comprehensive schema validation for:
- Network topology configuration
- Azure resource placement
- Node role assignments
- Genesis block parameters

**To start services and the network:**

Follow the README.md file of the generated artifact:
1. [Hyperledger Besu](./files/besu/README.md)
2. [GoQuorum](./files/goquorum/README.md)

### Development Workflow

```bash
# 1. Generate network
npx quorum-dev-quickstart --clientType besu --privacy true

# 2. Navigate to output directory
cd quorum-test-network

# 3. Start the network
./run.sh

# 4. View network status
./list.sh

# 5. Stop the network (preserves state)
./stop.sh

# 6. Resume the network
./resume.sh

# 7. Remove network and cleanup
./remove.sh
```

### Integration with Smart Contracts & DApps

The generated networks include example smart contracts and DApps:
- **Truffle Pet-Shop**: Classic Ethereum tutorial DApp
- **Hardhat QuorumToken**: Modern development stack with Next.js frontend
- **Privacy Examples**: Private transaction demonstrations

See [DApp Integration Guide](./files/common/dapps/quorumToken/README.md) for detailed setup instructions.

## Troubleshooting

### Besu only - `java.io.IOException: Permission denied` for volumes

The `besu` containers use user `besu` mapped to user:group 1000. On your local machine, if your userid is not 1000, you will see this error. To fix this either run as user 1000 or map
the container's user 1000 to your local user id so permissions will work like so in the compose file

```
image: some:img
user: $(id -u):$(id -g)
```

### `quorumengineering/tessera` can't be found on Mac OS and no match for platform 

Often, when trying to use tessera with `quorum-dev-quickstart` on Mac OS, you may encounter a message stating that the `tessera` image cannot be found and does not match the platform. 

```
failed to solve: quorumengineering/tessera:23.4.0: no match for platform in manifest sha256:fb436c0ac56b79ca7cda27b92a3f81273de77d1c5b813aba0183333ca483053e: not found
```

In this case, you can modify the `FROM` statement in the `Dockerfile` located at `quorum-test-network/config/tessera` as follows.

```
FROM --platform=linux/amd64 quorumengineering/tessera:${TESSERA_VERSION}
```