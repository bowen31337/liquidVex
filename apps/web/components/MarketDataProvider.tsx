'use client';

/**
 * MarketDataProvider - Initializes market data on app load
 * Fetches initial market metadata and sets up WebSocket connections
 */

import { useEffect } from 'react';
import { useMarketStore } from '../stores/marketStore';

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const { fetchAllMarkets, fetchMarketInfo, selectedCoin, fetchCandles, selectedTimeframe } =
    useMarketStore();

  useEffect(() => {
    // Fetch all available markets on mount
    fetchAllMarkets();

    // Fetch initial data for selected coin
    fetchMarketInfo(selectedCoin);
    fetchCandles(selectedCoin, selectedTimeframe);

    // TODO: Set up WebSocket connections here
    // WebSocket connections will be implemented in a follow-up task
  }, [fetchAllMarkets, fetchMarketInfo, fetchCandles, selectedCoin, selectedTimeframe]);

  return <>{children}</>;
}
