# Quick Start Guide

🏠 [Documentation Home](../README.md) → [Docs](../docs/) → [Getting-started](../docs/getting-started/) → **quick-start**


> **Status:** Active | **Last Updated:** 2025-10-14 | **Version:** 0.4.0

Get up and running with Revamp of QDQ in under 5 minutes. This guide covers the fastest path to generating and running a local Quorum network.

## Prerequisites

### System Requirements
- **Node.js** 16+ and npm
- **Docker** and Docker Compose
- **Git** (optional, for examples)
- **4GB+ RAM** (recommended for full network)

### Platform Support
- ✅ **Linux** (Ubuntu 20.04+, RHEL 8+)
- ✅ **macOS** (Intel and Apple Silicon)
- ✅ **Windows** (WSL2 recommended)

### Quick Installation Check
```bash
# Verify prerequisites
node --version    # Should be v16+
npm --version     # Should be 8+
docker --version  # Should be 20+
docker-compose --version  # Should be 1.29+
```

## 5-Minute Quick Start

### Step 1: Generate Network (30 seconds)
```bash
# Interactive mode (recommended for first time)
npx quorum-dev-quickstart

# Or use command-line mode
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --monitoring loki \
  --outputPath ./my-quorum-network
```

**Expected Output:**
```
✅ Revamp of QDQ - Network Generated Successfully
📁 Network location: ./my-quorum-network
🚀 To start your network: cd my-quorum-network && ./run.sh
```

### Step 2: Start the Network (2 minutes)
```bash
# Navigate to generated network
cd my-quorum-network

# Start all services
./run.sh
```

**Expected Output:**
```
🔄 Starting Quorum network...
✅ Besu nodes: 4/4 running
✅ Privacy layer: Tessera running  
✅ Monitoring: Loki + Grafana running
✅ Block explorer: Available at http://localhost:25000

🌐 Network ready! Access points:
   • JSON-RPC: http://localhost:8545
   • Block Explorer: http://localhost:25000
   • Grafana Dashboard: http://localhost:3000
```

### Step 3: Verify Network (30 seconds)
```bash
# Check node status
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Expected response: {"jsonrpc":"2.0","id":1,"result":"0x1"}
```

### Step 4: Explore the Network (2 minutes)
Open in your browser:
- **Block Explorer**: http://localhost:25000 - View transactions and blocks
- **Grafana Dashboard**: http://localhost:3000 - Network monitoring (admin/admin)
- **Loki Logs**: http://localhost:3100 - Centralized logging

## Common Quick Start Scenarios

### Developer Testing Network
```bash
# Minimal network for dApp development
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy false \
  --monitoring none \
  --validators 1 \
  --participants 1
```

### Privacy-Enabled Network
```bash
# Full privacy features with Tessera
npx quorum-dev-quickstart \
  --clientType besu \
  --privacy true \
  --monitoring loki \
  --validators 4 \
  --participants 2
```

### Enterprise Monitoring Setup
```bash
# Production-like monitoring stack
npx quorum-dev-quickstart \
  --clientType besu \
  --monitoring splunk \
  --blockscout true \
  --validators 7 \
  --archiveNodes 1
```

### Multi-Region Azure Network
```bash
# Azure multi-region deployment
npx quorum-dev-quickstart \
  --clientType besu \
  --azureEnable true \
  --azureRegionalDistribution "eastus:validators=3+rpc=2,westus2:validators=2" \
  --azureNetworkMode hub-spoke
```

## Interactive Configuration

If you prefer guided setup, use interactive mode:

```bash
npx quorum-dev-quickstart
```

**Interactive Flow:**
1. **Client Selection**: Choose Besu or GoQuorum
2. **Privacy Configuration**: Enable/disable private transactions  
3. **Network Topology**: Configure validators and participants
4. **Monitoring Stack**: Select logging and monitoring tools
5. **Explorer Services**: Enable block explorers
6. **Azure Deployment**: Optional cloud deployment configuration

## Network Management

### Essential Commands
```bash
# Start network
./run.sh

# Stop network  
./stop.sh

# Remove network (keeps data)
./remove.sh

# View running containers
./list.sh

# View logs
docker-compose logs -f validator1
```

### Network Access Points

| Service | Default URL | Purpose |
|---------|-------------|---------|
| **JSON-RPC Endpoint** | http://localhost:8545 | Blockchain API access |
| **Block Explorer** | http://localhost:25000 | Transaction and block browser |
| **Grafana Dashboard** | http://localhost:3000 | Network monitoring (admin/admin) |
| **Prometheus Metrics** | http://localhost:9090 | Raw metrics collection |
| **Loki Logs** | http://localhost:3100 | Centralized log aggregation |

### Development Tools Integration

#### MetaMask Configuration
```javascript
// Network Configuration
Network Name: Local Quorum
RPC URL: http://localhost:8545
Chain ID: 1337
Currency Symbol: ETH
```

#### Web3.js Connection
```javascript
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');

// Verify connection
web3.eth.getBlockNumber()
  .then(blockNumber => console.log('Current block:', blockNumber));
```

#### Truffle Configuration
```javascript
// truffle-config.js
module.exports = {
  networks: {
    quorum: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gasPrice: 0,
      gas: 4500000
    }
  }
};
```

## Next Steps

### Immediate Next Actions
1. **Deploy Smart Contracts**: Use the pre-configured development accounts
2. **Explore Examples**: Check `./dapps/` directory for sample applications
3. **Configure Monitoring**: Customize Grafana dashboards for your needs
4. **Test Privacy Features**: If enabled, experiment with private transactions

### Learn More
- **[Configuration Guide](../configuration/cli-reference.md)** - Detailed parameter reference
- **[Regional Deployment](../configuration/regional-topology.md)** - Multi-region Azure deployment
- **[Architecture Overview](../architecture/system-overview.md)** - Understand the components
- **[Security Guide](../security/security-guide.md)** - Production security considerations

## Troubleshooting Quick Fixes

### Network Won't Start
```bash
# Check Docker daemon
sudo systemctl status docker

# Check port conflicts
netstat -tulpn | grep :8545

# Reset network
./stop.sh && ./remove.sh && ./run.sh
```

### Can't Access Services
```bash
# Verify all containers running
docker-compose ps

# Check specific service logs
docker-compose logs validator1
docker-compose logs explorer
```

### Performance Issues
```bash
# Check system resources
docker stats

# Reduce network size for development
npx quorum-dev-quickstart --validators 1 --participants 1
```

### Common Error Solutions

#### "Port already in use"
```bash
# Find and stop conflicting process
sudo lsof -i :8545
kill -9 <PID>
```

#### "Docker permission denied"
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

#### "Network generation failed"
```bash
# Clear npm cache and retry
npm cache clean --force
npx clear-npx-cache
npx quorum-dev-quickstart
```

## Performance Tips

### Development Optimization
- Use `--validators 1` for faster development
- Disable monitoring with `--monitoring none` for minimal resource usage
- Use `--privacy false` unless testing privacy features

### Production Preparation
- Always use multiple validators (minimum 4 for QBFT)
- Enable monitoring for observability
- Consider archive nodes for full history
- Test with realistic transaction loads

## Getting Help

- **Documentation**: [Main Documentation Index](../README.md)
- **Issues**: [GitHub Issues](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/issues)
- **Community**: [GitHub Discussions](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/discussions)
- **Security**: security@your-org.com

---

**Success!** 🎉 You now have a fully functional Quorum network running locally. Ready to build the decentralized future!
---

**📝 Edit this page**: [Edit on GitHub](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/edit/feat/regional-topology-config/docs/getting-started/quick-start.md)
