/**
 * E2E test for Feature 173: Validation error styling on inputs
 *
 * Tests for:
 * - Red border on invalid input
 * - Red error message text
 * - Normal styling returns when value is fixed
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 173: Validation Error Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app with test mode enabled
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');
  });

  test('should show red border on price input when invalid', async ({ page }) => {
    // Set limit order type
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    // Set valid size but invalid price (0)
    await page.fill('input[data-testid="order-size-input"]', '1');
    await page.fill('input[data-testid="order-price-input"]', '0');

    // Try to submit
    const submitButton = page.locator('button[data-testid="order-submit-button"]');
    await submitButton.click();

    // Wait for validation error
    await page.waitForTimeout(500);

    // Check for error border on price input
    const priceInput = page.locator('input[data-testid="order-price-input"]');
    const borderColor = await priceInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // Border should be red (rgb(239, 68, 68) is our error color)
    expect(borderColor).toBe('rgb(239, 68, 68)');

    // Verify aria-invalid attribute is set
    const ariaInvalid = await priceInput.getAttribute('aria-invalid');
    expect(ariaInvalid).toBe('true');
  });

  test('should show red border on size input when invalid', async ({ page }) => {
    // Set limit order type
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    // Set valid price but invalid size (0)
    await page.fill('input[data-testid="order-price-input"]', '100');
    await page.fill('input[data-testid="order-size-input"]', '0');

    // Try to submit
    const submitButton = page.locator('button[data-testid="order-submit-button"]');
    await submitButton.click();

    // Wait for validation error
    await page.waitForTimeout(500);

    // Check for error border on size input
    const sizeInput = page.locator('input[data-testid="order-size-input"]');
    const borderColor = await sizeInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // Border should be red
    expect(borderColor).toBe('rgb(239, 68, 68)');

    // Verify aria-invalid attribute is set
    const ariaInvalid = await sizeInput.getAttribute('aria-invalid');
    expect(ariaInvalid).toBe('true');
  });

  test('should show red border on stop price input when invalid', async ({ page }) => {
    // Set stop-limit order type
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('stop_limit');

    // Set valid limit price and size but no stop price
    await page.fill('input[data-testid="order-price-input"]', '100');
    await page.fill('input[data-testid="order-size-input"]', '1');

    // Try to submit
    const submitButton = page.locator('button[data-testid="order-submit-button"]');
    await submitButton.click();

    // Wait for validation error
    await page.waitForTimeout(500);

    // Check for error border on stop price input
    const stopPriceInput = page.locator('#stop-price-input');
    const borderColor = await stopPriceInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // Border should be red
    expect(borderColor).toBe('rgb(239, 68, 68)');

    // Verify aria-invalid attribute is set
    const ariaInvalid = await stopPriceInput.getAttribute('aria-invalid');
    expect(ariaInvalid).toBe('true');
  });

  test('should display error message with red text', async ({ page }) => {
    // Set limit order type
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    // Set invalid size (0)
    await page.fill('input[data-testid="order-price-input"]', '100');
    await page.fill('input[data-testid="order-size-input"]', '0');

    // Try to submit
    const submitButton = page.locator('button[data-testid="order-submit-button"]');
    await submitButton.click();

    // Wait for error message
    await page.waitForTimeout(500);

    // Check error message color
    const errorMessage = page.locator('[data-testid="order-error"]');
    await expect(errorMessage).toBeVisible();

    const textColor = await errorMessage.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Text should be red
    expect(textColor).toBe('rgb(239, 68, 68)');

    // Verify error message content mentions size
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toContain('size');
  });

  test('should clear error styling when input value is fixed', async ({ page }) => {
    // Set limit order type
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    // Submit with invalid size
    await page.fill('input[data-testid="order-price-input"]', '100');
    await page.fill('input[data-testid="order-size-input"]', '0');

    const submitButton = page.locator('button[data-testid="order-submit-button"]');
    await submitButton.click();

    // Wait for error
    await page.waitForTimeout(500);

    // Verify error is showing
    const sizeInput = page.locator('input[data-testid="order-size-input"]');
    const initialBorderColor = await sizeInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });
    expect(initialBorderColor).toBe('rgb(239, 68, 68)');

    // Fix the size value
    await page.fill('input[data-testid="order-size-input"]', '1');
    await page.waitForTimeout(200);

    // Check that border color is back to normal
    const normalBorderColor = await sizeInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // Border should no longer be red
    expect(normalBorderColor).not.toBe('rgb(239, 68, 68)');

    // Verify aria-invalid is cleared
    const ariaInvalid = await sizeInput.getAttribute('aria-invalid');
    expect(ariaInvalid).toBe('false');

    // Error message should also be hidden
    const errorMessage = page.locator('[data-testid="order-error"]');
    await expect(errorMessage).not.toBeVisible();
  });

  test('should maintain normal styling for valid inputs', async ({ page }) => {
    // Set limit order type with valid values
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    await page.fill('input[data-testid="order-price-input"]', '100');
    await page.fill('input[data-testid="order-size-input"]', '1');

    // Wait a moment
    await page.waitForTimeout(200);

    // Check that inputs have normal border color (not red)
    const priceInput = page.locator('input[data-testid="order-price-input"]');
    const priceBorderColor = await priceInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    const sizeInput = page.locator('input[data-testid="order-size-input"]');
    const sizeBorderColor = await sizeInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // Borders should not be red
    expect(priceBorderColor).not.toBe('rgb(239, 68, 68)');
    expect(sizeBorderColor).not.toBe('rgb(239, 68, 68)');

    // Verify aria-invalid is false
    const priceAriaInvalid = await priceInput.getAttribute('aria-invalid');
    const sizeAriaInvalid = await sizeInput.getAttribute('aria-invalid');
    expect(priceAriaInvalid).toBe('false');
    expect(sizeAriaInvalid).toBe('false');

    // No error message should be visible
    const errorMessage = page.locator('[data-testid="order-error"]');
    await expect(errorMessage).not.toBeVisible();
  });
});
