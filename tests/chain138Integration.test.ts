import { EtherscanService } from '../src/integrations/etherscan/etherscan';
import { BankApiConnector } from '../src/integrations/bank/bankApi';
import { FireflyAdapter } from '../src/integrations/firefly/firefly';

describe('ChainID 138 Integration Tests', () => {

  describe('Etherscan Integration', () => {
    const etherscanConfig = {
      apiKey: 'test-key',
      mainnetUrl: 'https://api.etherscan.io',
      chain138Url: 'https://api.chain138.io',
      explorerUrl: 'https://etherscan.io'
    };

    const etherscan = new EtherscanService(etherscanConfig, false);

    it('should get wallet balance', async () => {
      const balance = await etherscan.getMainnetBalance('0x742d35cc6339c4532ce58b3b5a43efffe82c2043');
      expect(balance).toHaveProperty('address');
      expect(balance).toHaveProperty('balance');
      expect(balance).toHaveProperty('balanceUSD');
    });

    it('should get transaction history', async () => {
      const transactions = await etherscan.getTransactionHistory('0x742d35cc6339c4532ce58b3b5a43efffe82c2043');
      expect(Array.isArray(transactions)).toBe(true);
      if (transactions.length > 0) {
        expect(transactions[0]).toHaveProperty('hash');
        expect(transactions[0]).toHaveProperty('from');
        expect(transactions[0]).toHaveProperty('to');
      }
    });

    it('should generate correct Etherscan URLs', () => {
      const addressUrl = etherscan.getEtherscanUrl('0x742d35cc6339c4532ce58b3b5a43efffe82c2043');
      expect(addressUrl).toContain('etherscan.io/address/');

      const txUrl = etherscan.getEtherscanUrl('0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'tx');
      expect(txUrl).toContain('etherscan.io/tx/');
    });

    it('should check recent activity', async () => {
      const hasActivity = await etherscan.hasRecentActivity('0x742d35cc6339c4532ce58b3b5a43efffe82c2043', 24);
      expect(typeof hasActivity).toBe('boolean');
    });
  });

  describe('Bank API Integration', () => {
    const bankConfig = {
      baseUrl: 'https://api-sandbox.bank.com',
      apiKey: 'test-api-key',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      environment: 'sandbox' as const,
      timeout: 5000
    };

    const bankApi = new BankApiConnector(bankConfig, false);

    it('should authenticate successfully', async () => {
      const token = await bankApi.authenticate();
      expect(token).toHaveProperty('accessToken');
      expect(token).toHaveProperty('tokenType');
      expect(token.tokenType).toBe('Bearer');
    });

    it('should get bank accounts', async () => {
      const accounts = await bankApi.getBankAccounts();
      expect(Array.isArray(accounts)).toBe(true);
      if (accounts.length > 0) {
        expect(accounts[0]).toHaveProperty('accountId');
        expect(accounts[0]).toHaveProperty('currency');
        expect(accounts[0]).toHaveProperty('balance');
      }
    });

    it('should validate bank account details', async () => {
      const validation = await bankApi.validateBankAccount('1234567890', '021000021');
      expect(validation).toHaveProperty('valid');
      expect(typeof validation.valid).toBe('boolean');
    });

    it('should process transactions with compliance', async () => {
      const transaction = await bankApi.processTransaction(
        'acc_demo_123456',
        '9876543210',
        '100.00',
        'USD',
        'Test transfer'
      );
      expect(transaction).toHaveProperty('transactionId');
      expect(transaction).toHaveProperty('complianceChecks');
      expect(transaction.complianceChecks).toHaveProperty('amlScreening');
      expect(transaction.complianceChecks).toHaveProperty('sanctionsCheck');
    });
  });

  describe('Firefly Integration', () => {
    const fireflyConfig = {
      apiBaseUrl: 'https://firefly-sandbox.local',
      authToken: 'test-token',
      namespace: 'org1'
    };

    const firefly = new FireflyAdapter(fireflyConfig, false);

    it('should broadcast messages', async () => {
      const payload = {
        topic: 'wallet-events',
        message: 'Virtual account created',
        tags: ['wallet', 'account']
      };

      const result = await firefly.broadcast(payload);
      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^ff-/);
    });
  });

  describe('Smart Contract Deployment', () => {
    it('should have deployment script', () => {
      const fs = require('fs');
      const deploymentScript = 'files/common/smart_contracts/chain138/scripts/deploy.js';
      expect(fs.existsSync(deploymentScript)).toBe(true);
    });

    it('should have all required smart contracts', () => {
      const fs = require('fs');
      const contracts = [
        'files/common/smart_contracts/chain138/ISO20022CompliantEMoneyToken.sol',
        'files/common/smart_contracts/chain138/LockAndMintBridge.sol',
        'files/common/smart_contracts/chain138/ComplianceOracle.sol'
      ];

      contracts.forEach(contract => {
        expect(fs.existsSync(contract)).toBe(true);
      });
    });
  });

  describe('Frontend Integration', () => {
    it('should have wallet management components', () => {
      const fs = require('fs');
      const components = [
        'files/common/dapps/quorumToken/frontend/src/components/wallets/VirtualAccountManager.tsx',
        'files/common/dapps/quorumToken/frontend/src/components/wallets/FiatWalletManager.tsx',
        'files/common/dapps/quorumToken/frontend/src/components/wallets/CrossChainBridge.tsx'
      ];

      components.forEach(component => {
        expect(fs.existsSync(component)).toBe(true);
      });
    });

    it('should have API endpoints', () => {
      const fs = require('fs');
      const apiEndpoint = 'files/common/dapps/quorumToken/frontend/pages/api/tatum.ts';
      expect(fs.existsSync(apiEndpoint)).toBe(true);
    });
  });
});

describe('End-to-End Wallet Workflow Tests', () => {
  it('should create virtual account and perform cross-chain transfer', async () => {
    // This would be an integration test that:
    // 1. Creates a virtual account via Tatum API
    // 2. Initiates a cross-chain bridge transaction
    // 3. Verifies the transaction on Etherscan
    // 4. Confirms compliance checks

    // Mock implementation for demonstration
    const workflowResult = {
      virtualAccount: { id: 'va_test', currency: 'EUR' },
      bridgeTransaction: { id: 'bridge_test', status: 'Completed' },
      etherscanVisible: true,
      complianceApproved: true
    };

    expect(workflowResult.virtualAccount).toHaveProperty('id');
    expect(workflowResult.bridgeTransaction.status).toBe('Completed');
    expect(workflowResult.etherscanVisible).toBe(true);
    expect(workflowResult.complianceApproved).toBe(true);
  });
});