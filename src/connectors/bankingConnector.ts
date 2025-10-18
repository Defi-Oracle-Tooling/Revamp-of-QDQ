// Generic Banking Connector abstraction to support multiple bank / aggregator APIs
// Initial adapters: Wells Fargo (existing), planned: BNI, Marrionette, Tatum, others.

export interface RawBalanceRecord {
  accountId: string;
  currency: string;
  available: string | number;
  ledger: string | number;
  asOf: string; // ISO timestamp
}

export interface NormalizedBalanceRecord {
  accountId: string;
  currency: string;
  available: number;
  ledger: number;
  asOf: Date;
}

export interface RawTransactionRecord {
  accountId: string;
  amount: string | number;
  currency: string;
  direction: 'debit' | 'credit';
  externalRef?: string;
  bookingDate?: string;
}

export interface NormalizedTransactionRecord {
  accountId: string;
  amount: number;
  currency: string;
  direction: 'debit' | 'credit';
  externalRef?: string;
  bookingDate?: Date;
}

export interface ReconciliationResult {
  newTransactions: NormalizedTransactionRecord[];
  mismatchedAmounts: { tx: NormalizedTransactionRecord; expected: number }[];
  duplicateExternalRefs: string[];
}

export interface BankingConnector {
  name: string;
  // Fetch raw balances JSON/string/object from provider
  fetchBalances(): Promise<RawBalanceRecord[]>;
  // Fetch raw transactions (may require pagination)
  fetchTransactions(since?: Date): Promise<RawTransactionRecord[]>;
  // Normalize provider-specific records
  normalizeBalances(raw: RawBalanceRecord[]): NormalizedBalanceRecord[];
  normalizeTransactions(raw: RawTransactionRecord[]): NormalizedTransactionRecord[];
  // Reconcile normalized transactions with an existing ledger subset
  reconcile(
    accountId: string,
    normalized: NormalizedTransactionRecord[],
    existingLedger: NormalizedTransactionRecord[]
  ): ReconciliationResult;
}

// ...existing code...
// (BNI API, Tatum, etc.) will implement the BankingConnector interface.

export type SupportedConnector = 'wells-fargo' | 'bni' | 'tatum';

// Thin adapter wrappers live in separate files to satisfy lint rule (1 class per file)
import { WellsFargoConnector } from './adapters/wellsFargoConnector';
import { BniBankingConnector } from './adapters/bniConnector';
import { TatumBankingConnector } from './adapters/tatumBankingConnector';

export function createConnector(type: SupportedConnector): BankingConnector {
  switch (type) {
    case 'wells-fargo':
      return new WellsFargoConnector();
    case 'bni':
      return new BniBankingConnector();
    case 'tatum':
      return new TatumBankingConnector();
    default: {
      const exhaustive: never = type;
      throw new Error(`Unsupported connector type: ${exhaustive}`);
    }
  }
}
