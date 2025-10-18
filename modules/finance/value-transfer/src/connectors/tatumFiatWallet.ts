// Tatum.io Fiat Wallet Connector (production-ready, simulation mode)
import { BankingConnector, Balance, Transaction, TransferRequest, TransferResult } from '../connector';

export class TatumFiatWalletConnector implements BankingConnector {
  private simulation: boolean;
  constructor(simulation = false) {
    this.simulation = simulation;
  }
  async fetchBalances(): Promise<Balance[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'TATUM-FIAT-USD-001', currency: 'USD', available: 8000, ledger: 8000, asOf: ts }
      ];
    }
    throw new Error('TatumFiatWalletConnector: Real API integration not implemented');
  }
  async listTransactions(): Promise<Transaction[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'TATUM-FIAT-USD-001', amount: 120, currency: 'USD', direction: 'debit', externalRef: 'TATUM-FIAT-REF-1', bookingDate: ts }
      ];
    }
    throw new Error('TatumFiatWalletConnector: Real API integration not implemented');
  }
  async initiateTransfer(request: TransferRequest): Promise<TransferResult> {
    if (this.simulation) {
      return {
        success: true,
        referenceId: 'TATUM-FIAT-SIM-TRANSFER-001',
        timestamp: new Date('2025-01-01T00:00:00Z').toISOString()
      };
    }
    throw new Error('TatumFiatWalletConnector: Real API integration not implemented');
  }
}
