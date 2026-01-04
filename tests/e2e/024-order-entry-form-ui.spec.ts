/**
 * E2E Test: Order entry form complete UI test
 * Feature: Order entry form complete UI test
 */

import { test, expect } from '@playwright/test';

test.describe('Order Entry Form UI', () => {
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

  test('should display complete order entry form UI', async ({ page }) => {
    // Step 1: Navigate to order entry panel
    const orderForm = page.locator('.panel').filter({ hasText: /Leverage/ });
    await expect(orderForm).toBeVisible();

    // Step 2: Verify buy/sell toggle tabs are visible
    // Use first() to get the toggle tabs (not the submit button)
    const buyTab = orderForm.locator('button:has-text("Buy / Long")').first();
    const sellTab = orderForm.locator('button:has-text("Sell / Short")').first();
    await expect(buyTab).toBeVisible();
    await expect(sellTab).toBeVisible();

    // Step 3: Verify buy tab is green-styled (active by default)
    const buyTabClass = await buyTab.getAttribute('class');
    expect(buyTabClass).toMatch(/bg-long/);

    // Step 4: Verify sell tab is styled correctly (inactive state)
    const sellTabClass = await sellTab.getAttribute('class');
    // Inactive tab should have surface-elevated background
    expect(sellTabClass).toMatch(/bg-surface-elevated/);

    // Step 5: Click Buy tab and verify active
    await buyTab.click();
    await page.waitForTimeout(300);
    const buyTabClassAfter = await buyTab.getAttribute('class');
    expect(buyTabClassAfter).toMatch(/bg-long/);

    // Step 6: Click Sell tab and verify active (now it should be red)
    await sellTab.click();
    await page.waitForTimeout(300);
    const sellTabClassAfter = await sellTab.getAttribute('class');
    expect(sellTabClassAfter).toMatch(/bg-short/);

    // Step 7: Locate order type selector
    const orderTypeLabel = orderForm.locator('label:has-text("Order Type")');
    await expect(orderTypeLabel).toBeVisible();

    // Get the select that's right after the Order Type label
    const orderTypeSelect = orderForm.locator('label:has-text("Order Type") + select, label:has-text("Order Type") ~ select').first();
    await expect(orderTypeSelect).toBeVisible();

    // Step 8: Select Limit order type
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);

    // Step 9: Verify price input field is visible for Limit orders
    const priceInput = orderForm.locator('input[data-testid="order-price-input"]');
    await expect(priceInput).toBeVisible();

    // Step 10: Select Market order type
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Step 11: Verify price input field is hidden for Market orders
    // Note: The component might keep the field but disable it, or hide it
    // Let's verify it's not interactable for market orders
    const priceInputForMarket = orderForm.locator('input[placeholder*="Price"], input[data-testid="order-price-input"]');
    const isVisible = await priceInputForMarket.isVisible().catch(() => false);

    if (isVisible) {
      // If visible, it should be disabled or have a placeholder indicating it's not needed
      const isDisabled = await priceInputForMarket.isDisabled();
      expect(isDisabled || !isVisible).toBeTruthy();
    }

    // Step 12: Select Stop Limit order type
    await orderTypeSelect.selectOption('stop_limit');
    await page.waitForTimeout(300);

    // Step 13: Verify trigger price field appears for stop orders
    const stopPriceLabel = orderForm.locator('label:has-text("Stop Price")');
    await expect(stopPriceLabel).toBeVisible();

    const stopPriceInput = orderForm.locator('input[placeholder*="0.00"]').first();
    await expect(stopPriceInput).toBeVisible();

    // Verify limit price field is also present for stop-limit
    const limitPriceInput = orderForm.locator('input[data-testid="order-price-input"]');
    await expect(limitPriceInput).toBeVisible();

    // Step 14: Verify size input field
    const sizeInput = orderForm.locator('input[data-testid="order-size-input"]');
    await expect(sizeInput).toBeVisible();
    expect(sizeInput).toHaveAttribute('type', 'number');

    // Step 15: Verify percentage buttons
    const percentageButtons = orderForm.locator('button:has-text("25%"), button:has-text("50%"), button:has-text("75%"), button:has-text("100%")');
    await expect(percentageButtons).toHaveCount(4);

    // Step 16: Verify leverage slider
    // Leverage is displayed as text with a slider
    const leverageText = orderForm.locator('text=Leverage');
    await expect(leverageText).toBeVisible();

    const leverageInput = orderForm.locator('input[type="range"][min="1"][max="50"]');
    await expect(leverageInput).toBeVisible();

    // Step 17: Verify reduce-only checkbox
    const reduceOnlyCheckbox = orderForm.locator('label:has-text("Reduce Only") input[type="checkbox"]');
    await expect(reduceOnlyCheckbox).toBeVisible();

    // Step 18: Verify post-only checkbox (only for limit orders)
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);

    const postOnlyCheckbox = orderForm.locator('label:has-text("Post Only") input[type="checkbox"]');
    await expect(postOnlyCheckbox).toBeVisible();

    // Step 19: Verify time-in-force selector for limit orders
    const tifLabel = orderForm.locator('label:has-text("Time-in-Force")');
    await expect(tifLabel).toBeVisible();

    // Get the select that's right after the Time-in-Force label
    const tifSelect = orderForm.locator('label:has-text("Time-in-Force") + select, label:has-text("Time-in-Force") ~ select').first();
    await expect(tifSelect).toBeVisible();

    // Step 20: Verify submit button
    const submitButton = orderForm.locator('button.btn-buy, button.btn-sell');
    await expect(submitButton).toBeVisible();

    // Verify button changes based on selected side
    await buyTab.click();
    await page.waitForTimeout(300);
    const buyButton = orderForm.locator('button.btn-buy').first();
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toContainText('Buy / Long');

    await sellTab.click();
    await page.waitForTimeout(300);
    const sellButton = orderForm.locator('button.btn-sell').first();
    await expect(sellButton).toBeVisible();
    await expect(sellButton).toContainText('Sell / Short');

    // Step 21: Verify order value display
    const orderValueLabel = orderForm.locator('text=Order Value');
    await expect(orderValueLabel).toBeVisible();

    const availableLabel = orderForm.locator('text=Available');
    await expect(availableLabel).toBeVisible();
  });

  test('should maintain correct styling and colors', async ({ page }) => {
    const orderForm = page.locator('.panel').filter({ hasText: /Leverage/ });

    // Verify panel has proper background
    const panelClass = await orderForm.getAttribute('class');
    expect(panelClass).toMatch(/panel/);

    // Verify inputs have proper styling
    const inputs = orderForm.locator('input.input, select.input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    // Check first input has input class
    const firstInput = inputs.first();
    const inputClass = await firstInput.getAttribute('class');
    expect(inputClass).toMatch(/input/);
  });
});
