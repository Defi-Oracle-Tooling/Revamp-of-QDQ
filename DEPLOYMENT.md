# 🚀 Revamp-of-QDQ Deployment Guide

**Multi-Agent Network Orchestrator** - Deploy and manage Quorum (Hyperledger Besu/GoQuorum) dev networks with integrated financial connectors, cloud deployment automation, and enterprise-grade integrations.

## 📋 Pre-Deployment Checklist

### System Requirements
- **Node.js**: 18.x or 20.x (tested on both versions)
- **TypeScript**: 5.9.3 or higher
- **Docker**: For containerized network deployments
- **Azure CLI**: For cloud deployments (optional)
- **Git**: For submodule management

### Environment Setup

#### 1. Core Configuration
```bash
# Basic network configuration
export CLIENT_TYPE=besu                    # or goquorum
export CHAIN_ID=138                        # governance chain
export PRIVACY_ENABLED=true               # enable Tessera
export MONITORING_STACK=loki               # loki, prometheus, or none

# Azure Cloud Integration (optional)
export AZURE_SUBSCRIPTION_ID=your_sub_id
export AZURE_KEY_VAULT_URL=https://your-vault.vault.azure.net/
export AZURE_REGIONS=eastus,westus2
```

#### 2. Financial Connector Configuration
```bash
# Wells Fargo Integration
export WELLS_FARGO_ENABLED=true
export WELLS_FARGO_CLIENT_ID=your_client_id
export WELLS_FARGO_CLIENT_SECRET=your_secret
export WELLS_FARGO_BASE_URL=https://api.wellsfargo.com/treasury
export WF_SERVICES=balances,transactions,fx  # comma-separated services

# Tatum Integration
export TATUM_API_KEY=your_api_key
export TATUM_API_TYPE=TESTNET              # or MAINNET
export TATUM_API_URL=https://api.tatum.io

# Simulation Mode (for development/testing)
export SIMULATION_MODE=true                # enables offline mode
```

#### 3. Advanced Configuration
```bash
# Azure Regional Distribution (multi-region deployments)
export AZURE_REGIONAL_DISTRIBUTION="eastus:validators=3+rpc=2,westus2:archive=1+rpc=1"
export AZURE_DEPLOYMENT_MAP="validators=aks,rpc=aca,archive=vmss"
export AZURE_NETWORK_MODE=hub-spoke

# ChainID 138 Governance
export CHAIN138_CONFIG="gov=GovToken:GOV:1000000;feed=ethUsd:60"

# Polling Intervals
export WF_POLL_BALANCES_SEC=300
export WF_POLL_TRANSACTIONS_SEC=300
export WF_POLL_PAYMENT_STATUS_SEC=120
```

## 🏗️ Build & Installation

### 1. Clone and Initialize
```bash
git clone https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ.git
cd Revamp-of-QDQ

# Initialize all submodules
./scripts/init-submodules.sh
```

### 2. Install Dependencies
```bash
npm install
npm run build:guarded
```

### 3. Verify Installation
```bash
# Run smoke test
npm run smoke

# Run core tests
npm run test:ci

# Verify submodules
./scripts/submodules/verify.sh --strict
```

## 🎯 Deployment Scenarios

### Scenario 1: Local Development Network
```bash
# Interactive mode (recommended for first-time users)
node build/src/index.js

# Or with flags
node build/src/index.js \
  --clientType besu \
  --privacy true \
  --monitoring loki \
  --outputPath ./local-network
```

### Scenario 2: Cloud-Ready Production Network
```bash
node build/src/index.js \
  --clientType besu \
  --chainId 138 \
  --privacy true \
  --monitoring prometheus \
  --azureEnable true \
  --azureRegions "eastus,westus2" \
  --chain138 "gov=GovToken:GOV:1000000;feed=ethUsd:60" \
  --includeDapp true \
  --outputPath ./production-network
```

### Scenario 3: Financial Integration Network
```bash
node build/src/index.js \
  --clientType besu \
  --privacy true \
  --chainId 138 \
  --includeDapp true \
  --outputPath ./financial-network
```

## 🔧 Configuration Management

### Environment Variables Priority
1. **Azure Key Vault** (highest priority)
2. **Environment Variables**
3. **Default Configuration** (lowest priority)

### Supported Environment Variable Formats
```bash
# Wells Fargo - Multiple formats supported
WF_ENABLED=true                           # Short form
WELLS_FARGO_ENABLED=true                  # Long form
WF_SERVICES=balances,transactions,fx      # Comma-separated
WF_POLL_BALANCES_SEC=30                   # Polling intervals

# Tatum - Multiple formats
TATUM_API_KEY=your_key
TATUM_API_TYPE=TESTNET                    # or TATUM_TESTNET=true
TATUM_API_URL=https://api.tatum.io        # or TATUM_BASE_URL
```

### Configuration Refresh
```bash
# Reload configuration without restart
node build/src/index.js --refreshConfig
```

## 🌩️ Azure Cloud Deployment

### 1. Azure Setup
```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Create resource group
az group create --name rg-quorum-network --location eastus
```

### 2. Key Vault Setup (Optional)
```bash
# Create Key Vault
az keyvault create \
  --name your-vault-name \
  --resource-group rg-quorum-network \
  --location eastus

# Store secrets
az keyvault secret set --vault-name your-vault-name --name "wells-fargo-client-id" --value "your_client_id"
az keyvault secret set --vault-name your-vault-name --name "wells-fargo-client-secret" --value "your_secret"
az keyvault secret set --vault-name your-vault-name --name "tatum-api-key" --value "your_key"
```

