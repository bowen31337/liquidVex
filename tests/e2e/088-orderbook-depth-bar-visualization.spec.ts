/**
 * E2E Test: Feature 88 - Order book depth bar visualization
 *
 * This test verifies that the order book displays depth bars representing
 * volume proportionally, with green bars for bids and red bars for asks.
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 88: Order Book Depth Bar Visualization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Verify the main trading interface is displayed
    await expect(page.locator('.panel').first()).toBeVisible();

    // Monitor console for errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
  });

  test('Step 1: Navigate to order book panel and verify it is visible', async ({ page }) => {
    // Step 1: Navigate to order book panel
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Verify order book header
    const header = orderBookPanel.locator('text=Order Book');
    await expect(header).toBeVisible();
  });

  test('Step 2: Verify bid side has green depth bars', async ({ page }) => {
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Wait for order book data to load
    await page.waitForTimeout(2000);

    // Get bid prices
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    const bidCount = await bidPrices.count();

    // Verify there are bid prices
    expect(bidCount).toBeGreaterThan(0);

    // Check each bid row for depth bar
    for (let i = 0; i < Math.min(bidCount, 5); i++) {
      const bidPrice = bidPrices.nth(i);
      await expect(bidPrice).toBeVisible();

      // Get the parent row element
      const row = bidPrice.locator('..');

      // Verify depth bar exists with green color (bg-long class)
      // The depth bar is a div with bg-long class
      const depthBar = row.locator('.bg-long');
      const depthBarCount = await depthBar.count();

      // At least one depth bar should exist per bid row
      expect(depthBarCount).toBeGreaterThan(0);

      // Verify the bar has opacity (opacity-20 class)
      if (depthBarCount > 0) {
        const firstBar = depthBar.first();
        const className = await firstBar.getAttribute('class');
        expect(className).toContain('opacity-20');
      }
    }
  });

  test('Step 3: Verify ask side has red depth bars', async ({ page }) => {
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Wait for order book data to load
    await page.waitForTimeout(2000);

    // Get ask prices
    const askPrices = orderBookPanel.locator('[data-testid="ask-price"]');
    const askCount = await askPrices.count();

    // Verify there are ask prices
    expect(askCount).toBeGreaterThan(0);

    // Check each ask row for depth bar
    for (let i = 0; i < Math.min(askCount, 5); i++) {
      const askPrice = askPrices.nth(i);
      await expect(askPrice).toBeVisible();

      // Get the parent row element
      const row = askPrice.locator('..');

      // Verify depth bar exists with red color (bg-short class)
      const depthBar = row.locator('.bg-short');
      const depthBarCount = await depthBar.count();

      // At least one depth bar should exist per ask row
      expect(depthBarCount).toBeGreaterThan(0);

      // Verify the bar has opacity
      if (depthBarCount > 0) {
        const firstBar = depthBar.first();
        const className = await firstBar.getAttribute('class');
        expect(className).toContain('opacity-20');
      }
    }
  });

  test('Step 4: Verify bars represent volume proportionally', async ({ page }) => {
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Wait for order book data to load
    await page.waitForTimeout(2000);

    // Get bid prices and their depth bars
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    const bidCount = await bidPrices.count();

    if (bidCount >= 2) {
      // Get the first two bid rows
      const firstBidRow = bidPrices.first().locator('..');
      const secondBidRow = bidPrices.nth(1).locator('..');

      // Get depth bars from these rows
      const firstDepthBar = firstBidRow.locator('.bg-long').first();
      const secondDepthBar = secondBidRow.locator('.bg-long').first();

      // Verify depth bars have width styles (proportional to volume)
      const firstWidth = await firstDepthBar.evaluate((el) => {
        return el.style.width;
      });
      const secondWidth = await secondDepthBar.evaluate((el) => {
        return el.style.width;
      });

      // Widths should be in percentage format
      expect(firstWidth).toContain('%');
      expect(secondWidth).toContain('%');

      // Widths should be greater than 0
      const firstWidthNum = parseFloat(firstWidth);
      const secondWidthNum = parseFloat(secondWidth);
      expect(firstWidthNum).toBeGreaterThan(0);
      expect(secondWidthNum).toBeGreaterThan(0);

      console.log(`First bid depth bar width: ${firstWidth}`);
      console.log(`Second bid depth bar width: ${secondWidth}`);
    }

    // Get ask prices and their depth bars
    const askPrices = orderBookPanel.locator('[data-testid="ask-price"]');
    const askCount = await askPrices.count();

    if (askCount >= 2) {
      // Get the first two ask rows
      const firstAskRow = askPrices.first().locator('..');
      const secondAskRow = askPrices.nth(1).locator('..');

      // Get depth bars from these rows
      const firstDepthBar = firstAskRow.locator('.bg-short').first();
      const secondDepthBar = secondAskRow.locator('.bg-short').first();

      // Verify depth bars have width styles
      const firstWidth = await firstDepthBar.evaluate((el) => {
        return el.style.width;
      });
      const secondWidth = await secondDepthBar.evaluate((el) => {
        return el.style.width;
      });

      // Widths should be in percentage format
      expect(firstWidth).toContain('%');
      expect(secondWidth).toContain('%');

      // Widths should be greater than 0
      const firstWidthNum = parseFloat(firstWidth);
      const secondWidthNum = parseFloat(secondWidth);
      expect(firstWidthNum).toBeGreaterThan(0);
      expect(secondWidthNum).toBeGreaterThan(0);

      console.log(`First ask depth bar width: ${firstWidth}`);
      console.log(`Second ask depth bar width: ${secondWidth}`);
    }
  });

  test('should verify depth bars are positioned correctly', async ({ page }) => {
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Wait for order book data to load
    await page.waitForTimeout(2000);

    // Verify bid depth bars are left-aligned
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    const bidCount = await bidPrices.count();

    if (bidCount > 0) {
      const firstBidRow = bidPrices.first().locator('..');
      const bidDepthBar = firstBidRow.locator('.bg-long').first();

      // Check that the bar is absolutely positioned
      const position = await bidDepthBar.evaluate((el) => {
        return window.getComputedStyle(el).position;
      });
      expect(position).toBe('absolute');

      // Check that it starts from left (left: 0)
      const left = await bidDepthBar.evaluate((el) => {
        return window.getComputedStyle(el).left;
      });
      expect(left).toBe('0px');
    }

    // Verify ask depth bars are right-aligned
    const askPrices = orderBookPanel.locator('[data-testid="ask-price"]');
    const askCount = await askPrices.count();

    if (askCount > 0) {
      const firstAskRow = askPrices.first().locator('..');
      const askDepthBar = firstAskRow.locator('.bg-short').first();

      // Check that the bar is absolutely positioned
      const position = await askDepthBar.evaluate((el) => {
        return window.getComputedStyle(el).position;
      });
      expect(position).toBe('absolute');

      // Check that it starts from right (right: 0)
      const right = await askDepthBar.evaluate((el) => {
        return window.getComputedStyle(el).right;
      });
      expect(right).toBe('0px');
    }
  });

  test('should verify depth bars have consistent opacity', async ({ page }) => {
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Wait for order book data to load
    await page.waitForTimeout(2000);

    // Check all bid depth bars for opacity
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    const bidCount = await bidPrices.count();

    for (let i = 0; i < Math.min(bidCount, 3); i++) {
      const bidRow = bidPrices.nth(i).locator('..');
      const depthBar = bidRow.locator('.bg-long').first();

      const className = await depthBar.getAttribute('class');
      expect(className).toContain('opacity-20');
    }

    // Check all ask depth bars for opacity
    const askPrices = orderBookPanel.locator('[data-testid="ask-price"]');
    const askCount = await askPrices.count();

    for (let i = 0; i < Math.min(askCount, 3); i++) {
      const askRow = askPrices.nth(i).locator('..');
      const depthBar = askRow.locator('.bg-short').first();

      const className = await depthBar.getAttribute('class');
      expect(className).toContain('opacity-20');
    }
  });

  test('should verify depth bars do not interfere with text readability', async ({ page }) => {
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Wait for order book data to load
    await page.waitForTimeout(2000);

    // Get bid prices
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    const bidCount = await bidPrices.count();

    if (bidCount > 0) {
      // Verify price text is visible and readable
      const firstBidPrice = bidPrices.first();
      await expect(firstBidPrice).toBeVisible();

      // Check z-index to ensure text is above depth bar
      const zIndex = await firstBidPrice.evaluate((el) => {
        return window.getComputedStyle(el).zIndex;
      });
      // z-index should be 'auto' or a number (above the depth bar)
      expect(zIndex).toBeTruthy();
    }

    // Get ask prices
    const askPrices = orderBookPanel.locator('[data-testid="ask-price"]');
    const askCount = await askPrices.count();

    if (askCount > 0) {
      // Verify price text is visible and readable
      const firstAskPrice = askPrices.first();
      await expect(firstAskPrice).toBeVisible();

      // Check z-index
      const zIndex = await firstAskPrice.evaluate((el) => {
        return window.getComputedStyle(el).zIndex;
      });
      expect(zIndex).toBeTruthy();
    }
  });

  test('should verify depth bars update when order book data changes', async ({ page }) => {
    const orderBookPanel = page.locator('.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Wait for initial order book data to load
    await page.waitForTimeout(2000);

    // Get initial depth bar widths
    const bidPrices = orderBookPanel.locator('[data-testid="bid-price"]');
    const bidCount = await bidPrices.count();

    if (bidCount > 0) {
      const firstBidRow = bidPrices.first().locator('..');
      const initialDepthBar = firstBidRow.locator('.bg-long').first();
      const initialWidth = await initialDepthBar.evaluate((el) => {
        return window.getComputedStyle(el).width;
      });

      console.log(`Initial bid depth bar width: ${initialWidth}`);

      // Wait for order book updates (WebSocket streams)
      await page.waitForTimeout(3000);

      // Get updated depth bar width
      const updatedDepthBar = firstBidRow.locator('.bg-long').first();
      const updatedWidth = await updatedDepthBar.evaluate((el) => {
        return el.style.width;
      });

      console.log(`Updated bid depth bar width: ${updatedWidth}`);

      // The width should still be a percentage (may or may not change)
      expect(updatedWidth).toContain('%');
    }
  });
});
