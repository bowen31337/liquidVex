/**
 * TanStack Query hooks for account data with caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePositionStore } from '../stores/positionStore';
import { accountAPI, tradeAPI } from '../lib/api';

/**
 * Hook for fetching account state
 */
export const useAccountState = (address: string | null) => {
  return useQuery({
    queryKey: ['account', 'state', address],
    queryFn: () => accountAPI.getState(address!),
    enabled: !!address,
    staleTime: 5 * 1000,      // 5 seconds
    gcTime: 30 * 1000,        // 30 seconds
    refetchInterval: 5 * 1000, // Refetch every 5 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for fetching account positions
 */
export const useAccountPositions = (address: string | null) => {
  return useQuery({
    queryKey: ['account', 'positions', address],
    queryFn: () => accountAPI.getPositions(address!),
    enabled: !!address,
    staleTime: 3 * 1000,      // 3 seconds
    gcTime: 20 * 1000,        // 20 seconds
    refetchInterval: 3 * 1000, // Refetch every 3 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for fetching account orders
 */
export const useAccountOrders = (address: string | null) => {
  return useQuery({
    queryKey: ['account', 'orders', address],
    queryFn: () => accountAPI.getOrders(address!),
    enabled: !!address,
    staleTime: 2 * 1000,      // 2 seconds
    gcTime: 15 * 1000,        // 15 seconds
    refetchInterval: 2 * 1000, // Refetch every 2 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for fetching account history
 */
export const useAccountHistory = (address: string | null, type: 'orders' | 'trades' = 'orders') => {
  return useQuery({
    queryKey: ['account', 'history', address, type],
    queryFn: () => accountAPI.getHistory(address!, type),
    enabled: !!address,
    staleTime: 10 * 1000,     // 10 seconds
    gcTime: 60 * 1000,        // 1 minute
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for placing orders with mutation
 */
export const usePlaceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: any) => tradeAPI.placeOrder(orderData),
    onSuccess: () => {
      // Invalidate account-related queries after successful order
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
    onError: (error) => {
      console.error('Order placement failed:', error);
    },
  });
};

/**
 * Hook for canceling orders with mutation
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cancelData: any) => tradeAPI.cancelOrder(cancelData),
    onSuccess: () => {
      // Invalidate account-related queries after successful cancellation
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
    onError: (error) => {
      console.error('Order cancellation failed:', error);
    },
  });
};

/**
 * Hook for closing positions with mutation
 */
export const useClosePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (coin: string) => tradeAPI.closePosition(coin),
    onSuccess: () => {
      // Invalidate position-related queries after successful closure
      queryClient.invalidateQueries({ queryKey: ['account', 'positions'] });
      queryClient.invalidateQueries({ queryKey: ['account', 'state'] });
    },
    onError: (error) => {
      console.error('Position closure failed:', error);
    },
  });
};

/**
 * Hook for managing account store state with TanStack Query integration
 */
export const useAccountStoreWithQuery = () => {
  const queryClient = useQueryClient();
  const setWalletAddress = usePositionStore((state) => state.setWalletAddress);

  const updateWalletAddress = (address: string | null) => {
    setWalletAddress(address);
    if (address) {
      // Prefetch account data
      queryClient.prefetchQuery({
        queryKey: ['account', 'state', address],
        queryFn: () => accountAPI.getState(address),
      });
      queryClient.prefetchQuery({
        queryKey: ['account', 'positions', address],
        queryFn: () => accountAPI.getPositions(address),
      });
    }
  };

  return {
    updateWalletAddress,
  };
};