import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Heading, 
  VStack, 
  HStack, 
  Button, 
  Text, 
  Alert, 
  AlertIcon, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Badge,
  Divider
} from '@chakra-ui/react';
import { useAccount, useChainId, useDisconnect } from 'wagmi';
import WalletConnect from './WalletConnect';
import CoinbaseWallet from './CoinbaseWallet';

declare let window: any;

interface WalletManagerProps {
  onWalletChange?: (address: string | null, walletType: string | null) => void;
  targetChainId?: number;
}

type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | null;

export default function WalletManager({ onWalletChange, targetChainId = 1337 }: WalletManagerProps) {
  const [currentWallet, setCurrentWallet] = useState<WalletType>(null);
  const [isMetaMaskConnecting, setIsMetaMaskConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();

  // MetaMask connection handler
  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsMetaMaskConnecting(true);
      setError(null);
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length > 0) {
        setCurrentWallet('metamask');
        onWalletChange?.(accounts[0], 'metamask');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to MetaMask';
      setError(errorMessage);
    } finally {
      setIsMetaMaskConnecting(false);
    }
  }, [onWalletChange]);

  const handleWalletConnect = useCallback((address: string) => {
    setCurrentWallet('walletconnect');
    setError(null);
    onWalletChange?.(address, 'walletconnect');
  }, [onWalletChange]);

  const handleCoinbaseConnect = useCallback((address: string) => {
    setCurrentWallet('coinbase');
    setError(null);
    onWalletChange?.(address, 'coinbase');
  }, [onWalletChange]);

  const handleDisconnect = useCallback(async () => {
    try {
      if (currentWallet === 'metamask' && window.ethereum) {
        // MetaMask doesn't have a programmatic disconnect
        // We just clear our local state
        setCurrentWallet(null);
        onWalletChange?.(null, null);
      } else {
        // For WalletConnect and Coinbase, use wagmi disconnect
        await disconnect();
        setCurrentWallet(null);
        onWalletChange?.(null, null);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    }
  }, [currentWallet, disconnect, onWalletChange]);

  const handleError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleWalletDisconnect = useCallback(() => {
    setCurrentWallet(null);
    onWalletChange?.(null, null);
  }, [onWalletChange]);

  // Check for existing MetaMask connection
  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      setCurrentWallet('metamask');
      onWalletChange?.(window.ethereum.selectedAddress, 'metamask');
    }
  }, [onWalletChange]);

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setCurrentWallet(null);
        onWalletChange?.(null, null);
      } else if (currentWallet === 'metamask') {
        onWalletChange?.(accounts[0], 'metamask');
      }
    };

    const handleChainChanged = () => {
      // Reload on chain change to avoid stale state
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [currentWallet, onWalletChange]);

  const isWrongNetwork = chainId !== targetChainId;
  const connectedAddress = address || (currentWallet === 'metamask' && window.ethereum?.selectedAddress);

  if (isConnected || connectedAddress) {
    return (
      <Box p={6} borderWidth="2px" borderRadius="lg" borderColor="green.300" bg="green.50">
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Heading size="md" color="green.700">
              Wallet Connected
            </Heading>
            <Badge colorScheme="green" textTransform="capitalize">
              {currentWallet || 'Unknown'}
            </Badge>
          </HStack>
          
          <Box>
            <Text fontSize="sm" color="gray.600">Address:</Text>
            <Text fontFamily="mono" fontSize="sm" wordBreak="break-all">
              {connectedAddress}
            </Text>
          </Box>
          
          <HStack justify="space-between">
            <Box>
              <Text fontSize="sm" color="gray.600">Chain ID:</Text>
              <Text fontSize="sm">{chainId}</Text>
            </Box>
            {isWrongNetwork && (
              <Alert status="warning" size="sm">
                <AlertIcon />
                Wrong network! Expected chain {targetChainId}
              </Alert>
            )}
          </HStack>
          
          <Button 
            colorScheme="red" 
            size="sm" 
            onClick={handleDisconnect}
            w="fit-content"
          >
            Disconnect Wallet
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg">
      <VStack spacing={6} align="stretch">
        <Heading size="lg" textAlign="center">
          Connect Your Wallet
        </Heading>
        
        <Text textAlign="center" color="gray.600">
          Choose a wallet to connect to the Quorum network
        </Text>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>MetaMask</Tab>
            <Tab>WalletConnect</Tab>
            <Tab>Coinbase Wallet</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={4}>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Connect using the MetaMask browser extension
                </Text>
                <Button
                  colorScheme="orange"
                  size="lg"
                  onClick={connectMetaMask}
                  isLoading={isMetaMaskConnecting}
                  loadingText="Connecting..."
                  disabled={!window.ethereum}
                  w="full"
                >
                  {window.ethereum ? 'Connect MetaMask' : 'MetaMask Not Detected'}
                </Button>
                {!window.ethereum && (
                  <Text fontSize="xs" color="red.500">
                    Please install MetaMask browser extension
                  </Text>
                )}
              </VStack>
            </TabPanel>

            <TabPanel>
              <WalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                onError={handleError}
              />
            </TabPanel>

            <TabPanel>
              <CoinbaseWallet
                onConnect={handleCoinbaseConnect}
                onDisconnect={handleWalletDisconnect}
                onError={handleError}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Divider />
        
        <Text fontSize="xs" color="gray.500" textAlign="center">
          By connecting a wallet, you agree to the terms and conditions
        </Text>
      </VStack>
    </Box>
  );
}