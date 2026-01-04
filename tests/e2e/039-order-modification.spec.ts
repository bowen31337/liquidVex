/**
 * E2E Test: Order modification flow
 * Feature: Order modification flow (Feature 39)
 */

import { test, expect } from '@playwright/test';

test.describe('Order Modification Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application with test mode enabled
    await page.goto('/?testMode=true');

    // Wait for the main trading interface to be visible
    await page.waitForSelector('[data-testid="wallet-connect-button"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Close any modals that might be open (wallet modal, etc.)
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

  // Helper function to place a test order
  async function placeTestOrder(page: any, side: 'buy' | 'sell' = 'buy') {
    // Select side
    const sideTab = page.locator(`button:has-text("${side === 'buy' ? 'Buy / Long' : 'Sell / Short'}")`).first();
    await sideTab.click();

    // Select Limit order type
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Limit' });
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);

    // Fill price and size
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill(side === 'buy' ? '95.00' : '105.00');

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.0');

    // Submit order
    const submitButton = page.locator(side === 'buy' ? 'button.btn-buy' : 'button.btn-sell');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Confirm in modal
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Wait for success
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    const successToast = page.locator('[data-testid="toast"]', { hasText: /Order placed/ });
    await expect(successToast).toBeVisible({ timeout: 5000 });
  }

  test('should show Modify button for open orders', async ({ page }) => {
    // Step 1: Place a test order first
    await placeTestOrder(page, 'buy');

    // Step 2: Navigate to Open Orders tab
    const ordersTab = page.locator('button:has-text("Open Orders")');
    await expect(ordersTab).toBeVisible();
    await ordersTab.click();
    await page.waitForTimeout(500);

    // Step 3: Verify there are orders with Modify buttons
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    await page.waitForTimeout(1000);

    // Should have at least one order
    const modifyButtonCount = await modifyButtons.count();
    expect(modifyButtonCount).toBeGreaterThan(0);

    // Verify at least one Modify button is visible
    await expect(modifyButtons.first()).toBeVisible();
    // Verify it has the correct styling (bg-accent)
    await expect(modifyButtons.first()).toHaveClass(/bg-accent/);
    // Verify text
    await expect(modifyButtons.first()).toHaveText('Modify');
  });

  test('should open modification modal when Modify button is clicked', async ({ page }) => {
    // Step 1: Place a test order
    await placeTestOrder(page, 'buy');

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Click Modify button
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    await expect(modifyButtons.first()).toBeVisible();
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
  });

  test('should modify order price and size', async ({ page }) => {
    // Step 1: Place a test order
    await placeTestOrder(page, 'buy');

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Click Modify button
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    await expect(modifyButtons.first()).toBeVisible();
    await modifyButtons.first().click();
    await page.waitForTimeout(500);

    // Step 4: Verify modal is open and inputs are populated
    const modal = page.locator('[data-testid="order-modify-modal"]');
    await expect(modal).toBeVisible();

    // Get the price and size inputs - they should be populated by useEffect
    const priceInput = modal.locator('input[type="number"]').first();
    const sizeInput = modal.locator('input[type="number"]').nth(1);

    // Wait for values to be populated
    await expect(priceInput).toHaveValue(/95\.00/);
    await expect(sizeInput).toHaveValue(/1\.0/);

    // Step 5: Change price and size
    await priceInput.fill('98.00');
    await sizeInput.fill('0.5');

    // Step 6: Click Update Order (should be enabled now)
    const updateButton = modal.locator('button:has-text("Update Order")');
    await expect(updateButton).toBeEnabled();
    await updateButton.click();

    // Step 7: Verify success toast
    const successToast = page.locator('[data-testid="toast"]');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText(/modified successfully/);

    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });

  test('should cancel modification with Cancel button', async ({ page }) => {
    // Step 1: Place a test order
    await placeTestOrder(page, 'buy');

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Click Modify
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    await expect(modifyButtons.first()).toBeVisible();
    await modifyButtons.first().click();
    await page.waitForTimeout(500);

    // Step 4: Get modal and verify it's visible
    const modal = page.locator('[data-testid="order-modify-modal"]');
    await expect(modal).toBeVisible();

    // Step 5: Click Cancel button within the modal
    const cancelButton = modal.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    await page.waitForTimeout(300);

    // Step 6: Modal should be closed
    await expect(modal).not.toBeVisible();
  });

  test('should disable Update button when no changes are made', async ({ page }) => {
    // Step 1: Place a test order
    await placeTestOrder(page, 'buy');

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Click Modify
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    await modifyButtons.first().click();
    await page.waitForTimeout(500);

    // Step 4: Verify Update button is disabled (no changes)
    const modal = page.locator('[data-testid="order-modify-modal"]');
    const updateButton = modal.locator('button:has-text("Update Order")');
    await expect(updateButton).toBeDisabled();
  });

  test('should show current order values in modal', async ({ page }) => {
    // Step 1: Place a test order
    await placeTestOrder(page, 'buy');

    // Step 2: Navigate to Open Orders tab
    await page.locator('button:has-text("Open Orders")').click();
    await page.waitForTimeout(1000);

    // Step 3: Get current order values from table
    const table = page.locator('[data-testid="orders-table"] table');
    const firstRow = table.locator('tbody tr').first();
    const currentPrice = await firstRow.locator('td').nth(4).textContent();
    const currentSize = await firstRow.locator('td').nth(5).textContent();

    // Step 4: Click Modify and open modal
    const modifyButtons = page.locator('button[data-testid^="modify-order-"]');
    await modifyButtons.first().click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="order-modify-modal"]');
    await expect(modal).toBeVisible();

    // Step 5: Verify input values match current order
    const priceInput = modal.locator('input[type="number"]').first();
    const sizeInput = modal.locator('input[type="number"]').nth(1);

    // Wait for values to be populated
    const priceValue = await priceInput.inputValue();
    const sizeValue = await sizeInput.inputValue();

    // Values should match (with some formatting differences)
    expect(priceValue).toContain(currentPrice?.replace('$', '') || '');
    expect(sizeValue).toContain(currentSize || '');
  });
});
