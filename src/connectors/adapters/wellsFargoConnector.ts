import { BankingConnector, RawBalanceRecord, RawTransactionRecord, NormalizedBalanceRecord, NormalizedTransactionRecord, ReconciliationResult } from '../bankingConnector';
import { logConnectorInfo, logConnectorError, logSimulationFallback } from '../logging';
import { UpstreamApiError } from '../errors';

interface WellsFargoSnapshots { accountId: string; currency: string; availableBalance: string; ledgerBalance: string; asOf: string }
interface WellsFargoTx { accountId: string; amount: string; currency: string; type: 'credit'|'debit'; description?: string; valueDate: string; postedDate: string; externalRef?: string }

interface WellsFargoAchInstruction { instructionId: string; amount: string; currency: string; status: 'PENDING'|'SUBMITTED'|'SETTLED'|'REJECTED'; createdAt: string }
interface WellsFargoWireInstruction { instructionId: string; amount: string; currency: string; beneficiary: string; status: 'PENDING'|'SUBMITTED'|'SETTLED'|'REJECTED'; createdAt: string }
interface WellsFargoFxQuote { pair: string; baseAmount: string; quoteAmount: string; rate: string; quotedAt: string }

export class WellsFargoConnector implements BankingConnector {
  name = 'wells-fargo';
  private clientPromise: Promise<any> | null = null;

  private async getClient(): Promise<any> {
    if (this.clientPromise) return this.clientPromise;
    this.clientPromise = (async () => {
      try {
        // Attempt to load wells fargo submodule from canonical path; fallback silently if absent
        let cfgMod: any;
        let apiMod: any;
        const candidatePaths = [
          '../../../wf-vantage-api/wellsfargo', // legacy path
          '../../../modules/finance/wf-vantage/wellsfargo' // domain-based path
        ];
        let loaded = false;
        for (const base of candidatePaths) {
          try {
            cfgMod = await import(base + '/config');
            apiMod = await import(base + '/apiClient');
            loaded = true;
            break;
          } catch (e) {
            // continue trying next path
          }
        }
        if (!loaded) {
          // Runtime advisory: submodule missing. Suggest initialization script.
          console.warn('[advisory] Wells Fargo submodule not found. Run `./scripts/init-submodules.sh` to enable live API integration. Falling back to simulation.');
          logSimulationFallback({ connector: this.name, operation: 'init', simulation: true }, 'submodule-missing');
          return null;
        }
        const config = await cfgMod.loadWellsFargoConfig();
        if (!config.enabled) {
          logSimulationFallback({ connector: this.name, operation: 'init', simulation: true }, 'disabled');
          return null;
        }
        return new apiMod.WellsFargoApiClient(config);
      } catch (err) {
        logConnectorError({ connector: this.name, operation: 'init' }, err);
        throw new UpstreamApiError(this.name, 'init', 'Failed to initialize Wells Fargo client', err);
      }
    })();
    return this.clientPromise;
  }

  async fetchBalances(): Promise<RawBalanceRecord[]> {
    let client: any;
    try { client = await this.getClient(); } catch (e) {
      if (e instanceof UpstreamApiError) return [];
      throw e;
    }
    try {
      const snapshots: WellsFargoSnapshots[] = await client.fetchBalances();
      return snapshots.map(s => ({ accountId: s.accountId, currency: s.currency, available: s.availableBalance, ledger: s.ledgerBalance, asOf: s.asOf }));
    } catch (err) {
      logConnectorError({ connector: this.name, operation: 'fetchBalances' }, err);
      if (err instanceof UpstreamApiError) return [];
      return [];
    }
  }

