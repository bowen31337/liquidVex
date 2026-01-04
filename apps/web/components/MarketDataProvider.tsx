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
    setAllMids,
    setWsConnected,
  } = useMarketStore();

  const { getExchangeMeta, getAssetInfo, getCandles } = useApi();

  // Connect to allMids stream for price updates across all assets
  const allMidsResult = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/allMids`,
    { autoReconnect: true, reconnectInterval: 3000 }
  );

  // Connect to orderbook stream for current asset
  const orderBookResult = useWebSocket(
    selectedAsset
      ? `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/orderbook/${selectedAsset}`
      : null,
    { autoReconnect: true, reconnectInterval: 3000 }
  );

  // Connect to trades stream for current asset
  const tradesResult = useWebSocket(
    selectedAsset
      ? `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/trades/${selectedAsset}`
      : null,
    { autoReconnect: true, reconnectInterval: 3000 }
  );

  useEffect(() => {
    // Fetch all available markets on mount
    const initMarkets = async () => {
      try {
        const meta = await getExchangeMeta();
        // Could store asset list here if needed
      } catch (err) {
        console.warn('Could not fetch exchange meta:', err);
      }
    };
    initMarkets();

    // Fetch initial data for selected coin
    const initAssetData = async () => {
      try {
        const info = await getAssetInfo(selectedAsset);
        // Could store asset info if needed
      } catch (err) {
        console.warn('Could not fetch asset info:', err);
      }

      try {
        const candles = await getCandles(selectedAsset, selectedTimeframe, 500);
        // Chart component handles candles via its own hook
      } catch (err) {
        console.warn('Could not fetch candles:', err);
      }
    };
    initAssetData();
  }, [getExchangeMeta, getAssetInfo, getCandles, selectedAsset, selectedTimeframe]);

  // Update connection status based on any active connection
  useEffect(() => {
    const anyConnected = allMidsResult.isConnected || orderBookResult.isConnected || tradesResult.isConnected;
    setWsConnected(anyConnected);
  }, [allMidsResult.isConnected, orderBookResult.isConnected, tradesResult.isConnected, setWsConnected]);

  return <>{children}</>;
}
