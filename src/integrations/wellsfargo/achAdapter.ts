// ACH payment adapter stub
import { PaymentInstruction } from './models';

export async function submitAchPayment(instruction: PaymentInstruction): Promise<'SUBMITTED' | 'REJECTED'> {
  if (instruction.method !== 'ACH') return 'REJECTED';
  // Example: Call Wells Fargo ACH API endpoint
  // const resp = await fetch('https://api.wellsfargo.com/payments/ach', { ... });
  // if (!resp.ok) return 'REJECTED';
  // const result = await resp.json();
  // return result.status === 'SUBMITTED' ? 'SUBMITTED' : 'REJECTED';
  // Simulate submission
  return 'SUBMITTED';
}
