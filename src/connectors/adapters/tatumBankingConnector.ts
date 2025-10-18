
import { BankingConnector, RawBalanceRecord, RawTransactionRecord, NormalizedBalanceRecord, NormalizedTransactionRecord, ReconciliationResult } from '../bankingConnector';
import { logConnectorInfo } from '../logging';
import { TatumAdapter, TatumConfig } from '../../integrations/tatum/tatum';

export class TatumBankingConnector implements BankingConnector {
  name = 'tatum';
  private adapter: TatumAdapter;

  constructor() {
    // Use simulation mode if env var is set
    const simulation = process.env.SIMULATION_MODE === 'true';
    const config: TatumConfig = {
      apiKey: 'SIMULATED_KEY',
      testnet: true,
    };
    this.adapter = new TatumAdapter(config, !simulation ? true : false);
  }

  async fetchBalances(): Promise<RawBalanceRecord[]> {
    logConnectorInfo({ connector: this.name, operation: 'fetchBalances' }, 'fetchBalances using TatumAdapter');
    // For demonstration, fetch a single virtual account balance
    const accountId = 'acct';
    const balance = await this.getVirtualAccountBalance(accountId);
    return [{
      accountId,
      currency: 'USD',
      available: balance.available,
      ledger: balance.available,
      asOf: new Date().toISOString(),
    }];
  }

  async fetchTransactions(_since?: Date): Promise<RawTransactionRecord[]> {
    logConnectorInfo({ connector: this.name, operation: 'fetchTransactions' }, 'Returning mock transactions for simulation');
    return [{ accountId: 'acct', amount: '100', currency: 'USD', direction: 'credit', externalRef: 'txn1', bookingDate: new Date().toISOString() }];
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

  async getVirtualAccountBalance(accountId: string): Promise<{ available: string; blocked: string }> {
    return this.adapter.getVirtualAccountBalance(accountId);
  }

  // Non-interface helper used only in integration tests (simulation path)
  async createVirtualAccount(currency: string) {
    // Access underlying adapter; always simulation-safe
    return (this.adapter as any).createVirtualAccount?.(currency);
  }
}
