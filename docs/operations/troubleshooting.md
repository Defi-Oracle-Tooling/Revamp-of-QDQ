# Troubleshooting Guide

> **Status:** Active | **Last Updated:** 2025-10-14 | **Version:** 0.4.0

This comprehensive troubleshooting guide covers common issues, diagnostic procedures, and solutions for Quorum Dev Quickstart networks.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Network Generation Issues](#network-generation-issues)
- [Network Startup Problems](#network-startup-problems)
- [Node Connectivity Issues](#node-connectivity-issues)
- [Performance Problems](#performance-problems)
- [Integration Issues](#integration-issues)
- [Regional Topology Issues](#regional-topology-issues)
- [Security and Access Issues](#security-and-access-issues)
- [Advanced Diagnostics](#advanced-diagnostics)

## Quick Diagnostics

### System Health Check
```bash
# Run comprehensive system check
./scripts/health-check.sh

# Manual system verification
echo "=== System Requirements Check ==="
node --version          # Should be v16+
npm --version          # Should be 8+
docker --version       # Should be 20+
docker-compose version # Should be 1.29+
free -h               # Check available memory (4GB+ recommended)
df -h                 # Check disk space (10GB+ recommended)
```

### Network Status Check
```bash
# Check if network is running
docker-compose ps

# Check specific service health
docker-compose exec validator1 curl -s http://localhost:8545 \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'

# View recent logs
docker-compose logs --tail=50 validator1
```

### Port Availability Check
```bash
# Check if required ports are available
netstat -tulpn | grep -E ':(8545|25000|3000|9090|3100)'

# Check for port conflicts
sudo lsof -i :8545  # RPC port
sudo lsof -i :25000 # Block explorer
sudo lsof -i :3000  # Grafana
```

## Network Generation Issues

### Generation Fails with Template Errors

#### **Symptom**: Template rendering errors during generation
```
Error: Template compilation failed
Error: Variable 'validators' is undefined
```

#### **Diagnosis**:
```bash
# Check template syntax
npm run lint-templates

# Verify NetworkContext properties
node -e "
const context = require('./build/index.js').parseCliArgs(process.argv.slice(2));
console.log(JSON.stringify(context, null, 2));
" --clientType besu --validators 4
```

#### **Solutions**:
```bash
# Fix 1: Ensure all required parameters provided
npx quorum-dev-quickstart --clientType besu --privacy true

# Fix 2: Clear template cache
rm -rf /tmp/nunjucks-cache

# Fix 3: Validate template variables
grep -r "{{ \w*" templates/ | grep -v "NetworkContext"
```

### CLI Parameter Validation Errors

#### **Symptom**: Invalid parameter combinations
```
Error: --azureNetworkMode hub-spoke requires --azureHubRegion
Error: Region 'invalid-region' not found
```

#### **Diagnosis**:
```bash
# Validate parameters without generation
npx quorum-dev-quickstart --validate --noFileWrite \
  --clientType besu --azureNetworkMode hub-spoke

# Check available options
npx quorum-dev-quickstart --help | grep -A5 azureNetworkMode
```

#### **Solutions**:
```bash
# Fix 1: Provide required parameters
--azureNetworkMode hub-spoke --azureHubRegion eastus

# Fix 2: Use valid region names
--azureRegions "eastus,westus2,northeurope"

# Fix 3: Check parameter combinations
npx quorum-dev-quickstart --validate --clientType besu [other-params]
```

### File Permission Issues

#### **Symptom**: Cannot write to output directory
```
Error: EACCES: permission denied, mkdir '/output/path'
Error: Cannot create file, permission denied
```

#### **Solutions**:
```bash
# Fix 1: Check directory permissions
ls -la /path/to/parent/directory

# Fix 2: Create directory with proper permissions
mkdir -p ./my-network
chmod 755 ./my-network

# Fix 3: Use different output path
--outputPath $HOME/quorum-networks/test-network
```

## Network Startup Problems

### Docker Compose Issues

#### **Symptom**: Services won't start
```
ERROR: Couldn't connect to Docker daemon
ERROR: Service 'validator1' failed to build
```

#### **Diagnosis**:
```bash
# Check Docker daemon status
sudo systemctl status docker

# Check Docker Compose file syntax
docker-compose config

# Verify Docker permissions
docker ps
```

#### **Solutions**:
```bash
# Fix 1: Start Docker daemon
sudo systemctl start docker

# Fix 2: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Fix 3: Fix Docker Compose syntax
docker-compose config --quiet || echo "Syntax error in compose file"
```

### Container Resource Issues

#### **Symptom**: Containers crash or become unresponsive
```
validator1 exited with code 125
Out of memory error in container
```

#### **Diagnosis**:
```bash
# Check container resource usage
docker stats --no-stream

# Check system resources
free -h
df -h

# Check Docker limits
docker system info | grep -E "(Memory|CPU)"
```

#### **Solutions**:
```bash
# Fix 1: Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory > 4GB+

# Fix 2: Reduce network size
--validators 1 --participants 1 --monitoring none

# Fix 3: Close other applications
# Free up system memory before starting network
```

### Port Binding Issues

#### **Symptom**: Port already in use errors
```
Error: bind: address already in use
Cannot start service validator1: port is already allocated
```

#### **Diagnosis**:
```bash
# Find process using ports
sudo netstat -tulpn | grep :8545
sudo lsof -i :8545

# Check Docker port usage
docker port $(docker ps -q)
```

#### **Solutions**:
```bash
# Fix 1: Stop conflicting process
sudo kill -9 <PID>

# Fix 2: Use different ports
# Edit docker-compose.yml port mappings
sed -i 's/8545:8545/8546:8545/' docker-compose.yml

# Fix 3: Stop other Docker networks
docker-compose -f other-network/docker-compose.yml down
```

## Node Connectivity Issues

### Peer Discovery Problems

#### **Symptom**: Nodes can't find peers
```
"peers": 0
WARN - No peers connected
```

#### **Diagnosis**:
```bash
# Check peer counts on all nodes
for i in {1..4}; do
  echo "Node $i peers:"
  curl -s http://localhost:854$i \
    -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq .result
done

# Check network connectivity between containers
docker exec validator1 ping validator2
```

#### **Solutions**:
```bash
# Fix 1: Restart network with clean state
./stop.sh && ./remove.sh && ./run.sh

# Fix 2: Check bootnodes configuration
grep -r "bootnodes" config/

# Fix 3: Verify network configuration
docker network ls
docker network inspect $(docker-compose ps -q | head -1 | xargs docker inspect --format='{{.NetworkSettings.Networks}}' | cut -d: -f1)
```

### RPC Connection Issues

#### **Symptom**: Cannot connect to JSON-RPC endpoint
```
Connection refused on http://localhost:8545
curl: (7) Failed to connect to localhost port 8545: Connection refused
```

#### **Diagnosis**:
```bash
# Check if RPC ports are exposed
docker-compose port validator1 8545

# Check RPC configuration
docker-compose exec validator1 cat /opt/besu/config/config.toml | grep -A5 rpc

# Test internal RPC connection
docker-compose exec validator1 curl -s http://localhost:8545 \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}'
```

#### **Solutions**:
```bash
# Fix 1: Verify port mappings in docker-compose.yml
grep -A10 "ports:" docker-compose.yml

# Fix 2: Wait for node initialization
sleep 30 && curl http://localhost:8545

# Fix 3: Check firewall settings
sudo ufw status
sudo iptables -L
```

## Performance Problems

### Slow Block Production

#### **Symptom**: Long block times or no new blocks
```
Block number hasn't increased in 30+ seconds
Transaction pending for extended time
```

#### **Diagnosis**:
```bash
# Monitor block production
watch -n 5 'curl -s http://localhost:8545 \
  -X POST -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" | jq .result'

# Check validator participation
docker-compose logs validator1 | grep -E "(seal|block|consensus)"
```

#### **Solutions**:
```bash
# Fix 1: Check consensus algorithm configuration
grep -r "consensus" config/

# Fix 2: Verify minimum validators for consensus
# QBFT needs (3f+1) validators where f is max faulty nodes

# Fix 3: Restart problematic validators
docker-compose restart validator2 validator3
```

### High Resource Usage

#### **Symptom**: Excessive CPU/memory usage
```
Containers using 100% CPU
System becomes unresponsive
```

#### **Diagnosis**:
```bash
# Monitor resource usage
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Check for resource limits
docker inspect validator1 | jq '.HostConfig.Memory'

# Check host system resources
top -p $(pgrep -d',' dockerd)
```

#### **Solutions**:
```bash
# Fix 1: Set resource limits
# Add to docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'

# Fix 2: Reduce network complexity
--validators 1 --participants 1 --archiveNodes 0

# Fix 3: Optimize node configuration
# Reduce cache sizes in besu configuration
```

## Integration Issues

### Monitoring Stack Problems

#### **Symptom**: Grafana/Prometheus not accessible
```
Cannot reach http://localhost:3000
Prometheus shows no targets
```

#### **Diagnosis**:
```bash
# Check monitoring services
docker-compose ps | grep -E "(grafana|prometheus|loki)"

# Check service logs
docker-compose logs grafana
docker-compose logs prometheus

# Verify monitoring configuration
curl -s http://localhost:9090/api/v1/targets
```

#### **Solutions**:
```bash
# Fix 1: Restart monitoring services
docker-compose restart grafana prometheus

# Fix 2: Check service discovery
# Verify prometheus.yml configuration
docker-compose exec prometheus cat /etc/prometheus/prometheus.yml

# Fix 3: Reset monitoring data
docker volume rm $(docker volume ls -q | grep -E "(grafana|prometheus)")
```

### Block Explorer Issues

#### **Symptom**: Blockscout not loading or showing data
```
Blockscout shows "No blocks found"
Explorer not accessible at http://localhost:25000
```

#### **Diagnosis**:
```bash
# Check explorer status
curl -I http://localhost:25000

# Check database connectivity
docker-compose logs blockscout | grep -E "(database|connection|error)"

# Verify blockchain connectivity
docker-compose exec blockscout-db psql -U postgres -c "\l"
```

#### **Solutions**:
```bash
# Fix 1: Restart explorer services
docker-compose restart blockscout postgres

# Fix 2: Reset explorer database
docker-compose exec blockscout-db psql -U postgres -c "DROP DATABASE IF EXISTS explorer;"

# Fix 3: Check RPC endpoint configuration
docker-compose exec blockscout env | grep RPC
```

## Regional Topology Issues

### Azure Region Configuration

#### **Symptom**: Invalid region or deployment errors
```
Error: Region 'invalid' not found in Azure regions
Deployment type 'invalid' not supported
```

#### **Diagnosis**:
```bash
# List valid Azure regions
az account list-locations --output table

# Validate regional configuration
npx quorum-dev-quickstart --validate \
  --azureRegionalDistribution "eastus:validators=2"
```

#### **Solutions**:
```bash
# Fix 1: Use valid region names
--azureRegions "eastus,westus2,northeurope"

# Fix 2: Check deployment type options
--azureDeploymentMap "validators=aks,rpc=aca"

# Fix 3: Verify regional distribution format
--azureRegionalDistribution "eastus:validators=3+rpc=2,westus2:validators=2"
```

### Network Topology Configuration

#### **Symptom**: Network topology validation errors
```
Error: Hub region not specified for hub-spoke topology
Error: Too many regions for mesh topology
```

#### **Solutions**:
```bash
# Fix 1: Specify hub region for hub-spoke
--azureNetworkMode hub-spoke --azureHubRegion eastus

# Fix 2: Limit regions for mesh topology (max 5 recommended)
--azureNetworkMode mesh --azureRegions "eastus,westus2,northeurope"

# Fix 3: Use flat topology for simple deployments
--azureNetworkMode flat
```

## Security and Access Issues

### Permission and Access Problems

#### **Symptom**: Cannot access services or files
```
Permission denied accessing configuration files
403 Forbidden accessing web interfaces
```

#### **Solutions**:
```bash
# Fix 1: Check file permissions
chmod -R 755 config/
chmod +x *.sh

# Fix 2: Verify service authentication
# Check Grafana default credentials: admin/admin

# Fix 3: Configure network access
# Ensure services bind to correct interfaces
grep -r "bind" config/
```

### Certificate and TLS Issues

#### **Symptom**: TLS/SSL connection errors
```
TLS handshake failed
Certificate verification failed
```

#### **Solutions**:
```bash
# Fix 1: Regenerate certificates
rm -rf config/certs && ./scripts/generate-certs.sh

# Fix 2: Check certificate validity
openssl x509 -in config/certs/cert.pem -text -noout

# Fix 3: Disable TLS for development
# Update configuration to use HTTP instead of HTTPS
```

## Advanced Diagnostics

### Container Deep Dive

```bash
# Comprehensive container inspection
docker-compose exec validator1 sh -c '
  echo "=== Process List ==="
  ps aux
  echo "=== Network Interfaces ==="
  ip addr show
  echo "=== Mounted Volumes ==="
  df -h
  echo "=== Environment Variables ==="
  env | grep -E "(BESU|QUORUM)"
'
```

### Network Analysis

```bash
# Network connectivity matrix
for i in {1..4}; do
  for j in {1..4}; do
    if [ $i -ne $j ]; then
      echo -n "validator$i -> validator$j: "
      docker exec validator$i ping -c1 -W1 validator$j >/dev/null 2>&1 && echo "OK" || echo "FAIL"
    fi
  done
done
```

### Performance Profiling

```bash
# Resource usage over time
watch -n 5 'docker stats --no-stream --format "{{.Name}}: CPU={{.CPUPerc}} MEM={{.MemUsage}}"'

# Block production timing
curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest",false],"id":1}' | \
  jq -r '.result.timestamp' | xargs -I {} date -d @{}
```

### Log Analysis

```bash
# Search for errors across all services
docker-compose logs | grep -i error | tail -20

# Analyze consensus messages
docker-compose logs | grep -E "(QBFT|IBFT|consensus)" | tail -10

# Monitor transaction flow
docker-compose logs validator1 | grep -E "(transaction|tx)" | tail -10
```

## Getting Help

### Before Seeking Support
1. **Check System Requirements**: Ensure prerequisites are met
2. **Review Logs**: Examine container logs for specific errors
3. **Try Clean Restart**: `./stop.sh && ./remove.sh && ./run.sh`
4. **Check Documentation**: Verify configuration against examples

### Support Channels
- **GitHub Issues**: [Report bugs](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/issues)
- **Discussions**: [Get help](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/discussions)
- **Security Issues**: security@your-org.com

### Information to Include in Support Requests
- Operating system and version
- Docker and Docker Compose versions
- Complete command used to generate network
- Full error messages and logs
- Output of `docker-compose ps` and `docker-compose logs`

---

**Remember**: Most issues can be resolved by ensuring prerequisites are met, checking logs for specific errors, and restarting the network with a clean state.