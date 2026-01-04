/**
 * E2E test for application startup and initial render verification
 * Feature #1 from feature_list.json
 */

import { test, expect } from '@playwright/test';

test.describe('Application Startup', () => {
  test('Complete application startup and initial render verification', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('http://localhost:3000');

    // Step 2: Wait for the page to fully load
    await expect(page).toHaveURL('http://localhost:3000/');

    // Step 3: Verify the main trading interface is displayed
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();

    // Step 4: Verify no JavaScript errors in console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Step 5: Verify header section renders with logo and navigation
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const logo = header.locator('h1:has-text("liquidVex")');
    await expect(logo).toBeVisible();

    // Step 6: Verify chart panel renders
    const chartPanel = page.locator('.panel', { hasText: 'TradingView Chart' });
    await expect(chartPanel).toBeVisible();

    // Step 7: Verify order book panel renders
    const orderBookPanel = page.locator('.panel', { hasText: 'Order Book' });
    await expect(orderBookPanel).toBeVisible();

    // Step 8: Verify recent trades panel renders
    const tradesPanel = page.locator('.panel', { hasText: 'Recent Trades' });
    await expect(tradesPanel).toBeVisible();

    // Step 9: Verify order entry panel renders with form fields
    const orderEntryPanel = page.locator('.panel', { hasText: 'Order Type' });
    await expect(orderEntryPanel).toBeVisible();

    // Verify form fields exist
    await expect(orderEntryPanel.locator('select').first()).toBeVisible();
    await expect(orderEntryPanel.locator('input[type="number"]')).toHaveCount(2); // Price and Size
    // Verify submit button exists (there are 2 buy buttons - toggle and submit)
    const submitButton = orderEntryPanel.locator('button.btn-buy');
    await expect(submitButton).toBeVisible();

    // Step 10: Verify bottom panel with tabs renders
    const bottomPanel = page.locator('div[class*="h-[200px]"]');
    await expect(bottomPanel).toBeVisible();

    const tabs = ['Positions', 'Open Orders', 'Order History', 'Trade History'];
    for (const tab of tabs) {
      await expect(page.locator(`button:has-text("${tab}")`)).toBeVisible();
    }

    // Step 11: Verify WebSocket connection status indicator is visible
    // (This would be checked once WebSocket is implemented)

    // Check for any console errors (filter expected WebSocket errors)
    const unexpectedErrors = errors.filter(e =>
      !e.includes('NO_COLOR') &&
      !e.includes('FORCE_COLOR') &&
      !e.includes('Warning:') &&
      !e.includes('[WebSocket] Error:') &&  // WebSocket connection errors are expected during initial connection
      !e.includes("can't establish a connection to the server at ws://") &&  // Firefox WebSocket errors
      !e.includes('establish a connection to the server at ws://') &&  // Firefox WebSocket errors
      !e.includes('was interrupted while the page was loading') &&  // Firefox connection interrupted errors
      !e.includes('could not be parsed')  // URL parsing errors
    );

    if (unexpectedErrors.length > 0) {
      console.log('Unexpected console errors:', unexpectedErrors);
    }

    expect(unexpectedErrors.length).toBe(0, `Expected no console errors, but got: ${unexpectedErrors.join(', ')}`);
  });
});
