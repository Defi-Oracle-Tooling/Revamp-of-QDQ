/**
 * Comprehensive Currency Configuration for Global Coverage
 *
 * Supports 48+ countries with focus on Southern African Development Community (SADC)
 * and major world economies. Includes regulatory frameworks and regional classifications.
 */

export interface CurrencyInfo {
  code: string;
  name: string;
  country: string;
  region: string;
  regulatoryFramework: string;
  centralBank: string;
  symbol: string;
  decimals: number;
  exchangeRate: string; // Rate to USD in 18 decimals
  active: boolean;
  tokenSymbol: string;
  priority: 'high' | 'medium' | 'low';
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  // Major World Currencies (G7 + Major Economies)
  {
    code: 'USD',
    name: 'US Dollar',
    country: 'United States',
    region: 'North America',
    regulatoryFramework: 'BSA/AML',
    centralBank: 'Federal Reserve',
    symbol: '$',
    decimals: 18,
    exchangeRate: '1000000000000000000', // 1.0
    active: true,
    tokenSymbol: 'M1USDgruM0',
    priority: 'high'
  },
  {
    code: 'EUR',
    name: 'Euro',
    country: 'Eurozone',
    region: 'Europe',
    regulatoryFramework: 'MiFID II',
    centralBank: 'European Central Bank',
    symbol: '€',
    decimals: 18,
    exchangeRate: '920000000000000000', // 0.92
    active: true,
    tokenSymbol: 'M1EURgruM0',
    priority: 'high'
  },
  {
    code: 'GBP',
    name: 'British Pound Sterling',
    country: 'United Kingdom',
    region: 'Europe',
    regulatoryFramework: 'FCA',
    centralBank: 'Bank of England',
    symbol: '£',
    decimals: 18,
    exchangeRate: '790000000000000000', // 0.79
    active: true,
    tokenSymbol: 'M1GBPgruM0',
    priority: 'high'
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    country: 'Japan',
    region: 'Asia',
    regulatoryFramework: 'JFSA',
    centralBank: 'Bank of Japan',
    symbol: '¥',
    decimals: 18,
    exchangeRate: '7500000000000000', // 0.0075
    active: true,
    tokenSymbol: 'M1JPYgruM0',
    priority: 'high'
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    country: 'Switzerland',
    region: 'Europe',
    regulatoryFramework: 'FINMA',
    centralBank: 'Swiss National Bank',
    symbol: 'CHF',
    decimals: 18,
    exchangeRate: '910000000000000000', // 0.91
    active: true,
    tokenSymbol: 'M1CHFgruM0',
    priority: 'high'
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    country: 'Canada',
    region: 'North America',
    regulatoryFramework: 'OSFI',
    centralBank: 'Bank of Canada',
    symbol: 'C$',
    decimals: 18,
    exchangeRate: '740000000000000000', // 0.74
    active: true,
    tokenSymbol: 'M1CADgruM0',
    priority: 'high'
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    country: 'Australia',
    region: 'Oceania',
    regulatoryFramework: 'APRA',
    centralBank: 'Reserve Bank of Australia',
    symbol: 'A$',
    decimals: 18,
    exchangeRate: '660000000000000000', // 0.66
    active: true,
    tokenSymbol: 'M1AUDgruM0',
    priority: 'high'
  },

