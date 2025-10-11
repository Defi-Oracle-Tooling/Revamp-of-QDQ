import { useState, useCallback, useEffect } from 'react';
import { Button, Box, Text, Alert, AlertIcon, Spinner } from '@chakra-ui/react';
import { useConnect, useDisconnect, useAccount, useChainId } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';

interface CoinbaseWalletProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export default function CoinbaseWallet({ onConnect, onDisconnect, onError }: CoinbaseWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const coinbaseConnector = connectors.find(
    (connector) => connector.id === 'coinbaseWalletSDK'
  );

  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      if (!coinbaseConnector) {
        throw new Error('Coinbase Wallet connector not found');
      }

      await connect({ connector: coinbaseConnector });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Coinbase Wallet';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [connect, coinbaseConnector, onError]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setError(null);
      onDisconnect?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [disconnect, onDisconnect, onError]);

  useEffect(() => {
    if (isConnected && address) {
      onConnect?.(address);
    }
  }, [isConnected, address, onConnect]);

  if (isConnected && address) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="md" borderColor="blue.300">
        <Text mb={2} fontWeight="bold" color="blue.600">
          Coinbase Wallet Connected
        </Text>
        <Text fontSize="sm" mb={2}>
          Address: {address.slice(0, 6)}...{address.slice(-4)}
        </Text>
        <Text fontSize="sm" mb={3}>
          Chain ID: {chainId}
        </Text>
        <Button colorScheme="red" size="sm" onClick={handleDisconnect}>
          Disconnect Coinbase Wallet
        </Button>
      </Box>
    );
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="md">
      <Text mb={3} fontWeight="bold">
        Coinbase Wallet
      </Text>
      <Text fontSize="sm" mb={3} color="gray.600">
        Connect using Coinbase Wallet for secure, self-custody trading
      </Text>
      
      {error && (
        <Alert status="error" mb={3}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Button
        colorScheme="blue"
        onClick={handleConnect}
        isLoading={isConnecting || isPending}
        loadingText="Connecting..."
        disabled={!coinbaseConnector}
        size="sm"
        w="full"
      >
        {isConnecting || isPending ? (
          <>
            <Spinner size="sm" mr={2} />
            Connecting...
          </>
        ) : (
          'Connect Coinbase Wallet'
        )}
      </Button>
      
      {!coinbaseConnector && (
        <Text fontSize="xs" color="red.500" mt={2}>
          Coinbase Wallet not available
        </Text>
      )}
    </Box>
  );
}