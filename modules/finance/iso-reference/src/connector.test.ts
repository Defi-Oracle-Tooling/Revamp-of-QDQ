import { ISOReferenceConnectorImpl } from './connector';

describe('ISOReferenceConnectorImpl', () => {
  const connector = new ISOReferenceConnectorImpl();

  it('fetchCurrencies returns all supported currencies', async () => {
    const currencies = await connector.fetchCurrencies();
    expect(currencies).toEqual([
      { code: 'USD', name: 'US Dollar', decimals: 2 },
      { code: 'EUR', name: 'Euro', decimals: 2 },
      { code: 'JPY', name: 'Japanese Yen', decimals: 0 },
      { code: 'GBP', name: 'British Pound', decimals: 2 }
    ]);
  });

  it('getCurrency returns correct currency', async () => {
    const usd = await connector.getCurrency('USD');
    expect(usd).toEqual({ code: 'USD', name: 'US Dollar', decimals: 2 });
    const jpy = await connector.getCurrency('JPY');
    expect(jpy).toEqual({ code: 'JPY', name: 'Japanese Yen', decimals: 0 });
  });

  it('getCurrency returns undefined for unknown code', async () => {
    const unknown = await connector.getCurrency('ZZZ');
    expect(unknown).toBeUndefined();
  });
});
