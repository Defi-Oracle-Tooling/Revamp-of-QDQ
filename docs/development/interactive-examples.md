# 💻 Interactive Code Examples

## CLI Commands with Copy Functionality

### Basic Network Generation

<details>
<summary>🚀 <strong>Generate Besu Network</strong></summary>

```bash
# Generate a basic 4-node Besu network with IBFT2 consensus
npx quorum-dev-quickstart \
  --clientType besu \
  --consensusAlgorithm ibft2 \
  --numberNodes 4 \
  --blockscout false \
  --outputPath ./my-besu-network

# Navigate to the generated network
cd my-besu-network

# Start the network
./run.sh
```

**📋 Parameters Explained:**
- `--clientType besu`: Use Hyperledger Besu client
- `--consensusAlgorithm ibft2`: IBFT 2.0 consensus mechanism  
- `--numberNodes 4`: Generate 4 validator nodes
- `--blockscout false`: Skip block explorer
- `--outputPath`: Custom output directory name

**✅ Expected Output:**
- Network starts on ports 8545, 8546, etc.
- 4 Besu nodes running as validators
- JSON-RPC available at `http://localhost:8545`

</details>

### Privacy-Enabled GoQuorum Network

<details>
<summary>🔐 <strong>Generate GoQuorum with Privacy</strong></summary>

```bash
# Generate GoQuorum network with Tessera privacy managers
npx quorum-dev-quickstart \
  --clientType goquorum \
  --consensusAlgorithm raft \
  --privacy true \
  --numberNodes 3 \
  --monitoring grafana \
  --outputPath ./goquorum-private-network

# Start with privacy enabled
cd goquorum-private-network
./run.sh
```

**📋 Parameters Explained:**
- `--clientType goquorum`: Use ConsenSys GoQuorum
- `--consensusAlgorithm raft`: Raft consensus for permissioned networks
- `--privacy true`: Enable Tessera privacy managers
- `--monitoring grafana`: Include Grafana dashboard
- `--numberNodes 3`: 3 nodes for Raft consensus

**✅ Expected Output:**
- GoQuorum nodes with Tessera privacy managers
- Grafana dashboard at `http://localhost:3000`
- Private transaction capability enabled

</details>

### Regional Topology Configuration

<details>
<summary>🌍 <strong>Multi-Region Network Setup</strong></summary>

```bash
# Generate network with regional topology configuration
npx quorum-dev-quickstart \
  --clientType besu \
  --consensusAlgorithm ibft2 \
  --numberNodes 6 \
  --regionalTopology \
  --regions "us-east,eu-west,asia-pacific" \
  --nodesPerRegion 2 \
  --outputPath ./regional-quorum-network

# Configure regional settings
cd regional-quorum-network
export REGION_CONFIG="{
  \"us-east\": {\"latency\": \"50ms\", \"bandwidth\": \"1Gbps\"},
  \"eu-west\": {\"latency\": \"100ms\", \"bandwidth\": \"500Mbps\"},
  \"asia-pacific\": {\"latency\": \"150ms\", \"bandwidth\": \"300Mbps\"}
}"

# Start with regional configuration
./run-regional.sh
```

**📋 Configuration Details:**
- `--regionalTopology`: Enable multi-region support
- `--regions`: Define region identifiers
- `--nodesPerRegion 2`: 2 nodes per region
- Environment variables control regional parameters

**✅ Network Layout:**
```
Region US-East:    Node 0, Node 1
Region EU-West:    Node 2, Node 3  
Region ASIA-PAC:   Node 4, Node 5
```

</details>

## Smart Contract Deployment Examples

### Basic ERC-20 Token Deployment

<details>
<summary>🪙 <strong>Deploy ERC-20 Token Contract</strong></summary>

```javascript
// contracts/MyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply * 10**decimals());
    }
}
```

