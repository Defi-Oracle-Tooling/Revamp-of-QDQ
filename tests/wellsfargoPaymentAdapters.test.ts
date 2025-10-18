import { submitAchPayment } from '../src/integrations/wellsfargo/achAdapter';
import { submitWirePayment } from '../src/integrations/wellsfargo/wireAdapter';
import { PaymentInstruction } from '../src/integrations/wellsfargo/models';

describe('Payment Adapters', () => {
  it('should submit ACH payment', async () => {
    const instr: PaymentInstruction = {
      instructionId: 'ach1',
      method: 'ACH',
      fromAccountId: 'WF-ACCT-001',
      toBeneficiary: { name: 'Alice' },
      amount: '100',
      currency: 'USD',
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    const result = await submitAchPayment(instr);
    expect(result).toBe('SUBMITTED');
  });

  it('should reject non-ACH payment in ACH adapter', async () => {
    const instr: PaymentInstruction = {
      instructionId: 'ach2',
      method: 'WIRE',
      fromAccountId: 'WF-ACCT-001',
      toBeneficiary: { name: 'Bob' },
      amount: '200',
      currency: 'USD',
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    const result = await submitAchPayment(instr);
    expect(result).toBe('REJECTED');
  });

  it('should submit wire payment', async () => {
    const instr: PaymentInstruction = {
      instructionId: 'wire1',
      method: 'WIRE',
      fromAccountId: 'WF-ACCT-002',
      toBeneficiary: { name: 'Charlie' },
      amount: '500',
      currency: 'EUR',
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    const result = await submitWirePayment(instr);
    expect(result).toBe('SUBMITTED');
  });

  it('should reject non-wire payment in wire adapter', async () => {
    const instr: PaymentInstruction = {
      instructionId: 'wire2',
      method: 'ACH',
      fromAccountId: 'WF-ACCT-002',
      toBeneficiary: { name: 'Dana' },
      amount: '600',
      currency: 'EUR',
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    const result = await submitWirePayment(instr);
    expect(result).toBe('REJECTED');
  });
});
