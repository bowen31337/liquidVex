/**
 * Simplified E2E test for take-profit and stop-loss order attachment
 * Feature #35 from feature_list.json - focused on core functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Take-profit and Stop-loss Order Attachment - Core Functionality', () => {
  test('should display stop price input for stop-limit orders', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Select stop-limit order type
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_limit');

    // Verify stop price input is visible
    const stopPriceLabel = page.locator('text=Stop Price (Trigger)');
    await expect(stopPriceLabel).toBeVisible();
  });

  test('should display stop price input for stop-market orders', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Select stop-market order type
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_market');

    // Verify stop price input is visible
    const stopPriceLabel = page.locator('text=Stop Price (Trigger)');
    await expect(stopPriceLabel).toBeVisible();
  });

  test('should show limit price input for stop-limit orders', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Select stop-limit order
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_limit');

    // Verify both stop price and limit price inputs are visible
    const stopPriceLabel = page.locator('text=Stop Price (Trigger)');
    const limitPriceLabel = page.locator('text=Limit Price');

    await expect(stopPriceLabel).toBeVisible();
    await expect(limitPriceLabel).toBeVisible();
  });

  test('should not show limit price input for stop-market orders', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Select stop-market order
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_market');

    // Verify only stop price input is visible
    const stopPriceLabel = page.locator('text=Stop Price (Trigger)');
    await expect(stopPriceLabel).toBeVisible();

    const limitPriceLabel = page.locator('text=Limit Price');
    await expect(limitPriceLabel).not.toBeVisible();
  });

  test('should allow post-only for stop-limit orders', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Select stop-limit order
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_limit');

    // Verify post-only checkbox is visible
    const postOnlyCheckbox = page.locator('input[type="checkbox"][data-testid="post-only-checkbox"]');
    await expect(postOnlyCheckbox).toBeVisible();
  });

  test('should not show post-only for stop-market orders', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Select stop-market order
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_market');

    // Verify post-only checkbox is not visible
    const postOnlyCheckbox = page.locator('input[type="checkbox"][data-testid="post-only-checkbox"]');
    await expect(postOnlyCheckbox).not.toBeVisible();
  });

  test('should validate stop price for stop orders', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Select stop-limit order
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_limit');

    // Enter invalid stop price
    const stopPriceInput = page.locator('input').filter({ has: page.locator('text=Stop Price') }).first();
    await stopPriceInput.fill('-100');

    // Try to submit
    await page.locator('button[data-testid="order-submit-button"]').click();

    // Verify error message
    const error = page.locator('[data-testid="order-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Invalid stop price');
  });
});