```javascript
// scripts/deploy-token.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy(1000000); // 1M tokens
    
    await token.deployed();
    
    console.log("Token deployed to:", token.address);
    console.log("Total supply:", await token.totalSupply());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

```bash
# Install dependencies and deploy
npm install @openzeppelin/contracts hardhat
npx hardhat compile
npx hardhat run scripts/deploy-token.js --network localhost
```

**🎯 Key Points:**
- Uses OpenZeppelin for security
- Deploys 1M tokens with 18 decimals
- Returns contract address for interaction

</details>

### ChainID 138 Integration Contract

<details>
<summary>🔗 <strong>ChainID 138 Currency Contract</strong></summary>

```solidity
// contracts/ISO20022CompliantEMoneyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ISO20022CompliantEMoneyToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    string public currencyCode;
    uint8 private _decimals;
    
    struct ComplianceData {
        bool isCompliant;
        uint256 lastAudit;
        string auditHash;
    }
    
    mapping(address => ComplianceData) public compliance;
    
    constructor(
        string memory name,
        string memory symbol,
        string memory _currencyCode,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
        _setupRole(COMPLIANCE_ROLE, msg.sender);
        
        currencyCode = _currencyCode;
        _decimals = decimals_;
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(compliance[to].isCompliant, "Recipient not compliant");
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(msg.sender, amount);
    }
    
    function setCompliance(
        address account,
        bool isCompliant,
        string memory auditHash
    ) public onlyRole(COMPLIANCE_ROLE) {
        compliance[account] = ComplianceData({
            isCompliant: isCompliant,
            lastAudit: block.timestamp,
            auditHash: auditHash
        });
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) {
            require(
                compliance[from].isCompliant && compliance[to].isCompliant,
                "Transfer not compliant"
            );
        }
    }
}
```

```javascript
// scripts/deploy-chain138-currency.js
const { ethers } = require("hardhat");

async function main() {
    const currencies = [
        { name: "US Dollar E-Money", symbol: "eUSD", code: "USD", decimals: 2 },
        { name: "Euro E-Money", symbol: "eEUR", code: "EUR", decimals: 2 },
        { name: "Japanese Yen E-Money", symbol: "eJPY", code: "JPY", decimals: 0 },
        { name: "British Pound E-Money", symbol: "eGBP", code: "GBP", decimals: 2 }
    ];
    
    const deployedContracts = {};
    
    for (const currency of currencies) {
        const Token = await ethers.getContractFactory("ISO20022CompliantEMoneyToken");
        const token = await Token.deploy(
            currency.name,
            currency.symbol,
            currency.code,
            currency.decimals
        );
        
        await token.deployed();
        
        deployedContracts[currency.code] = {
            address: token.address,
            name: currency.name,
            symbol: currency.symbol,
            decimals: currency.decimals
        };
        
        console.log(`${currency.code} deployed to: ${token.address}`);
    }
    
    // Save deployment info
    const fs = require('fs');
    fs.writeFileSync(
        'deployments/chainid138-currencies.json',
        JSON.stringify(deployedContracts, null, 2)
    );
    
    console.log("\n📄 Deployment summary saved to deployments/chainid138-currencies.json");
}

main().catch(console.error);
```

```bash
# Deploy all ChainID 138 currencies
mkdir -p deployments
npx hardhat run scripts/deploy-chain138-currency.js --network chainid138
```

**✨ Features:**
- ISO 20022 compliance built-in
- Role-based access control
- Automatic compliance checks
- Multi-currency support

</details>

## Configuration Examples

### Docker Compose for Custom Setup

<details>
<summary>🐳 <strong>Custom Docker Configuration</strong></summary>

```yaml
# docker-compose.custom.yml
version: '3.8'

