/**
 * Centralized WebSocket connection manager (Singleton)
 *
 * This module manages all WebSocket connections from a single place,
 * preventing duplicate connections and reducing errors.
 *
 * Components should use the useWebSocket hook which internally uses this manager.
 */

import { useMarketStore } from '../stores/marketStore';

interface WebSocketConnection {
  ws: WebSocket | null;
  url: string;
  reconnectAttempts: number;
  messageHandlers: Set<(data: any) => void>;
  isConnecting: boolean;
  lastError: Event | null;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

// Singleton connection manager
class WebSocketManagerClass {
  private connections: Map<string, WebSocketConnection> = new Map();

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
    const connection: WebSocketConnection = {
      ws,
      url,
      reconnectAttempts: 0,
      messageHandlers: new Set([messageHandler]),
      isConnecting: true,
      lastError: null,
    };

    this.connections.set(url, connection);

    ws.onopen = () => {
      connection.reconnectAttempts = 0;
      connection.isConnecting = false;
      this.updateConnectionStatus();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Call all registered handlers
        connection.messageHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (err) {
            // Silently ignore handler errors
          }
        });
      } catch (err) {
        // Silently ignore parse errors
      }
    };

    ws.onerror = (error) => {
      // Store the error for debugging
      connection.lastError = error;
      // Silently handle connection errors - they're expected in some environments
      // and will be retried automatically if autoReconnect is enabled
    };

    ws.onclose = () => {
      connection.isConnecting = false;
      connection.lastError = null; // Clear error on close
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
        }, RECONNECT_INTERVAL);
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

  disconnectAll() {
    this.connections.forEach((connection) => {
      connection.ws?.close();
    });
    this.connections.clear();
    const { setWsConnected } = useMarketStore.getState();
    setWsConnected(false);
  }

  // Test helper methods
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
