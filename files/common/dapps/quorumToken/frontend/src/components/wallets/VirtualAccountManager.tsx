import React, { useState } from 'react';
import { Box, Button, Input, Text, VStack } from '@chakra-ui/react';

interface VirtualAccount {
  id: string;
  currency: string;
  accountCode: string;
  accountNumber: string;
  available: string;
  blocked: string;
  frozen: boolean;
  customerId?: string;
}

export default function VirtualAccountManager() {
  const [currency, setCurrency] = useState('EUR');
  const [account, setAccount] = useState<VirtualAccount | null>(null);
  const [loading, setLoading] = useState(false);

  const createAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tatum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'virtualAccount', currency })
      });
      const data = await res.json();
      setAccount(data);
    } catch (err) {
      setAccount(null);
    }
    setLoading(false);
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} my={4}>
      <Text fontWeight="bold">Virtual Account Management</Text>
      <VStack align="start" spacing={2} mt={2}>
        <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="Currency (e.g. EUR, USD)" w="200px" />
        <Button onClick={createAccount} isLoading={loading} colorScheme="blue">Create Virtual Account</Button>
        {account && (
          <Box mt={2}>
            <Text>ID: {account.id}</Text>
            <Text>Currency: {account.currency}</Text>
            <Text>Account Code: {account.accountCode}</Text>
            <Text>Account Number: {account.accountNumber}</Text>
            <Text>Available: {account.available}</Text>
            <Text>Blocked: {account.blocked}</Text>
            <Text>Frozen: {account.frozen ? 'Yes' : 'No'}</Text>
            <Text>Customer ID: {account.customerId}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
