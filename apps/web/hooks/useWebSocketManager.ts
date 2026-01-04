/**
 * Centralized WebSocket connection manager (Singleton)
 *
 * This module manages all WebSocket connections from a single place,
 * preventing duplicate connections and reducing errors.
 *
 * Performance optimizations:
 * - Message batching for UI updates
 * - Debounced state updates
 * - Connection pooling
 * - Error handling with backoff
 *
 * Components should use the useWebSocket hook which internally uses this manager.
 */

import { useMarketStore } from '../stores/marketStore';
import { reportWebSocketError, reportNetworkError } from '../utils/errorHandler';
import { memoryLeakDetector } from '../utils/memoryLeakDetector';

interface WebSocketConnection {
  ws: WebSocket | null;
  url: string;
  reconnectAttempts: number;
  messageHandlers: Set<(data: any) => void>;
  isConnecting: boolean;
  lastError: Event | null;
  messageQueue: any[];
  lastFlushTime: number;
}

interface PerformanceMetrics {
  totalMessages: number;
  processedMessages: number;
  droppedMessages: number;
  averageLatency: number;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;
const MESSAGE_BATCH_INTERVAL = 16; // ~60fps
const MAX_QUEUE_SIZE = 1000;
const MAX_LAG_TIME = 100; // Max time to hold messages

// Singleton connection manager
class WebSocketManagerClass {
  private connections: Map<string, WebSocketConnection> = new Map();
  private metrics: PerformanceMetrics = {
    totalMessages: 0,
    processedMessages: 0,
    droppedMessages: 0,
    averageLatency: 0,
  };
  private flushTimer: NodeJS.Timeout | null = null;

  connect(url: string, messageHandler: (data: any) => void) {
    // Check if connection already exists
    if (this.connections.has(url)) {
      const connection = this.connections.get(url)!;
      // Add this handler to the existing connection
      connection.messageHandlers.add(messageHandler);
      return connection;
    }

    // Check if a connection is in progress
    if (this.isConnecting(url)) {
      // Wait a bit and try again
      setTimeout(() => this.connect(url, messageHandler), 100);
      return null;
    }

    // Create new connection
    const ws = new WebSocket(url);
    const connectionId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const connection: WebSocketConnection = {
      ws,
      url,
      reconnectAttempts: 0,
      messageHandlers: new Set([messageHandler]),
      isConnecting: true,
      lastError: null,
      messageQueue: [],
    };

    this.connections.set(url, connection);

    // Track WebSocket for memory leak detection
    memoryLeakDetector.trackWebSocket(connectionId, ws);

    ws.onopen = () => {
      connection.reconnectAttempts = 0;
      connection.isConnecting = false;
      connection.messageQueue = []; // Clear queue on reconnect
      this.updateConnectionStatus();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.metrics.totalMessages++;

        // Add to queue for batching
        connection.messageQueue.push({
          timestamp: performance.now(),
          data
        });

        // Start flush timer if not running
        if (!this.flushTimer) {
          this.flushTimer = setTimeout(() => this.flushMessages(), MESSAGE_BATCH_INTERVAL);
        }

        // Emergency flush if queue gets too large or too old
        if (connection.messageQueue.length >= MAX_QUEUE_SIZE ||
            (performance.now() - connection.messageQueue[0].timestamp) > MAX_LAG_TIME) {
          this.flushMessages();
        }
      } catch (err) {
        // Silently ignore parse errors
        this.metrics.droppedMessages++;
      }
    };

    ws.onerror = (error) => {
      // Store the error for debugging
      connection.lastError = error;

      // Report WebSocket error
      reportWebSocketError(`WebSocket connection error for ${url}`, {
        url,
        errorType: error.type || 'unknown',
        message: error.message || 'WebSocket error occurred',
        timestamp: Date.now()
      });

      // Silently handle connection errors - they're expected in some environments
      // and will be retried automatically if autoReconnect is enabled
    };

