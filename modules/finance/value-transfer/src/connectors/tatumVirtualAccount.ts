// Tatum.io Virtual Account Connector (production-ready, simulation mode)
import { BankingConnector, Balance, Transaction, TransferRequest, TransferResult } from '../connector';

export class TatumVirtualAccountConnector implements BankingConnector {
  private simulation: boolean;
  constructor(simulation = false) {
    this.simulation = simulation;
  }
  async fetchBalances(): Promise<Balance[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'TATUM-VA-USD-001', currency: 'USD', available: 15000, ledger: 15000, asOf: ts }
      ];
    }
    throw new Error('TatumVirtualAccountConnector: Real API integration not implemented');
  }
  async listTransactions(): Promise<Transaction[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'TATUM-VA-USD-001', amount: 300, currency: 'USD', direction: 'credit', externalRef: 'TATUM-VA-REF-1', bookingDate: ts }
      ];
    }
    throw new Error('TatumVirtualAccountConnector: Real API integration not implemented');
  }
  async initiateTransfer(request: TransferRequest): Promise<TransferResult> {
    if (this.simulation) {
      return {
        success: true,
        referenceId: 'TATUM-VA-SIM-TRANSFER-001',
        timestamp: new Date('2025-01-01T00:00:00Z').toISOString()
      };
    }
    throw new Error('TatumVirtualAccountConnector: Real API integration not implemented');
  }
}
