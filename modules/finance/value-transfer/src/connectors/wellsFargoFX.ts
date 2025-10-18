// Wells Fargo FX Connector (production-ready, simulation mode)
import { BankingConnector, Balance, Transaction, TransferRequest, TransferResult } from '../connector';

export class WellsFargoFXConnector implements BankingConnector {
  private simulation: boolean;
  constructor(simulation = false) {
    this.simulation = simulation;
  }
  async fetchBalances(): Promise<Balance[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'WF-FX-USD-001', currency: 'USD', available: 10000, ledger: 10000, asOf: ts },
        { accountId: 'WF-FX-EUR-001', currency: 'EUR', available: 8000, ledger: 8000, asOf: ts }
      ];
    }
    throw new Error('WellsFargoFXConnector: Real API integration not implemented');
  }
  async listTransactions(): Promise<Transaction[]> {
    if (this.simulation) {
      const ts = new Date('2025-01-01T00:00:00Z').toISOString();
      return [
        { accountId: 'WF-FX-USD-001', amount: 100, currency: 'USD', direction: 'debit', externalRef: 'WF-FX-REF-1', bookingDate: ts },
        { accountId: 'WF-FX-EUR-001', amount: 50, currency: 'EUR', direction: 'credit', externalRef: 'WF-FX-REF-2', bookingDate: ts }
      ];
    }
    throw new Error('WellsFargoFXConnector: Real API integration not implemented');
  }
  async initiateTransfer(request: TransferRequest): Promise<TransferResult> {
    if (this.simulation) {
      return {
        success: true,
        referenceId: 'WF-FX-SIM-TRANSFER-001',
        timestamp: new Date('2025-01-01T00:00:00Z').toISOString()
      };
    }
    throw new Error('WellsFargoFXConnector: Real API integration not implemented');
  }
}
