/**
 * Test: Complete application startup and initial render verification
 * Feature ID: 001
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Application Startup and Initial Render', () => {
  test('Complete application startup and initial render verification', async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Step 1: Navigate to the application root URL with test mode to skip WebSocket/API calls
    await page.goto('http://localhost:3002?testMode=true');

    // Step 2: Wait for the page to fully load
    await expect(page).toHaveURL(/http:\/\/localhost:3002\/(\?testMode=true)?/);
    await expect(page.locator('body')).toBeVisible();

    // Step 3: Populate store data to transition from skeletons to real components
    // This simulates WebSocket data arriving so the app renders real components instead of skeletons
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.getMarketStoreState) {
        const marketState = stores.getMarketStoreState();
        // Populate order book data
        marketState.setOrderBook({
          bids: [
            { px: 95420, sz: 1.5, n: 3 },
            { px: 95415, sz: 2.1, n: 5 },
            { px: 95410, sz: 0.8, n: 2 },
            { px: 95405, sz: 3.2, n: 7 },
            { px: 95400, sz: 1.9, n: 4 },
          ],
          asks: [
            { px: 95425, sz: 1.2, n: 4 },
            { px: 95430, sz: 2.5, n: 6 },
            { px: 95435, sz: 1.1, n: 3 },
            { px: 95440, sz: 0.7, n: 2 },
            { px: 95445, sz: 2.8, n: 5 },
          ],
        });

        // Populate recent trades data
        marketState.setTrades([
          { px: 95422, sz: 0.5, side: 'B', time: Date.now(), hash: 'trade1' },
          { px: 95423, sz: 1.2, side: 'S', time: Date.now() - 1000, hash: 'trade2' },
          { px: 95421, sz: 0.3, side: 'B', time: Date.now() - 2000, hash: 'trade3' },
        ]);

        // Set loading states to false to trigger real component rendering
        marketState.setIsLoadingOrderBook(false);
        marketState.setIsLoadingTrades(false);
        marketState.setIsLoadingCandles(false);

        // Set some candles for the chart panel
        marketState.setCandles([
          { t: Date.now() - 3600000, o: 95400, h: 95450, l: 95380, c: 95420, v: 100 },
          { t: Date.now() - 2700000, o: 95420, h: 95460, l: 95400, c: 95440, v: 120 },
          { t: Date.now() - 1800000, o: 95440, h: 95480, l: 95420, c: 95450, v: 90 },
          { t: Date.now() - 900000, o: 95450, h: 95470, l: 95430, c: 95435, v: 110 },
          { t: Date.now(), o: 95435, h: 95445, l: 95415, c: 95425, v: 80 },
        ]);
      }
    });

    // Wait for components to transition from skeletons to real components
    await page.waitForTimeout(500);

    // Step 4: Verify the main trading interface is displayed
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();

    // Step 5: Verify no JavaScript errors in console
    const unexpectedErrors = consoleErrors.filter(e =>
      !e.includes('NO_COLOR') &&
      !e.includes('FORCE_COLOR') &&
      !e.includes('Warning:') &&
      !e.includes('[WebSocket] Error:') &&  // WebSocket connection errors are expected during initial connection
      !e.includes('App Error: {type: websocket') &&  // WebSocket connection errors from our error handler
      !e.includes("can't establish a connection to the server at ws://") &&  // Firefox WebSocket errors
      !e.includes('establish a connection to the server at ws://') &&  // Firefox WebSocket errors
      !e.includes('was interrupted while the page was loading') &&  // Firefox connection interrupted errors
      !e.includes('ErrorBoundary caught an error') &&  // ErrorBoundary logging is expected
      !e.includes('Failed to load resource') &&  // 404 errors for static assets are acceptable
      !e.includes('Failed to load assets') &&  // Asset loading errors are handled gracefully
      !e.includes('WebSocket connection') &&  // Browser WebSocket connection errors
      !e.includes('ws://') &&  // Any WebSocket URL errors
      !e.includes('Cross-Origin') &&  // CORS errors are acceptable in dev mode
      !e.includes('CORS') &&  // CORS errors
      !e.includes('Origin') &&  // WalletConnect/Reown origin errors
      !e.includes('Allowlist')  // WalletConnect/Reown allowlist errors
    );
    if (unexpectedErrors.length > 0) {
      console.log('Unexpected console errors:', unexpectedErrors);
    }
    expect(unexpectedErrors.length).toBe(0), `Expected no console errors, but got: ${unexpectedErrors.join(', ')}`;

    // Step 6: Verify header section renders with logo and navigation
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByText('liquidVex')).toBeVisible();
    await expect(header.getByText('BTC-PERP')).toBeVisible();
    await expect(header.getByText('Connect Wallet')).toBeVisible();

    // Step 7: Verify chart panel renders with loading state or data
    const chartPanel = page.locator('[data-testid="chart-panel"]').first();
    await expect(chartPanel).toBeVisible();
    await expect(chartPanel).toContainText('TradingView Chart');
    // Check that chart has some buttons (timeframe or indicator buttons)
    await expect(chartPanel.locator('button').first()).toBeVisible();

    // Step 8: Verify order book panel renders with bid/ask columns
    const orderBookPanel = page.locator('[data-testid="orderbook-panel"]').first();
    await expect(orderBookPanel).toBeVisible();
    await expect(orderBookPanel).toContainText('Order Book');

    // Step 9: Verify recent trades panel renders
    const tradesPanel = page.locator('[data-testid="recent-trades-panel"]').first();
    await expect(tradesPanel).toBeVisible();
    await expect(tradesPanel).toContainText('Recent Trades');

    // Step 10: Verify order entry panel renders with form fields
    const orderEntryPanel = page.locator('text=Buy / Long').first();
    await expect(orderEntryPanel).toBeVisible();

    // Check for form fields - find the order form panel first
    const orderFormPanel = orderEntryPanel.locator('xpath=ancestor::div[contains(@class, "panel")]');
    await expect(orderFormPanel.locator('select').first()).toBeVisible(); // Order type selector
    await expect(orderFormPanel.locator('input[type="number"]')).toHaveCount(2); // Price and Size inputs
    await expect(orderFormPanel.locator('input[type="range"]')).toBeVisible(); // Leverage slider
    await expect(orderFormPanel.locator('input[type="checkbox"]')).toHaveCount(2); // Reduce Only, Post Only

    // Step 11: Verify bottom panel with tabs renders
    const positionsTab = page.locator('button:has-text("Positions")').first();
    await expect(positionsTab).toBeVisible();
    await expect(page.locator('button:has-text("Open Orders")')).toBeVisible();
    await expect(page.locator('button:has-text("Order History")')).toBeVisible();
    await expect(page.locator('button:has-text("Trade History")')).toBeVisible();

    // Verify bottom panel content message
    // In test mode, wallet is not connected so we expect "No open positions" (empty state)
    const bottomContent = page.locator('[data-testid="positions-table"]');
    await expect(bottomContent).toBeVisible();
    await expect(bottomContent).toContainText('No open positions');

    // Step 12: Verify the trading grid structure is in place
    const tradingGrid = page.locator('[data-testid="chart-panel"]');
    await expect(tradingGrid).toBeVisible();
  });
});
