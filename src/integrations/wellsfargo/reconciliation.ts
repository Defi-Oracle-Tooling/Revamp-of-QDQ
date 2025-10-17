import { BankTransaction, ReconciliationResult } from './models';

export function reconcile(accountId: string, bankTx: BankTransaction[], ledgerTx: BankTransaction[]): ReconciliationResult {
  const ledgerMap = new Map(ledgerTx.map(t => [t.uid, t]));
  const newTransactions: BankTransaction[] = [];
  const missingLedgerEntries: BankTransaction[] = [];
  const mismatchedAmounts: { uid: string; bankAmount: string; ledgerAmount: string }[] = [];

  for (const tx of bankTx) {
    const ledger = ledgerMap.get(tx.uid);
    if (!ledger) {
      newTransactions.push(tx);
      missingLedgerEntries.push(tx);
    } else if (ledger.amount !== tx.amount) {
      mismatchedAmounts.push({ uid: tx.uid, bankAmount: tx.amount, ledgerAmount: ledger.amount });
    }
  }

  return {
    accountId,
    snapshotAsOf: new Date().toISOString(),
    newTransactions,
    unmatchedBankTransactions: [], // advanced logic to be added later
    missingLedgerEntries,
    mismatchedAmounts
  };
}
