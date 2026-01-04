'use client';

/**
 * MarketDataProvider - Initializes market data on app load
 * Fetches initial market metadata and sets up WebSocket connections
 */

import { useEffect } from 'react';
import { useMarketStore } from '../stores/marketStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useApi } from '../hooks/useApi';

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const {
    selectedAsset,
    selectedTimeframe,
    setWsConnected,
  } = useMarketStore();

  const { getExchangeMeta, getAssetInfo, getCandles } = useApi();

  // Check for test mode
  const isTestMode = (() => {
    if (typeof process !== 'undefined' &&
        (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || process.env.NODE_ENV === 'test')) {
      return true;
    }
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('testMode') === 'true' || urlParams.has('testMode');
    }
    return false;
  })();

  // Skip WebSocket connections in test mode to prevent real-time data from interfering with tests
  const wsUrl = isTestMode ? null : `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001'}`;

  // Connect to allMids stream for price updates across all assets
  const allMidsResult = useWebSocket(
    wsUrl ? `${wsUrl}/ws/allMids` : null,
    { autoReconnect: true, reconnectInterval: 3000 }
  );

  // Connect to orderbook stream for current asset
  const orderBookResult = useWebSocket(
    wsUrl && selectedAsset
      ? `${wsUrl}/ws/orderbook/${selectedAsset}`
      : null,
    { autoReconnect: true, reconnectInterval: 3000 }
  );

  // Connect to trades stream for current asset
  const tradesResult = useWebSocket(
    wsUrl && selectedAsset
      ? `${wsUrl}/ws/trades/${selectedAsset}`
      : null,
    { autoReconnect: true, reconnectInterval: 3000 }
  );

  useEffect(() => {
    // Skip API calls in test mode - tests manage their own data
    if (isTestMode) {
      // Still need to stop loading states for skeleton to disappear
      const { setIsLoadingCandles, setIsLoadingOrderBook, setIsLoadingTrades } = useMarketStore.getState();
      setIsLoadingCandles(false);
      setIsLoadingOrderBook(false);
      setIsLoadingTrades(false);
      return;
    }

    // Fetch all available markets on mount
    const initMarkets = async () => {
      try {
        await getExchangeMeta();
        // Could store asset list here if needed
      } catch (err) {
        console.warn('Could not fetch exchange meta:', err);
      }
    };
    initMarkets();

    // Fetch initial data for selected coin
    const initAssetData = async () => {
      try {
        await getAssetInfo(selectedAsset);
        // Could store asset info if needed
      } catch (err) {
        console.warn('Could not fetch asset info:', err);
      }
    };
    initAssetData();

    // Fetch candles separately - this triggers the loading state transition
    const fetchCandles = async () => {
      try {
        const { setCandles } = useMarketStore.getState();
        const data = await getCandles(selectedAsset, selectedTimeframe, 500);
        setCandles(data);
      } catch (err) {
        console.warn('Could not fetch candles:', err);
        // Even on error, stop loading to prevent infinite skeleton
        const { setIsLoadingCandles } = useMarketStore.getState();
        setIsLoadingCandles(false);
      }
    };
    fetchCandles();
  }, [getExchangeMeta, getAssetInfo, getCandles, selectedAsset, selectedTimeframe, isTestMode]);

  // Update connection status based on any active connection
  useEffect(() => {
    if (isTestMode) {
      // In test mode, show as connected for UI purposes
      setWsConnected(true);
      return;
    }
    const anyConnected = allMidsResult.isConnected || orderBookResult.isConnected || tradesResult.isConnected;
    setWsConnected(anyConnected);
  }, [allMidsResult.isConnected, orderBookResult.isConnected, tradesResult.isConnected, setWsConnected, isTestMode]);

  return <>{children}</>;
}
