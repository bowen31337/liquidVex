/**
 * E2E test for take-profit and stop-loss order attachment
 * Feature #35 from feature_list.json
 */

import { test, expect } from '@playwright/test';

test.describe('Take-profit and Stop-loss Order Attachment', () => {
  test('should allow take-profit order attachment to position', async ({ page }) => {
    // Step 1: Create a position first
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to order form - click the buy/sell toggle button
    await page.locator('button:has-text("Buy / Long")').first().click();

    // Place a limit order to create a position
    await page.locator('select[data-testid="order-type-select"]').selectOption('limit');
    await page.locator('input[data-testid="order-price-input"]').fill('50000');
    await page.locator('input[data-testid="order-size-input"]').fill('0.1');
    await page.locator('button[data-testid="order-submit-button"]').click();

    // Confirm the order
    const confirmBtn = page.locator('button:has-text("Confirm Order")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    // Wait for order to be placed and position to be created
    await page.waitForTimeout(2000);

    // Step 2: Navigate to order entry form
    // Should already be there

    // Step 3: Select take-profit order type (stop-limit or stop-market)
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_limit');

    // Step 4: Enter take-profit price (higher than entry for long position)
    await page.locator('input[placeholder="0.00"]').first().fill('55000'); // Stop price
    // For stop-limit orders, there should be a second input for limit price
    const limitPriceInputs = page.locator('input[placeholder="0.00"]').nth(1);
    await limitPriceInputs.fill('55100'); // Limit price

    // Step 5: Submit order
    await page.locator('button[data-testid="order-submit-button"]').click();

    // Step 6: Verify take-profit order is linked to position
    const confirmModal = page.locator('div[role="dialog"], .fixed.inset-0');
    if (await confirmModal.isVisible()) {
      await page.locator('button:has-text("Confirm Order")').click();
      await page.waitForTimeout(1000);
    }

    // Verify success message appears
    const successToast = page.locator('div:has-text("Order placed")');
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Verify order appears in open orders
    await page.locator('button:has-text("Open Orders")').click();
    const openOrdersTable = page.locator('table.data-table');
    await expect(openOrdersTable).toBeVisible();
    await expect(page.locator('text=55000')).toBeVisible(); // Stop price should be visible
  });

  test('should allow stop-loss order attachment to position', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to order form and create a position first - click the buy/sell toggle button
    await page.locator('button:has-text("Buy / Long")').first().click();
    await page.locator('select[data-testid="order-type-select"]').selectOption('limit');
    await page.locator('input[data-testid="order-price-input"]').fill('50000');
    await page.locator('input[data-testid="order-size-input"]').fill('0.1');
    await page.locator('button[data-testid="order-submit-button"]').click();

    // Confirm the order
    const confirmBtn = page.locator('button:has-text("Confirm Order")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(2000);

    // Step 7: Select stop-loss order type
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_market');

    // Step 8: Enter stop-loss price (lower than entry for long position)
    await page.locator('input[placeholder="0.00"]').first().fill('45000'); // Stop price

    // Step 9: Submit order
    await page.locator('button[data-testid="order-submit-button"]').click();

    // Step 10: Verify stop-loss order is linked to position
    const confirmModal = page.locator('div[role="dialog"], .fixed.inset-0');
    if (await confirmModal.isVisible()) {
      await page.locator('button:has-text("Confirm Order")').click();
      await page.waitForTimeout(1000);
    }

    // Verify success message appears
    const successToast = page.locator('div:has-text("Order placed")');
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Verify order appears in open orders
    await page.locator('button:has-text("Open Orders")').click();
    const openOrdersTable = page.locator('table.data-table');
    await expect(openOrdersTable).toBeVisible();
    await expect(page.locator('text=45000')).toBeVisible(); // Stop price should be visible
  });

  test('should display stop price input for stop orders', async ({ page }) => {
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

    const stopPriceInput = page.locator('input[placeholder="0.00"]').first();
    await expect(stopPriceInput).toBeVisible();

    // Select stop-market order type
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_market');

    // Verify stop price input is still visible
    await expect(stopPriceLabel).toBeVisible();
    await expect(stopPriceInput).toBeVisible();
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
    await page.locator('input[placeholder="0.00"]').first().fill('-100');

    // Try to submit
    await page.locator('button[data-testid="order-submit-button"]').click();

    // Verify error message
    const error = page.locator('[data-testid="order-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Invalid stop price');
  });

  test('should validate limit price for stop-limit orders', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Select stop-limit order
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_limit');

    // Set stop price
    await page.locator('input[placeholder="0.00"]').first().fill('50000');

    // Enter invalid limit price
    const limitPriceInput = page.locator('input[placeholder="0.00"]').nth(1);
    await limitPriceInput.fill('-50000');

    // Try to submit
    await page.locator('button[data-testid="order-submit-button"]').click();

    // Verify error message
    const error = page.locator('[data-testid="order-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Invalid limit price');
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

    // Should have exactly 2 price inputs for stop-limit orders
    const inputs = page.locator('input[placeholder="0.00"]');
    await expect(inputs).toHaveCount(2);
  });

  test('should hide limit price input for stop-market orders', async ({ page }) => {
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

    // Should only have one price input for stop-market orders
    const inputs = page.locator('input[placeholder="0.00"]');
    await expect(inputs).toHaveCount(1);
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

    // Verify reduce-only checkbox is also visible
    const reduceOnlyCheckbox = page.locator('input[type="checkbox"][data-testid="reduce-only-checkbox"]');
    await expect(reduceOnlyCheckbox).toBeVisible();

    // Toggle post-only
    await postOnlyCheckbox.click();
    await expect(postOnlyCheckbox).toBeChecked();
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

    // Verify reduce-only checkbox is still visible
    const reduceOnlyCheckbox = page.locator('input[type="checkbox"][data-testid="reduce-only-checkbox"]');
    await expect(reduceOnlyCheckbox).toBeVisible();
  });

  test('should handle order confirmation for stop orders', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Create a position first
    await page.locator('button:has-text("Buy / Long")').click();
    await page.locator('select[data-testid="order-type-select"]').selectOption('limit');
    await page.locator('input[data-testid="order-price-input"]').fill('50000');
    await page.locator('input[data-testid="order-size-input"]').fill('0.1');
    await page.locator('button[data-testid="order-submit-button"]').click();

    // Confirm the order
    const confirmBtn = page.locator('button:has-text("Confirm Order")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(2000);

    // Place stop-loss order
    await page.locator('select[data-testid="order-type-select"]').selectOption('stop_limit');
    await page.locator('input[placeholder="0.00"]').first().fill('45000'); // Stop price
    await page.locator('input[placeholder="0.00"]').last().fill('44900'); // Limit price
    await page.locator('button[data-testid="order-submit-button"]').click();

    // Verify confirmation modal appears
    const modal = page.locator('div[role="dialog"], .fixed.inset-0');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });

    // Verify modal content
    const modalTitle = page.locator('text=Confirm Order');
    await expect(modalTitle).toBeVisible();

    // Verify cancel button
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();

    // Verify confirm button
    const confirmOrderBtn = page.locator('button:has-text("Confirm Order")');
    await expect(confirmOrderBtn).toBeVisible();
  });
});