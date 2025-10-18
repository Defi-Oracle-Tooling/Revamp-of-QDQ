import { submitRtpPayment } from '../src/integrations/wellsfargo/rtpAdapter';
import { fetchFxQuote, executeFxTrade } from '../src/integrations/wellsfargo/fxAdapter';
import { submitSweepInstruction } from '../src/integrations/wellsfargo/sweepsAdapter';
import { ingestLockboxStatement } from '../src/integrations/wellsfargo/lockboxAdapter';
import { submitCheckIssuance, decideException } from '../src/integrations/wellsfargo/positivePayAdapter';

describe('Wells Fargo Advanced Adapters', () => {
  it('should submit RTP payment', async () => {
    const result = await submitRtpPayment({ method: 'RTP', instructionId: 'rtp1', fromAccountId: 'A', toBeneficiary: { name: 'B' }, amount: '100', currency: 'USD', createdAt: '', status: 'PENDING' });
    expect(result).toBe('SUBMITTED');
  });

  it('should fetch FX quote and execute trade', async () => {
    const quote = await fetchFxQuote({ baseCurrency: 'USD', quoteCurrency: 'EUR', amount: '1000' });
    expect(quote.rate).toBeDefined();
    const tradeResult = await executeFxTrade(quote.quoteId);
    expect(tradeResult).toBe('EXECUTED');
  });

  it('should submit sweep instruction', async () => {
    const result = await submitSweepInstruction({ accountId: 'A', sweepType: 'DAILY' });
    expect(result).toBe('SUBMITTED');
  });

  it('should ingest lockbox statement', async () => {
    const result = await ingestLockboxStatement({ lockboxId: 'LB1', statementDate: '2025-10-15', remittances: [{ remittanceId: 'R1', amount: '500', payer: 'X', reference: 'REF' }] });
    expect(result).toBe('IMPORTED');
  });

  it('should submit check issuance and decide exception', async () => {
    const submitResult = await submitCheckIssuance({ checkId: 'C1', accountId: 'A', amount: '100', issueDate: '2025-10-15', payee: 'Y' });
    expect(submitResult).toBe('SUBMITTED');
    const decisionResult = await decideException('C1', 'PAY');
    expect(decisionResult).toBe('DECIDED');
  });
});
