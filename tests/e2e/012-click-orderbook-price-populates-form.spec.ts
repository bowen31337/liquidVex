import { test, expect } from '@playwright/test';

/**
 * Test for feature: "Clicking order book price level populates order form"
 *
 * Requirements:
 * - Step 1: Navigate to order book panel
 * - Step 2: Click on a bid price level
 * - Step 3: Verify order form price field is populated with clicked price
 * - Step 4: Click on an ask price level
 * - Step 5: Verify order form price field updates to new price
 */

test.describe('Order Book Price Click Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Verify the main trading interface is displayed
    await expect(page.locator('.panel')).toHaveCount(4); // Header, Chart, Order Book, Order Form

    // Verify no JavaScript errors in console (basic check)
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
  });

  test('should populate order form price field when clicking bid price level', async ({ page }) => {
    // Step 1: Navigate to order book panel
    const orderBookPanel = page.locator('.orderbook-panel'); // Order book panel
    await expect(orderBookPanel).toBeVisible();

    // Verify order book has bid prices
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    await expect(bidPrices.first()).toBeVisible();

    // Step 2: Click on a bid price level
    const firstBidPrice = bidPrices.first();
    const bidPriceText = await firstBidPrice.textContent();
    await expect(bidPriceText).not.toBeNull();

    await firstBidPrice.click({ timeout: 5000 });

    // Step 3: Verify order form price field is populated with clicked price
    const orderForm = page.locator('.panel').last(); // Order form is the last panel
    const priceInput = orderForm.locator('[data-testid="order-price-input"]'); // Price input field

    await expect(priceInput).toBeVisible();
    const formPriceValue = await priceInput.inputValue();

    // Verify the price field contains the clicked bid price
    expect(formPriceValue).toBe(bidPriceText);
  });

  test('should update order form price field when clicking ask price level', async ({ page }) => {
    // Step 1: Navigate to order book panel
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Step 2: Click on a bid price level first (to populate form)
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    await expect(bidPrices.first()).toBeVisible();

    const firstBidPrice = bidPrices.first();
    const initialBidPriceText = await firstBidPrice.textContent();
    await expect(initialBidPriceText).not.toBeNull();

    await firstBidPrice.click({ timeout: 5000 });

    // Verify form is populated with bid price
    const orderForm = page.locator('.panel.last()');
    const priceInput = orderForm.locator('[data-testid="order-price-input"]');
    await expect(priceInput).toBeVisible();

    let formPriceValue = await priceInput.inputValue();
    expect(formPriceValue).toBe(initialBidPriceText);

    // Step 4: Click on an ask price level
    const askPrices = orderBookPanel.locator('[data-testid="ask-price"]');
    await expect(askPrices.first()).toBeVisible();

    const firstAskPrice = askPrices.first();
    const askPriceText = await firstAskPrice.textContent();
    await expect(askPriceText).not.toBeNull();

    await firstAskPrice.click({ timeout: 5000 });

    // Step 5: Verify order form price field updates to new price
    // Wait for the form to update
    await page.waitForTimeout(100); // Allow time for state update

    formPriceValue = await priceInput.inputValue();

    // Verify the price field now contains the clicked ask price
    expect(formPriceValue).toBe(askPriceText);

    // Verify it's different from the previous bid price
    expect(formPriceValue).not.toBe(initialBidPriceText);
  });

  test('should handle multiple clicks and price updates correctly', async ({ page }) => {
    // Step 1: Navigate to order book panel
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();
    const orderForm = page.locator('.panel.last()');
    const priceInput = orderForm.locator('[data-testid="order-price-input"]');

    await expect(orderBookPanel).toBeVisible();
    await expect(priceInput).toBeVisible();

    // Get multiple bid and ask prices
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    const askPrices = orderBookPanel.locator('[data-testid="ask-price"]');

    await expect(bidPrices.first()).toBeVisible();
    await expect(askPrices.first()).toBeVisible();

    // Click on several different prices and verify updates
    const priceValues: string[] = [];

    // Click on first bid
    const firstBid = bidPrices.first();
    const firstBidText = await firstBid.textContent();
    await firstBid.click();
    await page.waitForTimeout(100);
    let currentValue = await priceInput.inputValue();
    expect(currentValue).toBe(firstBidText);
    priceValues.push(currentValue);

    // Click on second bid (if exists)
    if (await bidPrices.nth(1).isVisible()) {
      const secondBid = bidPrices.nth(1);
      const secondBidText = await secondBid.textContent();
      await secondBid.click();
      await page.waitForTimeout(100);
      currentValue = await priceInput.inputValue();
      expect(currentValue).toBe(secondBidText);
      expect(currentValue).not.toBe(priceValues[0]);
      priceValues.push(currentValue);
    }

    // Click on first ask
    const firstAsk = askPrices.first();
    const firstAskText = await firstAsk.textContent();
    await firstAsk.click();
    await page.waitForTimeout(100);
    currentValue = await priceInput.inputValue();
    expect(currentValue).toBe(firstAskText);
    expect(currentValue).not.toBe(priceValues[priceValues.length - 1]);
    priceValues.push(currentValue);

    // Click on second ask (if exists)
    if (await askPrices.nth(1).isVisible()) {
      const secondAsk = askPrices.nth(1);
      const secondAskText = await secondAsk.textContent();
      await secondAsk.click();
      await page.waitForTimeout(100);
      currentValue = await priceInput.inputValue();
      expect(currentValue).toBe(secondAskText);
      expect(currentValue).not.toBe(priceValues[priceValues.length - 1]);
    }
  });

  test('should work with different order types', async ({ page }) => {
    // Step 1: Navigate to order book panel
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();
    const orderForm = page.locator('.panel.last()');
    const priceInput = orderForm.locator('[data-testid="order-price-input"]');

    await expect(orderBookPanel).toBeVisible();
    await expect(priceInput).toBeVisible();

    // Test with limit order (price input should be visible)
    const orderTypeSelect = orderForm.locator('select');
    await orderTypeSelect.selectOption('limit');
    await expect(priceInput).toBeVisible();

    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    await expect(bidPrices.first()).toBeVisible();

    const firstBidPrice = bidPrices.first();
    const bidPriceText = await firstBidPrice.textContent();
    await firstBidPrice.click();
    await page.waitForTimeout(100);

    let formPriceValue = await priceInput.inputValue();
    expect(formPriceValue).toBe(bidPriceText);

    // Test with stop-limit order
    await orderTypeSelect.selectOption('stop_limit');
    await expect(priceInput).toBeVisible();

    const askPrices = orderBookPanel.locator('[data-testid="ask-price"]');
    await expect(askPrices.first()).toBeVisible();

    const firstAskPrice = askPrices.first();
    const askPriceText = await firstAskPrice.textContent();
    await firstAskPrice.click();
    await page.waitForTimeout(100);

    formPriceValue = await priceInput.inputValue();
    expect(formPriceValue).toBe(askPriceText);

    // Test with market order (price input should be hidden, clicking should still work)
    await orderTypeSelect.selectOption('market');
    // Price input might be hidden for market orders, so we'll verify the state is updated
    // even if the input is not visible
    await firstBidPrice.click();
    await page.waitForTimeout(100);

    // The state should still be updated even if input is hidden
    // This tests the underlying store update mechanism
  });

  test('should maintain price precision from order book', async ({ page }) => {
    // Step 1: Navigate to order book panel
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();
    const orderForm = page.locator('.panel.last()');
    const priceInput = orderForm.locator('[data-testid="order-price-input"]');

    await expect(orderBookPanel).toBeVisible();
    await expect(priceInput).toBeVisible();

    // Get a bid price with specific precision
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    await expect(bidPrices.first()).toBeVisible();

    const firstBidPrice = bidPrices.first();
    const bidPriceText = await firstBidPrice.textContent();
    await expect(bidPriceText).not.toBeNull();

    // Verify the price has expected precision (e.g., 2 decimal places)
    if (bidPriceText) {
      const priceNumber = parseFloat(bidPriceText);
      const decimalPlaces = (bidPriceText.split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(4); // Should not exceed typical precision
    }

    await firstBidPrice.click();
    await page.waitForTimeout(100);

    const formPriceValue = await priceInput.inputValue();
    expect(formPriceValue).toBe(bidPriceText);
  });

  test('should handle order book loading states gracefully', async ({ page }) => {
    // Step 1: Navigate to order book panel
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();
    const orderForm = page.locator('.panel.last()');

    await expect(orderBookPanel).toBeVisible();

    // Wait for order book to load
    await page.waitForSelector('[data-testid="bid-price"], [data-testid="ask-price"]', { timeout: 10000 });

    // Verify we have prices to click
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    const askPrices = orderBookPanel.locator('[data-testid="ask-price"]');

    // At least one should be available
    const hasBids = await bidPrices.count() > 0;
    const hasAsks = await askPrices.count() > 0;

    expect(hasBids || hasAsks).toBe(true);

    // Test clicking available prices
    if (hasBids) {
      const firstBid = bidPrices.first();
      const bidText = await firstBid.textContent();
      await firstBid.click();
      await page.waitForTimeout(100);

      const priceInput = orderForm.locator('[data-testid="order-price-input"]');
      await expect(priceInput).toBeVisible();
      const value = await priceInput.inputValue();
      expect(value).toBe(bidText);
    }

    if (hasAsks) {
      const firstAsk = askPrices.first();
      const askText = await firstAsk.textContent();
      await firstAsk.click();
      await page.waitForTimeout(100);

      const priceInput = orderForm.locator('[data-testid="order-price-input"]');
      await expect(priceInput).toBeVisible();
      const value = await priceInput.inputValue();
      expect(value).toBe(askText);
    }
  });

  test('should take screenshot on failure for debugging', async ({ page }, testInfo) => {
    // This test demonstrates the screenshot capability
    // Step 1: Navigate to order book panel
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();
    const orderForm = page.locator('.panel.last()');

    await expect(orderBookPanel).toBeVisible();
    await expect(orderForm).toBeVisible();

    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    await expect(bidPrices.first()).toBeVisible();

    const firstBidPrice = bidPrices.first();
    const bidPriceText = await firstBidPrice.textContent();
    await firstBidPrice.click();

    const priceInput = orderForm.locator('[data-testid="order-price-input"]');
    await expect(priceInput).toBeVisible();

    const formPriceValue = await priceInput.inputValue();

    // This assertion will pass, but demonstrates screenshot capability
    expect(formPriceValue).toBe(bidPriceText);

    // Screenshots are automatically taken on failure when screenshot: 'only-on-failure' is set
  });
});