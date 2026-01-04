/**
 * Custom hook for WebSocket connections
 *
 * This hook now uses the centralized WebSocket manager (wsManager)
 * to avoid duplicate connections and reduce errors.
 */

import { useEffect, useState } from 'react';
import { useMarketStore } from '../stores/marketStore';
import { useOrderStore } from '../stores/orderStore';
import { usePositionStore } from '../stores/positionStore';
import { OrderBookData, TradeData, CandleData, AllMidsData, OrderFill, TradeEvent } from '../types';
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

  // Check for test mode - skip WebSocket connections in test mode
  const isTestMode = typeof window !== 'undefined' && (
    process.env.NEXT_PUBLIC_TEST_MODE === 'true' ||
    process.env.NODE_ENV === 'test' ||
    new URLSearchParams(window.location.search).get('testMode') === 'true'
  );

  const [isConnected, setIsConnected] = useState(isTestMode ? true : false);

  const {
    setOrderBook,
    addTrade,
    addCandle,
    setAllMids,
  } = useMarketStore();

  const {
    addOrderHistory,
    updateOpenOrder,
  } = useOrderStore();

  const {
    setPositions,
  } = usePositionStore();

  /**
   * Handle order fill events and update positions accordingly
   */
  const handleOrderFill = (fill: OrderFill) => {
    // Update the open order status if it still exists
    updateOpenOrder(fill.oid, {
      status: fill.status,
      filledSz: fill.sz,
      avgFillPx: fill.px,
    });

    // Add to order history
    addOrderHistory({
      oid: fill.oid,
      coin: fill.coin,
      side: fill.side,
      limitPx: fill.px,
      sz: fill.sz,
      origSz: fill.sz,
      status: fill.status,
      timestamp: fill.timestamp,
      orderType: 'market', // Assume market order for fills
      reduceOnly: false,
      postOnly: false,
      tif: 'GTC',
    });

    // Update position locally for immediate feedback
    const positionStore = usePositionStore.getState();
    if (typeof (positionStore as any).updatePositionFromFill === 'function') {
      (positionStore as any).updatePositionFromFill(fill);
    }

    // Periodically refresh from API to stay in sync
    const { walletAddress } = usePositionStore.getState();
    if (walletAddress) {
      setTimeout(() => {
        usePositionStore.getState().fetchPositions(walletAddress);
      }, 1000); // Refresh after 1 second
    }
  };

  useEffect(() => {
    // Skip WebSocket connections in test mode
    if (isTestMode) return;
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

        case 'order_fill':
          handleOrderFill(data as OrderFill);
          break;

        case 'trade_event':
          // Convert TradeEvent to TradeData format
          addTrade({
            type: 'trade',
            coin: data.coin,
            side: data.side,
            px: data.px,
            sz: data.sz,
            time: data.timestamp,
            hash: `trade_${data.tradeId}`,
          } as TradeData);
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
  }, [url, autoReconnect, isTestMode]);

  return {
    isConnected,
    send: (_data: any) => {
      // For now, we don't support sending through the manager
      // This can be added later if needed
      return false;
    },
  };
}
