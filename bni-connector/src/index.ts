export interface BniConfig { apiKey?: string; baseUrl?: string; enabled: boolean }
export interface BniBalance { accountId: string; currency: string; available: string; ledger: string; asOf: string }
export interface BniTransaction { accountId: string; amount: string; currency: string; direction: 'debit'|'credit'; externalRef?: string; bookingDate?: string }

export class BniApiClient {
  constructor(private cfg: BniConfig, private fetchFn: typeof fetch = fetch) {}
  private isSimulation() { return !this.cfg.enabled || !this.cfg.apiKey }
  async fetchBalances(): Promise<BniBalance[]> {
    if (this.isSimulation()) return [];
    const resp = await this.fetchFn(`${this.cfg.baseUrl}/balances`, { headers: { 'Authorization': `Bearer ${this.cfg.apiKey}` } });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data.accounts)) return [];
    return data.accounts.map((a: any) => ({ accountId: a.id, currency: a.currency || 'IDR', available: a.available || '0', ledger: a.ledger || a.available || '0', asOf: a.asOf || new Date().toISOString() }));
  }
  async fetchTransactions(sinceIso: string): Promise<BniTransaction[]> {
    if (this.isSimulation()) return [];
    const resp = await this.fetchFn(`${this.cfg.baseUrl}/transactions?since=${encodeURIComponent(sinceIso)}`, { headers: { 'Authorization': `Bearer ${this.cfg.apiKey}` } });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data.transactions)) return [];
    return data.transactions.map((t: any) => ({ accountId: t.accountId, amount: t.amount, currency: t.currency || 'IDR', direction: t.type === 'debit' ? 'debit':'credit', externalRef: t.externalRef || t.id, bookingDate: t.valueDate }));
  }
}
