import { BankingConnector, RawBalanceRecord, RawTransactionRecord, NormalizedBalanceRecord, NormalizedTransactionRecord, ReconciliationResult } from '../bankingConnector';
import { logSimulationFallback } from '../logging';

export class BniBankingConnector implements BankingConnector {
  name = 'bni';
  async fetchBalances(): Promise<RawBalanceRecord[]> {
    logSimulationFallback({ connector: this.name, operation: 'fetchBalances', simulation: true }, 'Simulation stub');
    return [];
  }
  async fetchTransactions(_since?: Date): Promise<RawTransactionRecord[]> {
    logSimulationFallback({ connector: this.name, operation: 'fetchTransactions', simulation: true }, 'Simulation stub');
    return [];
  }
  normalizeBalances(raw: RawBalanceRecord[]): NormalizedBalanceRecord[] {
    return raw.map(r => ({ accountId: r.accountId, currency: r.currency, available: Number(r.available), ledger: Number(r.ledger), asOf: new Date(r.asOf) }));
  }
  normalizeTransactions(raw: RawTransactionRecord[]): NormalizedTransactionRecord[] {
    return raw.map(t => ({ accountId: t.accountId, amount: Number(t.amount), currency: t.currency, direction: t.direction, externalRef: t.externalRef, bookingDate: t.bookingDate ? new Date(t.bookingDate) : undefined }));
  }
  reconcile(_accountId: string, normalized: NormalizedTransactionRecord[], existing: NormalizedTransactionRecord[]): ReconciliationResult {
    const existingRefs = new Set(existing.map(e => e.externalRef));
    const newTransactions = normalized.filter(n => n.externalRef && !existingRefs.has(n.externalRef));
    return { newTransactions, mismatchedAmounts: [], duplicateExternalRefs: [] };
  }
}
