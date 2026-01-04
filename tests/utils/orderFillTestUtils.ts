/**
 * Test utilities for order fill events
 * Provides mock WebSocket functionality for testing order fills
 */

import type { OrderFill } from '../../apps/web/types';

/**
 * Mock WebSocket manager for testing order fills
 * Simulates receiving order fill events
 */
export class MockWebSocketManager {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private connected: boolean = false;

  /**
   * Connect to a mock WebSocket URL
   */
  connect(url: string, messageHandler: (data: any) => void) {
    if (!this.listeners.has(url)) {
      this.listeners.set(url, new Set());
    }

    this.listeners.get(url)?.add(messageHandler);
    this.connected = true;

    // Simulate connection event
    setTimeout(() => {
      messageHandler({ type: 'connected', url, timestamp: Date.now() });
    }, 100);

    return {
      disconnect: () => this.disconnect(url, messageHandler)
    };
  }

  /**
   * Disconnect from a mock WebSocket URL
   */
  disconnect(url: string, messageHandler: (data: any) => void) {
    const handlers = this.listeners.get(url);
    if (handlers) {
      handlers.delete(messageHandler);
      if (handlers.size === 0) {
        this.listeners.delete(url);
      }
    }
  }

  /**
   * Send a mock order fill event to all connected handlers
   */
  sendOrderFill(fill: OrderFill) {
    this.listeners.forEach((handlers, url) => {
      handlers.forEach(handler => {
        try {
          handler(fill);
        } catch (error) {
          console.error('Error in order fill handler:', error);
        }
      });
    });
  }

  /**
   * Send a mock trade event
   */
  sendTradeEvent(coin: string, side: 'B' | 'A', px: number, sz: number) {
    const tradeEvent = {
      type: 'trade',
      coin,
      side,
      px,
      sz,
      timestamp: Date.now(),
      tradeId: Math.floor(Math.random() * 1000000),
      taker: true
    };

    this.listeners.forEach((handlers, url) => {
      handlers.forEach(handler => {
        try {
          handler(tradeEvent);
        } catch (error) {
          console.error('Error in trade event handler:', error);
        }
      });
    });
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.connected && this.listeners.size > 0;
  }

  /**
   * Get connected URLs
   */
  getConnectedUrls(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Disconnect all connections
   */
  disconnectAll() {
    this.listeners.clear();
    this.connected = false;
  }
}

/**
 * Create a mock order fill event
 */
export function createMockOrderFill(options: Partial<OrderFill> = {}): OrderFill {
  const defaultFill: OrderFill = {
    type: 'order_fill',
    oid: Math.floor(Math.random() * 1000000),
    coin: 'BTC',
    side: 'B',
    px: 50000,
    sz: 0.1,
    remaining: 0,
    status: 'filled',
    timestamp: Date.now(),
    fee: 10,
    tradeId: Math.floor(Math.random() * 1000000)
  };

  return { ...defaultFill, ...options };
}

/**
 * Create a mock trade event
 */
export function createMockTradeEvent(coin: string, side: 'B' | 'A', px: number, sz: number) {
  return {
    type: 'trade',
    coin,
    side,
    px,
    sz,
    timestamp: Date.now(),
    tradeId: Math.floor(Math.random() * 1000000),
    taker: true
  };
}

/**
 * Test helper to simulate rapid order fills
 */
export async function simulateRapidFills(
  wsManager: MockWebSocketManager,
  fills: OrderFill[],
  delay: number = 100
) {
  for (const fill of fills) {
    wsManager.sendOrderFill(fill);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Test helper to simulate order book updates along with fills
 */
export async function simulateOrderBookWithFills(
  wsManager: MockWebSocketManager,
  coin: string,
  fills: OrderFill[]
) {
  // Send order book snapshot first
  const orderBook = {
    type: 'orderbook_snapshot',
    coin,
    bids: [
      { px: 50000, sz: 10, n: 5 },
      { px: 49900, sz: 15, n: 8 }
    ],
    asks: [
      { px: 50100, sz: 12, n: 6 },
      { px: 50200, sz: 8, n: 4 }
    ],
    timestamp: Date.now()
  };

  wsManager.listeners.forEach((handlers, url) => {
    handlers.forEach(handler => {
      try {
        handler(orderBook);
      } catch (error) {
        console.error('Error in order book handler:', error);
      }
    });
  });

  // Then send fills
  for (const fill of fills) {
    wsManager.sendOrderFill(fill);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Test helper to verify position state
 */
export function verifyPositionState(positions: any[], expected: {
  coin: string;
  side?: 'long' | 'short';
  minSize?: number;
  maxSize?: number;
  minEntryPx?: number;
  maxEntryPx?: number;
}) {
  const position = positions.find(p => p.coin === expected.coin);
  expect(position).toBeDefined();

  if (expected.side) {
    expect(position.side).toBe(expected.side);
  }

  if (expected.minSize !== undefined) {
    expect(position.sz).toBeGreaterThanOrEqual(expected.minSize);
  }

  if (expected.maxSize !== undefined) {
    expect(position.sz).toBeLessThanOrEqual(expected.maxSize);
  }

  if (expected.minEntryPx !== undefined) {
    expect(position.entryPx).toBeGreaterThanOrEqual(expected.minEntryPx);
  }

  if (expected.maxEntryPx !== undefined) {
    expect(position.entryPx).toBeLessThanOrEqual(expected.maxEntryPx);
  }
}

/**
 * Test helper to verify order history
 */
export function verifyOrderHistory(orders: any[], expected: {
  coin: string;
  side?: 'B' | 'A';
  minSize?: number;
  maxSize?: number;
  minPx?: number;
  maxPx?: number;
  status?: string;
}) {
  const order = orders.find(o => o.coin === expected.coin);
  expect(order).toBeDefined();

  if (expected.side) {
    expect(order.side).toBe(expected.side);
  }

  if (expected.minSize !== undefined) {
    expect(order.sz).toBeGreaterThanOrEqual(expected.minSize);
  }

  if (expected.maxSize !== undefined) {
    expect(order.sz).toBeLessThanOrEqual(expected.maxSize);
  }

  if (expected.minPx !== undefined) {
    expect(order.limitPx).toBeGreaterThanOrEqual(expected.minPx);
  }

  if (expected.maxPx !== undefined) {
    expect(order.limitPx).toBeLessThanOrEqual(expected.maxPx);
  }

  if (expected.status) {
    expect(order.status).toBe(expected.status);
  }
}

/**
 * Cleanup function to reset test state
 */
export function cleanupTestState() {
  // Clear any global state
  if (typeof window !== 'undefined') {
    // Clear any event listeners
    window.dispatchEvent(new Event('cleanup-test'));
  }
}