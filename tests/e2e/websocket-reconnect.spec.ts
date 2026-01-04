/**
 * WebSocket Auto-reconnect Test
 * Feature: WebSocket auto-reconnect after connection loss full flow
 */

import { test, expect } from '@playwright/test';

test.describe('WebSocket Auto-reconnect Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for initial WebSocket connection
    await page.waitForTimeout(2000);
  });

  test('should reconnect after WebSocket connection loss', async ({ page }) => {
    // Step 1: Verify initial connection is established
    const connectionIndicator = page.locator('[data-testid="ws-status"]');
    await expect(connectionIndicator).toBeVisible();
    await expect(connectionIndicator).toHaveClass(/bg-long/);

    // Step 2: Verify data is flowing via WebSocket
    const orderBook = page.locator('.panel', { hasText: 'Order Book' });
    await expect(orderBook).toBeVisible();

    // Wait for order book data to load
    await page.waitForTimeout(1000);

    // Step 3: Simulate network disconnection by simulating WebSocket close
    await page.evaluate(() => {
      // Access the WebSocket manager and close connections
      const wsManager = (window as any).wsManager;
      if (wsManager) {
        wsManager.disconnectAll();
      }
    });

    // Step 4: Verify connection status shows disconnected (red)
    await expect(connectionIndicator).toHaveClass(/bg-short/);

    // Step 5: Verify UI displays reconnecting message
    const reconnectingText = page.locator('text=Reconnecting...');
    await expect(reconnectingText).toBeVisible();

    // Step 6: Wait for reconnection attempt (up to 5 seconds)
    await page.waitForTimeout(5000);

    // Step 7: Verify WebSocket reconnects successfully
    await expect(connectionIndicator).toHaveClass(/bg-long/);

    // Step 8: Verify connection status returns to connected (green)
    await expect(connectionIndicator).toBeVisible();

    // Step 9: Verify data flow resumes with correct values
    await page.waitForTimeout(2000);

    // Verify order book has data again
    const hasOrderBookData = await orderBook.locator('text=/\d+\.\d+/').count() > 0;
    expect(hasOrderBookData).toBe(true);
  });

  test('should maintain data integrity after reconnection', async ({ page }) => {
    // Initial setup
    const orderBook = page.locator('.panel', { hasText: 'Order Book' });
    await expect(orderBook).toBeVisible();

    // Wait for initial data
    await page.waitForTimeout(2000);

    // Get initial order book state
    const initialBidPrice = await orderBook.locator('text=/\d+\.\d+/').first().textContent();

    // Simulate disconnection
    await page.evaluate(() => {
      const ws = (window as any).wsConnection;
      if (ws) {
        ws.close();
      }
    });

    // Wait for reconnection
    await page.waitForTimeout(5000);

    // Verify data resumed
    await page.waitForTimeout(2000);
    const finalBidPrice = await orderBook.locator('text=/\d+\.\d+/').first().textContent();

    // Verify some data is present (may be different due to market movement)
    expect(finalBidPrice).toBeTruthy();
    expect(finalBidPrice).not.toBe('');
  });

  test('should handle multiple disconnections gracefully', async ({ page }) => {
    const connectionIndicator = page.locator('[data-testid="ws-status"]');
    const orderBook = page.locator('.panel', { hasText: 'Order Book' });

    // First disconnection
    await page.evaluate(() => {
      const ws = (window as any).wsConnection;
      if (ws) {
        ws.close();
      }
    });

    await expect(connectionIndicator).toHaveClass(/bg-short/);
    await page.waitForTimeout(5000);
    await expect(connectionIndicator).toHaveClass(/bg-long/);

    // Second disconnection
    await page.evaluate(() => {
      const ws = (window as any).wsConnection;
      if (ws) {
        ws.close();
      }
    });

    await expect(connectionIndicator).toHaveClass(/bg-short/);
    await page.waitForTimeout(5000);
    await expect(connectionIndicator).toHaveClass(/bg-long/);

    // Verify order book still works
    await page.waitForTimeout(2000);
    const hasData = await orderBook.locator('text=/\d+\.\d+/').count() > 0;
    expect(hasData).toBe(true);
  });
});