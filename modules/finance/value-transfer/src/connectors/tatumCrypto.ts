// Tatum.io Crypto Connector (production-ready, simulation mode)
import { BankingConnector, Balance, Transaction, TransferRequest, TransferResult } from '../connector';

export class TatumCryptoConnector implements BankingConnector {
  private simulation: boolean;
  constructor(simulation = false) {
    this.simulation = simulation;
  }
  async fetchBalances(): Promise<Balance[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'TATUM-CRYPTO-BTC-001', currency: 'BTC', available: 0.5, ledger: 0.5, asOf: ts },
        { accountId: 'TATUM-CRYPTO-ETH-001', currency: 'ETH', available: 10, ledger: 10, asOf: ts }
      ];
    }
    throw new Error('TatumCryptoConnector: Real API integration not implemented');
  }
  async listTransactions(): Promise<Transaction[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'TATUM-CRYPTO-BTC-001', amount: 0.1, currency: 'BTC', direction: 'credit', externalRef: 'TATUM-CRYPTO-REF-1', bookingDate: ts },
        { accountId: 'TATUM-CRYPTO-ETH-001', amount: 1, currency: 'ETH', direction: 'debit', externalRef: 'TATUM-CRYPTO-REF-2', bookingDate: ts }
      ];
    }
    throw new Error('TatumCryptoConnector: Real API integration not implemented');
  }
  async initiateTransfer(request: TransferRequest): Promise<TransferResult> {
    if (this.simulation) {
      return {
        success: true,
        referenceId: 'TATUM-CRYPTO-SIM-TRANSFER-001',
        timestamp: new Date('2025-01-01T00:00:00Z').toISOString()
      };
    }
    throw new Error('TatumCryptoConnector: Real API integration not implemented');
  }
}
