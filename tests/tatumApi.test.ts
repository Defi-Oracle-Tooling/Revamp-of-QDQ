import { TatumAdapter } from '../src/integrations/tatum/tatum';

describe('Tatum Adapter Offline Integration', () => {
  const adapter = new TatumAdapter({ apiKey: 'test-key', testnet: true });

  it('should create a virtual account', async () => {
    const acct = await adapter.createVirtualAccount('EUR');
    expect(acct).toHaveProperty('id');
    expect(acct.currency).toBe('EUR');
    expect(acct.accountCode).toMatch(/^VA_EUR_/);
  });

  it('should create a fiat wallet', async () => {
    const wallet = await adapter.createFiatWallet('USD', { bankCode: 'BANK001' });
    expect(wallet).toHaveProperty('id');
    expect(wallet.currency).toBe('USD');
    expect(wallet.bankConnection.bankCode).toBe('BANK001');
    expect(wallet.compliance.iso20022Compliant).toBe(true);
  });
});
