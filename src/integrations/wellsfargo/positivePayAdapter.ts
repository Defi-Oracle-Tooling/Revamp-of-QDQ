export interface CheckIssuance {
  checkId: string;
  accountId: string;
  amount: string;
  issueDate: string;
  payee: string;
}

export async function submitCheckIssuance(_instr: CheckIssuance): Promise<'SUBMITTED' | 'REJECTED'> {
  // Example: Call Wells Fargo positive pay API endpoint
  // const resp = await fetch('https://api.wellsfargo.com/positivepay/issue', { ... });
  // if (!resp.ok) return 'REJECTED';
  // const result = await resp.json();
  // return result.status === 'SUBMITTED' ? 'SUBMITTED' : 'REJECTED';
  return 'SUBMITTED';
}

export async function decideException(_checkId: string, _decision: 'PAY' | 'RETURN'): Promise<'DECIDED' | 'FAILED'> {
  // Example: Call Wells Fargo positive pay exception decision API
  // const resp = await fetch('https://api.wellsfargo.com/positivepay/exception', { ... });
  // if (!resp.ok) return 'FAILED';
  // const result = await resp.json();
  // return result.status === 'DECIDED' ? 'DECIDED' : 'FAILED';
  return 'DECIDED';
}
