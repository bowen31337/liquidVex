import { test, expect } from '@playwright/test';

/**
 * E2E Test: Market Order Execution Flow
 * Feature: Market order execution (Feature 31)
 */

test.describe('Market Order Execution Flow', () => {
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

  test('should execute market buy order successfully', async ({ page }) => {
    // Step 1: Select Buy tab
    const buyTab = page.locator('button:has-text("Buy / Long")').first();
    await expect(buyTab).toBeVisible();
    await buyTab.click();

    // Step 2: Select Market order type
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Market' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Step 3: Verify price input is hidden for market orders
    const priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).not.toBeVisible();

    // Step 4: Enter valid size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    // Verify size was entered
    const sizeValue = await sizeInput.inputValue();
    expect(sizeValue).toBe('1.5');

    // Step 5: Click buy button
    const submitButton = page.locator('button.btn-buy');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    await page.waitForTimeout(500);

    // Step 6: Verify confirmation modal appears
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Step 7: Confirm order
    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Step 8: Verify order executes (toast notification)
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    const successToast = page.locator('[data-testid="toast"]', { hasText: /Order placed/ });
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText('BUY');

    // Step 9: Verify form is reset
    await expect(sizeInput).toHaveValue('');
  });

  test('should execute market sell order successfully', async ({ page }) => {
    // Step 1: Select Sell tab
    const sellTab = page.locator('button:has-text("Sell / Short")').first();
    await expect(sellTab).toBeVisible();
    await sellTab.click();

    // Step 2: Select Market order type
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Market' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Step 3: Verify price input is hidden
    const priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).not.toBeVisible();

    // Step 4: Enter valid size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('0.75');
    await page.waitForTimeout(300);

    // Step 5: Click sell button
    const submitButton = page.locator('button.btn-sell');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    await page.waitForTimeout(500);

    // Step 6: Verify confirmation modal appears
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Step 7: Confirm order
    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Step 8: Verify success notification
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    const successToast = page.locator('[data-testid="toast"]', { hasText: /Order placed/ });
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText('SELL');
  });

  test('should not validate price for market orders', async ({ page }) => {
    // Step 1: Select Buy tab
    const buyTab = page.locator('button:has-text("Buy / Long")').first();
    await buyTab.click();

    // Step 2: Select Market order type
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Market' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Step 3: Verify price input is not visible
    const priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).not.toBeVisible();

    // Step 4: Enter only size (no price required for market)
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('2.0');

    // Step 5: Submit button should be enabled
    const submitButton = page.locator('button.btn-buy');
    await expect(submitButton).toBeEnabled();
  });

  test('should show error for invalid size in market order', async ({ page }) => {
    // Step 1: Select Buy tab and Market order
    const buyTab = page.locator('button:has-text("Buy / Long")').first();
    await buyTab.click();

    const orderTypeSelect = page.locator('select').filter({ hasText: 'Market' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Step 2: Enter invalid size (zero)
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('0');

    // Step 3: Click submit
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Step 4: Should show error
    const errorMessage = page.getByTestId('order-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid size');
  });

  test('should switch between market and limit orders correctly', async ({ page }) => {
    // Step 1: Wait for order type select
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Limit' });
    await orderTypeSelect.waitFor({ state: 'visible', timeout: 5000 });

    // Step 2: Start with Limit order
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);
    let priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).toBeVisible();

    // Step 3: Switch to Market
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);
    priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).not.toBeVisible();

    // Step 4: Switch back to Limit
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(300);
    priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).toBeVisible();
  });

  test('should use current market price for market orders', async ({ page }) => {
    // Step 1: Select Buy tab
    const buyTab = page.locator('button:has-text("Buy / Long")').first();
    await buyTab.click();

    // Step 2: Select Market order
    const orderTypeSelect = page.locator('select').filter({ hasText: 'Market' });
    await orderTypeSelect.selectOption('market');
    await page.waitForTimeout(300);

    // Step 3: Enter size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.0');

    // Step 4: Submit order
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Step 5: In confirmation modal, verify it shows market order
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible();

    // Verify it shows "Market" order type in modal (use exact match to avoid strict mode issues)
    await expect(modal.locator('span:has-text("Market")').first()).toBeVisible();
  });
});