  // Southern African Development Community (SADC) - Full Coverage
  {
    code: 'ZAR',
    name: 'South African Rand',
    country: 'South Africa',
    region: 'Southern Africa',
    regulatoryFramework: 'SARB',
    centralBank: 'South African Reserve Bank',
    symbol: 'R',
    decimals: 18,
    exchangeRate: '55000000000000000', // 0.055
    active: true,
    tokenSymbol: 'M1ZARgruM0',
    priority: 'high'
  },
  {
    code: 'BWP',
    name: 'Botswana Pula',
    country: 'Botswana',
    region: 'Southern Africa',
    regulatoryFramework: 'BOB',
    centralBank: 'Bank of Botswana',
    symbol: 'P',
    decimals: 18,
    exchangeRate: '74000000000000000', // 0.074
    active: true,
    tokenSymbol: 'M1BWPgruM0',
    priority: 'high'
  },
  {
    code: 'LSL',
    name: 'Lesotho Loti',
    country: 'Lesotho',
    region: 'Southern Africa',
    regulatoryFramework: 'CBL',
    centralBank: 'Central Bank of Lesotho',
    symbol: 'L',
    decimals: 18,
    exchangeRate: '55000000000000000', // 0.055 (pegged to ZAR)
    active: true,
    tokenSymbol: 'M1LSLgruM0',
    priority: 'medium'
  },
  {
    code: 'SZL',
    name: 'Eswatini Lilangeni',
    country: 'Eswatini',
    region: 'Southern Africa',
    regulatoryFramework: 'CBE',
    centralBank: 'Central Bank of Eswatini',
    symbol: 'E',
    decimals: 18,
    exchangeRate: '55000000000000000', // 0.055 (pegged to ZAR)
    active: true,
    tokenSymbol: 'M1SZLgruM0',
    priority: 'medium'
  },
  {
    code: 'NAD',
    name: 'Namibian Dollar',
    country: 'Namibia',
    region: 'Southern Africa',
    regulatoryFramework: 'BON',
    centralBank: 'Bank of Namibia',
    symbol: 'N$',
    decimals: 18,
    exchangeRate: '55000000000000000', // 0.055 (pegged to ZAR)
    active: true,
    tokenSymbol: 'M1NADgruM0',
    priority: 'high'
  },
  {
    code: 'ZMW',
    name: 'Zambian Kwacha',
    country: 'Zambia',
    region: 'Southern Africa',
    regulatoryFramework: 'BOZ',
    centralBank: 'Bank of Zambia',
    symbol: 'ZK',
    decimals: 18,
    exchangeRate: '42000000000000000', // 0.042
    active: true,
    tokenSymbol: 'M1ZMWgruM0',
    priority: 'high'
  },
  {
    code: 'ZWL',
    name: 'Zimbabwean Dollar',
    country: 'Zimbabwe',
    region: 'Southern Africa',
    regulatoryFramework: 'RBZ',
    centralBank: 'Reserve Bank of Zimbabwe',
    symbol: 'Z$',
    decimals: 18,
    exchangeRate: '31000000000000', // 0.000031
    active: true,
    tokenSymbol: 'M1ZWLgruM0',
    priority: 'medium'
  },
  {
    code: 'MZN',
    name: 'Mozambican Metical',
    country: 'Mozambique',
    region: 'Southern Africa',
    regulatoryFramework: 'BM',
    centralBank: 'Bank of Mozambique',
    symbol: 'MT',
    decimals: 18,
    exchangeRate: '16000000000000000', // 0.016
    active: true,
    tokenSymbol: 'M1MZNgruM0',
    priority: 'high'
  },
  {
    code: 'MGA',
    name: 'Malagasy Ariary',
    country: 'Madagascar',
    region: 'Southern Africa',
    regulatoryFramework: 'BCM',
    centralBank: 'Central Bank of Madagascar',
    symbol: 'Ar',
    decimals: 18,
    exchangeRate: '220000000000000', // 0.00022
    active: true,
    tokenSymbol: 'M1MGAgruM0',
    priority: 'medium'
  },
  {
    code: 'MUR',
    name: 'Mauritian Rupee',
    country: 'Mauritius',
    region: 'Southern Africa',
    regulatoryFramework: 'BOM',
    centralBank: 'Bank of Mauritius',
    symbol: '₨',
    decimals: 18,
    exchangeRate: '22000000000000000', // 0.022
    active: true,
    tokenSymbol: 'M1MURgruM0',
    priority: 'medium'
  },
  {
    code: 'SCR',
    name: 'Seychellois Rupee',
    country: 'Seychelles',
    region: 'Southern Africa',
    regulatoryFramework: 'CBS',
    centralBank: 'Central Bank of Seychelles',
    symbol: '₨',
    decimals: 18,
    exchangeRate: '74000000000000000', // 0.074
    active: true,
    tokenSymbol: 'M1SCRgruM0',
    priority: 'low'
  },
  {
    code: 'AOA',
    name: 'Angolan Kwanza',
    country: 'Angola',
    region: 'Southern Africa',
    regulatoryFramework: 'BNA',
    centralBank: 'National Bank of Angola',
    symbol: 'Kz',
    decimals: 18,
    exchangeRate: '1200000000000000', // 0.0012
    active: true,
    tokenSymbol: 'M1AOAgruM0',
    priority: 'high'
  },
  {
    code: 'MWK',
    name: 'Malawian Kwacha',
    country: 'Malawi',
    region: 'Southern Africa',
    regulatoryFramework: 'RBM',
    centralBank: 'Reserve Bank of Malawi',
    symbol: 'MK',
    decimals: 18,
    exchangeRate: '580000000000000', // 0.00058
    active: true,
    tokenSymbol: 'M1MWKgruM0',
    priority: 'medium'
  },
  {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    country: 'Tanzania',
    region: 'Southern Africa',
    regulatoryFramework: 'BOT',
    centralBank: 'Bank of Tanzania',
    symbol: 'TSh',
    decimals: 18,
    exchangeRate: '420000000000000', // 0.00042
    active: true,
    tokenSymbol: 'M1TZSgruM0',
    priority: 'medium'
  },

