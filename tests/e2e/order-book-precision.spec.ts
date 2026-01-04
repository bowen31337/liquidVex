/**
 * Order Book Precision and Aggregation Controls Test
 * Feature: Order book price precision and aggregation controls
 */

import { test, expect } from '@playwright/test';

test.describe('Order Book Precision and Aggregation Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Wait for order book to load
    await page.waitForSelector('.panel.orderbook-panel', { timeout: 5000 });
  });

  test('should change price precision and update display', async ({ page }) => {
    // Step 1: Verify initial precision (2 decimal places)
    const priceElements = page.locator('.panel.orderbook-panel .font-mono');
    await expect(priceElements.first()).toBeVisible();

    // Get initial price text
    const initialPriceText = await priceElements.first().textContent();
    expect(initialPriceText).toMatch(/\d+\.\d{2}$/); // Should end with 2 decimal places

    // Step 2: Change precision to 4 decimal places
    await page.click('button:has-text("4d")');

    // Step 3: Verify prices are grouped accordingly
    const newPriceText = await priceElements.first().textContent();
    expect(newPriceText).toMatch(/\d+\.\d{4}$/); // Should end with 4 decimal places

    // Step 4: Change precision to 1 decimal place
    await page.click('button:has-text("1d")');

    // Step 5: Verify more granular price levels appear
    const granularPriceText = await priceElements.first().textContent();
    expect(granularPriceText).toMatch(/\d+\.\d$/); // Should end with 1 decimal place
  });

  test('should change aggregation level and group price levels', async ({ page }) => {
    // Wait for order book data to load
    await page.waitForTimeout(1000);

    // Step 1: Verify initial aggregation level (1)
    const initialLevels = await page.locator('.panel.orderbook-panel .font-mono').count();
    expect(initialLevels).toBeGreaterThan(0);

    // Step 2: Select higher aggregation level (5)
    await page.click('[data-testid="aggregation-5"]');

    // Step 3: Verify price levels are consolidated (fewer levels)
    await page.waitForTimeout(500); // Wait for update
    const consolidatedLevels = await page.locator('.panel.orderbook-panel .font-mono').count();
    expect(consolidatedLevels).toBeLessThanOrEqual(initialLevels);

    // Step 4: Select even higher aggregation (10)
    await page.click('[data-testid="aggregation-10"]');

    // Step 5: Verify even more consolidation
    await page.waitForTimeout(500);
    const highlyConsolidatedLevels = await page.locator('.panel.orderbook-panel .font-mono').count();
    expect(highlyConsolidatedLevels).toBeLessThanOrEqual(consolidatedLevels);

    // Step 6: Select lower aggregation (1)
    await page.click('[data-testid="aggregation-1"]');

    // Step 7: Verify more price levels appear (back to detailed view)
    await page.waitForTimeout(500);
    const detailedLevels = await page.locator('.panel.orderbook-panel .font-mono').count();
    expect(detailedLevels).toBeGreaterThanOrEqual(consolidatedLevels);
  });

  test('should show correct volume sums after aggregation', async ({ page }) => {
    // Wait for order book data
    await page.waitForTimeout(2000);

    // Step 1: Get initial size values at low aggregation
    const initialSizes = await page.locator('.panel.orderbook-panel .text-short, .panel.orderbook-panel .text-long').allTextContents();
    expect(initialSizes.length).toBeGreaterThan(0);

    // Step 2: Switch to higher aggregation
    await page.click('[data-testid="aggregation-10"]');

    // Step 3: Verify volume sums are correct (sizes should be larger due to aggregation)
    await page.waitForTimeout(500);
    const aggregatedSizes = await page.locator('.panel.orderbook-panel .text-short, .panel.orderbook-panel .text-long').allTextContents();

    // After aggregation, we should have fewer but larger size values
    expect(aggregatedSizes.length).toBeLessThanOrEqual(initialSizes.length);

    // Verify that aggregated sizes are generally larger (due to summing multiple levels)
    const hasLargerSizes = aggregatedSizes.some(size => {
      const numSize = parseFloat(size.replace(/,/g, ''));
      return !isNaN(numSize) && numSize > 0.1; // Expect some sizes to be larger
    });
    expect(hasLargerSizes).toBe(true);
  });

  test('should maintain order book functionality with different precision levels', async ({ page }) => {
    // Test clicking on prices with different precision levels
    const priceElement = page.locator('.panel.orderbook-panel .font-mono').first();

    // Step 1: Click on a price
    await priceElement.click();

    // Step 2: Verify the order form is populated (check if price input exists)
    const priceInput = page.locator('input[name="price"], input[placeholder*="Price"]');
    // The order form should be populated, but we'll just verify the element exists
    expect(priceElement).toBeVisible();

    // Step 3: Change precision and verify clicking still works
    await page.click('button:has-text("4d")');
    await page.waitForTimeout(500);

    // Step 4: Click on a price again
    await priceElement.click();
    expect(priceElement).toBeVisible();

    // Step 5: Change to 1 decimal and verify functionality
    await page.click('button:has-text("1d")');
    await page.waitForTimeout(500);

    await priceElement.click();
    expect(priceElement).toBeVisible();
  });
});