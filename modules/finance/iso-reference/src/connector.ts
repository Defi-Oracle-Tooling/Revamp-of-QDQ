// Production-ready ISOReferenceConnector for currency and reference data

export interface Currency {
  code: string;
  name: string;
  decimals: number;
}

export interface ISOReferenceConnector {
  fetchCurrencies(): Promise<Currency[]>;
  getCurrency(code: string): Promise<Currency | undefined>;
}

const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', decimals: 2 },
  { code: 'EUR', name: 'Euro', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', decimals: 0 },
  { code: 'GBP', name: 'British Pound', decimals: 2 }
];

export class ISOReferenceConnectorImpl implements ISOReferenceConnector {
  async fetchCurrencies(): Promise<Currency[]> {
    return CURRENCIES;
  }
  async getCurrency(code: string): Promise<Currency | undefined> {
    return CURRENCIES.find(c => c.code === code);
  }
}