  // Major Asian Currencies
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    country: 'China',
    region: 'Asia',
    regulatoryFramework: 'PBOC',
    centralBank: 'People\'s Bank of China',
    symbol: '¥',
    decimals: 18,
    exchangeRate: '140000000000000000', // 0.14
    active: true,
    tokenSymbol: 'M1CNYgruM0',
    priority: 'high'
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    country: 'India',
    region: 'Asia',
    regulatoryFramework: 'RBI',
    centralBank: 'Reserve Bank of India',
    symbol: '₹',
    decimals: 18,
    exchangeRate: '12000000000000000', // 0.012
    active: true,
    tokenSymbol: 'M1INRgruM0',
    priority: 'high'
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    country: 'South Korea',
    region: 'Asia',
    regulatoryFramework: 'FSC',
    centralBank: 'Bank of Korea',
    symbol: '₩',
    decimals: 18,
    exchangeRate: '750000000000000', // 0.00075
    active: true,
    tokenSymbol: 'M1KRWgruM0',
    priority: 'high'
  },

  // Latin American Major Currencies
  {
    code: 'BRL',
    name: 'Brazilian Real',
    country: 'Brazil',
    region: 'South America',
    regulatoryFramework: 'BCB',
    centralBank: 'Central Bank of Brazil',
    symbol: 'R$',
    decimals: 18,
    exchangeRate: '200000000000000000', // 0.20
    active: true,
    tokenSymbol: 'M1BRLgruM0',
    priority: 'high'
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    country: 'Mexico',
    region: 'North America',
    regulatoryFramework: 'BANXICO',
    centralBank: 'Bank of Mexico',
    symbol: '$',
    decimals: 18,
    exchangeRate: '57000000000000000', // 0.057
    active: true,
    tokenSymbol: 'M1MXNgruM0',
    priority: 'high'
  },
  {
    code: 'ARS',
    name: 'Argentine Peso',
    country: 'Argentina',
    region: 'South America',
    regulatoryFramework: 'BCRA',
    centralBank: 'Central Bank of Argentina',
    symbol: '$',
    decimals: 18,
    exchangeRate: '3600000000000000', // 0.0036
    active: true,
    tokenSymbol: 'M1ARSgruM0',
    priority: 'high'
  },

  // Middle Eastern Currencies
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    country: 'Saudi Arabia',
    region: 'Middle East',
    regulatoryFramework: 'SAMA',
    centralBank: 'Saudi Arabian Monetary Authority',
    symbol: '﷼',
    decimals: 18,
    exchangeRate: '270000000000000000', // 0.27
    active: true,
    tokenSymbol: 'M1SARgruM0',
    priority: 'high'
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    country: 'United Arab Emirates',
    region: 'Middle East',
    regulatoryFramework: 'CBUAE',
    centralBank: 'Central Bank of UAE',
    symbol: 'د.إ',
    decimals: 18,
    exchangeRate: '270000000000000000', // 0.27
    active: true,
    tokenSymbol: 'M1AEDgruM0',
    priority: 'high'
  },

  // European Currencies
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    country: 'Norway',
    region: 'Europe',
    regulatoryFramework: 'NORGES',
    centralBank: 'Norges Bank',
    symbol: 'kr',
    decimals: 18,
    exchangeRate: '92000000000000000', // 0.092
    active: true,
    tokenSymbol: 'M1NOKgruM0',
    priority: 'medium'
  },
  {
    code: 'SEK',
    name: 'Swedish Krona',
    country: 'Sweden',
    region: 'Europe',
    regulatoryFramework: 'RIKSBANK',
    centralBank: 'Sveriges Riksbank',
    symbol: 'kr',
    decimals: 18,
    exchangeRate: '93000000000000000', // 0.093
    active: true,
    tokenSymbol: 'M1SEKgruM0',
    priority: 'medium'
  },
  {
    code: 'PLN',
    name: 'Polish Zloty',
    country: 'Poland',
    region: 'Europe',
    regulatoryFramework: 'NBP',
    centralBank: 'National Bank of Poland',
    symbol: 'zł',
    decimals: 18,
    exchangeRate: '240000000000000000', // 0.24
    active: true,
    tokenSymbol: 'M1PLNgruM0',
    priority: 'medium'
  },

  // Additional African Currencies
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    country: 'Nigeria',
    region: 'West Africa',
    regulatoryFramework: 'CBN',
    centralBank: 'Central Bank of Nigeria',
    symbol: '₦',
    decimals: 18,
    exchangeRate: '650000000000000', // 0.00065
    active: true,
    tokenSymbol: 'M1NGNgruM0',
    priority: 'high'
  },
  {
    code: 'KES',
    name: 'Kenyan Shilling',
    country: 'Kenya',
    region: 'East Africa',
    regulatoryFramework: 'CBK',
    centralBank: 'Central Bank of Kenya',
    symbol: 'KSh',
    decimals: 18,
    exchangeRate: '7500000000000000', // 0.0075
    active: true,
    tokenSymbol: 'M1KESgruM0',
    priority: 'medium'
  }
];

