import { useState, useCallback, useEffect } from 'react';
import { Button, Box, Text, Alert, AlertIcon, Spinner } from '@chakra-ui/react';
import { useConnect, useDisconnect, useAccount, useChainId } from 'wagmi';
import { walletConnect } from 'wagmi/connectors';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export default function WalletConnect({ onConnect, onDisconnect, onError }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const walletConnectConnector = connectors.find(
    (connector) => connector.id === 'walletConnect'
  );

  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      if (!walletConnectConnector) {
        throw new Error('WalletConnect connector not found');
      }

      await connect({ connector: walletConnectConnector });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to WalletConnect';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [connect, walletConnectConnector, onError]);

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
      <Box p={4} borderWidth="1px" borderRadius="md" borderColor="green.300">
        <Text mb={2} fontWeight="bold" color="green.600">
          WalletConnect Connected
        </Text>
        <Text fontSize="sm" mb={2}>
          Address: {address.slice(0, 6)}...{address.slice(-4)}
        </Text>
        <Text fontSize="sm" mb={3}>
          Chain ID: {chainId}
        </Text>
        <Button colorScheme="red" size="sm" onClick={handleDisconnect}>
          Disconnect WalletConnect
        </Button>
      </Box>
    );
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="md">
      <Text mb={3} fontWeight="bold">
        WalletConnect
      </Text>
      <Text fontSize="sm" mb={3} color="gray.600">
        Connect to supported mobile wallets via WalletConnect protocol
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
        disabled={!walletConnectConnector}
        size="sm"
        w="full"
      >
        {isConnecting || isPending ? (
          <>
            <Spinner size="sm" mr={2} />
            Connecting...
          </>
        ) : (
          'Connect WalletConnect'
        )}
      </Button>
      
      {!walletConnectConnector && (
        <Text fontSize="xs" color="red.500" mt={2}>
          WalletConnect not available
        </Text>
      )}
    </Box>
  );
}