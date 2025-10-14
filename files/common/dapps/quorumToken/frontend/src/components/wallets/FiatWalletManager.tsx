import React, { useState } from 'react';
import { Box, Button, Input, Text, VStack } from '@chakra-ui/react';

interface BankConnection {
  bankCode: string;
  accountNumber: string;
  routingNumber: string;
  swift?: string;
  iban?: string;
  apiEndpoint: string;
  authenticated: boolean;
}

interface ComplianceInfo {
  kycVerified: boolean;
  amlStatus: 'pending' | 'approved' | 'rejected';
  regulatoryCompliance: string[];
  iso20022Compliant: boolean;
}

interface FiatWallet {
  id: string;
  currency: string;
  balance: string;
  bankConnection: BankConnection;
  compliance: ComplianceInfo;
}

export default function FiatWalletManager() {
  const [currency, setCurrency] = useState('EUR');
  const [bankCode, setBankCode] = useState('BANK001');
  const [account, setAccount] = useState<FiatWallet | null>(null);
  const [loading, setLoading] = useState(false);

  const createWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tatum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'fiatWallet', currency, bankCode })
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
      <Text fontWeight="bold">Fiat Wallet Management</Text>
      <VStack align="start" spacing={2} mt={2}>
        <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="Currency (e.g. EUR, USD)" w="200px" />
        <Input value={bankCode} onChange={e => setBankCode(e.target.value)} placeholder="Bank Code" w="200px" />
        <Button onClick={createWallet} isLoading={loading} colorScheme="green">Create Fiat Wallet</Button>
        {account && (
          <Box mt={2}>
            <Text>ID: {account.id}</Text>
            <Text>Currency: {account.currency}</Text>
            <Text>Balance: {account.balance}</Text>
            <Text>Bank Code: {account.bankConnection.bankCode}</Text>
            <Text>Account Number: {account.bankConnection.accountNumber}</Text>
            <Text>Routing Number: {account.bankConnection.routingNumber}</Text>
            <Text>API Endpoint: {account.bankConnection.apiEndpoint}</Text>
            <Text>Authenticated: {account.bankConnection.authenticated ? 'Yes' : 'No'}</Text>
            <Text>KYC Verified: {account.compliance.kycVerified ? 'Yes' : 'No'}</Text>
            <Text>AML Status: {account.compliance.amlStatus}</Text>
            <Text>Regulatory Compliance: {account.compliance.regulatoryCompliance.join(', ')}</Text>
            <Text>ISO 20022 Compliant: {account.compliance.iso20022Compliant ? 'Yes' : 'No'}</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
