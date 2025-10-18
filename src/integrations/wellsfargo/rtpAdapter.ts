import { PaymentInstruction } from './models';

export async function submitRtpPayment(instruction: PaymentInstruction): Promise<'SUBMITTED' | 'REJECTED'> {
  if (instruction.method !== 'RTP') return 'REJECTED';
  // Example: Call Wells Fargo RTP API endpoint
  // const resp = await fetch('https://api.wellsfargo.com/payments/rtp', { ... });
  // if (!resp.ok) return 'REJECTED';
  // const result = await resp.json();
  // return result.status === 'SUBMITTED' ? 'SUBMITTED' : 'REJECTED';
  return 'SUBMITTED';
}
