import type { NextPage } from 'next'
import { Heading, Text, VStack, Box, Button, Input, Spacer, Flex } from '@chakra-ui/react'
import { useState, useEffect} from 'react'
import { ethers } from "ethers"
import ReadQuorumToken from "../components/quorumToken/ReadQuorumToken"
import TransferQuorumToken from "../components/quorumToken/TransferQuorumToken"
import MMAccount from "../components/MMAccount"

declare let window:any

export default function Home() {

  const [balance, setBalance] = useState<string | undefined>();
  const [currentAccount, setCurrentAccount] = useState<string | undefined>();
  const [erc20ContractAddress, setErc20ContractAddress] = useState<string>("0x");
  const [chainId, setChainId] = useState<number | undefined>();
  const [etherscanUrl, setEtherscanUrl] = useState<string | undefined>();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!currentAccount || !ethers.isAddress(currentAccount)) return;
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.getBalance(currentAccount).then((result: any) => {
      setBalance(ethers.formatEther(result));
    });
    provider.getNetwork().then((network: any) => {
      setChainId(Number(network.chainId));
      // Set Etherscan URL for Ethereum Mainnet
      if (network.chainId === 1) {
        setEtherscanUrl(`https://etherscan.io/address/${currentAccount}`);
      } else if (network.chainId === 138) {
        setEtherscanUrl(`https://etherscan.io/address/${currentAccount}`); // ChainID 138 explorer
      } else {
        setEtherscanUrl(undefined);
      }
    });
    // Fetch Etherscan transactions (mock for now)
    setTransactions([
      { hash: '0xmocktx1', from: currentAccount, to: '0xreceiver', value: '100', timeStamp: Date.now() },
      { hash: '0xmocktx2', from: '0xsender', to: currentAccount, value: '50', timeStamp: Date.now() - 10000 }
    ]);
  }, [currentAccount]);

  const onClickConnect = () => {
    if(!window.ethereum) {
      console.log("please install MetaMask");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    // MetaMask requires requesting permission to connect users accounts
    provider.send("eth_requestAccounts", [])
    .then((accounts: string[]) => {
      if (accounts.length > 0) setCurrentAccount(accounts[0])
    })
    .catch((e: unknown) => console.log(e))
  }

  const onClickDisconnect = () => {
    setBalance(undefined)
    setCurrentAccount(undefined)
  }

  const deployedAddressHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErc20ContractAddress(e.target.value);
  }

  return (
    <>
      <Heading as="h3" my={4}>QuorumToken</Heading>          
      <VStack>
      <Box w='100%' my={4}>
        {currentAccount
          ? <Button type="button" w='100%' onClick={onClickDisconnect}>
              Connected to Metamask with account: {currentAccount}
            </Button>
          : <Button type="button" w='100%' onClick={onClickConnect}>
              Connect to MetaMask
            </Button>
        }
        {etherscanUrl && (
          <Box mt={2}>
            <Text fontSize="sm">Etherscan: <a href={etherscanUrl} target="_blank" rel="noopener noreferrer">{etherscanUrl}</a></Text>
          </Box>
        )}
        {balance && (
          <Text fontSize="sm" mt={2}>Balance: {balance} ETH</Text>
        )}
        {transactions.length > 0 && (
          <Box mt={2}>
            <Text fontSize="sm" fontWeight="bold">Recent Transactions:</Text>
            {transactions.map(tx => (
              <Box key={tx.hash} fontSize="xs" borderBottom="1px solid #eee" py={1}>
                <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">{tx.hash}</a>
                <Text>From: {tx.from} To: {tx.to} Value: {tx.value}</Text>
              </Box>
            ))}
          </Box>
        )}
        {/* Virtual Account and Fiat Wallet Managers */}
        <Box mt={4}>
          <React.Suspense fallback={<Text>Loading Virtual Account Manager...</Text>}>
            {require('../components/wallets/VirtualAccountManager').default()}
          </React.Suspense>
          <React.Suspense fallback={<Text>Loading Fiat Wallet Manager...</Text>}>
            {require('../components/wallets/FiatWalletManager').default()}
          </React.Suspense>
          <React.Suspense fallback={<Text>Loading Cross-Chain Bridge...</Text>}>
            {require('../components/wallets/CrossChainBridge').default()}
          </React.Suspense>
        </Box>
      </Box>
        {currentAccount  
          ?<MMAccount 
            balance={balance} 
            chainId={chainId}
            erc20ContractAddress={erc20ContractAddress}
            deployedAddressHandler={deployedAddressHandler} />
          :<></>
        }

        {(erc20ContractAddress!="0x")  
          ?<Box mb={0} p={4} w='100%' borderWidth="1px" borderRadius="lg">
          <Heading my={4} fontSize='xl'>Read QuorumToken</Heading>
          <Text my={4}>Query the smart contract info at address provided</Text>
          <Spacer />
          <ReadQuorumToken 
            addressContract={erc20ContractAddress}
            currentAccount={currentAccount}
          />
        </Box>
        :<></>
        }

        {(erc20ContractAddress!="0x")  
          ?<Box  mb={0} p={4} w='100%' borderWidth="1px" borderRadius="lg">
          <Heading my={4}  fontSize='xl'>Transfer QuorumToken</Heading>
          <Text my={4}>Interact with the token</Text>
          <TransferQuorumToken
            addressContract={erc20ContractAddress}
            currentAccount={currentAccount}
          />
        </Box>
        :<></>
        } 

      </VStack>
    </>
  )
}
