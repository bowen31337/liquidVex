/**
 * Custom hook for WebSocket connections
 *
 * This hook now uses the centralized WebSocket manager (wsManager)
 * to avoid duplicate connections and reduce errors.
 */

import { useEffect, useState } from 'react';
import { useMarketStore } from '../stores/marketStore';
import { OrderBookData, TradeData, CandleData, AllMidsData } from '../types';
import { wsManager } from './useWebSocketManager';

interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(url: string | null, options: WebSocketOptions = {}) {
  // Options are now handled by the manager, but kept for API compatibility
  const {
    autoReconnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);

  const {
    setOrderBook,
    addTrade,
    addCandle,
    setAllMids,
  } = useMarketStore();

  useEffect(() => {
    if (!url || !autoReconnect) return;

    // Create message handler for this URL
    const messageHandler = (data: any) => {
      // Update connection status
      setIsConnected(true);

      // Route message based on type
      switch (data.type) {
        case 'orderbook_snapshot':
        case 'orderbook_update':
        case 'orderbook':
          // Handle both new format (orderbook) and legacy format (orderbook_snapshot/update)
          setOrderBook(data as OrderBookData);
          break;

        case 'trade':
          addTrade(data as TradeData);
          break;

        case 'candle':
          addCandle(data as CandleData);
          break;

        case 'allMids':
          setAllMids((data as AllMidsData).mids);
          break;

        case 'connected':
        case 'heartbeat':
          // User stream messages
          break;

        default:
          // Unknown message type - silently ignore
      }
    };

    // Connect using the manager
    wsManager.connect(url, messageHandler);

    // Cleanup on unmount or URL change
    return () => {
      wsManager.disconnect(url, messageHandler);
      setIsConnected(false);
    };
  }, [url, autoReconnect]);

  return {
    isConnected,
    send: (_data: any) => {
      // For now, we don't support sending through the manager
      // This can be added later if needed
      return false;
    },
  };
}
