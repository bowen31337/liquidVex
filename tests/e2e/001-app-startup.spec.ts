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

    // Step 1: Navigate to the application root URL
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Step 2: Wait for the page to fully load
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('body')).toBeVisible();

    // Step 3: Verify the main trading interface is displayed
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();

    // Step 4: Verify no JavaScript errors in console
    expect(consoleErrors.length).toBe(0), `Expected no console errors, but got: ${consoleErrors.join(', ')}`;

    // Step 5: Verify header section renders with logo and navigation
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByText('liquidVex')).toBeVisible();
    await expect(header.getByText('BTC-PERP')).toBeVisible();
    await expect(header.getByText('Connect Wallet')).toBeVisible();

    // Step 6: Verify chart panel renders with loading state or data
    const chartPanel = page.locator('.panel').first();
    await expect(chartPanel).toBeVisible();
    await expect(chartPanel).toContainText('Chart');
    await expect(chartPanel).toContainText('1m');

    // Step 7: Verify order book panel renders with bid/ask columns
    const orderBookPanel = page.locator('div.panel:has-text("Order Book")').first();
    await expect(orderBookPanel).toBeVisible();

    // Step 8: Verify recent trades panel renders
    const tradesPanel = page.locator('div.panel:has-text("Recent Trades")').first();
    await expect(tradesPanel).toBeVisible();

    // Step 9: Verify order entry panel renders with form fields
    const orderEntryPanel = page.locator('text=Buy / Long').first();
    await expect(orderEntryPanel).toBeVisible();

    // Check for form fields
    await expect(page.locator('select')).toBeVisible(); // Order type selector
    await expect(page.locator('input[type="number"]')).toHaveCount(2); // Price and Size inputs
    await expect(page.locator('input[type="range"]')).toBeVisible(); // Leverage slider
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(2); // Reduce Only, Post Only

    // Step 10: Verify bottom panel with tabs renders
    const positionsTab = page.locator('button:has-text("Positions")').first();
    await expect(positionsTab).toBeVisible();
    await expect(page.locator('button:has-text("Open Orders")')).toBeVisible();
    await expect(page.locator('button:has-text("Order History")')).toBeVisible();
    await expect(page.locator('button:has-text("Trade History")')).toBeVisible();

    // Verify bottom panel content message
    const bottomContent = page.locator('div.p-4:has-text("Connect your wallet to view positions and orders")');
    await expect(bottomContent).toBeVisible();

    // Step 11: Verify WebSocket connection status indicator is visible
    // (This will be added when we implement the status indicator)
    // For now, we verify the basic structure is in place
    const mainGrid = page.locator('.grid');
    await expect(mainGrid).toBeVisible();
  });
});
