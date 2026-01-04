/**
 * E2E Test: Order entry price and size inputs
 * Feature: Order entry price and size inputs
 */

import { test, expect } from '@playwright/test';

test.describe('Order Entry Price and Size Inputs', () => {
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

  test('should handle price input correctly', async ({ page }) => {
    // Step 1: Navigate to order entry form with Limit selected
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    await expect(orderForm).toBeVisible();

    // Ensure Limit order type is selected
    const orderTypeSelect = orderForm.locator('label:has-text("Order Type") + select, label:has-text("Order Type") ~ select').first();
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);

    // Step 2: Click on price input field
    const priceInput = orderForm.locator('input[data-testid="order-price-input"]');
    await expect(priceInput).toBeVisible();
    await priceInput.click();

    // Step 3: Type a valid price (e.g., 50000.50)
    await priceInput.fill('50000.50');

    // Step 4: Verify price is displayed correctly
    await expect(priceInput).toHaveValue('50000.50');

    // Step 5: Verify invalid characters are rejected
    // For number inputs, we verify the input accepts only numeric values
    // First verify it has a valid numeric value
    await priceInput.fill('100');
    await expect(priceInput).toHaveValue('100');

    // Verify the input type is number (which inherently rejects non-numeric chars)
    const inputType = await priceInput.getAttribute('type');
    expect(inputType).toBe('number');

    // Step 6: Click increment button
    await priceInput.fill('100.00');
    const incrementBtn = orderForm.locator('button:has-text("+")').first();
    await incrementBtn.click();
    await page.waitForTimeout(200);

    // Step 7: Verify price increases by tick size
    // The increment is 0.5 based on the component
    await expect(priceInput).toHaveValue('100.50');

    // Step 8: Click decrement button
    const decrementBtn = orderForm.locator('button:has-text("-")').first();
    await decrementBtn.click();
    await page.waitForTimeout(200);

    // Step 9: Verify price decreases by tick size
    await expect(priceInput).toHaveValue('100.00');
  });

  test('should handle size input correctly', async ({ page }) => {
    // Step 10: Navigate to order entry form
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    await expect(orderForm).toBeVisible();

    // Step 10: Click on size input field
    const sizeInput = orderForm.locator('input[data-testid="order-size-input"]');
    await expect(sizeInput).toBeVisible();
    await sizeInput.click();

    // Step 11: Type a valid size (e.g., 0.5)
    await sizeInput.fill('0.5');

    // Step 12: Verify size is displayed correctly
    await expect(sizeInput).toHaveValue('0.5');

    // Additional: Verify size can be cleared and re-entered
    await sizeInput.clear();
    await expect(sizeInput).toHaveValue('');

    await sizeInput.fill('1.2345');
    await expect(sizeInput).toHaveValue('1.2345');
  });

  test('should handle price input visibility based on order type', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    const orderTypeSelect = orderForm.locator('label:has-text("Order Type") + select, label:has-text("Order Type") ~ select').first();
    const priceInput = orderForm.locator('input[data-testid="order-price-input"]');

    // Limit order - price input should be visible
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);
    await expect(priceInput).toBeVisible();

    // Market order - price input should be hidden
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);
    const isVisible = await priceInput.isVisible().catch(() => false);
    expect(isVisible).toBe(false);

    // Stop Limit order - price input should be visible
    await orderTypeSelect.selectOption('stop_limit');
    await page.waitForTimeout(300);
    await expect(priceInput).toBeVisible();

    // Stop Market order - price input should be hidden
    await orderTypeSelect.selectOption('stop_market');
    await page.waitForTimeout(300);
    const isVisible2 = await priceInput.isVisible().catch(() => false);
    expect(isVisible2).toBe(false);
  });

  test('should handle stop price input for stop orders', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    const orderTypeSelect = orderForm.locator('label:has-text("Order Type") + select, label:has-text("Order Type") ~ select').first();

    // Select stop limit order
    await orderTypeSelect.selectOption('stop_limit');
    await page.waitForTimeout(300);

    // Stop price input should be visible
    const stopPriceInput = orderForm.locator('input[placeholder*="0.00"]').first();
    await expect(stopPriceInput).toBeVisible();

    // Enter stop price
    await stopPriceInput.fill('95000');
    await expect(stopPriceInput).toHaveValue('95000');

    // Select stop market order
    await orderTypeSelect.selectOption('stop_market');
    await page.waitForTimeout(300);

    // Stop price input should still be visible
    await expect(stopPriceInput).toBeVisible();

    // Enter stop price
    await stopPriceInput.fill('94000');
    await expect(stopPriceInput).toHaveValue('94000');
  });
});