### 3. Multi-Region Deployment
```bash
export AZURE_REGIONAL_DISTRIBUTION="eastus:validators=3+rpc=2,westus2:validators=2+archive=1"
export AZURE_DEPLOYMENT_MAP="validators=aks,rpc=aca,archive=vmss"

node build/src/index.js \
  --clientType besu \
  --azureEnable true \
  --azureRegions "eastus,westus2" \
  --azureRegionalDistribution "$AZURE_REGIONAL_DISTRIBUTION" \
  --azureDeploymentMap "$AZURE_DEPLOYMENT_MAP" \
  --outputPath ./azure-network
```

## 🧪 Testing & Validation

### Pre-Deployment Tests
```bash
# Core functionality
npm run test:ci

# Smoke test
npm run smoke

# Submodule verification
./scripts/submodules/verify.sh --strict

# Configuration validation
node build/src/index.js --validate --noFileWrite true
```

### Post-Deployment Validation
```bash
# Check network health
cd your-output-directory
./scripts/health-check.sh

# Validate blockchain connectivity
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545

# Test financial connectors
node scripts/test-connectors.js
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear build cache
rm -rf build/ node_modules/
npm install
npm run build:guarded
```

#### Submodule Access Issues
```bash
# Check submodule status
git submodule status

# Re-initialize problematic submodules
./scripts/submodules/update-all.sh --pull
```

#### Configuration Issues
```bash
# Debug configuration loading
node build/src/index.js --refreshConfig --verbose

# Test secret retrieval
node -e "
const { validateSecretsAvailable } = require('./build/src/secrets/azureKeyVault.js');
validateSecretsAvailable().then(result => console.log(result));
"
```

#### Azure Connection Issues
```bash
# Test Azure connectivity
az account show

# Verify Key Vault access
az keyvault secret list --vault-name your-vault-name
```

### Error Codes

| Exit Code | Description | Solution |
|-----------|-------------|----------|
| 0 | Success | No action needed |
| 1 | General error | Check logs for details |
| 2 | Configuration error | Verify environment variables |
| 3 | Build failure | Run `npm run build:guarded` |
| 4 | Submodule error | Run `./scripts/submodules/verify.sh` |
| 5 | Azure connection error | Check Azure credentials |

## 📊 Monitoring & Observability

### Available Monitoring Stacks
- **Loki**: Log aggregation and alerting
- **Prometheus**: Metrics collection and visualization
- **Grafana**: Dashboard and analytics (included with both)

### Monitoring Configuration
```bash
# Enable monitoring
--monitoring loki           # or prometheus

# Custom monitoring configuration
export MONITORING_CONFIG='{"retention": "30d", "alerting": true}'
```

### Health Endpoints
After deployment, the following endpoints are available:
- **Node RPC**: `http://localhost:8545`
- **Explorer**: `http://localhost:25000` (if enabled)
- **Monitoring**: `http://localhost:3000` (Grafana)
- **Privacy Network**: `http://localhost:9000` (Tessera)

## 🔒 Security Considerations

### Secret Management
- Use Azure Key Vault for production secrets
- Never commit sensitive data to version control
- Rotate API keys regularly
- Use environment-specific configurations

### Network Security
- Configure firewalls for exposed ports
- Use TLS for all external communications
- Implement proper access controls
- Regular security audits

### Compliance
- Enable compliance checking for financial transactions
- Configure sanctions screening
- Implement AML/KYC verification
- Maintain audit logs

## 📈 Performance Optimization

### Network Performance
```bash
# Optimize validator count for consensus
--validators 3              # Minimum for BFT
--validators 7              # Recommended for production

# Configure RPC nodes
--rpcNodes 2                # Load balancing
--rpcNodeTypes "standard,full"  # Different capabilities
```

### Financial Connector Performance
```bash
# Optimize polling intervals
export WF_POLL_BALANCES_SEC=60          # More frequent updates
export WF_POLL_TRANSACTIONS_SEC=30      # Real-time transaction monitoring

# Enable caching
export CONNECTOR_CACHE_TTL=300          # 5-minute cache
```

## 🆘 Support & Maintenance

### Log Locations
- **Application logs**: `./logs/app.log`
- **Network logs**: `./logs/network/`
- **Connector logs**: `./logs/connectors/`
- **Build logs**: `./logs/build.log`

### Maintenance Tasks
```bash
# Weekly: Update submodules
./scripts/submodules/update-all.sh

# Monthly: Security updates
npm audit fix

# Quarterly: Full rebuild
npm run build:guarded && npm run test:ci
```

### Getting Help
- **Documentation**: `./docs/`
- **Issues**: GitHub Issues
- **Community**: Discord/Slack channels
- **Enterprise Support**: Contact team

---

## ✅ Deployment Readiness Checklist

- [ ] Node.js 18.x/20.x installed
- [ ] All environment variables configured
- [ ] Build successful (`npm run build:guarded`)
- [ ] Smoke test passing (`npm run smoke`)
- [ ] Submodules verified (`./scripts/submodules/verify.sh --strict`)
- [ ] Azure credentials configured (if using cloud)
- [ ] Secret management setup
- [ ] Monitoring stack selected
- [ ] Network topology defined
- [ ] Financial connectors tested
- [ ] Security considerations reviewed
- [ ] Backup and recovery plan in place

**Status**: ✅ **DEPLOYMENT READY**

The Revamp-of-QDQ project is fully prepared for production deployment with comprehensive configuration options, robust error handling, and extensive monitoring capabilities.