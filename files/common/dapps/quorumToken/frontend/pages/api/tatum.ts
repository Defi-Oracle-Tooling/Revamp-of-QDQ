import type { NextApiRequest, NextApiResponse } from 'next';
// Inline TatumAdapter implementation for compatibility

type TatumConfig = {
  apiKey: string;
  testnet: boolean;
};

type BankConnection = {
  bankCode?: string;
  accountNumber?: string;
  routingNumber?: string;
  apiEndpoint?: string;
  authenticated?: boolean;
};

class TatumAdapter {
  config: TatumConfig;
  online: boolean;
  constructor(config: TatumConfig, online: boolean = false) {
    this.config = config;
    this.online = online;
  }
  async createVirtualAccount(currency: string, customerId: string = 'demo-customer') {
    return {
      id: `va_${Date.now()}`,
      currency,
      accountCode: `VA_${currency}_${Date.now()}`,
      accountNumber: `${currency}${Math.floor(Math.random() * 1000000)}`,
      available: '1000.00',
      blocked: '0.00',
      frozen: false,
      customerId,
    };
  }
  async createFiatWallet(currency: string, bankConnection: BankConnection = {}) {
    return {
      id: `fw_${Date.now()}`,
      currency,
      balance: '5000.00',
      bankConnection: {
        bankCode: bankConnection.bankCode || 'BANK001',
        accountNumber: `${Math.floor(Math.random() * 100000000)}`,
        routingNumber: bankConnection.routingNumber || '021000021',
        apiEndpoint: bankConnection.apiEndpoint || 'https://api.bank-simulation.local',
        authenticated: true,
      },
      compliance: {
        kycVerified: true,
        amlStatus: 'approved',
        regulatoryCompliance: ['MiFID II', 'PSD2', 'GDPR'],
        iso20022Compliant: true,
      },
    };
  }
}

const tatumConfig = {
  apiKey: process.env.TATUM_API_KEY || 'demo-key',
  testnet: true,
};
const tatum = new TatumAdapter(tatumConfig, false);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { type, currency, bankCode } = req.body;
    if (type === 'virtualAccount') {
      const account = await tatum.createVirtualAccount(currency, 'demo-customer');
      return res.status(200).json(account);
    }
    if (type === 'fiatWallet') {
      const wallet = await tatum.createFiatWallet(currency, { bankCode });
      return res.status(200).json(wallet);
    }
    return res.status(400).json({ error: 'Invalid type' });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
