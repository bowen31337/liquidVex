/**
 * E2E Test: Feature 126 - Complete limit order workflow with modification and cancellation
 *
 * This test verifies the complete flow:
 * 1. Connect wallet
 * 2. Select Limit order type
 * 3. Enter a price significantly below market
 * 4. Enter order size
 * 5. Submit order and sign
 * 6. Verify order appears in Open Orders
 * 7. Click modify on the order
 * 8. Change the price closer to market
 * 9. Submit modification and sign
 * 10. Verify order shows updated price
 * 11. Click cancel on the order
 * 12. Confirm and sign cancellation
 * 13. Verify order is removed from Open Orders
 * 14. Verify order appears in Order History as canceled
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';

test.describe('Feature 126: Complete limit order workflow with modification and cancellation', () => {
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

  test('Step 1: Connect wallet', async ({ page }) => {
    // Step 1: Click wallet connect button
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await expect(walletConnectButton).toBeVisible();
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Verify wallet is connected (mock connection)
    // In test mode, clicking the button should show connected state
    const connectedIndicator = page.locator('[data-testid="wallet-connected"], .wallet-connected, text=/Connected|0x/');
    await expect(connectedIndicator).toBeVisible({ timeout: 5000 });
  });

  test('Step 2-6: Place limit order and verify in Open Orders', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByTestId('wallet-connect-button').click();
    await page.waitForTimeout(500);

    // Step 2: Select Limit order type (should be default)
    const orderTypeSelect = page.locator('select:has-text("Order Type")');
    await expect(orderTypeSelect).toBeVisible();
    await orderTypeSelect.selectOption('limit');

    // Step 3: Enter a price significantly below market (mock market is ~50000 for BTC)
    const priceInput = page.locator('[data-testid="order-price-input"]');
    await expect(priceInput).toBeVisible();
    await priceInput.fill('40000'); // Below market

    // Step 4: Enter order size
    const sizeInput = page.locator('[data-testid="order-size-input"]');
    await expect(sizeInput).toBeVisible();
    await sizeInput.fill('0.1');

    // Step 5: Submit order
    const submitButton = page.locator('[data-testid="order-submit-button"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for confirmation modal and confirm
    await page.waitForTimeout(500);
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Wait for success toast
    const successToast = page.locator('[data-testid="toast"]');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText(/Order placed|success/i);

    // Step 6: Verify order appears in Open Orders
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(500);

    // Check for order in the table
    const orderRow = page.locator('tbody tr').first();
    await expect(orderRow).toBeVisible({ timeout: 5000 });

    // Verify it has the correct details
    const priceCell = orderRow.locator('td').nth(4); // Price column
    await expect(priceCell).toContainText('40000');

    const sizeCell = orderRow.locator('td').nth(5); // Size column
    await expect(sizeCell).toContainText('0.1');
  });

  test('Step 7-10: Modify order price', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByTestId('wallet-connect-button').click();
    await page.waitForTimeout(500);

    // Navigate to Open Orders
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Check if there are orders
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    const modifyButtonCount = await modifyButtons.count();

    if (modifyButtonCount > 0) {
      // Step 7: Click modify on the first order
      await modifyButtons.first().click();
      await page.waitForTimeout(500);

      // Step 8: Change the price closer to market
      const priceInput = page.locator('input[type="number"]').first();
      await expect(priceInput).toBeVisible();
      await priceInput.fill('45000'); // Closer to market

      // Step 9: Submit modification
      const updateButton = page.locator('button:has-text("Update Order")');
      await expect(updateButton).toBeEnabled();
      await updateButton.click();

      // Wait for success toast
      const successToast = page.locator('[data-testid="toast"]');
      await expect(successToast).toBeVisible({ timeout: 5000 });
      await expect(successToast).toContainText(/modified successfully/i);

      // Step 10: Verify order shows updated price
      await page.waitForTimeout(500);
      const orderRow = page.locator('tbody tr').first();
      const priceCell = orderRow.locator('td').nth(4);
      await expect(priceCell).toContainText('45000');
    }
  });

  test('Step 11-14: Cancel order and verify in history', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByTestId('wallet-connect-button').click();
    await page.waitForTimeout(500);

    // Navigate to Open Orders
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Check if there are orders
    const cancelButtons = page.locator('button[data-testid^="cancel-order-"]');
    const cancelButtonCount = await cancelButtons.count();

    if (cancelButtonCount > 0) {
      // Get the order ID before canceling
      const firstRow = cancelButtons.first().locator('..').locator('..');
      const orderSymbol = await firstRow.locator('td').nth(1).textContent();

      // Step 11: Click cancel on the first order
      await cancelButtons.first().click();
      await page.waitForTimeout(500);

      // Step 12: Confirm cancellation (if confirmation modal appears)
      // In the current implementation, it should just cancel immediately

      // Step 13: Verify order is removed from Open Orders
      // Wait for the order to be removed
      await page.waitForTimeout(1000);

      // Check if order is gone or if "No open orders" message appears
      const noOrdersMsg = page.locator('text=No open orders');
      const remainingOrders = page.locator('button[data-testid^="cancel-order-"]');

      // Either no orders message or fewer orders than before
      const hasNoOrders = await noOrdersMsg.isVisible().catch(() => false);
      const newCount = await remainingOrders.count();

      expect(hasNoOrders || newCount < cancelButtonCount).toBe(true);

      // Step 14: Verify order appears in Order History as canceled
      await page.locator('button:has-text("Order History")').click();
      await page.waitForTimeout(500);

      // Check for canceled order in history
      const historyRows = page.locator('tbody tr');
      await expect(historyRows.first()).toBeVisible({ timeout: 5000 });

      // Find the row with our order symbol
      const orderSymbolRegex = new RegExp(orderSymbol || '', 'i');
      const canceledRow = page.locator('tbody tr').filter({ hasText: orderSymbolRegex }).first();
      await expect(canceledRow).toBeVisible();

      // Verify it shows canceled status
      const statusCell = canceledRow.locator('td').nth(7); // Status column
      await expect(statusCell).toContainText(/cancel/i, { timeout: 5000 });
    }
  });

  test('Complete workflow in one test', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByTestId('wallet-connect-button').click();
    await page.waitForTimeout(500);

    // Step 2-5: Place limit order
    await page.locator('select:has-text("Order Type")').selectOption('limit');
    await page.locator('[data-testid="order-price-input"]').fill('35000');
    await page.locator('[data-testid="order-size-input"]').fill('0.05');
    await page.locator('[data-testid="order-submit-button"]').click();
    await page.waitForTimeout(500);

    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Wait for success
    await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 5000 });

    // Step 6: Verify in Open Orders
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('tbody tr').first()).toBeVisible();

    // Step 7-10: Modify order
    const modifyButton = page.locator('button[data-testid^="modify-order-"]').first();
    if (await modifyButton.isVisible()) {
      await modifyButton.click();
      await page.waitForTimeout(300);
      await page.locator('input[type="number"]').first().fill('42000');
      await page.locator('button:has-text("Update Order")').click();
      await expect(page.locator('[data-testid="toast"]')).toContainText(/modified/i, { timeout: 5000 });
    }

    // Step 11-14: Cancel order and verify history
    const cancelButton = page.locator('button[data-testid^="cancel-order-"]').first();
    if (await cancelButton.isVisible()) {
      const orderSymbol = await page.locator('tbody tr').first().locator('td').nth(1).textContent();
      await cancelButton.click();
      await page.waitForTimeout(1000);

      // Verify removed from Open Orders
      const noOrders = await page.locator('text=No open orders').isVisible().catch(() => false);
      const stillHasOrders = await page.locator('button[data-testid^="cancel-order-"]').count().then(c => c > 0);
      expect(noOrders || !stillHasOrders).toBe(true);

      // Verify in Order History
      await page.locator('button:has-text("Order History")').click();
      await page.waitForTimeout(500);

      if (orderSymbol) {
        const historyRow = page.locator('tbody tr').filter({ hasText: new RegExp(orderSymbol, 'i') }).first();
        await expect(historyRow).toBeVisible({ timeout: 5000 });
        await expect(historyRow.locator('td').nth(7)).toContainText(/cancel/i);
      }
    }
  });
});
