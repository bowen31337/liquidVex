/**
 * Custom hook for WebSocket connections
 */

import { useEffect, useRef, useState } from 'react';
import { useMarketStore } from '../stores/marketStore';
import { OrderBookData, TradeData, CandleData, AllMidsData, UserStreamData } from '../types';

interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(url: string | null, options: WebSocketOptions = {}) {
  const {
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    setOrderBook,
    addTrade,
    addCandle,
    setAllMids,
    setWsConnected,
  } = useMarketStore();

  const connect = () => {
    if (!url) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected:', url);
      setIsConnected(true);
      setWsConnected(true);
      setReconnectAttempts(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Route message based on type
        switch (data.type) {
          case 'orderbook_snapshot':
          case 'orderbook_update':
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
            console.warn('Unknown message type:', data.type);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setWsConnected(false);

      if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, reconnectInterval);
      }
    };
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setWsConnected(false);
  };

  const send = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    reconnectAttempts,
    send,
    disconnect,
    connect,
  };
}