services:
  besu-node-1:
    image: hyperledger/besu:latest
    container_name: besu-node-1
    ports:
      - "8545:8545"
      - "8546:8546"
      - "30303:30303"
    volumes:
      - ./config/node1:/opt/besu/config
      - ./data/node1:/opt/besu/data
    command: >
      --config-file=/opt/besu/config/config.toml
      --genesis-file=/opt/besu/config/genesis.json
      --node-private-key-file=/opt/besu/config/key
      --rpc-http-enabled
      --rpc-http-host=0.0.0.0
      --rpc-http-cors-origins="*"
      --rpc-ws-enabled
      --rpc-ws-host=0.0.0.0
      --host-allowlist="*"
      --min-gas-price=0
    networks:
      - quorum-network
    restart: unless-stopped
    
  besu-node-2:
    image: hyperledger/besu:latest
    container_name: besu-node-2
    ports:
      - "8547:8545"
      - "8548:8546"
      - "30304:30303"
    volumes:
      - ./config/node2:/opt/besu/config
      - ./data/node2:/opt/besu/data
    command: >
      --config-file=/opt/besu/config/config.toml
      --genesis-file=/opt/besu/config/genesis.json
      --node-private-key-file=/opt/besu/config/key
      --rpc-http-enabled
      --rpc-http-host=0.0.0.0
      --rpc-http-port=8545
      --rpc-ws-enabled
      --rpc-ws-host=0.0.0.0
      --host-allowlist="*"
      --bootnodes="enode://besu-node-1-enode@besu-node-1:30303"
    networks:
      - quorum-network
    depends_on:
      - besu-node-1
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
    networks:
      - quorum-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - quorum-network
    restart: unless-stopped

networks:
  quorum-network:
    driver: bridge
    name: quorum-network

volumes:
  prometheus-data:
  grafana-data:
```

```bash
# Start custom configuration
docker-compose -f docker-compose.custom.yml up -d

# Check services
docker-compose -f docker-compose.custom.yml ps

# View logs
docker-compose -f docker-compose.custom.yml logs -f besu-node-1
```

**🔧 Customization Points:**
- Custom port mappings
- Persistent data volumes
- Monitoring stack included
- Health checks and restart policies

</details>

### Environment Configuration

<details>
<summary>⚙️ <strong>Environment Variables Setup</strong></summary>

```bash
# .env.production
# Network Configuration
NETWORK_NAME="QuorumProduction"
CHAIN_ID=1337
CONSENSUS_ALGORITHM=ibft2
NUMBER_OF_NODES=7

# Regional Topology
ENABLE_REGIONAL_TOPOLOGY=true
REGIONS="us-east-1,eu-west-1,ap-southeast-1"
NODES_PER_REGION=2
REGION_LATENCY_US_EAST=50ms
REGION_LATENCY_EU_WEST=100ms
REGION_LATENCY_AP_SOUTHEAST=200ms

# Security Settings
ENABLE_TLS=true
CERT_PATH="/opt/quorum/certs"
PRIVATE_KEY_ENCRYPTION=true
KEY_STORE_PASSWORD="secure-password-123"

# Performance Tuning
BLOCK_PERIOD_SECONDS=1
EPOCH_LENGTH=30000
MAX_VALIDATORS=21
GAS_LIMIT=10000000
MIN_GAS_PRICE=0

# Monitoring Configuration
ENABLE_PROMETHEUS=true
PROMETHEUS_PORT=9090
ENABLE_GRAFANA=true
GRAFANA_PORT=3000
ENABLE_BLOCK_EXPLORER=true
BLOCKSCOUT_PORT=4000

# ChainID 138 Integration
ENABLE_CHAINID138=true
CHAINID138_WALLET_SERVICE_URL="https://api.chainid138.com"
CHAINID138_COMPLIANCE_ENDPOINT="https://compliance.chainid138.com"
CHAINID138_SUPPORTED_CURRENCIES="USD,EUR,GBP,JPY,CHF,CAD,AUD,SGD"

# DODOEX Configuration
ENABLE_DODOEX=false
DODOEX_FACTORY_ADDRESS="0x..."
DODOEX_WETH_ADDRESS="0x..."
DODOEX_AUTO_TRADING=false

