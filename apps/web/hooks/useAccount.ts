/**
 * Account hook for managing account state and data fetching
 */

import { useEffect, useCallback } from 'react';
import { useOrderStore } from '../stores/orderStore';
import { useMarketStore } from '../stores/marketStore';

export function useAccount(address?: string) {
  const { accountState, fetchAccountState, setAccountState } = useOrderStore();
  const { selectedAsset } = useMarketStore();

  // Mock account data for demo purposes
  const mockAccountState = {
    equity: 10000.0,
    marginUsed: 2500.0,
    availableBalance: 7500.0,
    withdrawable: 5000.0,
    crossMarginSummary: {
      accountValue: 10000.0,
      totalMarginUsed: 2500.0,
    },
  };

  // Fetch account state periodically
  useEffect(() => {
    if (address) {
      // For now, use mock data until wallet integration is complete
      setAccountState(mockAccountState);

      // Set up periodic fetching (every 30 seconds)
      const interval = setInterval(() => {
        setAccountState(mockAccountState);
      }, 30000);

      return () => clearInterval(interval);
    } else {
      // If no address, use mock data
      setAccountState(mockAccountState);
    }
  }, [address, setAccountState]);

  // Manual refresh function
  const refreshAccount = useCallback(async () => {
    if (address) {
      try {
        await fetchAccountState(address);
      } catch (error) {
        console.error('Failed to refresh account:', error);
      }
    }
  }, [address, fetchAccountState]);

  // Calculate PnL percentage
  const getPNLPercent = useCallback(() => {
    if (!accountState) return 0;
    const initialEquity = 10000; // Can be made configurable
    const pnl = accountState.equity - initialEquity;
    return (pnl / initialEquity) * 100;
  }, [accountState]);

  // Calculate margin utilization
  const getMarginUtilization = useCallback(() => {
    if (!accountState || accountState.equity <= 0) return 0;
    return (accountState.marginUsed / accountState.equity) * 100;
  }, [accountState]);

  return {
    accountState,
    refreshAccount,
    getPNLPercent,
    getMarginUtilization,
    isLoaded: !!accountState,
  };
}