export function getCurrencyByCode(code: string): CurrencyInfo | undefined {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
}

export function getCurrenciesByRegion(region: string): CurrencyInfo[] {
  return SUPPORTED_CURRENCIES.filter(currency => currency.region === region);
}

export function getSouthernAfricanCurrencies(): CurrencyInfo[] {
  return getCurrenciesByRegion('Southern Africa');
}

export function getHighPriorityCurrencies(): CurrencyInfo[] {
  return SUPPORTED_CURRENCIES.filter(currency => currency.priority === 'high');
}

export function getActiveCurrencies(): CurrencyInfo[] {
  return SUPPORTED_CURRENCIES.filter(currency => currency.active);
}

export const CURRENCY_COVERAGE_SUMMARY = {
  total: SUPPORTED_CURRENCIES.length,
  southernAfricaCoverage: getSouthernAfricanCurrencies().length,
  majorWorldCurrencies: getHighPriorityCurrencies().length,
  regions: [...new Set(SUPPORTED_CURRENCIES.map(c => c.region))],

  // Regional breakdown
  breakdown: {
    'Southern Africa': getSouthernAfricanCurrencies().length,
    'Asia': getCurrenciesByRegion('Asia').length,
    'Europe': getCurrenciesByRegion('Europe').length,
    'North America': getCurrenciesByRegion('North America').length,
    'South America': getCurrenciesByRegion('South America').length,
    'Middle East': getCurrenciesByRegion('Middle East').length,
    'West Africa': getCurrenciesByRegion('West Africa').length,
    'East Africa': getCurrenciesByRegion('East Africa').length,
    'Oceania': getCurrenciesByRegion('Oceania').length
  }
};