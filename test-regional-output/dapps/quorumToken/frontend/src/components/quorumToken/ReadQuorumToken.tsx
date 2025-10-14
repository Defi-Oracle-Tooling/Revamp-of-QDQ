import React, { useEffect, useState } from 'react';
import { Text, Alert, AlertIcon } from '@chakra-ui/react';
import { QuorumTokenABI as abi } from './QuorumTokenABI';
import { ethers, Contract } from 'ethers';
import { useTokenBalance } from '../../hooks/useTokenBalance';

declare let window: any;

interface ReadQuorumTokenProps {
    addressContract: string,
    currentAccount: string | undefined
}

export default function ReadQuorumToken(props:ReadQuorumTokenProps){
  const addressContract = props.addressContract
  const currentAccount = props.currentAccount
  const [totalSupply,setTotalSupply]=useState<string>()
  const [symbol,setSymbol]= useState<string>("")
  const { balance, error: balanceError, refresh } = useTokenBalance(addressContract, currentAccount, abi, { pollIntervalMs: 10000 });

  useEffect( () => {
    if(!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const erc20:Contract  = new ethers.Contract(addressContract, abi, provider);

  provider.getCode(addressContract).then((result: string) => {
      //check whether it is a contract
      if(result === '0x') return

    erc20.symbol().then((res: string) => {
      setSymbol(res)
    }).catch((e: unknown) => console.error(e))
    erc20.totalSupply().then((res: any) => {
      setTotalSupply(ethers.formatEther(res))
    }).catch((e: unknown) => console.error(e));

    })
  },[])  

  // when currentAccount changes, we call this hook ie useEffect(()=>{ .... },[currentAccount]
  // 
  useEffect(()=>{
    if(!window.ethereum) return
    if(!currentAccount) return

  refresh();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const erc20:Contract = new ethers.Contract(addressContract, abi, provider);

    // listen for changes on an Ethereum address
    console.log(`listening for Transfer...`)
    const fromMe = erc20.filters.Transfer(currentAccount, null)
  erc20.on(fromMe, (from: string, to: string, amount: any, event: any) => {
    console.log('Transfer|sent',  { from, to, amount, event } )
    refresh();
    })

    const toMe = erc20.filters.Transfer(null, currentAccount)
  erc20.on(toMe, (from: string, to: string, amount: any, event: any) => {
    console.log('Transfer|received',  { from, to, amount, event } )
    refresh();
    })

    // remove listener when the component is unmounted
    return () => {
        erc20.removeAllListeners(toMe)
        erc20.removeAllListeners(fromMe)
    }    
  }, [currentAccount])


  // Balance polling handled by hook

  return (
    <div>
        <Text><b>ERC20 Contract Address</b>:  {addressContract}</Text>
        <Text><b>QuorumToken totalSupply</b>: {totalSupply} {symbol}</Text>
        {balanceError && (
          <Alert status='error' mb={2}>
            <AlertIcon />{balanceError}
          </Alert>
        )}
        <Text><b>QuorumToken in current account</b>: {balance} {symbol}</Text>
    </div>
  )
}
