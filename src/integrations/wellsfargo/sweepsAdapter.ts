export interface SweepInstruction {
  accountId: string;
  sweepType: 'DAILY' | 'THRESHOLD';
  thresholdAmount?: string;
}

export async function submitSweepInstruction(_instr: SweepInstruction): Promise<'SUBMITTED' | 'REJECTED'> {
  // Example: Call Wells Fargo sweeps API endpoint
  // const resp = await fetch('https://api.wellsfargo.com/sweeps', { ... });
  // if (!resp.ok) return 'REJECTED';
  // const result = await resp.json();
  // return result.status === 'SUBMITTED' ? 'SUBMITTED' : 'REJECTED';
  return 'SUBMITTED';
}
