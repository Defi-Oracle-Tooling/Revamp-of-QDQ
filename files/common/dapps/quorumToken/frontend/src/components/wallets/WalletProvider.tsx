import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { localhost, mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';

// Define supported chains
const quorumLocal = {
  id: 1337,
  name: 'Quorum Local',
  network: 'quorum-local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'http://localhost:26000' },
  },
} as const;

// Configure chains and providers
const { chains, publicClient } = configureChains(
  [quorumLocal, localhost, mainnet],
  [publicProvider()]
);

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
        metadata: {
          name: 'Quorum Token DApp',
          description: 'A DApp for interacting with Quorum networks',
          url: 'http://localhost:3001',
          icons: ['https://wagmi.sh/icon.png'],
        },
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'Quorum Token DApp',
        appLogoUrl: 'https://wagmi.sh/icon.png',
      },
    }),
  ],
  publicClient,
});

// Wallet context types
interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  walletType: string | null;
  balance: string | null;
}

interface WalletContextType extends WalletState {
  connect: (walletType: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  updateBalance: (balance: string) => void;
  setError: (error: string | null) => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Wallet Provider Component
interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    walletType: null,
    balance: null,
  });
  
  const [error, setError] = useState<string | null>(null);

  const connect = async (walletType: string): Promise<void> => {
    setWalletState(prev => ({ ...prev, isConnecting: true }));
    setError(null);
    
    try {
      // Connection logic will be handled by individual wallet components
      // This is mainly for state management
      console.log(`Connecting to ${walletType}...`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      setWalletState({
        address: null,
        isConnected: false,
        isConnecting: false,
        chainId: null,
        walletType: null,
        balance: null,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const switchNetwork = async (chainId: number): Promise<void> => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch network');
    }
  };

  const updateBalance = (balance: string) => {
    setWalletState(prev => ({ ...prev, balance }));
  };

  // Update wallet state when connection changes
  const updateWalletState = (
    address: string | null, 
    walletType: string | null, 
    chainId?: number
  ) => {
    setWalletState(prev => ({
      ...prev,
      address,
      isConnected: !!address,
      walletType,
      chainId: chainId || prev.chainId,
    }));
  };

  // Expose wallet state updater for child components
  useEffect(() => {
    (window as any).__updateWalletState = updateWalletState;
    return () => {
      delete (window as any).__updateWalletState;
    };
  }, []);

  const contextValue: WalletContextType = {
    ...walletState,
    connect,
    disconnect,
    switchNetwork,
    updateBalance,
    setError,
    error,
  };

  return (
    <WagmiConfig config={wagmiConfig}>
      <WalletContext.Provider value={contextValue}>
        {children}
      </WalletContext.Provider>
    </WagmiConfig>
  );
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Export wagmi config for direct use if needed
export { wagmiConfig, chains };