// Global ambient type declarations for browser extensions

interface EthereumProviderRequestArguments {
  method: string;
  params?: unknown[] | object;
}

interface EthereumProvider {
  request: (args: EthereumProviderRequestArguments) => Promise<any>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    __updateWalletState?: (address: string | null, walletType: string | null, chainId?: number) => void;
  }
}

export {};