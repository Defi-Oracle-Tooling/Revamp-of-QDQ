#!/bin/bash
# Comprehensive deployment script for ChainID 138 wallet integration
# Deploys smart contracts, starts services, and validates the complete ecosystem

set -e

echo "🚀 Starting ChainID 138 Wallet Integration Deployment"
echo "=================================================="

# Configuration
NETWORK_DIR="./quorum-chain138-network"
FRONTEND_DIR="files/common/dapps/quorumToken/frontend"
CONTRACTS_DIR="files/common/smart_contracts/chain138"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is required but not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is required but not installed"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Generate Quorum network with ChainID 138 configuration
generate_network() {
    log "Generating Quorum network with ChainID 138 configuration..."
    
    node build/index.js \
        --clientType besu \
        --outputPath "$NETWORK_DIR" \
        --chainId 138 \
        --privacy true \
        --monitoring loki \
        --blockscout true \
        --includeDapp quorumToken \
        --chain138 "gov=ChainToken:CHAIN:1000000;feed=ethUsd:60" \
        --firefly "https://firefly.local,org1" \
        --bridges "layerzero:1:138;wormhole:137:138" \
        --onlineIntegrations false \
        --walletconnectProjectId "demo-project-id"
    
    if [ $? -eq 0 ]; then
        success "Network generation completed"
    else
        error "Network generation failed"
        exit 1
    fi
}

