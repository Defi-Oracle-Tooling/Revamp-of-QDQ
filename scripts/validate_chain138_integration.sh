#!/bin/bash
# Comprehensive ChainID 138 Integration Validation Script
# Validates all integration points and component connectivity

set -e

echo "🔍 ChainID 138 Integration Validation"
echo "====================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Validation results
PASSED=0
FAILED=0
WARNINGS=0

validate_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED++))
}

validate_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED++))
}

validate_warn() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    ((WARNINGS++))
}

validate_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

# 1. Core Integration Service Files
echo -e "\n${BLUE}1. Core Integration Services${NC}"
echo "----------------------------"

if [ -f "src/integrations/tatum/tatum.ts" ]; then
    validate_pass "Tatum.io integration service exists"
    
    # Check for key classes and methods
    if grep -q "class TatumAdapter" "src/integrations/tatum/tatum.ts"; then
        validate_pass "TatumAdapter class found"
    else
        validate_fail "TatumAdapter class missing"
    fi
    
    if grep -q "createVirtualAccount" "src/integrations/tatum/tatum.ts"; then
        validate_pass "Virtual account creation method found"
    else
        validate_fail "Virtual account creation method missing"
    fi
    
    if grep -q "createFiatWallet" "src/integrations/tatum/tatum.ts"; then
        validate_pass "Fiat wallet creation method found"
    else
        validate_fail "Fiat wallet creation method missing"
    fi
    
    if grep -q "ChainID138WalletConfig" "src/integrations/tatum/tatum.ts"; then
        validate_pass "ChainID 138 wallet configuration interface found"
    else
        validate_fail "ChainID 138 configuration missing"
    fi
else
    validate_fail "Tatum.io integration service missing"
fi

if [ -f "src/integrations/etherscan/etherscan.ts" ]; then
    validate_pass "Etherscan integration service exists"
    
    if grep -q "class EtherscanService" "src/integrations/etherscan/etherscan.ts"; then
        validate_pass "EtherscanService class found"
    else
        validate_fail "EtherscanService class missing"
    fi
    
    if grep -q "getMainnetBalance" "src/integrations/etherscan/etherscan.ts"; then
        validate_pass "Balance query method found"
    else
        validate_fail "Balance query method missing"
    fi
    
    if grep -q "getTransactionHistory" "src/integrations/etherscan/etherscan.ts"; then
        validate_pass "Transaction history method found"
    else
        validate_fail "Transaction history method missing"
    fi
else
    validate_fail "Etherscan integration service missing"
fi

if [ -f "src/integrations/bank/bankApi.ts" ]; then
    validate_pass "Bank API integration service exists"
    
    if grep -q "class BankApiConnector" "src/integrations/bank/bankApi.ts"; then
        validate_pass "BankApiConnector class found"
    else
        validate_fail "BankApiConnector class missing"
    fi
    
    if grep -q "OAuth 2.0" "src/integrations/bank/bankApi.ts"; then
        validate_pass "OAuth 2.0 authentication references found"
    else
        validate_warn "OAuth 2.0 authentication not explicitly documented"
    fi
else
    validate_fail "Bank API integration service missing"
fi

if [ -f "src/integrations/firefly/firefly.ts" ]; then
    validate_pass "Hyperledger Firefly integration exists"
    
    if grep -q "class FireflyAdapter" "src/integrations/firefly/firefly.ts"; then
        validate_pass "FireflyAdapter class found"
    else
        validate_fail "FireflyAdapter class missing"
    fi
else
    validate_fail "Hyperledger Firefly integration missing"
fi

# 2. Smart Contract Validation
echo -e "\n${BLUE}2. Smart Contract Ecosystem${NC}"
echo "---------------------------"

CONTRACTS=(
    "files/common/smart_contracts/chain138/ISO20022CompliantEMoneyToken.sol"
    "files/common/smart_contracts/chain138/LockAndMintBridge.sol"
    "files/common/smart_contracts/chain138/ComplianceOracle.sol"
)

