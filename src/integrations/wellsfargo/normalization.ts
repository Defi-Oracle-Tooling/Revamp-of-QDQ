export function normalizeData(data: any): any {
  console.log('Normalizing data:', data);
  return data;
}
import { RawPayload } from './persistence';
import { BankAccountSnapshot, BankTransaction } from './models';

export function normalizeBalancePayload(payload: RawPayload): BankAccountSnapshot[] {
  // Simulate parsing JSON payload
  try {
    const data = JSON.parse(payload.payload);
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        accountId: item.accountId,
        currency: item.currency,
        availableBalance: item.availableBalance,
        ledgerBalance: item.ledgerBalance,
        asOf: item.asOf
      }));
    }
  } catch (e) {
    // swallow parse errors – return empty array
  }
  return [];
}

export function normalizeTransactionPayload(payload: RawPayload): BankTransaction[] {
  // Simulate parsing JSON payload
  try {
    const data = JSON.parse(payload.payload);
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        uid: item.uid,
        accountId: item.accountId,
        amount: item.amount,
        currency: item.currency,
        type: item.type,
        description: item.description,
        valueDate: item.valueDate,
        postedDate: item.postedDate,
        externalRef: item.externalRef,
        category: item.category
      }));
    }
  } catch (e) {
    // swallow parse errors – return empty array
  }
  return [];
}
