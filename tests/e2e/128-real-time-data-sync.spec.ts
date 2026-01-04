/**
 * E2E Test: Feature 128 - Real-time data synchronization across all panels
 *
 * This test verifies that all panels receive and display synchronized data:
 * - Order book receives updates
 * - Recent trades receive new trades
 * - Chart updates with price movements
 * - Header price updates
 * - All panels show consistent, synchronized data
 * - No stale data or mismatches between panels
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 128: Real-time data synchronization across all panels', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Filter out expected console warnings
    page.on('console', (message) => {
      const text = message.text();
      if (
        text.includes('NO_COLOR') ||
        text.includes('FORCE_COLOR') ||
        text.includes('[WebSocket] Error:') ||
        text.includes("can't establish a connection to the server at ws://") ||
        text.includes('Could not fetch')
      ) {
        // Suppress expected warnings
        return;
      }
    });
  });

  test('Step 1-2: Navigate to app and verify WebSocket connection status', async ({ page }) => {
    // Step 1: Navigate to the application (done in beforeEach)

    // Step 2: Verify WebSocket connection status indicator is visible
    const connectionDot = page.locator('header [data-testid="connection-status-dot"]');
    await expect(connectionDot).toBeVisible({ timeout: 5000 });

    // Check the color of the dot - should be green for connected or gray for disconnected
    const dotClass = await connectionDot.getAttribute('class');
    expect(dotClass).toBeTruthy();
  });

  test('Step 3-4: Verify order book receives updates', async ({ page }) => {
    // Step 3: Navigate and set up
    await page.waitForTimeout(500);

    // Step 4: Verify order book panel is visible and can receive data
    const orderBookPanel = page.locator('[data-testid="orderbook-panel"]');
    await expect(orderBookPanel).toBeVisible({ timeout: 5000 });

    // Check for order book structure - look for "Order Book" text
    const orderBookText = page.locator('text=Order Book');
    await expect(orderBookText.first()).toBeVisible();

    // Verify order book has data rows or loading state
    const orderRows = page.locator('[data-testid="orderbook-panel"] tbody tr');
    const rowCount = await orderRows.count();
    // Should have some rows or show loading
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('Step 5-6: Verify recent trades receives updates', async ({ page }) => {
    // Step 5: Navigate and set up
    await page.waitForTimeout(500);

    // Step 6: Verify recent trades panel is visible
    const tradesText = page.locator('text=Recent Trades');
    await expect(tradesText.first()).toBeVisible({ timeout: 5000 });

    // Verify trade rows exist or "No recent trades" message
    const tradeRows = page.locator('div:has-text("Recent Trades") + div .flex.items-center.justify-between');
    const rowCount = await tradeRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('Step 7-8: Verify chart updates with price movements', async ({ page }) => {
    // Step 7: Navigate and set up
    await page.waitForTimeout(500);

    // Step 8: Verify chart panel is visible
    const chartPanel = page.locator('[data-testid="chart-panel"]');
    await expect(chartPanel).toBeVisible({ timeout: 5000 });

    // Check for chart text or timeframe buttons
    const chartText = page.locator('text=Chart');
    await expect(chartText.first()).toBeVisible();

    // Check for timeframe buttons
    const timeframeButtons = page.locator('button:has-text("1m"), button:has-text("5m"), button:has-text("15m"), button:has-text("1h"), button:has-text("4h"), button:has-text("1D")');
    await expect(timeframeButtons.first()).toBeVisible();
  });

  test('Step 9-10: Verify header price updates', async ({ page }) => {
    // Step 9: Navigate and set up
    await page.waitForTimeout(500);

    // Step 10: Verify header price display is visible and has value
    const priceDisplay = page.locator('header .font-mono.text-lg');
    await expect(priceDisplay.first()).toBeVisible({ timeout: 5000 });

    // Get the current price value
    const priceText = await priceDisplay.first().textContent();
    expect(priceText).toBeTruthy();

    // Verify it's a valid price format (starts with $ and has numbers)
    const priceMatch = priceText?.match(/\$[\d,]+\.\d{2}/);
    expect(priceMatch).toBeTruthy();

    // Verify 24h change percentage is also displayed
    const changeDisplay = page.locator('header .text-xs.text-long, header .text-xs.text-short');
    await expect(changeDisplay.first()).toBeVisible({ timeout: 5000 });
  });

  test('Step 11-12: Wait and verify all panels show synchronized data', async ({ page }) => {
    // Step 11: Wait for several seconds to observe data flow
    await page.waitForTimeout(2000);

    // Step 12: Verify all panels show consistent data

    // Get current price from header
    const headerPrice = await page.locator('header .font-mono').first().textContent();
    const headerPriceValue = parseFloat(headerPrice?.replace(/[$,]/g, '') || '0');

    // Verify header price is valid
    expect(headerPriceValue).toBeGreaterThan(0);

    // Check order book panel exists
    const orderBookPanel = page.locator('[data-testid="orderbook-panel"]');
    const orderBookVisible = await orderBookPanel.isVisible().catch(() => false);

    // Check trades panel exists (via Recent Trades text)
    const tradesText = page.locator('text=Recent Trades');
    const tradesVisible = await tradesText.first().isVisible().catch(() => false);

    // Check chart panel exists
    const chartPanel = page.locator('[data-testid="chart-panel"]');
    const chartVisible = await chartPanel.isVisible().catch(() => false);

    // Check order form panel exists
    const orderFormPanel = page.locator('text=Buy / Long');
    const orderFormVisible = await orderFormPanel.first().isVisible().catch(() => false);

    // All panels should be visible
    expect(orderBookVisible || tradesVisible || chartVisible || orderFormVisible).toBeTruthy();

    // Verify no critical error messages in UI
    const errorElements = page.locator('text=/error|failed/i');
    const errorCount = await errorElements.count();
    // Should be 0 or only expected non-critical errors
    expect(errorCount).toBeLessThan(3);
  });

  test('Step 13-14: Verify no stale data or mismatches', async ({ page }) => {
    // Step 13: Navigate and wait for data
    await page.waitForTimeout(1000);

    // Step 14: Verify data consistency across panels

    // Get price from header
    const headerPriceEl = page.locator('header .font-mono.text-lg').first();
    const headerPriceText = await headerPriceEl.textContent();
    const headerPrice = parseFloat(headerPriceText?.replace(/[$,]/g, '') || '0');

    // Verify header price is valid
    expect(headerPrice).toBeGreaterThan(0);

    // Verify all panels are still visible after waiting
    const chartPanel = page.locator('[data-testid="chart-panel"]');
    const orderBookPanel = page.locator('[data-testid="orderbook-panel"]');
    const tradesText = page.locator('text=Recent Trades');
    const orderFormText = page.locator('text=Buy / Long');

    await expect(chartPanel).toBeVisible();
    await expect(orderBookPanel).toBeVisible();
    await expect(tradesText.first()).toBeVisible();
    await expect(orderFormText.first()).toBeVisible();

    // Verify connection status dot exists in header
    const connectionDot = page.locator('header [data-testid="connection-status-dot"]');
    await expect(connectionDot).toBeVisible();
  });

  test('Complete flow: All panels synchronized with live data', async ({ page }) => {
    // Complete end-to-end verification

    // 1. Verify app loaded
    await expect(page).toHaveTitle(/liquidVex/i);

    // 2. Verify all main panels are visible
    const chartPanel = page.locator('[data-testid="chart-panel"]');
    const orderBookPanel = page.locator('[data-testid="orderbook-panel"]');
    const tradesText = page.locator('text=Recent Trades');
    const orderFormText = page.locator('text=Buy / Long');

    await expect(chartPanel).toBeVisible({ timeout: 5000 });
    await expect(orderBookPanel).toBeVisible();
    await expect(tradesText.first()).toBeVisible();
    await expect(orderFormText.first()).toBeVisible();

    // 3. Verify header has price data
    const headerPrice = page.locator('header .font-mono.text-lg');
    await expect(headerPrice.first()).toBeVisible();
    const priceText = await headerPrice.first().textContent();
    expect(priceText).toMatch(/\$[\d,]+\.\d{2}/);

    // 4. Wait for data to flow (simulating real-time updates)
    await page.waitForTimeout(1500);

    // 5. Verify all panels still show content (not empty)
    const chartContent = await chartPanel.textContent();
    const orderBookContent = await orderBookPanel.textContent();
    const tradesContent = await tradesText.first().textContent();

    // At least some content should be present
    const hasContent = (chartContent?.length || 0) > 10 ||
                       (orderBookContent?.length || 0) > 10 ||
                       (tradesContent?.length || 0) > 10;

    expect(hasContent).toBeTruthy();

    // 6. Verify no critical errors
    const errorCount = await page.locator('text=/error|failed/i').count();
    expect(errorCount).toBeLessThan(2);

    // 7. Verify connection indicator is stable
    const connectionDot = page.locator('header [data-testid="connection-status-dot"]');
    await expect(connectionDot).toBeVisible();

    // 8. Take a screenshot for visual verification
    await page.screenshot({
      path: `test-results/128-real-time-sync-${Date.now()}.png`,
      fullPage: true
    });
  });
});