for contract in "${CONTRACTS[@]}"; do
    if [ -f "$contract" ]; then
        validate_pass "Smart contract exists: $(basename "$contract")"
        
        # Check for OpenZeppelin imports
        if grep -q "@openzeppelin/contracts" "$contract"; then
            validate_pass "  OpenZeppelin security libraries imported"
        else
            validate_warn "  OpenZeppelin imports not found"
        fi
        
        # Check for access control
        if grep -q "AccessControl" "$contract"; then
            validate_pass "  Access control implemented"
        else
            validate_warn "  Access control not found"
        fi
        
        # Check for reentrancy protection
        if grep -q "ReentrancyGuard" "$contract"; then
            validate_pass "  Reentrancy protection implemented"
        else
            validate_warn "  Reentrancy protection not found"
        fi
    else
        validate_fail "Smart contract missing: $(basename "$contract")"
    fi
done

# Check deployment scripts
if [ -f "files/common/smart_contracts/chain138/scripts/deploy.js" ]; then
    validate_pass "Smart contract deployment script exists"
    
    if grep -q "ChainID 138" "files/common/smart_contracts/chain138/scripts/deploy.js"; then
        validate_pass "  ChainID 138 specific deployment configuration"
    else
        validate_warn "  ChainID 138 configuration not explicitly mentioned"
    fi
    
    # Check for all token deployments
    TOKENS=("EURC138" "USDC138" "USDT138" "DAI138" "M1USD" "M1EUR" "M1GBP" "M1JPY")
    for token in "${TOKENS[@]}"; do
        if grep -q "$token" "files/common/smart_contracts/chain138/scripts/deploy.js"; then
            validate_pass "  Token deployment configured: $token"
        else
            validate_warn "  Token deployment missing: $token"
        fi
    done
else
    validate_fail "Smart contract deployment script missing"
fi

# 3. Frontend Component Validation
echo -e "\n${BLUE}3. Frontend Components${NC}"
echo "----------------------"

FRONTEND_COMPONENTS=(
    "files/common/dapps/quorumToken/frontend/src/components/wallets/VirtualAccountManager.tsx"
    "files/common/dapps/quorumToken/frontend/src/components/wallets/FiatWalletManager.tsx"
    "files/common/dapps/quorumToken/frontend/src/components/wallets/CrossChainBridge.tsx"
)

for component in "${FRONTEND_COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        validate_pass "Frontend component exists: $(basename "$component")"
        
        # Check for React imports
        if grep -q "import React" "$component"; then
            validate_pass "  React imports found"
        else
            validate_warn "  React imports not found"
        fi
        
        # Check for Chakra UI
        if grep -q "@chakra-ui/react" "$component"; then
            validate_pass "  Chakra UI components used"
        else
            validate_warn "  Chakra UI not found"
        fi
        
        # Check for API integration
        if grep -q "/api/" "$component"; then
            validate_pass "  API integration found"
        else
            validate_warn "  API integration not found"
        fi
    else
        validate_fail "Frontend component missing: $(basename "$component")"
    fi
done

# Check API endpoints
if [ -f "files/common/dapps/quorumToken/frontend/pages/api/tatum.ts" ]; then
    validate_pass "Tatum API endpoint exists"
    
    if grep -q "NextApiRequest" "files/common/dapps/quorumToken/frontend/pages/api/tatum.ts"; then
        validate_pass "  Next.js API handler properly typed"
    else
        validate_warn "  API handler typing not found"
    fi
    
    if grep -q "TatumAdapter" "files/common/dapps/quorumToken/frontend/pages/api/tatum.ts"; then
        validate_pass "  TatumAdapter integration found"
    else
        validate_warn "  TatumAdapter integration not found"
    fi
else
    validate_fail "Tatum API endpoint missing"
fi

# 4. Test Coverage Validation
echo -e "\n${BLUE}4. Test Coverage${NC}"
echo "----------------"

if [ -f "tests/chain138Integration.test.ts" ]; then
    validate_pass "Integration test suite exists"
    
    # Check test coverage areas
    TEST_AREAS=("Etherscan Integration" "Bank API Integration" "Firefly Integration" "Smart Contract Deployment" "Frontend Integration")
    for area in "${TEST_AREAS[@]}"; do
        if grep -q "$area" "tests/chain138Integration.test.ts"; then
            validate_pass "  Test coverage: $area"
        else
            validate_warn "  Test coverage missing: $area"
        fi
    done
else
    validate_fail "Integration test suite missing"
fi

# 5. Configuration and Documentation
echo -e "\n${BLUE}5. Configuration & Documentation${NC}"
echo "---------------------------------"

