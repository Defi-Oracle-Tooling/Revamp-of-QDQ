export interface LockboxStatement {
  lockboxId: string;
  statementDate: string;
  remittances: {
    remittanceId: string;
    amount: string;
    payer: string;
    reference: string;
  }[];
}

export async function ingestLockboxStatement(_stmt: LockboxStatement): Promise<'IMPORTED' | 'FAILED'> {
  // Example: Call Wells Fargo lockbox API endpoint or ingest file
  // const resp = await fetch('https://api.wellsfargo.com/lockbox/import', { ... });
  // if (!resp.ok) return 'FAILED';
  // const result = await resp.json();
  // return result.status === 'IMPORTED' ? 'IMPORTED' : 'FAILED';
  return 'IMPORTED';
}
