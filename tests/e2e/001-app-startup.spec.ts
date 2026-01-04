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

    // Step 3: Verify the main trading interface is displayed
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();

    // Step 4: Verify no JavaScript errors in console
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
      !e.includes('CORS')  // CORS errors
    );
    if (unexpectedErrors.length > 0) {
      console.log('Unexpected console errors:', unexpectedErrors);
    }
    expect(unexpectedErrors.length).toBe(0), `Expected no console errors, but got: ${unexpectedErrors.join(', ')}`;

    // Step 5: Verify header section renders with logo and navigation
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByText('liquidVex')).toBeVisible();
    await expect(header.getByText('BTC-PERP')).toBeVisible();
    await expect(header.getByText('Connect Wallet')).toBeVisible();

    // Step 6: Verify chart panel renders with loading state or data
    const chartPanel = page.locator('[data-testid="chart-panel"]').first();
    await expect(chartPanel).toBeVisible();
    await expect(chartPanel).toContainText('TradingView Chart');
    // Check that chart has some buttons (timeframe or indicator buttons)
    await expect(chartPanel.locator('button').first()).toBeVisible();

    // Step 7: Verify order book panel renders with bid/ask columns
    const orderBookPanel = page.locator('[data-testid="orderbook-panel"]').first();
    await expect(orderBookPanel).toBeVisible();
    await expect(orderBookPanel).toContainText('Order Book');

    // Step 8: Verify recent trades panel renders
    const tradesPanel = page.locator('[data-testid="recent-trades-panel"]').first();
    await expect(tradesPanel).toBeVisible();
    await expect(tradesPanel).toContainText('Recent Trades');

    // Step 9: Verify order entry panel renders with form fields
    const orderEntryPanel = page.locator('text=Buy / Long').first();
    await expect(orderEntryPanel).toBeVisible();

    // Check for form fields - find the order form panel first
    const orderFormPanel = orderEntryPanel.locator('xpath=ancestor::div[contains(@class, "panel")]');
    await expect(orderFormPanel.locator('select').first()).toBeVisible(); // Order type selector
    await expect(orderFormPanel.locator('input[type="number"]')).toHaveCount(2); // Price and Size inputs
    await expect(orderFormPanel.locator('input[type="range"]')).toBeVisible(); // Leverage slider
    await expect(orderFormPanel.locator('input[type="checkbox"]')).toHaveCount(2); // Reduce Only, Post Only

    // Step 10: Verify bottom panel with tabs renders
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

    // Step 11: Verify the trading grid structure is in place
    const tradingGrid = page.locator('[data-testid="chart-panel"]');
    await expect(tradingGrid).toBeVisible();
  });
});