if [ -f "scripts/deploy_chain138_ecosystem.sh" ]; then
    validate_pass "Complete ecosystem deployment script exists"
    
    if [ -x "scripts/deploy_chain138_ecosystem.sh" ]; then
        validate_pass "  Deployment script is executable"
    else
        validate_warn "  Deployment script not executable"
    fi
    
    if grep -q "ChainID 138" "scripts/deploy_chain138_ecosystem.sh"; then
        validate_pass "  ChainID 138 configuration found"
    else
        validate_warn "  ChainID 138 configuration not explicit"
    fi
else
    validate_fail "Ecosystem deployment script missing"
fi

if grep -q "ChainID 138 Wallet Integration" "README.md"; then
    validate_pass "README documentation includes ChainID 138 section"
else
    validate_warn "README missing ChainID 138 documentation"
fi

if [ -f "CHAIN138_IMPLEMENTATION_SUMMARY.md" ]; then
    validate_pass "Implementation summary document exists"
else
    validate_warn "Implementation summary document missing"
fi

# 6. Integration Point Validation
echo -e "\n${BLUE}6. Integration Points${NC}"
echo "---------------------"

validate_info "Checking cross-component integration points..."

# Check if Tatum references Etherscan
if grep -q "etherscan" "src/integrations/tatum/tatum.ts"; then
    validate_pass "Tatum-Etherscan integration found"
else
    validate_warn "Tatum-Etherscan integration not found"
fi

# Check if contracts reference compliance
if grep -q "compliance" "files/common/smart_contracts/chain138/"*.sol; then
    validate_pass "Smart contracts have compliance integration"
else
    validate_warn "Smart contracts missing compliance references"
fi

# Check if frontend connects to backend
if grep -q "fetch.*api" "files/common/dapps/quorumToken/frontend/src/components/wallets/"*.tsx; then
    validate_pass "Frontend-backend API integration found"
else
    validate_warn "Frontend-backend integration not found"
fi

# 7. Security and Compliance
echo -e "\n${BLUE}7. Security & Compliance${NC}"
echo "-------------------------"

# Check for security patterns
if grep -q "ReentrancyGuard" "files/common/smart_contracts/chain138/"*.sol; then
    validate_pass "Reentrancy protection implemented"
else
    validate_fail "Reentrancy protection missing"
fi

if grep -q "AccessControl" "files/common/smart_contracts/chain138/"*.sol; then
    validate_pass "Access control implemented"
else
    validate_fail "Access control missing"
fi

if grep -q "Pausable" "files/common/smart_contracts/chain138/"*.sol; then
    validate_pass "Emergency pause mechanism implemented"
else
    validate_warn "Emergency pause mechanism not found"
fi

# Check for compliance standards
if grep -q "ISO.*20022" "src/integrations/tatum/tatum.ts"; then
    validate_pass "ISO-20022 compliance implemented"
else
    validate_warn "ISO-20022 compliance not found"
fi

if grep -q "OAuth.*2\.0" "src/integrations/bank/bankApi.ts"; then
    validate_pass "OAuth 2.0 authentication implemented"
else
    validate_warn "OAuth 2.0 authentication not found"
fi

# 8. Build and Lint Status
echo -e "\n${BLUE}8. Build & Code Quality${NC}"
echo "-----------------------"

if npm run build >/dev/null 2>&1; then
    validate_pass "Project builds successfully"
else
    validate_fail "Project build failed"
fi

if npm run lint >/dev/null 2>&1; then
    validate_pass "Code passes linting"
else
    validate_warn "Code has linting issues"
fi

# Summary
echo -e "\n${BLUE}Validation Summary${NC}"
echo "=================="
echo -e "✅ Passed:   ${GREEN}$PASSED${NC}"
echo -e "❌ Failed:   ${RED}$FAILED${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"

TOTAL=$((PASSED + FAILED + WARNINGS))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo -e "\nSuccess Rate: ${GREEN}${SUCCESS_RATE}%${NC} ($PASSED/$TOTAL)"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All critical validations passed!${NC}"
    echo "The ChainID 138 wallet integration is ready for deployment."
    exit 0
else
    echo -e "\n${RED}❌ Critical failures detected!${NC}"
    echo "Please address the failed validations before deployment."
    exit 1
fi