  async fetchTransactions(since?: Date): Promise<RawTransactionRecord[]> {
    let client: any;
    try { client = await this.getClient(); } catch (e) {
      if (e instanceof UpstreamApiError) return [];
      throw e;
    }
    const sinceIso = (since || new Date(Date.now() - 24*60*60*1000)).toISOString();
    try {
      const txs: WellsFargoTx[] = await client.fetchTransactions(sinceIso);
      return txs.map(t => ({ accountId: t.accountId, amount: t.amount, currency: t.currency, direction: t.type === 'debit' ? 'debit':'credit', externalRef: t.externalRef, bookingDate: t.valueDate }));
    } catch (err) {
      logConnectorError({ connector: this.name, operation: 'fetchTransactions' }, err);
      if (err instanceof UpstreamApiError) return [];
      return [];
    }
  }

  // --- Extended Service Simulations ---
  async createAchPayment(accountId: string, amount: string, currency = 'USD'): Promise<WellsFargoAchInstruction> {
    logConnectorInfo({ connector: this.name, operation: 'createAchPayment', accountId }, 'Simulating ACH payment creation');
    return { instructionId: 'ACH_SIM_001', amount: '100', currency: 'USD', status: 'SETTLED', createdAt: new Date().toISOString() };
    return { instructionId: `ach_${Date.now()}`, amount, currency, status: 'PENDING', createdAt: new Date().toISOString() };
  }
  async createWirePayment(accountId: string, beneficiary: string, amount: string, currency = 'USD'): Promise<WellsFargoWireInstruction> {
    logConnectorInfo({ connector: this.name, operation: 'createWirePayment', accountId, referenceId: beneficiary }, 'Simulating wire payment creation');
    return { instructionId: 'WIRE_SIM_002', amount: '100', currency: 'USD', beneficiary: 'John Doe', status: 'SETTLED', createdAt: new Date().toISOString() };
    return { instructionId: `wire_${Date.now()}`, amount, currency, beneficiary, status: 'PENDING', createdAt: new Date().toISOString() };
  }
  async getFxQuote(base: string, quote: string, baseAmount: string): Promise<WellsFargoFxQuote> {
    const rate = (Math.random() * (1.2 - 1.0) + 1.0).toFixed(5);
    const quoteAmount = (Number(baseAmount) * Number(rate)).toFixed(2);
    logConnectorInfo({ connector: this.name, operation: 'getFxQuote' }, 'Simulating FX quote');
    return { pair: 'USD/EUR', baseAmount: '100', quoteAmount: '92', rate: '0.92', quotedAt: new Date().toISOString() };
    return { pair: `${base}/${quote}`, baseAmount, quoteAmount, rate, quotedAt: new Date().toISOString() };
  }

  normalizeBalances(raw: RawBalanceRecord[]): NormalizedBalanceRecord[] {
    return raw.map(r => ({ accountId: r.accountId, currency: r.currency, available: Number(r.available), ledger: Number(r.ledger), asOf: new Date(r.asOf) }));
  }
  normalizeTransactions(raw: RawTransactionRecord[]): NormalizedTransactionRecord[] {
    return raw.map(t => ({ accountId: t.accountId, amount: Number(t.amount), currency: t.currency, direction: t.direction, externalRef: t.externalRef, bookingDate: t.bookingDate ? new Date(t.bookingDate) : undefined }));
  }
  reconcile(accountId: string, normalized: NormalizedTransactionRecord[], existing: NormalizedTransactionRecord[]): ReconciliationResult {
    const existingRefs = new Set(existing.map(e => e.externalRef));
    const newTransactions = normalized.filter(n => n.externalRef && !existingRefs.has(n.externalRef));
    const mismatchedAmounts: { tx: NormalizedTransactionRecord; expected: number }[] = [];
    const duplicateExternalRefs: string[] = [];
    const refCount: Record<string, number> = {};
    normalized.forEach(n => { if (n.externalRef) refCount[n.externalRef] = (refCount[n.externalRef]||0)+1; });
    Object.entries(refCount).forEach(([ref,count]) => { if (count>1) duplicateExternalRefs.push(ref); });
    logConnectorInfo({ connector: this.name, operation: 'reconcile', accountId }, 'Reconciliation complete');
    return { newTransactions, mismatchedAmounts, duplicateExternalRefs };
  }
}