# Deploy smart contracts
deploy_contracts() {
    log "Deploying ChainID 138 smart contracts..."
    
    cd "$NETWORK_DIR"
    
    # Install Hardhat dependencies
    npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
    
    # Copy smart contracts to generated network
    cp -r "../$CONTRACTS_DIR"/* "./smart_contracts/"
    
    # Deploy using Hardhat
    npx hardhat run smart_contracts/scripts/deploy.js --network localhost
    
    if [ $? -eq 0 ]; then
        success "Smart contracts deployed successfully"
    else
        warning "Smart contract deployment failed (may be expected if network not running)"
    fi
    
    cd ..
}

# Start Quorum network
start_network() {
    log "Starting Quorum network..."
    
    cd "$NETWORK_DIR"
    
    # Make scripts executable
    chmod +x run.sh stop.sh
    
    # Start network in background
    ./run.sh &
    NETWORK_PID=$!
    
    # Wait for network to be ready
    log "Waiting for network to initialize..."
    sleep 30
    
    # Check if network is running
    if curl -s http://localhost:8545 > /dev/null; then
        success "Quorum network started successfully"
        echo "$NETWORK_PID" > network.pid
    else
        warning "Network may not be fully ready yet"
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    log "Setting up wallet integration frontend..."
    
    cd "$NETWORK_DIR/dapps/quorumToken"
    
    # Install frontend dependencies
    npm install
    
    # Build frontend
    npm run build
    
    # Start frontend in background
    npm run start &
    FRONTEND_PID=$!
    echo "$FRONTEND_PID" > frontend.pid
    
    success "Frontend setup completed"
    cd ../../..
}

# Run integration tests
run_tests() {
    log "Running integration tests..."
    
    # Run unit tests
    npm test -- tests/chain138Integration.test.ts
    
    if [ $? -eq 0 ]; then
        success "Integration tests passed"
    else
        warning "Some tests may have failed (check logs for details)"
    fi
    
    # Test API endpoints
    log "Testing API endpoints..."
    
    # Wait for services to be ready
    sleep 10
    
    # Test Tatum API
    if curl -s -X POST http://localhost:3000/api/tatum \
        -H "Content-Type: application/json" \
        -d '{"type":"virtualAccount","currency":"EUR"}' > /dev/null; then
        success "Tatum API endpoint working"
    else
        warning "Tatum API endpoint not responding"
    fi
}

# Validate deployment
validate_deployment() {
    log "Validating deployment..."
    
    local validation_passed=true
    
    # Check if network is running
    if ! curl -s http://localhost:8545 > /dev/null; then
        error "Quorum network not accessible"
        validation_passed=false
    fi
    
    # Check if frontend is running
    if ! curl -s http://localhost:3000 > /dev/null; then
        error "Frontend not accessible"
        validation_passed=false
    fi
    
    # Check if block explorer is running
    if ! curl -s http://localhost:26000 > /dev/null; then
        warning "Block explorer not accessible (may take time to start)"
    fi
    
    # Check smart contract artifacts
    if [ ! -f "$NETWORK_DIR/smart_contracts/output/frontend-config.json" ]; then
        warning "Smart contract deployment artifacts not found"
    fi
    
    if [ "$validation_passed" = true ]; then
        success "Deployment validation passed"
        return 0
    else
        error "Deployment validation failed"
        return 1
    fi
}

# Display access information
show_access_info() {
    log "Deployment completed successfully!"
    echo ""
    echo "🌐 Access Information:"
    echo "===================="
    echo "Wallet Frontend:     http://localhost:3000"
    echo "Quorum RPC:          http://localhost:8545"
    echo "Block Explorer:      http://localhost:26000"
    echo "Grafana Dashboard:   http://localhost:3001"
    echo "Prometheus:          http://localhost:9090"
    echo ""
    echo "📁 Generated Files:"
    echo "=================="
    echo "Network Directory:   $NETWORK_DIR"
    echo "Deployment Log:      $LOG_FILE"
    echo "Contract Artifacts:  $NETWORK_DIR/smart_contracts/output/"
    echo ""
    echo "🔧 Management Commands:"
    echo "======================"
    echo "Stop Network:        cd $NETWORK_DIR && ./stop.sh"
    echo "View Logs:           cd $NETWORK_DIR && docker-compose logs -f"
    echo "Restart Frontend:    cd $NETWORK_DIR/dapps/quorumToken && npm run dev"
    echo ""
    echo "📚 Documentation:"
    echo "================="
    echo "README:              $NETWORK_DIR/README.md"
    echo "DApp Guide:          $NETWORK_DIR/dapps/quorumToken/README.md"
    echo ""
    echo "✨ Features Available:"
    echo "===================="
    echo "• Virtual Account Management via Tatum.io"
    echo "• Fiat Wallet Integration with Bank APIs"
    echo "• Cross-Chain Bridge (Lock-and-Mint)"
    echo "• ISO-20022 Compliant E-Money Tokens"
    echo "• Etherscan Transaction Visibility"
    echo "• Regulatory Compliance Checks"
    echo "• Hyperledger Firefly Integration"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    # Stop services if they were started
    if [ -f "$NETWORK_DIR/network.pid" ]; then
        kill $(cat "$NETWORK_DIR/network.pid") 2>/dev/null || true
        rm -f "$NETWORK_DIR/network.pid"
    fi
    
    if [ -f "$NETWORK_DIR/dapps/quorumToken/frontend.pid" ]; then
        kill $(cat "$NETWORK_DIR/dapps/quorumToken/frontend.pid") 2>/dev/null || true
        rm -f "$NETWORK_DIR/dapps/quorumToken/frontend.pid"
    fi
}

# Trap cleanup on script exit
trap cleanup EXIT

# Main execution flow
main() {
    echo "Starting deployment at $(date)"
    
    check_prerequisites
    
    # Build the project
    log "Building project..."
    npm run build
    
    generate_network
    deploy_contracts
    start_network
    setup_frontend
    run_tests
    
    if validate_deployment; then
        show_access_info
    else
        error "Deployment validation failed. Check logs for details."
        exit 1
    fi
    
    log "Deployment script completed successfully!"
}

# Parse command line arguments
SKIP_TESTS=false
CLEANUP_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --cleanup-only)
            CLEANUP_ONLY=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-tests     Skip running integration tests"
            echo "  --cleanup-only   Only perform cleanup and exit"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Handle cleanup-only mode
if [ "$CLEANUP_ONLY" = true ]; then
    cleanup
    success "Cleanup completed"
    exit 0
fi

# Skip tests if requested
if [ "$SKIP_TESTS" = true ]; then
    log "Skipping tests as requested"
    run_tests() { log "Tests skipped"; }
fi

# Run main deployment
main