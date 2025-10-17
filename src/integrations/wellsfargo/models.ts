// Canonical DTO models for Wells Fargo integration
export interface BankAccountSnapshot {
  accountId: string;
  currency: string; // ISO 4217
  availableBalance: string; // use string to preserve precision
  ledgerBalance: string;
  asOf: string; // ISO timestamp
}

export interface BankTransaction {
  uid: string; // deterministic hash
  accountId: string;
  amount: string; // signed string
  currency: string;
  type: 'credit' | 'debit';
  description?: string;
  valueDate: string;
  postedDate: string;
  externalRef?: string; // bank reference / trace number
  category?: string; // enriched classification
}

export interface PaymentInstruction {
  instructionId: string;
  method: 'ACH' | 'WIRE' | 'RTP';
  fromAccountId: string;
  toBeneficiary: {
    name: string;
    accountNumber?: string;
    routingNumber?: string;
    iban?: string;
    swift?: string;
  };
  amount: string;
  currency: string;
  createdAt: string;
  status: 'PENDING' | 'SUBMITTED' | 'SETTLED' | 'REJECTED';
  externalSubmissionRef?: string;
  failureReason?: string;
}

export interface ReconciliationResult {
  accountId: string;
  snapshotAsOf: string;
  newTransactions: BankTransaction[];
  unmatchedBankTransactions: BankTransaction[];
  missingLedgerEntries: BankTransaction[]; // bank tx not yet in ledger
  mismatchedAmounts: { uid: string; bankAmount: string; ledgerAmount: string }[];
}

export interface FxTrade {
  tradeId: string;
  baseCurrency: string;
  quoteCurrency: string;
  baseAmount: string;
  rate: string;
  executedAt: string;
  settlementDate?: string;
  pnlBase?: string; // realized PnL in base currency
}
