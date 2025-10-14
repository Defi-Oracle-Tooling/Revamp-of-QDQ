import { useEffect, useRef, useState } from 'react';
import { ethers, Contract } from 'ethers';

interface UseTokenBalanceOptions {
  pollIntervalMs?: number;
  enabled?: boolean;
}

export function useTokenBalance(
  contractAddress: string | undefined,
  account: string | undefined,
  abi: any,
  { pollIntervalMs = 8000, enabled = true }: UseTokenBalanceOptions = {}
) {
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchBalance() {
    if (!enabled || !contractAddress || !account || !(window as any).ethereum) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const erc20: Contract = new ethers.Contract(contractAddress, abi, provider);
      const raw = await erc20.balanceOf(account);
      setBalance(ethers.formatEther(raw));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch balance');
    }
  }

  useEffect(() => {
    fetchBalance();
    if (!enabled) return;
    timerRef.current = setInterval(fetchBalance, pollIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contractAddress, account, enabled, pollIntervalMs]);

  return { balance, error, refresh: fetchBalance };
}