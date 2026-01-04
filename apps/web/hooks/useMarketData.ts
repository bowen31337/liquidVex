/**
 * TanStack Query hooks for market data with caching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMarketStore } from '../stores/marketStore';
import { infoAPI } from '../lib/api';

/**
 * Hook for fetching exchange metadata (all available assets)
 */
export const useMarketMeta = () => {
  return useQuery({
    queryKey: ['market', 'meta'],
    queryFn: () => infoAPI.getMeta(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

/**
 * Hook for fetching asset info
 */
export const useAssetInfo = (coin: string) => {
  return useQuery({
    queryKey: ['market', 'asset', coin],
    queryFn: () => infoAPI.getAsset(coin),
    enabled: !!coin,
    staleTime: 30 * 1000,     // 30 seconds
    gcTime: 2 * 60 * 1000,    // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for fetching funding rate history
 */
export const useFundingHistory = (coin: string) => {
  return useQuery({
    queryKey: ['market', 'funding', coin],
    queryFn: () => infoAPI.getFunding(coin),
    enabled: !!coin,
    staleTime: 60 * 1000,     // 1 minute
    gcTime: 5 * 60 * 1000,    // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for fetching OHLCV candlestick data
 */
export const useCandles = (coin: string, interval: string = '1h', startTime?: number, endTime?: number) => {
  return useQuery({
    queryKey: ['market', 'candles', coin, interval, startTime, endTime],
    queryFn: () => infoAPI.getCandles(coin, interval as any, startTime, endTime),
    enabled: !!coin && !!interval,
    staleTime: 10 * 1000,     // 10 seconds
    gcTime: 60 * 1000,        // 1 minute
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for managing market store state with TanStack Query integration
 */
export const useMarketStoreWithQuery = () => {
  const queryClient = useQueryClient();

  // Get current selected asset from store
  const selectedAsset = useMarketStore((state) => state.selectedAsset);
  const selectedTimeframe = useMarketStore((state) => state.selectedTimeframe);

  // Set asset in store and invalidate related queries
  const setSelectedAsset = useMarketStore((state) => state.setSelectedAsset);
  const setSelectedTimeframe = useMarketStore((state) => state.setSelectedTimeframe);

  const updateSelectedAsset = (asset: string) => {
    setSelectedAsset(asset);
    // Invalidate queries related to the new asset
    queryClient.invalidateQueries({ queryKey: ['market', 'asset', asset] });
    queryClient.invalidateQueries({ queryKey: ['market', 'funding', asset] });
    queryClient.invalidateQueries({ queryKey: ['market', 'candles', asset] });
  };

  const updateSelectedTimeframe = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    // Invalidate candle queries for current asset
    queryClient.invalidateQueries({ queryKey: ['market', 'candles', selectedAsset] });
  };

  return {
    selectedAsset,
    selectedTimeframe,
    updateSelectedAsset,
    updateSelectedTimeframe,
  };
};