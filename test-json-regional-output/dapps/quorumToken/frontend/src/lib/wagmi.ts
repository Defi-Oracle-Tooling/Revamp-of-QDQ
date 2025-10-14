import { createConfig, configureChains } from 'wagmi';
import { localhost, mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';

// Local Quorum chain definition
export const quorumLocal = {
  id: 1337,
  name: 'Quorum Local',
  network: 'quorum-local',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_NETWORK_RPC || 'http://127.0.0.1:8545'] },
    default: { http: [process.env.NEXT_PUBLIC_NETWORK_RPC || 'http://127.0.0.1:8545'] },
  },
  blockExplorers: { default: { name: 'Blockscout', url: 'http://localhost:26000' } },
} as const;

export const { chains, publicClient } = configureChains(
  [quorumLocal, localhost, mainnet],
  [publicProvider()]
);

export const wagmiConfig = createConfig({
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
      options: { appName: 'Quorum Token DApp', appLogoUrl: 'https://wagmi.sh/icon.png' },
    }),
  ],
  publicClient,
});

export * from 'wagmi';