/**
 * E2E Test: No duplicate order submissions on double-click
 * Feature 111: No duplicate order submissions on double-click
 */

import { test, expect } from '@playwright/test';

test.describe('No Duplicate Order Submissions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application with test mode enabled
    await page.goto('/?testMode=true');

    // Wait for the main trading interface to be visible
    await page.waitForSelector('[data-testid="wallet-connect-button"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Close any modals that might be open
    const modalOverlay = page.locator('div.fixed.inset-0.bg-black.bg-opacity-50');
    if (await modalOverlay.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

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

  test('should prevent duplicate orders from rapid double-click on submit button', async ({ page }) => {
    // Step 1: Fill in order form
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('100.00');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.0');

    // Step 2: Rapidly double-click submit button
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click({ clickCount: 2, delay: 50 });
    await page.waitForTimeout(500);

    // Step 3: Verify only one confirmation modal appears
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Step 4: Click confirm and check only one order is created
    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();
    await page.waitForTimeout(1000);

    // Verify modal closes (order completed)
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Step 5: Check open orders - should only have ONE order
    const openOrdersTab = page.locator('button').filter({ hasText: 'Open Orders' });
    await openOrdersTab.click();
    await page.waitForTimeout(500);

    // Count orders with the specific price
    const orderRows = page.locator('tr').filter({ hasText: /100/ });
    const count = await orderRows.count();

    // Should have exactly 1 order
    expect(count).toBe(1);
  });

  test('should prevent duplicate orders from rapid double-click on confirm button', async ({ page }) => {
    // Step 1: Fill in order form
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('105.00');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('2.0');

    // Step 2: Click submit to open modal
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(300);

    // Step 3: Get modal and double-click confirm button
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible();

    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click({ clickCount: 2, delay: 30 });
    await page.waitForTimeout(1000);

    // Step 4: Verify modal closes (order completed)
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Step 5: Check open orders - should only have ONE order
    const openOrdersTab = page.locator('button').filter({ hasText: 'Open Orders' });
    await openOrdersTab.click();
    await page.waitForTimeout(500);

    // Count orders with the specific price
    const orderRows = page.locator('tr').filter({ hasText: /105/ });
    const count = await orderRows.count();

    // Should have exactly 1 order
    expect(count).toBe(1);
  });

  test('should disable submit button while order is processing', async ({ page }) => {
    // Step 1: Fill in order form
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('110.00');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');

    // Step 2: Click submit to open modal
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(300);

    // Step 3: Get modal and click confirm
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible();

    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Step 4: Verify confirm button is disabled during processing
    // In test mode, processing is fast, so we check immediately
    const isDisabled = await confirmButton.getAttribute('disabled');
    expect(isDisabled).not.toBeNull();

    // Step 5: Verify submit button is also disabled
    const isSubmitDisabled = await submitButton.getAttribute('disabled');
    expect(isSubmitDisabled).not.toBeNull();

    // Step 6: Wait for completion and verify buttons are re-enabled
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // After modal closes, submit button should be enabled again
    await expect(submitButton).not.toBeDisabled();
  });

  test('should prevent new order submission while current order is in progress', async ({ page }) => {
    // Step 1: Fill in order form
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('115.00');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.0');

    // Step 2: Click submit to open modal
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(300);

    // Step 3: Get modal and click confirm
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible();

    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Step 4: Try to click submit button again while processing
    // The button should be disabled
    const isDisabled = await submitButton.getAttribute('disabled');
    expect(isDisabled).not.toBeNull();

    // Step 5: Wait for order to complete
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Step 6: Verify only one order was created
    const openOrdersTab = page.locator('button').filter({ hasText: 'Open Orders' });
    await openOrdersTab.click();
    await page.waitForTimeout(500);

    const orderRows = page.locator('tr').filter({ hasText: /115/ });
    const count = await orderRows.count();
    expect(count).toBe(1);
  });

  test('should handle multiple rapid clicks on order form submit', async ({ page }) => {
    // Step 1: Fill in order form
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('120.00');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('0.5');

    // Step 2: Click submit button multiple times rapidly
    const submitButton = page.locator('button.btn-buy');

    // Perform multiple rapid clicks
    for (let i = 0; i < 5; i++) {
      await submitButton.click({ delay: 10 });
    }
    await page.waitForTimeout(500);

    // Step 3: Should only have one modal open
    const modals = page.locator('[data-testid="order-confirm-modal"]');
    const modalCount = await modals.count();
    expect(modalCount).toBe(1);

    // Step 4: Click confirm
    const confirmButton = modals.locator('button:has-text("Confirm Order")');
    await confirmButton.click();
    await page.waitForTimeout(1000);

    // Step 5: Verify only one order created
    const openOrdersTab = page.locator('button').filter({ hasText: 'Open Orders' });
    await openOrdersTab.click();
    await page.waitForTimeout(500);

    const orderRows = page.locator('tr').filter({ hasText: /120/ });
    const count = await orderRows.count();
    expect(count).toBe(1);
  });
});

test.afterEach(async ({ page }) => {
  // Take screenshot on test failure
  if (test.info().status !== 'passed') {
    await page.screenshot({
      path: `test-results/failure-${test.info().title.replace(/\s+/g, '-')}.png`,
      fullPage: true,
    });
  }
});