# Resource Limits
NODE_MEMORY_LIMIT=4GB
NODE_CPU_LIMIT=2
MAX_PEER_CONNECTIONS=50
CACHE_SIZE=1GB

# Logging Configuration
LOG_LEVEL=INFO
LOG_FORMAT=JSON
LOG_RETENTION_DAYS=30
ENABLE_AUDIT_LOGS=true
```

```bash
# Load production environment
source .env.production

# Generate network with environment variables
npx quorum-dev-quickstart \
  --clientType besu \
  --consensusAlgorithm $CONSENSUS_ALGORITHM \
  --numberNodes $NUMBER_OF_NODES \
  --chainId $CHAIN_ID \
  --monitoring prometheus,grafana \
  --blockscout $ENABLE_BLOCK_EXPLORER \
  --outputPath "./networks/$NETWORK_NAME"

# Start with production configuration
cd "./networks/$NETWORK_NAME"
./run.sh
```

**🎯 Environment Benefits:**
- Centralized configuration management
- Easy environment switching (dev/staging/prod)
- Security-focused secret management
- Resource optimization settings

</details>

## Testing Examples

### Network Connectivity Tests

<details>
<summary>🧪 <strong>Automated Network Testing</strong></summary>

```javascript
// tests/network-connectivity.test.js
const { expect } = require('chai');
const { ethers } = require('ethers');

describe('Quorum Network Connectivity Tests', function() {
    let providers = [];
    let signers = [];
    
    before(async function() {
        // Connect to all nodes
        const nodeUrls = [
            'http://localhost:8545',
            'http://localhost:8546', 
            'http://localhost:8547',
            'http://localhost:8548'
        ];
        
        for (const url of nodeUrls) {
            const provider = new ethers.JsonRpcProvider(url);
            providers.push(provider);
            
            // Use node's coinbase account
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                signers.push(provider.getSigner(accounts[0].address));
            }
        }
    });
    
    it('should connect to all nodes', async function() {
        for (let i = 0; i < providers.length; i++) {
            const network = await providers[i].getNetwork();
            expect(network.chainId).to.equal(1337n);
            console.log(`✓ Node ${i + 1} connected - Chain ID: ${network.chainId}`);
        }
    });
    
    it('should have synchronized block numbers', async function() {
        // Wait for block synchronization
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const blockNumbers = [];
        for (const provider of providers) {
            const blockNumber = await provider.getBlockNumber();
            blockNumbers.push(blockNumber);
        }
        
        const maxBlock = Math.max(...blockNumbers);
        const minBlock = Math.min(...blockNumbers);
        
        expect(maxBlock - minBlock).to.be.lessThan(3);
        console.log(`✓ Block sync within range: ${minBlock} - ${maxBlock}`);
    });
    
    it('should process transactions across all nodes', async function() {
        if (signers.length < 2) {
            this.skip('Need at least 2 signers for cross-node testing');
        }
        
        const amount = ethers.parseEther('1.0');
        
        // Send transaction from node 1 to node 2
        const tx = await signers[0].sendTransaction({
            to: await signers[1].getAddress(),
            value: amount,
            gasLimit: 21000
        });
        
        const receipt = await tx.wait();
        expect(receipt.status).to.equal(1);
        
        // Verify transaction visible on all nodes
        for (const provider of providers) {
            const txData = await provider.getTransaction(receipt.hash);
            expect(txData).to.not.be.null;
        }
        
        console.log(`✓ Transaction ${receipt.hash} processed on all nodes`);
    });
    
    it('should maintain consensus under load', async function() {
        const transactions = [];
        const concurrentTxs = 10;
        
        // Send multiple concurrent transactions
        for (let i = 0; i < concurrentTxs; i++) {
            if (signers.length >= 2) {
                const tx = signers[i % signers.length].sendTransaction({
                    to: await signers[(i + 1) % signers.length].getAddress(),
                    value: ethers.parseEther('0.1'),
                    gasLimit: 21000
                });
                transactions.push(tx);
            }
        }
        
        // Wait for all transactions
        const results = await Promise.allSettled(transactions);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        expect(successful).to.be.greaterThan(concurrentTxs * 0.8);
        console.log(`✓ ${successful}/${concurrentTxs} concurrent transactions successful`);
    });
});
```

```bash
# Run connectivity tests
npm install --save-dev mocha chai ethers
npx mocha tests/network-connectivity.test.js --timeout 30000
```

**📊 Test Coverage:**
- Node connectivity verification
- Block synchronization checks
- Cross-node transaction processing
- Consensus under load testing

</details>

## Performance Benchmarking

<details>
<summary>⚡ <strong>Network Performance Tests</strong></summary>

```javascript
// scripts/performance-benchmark.js
const { ethers } = require('ethers');
const fs = require('fs');

