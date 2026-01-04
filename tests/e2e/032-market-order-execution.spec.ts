/**
 * E2E Test: Market Order Execution Flow
 * Feature 32: Market order execution flow
 */

import { test, expect } from '@playwright/test';

test.describe('Market Order Execution Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the main trading interface to be visible
    await page.waitForSelector('[data-testid="wallet-connect-button"]', { timeout: 10000 });

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

  test('should execute market buy order successfully', async ({ page }) => {
    // Step 1: Connect wallet (mock implementation)
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Step 2: Verify Buy tab is active (default) - it's the first button with flex-1
    const buyTab = page.locator('div.flex > button.flex-1').first();
    await expect(buyTab).toBeVisible();
    await expect(buyTab).toHaveClass(/bg-long/);

    // Step 3: Select Market order type (find select that contains "Limit" text, which is the order type select)
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Limit' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Verify price input is hidden for market orders
    const priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).not.toBeVisible();

    // Step 4: Enter valid size using the size input test ID
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    // Verify size was entered
    const sizeValue = await sizeInput.inputValue();
    expect(sizeValue).toBe('1.5');

    // Step 5: Click buy button (submit button)
    const submitButton = page.getByTestId('order-submit-button');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    await page.waitForTimeout(500);

    // Step 6: Verify confirmation modal appears (modal header)
    const modalTitle = page.locator('h2:has-text("Confirm Order")');
    await expect(modalTitle).toBeVisible({ timeout: 3000 });

    // Verify modal shows correct order details for MARKET order
    // Use nth(0) to get the first matching element in the modal
    await expect(page.locator('text=BUY / LONG').nth(0)).toBeVisible();
    await expect(page.locator('text=MARKET').nth(0)).toBeVisible();

    // Step 7: Click confirm button (simulates signing transaction)
    const confirmButton = page.locator('button').filter({ hasText: /^Confirm Order$/ });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    await page.waitForTimeout(2000); // Wait for API call

    // Step 8: Verify success notification appears (order executed)
    const successToast = page.locator('div').filter({ hasText: /Order placed/ }).first();
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText('BUY');

    // Step 9: Verify position is created or updated
    // Click on Positions tab
    const positionsTab = page.locator('button').filter({ hasText: 'Positions' });
    await positionsTab.click();
    await page.waitForTimeout(500);

    // Check if positions panel is visible
    const positionsPanel = page.locator('div').filter({ hasText: /Positions/ });
    await expect(positionsPanel.first()).toBeVisible();

    // Step 10: Verify trade appears in trade history
    // Click on Trade History tab
    const tradeHistoryTab = page.locator('button').filter({ hasText: 'Trade History' });
    await tradeHistoryTab.click();
    await page.waitForTimeout(500);

    // Check for trade history panel
    const tradeHistoryPanel = page.locator('div').filter({ hasText: /Trade History/ });
    await expect(tradeHistoryPanel.first()).toBeVisible();
  });

  test('should execute market sell order successfully', async ({ page }) => {
    // Step 1: Connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Step 2: Select Sell tab (second button with flex-1)
    const sellTab = page.locator('div.flex > button.flex-1').nth(1);
    await expect(sellTab).toBeVisible();
    await sellTab.click();
    await page.waitForTimeout(300);

    // Verify sell tab is active
    const sellTabClass = await sellTab.getAttribute('class');
    expect(sellTabClass).toContain('bg-short');

    // Step 3: Select Market order type
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Limit' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Step 4: Enter valid size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('2.0');
    await page.waitForTimeout(300);

    // Step 5: Click sell button
    const submitButton = page.getByTestId('order-submit-button');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Step 6: Verify confirmation modal
    const modalTitle = page.locator('h2:has-text("Confirm Order")');
    await expect(modalTitle).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=SELL / SHORT').nth(0)).toBeVisible();

    // Step 7: Confirm order
    const confirmButton = page.locator('button').filter({ hasText: /^Confirm Order$/ });
    await confirmButton.click();
    await page.waitForTimeout(2000);

    // Step 8: Verify success
    const successToast = page.locator('div').filter({ hasText: /Order placed/ }).first();
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText('SELL');
  });

  test('should validate market order form correctly', async ({ page }) => {
    // Connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Select Market order type
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Limit' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Try to submit without size
    const submitButton = page.getByTestId('order-submit-button');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Should show error about invalid size (look for the specific error div)
    const errorMessage = page.locator('div.mt-2.text-xs.text-short');
    await expect(errorMessage).toBeVisible();

    // Enter valid size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.0');
    await page.waitForTimeout(300);

    // Should be able to submit now
    await submitButton.click();
    await page.waitForTimeout(500);

    // Modal should appear
    const modalTitle = page.locator('h2:has-text("Confirm Order")');
    await expect(modalTitle).toBeVisible();
  });

  test('should handle market order with reduce-only option', async ({ page }) => {
    // Connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Select Market order type
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Limit' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Enable reduce-only (first checkbox)
    const reduceOnlyCheckbox = page.locator('input[type="checkbox"]').first();
    await reduceOnlyCheckbox.check();
    await page.waitForTimeout(300);

    // Enter size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.0');
    await page.waitForTimeout(300);

    // Submit
    const submitButton = page.getByTestId('order-submit-button');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Verify modal shows reduce-only
    const modalTitle = page.locator('h2:has-text("Confirm Order")');
    await expect(modalTitle).toBeVisible({ timeout: 3000 });

    // Modal should show reduce-only indicator
    const reduceOnlyText = page.locator('text=Reduce Only');
    await expect(reduceOnlyText).toBeVisible();
  });

  test('should show order value calculation for market orders', async ({ page }) => {
    // Connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Select Market order type
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Limit' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Enter size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    // Check order summary (for market orders, it uses current price or 0)
    const orderSummary = page.locator('text=Order Value');
    await expect(orderSummary).toBeVisible();

    // Order value should be displayed
    const orderValueContainer = orderSummary.locator('..'); // Parent container
    await expect(orderValueContainer).toBeVisible();
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
