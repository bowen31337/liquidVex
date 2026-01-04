/**
 * E2E Test: Feature 62 - WebSocket /ws/orderbook/:coin streams order book updates
 *
 * This test verifies that the WebSocket endpoint correctly streams real-time
 * order book data with initial snapshot and delta updates.
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';
const WS_URL = process.env.WS_URL || 'ws://localhost:8000';

test.describe('Feature 62: WebSocket /ws/orderbook/:coin streams', () => {
  test('Step 1: Establish WebSocket connection to /ws/orderbook/BTC', async ({ page }) => {
    // Connect to WebSocket
    const ws = await page.evaluateHandle((url) => {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        socket.onopen = () => resolve(socket);
        socket.onerror = (e) => reject(e);
      });
    }, `${WS_URL}/ws/orderbook/BTC`);

    // Verify connection is open
    const state = await page.evaluate((ws) => ws.readyState, ws);
    expect(state).toBe(1); // WebSocket.OPEN

    // Close connection
    await page.evaluate((ws) => ws.close(), ws);
  });

  test('Step 2: Verify initial snapshot received', async ({ page }) => {
    const ws = await page.evaluateHandle((url) => {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve({ socket, data });
        };
        socket.onerror = (e) => reject(e);
      });
    }, `${WS_URL}/ws/orderbook/BTC`);

    const result = await page.evaluate((ws) => ws, ws);
    const data = result.data;

    // Verify snapshot structure
    expect(data.type).toBe('orderbook_snapshot');
    expect(data.coin).toBe('BTC');
    expect(data.bids).toBeDefined();
    expect(data.asks).toBeDefined();
    expect(Array.isArray(data.bids)).toBe(true);
    expect(Array.isArray(data.asks)).toBe(true);
    expect(data.bids.length).toBeGreaterThan(0);
    expect(data.asks.length).toBeGreaterThan(0);

    // Close connection
    await page.evaluate((ws) => ws.socket.close(), ws);
  });

  test('Step 3: Verify delta updates received over time', async ({ page }) => {
    const updates: any[] = [];

    const ws = await page.evaluateHandle((args) => {
      const { url, updates } = args;
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        let messageCount = 0;

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          updates.push(data);
          messageCount++;

          // Resolve after receiving 2 updates (snapshot + 1 delta)
          if (messageCount >= 2) {
            resolve({ socket, updates });
          }
        };

        socket.onerror = (e) => reject(e);
      });
    }, { url: `${WS_URL}/ws/orderbook/BTC`, updates });

    // Wait a bit for updates
    await page.waitForTimeout(500);

    const result = await page.evaluate((ws) => ({ updates: ws.updates, socket: ws.socket }), ws);

    // Should have at least 2 messages (snapshot + update)
    expect(result.updates.length).toBeGreaterThanOrEqual(2);

    // Verify at least one is an update
    const hasUpdate = result.updates.some((u: any) => u.type === 'orderbook_update');
    expect(hasUpdate).toBe(true);

    // Close connection
    await page.evaluate((ws) => ws.socket.close(), ws);
  });

  test('Step 4: Verify data format matches OrderBookLevel interface', async ({ page }) => {
    const ws = await page.evaluateHandle((url) => {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve({ socket, data });
        };
        socket.onerror = (e) => reject(e);
      });
    }, `${WS_URL}/ws/orderbook/BTC`);

    const result = await page.evaluate((ws) => ws, ws);
    const data = result.data;

    // Verify bids format
    if (data.bids.length > 0) {
      const bid = data.bids[0];
      expect(bid).toHaveProperty('px');
      expect(bid).toHaveProperty('sz');
      expect(bid).toHaveProperty('n');

      // Verify data types
      expect(typeof bid.px).toBe('number');
      expect(typeof bid.sz).toBe('number');
      expect(typeof bid.n).toBe('number');
    }

    // Verify asks format
    if (data.asks.length > 0) {
      const ask = data.asks[0];
      expect(ask).toHaveProperty('px');
      expect(ask).toHaveProperty('sz');
      expect(ask).toHaveProperty('n');

      // Verify data types
      expect(typeof ask.px).toBe('number');
      expect(typeof ask.sz).toBe('number');
      expect(typeof ask.n).toBe('number');
    }

    // Verify bids are sorted descending (highest price first)
    if (data.bids.length > 1) {
      for (let i = 0; i < data.bids.length - 1; i++) {
        expect(data.bids[i].px).toBeGreaterThanOrEqual(data.bids[i + 1].px);
      }
    }

    // Verify asks are sorted ascending (lowest price first)
    if (data.asks.length > 1) {
      for (let i = 0; i < data.asks.length - 1; i++) {
        expect(data.asks[i].px).toBeLessThanOrEqual(data.asks[i + 1].px);
      }
    }

    // Close connection
    await page.evaluate((ws) => ws.socket.close(), ws);
  });

  test('Step 5: Verify orderbook data is realistic', async ({ page }) => {
    const ws = await page.evaluateHandle((url) => {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve({ socket, data });
        };
        socket.onerror = (e) => reject(e);
      });
    }, `${WS_URL}/ws/orderbook/BTC`);

    const result = await page.evaluate((ws) => ws, ws);
    const data = result.data;

    // Verify spread exists (asks should be higher than bids)
    if (data.bids.length > 0 && data.asks.length > 0) {
      const highestBid = Math.max(...data.bids.map((b: any) => b.px));
      const lowestAsk = Math.min(...data.asks.map((a: any) => a.px));
      expect(lowestAsk).toBeGreaterThan(highestBid);
    }

    // Verify reasonable price values (BTC around 95000)
    if (data.bids.length > 0) {
      const avgBid = data.bids.reduce((sum: number, b: any) => sum + b.px, 0) / data.bids.length;
      expect(avgBid).toBeGreaterThan(90000);
      expect(avgBid).toBeLessThan(100000);
    }

    // Close connection
    await page.evaluate((ws) => ws.socket.close(), ws);
  });

  test('Step 6: Verify ETH orderbook also works', async ({ page }) => {
    const ws = await page.evaluateHandle((url) => {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve({ socket, data });
        };
        socket.onerror = (e) => reject(e);
      });
    }, `${WS_URL}/ws/orderbook/ETH`);

    const result = await page.evaluate((ws) => ws, ws);
    const data = result.data;

    expect(data.coin).toBe('ETH');
    expect(data.bids).toBeDefined();
    expect(data.asks).toBeDefined();
    expect(data.bids.length).toBeGreaterThan(0);

    // Verify ETH prices are around 3500
    const avgBid = data.bids.reduce((sum: number, b: any) => sum + b.px, 0) / data.bids.length;
    expect(avgBid).toBeGreaterThan(3000);
    expect(avgBid).toBeLessThan(4000);

    // Close connection
    await page.evaluate((ws) => ws.socket.close(), ws);
  });

  test('Step 7: Verify multiple connections can be established', async ({ page }) => {
    // Create 3 connections
    const connections = await page.evaluateHandle((url) => {
      return new Promise((resolve, reject) => {
        const sockets: WebSocket[] = [];
        let connected = 0;

        for (let i = 0; i < 3; i++) {
          const socket = new WebSocket(url);
          socket.onopen = () => {
            connected++;
            if (connected === 3) {
              resolve(sockets);
            }
          };
          socket.onerror = (e) => reject(e);
          sockets.push(socket);
        }
      });
    }, `${WS_URL}/ws/orderbook/BTC`);

    // Verify all 3 are connected
    const count = await page.evaluate((ws) => ws.length, connections);
    expect(count).toBe(3);

    // Close all
    await page.evaluate((ws) => ws.forEach((s: WebSocket) => s.close()), connections);
  });

  test('Step 8: Verify connection handles graceful disconnect', async ({ page }) => {
    const ws = await page.evaluateHandle((url) => {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        socket.onopen = () => {
          socket.close();
          resolve(true);
        };
        socket.onerror = (e) => reject(e);
      });
    }, `${WS_URL}/ws/orderbook/BTC`);

    const closed = await page.evaluate((ws) => ws, ws);
    expect(closed).toBe(true);
  });

  test('Step 9: Verify timestamp is included in messages', async ({ page }) => {
    const ws = await page.evaluateHandle((url) => {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve({ socket, data });
        };
        socket.onerror = (e) => reject(e);
      });
    }, `${WS_URL}/ws/orderbook/BTC`);

    const result = await page.evaluate((ws) => ws, ws);
    const data = result.data;

    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('number');
    expect(data.timestamp).toBeGreaterThan(1000000000000); // Should be in milliseconds

    // Close connection
    await page.evaluate((ws) => ws.socket.close(), ws);
  });

  test('Step 10: Verify bid/ask sizes are positive numbers', async ({ page }) => {
    const ws = await page.evaluateHandle((url) => {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(url);
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve({ socket, data });
        };
        socket.onerror = (e) => reject(e);
      });
    }, `${WS_URL}/ws/orderbook/BTC`);

    const result = await page.evaluate((ws) => ws, ws);
    const data = result.data;

    // All bid sizes should be positive
    data.bids.forEach((bid: any) => {
      expect(bid.sz).toBeGreaterThan(0);
      expect(bid.n).toBeGreaterThan(0);
    });

    // All ask sizes should be positive
    data.asks.forEach((ask: any) => {
      expect(ask.sz).toBeGreaterThan(0);
      expect(ask.n).toBeGreaterThan(0);
    });

    // Close connection
    await page.evaluate((ws) => ws.socket.close(), ws);
  });
});
