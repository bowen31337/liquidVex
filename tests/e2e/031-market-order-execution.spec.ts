import { test, expect } from '@playwright/test';

test.describe('Market Order Execution Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for main content to load instead of networkidle (WebSocket keeps network active)
    await page.waitForSelector('[data-testid="order-submit-button"]', { timeout: 10000 });
  });

  test('should execute market buy order successfully', async ({ page }) => {
    // Step 1 & 2: Ensure wallet is connected (or connect it)
    const walletButton = page.getByTestId('wallet-connect-button');
    const isWalletConnected = await walletButton.isVisible().catch(() => false);

    if (isWalletConnected) {
      await walletButton.click();
      // Mock wallet connection would happen here
      await page.waitForTimeout(500);
    }

    // Step 3: Select Buy tab (use first to avoid strict mode violation with submit button)
    const buyTab = page.getByRole('button', { name: /Buy \/ Long/i }).first();
    await expect(buyTab).toBeVisible();
    await buyTab.click();

    // Step 4: Select Market order type
    const orderTypeLabel = page.getByText('Order Type');
    const orderTypeSelect = page.locator('select').nth(0); // First select in order form
    await orderTypeSelect.selectOption('market');

    // Verify price input is hidden for market orders
    const priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).not.toBeVisible();

    // Step 5: Enter valid size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await expect(sizeInput).toHaveValue('1.5');

    // Step 6: Click buy button
    const submitButton = page.getByTestId('order-submit-button');
    await expect(submitButton).toContainText('Buy / Long');
    await submitButton.click();

    // Step 7: Verify confirmation modal appears
    const confirmModal = page.getByTestId(/order-confirm-modal/i);
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    // Step 8: Confirm order
    const confirmButton = page.getByRole('button', { name: /Confirm/i });
    await confirmButton.click();

    // Step 9: Verify order executes (toast notification)
    const successToast = page.getByTestId(/toast/i).filter({ hasText: /Order placed/i });
    await expect(successToast).toBeVisible({ timeout: 10000 });

    // Step 10: Verify form is reset after successful order
    await expect(sizeInput).toHaveValue('');
  });

  test('should execute market sell order successfully', async ({ page }) => {
    // Connect wallet
    const walletButton = page.getByTestId('wallet-connect-button');
    const isWalletConnected = await walletButton.isVisible().catch(() => false);

    if (isWalletConnected) {
      await walletButton.click();
      await page.waitForTimeout(500);
    }

    // Select Sell tab (use first to avoid strict mode violation)
    const sellTab = page.getByRole('button', { name: /Sell \/ Short/i }).first();
    await expect(sellTab).toBeVisible();
    await sellTab.click();

    // Select Market order type
    const orderTypeSelect = page.locator('select').nth(0);
    await orderTypeSelect.selectOption('market');

    // Verify price input is hidden
    const priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).not.toBeVisible();

    // Enter valid size
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('0.75');
    await expect(sizeInput).toHaveValue('0.75');

    // Click sell button
    const submitButton = page.getByTestId('order-submit-button');
    await expect(submitButton).toContainText('Sell / Short');
    await submitButton.click();

    // Verify confirmation modal appears
    const confirmModal = page.getByTestId(/order-confirm-modal/i);
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    // Confirm order
    const confirmButton = page.getByRole('button', { name: /Confirm/i });
    await confirmButton.click();

    // Verify success notification
    const successToast = page.getByTestId(/toast/i).filter({ hasText: /Order placed/i });
    await expect(successToast).toBeVisible({ timeout: 10000 });
  });

  test('should not validate price for market orders', async ({ page }) => {
    // Connect wallet
    const walletButton = page.getByTestId('wallet-connect-button');
    if (await walletButton.isVisible().catch(() => false)) {
      await walletButton.click();
      await page.waitForTimeout(500);
    }

    // Ensure Buy tab is selected (use first to avoid strict mode)
    const buyTab = page.getByRole('button', { name: /Buy \/ Long/i }).first();
    await buyTab.click();

    // Select Market order type
    const orderTypeSelect = page.locator('select').nth(0);
    await orderTypeSelect.selectOption('market');

    // Verify price input is not visible
    const priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).not.toBeVisible();

    // Enter only size (no price required for market)
    const sizeInput = page.locator('input[placeholder="0.00"]').nth(1);
    await sizeInput.fill('2.0');

    // Submit button should be enabled
    const submitButton = page.getByTestId('order-submit-button');
    await expect(submitButton).toBeEnabled();
  });

  test('should show error for invalid size in market order', async ({ page }) => {
    // Connect wallet
    const walletButton = page.getByTestId('wallet-connect-button');
    if (await walletButton.isVisible().catch(() => false)) {
      await walletButton.click();
      await page.waitForTimeout(500);
    }

    // Select Buy tab and Market order (use first to avoid strict mode)
    const buyTab = page.getByRole('button', { name: /Buy \/ Long/i }).first();
    await buyTab.click();

    const orderTypeSelect = page.locator('select').nth(0);
    await orderTypeSelect.selectOption('market');

    // Enter invalid size (zero or negative)
    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('0');

    // Click submit
    const submitButton = page.getByTestId('order-submit-button');
    await submitButton.click();

    // Should show error
    const errorMessage = page.locator('text=Invalid size');
    await expect(errorMessage).toBeVisible();
  });

  test('should switch between market and limit orders correctly', async ({ page }) => {
    // Connect wallet
    const walletButton = page.getByTestId('wallet-connect-button');
    if (await walletButton.isVisible().catch(() => false)) {
      await walletButton.click();
      await page.waitForTimeout(500);
    }

    // Wait for order type select to be visible and ready
    const orderTypeSelect = page.locator('select').nth(0);
    await orderTypeSelect.waitFor({ state: 'visible', timeout: 5000 });

    // Start with Limit order
    await orderTypeSelect.selectOption('limit');
    let priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).toBeVisible();

    // Switch to Market
    await orderTypeSelect.selectOption('market');
    priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).not.toBeVisible();

    // Switch back to Limit
    await orderTypeSelect.selectOption('limit');
    priceInput = page.getByTestId('order-price-input');
    await expect(priceInput).toBeVisible();
  });

  test('should use current market price for market orders', async ({ page }) => {
    // Connect wallet
    const walletButton = page.getByTestId('wallet-connect-button');
    if (await walletButton.isVisible().catch(() => false)) {
      await walletButton.click();
      await page.waitForTimeout(500);
    }

    // Select Buy tab and Market order (use first to avoid strict mode)
    const buyTab = page.getByRole('button', { name: /Buy \/ Long/i }).first();
    await buyTab.click();

    const orderTypeSelect = page.locator('select').nth(0);
    await orderTypeSelect.selectOption('market');

    // Enter size
    const sizeInput = page.locator('input[placeholder="0.00"]').nth(1);
    await sizeInput.fill('1.0');

    // Submit order
    const submitButton = page.getByTestId('order-submit-button');
    await submitButton.click();

    // In confirmation modal, verify it shows market order
    const confirmModal = page.getByTestId(/order-confirm-modal/i);
    await expect(confirmModal).toBeVisible();

    // Verify it shows "Market" order type in modal
    await expect(confirmModal).toContainText('Market');
  });
});