    ws.onclose = () => {
      connection.isConnecting = false;
      connection.lastError = null; // Clear error on close

      // Report connection loss
      reportWebSocketError(`WebSocket connection closed for ${url}`, {
        url,
        reason: 'Connection closed',
        reconnectAttempts: connection.reconnectAttempts,
        timestamp: Date.now()
      });

      this.connections.delete(url);
      this.updateConnectionStatus();

      // Attempt reconnection
      if (connection.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        connection.reconnectAttempts++;
        setTimeout(() => {
          // Reconnect with all previous handlers
          const handlers = Array.from(connection.messageHandlers);
          this.connect(url, (data: any) => {
            handlers.forEach(h => h(data));
          });
        }, RECONNECT_INTERVAL * Math.pow(2, connection.reconnectAttempts)); // Exponential backoff
      }
    };

    return connection;
  }

  disconnect(url: string, messageHandler?: (data: any) => void) {
    const connection = this.connections.get(url);
    if (connection) {
      if (messageHandler) {
        // Remove only this handler
        connection.messageHandlers.delete(messageHandler);
        // If no more handlers, close the connection
        if (connection.messageHandlers.size === 0) {
          connection.ws?.close();
          this.connections.delete(url);
        }
      } else {
        // Close entire connection
        connection.ws?.close();
        this.connections.delete(url);
      }
      this.updateConnectionStatus();
    }
  }

  flushMessages() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const flushTime = performance.now();
    let totalLatency = 0;

    // Process all connections
    this.connections.forEach(connection => {
      if (connection.messageQueue.length === 0) return;

      // Call all registered handlers for each message
      connection.messageHandlers.forEach(handler => {
        try {
          connection.messageQueue.forEach(({ data }) => {
            const latency = flushTime - data.timestamp;
            totalLatency += latency;
            handler(data);
          });
        } catch (err) {
          // Silently ignore handler errors
        }
      });

      // Clear queue
      connection.messageQueue = [];
      this.metrics.processedMessages += connection.messageQueue.length;
    });

    // Update average latency
    if (this.metrics.processedMessages > 0) {
      this.metrics.averageLatency = totalLatency / this.metrics.processedMessages;
    }

    // Continue batching if there are more messages coming
    if (this.metrics.totalMessages > this.metrics.processedMessages) {
      this.flushTimer = setTimeout(() => this.flushMessages(), MESSAGE_BATCH_INTERVAL);
    }
  }

  disconnectAll() {
    this.connections.forEach((connection) => {
      connection.ws?.close();
    });
    this.connections.clear();
    const { setWsConnected } = useMarketStore.getState();
    setWsConnected(false);
  }

  // Performance monitoring methods
  getPerformanceMetrics() {
    return { ...this.metrics };
  }

  resetPerformanceMetrics() {
    this.metrics = {
      totalMessages: 0,
      processedMessages: 0,
      droppedMessages: 0,
      averageLatency: 0,
    };
  }

  logPerformanceMetrics() {
    if (process.env.NODE_ENV !== 'development') return;

    const { totalMessages, processedMessages, droppedMessages, averageLatency } = this.metrics;
    console.log('WebSocket Performance:', {
      totalMessages,
      processedMessages,
      droppedMessages,
      averageLatency: `${averageLatency.toFixed(2)}ms`,
      efficiency: totalMessages > 0 ? `${((processedMessages / totalMessages) * 100).toFixed(1)}%` : '0%',
      targetMet: averageLatency < 100 ? '✅' : '❌',
    });
  }
  testDisconnectAll() {
    // Force close all connections for testing
    this.connections.forEach((connection) => {
      connection.ws?.close(1000, 'Test disconnect');
    });
    this.connections.clear();
    const { setWsConnected } = useMarketStore.getState();
    setWsConnected(false);
  }

  testGetConnection(url: string) {
    return this.connections.get(url);
  }

  testIsConnected(url: string): boolean {
    const conn = this.connections.get(url);
    return conn?.ws?.readyState === WebSocket.OPEN;
  }

  private isConnecting(url: string): boolean {
    const connection = this.connections.get(url);
    return connection?.isConnecting ?? false;
  }

  private updateConnectionStatus() {
    const hasConnections = this.connections.size > 0;
    const { setWsConnected } = useMarketStore.getState();
    setWsConnected(hasConnections);
  }

  getConnectionsCount() {
    return this.connections.size;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManagerClass();

// Expose for testing
if (typeof window !== 'undefined') {
  (window as any).wsManager = wsManager;
}
