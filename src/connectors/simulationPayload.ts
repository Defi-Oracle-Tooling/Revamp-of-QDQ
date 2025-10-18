// Deterministic simulation payload generator for offline connector testing
// Follows pattern documented in copilot instructions.
// Incremental minute offsets from a fixed base timestamp for reproducibility.

export interface SimRawBalanceRecord {
  accountId: string;
  currency: string;
  available: number;
  ledger: number;
  asOf: string; // ISO timestamp
}

export interface SimRawTransactionRecord {
  accountId: string;
  amount: number;
  currency: string;
  direction: 'debit' | 'credit';
  externalRef: string;
  bookingDate: string; // ISO timestamp
}

const BASE_TS = new Date('2025-01-01T00:00:00Z').getTime();

function ts(seed: number): string {
  return new Date(BASE_TS + seed * 60_000).toISOString();
}

export function simulateBalances(seed = 0): SimRawBalanceRecord[] {
  const iso = ts(seed);
  return [
    { accountId: 'SIM-USD-001', currency: 'USD', available: 12500.55, ledger: 12500.55, asOf: iso },
    { accountId: 'SIM-EUR-001', currency: 'EUR', available: 8300.10, ledger: 8300.10, asOf: iso }
  ];
}

export function simulateTransactions(seed = 0): SimRawTransactionRecord[] {
  const iso = ts(seed);
  return [
    { accountId: 'SIM-USD-001', amount: 250.0, currency: 'USD', direction: 'credit', externalRef: `REF-${seed}-A`, bookingDate: iso },
    { accountId: 'SIM-USD-001', amount: 90.0, currency: 'USD', direction: 'debit', externalRef: `REF-${seed}-B`, bookingDate: iso }
  ];
}

// Unified metadata enrichment helper (optional future use)
export function enrichMetadata<T extends { bookingDate?: string; asOf?: string; externalRef?: string }>(
  sourceSystem: string,
  records: T[],
  accountType: string
): Array<T & { sourceSystem: string; referenceId?: string; timestamp: string; accountType: string }> {
  return records.map(r => ({
    ...r,
    sourceSystem,
    referenceId: r.externalRef,
    timestamp: r.bookingDate || r.asOf || new Date().toISOString(),
    accountType
  }));
}
