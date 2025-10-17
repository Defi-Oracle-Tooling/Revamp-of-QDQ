// Wells Fargo integration configuration interface
export interface WellsFargoConfig {
  enabled: boolean;
  baseUrl: string; // e.g. https://api.wellsfargo.com/treasury
  oauthClientId?: string;
  oauthClientSecretRef?: string; // reference to vault secret
  mtlsCertRef?: string; // reference to cert in vault
  mtlsKeyRef?: string; // reference to key in vault
  polling: {
    balancesIntervalSec: number;
    transactionsIntervalSec: number;
    paymentStatusIntervalSec: number;
  };
  services: {
    balances: boolean;
    transactions: boolean;
    ach: boolean;
    wires: boolean;
    rtp: boolean;
    fx: boolean;
    sweeps: boolean;
    lockbox: boolean;
    positivePay: boolean;
  };
}

export const defaultWellsFargoConfig: WellsFargoConfig = {
  enabled: false,
  baseUrl: '',
  polling: {
    balancesIntervalSec: 300,
    transactionsIntervalSec: 300,
    paymentStatusIntervalSec: 120
  },
  services: {
    balances: true,
    transactions: true,
    ach: false,
    wires: false,
    rtp: false,
    fx: false,
    sweeps: false,
    lockbox: false,
    positivePay: false
  }
};

// Lazy dynamic loader wrapper (environment + optional vault secrets)
// NOTE: Actual secret retrieval is delegated to ../secrets/azureKeyVault
export async function loadWellsFargoConfig(): Promise<WellsFargoConfig> {
  const { loadWellsFargoConfigFromEnv } = await import('../../secrets/azureKeyVault');
  return loadWellsFargoConfigFromEnv(defaultWellsFargoConfig);
}
