/**
 * E2E Test: Asset-specific validation features
 * Features 132-135:
 * - 132: Maximum leverage limits enforced per asset
 * - 133: Minimum order size validation
 * - 134: Price decimal precision per asset
 * - 135: Size decimal precision per asset
 */

import { test, expect } from '@playwright/test';

test.describe('Asset-Specific Validation Features (132-135)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application with test mode enabled
    await page.goto('/?testMode=true');

    // Wait for the main trading interface to be visible
    await page.waitForSelector('[data-testid="order-entry-panel"]', { timeout: 10000 });
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

  test('Feature 132: Maximum leverage limits enforced per asset', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    await expect(orderForm).toBeVisible();

    // Wait for asset info to be loaded (leverage slider shows max value)
    const maxLeverageText = orderForm.locator('div.text-xs.text-text-tertiary:has-text("Max:")');
    await expect(maxLeverageText).toBeVisible({ timeout: 15000 });

    // Get the max leverage value from the UI (should show "Max: 50x" for BTC)
    const maxLeverageTextContent = await maxLeverageText.textContent();
    const maxLeverage = parseInt(maxLeverageTextContent?.match(/Max: (\d+)x/)?.[1] || '50');

    // Get the leverage slider
    const leverageSlider = orderForm.locator('input[type="range"][aria-label="Leverage multiplier"]');
    await expect(leverageSlider).toBeVisible();

    // Verify the slider's max attribute is set correctly
    const sliderMax = await leverageSlider.getAttribute('max');
    expect(parseInt(sliderMax || '50')).toBe(maxLeverage);

    // Try to set leverage above max (should be prevented by slider max attribute)
    await leverageSlider.evaluate((el: HTMLInputElement, max) => {
      // Try to set a value higher than max
      el.value = (max + 10).toString();
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, maxLeverage);

    // Verify the leverage value doesn't exceed max
    const leverageValueSpan = orderForm.locator('span.text-text-primary:has-text("x")');
    const leverageText = await leverageValueSpan.textContent();
    const currentLeverage = parseInt(leverageText?.replace('x', '') || '0');
    expect(currentLeverage).toBeLessThanOrEqual(maxLeverage);

    // Test with leverage at exactly max
    await leverageSlider.evaluate((el: HTMLInputElement, max) => {
      el.value = max.toString();
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, maxLeverage);
    await page.waitForTimeout(200);
    expect(await leverageValueSpan.textContent()).toBe(`${maxLeverage}x`);
  });

  test('Feature 133: Minimum order size validation', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    await expect(orderForm).toBeVisible();

    // Wait for asset info to be loaded
    const maxLeverageText = orderForm.locator('div.text-xs.text-text-tertiary:has-text("Max:")');
    await expect(maxLeverageText).toBeVisible({ timeout: 15000 });

    // Get the size input
    const sizeInput = orderForm.locator('input[data-testid="order-size-input"]');
    await expect(sizeInput).toBeVisible();

    // Get the submit button
    const submitButton = orderForm.locator('button[data-testid="order-submit-button"]');
    await expect(submitButton).toBeVisible();

    // For BTC, minimum size is 0.001
    // Try to enter a size below minimum
    await sizeInput.fill('0.0001');
    await page.waitForTimeout(200);

    // Click submit
    await submitButton.click();
    await page.waitForTimeout(500);

    // Verify error message appears
    const errorElement = orderForm.locator('div[data-testid="order-error"]');
    await expect(errorElement).toBeVisible();
    const errorText = await errorElement.textContent();
    expect(errorText).toContain('below minimum');
    expect(errorText).toContain('0.001');

    // Now enter a valid size at minimum
    await sizeInput.clear();
    await sizeInput.fill('0.001');
    await page.waitForTimeout(200);

    // Clear the error by clicking the input
    await sizeInput.click();
    await page.waitForTimeout(200);

    // Verify error is cleared
    const errorVisible = await errorElement.isVisible().catch(() => false);
    expect(errorVisible).toBe(false);

    // Test with size above minimum
    await sizeInput.clear();
    await sizeInput.fill('0.5');
    await page.waitForTimeout(200);

    // Should be able to submit (in test mode)
    // Just verify no error about minimum size
    await submitButton.click();
    await page.waitForTimeout(500);
    const errorTextAfter = await errorElement.textContent().catch(() => '');
    expect(errorTextAfter).not.toContain('below minimum');
  });

  test('Feature 134: Price decimal precision per asset', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    await expect(orderForm).toBeVisible();

    // Wait for asset info to be loaded
    const maxLeverageText = orderForm.locator('div.text-xs.text-text-tertiary:has-text("Max:")');
    await expect(maxLeverageText).toBeVisible({ timeout: 15000 });

    // Select Limit order type
    const orderTypeSelect = orderForm.locator('label:has-text("Order Type") + select, label:has-text("Order Type") ~ select').first();
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);

    // Get the price input
    const priceInput = orderForm.locator('input[data-testid="order-price-input"]');
    await expect(priceInput).toBeVisible();

    // For BTC, price decimals should be 1
    // Enter a price with more than 1 decimal
    await priceInput.fill('50000.55');
    await page.waitForTimeout(200);

    // The input should truncate to 1 decimal (50000.5)
    const value = await priceInput.inputValue();
    expect(value).toBe('50000.5');

    // Try with 2 decimals - should truncate to 1
    await priceInput.fill('50000.99');
    await page.waitForTimeout(200);
    const value2 = await priceInput.inputValue();
    expect(value2).toBe('50000.9');

    // Verify increment/decrement buttons use correct precision
    const incrementBtn = orderForm.locator('button:has-text("+")').first();
    await priceInput.fill('50000.0');
    await incrementBtn.click();
    await page.waitForTimeout(200);
    const valueAfterIncrement = await priceInput.inputValue();
    // Should be 50000.5 (increment by 0.5)
    expect(valueAfterIncrement).toBe('50000.5');
  });

  test('Feature 135: Size decimal precision per asset', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    await expect(orderForm).toBeVisible();

    // Wait for asset info to be loaded
    const maxLeverageText = orderForm.locator('div.text-xs.text-text-tertiary:has-text("Max:")');
    await expect(maxLeverageText).toBeVisible({ timeout: 15000 });

    // Get the size input
    const sizeInput = orderForm.locator('input[data-testid="order-size-input"]');
    await expect(sizeInput).toBeVisible();

    // For BTC, size decimals should be 4
    // Enter a size with more than 4 decimals
    await sizeInput.fill('0.12345678');
    await page.waitForTimeout(200);

    // The input should truncate to 4 decimals
    const value = await sizeInput.inputValue();
    expect(value).toBe('0.1234');

    // Try with exactly 4 decimals - should remain unchanged
    await sizeInput.fill('0.5678');
    await page.waitForTimeout(200);
    const value2 = await sizeInput.inputValue();
    expect(value2).toBe('0.5678');

    // Try with 3 decimals - should remain unchanged
    await sizeInput.fill('0.123');
    await page.waitForTimeout(200);
    const value3 = await sizeInput.inputValue();
    expect(value3).toBe('0.123');

    // Test percentage buttons use correct precision
    // First need to enter a price for percentage calculation
    const orderTypeSelect = orderForm.locator('label:has-text("Order Type") + select, label:has-text("Order Type") ~ select').first();
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);

    const priceInput = orderForm.locator('input[data-testid="order-price-input"]');
    await priceInput.fill('50000');
    await page.waitForTimeout(200);

    // Click 25% button
    const pct25Btn = orderForm.locator('button:has-text("25%")');
    await pct25Btn.click();
    await page.waitForTimeout(200);

    // Verify size has correct decimal precision
    const sizeValue = await sizeInput.inputValue();
    const decimalPlaces = sizeValue.includes('.') ? sizeValue.split('.')[1].length : 0;
    expect(decimalPlaces).toBeLessThanOrEqual(4);
  });

  test('Combined: All validation features work together', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    await expect(orderForm).toBeVisible();

    // Wait for asset info to be loaded
    const maxLeverageText = orderForm.locator('div.text-xs.text-text-tertiary:has-text("Max:")');
    await expect(maxLeverageText).toBeVisible({ timeout: 15000 });

    // Set up a valid order
    const orderTypeSelect = orderForm.locator('label:has-text("Order Type") + select, label:has-text("Order Type") ~ select').first();
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);

    const priceInput = orderForm.locator('input[data-testid="order-price-input"]');
    const sizeInput = orderForm.locator('input[data-testid="order-size-input"]');
    const leverageSlider = orderForm.locator('input[type="range"][aria-label="Leverage multiplier"]');
    const submitButton = orderForm.locator('button[data-testid="order-submit-button"]');

    // Enter valid values
    await priceInput.fill('50000.5'); // 1 decimal for BTC
    await sizeInput.fill('0.1234'); // 4 decimals for BTC
    await leverageSlider.evaluate((el: HTMLInputElement) => {
      el.value = '10';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(200);

    // Verify all inputs have correct precision
    expect(await priceInput.inputValue()).toBe('50000.5');
    expect(await sizeInput.inputValue()).toBe('0.1234');

    // Try to submit - should work (in test mode)
    await submitButton.click();
    await page.waitForTimeout(500);

    // Verify no validation errors
    const errorElement = orderForm.locator('div[data-testid="order-error"]');
    const errorVisible = await errorElement.isVisible().catch(() => false);
    // In test mode, order should be placed successfully (no validation errors)
    // The order will be added to open orders in test mode
    if (errorVisible) {
      const errorText = await errorElement.textContent();
      expect(errorText).not.toContain('exceeds maximum');
      expect(errorText).not.toContain('below minimum');
      expect(errorText).not.toContain('truncated');
    }
  });
});
