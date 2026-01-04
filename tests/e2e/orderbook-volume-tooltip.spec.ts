import { test, expect } from '@playwright/test';

/**
 * Test for feature: "Order book total volume at price level"
 *
 * Requirements:
 * - Step 1: Navigate to order book
 * - Step 2: Hover over price level
 * - Step 3: Verify tooltip shows detailed volume info
 * - Step 4: Verify number of orders at level
 */

test.describe('Order Book Volume Tooltip', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application with test mode
    await page.goto('http://localhost:3002?testMode=true');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Verify the main trading interface is displayed
    await expect(page.locator('.panel').first()).toBeVisible();

    // Populate order book with test data
    await page.evaluate(() => {
      const stores = (window as any).stores;
      const marketStore = stores.useMarketStore.getState();
      const orderStore = stores.useOrderStore.getState();

      // Set test order book data with multiple orders per level
      marketStore.setOrderBook({
        coin: 'BTC',
        bids: [
          { px: 43250.00, sz: 1.5, n: 3 },
          { px: 43249.00, sz: 2.8, n: 5 },
          { px: 43248.00, sz: 5.2, n: 8 },
          { px: 43247.00, sz: 3.7, n: 4 },
          { px: 43246.00, sz: 1.2, n: 2 },
        ],
        asks: [
          { px: 43251.00, sz: 1.8, n: 4 },
          { px: 43252.00, sz: 3.5, n: 6 },
          { px: 43253.00, sz: 4.2, n: 9 },
          { px: 43254.00, sz: 2.1, n: 3 },
          { px: 43255.00, sz: 0.9, n: 1 },
        ],
        timestamp: Date.now(),
      });

      // Set loading states to false to render real components
      marketStore.setIsLoadingOrderBook(false);

      // Initialize order form for click test
      orderStore.setOrderForm({
        price: '',
        size: '',
        side: 'buy',
        type: 'limit',
        leverage: 10,
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    // Wait for order book to update
    await page.waitForTimeout(100);
  });

  test('should show tooltip with detailed volume info when hovering over bid price level', async ({ page }) => {
    // Step 1: Navigate to order book
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Verify order book has bid levels
    const bidLevels = orderBookPanel.locator('[data-testid="bid-level"]');
    await expect(bidLevels.first()).toBeVisible();

    // Step 2: Hover over a bid price level
    const firstBidLevel = bidLevels.first();

    // Hover over the bid level
    await firstBidLevel.hover();

    // Step 3: Verify tooltip shows detailed volume info
    const tooltip = page.locator('.absolute.z-50').filter({ hasText: 'Total Volume:' });
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // Verify tooltip content
    await expect(tooltip).toContainText('Price:');
    await expect(tooltip).toContainText('Total Volume:');
    await expect(tooltip).toContainText('Orders:');
    await expect(tooltip).toContainText('Cumulative:');

    // Step 4: Verify number of orders at level is displayed
    await expect(tooltip).toContainText('3'); // First bid has 3 orders
  });

  test('should show tooltip with detailed volume info when hovering over ask price level', async ({ page }) => {
    // Step 1: Navigate to order book
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Verify order book has ask levels
    const askLevels = orderBookPanel.locator('[data-testid="ask-level"]');
    await expect(askLevels.first()).toBeVisible();

    // Step 2: Hover over an ask price level
    const firstAskLevel = askLevels.first();

    // Hover over the ask level
    await firstAskLevel.hover();

    // Step 3: Verify tooltip shows detailed volume info
    const tooltip = page.locator('.absolute.z-50').filter({ hasText: 'Total Volume:' });
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // Verify tooltip content
    await expect(tooltip).toContainText('Price:');
    await expect(tooltip).toContainText('Total Volume:');
    await expect(tooltip).toContainText('Orders:');
    await expect(tooltip).toContainText('Cumulative:');

    // Step 4: Verify number of orders at level is displayed
    await expect(tooltip).toContainText('4'); // First ask has 4 orders
  });

  test('should hide tooltip when mouse leaves price level', async ({ page }) => {
    // Navigate to order book
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Get first bid level
    const bidLevels = orderBookPanel.locator('[data-testid="bid-level"]');
    const firstBidLevel = bidLevels.first();

    // Hover over the bid level
    await firstBidLevel.hover();

    // Wait for tooltip to appear
    const tooltip = page.locator('.absolute.z-50').filter({ hasText: 'Total Volume:' });
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // Move mouse away from the price level
    await page.mouse.move(0, 0);

    // Verify tooltip is hidden
    await expect(tooltip).not.toBeVisible({ timeout: 2000 });
  });

  test('should show correct volume and order count for each price level', async ({ page }) => {
    // Navigate to order book
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Get bid levels
    const bidLevels = orderBookPanel.locator('[data-testid="bid-level"]');

    // Test first bid level (1.5 size, 3 orders)
    await bidLevels.nth(0).hover();
    const tooltip1 = page.locator('.absolute.z-50').filter({ hasText: 'Total Volume:' });
    await expect(tooltip1).toBeVisible({ timeout: 3000 });
    await expect(tooltip1).toContainText('1.5000'); // Total volume
    await expect(tooltip1).toContainText('3'); // Number of orders

    // Move away
    await page.mouse.move(0, 0);
    await expect(tooltip1).not.toBeVisible({ timeout: 2000 });

    // Test second bid level (2.8 size, 5 orders)
    await bidLevels.nth(1).hover();
    const tooltip2 = page.locator('.absolute.z-50').filter({ hasText: 'Total Volume:' });
    await expect(tooltip2).toBeVisible({ timeout: 3000 });
    await expect(tooltip2).toContainText('2.8000'); // Total volume
    await expect(tooltip2).toContainText('5'); // Number of orders
  });

  test('should show cumulative volume in tooltip', async ({ page }) => {
    // Navigate to order book
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Get first bid level
    const bidLevels = orderBookPanel.locator('[data-testid="bid-level"]');
    const firstBidLevel = bidLevels.first();

    // Hover over the bid level
    await firstBidLevel.hover();

    // Verify cumulative volume is shown
    const tooltip = page.locator('.absolute.z-50').filter({ hasText: 'Cumulative:' });
    await expect(tooltip).toBeVisible({ timeout: 3000 });
    await expect(tooltip).toContainText('Cumulative:');

    // First bid has cumulative = 1.5 (same as size since it's the first)
    await expect(tooltip).toContainText('1.5000');
  });

  test('should display price correctly formatted in tooltip', async ({ page }) => {
    // Navigate to order book
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Get first bid level
    const bidLevels = orderBookPanel.locator('[data-testid="bid-level"]');
    await expect(bidLevels.first()).toBeVisible();

    // Hover over the bid level
    await bidLevels.first().hover();

    // Verify price is displayed in tooltip
    const tooltip = page.locator('.absolute.z-50').filter({ hasText: 'Price:' });
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // Price should be formatted to 2 decimals (default precision) - without commas
    await expect(tooltip).toContainText('43250.00'); // First bid price
  });

  test('should maintain clickable behavior when tooltip is enabled', async ({ page }) => {
    // Navigate to order book
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Get first bid level
    const bidLevels = orderBookPanel.locator('[data-testid="bid-level"]');
    const firstBidLevel = bidLevels.first();

    // Verify the element is clickable and visible
    await expect(firstBidLevel).toBeVisible();
    await expect(firstBidLevel).toHaveAttribute('role', 'button');
    await expect(firstBidLevel).toHaveAttribute('tabIndex', '0');

    // Verify tooltip appears on hover
    await firstBidLevel.hover();
    const tooltip = page.locator('.absolute.z-50').filter({ hasText: 'Total Volume:' });
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // Verify click handler is still attached (element should be clickable)
    // The click functionality itself is tested in a separate test file (012-click-orderbook-price-populates-form.spec.ts)
    await expect(firstBidLevel).toBeEnabled();
  });
});
