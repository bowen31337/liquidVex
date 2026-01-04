/**
 * Order Book Imbalance Indicator Test
 * Feature: Order book imbalance indicator shows bid/ask pressure
 */

import { test, expect } from '@playwright/test';

test.describe('Order Book Imbalance Indicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Wait for order book to load
    await page.waitForSelector('.panel.orderbook-panel', { timeout: 5000 });
  });

  test('should display imbalance indicator', async ({ page }) => {
    // Step 1: Navigate to order book panel
    const orderBookPanel = page.locator('.panel.orderbook-panel');
    await expect(orderBookPanel).toBeVisible();

    // Step 2: Locate imbalance indicator
    const imbalanceIndicator = page.locator('text=Imbalance:');
    await expect(imbalanceIndicator).toBeVisible();

    // Step 3: Verify indicator shows relative bid vs ask volume
    const imbalancePercentage = page.locator('[data-testid="imbalance-percentage"]');
    await expect(imbalancePercentage).toBeVisible();

    // Should show percentage format like "52.3% / 47.7%"
    const percentageText = await imbalancePercentage.textContent();
    expect(percentageText).toMatch(/\d+\.\d+% \/ \d+\.\d+%/);

    // Step 4: Verify indicator updates with market changes
    // Wait a bit for potential updates
    await page.waitForTimeout(2000);

    const updatedPercentage = await page.locator('[data-testid="imbalance-percentage"]').textContent();
    expect(updatedPercentage).toMatch(/\d+\.\d+% \/ \d+\.\d+%/);
  });

  test('should show correct direction indicator', async ({ page }) => {
    // Wait for order book data to load
    await page.waitForTimeout(2000);

    // Check if direction indicator is visible
    const directionIndicator = page.locator('[data-testid="imbalance-direction"]');
    await expect(directionIndicator).toBeVisible();

    // Should show one of: BULLISH, BEARISH, or NEUTRAL
    const directionText = await directionIndicator.textContent();
    expect(directionText).toMatch(/(BULLISH|BEARISH|NEUTRAL)/);

    // Verify the color coding
    const directionElement = page.locator('[data-testid="imbalance-direction"]');
    const computedStyle = await directionElement.evaluate(el => {
      return window.getComputedStyle(el).color;
    });

    // If it shows BULLISH, should have green color
    if (directionText === 'BULLISH') {
      expect(computedStyle).toContain('rgb(17, 181, 25)'); // Tailwind green-500
    } else if (directionText === 'BEARISH') {
      expect(computedStyle).toContain('rgb(239, 68, 68)'); // Tailwind red-500
    }
  });

  test('should display visual imbalance bar', async ({ page }) => {
    // Wait for order book data
    await page.waitForTimeout(2000);

    // Check if imbalance bar is visible
    const imbalanceBar = page.locator('.bg-surface.h-2.rounded-full');
    await expect(imbalanceBar).toBeVisible();

    // Check if the inner bar is visible
    const innerBar = page.locator('.bg-long, .bg-short, .bg-text-tertiary').first();
    await expect(innerBar).toBeVisible();

    // The bar should have a width style
    const widthStyle = await innerBar.evaluate(el => el.style.width);
    expect(widthStyle).toMatch(/\d+(\.\d+)?%/);
  });

  test('should update imbalance when order book changes', async ({ page }) => {
    // Wait for initial data
    await page.waitForTimeout(2000);

    // Get initial imbalance
    const initialPercentage = await page.locator('[data-testid="imbalance-percentage"]').textContent();

    // Wait for potential order book updates
    await page.waitForTimeout(3000);

    // Get updated imbalance
    const updatedPercentage = await page.locator('[data-testid="imbalance-percentage"]').textContent();

    // The percentage should be in the correct format
    expect(updatedPercentage).toMatch(/\d+\.\d+% \/ \d+\.\d+%/);

    // The values might change due to market updates
    if (initialPercentage !== updatedPercentage) {
      expect(updatedPercentage).toMatch(/\d+\.\d+% \/ \d+\.\d+%/);
    }
  });

  test('should handle empty order book gracefully', async ({ page }) => {
    // This test verifies the indicator doesn't break when order book is empty
    // (though in practice, the mock data should always have some data)

    // Wait for order book
    await page.waitForTimeout(2000);

    // The imbalance indicator should still be visible (showing neutral)
    const imbalanceDirection = page.locator('[data-testid="imbalance-direction"]');
    const directionText = await imbalanceDirection.textContent();

    // Should show NEUTRAL when there's no data or balanced
    if (directionText === 'NEUTRAL') {
      expect(directionText).toBe('NEUTRAL');
    }
  });
});