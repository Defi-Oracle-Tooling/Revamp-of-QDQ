// Using global fetch (Node.js 18+)

describe('Tatum API Integration', () => {
  it('should create a virtual account', async () => {
    const res = await fetch('http://localhost:3000/api/tatum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'virtualAccount', currency: 'EUR' })
    });
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.currency).toBe('EUR');
  });

  it('should create a fiat wallet', async () => {
    const res = await fetch('http://localhost:3000/api/tatum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'fiatWallet', currency: 'USD', bankCode: 'BANK001' })
    });
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.currency).toBe('USD');
    expect(data.bankConnection.bankCode).toBe('BANK001');
  });
});
