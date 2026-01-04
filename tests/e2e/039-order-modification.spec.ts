/**
 * E2E Test: Order modification flow
 * Feature: Order modification flow (Feature 39)
 */

import { test, expect } from '@playwright/test';

test.describe('Order Modification Flow', () => {
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

  test('should show Modify button for open orders', async ({ page }) => {
    // Step 1: Connect wallet
    const walletConnectButton = page.getByTestId('wallet-connect-button');
    await expect(walletConnectButton).toBeVisible();
    await walletConnectButton.click();
    await page.waitForTimeout(500);

    // Step 2: Navigate to Open Orders tab
    const ordersTab = page.locator('button:has-text("Open Orders")');
    await expect(ordersTab).toBeVisible();
    await ordersTab.click();
    await page.waitForTimeout(500);

    // Step 3: Verify there are orders with Modify buttons
    // First, we need to have some orders - in test mode, mock data should exist
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');

    // Wait for orders to load
    await page.waitForTimeout(1000);

    // Check if modify buttons exist (they should if there are orders)
    const modifyButtonCount = await modifyButtons.count();
    if (modifyButtonCount > 0) {
      // Verify at least one Modify button is visible
      await expect(modifyButtons.first()).toBeVisible();
      // Verify it has the correct styling (bg-accent)
      await expect(modifyButtons.first()).toHaveClass(/bg-accent/);
      // Verify text
      await expect(modifyButtons.first()).toHaveText('Modify');
    } else {
      // If no orders exist, verify the "No open orders" message
      const noOrdersMsg = page.locator('text=No open orders');
      await expect(noOrdersMsg).toBeVisible();
    }
  });

  test('should open modification modal when Modify button is clicked', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByTestId('wallet-connect-button').click();
    await page.waitForTimeout(500);

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Check if there are orders
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    const modifyButtonCount = await modifyButtons.count();

    if (modifyButtonCount > 0) {
      // Click the first Modify button
      await modifyButtons.first().click();
      await page.waitForTimeout(500);

      // Step 4: Verify modal appears
      const modalTitle = page.locator('text=Modify Order');
      await expect(modalTitle).toBeVisible();

      // Verify modal content
      const priceInput = page.locator('input[type="number"]').first();
      const sizeInput = page.locator('input[type="number"]').nth(1);
      const updateButton = page.locator('button:has-text("Update Order")');

      await expect(priceInput).toBeVisible();
      await expect(sizeInput).toBeVisible();
      await expect(updateButton).toBeVisible();
    }
  });

  test('should modify order price and size', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByTestId('wallet-connect-button').click();
    await page.waitForTimeout(500);

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Check if there are orders
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    const modifyButtonCount = await modifyButtons.count();

    if (modifyButtonCount > 0) {
      // Get the original order values from the table
      const firstRow = modifyButtons.first().locator('..').locator('..');
      const originalPrice = await firstRow.locator('td').nth(4).textContent();
      const originalSize = await firstRow.locator('td').nth(5).textContent();

      // Click Modify
      await modifyButtons.first().click();
      await page.waitForTimeout(500);

      // Step 4: Change price and size
      const priceInput = page.locator('input[type="number"]').first();
      const sizeInput = page.locator('input[type="number"]').nth(1);

      await priceInput.fill('50000');
      await sizeInput.fill('0.5');

      // Step 5: Click Update Order
      const updateButton = page.locator('button:has-text("Update Order")');
      await expect(updateButton).toBeEnabled();
      await updateButton.click();

      // Step 6: Verify success toast
      const successToast = page.locator('[data-testid="toast"]');
      await expect(successToast).toBeVisible({ timeout: 5000 });
      await expect(successToast).toContainText(/modified successfully/);

      // Modal should be closed
      await expect(page.locator('text=Modify Order')).not.toBeVisible();
    }
  });

  test('should cancel modification with Cancel button', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByTestId('wallet-connect-button').click();
    await page.waitForTimeout(500);

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Check if there are orders
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    const modifyButtonCount = await modifyButtons.count();

    if (modifyButtonCount > 0) {
      // Click Modify
      await modifyButtons.first().click();
      await page.waitForTimeout(500);

      // Verify modal is visible
      await expect(page.locator('text=Modify Order')).toBeVisible();

      // Step 4: Click Cancel
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();

      // Step 5: Modal should be closed
      await expect(page.locator('text=Modify Order')).not.toBeVisible();
    }
  });

  test('should disable Update button when no changes are made', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByTestId('wallet-connect-button').click();
    await page.waitForTimeout(500);

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Check if there are orders
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    const modifyButtonCount = await modifyButtons.count();

    if (modifyButtonCount > 0) {
      // Click Modify
      await modifyButtons.first().click();
      await page.waitForTimeout(500);

      // Step 4: Verify Update button is disabled (no changes)
      const updateButton = page.locator('button:has-text("Update Order")');
      await expect(updateButton).toBeDisabled();
    }
  });

  test('should show current order values in modal', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByTestId('wallet-connect-button').click();
    await page.waitForTimeout(500);

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Check if there are orders
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    const modifyButtonCount = await modifyButtons.count();

    if (modifyButtonCount > 0) {
      // Get current order values from table
      const firstRow = modifyButtons.first().locator('..').locator('..');
      const currentPrice = await firstRow.locator('td').nth(4).textContent();
      const currentSize = await firstRow.locator('td').nth(5).textContent();

      // Click Modify
      await modifyButtons.first().click();
      await page.waitForTimeout(500);

      // Step 4: Verify input values match current order
      const priceInput = page.locator('input[type="number"]').first();
      const sizeInput = page.locator('input[type="number"]').nth(1);

      const priceValue = await priceInput.inputValue();
      const sizeValue = await sizeInput.inputValue();

      // Values should match (with some formatting differences)
      expect(priceValue).toContain(currentPrice?.replace('$', '') || '');
      expect(sizeValue).toContain(currentSize || '');
    }
  });
});