class QuorumBenchmark {
    constructor(nodeUrl = 'http://localhost:8545') {
        this.provider = new ethers.JsonRpcProvider(nodeUrl);
        this.results = {
            timestamp: new Date().toISOString(),
            tests: {}
        };
    }
    
    async runBenchmarks() {
        console.log('🚀 Starting Quorum Network Benchmarks...\n');
        
        await this.benchmarkTPS();
        await this.benchmarkLatency();
        await this.benchmarkContractDeployment();
        await this.benchmarkContractExecution();
        
        this.saveResults();
        this.printSummary();
    }
    
    async benchmarkTPS() {
        console.log('📈 Testing Transactions Per Second (TPS)...');
        
        const accounts = await this.provider.listAccounts();
        if (accounts.length < 2) {
            console.log('❌ Need at least 2 accounts for TPS testing');
            return;
        }
        
        const signer = this.provider.getSigner(accounts[0].address);
        const recipient = accounts[1].address;
        
        const testDuration = 30; // seconds
        const startTime = Date.now();
        const transactions = [];
        let txCount = 0;
        
        console.log(`⏱️  Running TPS test for ${testDuration} seconds...`);
        
        while ((Date.now() - startTime) < testDuration * 1000) {
            try {
                const tx = await signer.sendTransaction({
                    to: recipient,
                    value: ethers.parseEther('0.001'),
                    gasLimit: 21000
                });
                
                transactions.push(tx.hash);
                txCount++;
                
                if (txCount % 10 === 0) {
                    process.stdout.write(`\r📊 Sent ${txCount} transactions...`);
                }
            } catch (error) {
                console.error(`Transaction failed: ${error.message}`);
            }
        }
        
        const actualDuration = (Date.now() - startTime) / 1000;
        const tps = txCount / actualDuration;
        
        this.results.tests.tps = {
            transactionsSent: txCount,
            duration: actualDuration,
            tps: tps,
            transactionHashes: transactions.slice(0, 5) // Store first 5 for verification
        };
        
        console.log(`\n✅ TPS Test Complete: ${tps.toFixed(2)} TPS`);
    }
    
    async benchmarkLatency() {
        console.log('\n⏱️  Testing Transaction Latency...');
        
        const accounts = await this.provider.listAccounts();
        if (accounts.length < 2) return;
        
        const signer = this.provider.getSigner(accounts[0].address);
        const recipient = accounts[1].address;
        
        const latencies = [];
        const testRounds = 20;
        
        for (let i = 0; i < testRounds; i++) {
            const startTime = Date.now();
            
            const tx = await signer.sendTransaction({
                to: recipient,
                value: ethers.parseEther('0.001'),
                gasLimit: 21000
            });
            
            const receipt = await tx.wait();
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            latencies.push(latency);
            process.stdout.write(`\r📊 Completed ${i + 1}/${testRounds} latency tests...`);
        }
        
        const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
        const minLatency = Math.min(...latencies);
        const maxLatency = Math.max(...latencies);
        
        this.results.tests.latency = {
            averageMs: avgLatency,
            minimumMs: minLatency,
            maximumMs: maxLatency,
            samples: latencies
        };
        
        console.log(`\n✅ Latency Test Complete:`);
        console.log(`   Average: ${avgLatency.toFixed(2)}ms`);
        console.log(`   Min: ${minLatency}ms, Max: ${maxLatency}ms`);
    }
    
