/**
 * E2E Test: Complete limit buy order placement flow
 * Feature: Complete limit buy order placement flow
 */

import { test, expect } from '@playwright/test';

test.describe('Limit Buy Order Placement Flow', () => {
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

  test('should place limit buy order successfully', async ({ page }) => {
    // Step 1: Connect wallet (mock implementation)
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await expect(walletConnectButton).toBeVisible();
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Verify wallet shows as connected (or at least attempted)
    const walletButtonAfter = page.getByTestId('wallet-connect-button');
    await expect(walletButtonAfter).toBeVisible();

    // Step 2-3: Navigate to order entry form and verify Buy tab is selected
    const buyTab = page.locator('button:has-text("Buy / Long")').first();
    await expect(buyTab).toBeVisible();
    const buyTabClass = await buyTab.getAttribute('class');
    expect(buyTabClass).toContain('bg-long');

    // Step 4: Verify submit button is green
    const submitButton = page.locator('button.btn-buy');
    await expect(submitButton).toBeVisible();
    const submitClass = await submitButton.getAttribute('class');
    expect(submitClass).toContain('bg-long');

    // Step 5: Select Limit order type
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Limit' });
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);

    // Step 6: Enter price below current market price
    const priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).toBeVisible();
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    // Verify price was entered
    const priceValue = await priceInput.inputValue();
    expect(priceValue).toBe('95.00');

    // Step 7: Enter valid size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    // Verify size was entered
    const sizeValue = await sizeInput.inputValue();
    expect(sizeValue).toBe('1.5');

    // Step 8-9: Click buy button and verify confirmation modal appears
    await submitButton.click();
    await page.waitForTimeout(500);

    // Check for confirmation modal
    const modalTitle = page.locator('text=Confirm Order');
    await expect(modalTitle).toBeVisible({ timeout: 3000 });

    // Step 10-11: Verify modal shows order details
    await expect(page.locator('text=BUY / LONG')).toBeVisible();
    await expect(page.locator('text=LIMIT')).toBeVisible();
    await expect(page.locator('text=$95.00')).toBeVisible();
    await expect(page.locator('text=1.5')).toBeVisible();

    // Verify order value calculation
    const orderValue = page.locator('text=$142.50'); // 95 * 1.5 = 142.50
    await expect(orderValue).toBeVisible();

    // Step 12: Click confirm button
    const confirmButton = page.locator('button:has-text("Confirm Order")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    await page.waitForTimeout(2000); // Wait for API call

    // Step 13: Verify success notification appears
    const successToast = page.locator('div').filter({ hasText: /Order placed/ }).first();
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText('BUY');

    // Step 14: Verify order appears in open orders
    // Click on Open Orders tab
    const openOrdersTab = page.locator('button').filter({ hasText: 'Open Orders' });
    await openOrdersTab.click();
    await page.waitForTimeout(500);

    // Verify order is in the table
    const orderRow = page.locator('tr').filter({ hasText: /95/ });
    await expect(orderRow.first()).toBeVisible({ timeout: 3000 });
  });

  test('should validate order form before submission', async ({ page }) => {
    // Try to submit without connecting wallet
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Should show error about wallet connection
    const errorMessage = page.locator('div').filter({ hasText: /Connect wallet/ });
    await expect(errorMessage).toBeVisible();

    // Now connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Try to submit without price
    await submitButton.click();
    await page.waitForTimeout(500);

    // Should show validation error
    const priceError = page.locator('div').filter({ hasText: /Invalid price/ });
    await expect(priceError).toBeVisible();
  });

  test('should handle order cancellation in confirmation modal', async ({ page }) => {
    // Connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Fill order form
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');

    // Click buy button
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Cancel the order in modal
    const cancelButton = page.locator('button').filter({ hasText: /^Cancel$/ });
    await cancelButton.click();
    await page.waitForTimeout(300);

    // Verify modal is closed
    const modalTitle = page.locator('text=Confirm Order');
    await expect(modalTitle).not.toBeVisible();

    // Verify form still has values
    const priceValue = await priceInput.inputValue();
    expect(priceValue).toBe('95.00');
  });

  test('should show loading state during order submission', async ({ page }) => {
    // Connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Fill order form
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');

    // Click buy button
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Click confirm
    const confirmButton = page.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Verify loading state
    await expect(page.locator('text=Processing...')).toBeVisible();
    await expect(page.locator('text=⌛')).toBeVisible();

    // Wait for completion
    await page.waitForTimeout(2000);
  });

  test('should maintain form state after modal close', async ({ page }) => {
    // Connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Fill order form with specific values
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('88.50');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('2.0');

    // Click buy button
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Close modal by clicking backdrop
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/60');
    await backdrop.click();
    await page.waitForTimeout(300);

    // Verify form values are preserved
    const priceValue = await priceInput.inputValue();
    expect(priceValue).toBe('88.50');

    const sizeValue = await sizeInput.inputValue();
    expect(sizeValue).toBe('2.0');
  });

  test('should reset form after successful order', async ({ page }) => {
    // Connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Fill order form
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('92.00');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.0');

    // Submit order
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    const confirmButton = page.locator('button:has-text("Confirm Order")');
    await confirmButton.click();
    await page.waitForTimeout(2500);

    // Verify form is reset
    const priceValue = await priceInput.inputValue();
    expect(priceValue).toBe('');

    const sizeValue = await sizeInput.inputValue();
    expect(sizeValue).toBe('');
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
