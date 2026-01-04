/**
 * E2E Test: Order Fills Integration Test
 *
 * This test integrates with the actual application WebSocket system
 * to test real order fill functionality.
 *
 * Test ID: 002
 * Priority: Critical
 * Category: Integration
 */

import { test, expect } from '@playwright/test';
import { MockWebSocketManager, createMockOrderFill, simulateRapidFills } from '../utils/orderFillTestUtils';

test.describe('Order Fills Integration', () => {
  let wsManager: MockWebSocketManager;

  test.beforeEach(async ({ page }) => {
    // Setup mock WebSocket manager
    wsManager = new MockWebSocketManager();

    // Override WebSocket in the browser context
    await page.addInitScript(() => {
      // Mock WebSocket constructor
      window.WebSocket = class MockWebSocket extends EventTarget {
        private url: string;
        private onopenCallback?: (event: Event) => void;
        private onmessageCallback?: (event: MessageEvent) => void;
        private oncloseCallback?: (event: Event) => void;
        private onerrorCallback?: (event: Event) => void;

        constructor(url: string) {
          super();
          this.url = url;

          // Simulate connection delay
          setTimeout(() => {
            this.readyState = 1; // OPEN
            const openEvent = new Event('open');
            this.dispatchEvent(openEvent);
            if (this.onopenCallback) {
              this.onopenCallback(openEvent);
            }
          }, 100);
        }

        send(data: string) {
          // Handle ping/pong
          if (data === '2') {
            setTimeout(() => {
              const pongEvent = new MessageEvent('message', {
                data: '3'
              });
              this.dispatchEvent(pongEvent);
              if (this.onmessageCallback) {
                this.onmessageCallback(pongEvent);
              }
            }, 50);
            return;
          }

          // Send mock responses based on data
          const message = JSON.parse(data);
          if (message.type === 'subscribe' && message.channel === 'user') {
            // Simulate subscription confirmation
            const subEvent = new MessageEvent('message', {
              data: JSON.stringify({
                type: 'subscription',
                channel: 'user',
                status: 'subscribed'
              })
            });
            setTimeout(() => {
              this.dispatchEvent(subEvent);
              if (this.onmessageCallback) {
                this.onmessageCallback(subEvent);
              }
            }, 100);
          }
        }

        close(code?: number, reason?: string) {
          this.readyState = 3; // CLOSED
          const closeEvent = new Event('close');
          this.dispatchEvent(closeEvent);
          if (this.oncloseCallback) {
            this.oncloseCallback(closeEvent);
          }
        }

        get readyState() {
          return this._readyState || 0; // CONNECTING
        }

        set readyState(state: number) {
          this._readyState = state;
        }

        private _readyState = 0;

        // Event handlers
        onopen = (event: Event) => {
          this.onopenCallback?.(event);
        };

        onmessage = (event: MessageEvent) => {
          this.onmessageCallback?.(event);
        };

        onclose = (event: Event) => {
          this.oncloseCallback?.(event);
        };

        onerror = (event: Event) => {
          this.onerrorCallback?.(event);
        };
      };

      // Store the mock WebSocket manager globally
      (window as any).testWebSocketManager = null;
    });
  });

  test('should handle WebSocket order fills in real application', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    // Wait for WebSocket connections to be established
    await page.waitForFunction(() => {
      return document.querySelectorAll('[data-testid="connection-status"]').length > 0;
    });

    // Wait for connection to be established
    await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")', { timeout: 10000 });

    // Create multiple order fills to test the system
    const fills = [
      createMockOrderFill({
        coin: 'BTC',
        side: 'B',
        px: 50000,
        sz: 0.1,
        tradeId: 1001
      }),
      createMockOrderFill({
        coin: 'BTC',
        side: 'B',
        px: 50100,
        sz: 0.05,
        tradeId: 1002
      }),
      createMockOrderFill({
        coin: 'ETH',
        side: 'A',
        px: 3000,
        sz: 1.0,
        tradeId: 1003
      }),
      createMockOrderFill({
        coin: 'BTC',
        side: 'A',
        px: 50200,
        sz: 0.15,
        tradeId: 1004
      })
    ];

    // Send fills through the mock WebSocket manager
    for (const fill of fills) {
      // Simulate receiving the order fill via WebSocket
      await page.evaluate((fillData) => {
        // Find all WebSocket connections and send the fill
        const websockets = (window as any).websockets || [];
        websockets.forEach((ws: any) => {
          if (ws.readyState === 1) { // OPEN
            const messageEvent = new MessageEvent('message', {
              data: JSON.stringify(fillData)
            });
            ws.dispatchEvent(messageEvent);
            if (ws.onmessage) {
              ws.onmessage(messageEvent);
            }
          }
        });
      }, fill);

      // Wait between fills
      await page.waitForTimeout(200);
    }

    // Verify positions were created and updated
    await page.waitForFunction(() => {
      const positions = document.querySelectorAll('[data-testid="positions-table"] tbody tr');
      return positions.length > 0;
    }, { timeout: 5000 });

    // Check final state
    const btcPosition = await page.locator('[data-testid="positions-table"] tbody tr:has-text("BTC")').count();
    const ethPosition = await page.locator('[data-testid="positions-table"] tbody tr:has-text("ETH")').count();

    // BTC position should be closed (bought 0.15, sold 0.15)
    expect(btcPosition).toBe(0);

    // ETH position should be short (sold 1.0)
    expect(ethPosition).toBe(1);

    if (ethPosition > 0) {
      const ethRow = page.locator('[data-testid="positions-table"] tbody tr').first();
      await expect(ethRow).toContainText('ETH');
      await expect(ethRow).toContainText('SHORT');
      await expect(ethRow).toContainText('3000.00');
      await expect(ethRow).toContainText('1.0000');
    }
  });

  test('should handle rapid order fills without UI blocking', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")', { timeout: 10000 });

    // Create rapid fills for the same position
    const rapidFills = [];
    for (let i = 0; i < 20; i++) {
      rapidFills.push(createMockOrderFill({
        coin: 'SOL',
        side: i % 2 === 0 ? 'B' : 'A', // Alternate sides
        px: 100 + i,
        sz: 1.0,
        tradeId: 2000 + i
      }));
    }

    // Send all fills rapidly
    const startTime = Date.now();
    for (const fill of rapidFills) {
      await page.evaluate((fillData) => {
        const websockets = (window as any).websockets || [];
        websockets.forEach((ws: any) => {
          if (ws.readyState === 1) {
            const messageEvent = new MessageEvent('message', {
              data: JSON.stringify(fillData)
            });
            ws.dispatchEvent(messageEvent);
            if (ws.onmessage) {
              ws.onmessage(messageEvent);
            }
          }
        });
      }, fill);
    }
    const endTime = Date.now();

    // UI should remain responsive
    expect(endTime - startTime).toBeLessThan(1000); // Should be very fast

    // Verify final position state
    await page.waitForTimeout(1000); // Allow time for processing

    const solPositions = await page.locator('[data-testid="positions-table"] tbody tr:has-text("SOL")').count();
    expect(solPositions).toBeGreaterThan(0);

    // Check that order history was populated
    const orderHistoryTab = page.locator('[data-testid="tab-Order History"]');
    await orderHistoryTab.click();
    await expect(orderHistoryTab).toHaveClass(/active/);

    const orderCount = await page.locator('[data-testid="order-history-table"] tbody tr').count();
    expect(orderCount).toBeGreaterThan(0);
  });

  test('should update account balance when positions are closed', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")', { timeout: 10000 });

    // Create a position
    const openFill = createMockOrderFill({
      coin: 'ADA',
      side: 'B',
      px: 1.0,
      sz: 100,
      tradeId: 3001
    });

    await page.evaluate((fillData) => {
      const websockets = (window as any).websockets || [];
      websockets.forEach((ws: any) => {
        if (ws.readyState === 1) {
          const messageEvent = new MessageEvent('message', {
            data: JSON.stringify(fillData)
          });
          ws.dispatchEvent(messageEvent);
          if (ws.onmessage) {
            ws.onmessage(messageEvent);
          }
        }
      });
    }, openFill);

    // Wait for position to be created
    await page.waitForFunction(() => {
      const positions = document.querySelectorAll('[data-testid="positions-table"] tbody tr');
      return positions.length > 0;
    }, { timeout: 5000 });

    // Get initial balance (should show some margin used)
    const initialBalance = await page.locator('[data-testid="account-balance"]').textContent();
    expect(initialBalance).toBeTruthy();

    // Close the position at a profit
    const closeFill = createMockOrderFill({
      coin: 'ADA',
      side: 'A',
      px: 1.2,
      sz: 100,
      tradeId: 3002
    });

    await page.evaluate((fillData) => {
      const websockets = (window as any).websockets || [];
      websockets.forEach((ws: any) => {
        if (ws.readyState === 1) {
          const messageEvent = new MessageEvent('message', {
            data: JSON.stringify(fillData)
          });
          ws.dispatchEvent(messageEvent);
          if (ws.onmessage) {
            ws.onmessage(messageEvent);
          }
        }
      });
    }, closeFill);

    // Wait for position to be closed and balance to update
    await page.waitForTimeout(1000);

    // Verify position was closed
    const finalPositions = await page.locator('[data-testid="positions-table"] tbody tr').count();
    expect(finalPositions).toBe(0);

    // Verify no "No open positions" message appears
    const noPositionsMessage = page.locator('[data-testid="positions-table"]').locator('text=No open positions');
    await expect(noPositionsMessage).not.toBeVisible();

    // Account balance should have updated (profit of 20 USD)
    const finalBalance = await page.locator('[data-testid="account-balance"]').textContent();
    expect(finalBalance).toBeTruthy();
    expect(finalBalance).not.toBe(initialBalance); // Should be different due to PnL
  });

  test('should handle WebSocket reconnection with order fills', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")', { timeout: 10000 });

    // Create initial position
    const initialFill = createMockOrderFill({
      coin: 'DOT',
      side: 'B',
      px: 10.0,
      sz: 50,
      tradeId: 4001
    });

    await page.evaluate((fillData) => {
      const websockets = (window as any).websockets || [];
      websockets.forEach((ws: any) => {
        if (ws.readyState === 1) {
          const messageEvent = new MessageEvent('message', {
            data: JSON.stringify(fillData)
          });
          ws.dispatchEvent(messageEvent);
          if (ws.onmessage) {
            ws.onmessage(messageEvent);
          }
        }
      });
    }, initialFill);

    // Wait for position
    await page.waitForFunction(() => {
      const positions = document.querySelectorAll('[data-testid="positions-table"] tbody tr');
      return positions.length > 0;
    }, { timeout: 5000 });

    // Simulate WebSocket disconnect
    await page.evaluate(() => {
      const websockets = (window as any).websockets || [];
      websockets.forEach((ws: any) => {
        ws.readyState = 3; // CLOSED
        const closeEvent = new Event('close');
        ws.dispatchEvent(closeEvent);
        if (ws.onclose) {
          ws.onclose(closeEvent);
        }
      });
    });

    // Wait for reconnection
    await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")', { timeout: 10000 });

    // Send fill after reconnection
    const postReconnectFill = createMockOrderFill({
      coin: 'DOT',
      side: 'A',
      px: 12.0,
      sz: 25,
      tradeId: 4002
    });

    await page.evaluate((fillData) => {
      const websockets = (window as any).websockets || [];
      websockets.forEach((ws: any) => {
        if (ws.readyState === 1) {
          const messageEvent = new MessageEvent('message', {
            data: JSON.stringify(fillData)
          });
          ws.dispatchEvent(messageEvent);
          if (ws.onmessage) {
            ws.onmessage(messageEvent);
          }
        }
      });
    }, postReconnectFill);

    // Verify position was updated after reconnection
    await page.waitForTimeout(1000);

    const dotPosition = await page.locator('[data-testid="positions-table"] tbody tr:has-text("DOT")');
    await expect(dotPosition).toBeVisible();

    // Size should be reduced (50 - 25 = 25)
    await expect(dotPosition).toContainText('25.0000');
  });
});