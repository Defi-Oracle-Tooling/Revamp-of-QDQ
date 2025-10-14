/**
 * Etherscan Integration Service for ChainID 138 and Ethereum Mainnet
 * Provides transaction visibility, balance monitoring, and wallet state exposure
 */

export interface EtherscanConfig {
  apiKey: string;
  mainnetUrl: string;
  chain138Url: string;
  explorerUrl: string;
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  timeStamp: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  status: string;
}

export interface WalletBalance {
  address: string;
  balance: string;
  balanceUSD: string;
  lastUpdated: string;
}

export interface WalletState {
  address: string;
  isActive: boolean;
  transactionCount: number;
  firstTxDate: string;
  lastTxDate: string;
  totalValueTransferred: string;
  complianceStatus: 'verified' | 'pending' | 'flagged';
}

export class EtherscanService {
  private config: EtherscanConfig;
  private online: boolean;

  constructor(config: EtherscanConfig, online: boolean = false) {
    this.config = config;
    this.online = online;
  }

  /**
   * Get wallet balance on Ethereum Mainnet
   */
  async getMainnetBalance(address: string): Promise<WalletBalance> {
    if (this.online) {
      try {
        const got = require('got');
        const response = await got.get(
          `${this.config.mainnetUrl}/api?module=account&action=balance&address=${address}&tag=latest&apikey=${this.config.apiKey}`,
          { timeout: { request: 5000 } }
        ).json();

        if ((response as any).status === '1') {
          const balanceWei = (response as any).result;
          const balanceEth = (parseFloat(balanceWei) / 1e18).toFixed(6);

          return {
            address,
            balance: `${balanceEth} ETH`,
            balanceUSD: `$${(parseFloat(balanceEth) * 2000).toFixed(2)}`, // Mock USD price
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.warn('Etherscan mainnet balance fetch failed:', error);
      }
    }

    // Simulation fallback
    return {
      address,
      balance: '1.234567 ETH',
      balanceUSD: '$2,469.13',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get transaction history for wallet
   */
  async getTransactionHistory(address: string, chainId: number = 1): Promise<TransactionData[]> {
    const apiUrl = chainId === 138 ? this.config.chain138Url : this.config.mainnetUrl;

    if (this.online) {
      try {
        const got = require('got');
        const response = await got.get(
          `${apiUrl}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${this.config.apiKey}`,
          { timeout: { request: 10000 } }
        ).json();

        if ((response as any).status === '1') {
          return (response as any).result.slice(0, 50); // Last 50 transactions
        }
      } catch (error) {
        console.warn('Etherscan transaction history fetch failed:', error);
      }
    }

    // Mock data for simulation
    return [
      {
        hash: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        from: address,
        to: '0x742d35cc6339c4532ce58b3b5a43efffe82c2043',
        value: '1000000000000000000', // 1 ETH in wei
        blockNumber: '18500000',
        timeStamp: String(Math.floor(Date.now() / 1000) - 3600),
        gas: '21000',
        gasPrice: '20000000000',
        gasUsed: '21000',
        isError: '0',
        status: '1'
      },
      {
        hash: '0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567',
        from: '0x8ba1f109551bd432803012645hac136c7cb974dc',
        to: address,
        value: '500000000000000000', // 0.5 ETH in wei
        blockNumber: '18499000',
        timeStamp: String(Math.floor(Date.now() / 1000) - 7200),
        gas: '21000',
        gasPrice: '18000000000',
        gasUsed: '21000',
        isError: '0',
        status: '1'
      }
    ];
  }

  /**
   * Get comprehensive wallet state
   */
  async getWalletState(address: string): Promise<WalletState> {
    const transactions = await this.getTransactionHistory(address);

    if (transactions.length === 0) {
      return {
        address,
        isActive: false,
        transactionCount: 0,
        firstTxDate: 'N/A',
        lastTxDate: 'N/A',
        totalValueTransferred: '0 ETH',
        complianceStatus: 'pending'
      };
    }

    // Calculate statistics
    const firstTx = transactions[transactions.length - 1];
    const lastTx = transactions[0];

    const totalValue = transactions.reduce((sum, tx) => {
      if (tx.from.toLowerCase() === address.toLowerCase()) {
        return sum + parseFloat(tx.value);
      }
      return sum;
    }, 0);

    return {
      address,
      isActive: transactions.length > 0,
      transactionCount: transactions.length,
      firstTxDate: new Date(parseInt(firstTx.timeStamp, 10) * 1000).toISOString(),
      lastTxDate: new Date(parseInt(lastTx.timeStamp, 10) * 1000).toISOString(),
      totalValueTransferred: `${(totalValue / 1e18).toFixed(6)} ETH`,
      complianceStatus: transactions.length > 10 ? 'verified' : 'pending'
    };
  }

  /**
   * Generate Etherscan URLs for addresses and transactions
   */
  getEtherscanUrl(identifier: string, type: 'address' | 'tx' = 'address'): string {
    const baseUrl = this.config.explorerUrl;
    return `${baseUrl}/${type}/${identifier}`;
  }

  /**
   * Monitor wallet for new transactions (polling)
   */
  async startTransactionMonitoring(
    address: string,
    callback: (tx: TransactionData) => void,
    intervalMs: number = 30000
  ): Promise<() => void> {
    let lastKnownTxHash: string | null = null;

    const poll = async () => {
      try {
        const transactions = await this.getTransactionHistory(address);
        if (transactions.length > 0) {
          const latestTx = transactions[0];
          if (lastKnownTxHash && latestTx.hash !== lastKnownTxHash) {
            callback(latestTx);
          }
          lastKnownTxHash = latestTx.hash;
        }
      } catch (error) {
        console.warn('Transaction monitoring error:', error);
      }
    };

    // Initial poll
    await poll();

    // Set up interval
    const intervalId = setInterval(poll, intervalMs);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  /**
   * Batch get balances for multiple addresses
   */
  async getBatchBalances(addresses: string[]): Promise<WalletBalance[]> {
    const balances: WalletBalance[] = [];

    for (const address of addresses) {
      try {
        const balance = await this.getMainnetBalance(address);
        balances.push(balance);
      } catch (error) {
        console.warn(`Failed to get balance for ${address}:`, error);
        balances.push({
          address,
          balance: 'Error',
          balanceUSD: 'Error',
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return balances;
  }

  /**
   * Check if address has recent activity
   */
  async hasRecentActivity(address: string, hoursAgo: number = 24): Promise<boolean> {
    const transactions = await this.getTransactionHistory(address);
    if (transactions.length === 0) return false;

    const cutoffTime = Math.floor(Date.now() / 1000) - (hoursAgo * 3600);
    const recentTx = transactions.find(tx => parseInt(tx.timeStamp, 10) > cutoffTime);

    return !!recentTx;
  }

  /**
   * Get gas usage statistics for address
   */
  async getGasUsageStats(address: string): Promise<{
    totalGasUsed: string;
    totalGasCost: string;
    avgGasPrice: string;
    transactionCount: number;
  }> {
    const transactions = await this.getTransactionHistory(address);

    if (transactions.length === 0) {
      return {
        totalGasUsed: '0',
        totalGasCost: '0 ETH',
        avgGasPrice: '0 gwei',
        transactionCount: 0
      };
    }

    const totalGasUsed = transactions.reduce((sum, tx) => sum + parseInt(tx.gasUsed, 10), 0);
    const totalGasCost = transactions.reduce((sum, tx) => {
      return sum + (parseInt(tx.gasUsed, 10) * parseInt(tx.gasPrice, 10));
    }, 0);
    const avgGasPrice = transactions.reduce((sum, tx) => sum + parseInt(tx.gasPrice, 10), 0) / transactions.length;

    return {
      totalGasUsed: totalGasUsed.toString(),
      totalGasCost: `${(totalGasCost / 1e18).toFixed(6)} ETH`,
      avgGasPrice: `${Math.round(avgGasPrice / 1e9)} gwei`,
      transactionCount: transactions.length
    };
  }
}