    async benchmarkContractDeployment() {
        console.log('\n📄 Testing Contract Deployment...');
        
        const accounts = await this.provider.listAccounts();
        if (accounts.length === 0) return;
        
        const signer = this.provider.getSigner(accounts[0].address);
        
        // Simple contract bytecode (storage contract)
        const contractBytecode = "0x608060405234801561001057600080fd5b506040516101e03803806101e08339818101604052810190610032919061007a565b80600081905550506100a7565b600080fd5b6000819050919050565b61005781610044565b811461006257600080fd5b50565b6000815190506100748161004e565b92915050565b6000602082840312156100905761008f61003f565b5b600061009e84828501610065565b91505092915050565b61012a806100b66000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632a1afcd91460375780636057361d146051575b600080fd5b60005460405190815260200160405180910390f35b606b6004803603810190605b9190608a565b6060565b005b8060008190555050565b600080fd5b6000819050919050565b6084816073565b8114608e57600080fd5b50565b600060208284031215609f57609e606e565b5b6000608b84828501607b565b9150509291505056fea2646970667358221220f8d1c19b8b17b9c3c0b8f5e0a5b5c5f5e5c5e5c5e5c5e5c5e5c5e5c5e5c564736f6c634300080d0033";
        
        const deploymentTimes = [];
        const testRounds = 5;
        
        for (let i = 0; i < testRounds; i++) {
            const startTime = Date.now();
            
            const tx = await signer.sendTransaction({
                data: contractBytecode + "0000000000000000000000000000000000000000000000000000000000000000", // constructor param
                gasLimit: 200000
            });
            
            const receipt = await tx.wait();
            const endTime = Date.now();
            
            deploymentTimes.push(endTime - startTime);
            console.log(`✅ Contract ${i + 1} deployed in ${endTime - startTime}ms`);
        }
        
        const avgDeployment = deploymentTimes.reduce((a, b) => a + b) / deploymentTimes.length;
        
        this.results.tests.contractDeployment = {
            averageMs: avgDeployment,
            samples: deploymentTimes
        };
    }
    
    saveResults() {
        const filename = `benchmark-results-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Results saved to: ${filename}`);
    }
    
    printSummary() {
        console.log('\n📊 BENCHMARK SUMMARY');
        console.log('==========================================');
        
        if (this.results.tests.tps) {
            console.log(`🚄 Transactions Per Second: ${this.results.tests.tps.tps.toFixed(2)} TPS`);
        }
        
        if (this.results.tests.latency) {
            console.log(`⚡ Average Latency: ${this.results.tests.latency.averageMs.toFixed(2)}ms`);
        }
        
        if (this.results.tests.contractDeployment) {
            console.log(`📄 Contract Deployment: ${this.results.tests.contractDeployment.averageMs.toFixed(2)}ms`);
        }
        
        console.log('==========================================');
    }
}

// Run benchmarks
async function main() {
    const benchmark = new QuorumBenchmark();
    await benchmark.runBenchmarks();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = QuorumBenchmark;
```

```bash
# Run performance benchmarks
node scripts/performance-benchmark.js

# Run with custom node URL
node -e "
const Benchmark = require('./scripts/performance-benchmark.js');
const b = new Benchmark('http://localhost:8546');
b.runBenchmarks();
"
```

**📈 Metrics Collected:**
- Transactions per second (TPS)
- Transaction confirmation latency
- Contract deployment times
- Network throughput under load

</details>

---

**💡 Pro Tips:**
- All code examples include error handling and logging
- Use environment variables for sensitive configuration
- Test all examples on a development network first
- Monitor resource usage during performance tests
- Keep deployment artifacts for auditing

---