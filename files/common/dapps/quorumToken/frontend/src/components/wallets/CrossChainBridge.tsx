import React, { useState } from 'react';
import { Box, Button, Input, Text, VStack, Select, HStack, Badge } from '@chakra-ui/react';

interface BridgeTransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: string;
  token: string;
  sourceChainId: number;
  targetChainId: number;
  status: 'Initiated' | 'Locked' | 'Validated' | 'Minted' | 'Completed' | 'Failed';
  timestamp: string;
}

const supportedChains = [
  { id: 1, name: 'Ethereum Mainnet' },
  { id: 138, name: 'ChainID 138' },
  { id: 137, name: 'Polygon' },
  { id: 56, name: 'BSC' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' }
];

const supportedTokens = [
  'EURC138', 'USDC138', 'USDT138', 'DAI138', 'M1USD', 'M1EUR', 'M1GBP', 'M1JPY'
];

export default function CrossChainBridge() {
  const [fromChain, setFromChain] = useState(138);
  const [toChain, setToChain] = useState(1);
  const [token, setToken] = useState('EURC138');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [bridgeTransaction, setBridgeTransaction] = useState<BridgeTransaction | null>(null);
  const [loading, setLoading] = useState(false);

  const initiateBridge = async () => {
    if (!amount || !recipient) return;
    
    setLoading(true);
    try {
      // Simulate bridge initiation
      const txId = `bridge_${Date.now()}`;
      const transaction: BridgeTransaction = {
        id: txId,
        sender: '0x742d35cc6339c4532ce58b3b5a43efffe82c2043', // Mock sender
        recipient,
        amount,
        token,
        sourceChainId: fromChain,
        targetChainId: toChain,
        status: 'Initiated',
        timestamp: new Date().toISOString(),
      };
      
      setBridgeTransaction(transaction);
      
      // Simulate status progression
      setTimeout(() => {
        setBridgeTransaction(prev => prev ? { ...prev, status: 'Locked' } : null);
      }, 2000);
      
      setTimeout(() => {
        setBridgeTransaction(prev => prev ? { ...prev, status: 'Validated' } : null);
      }, 4000);
      
      setTimeout(() => {
        setBridgeTransaction(prev => prev ? { ...prev, status: 'Completed' } : null);
      }, 6000);
      
    } catch (err) {
      console.error('Bridge failed:', err);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Initiated': return 'blue';
      case 'Locked': return 'orange';
      case 'Validated': return 'purple';
      case 'Completed': return 'green';
      case 'Failed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} my={4}>
      <Text fontWeight="bold" mb={4}>Cross-Chain Bridge</Text>
      <VStack align="start" spacing={3}>
        <HStack w="full">
          <Box>
            <Text fontSize="sm">From Chain</Text>
            <Select value={fromChain} onChange={e => setFromChain(Number(e.target.value))} w="200px">
              {supportedChains.map(chain => (
                <option key={chain.id} value={chain.id}>{chain.name}</option>
              ))}
            </Select>
          </Box>
          <Box>
            <Text fontSize="sm">To Chain</Text>
            <Select value={toChain} onChange={e => setToChain(Number(e.target.value))} w="200px">
              {supportedChains.map(chain => (
                <option key={chain.id} value={chain.id}>{chain.name}</option>
              ))}
            </Select>
          </Box>
        </HStack>
        
        <Box>
          <Text fontSize="sm">Token</Text>
          <Select value={token} onChange={e => setToken(e.target.value)} w="200px">
            {supportedTokens.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Box>
        
        <Input 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          placeholder="Amount" 
          w="200px" 
        />
        
        <Input 
          value={recipient} 
          onChange={e => setRecipient(e.target.value)} 
          placeholder="Recipient Address" 
          w="400px" 
        />
        
        <Button 
          onClick={initiateBridge} 
          isLoading={loading} 
          colorScheme="purple"
          isDisabled={!amount || !recipient || fromChain === toChain}
        >
          Initiate Bridge Transfer
        </Button>
        
        {bridgeTransaction && (
          <Box mt={4} p={3} borderWidth="1px" borderRadius="md" w="full">
            <Text fontWeight="bold">Bridge Transaction Status</Text>
            <Text fontSize="sm">ID: {bridgeTransaction.id}</Text>
            <Text fontSize="sm">From: {supportedChains.find(c => c.id === bridgeTransaction.sourceChainId)?.name}</Text>
            <Text fontSize="sm">To: {supportedChains.find(c => c.id === bridgeTransaction.targetChainId)?.name}</Text>
            <Text fontSize="sm">Amount: {bridgeTransaction.amount} {bridgeTransaction.token}</Text>
            <Text fontSize="sm">Recipient: {bridgeTransaction.recipient}</Text>
            <HStack mt={2}>
              <Text fontSize="sm">Status:</Text>
              <Badge colorScheme={getStatusColor(bridgeTransaction.status)}>
                {bridgeTransaction.status}
              </Badge>
            </HStack>
            {bridgeTransaction.status === 'Completed' && (
              <Text fontSize="sm" color="green.500" mt={2}>
                ✅ Bridge transfer completed successfully!
              </Text>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
}