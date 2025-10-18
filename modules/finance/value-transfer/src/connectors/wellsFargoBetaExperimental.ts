// Wells Fargo Beta/Experimental/Optional Connector (simulation only)
import { BankingConnector, Balance, Transaction, TransferRequest, TransferResult } from '../connector';

export class WellsFargoBetaExperimentalConnector implements BankingConnector {
  private simulation: boolean;
  constructor(simulation = true) {
    this.simulation = simulation;
  }
  async fetchBalances(): Promise<Balance[]> {
    const ts = new Date('2025-01-01T00:00:00Z').toISOString();
    return [
      { accountId: 'WF-BETA-USD-001', currency: 'USD', available: 12345, ledger: 12345, asOf: ts }
    ];
  }
  async listTransactions(): Promise<Transaction[]> {
    const ts = new Date('2025-01-01T00:00:00Z').toISOString();
    return [
      { accountId: 'WF-BETA-USD-001', amount: 42, currency: 'USD', direction: 'credit', externalRef: 'WF-BETA-REF-1', bookingDate: ts }
    ];
  }
  async initiateTransfer(request: TransferRequest): Promise<TransferResult> {
    return {
      success: true,
      referenceId: 'WF-BETA-SIM-TRANSFER-001',
      timestamp: new Date('2025-01-01T00:00:00Z').toISOString()
    };
  }
}
