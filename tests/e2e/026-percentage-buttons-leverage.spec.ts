/**
 * E2E Test: Percentage buttons and leverage slider functionality
 * Feature: Percentage buttons and leverage slider functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Percentage Buttons and Leverage Slider', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the main trading interface to be visible
    await page.waitForSelector('[data-testid="wallet-connect-button"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Filter out expected console errors
    page.on('console', (message) => {
      const text = message.text();
      if (
        text.includes('NO_COLOR') ||
        text.includes('FORCE_COLOR') ||
        text.includes('[WebSocket] Error:') ||
        text.includes("can't establish a connection to the server at ws://")
      ) {
        // Suppress expected warnings
      }
    });
  });

  test('should handle percentage buttons correctly', async ({ page }) => {
    // Step 1: Connect wallet (optional - the buttons should work even without wallet for demo)
    // Step 2: Navigate to order entry form
    const orderForm = page.locator('.panel').filter({ hasText: /Leverage/ });
    await expect(orderForm).toBeVisible();

    // Set a price first so percentage calculations work
    const orderTypeSelect = orderForm.locator('label:has-text(\"Order Type\") + select, label:has-text(\"Order Type\") ~ select').first();
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(200);

    const priceInput = orderForm.locator('input[data-testid="order-price-input"]');
    await priceInput.fill('100');
    await page.waitForTimeout(200);

    // Step 3: Click 25% button
    const pct25Btn = orderForm.locator('button:has-text("25%")');
    await pct25Btn.click();
    await page.waitForTimeout(200);

    // Step 4: Verify size is set (should be greater than 0)
    const sizeInput = orderForm.locator('input[data-testid="order-size-input"]');
    const size25 = await sizeInput.inputValue();
    expect(parseFloat(size25)).toBeGreaterThan(0);

    // Step 5: Click 50% button
    const pct50Btn = orderForm.locator('button:has-text("50%")');
    await pct50Btn.click();
    await page.waitForTimeout(200);

    // Step 6: Verify size increased
    const size50 = await sizeInput.inputValue();
    expect(parseFloat(size50)).toBeGreaterThan(parseFloat(size25));

    // Step 7: Click 75% button
    const pct75Btn = orderForm.locator('button:has-text("75%")');
    await pct75Btn.click();
    await page.waitForTimeout(200);

    // Step 8: Verify size increased
    const size75 = await sizeInput.inputValue();
    expect(parseFloat(size75)).toBeGreaterThan(parseFloat(size50));

    // Step 9: Click 100% button
    const pct100Btn = orderForm.locator('button:has-text("100%")');
    await pct100Btn.click();
    await page.waitForTimeout(200);

    // Step 10: Verify size is at maximum
    const size100 = await sizeInput.inputValue();
    expect(parseFloat(size100)).toBeGreaterThanOrEqual(parseFloat(size75));
  });

  test('should handle leverage slider correctly', async ({ page }) => {
    // Step 11: Navigate to order entry form and locate leverage slider
    const orderForm = page.locator('.panel').filter({ hasText: /Leverage/ });
    await expect(orderForm).toBeVisible();

    const leverageSlider = orderForm.locator('input[type="range"][min="1"][max="50"]');
    await expect(leverageSlider).toBeVisible();

    // Get the leverage display text
    const leverageDisplay = orderForm.locator('span:has-text("x")').filter({ hasText: /\d+x/ });

    // Step 12: Drag slider to 5x
    await leverageSlider.evaluate((el) => {
      (el as HTMLInputElement).value = '5';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(300);

    // Step 13: Verify leverage display shows 5x
    await expect(leverageDisplay).toContainText('5x');

    // Step 14: Drag slider to 20x
    await leverageSlider.evaluate((el) => {
      (el as HTMLInputElement).value = '20';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(300);

    // Step 15: Verify leverage display shows 20x
    await expect(leverageDisplay).toContainText('20x');
  });

  test('should verify percentage buttons are all visible', async ({ page }) => {
    const orderForm = page.locator('.panel').filter({ hasText: /Leverage/ });

    // Verify all 4 percentage buttons exist
    const pct25 = orderForm.locator('button:has-text("25%")');
    const pct50 = orderForm.locator('button:has-text("50%")');
    const pct75 = orderForm.locator('button:has-text("75%")');
    const pct100 = orderForm.locator('button:has-text("100%")');

    await expect(pct25).toBeVisible();
    await expect(pct50).toBeVisible();
    await expect(pct75).toBeVisible();
    await expect(pct100).toBeVisible();
  });

  test('should verify leverage slider range', async ({ page }) => {
    const orderForm = page.locator('.panel').filter({ hasText: /Leverage/ });
    const leverageSlider = orderForm.locator('input[type="range"][min="1"][max="50"]');

    // Verify slider has correct min and max
    const minAttr = await leverageSlider.getAttribute('min');
    const maxAttr = await leverageSlider.getAttribute('max');

    expect(minAttr).toBe('1');
    expect(maxAttr).toBe('50');

    // Verify current value is within range
    const currentValue = await leverageSlider.inputValue();
    const value = parseInt(currentValue);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(50);
  });
});
