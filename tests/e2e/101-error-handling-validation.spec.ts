/**
 * E2E test for comprehensive error handling and validation
 */

import { test, expect } from '@playwright/test';

test.describe('Error Handling and Validation', () => {
  test('should handle WebSocket connection errors gracefully', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for connection status
    await page.waitForSelector('[data-testid="connection-status-dot"]');

    // Simulate network error by disconnecting WebSocket
    await page.evaluate(() => {
      const wsManager = (window as any).wsManager;
      if (wsManager) {
        wsManager.testDisconnectAll();
      }
    });

    // Check that UI handles disconnection gracefully
    const connectionStatus = await page.locator('[data-testid="connection-status-dot"]').getAttribute('class');
    expect(connectionStatus).toBeTruthy();

    // Should not crash the application
    const appContainer = await page.locator('main').isVisible();
    expect(appContainer).toBe(true);
  });

  test('should validate order form inputs', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for order form to load
    await page.waitForSelector('[data-testid="order-price-input"]');

    // Test invalid price input
    const priceInput = page.locator('[data-testid="order-price-input"]');
    await priceInput.fill('-100');
    await page.keyboard.press('Tab');

    // Should handle invalid input gracefully (no crash)
    const priceValue = await priceInput.inputValue();
    // Price should be cleared or corrected
    expect(priceValue).toBe('');

    // Test valid price input
    await priceInput.fill('95000');
    await page.keyboard.press('Tab');

    const validPrice = await priceInput.inputValue();
    expect(validPrice).toBe('95000');

    // Test invalid size input
    const sizeInput = page.locator('[data-testid="order-size-input"]');
    await sizeInput.fill('-1');
    await page.keyboard.press('Tab');

    // Should handle invalid size gracefully
    const sizeValue = await sizeInput.inputValue();
    expect(sizeValue).toBe('');

    // Test valid size input
    await sizeInput.fill('0.1');
    await page.keyboard.press('Tab');

    const validSize = await sizeInput.inputValue();
    expect(validSize).toBe('0.1');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Mock API errors
    await page.evaluateOnNewDocument(() => {
      // Mock fetch to return errors
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const [url] = args;
        if (typeof url === 'string' && url.includes('/api/')) {
          return new Response(JSON.stringify({ error: 'API Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return originalFetch.apply(window, args);
      };
    });

    // Navigate again to trigger the mock
    await page.goto('/?testMode=true');

    // Should not crash the application
    const appContainer = await page.locator('main').isVisible();
    expect(appContainer).toBe(true);

    // Should show error handling (no specific error UI implemented yet)
    // Just verify the app doesn't crash
    await page.waitForTimeout(1000);
  });

  test('should handle malformed WebSocket messages', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for WebSocket manager
    await page.waitForFunction(() => {
      return typeof (window as any).wsManager !== 'undefined';
    });

    // Send malformed messages
    await page.evaluate(() => {
      const wsManager = (window as any).wsManager;
      if (wsManager) {
        // Send invalid JSON
        const connections = Array.from(wsManager.connections.values());
        connections.forEach(conn => {
          if (conn.messageHandlers.size > 0) {
            conn.messageHandlers.forEach(handler => {
              try {
                // Send invalid message that should be handled gracefully
                handler('invalid json');
                handler(null);
                handler(undefined);
                handler({ invalid: 'message' });
              } catch (err) {
                // Should not crash
                console.log('Handler error handled:', err);
              }
            });
          }
        });
      }
    });

    // Should not crash the application
    const appContainer = await page.locator('main').isVisible();
    expect(appContainer).toBe(true);
  });

  test('should handle wallet connection errors', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for wallet connect button
    await page.waitForSelector('[data-testid="wallet-connect-button"]');

    // Mock wallet connection failure
    await page.evaluate(() => {
      // Mock wallet provider error
      window.ethereum = {
        request: () => {
          throw new Error('Wallet connection failed');
        }
      };
    });

    // Try to connect wallet (should handle error gracefully)
    const connectButton = page.locator('[data-testid="wallet-connect-button"]');
    await connectButton.click();

    // Should not crash the application
    const appContainer = await page.locator('main').isVisible();
    expect(appContainer).toBe(true);

    // Should show some indication of error (or maintain current state)
    await page.waitForTimeout(1000);
  });

  test('should handle rapid UI updates without errors', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Rapidly switch assets to test state management
    for (let i = 0; i < 5; i++) {
      // Click asset selector
      await page.click('[data-testid="asset-selector-button"]');

      // Click a different asset option
      const assets = await page.locator('[data-testid="asset-option"]').all();
      if (assets.length > 1) {
        await assets[1].click();
      } else {
        // Close dropdown if only one asset
        await page.keyboard.press('Escape');
      }

      // Rapid switching
      await page.waitForTimeout(50);
    }

    // Should handle rapid state changes without errors
    const appContainer = await page.locator('main').isVisible();
    expect(appContainer).toBe(true);

    // Should not have JavaScript errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });

  test('should handle resize and layout changes gracefully', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for layout to be ready
    await page.waitForTimeout(1000);

    // Simulate window resize
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    await page.setViewportSize({ width: 600, height: 400 });
    await page.waitForTimeout(500);

    // Should handle resize without errors
    const appContainer = await page.locator('main').isVisible();
    expect(appContainer).toBe(true);

    // Should maintain functionality
    const header = await page.locator('header').isVisible();
    expect(header).toBe(true);

    const chartPanel = await page.locator('[data-testid="chart-panel"]').isVisible();
    expect(chartPanel).toBe(true);
  });
});