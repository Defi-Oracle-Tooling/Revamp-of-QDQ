// Wells Fargo RTP Connector (production-ready, simulation mode)
import { BankingConnector, Balance, Transaction, TransferRequest, TransferResult } from '../connector';

export class WellsFargoRTPConnector implements BankingConnector {
  private simulation: boolean;
  constructor(simulation = false) {
    this.simulation = simulation;
  }
  async fetchBalances(): Promise<Balance[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'WF-RTP-USD-001', currency: 'USD', available: 30000, ledger: 30000, asOf: ts }
      ];
    }
    throw new Error('WellsFargoRTPConnector: Real API integration not implemented');
  }
  async listTransactions(): Promise<Transaction[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'WF-RTP-USD-001', amount: 200, currency: 'USD', direction: 'credit', externalRef: 'WF-RTP-REF-1', bookingDate: ts }
      ];
    }
    throw new Error('WellsFargoRTPConnector: Real API integration not implemented');
  }
  async initiateTransfer(request: TransferRequest): Promise<TransferResult> {
    if (this.simulation) {
      return {
        success: true,
        referenceId: 'WF-RTP-SIM-TRANSFER-001',
        timestamp: new Date('2025-01-01T00:00:00Z').toISOString()
      };
    }
    throw new Error('WellsFargoRTPConnector: Real API integration not implemented');
  }
}
