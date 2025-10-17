import { screenPayment } from '../src/integrations/wellsfargo/fraudScreeningAdapter';
import { logComplianceEvent } from '../src/integrations/wellsfargo/compliance';

describe('Wells Fargo Fraud & Compliance', () => {
  it('should screen payment and pass', async () => {
    const result = await screenPayment({ amount: '100', currency: 'USD' });
    expect(result.passed).toBe(true);
  });

  it('should log compliance event', () => {
    expect(() => logComplianceEvent({ eventType: 'PAYMENT', details: { id: 'P1' } })).not.toThrow();
  });
});
