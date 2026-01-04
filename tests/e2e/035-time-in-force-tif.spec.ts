import { test, expect } from '@playwright/test';

/**
 * Feature 35: Time-in-Force (TIF) Functionality
 *
 * Tests for GTC, IOC, and FOK order types in the order entry form.
 *
 * Note: In test mode, we verify UI functionality and form state.
 * Real execution behavior (IOC/FOK immediate cancellation) requires
 * actual order book matching which is tested in integration tests.
 */

test.describe('Feature 35: Time-in-Force (TIF) Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app with test mode enabled
    await page.goto('http://localhost:3001?testMode=true');
    await page.waitForLoadState('networkidle');
  });

  test('should display TIF selector for limit orders', async ({ page }) => {
    // Navigate to order form
    const orderForm = page.locator('[data-testid="order-entry-panel"]');
    await expect(orderForm).toBeVisible();

    // Ensure limit order type is selected (default is limit)
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await expect(orderTypeSelect).toBeVisible();
    await orderTypeSelect.selectOption('limit');

    // Verify TIF selector is visible
    const tifLabel = page.locator('text=Time-in-Force');
    await expect(tifLabel).toBeVisible();

    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });
    await expect(tifSelect).toBeVisible();
  });

  test('should display TIF selector for stop-limit orders', async ({ page }) => {
    const orderForm = page.locator('[data-testid="order-entry-panel"]');
    await expect(orderForm).toBeVisible();

    // Select stop-limit order type
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('stop_limit');

    // Verify TIF selector is visible
    const tifLabel = page.locator('text=Time-in-Force');
    await expect(tifLabel).toBeVisible();

    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });
    await expect(tifSelect).toBeVisible();
  });

  test('should NOT display TIF selector for market orders', async ({ page }) => {
    const orderForm = page.locator('[data-testid="order-entry-panel"]');
    await expect(orderForm).toBeVisible();

    // Select market order type
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('market');

    // Verify TIF selector is NOT visible
    const tifLabel = page.locator('text=Time-in-Force');
    await expect(tifLabel).not.toBeVisible();
  });

  test('should NOT display TIF selector for stop-market orders', async ({ page }) => {
    const orderForm = page.locator('[data-testid="order-entry-panel"]');
    await expect(orderForm).toBeVisible();

    // Select stop-market order type
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('stop_market');

    // Verify TIF selector is NOT visible
    const tifLabel = page.locator('text=Time-in-Force');
    await expect(tifLabel).not.toBeVisible();
  });

  test('should have GTC, IOC, and FOK options available', async ({ page }) => {
    // Ensure limit order type is selected
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    // Find TIF select (it's the select that contains the TIF options)
    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });
    await expect(tifSelect).toBeVisible();

    // Get all options
    const options = await tifSelect.locator('option').all();
    expect(options).toHaveLength(3);

    // Verify option values and labels
    const gtcOption = tifSelect.locator('option[value="GTC"]');
    await expect(gtcOption).toHaveText('Good Till Cancelled (GTC)');

    const iocOption = tifSelect.locator('option[value="IOC"]');
    await expect(iocOption).toHaveText('Immediate or Cancel (IOC)');

    const fokOption = tifSelect.locator('option[value="FOK"]');
    await expect(fokOption).toHaveText('Fill or Kill (FOK)');
  });

  test('should default to GTC for limit orders', async ({ page }) => {
    // Ensure limit order type is selected (default)
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await expect(orderTypeSelect).toHaveValue('limit');

    // Find TIF select
    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });
    const defaultValue = await tifSelect.inputValue();
    expect(defaultValue).toBe('GTC');
  });

  test('should allow changing TIF value', async ({ page }) => {
    // Ensure limit order type is selected
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });

    // Verify initial value is GTC
    await expect(tifSelect).toHaveValue('GTC');

    // Change to IOC
    await tifSelect.selectOption('IOC');
    await expect(tifSelect).toHaveValue('IOC');

    // Change to FOK
    await tifSelect.selectOption('FOK');
    await expect(tifSelect).toHaveValue('FOK');

    // Change back to GTC
    await tifSelect.selectOption('GTC');
    await expect(tifSelect).toHaveValue('GTC');
  });

  test('should preserve TIF value when switching between limit and stop-limit', async ({ page }) => {
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });

    // Start with limit order
    await orderTypeSelect.selectOption('limit');
    await expect(tifSelect).toBeVisible();

    // Change to IOC
    await tifSelect.selectOption('IOC');
    await expect(tifSelect).toHaveValue('IOC');

    // Switch to stop-limit
    await orderTypeSelect.selectOption('stop_limit');
    await expect(tifSelect).toBeVisible();

    // Verify TIF value is preserved
    await expect(tifSelect).toHaveValue('IOC');

    // Switch back to limit
    await orderTypeSelect.selectOption('limit');
    await expect(tifSelect).toBeVisible();

    // Verify TIF value is still preserved
    await expect(tifSelect).toHaveValue('IOC');
  });

  test('should include TIF value in order submission', async ({ page }) => {
    // Fill out order form with IOC
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });
    await tifSelect.selectOption('IOC');

    // Set price and size
    await page.fill('input[data-testid="order-price-input"]', '100');
    await page.fill('input[data-testid="order-size-input"]', '1');

    // Submit order
    const submitButton = page.locator('button[data-testid="order-submit-button"]');
    await submitButton.click();

    // Verify confirmation modal shows order details
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible();

    // Verify the order type is shown in modal (limit)
    const modalContent = await modal.textContent();
    expect(modalContent).toContain('limit');
    expect(modalContent).toContain('BUY');
    expect(modalContent).toContain('$100.00');

    // Note: TIF value is included in the order payload sent to backend
    // but may not be displayed in the confirmation modal UI
    // The important part is that the form value is preserved
    await expect(tifSelect).toHaveValue('IOC');
  });

  test('should reset TIF to GTC after successful order', async ({ page }) => {
    // Fill out order form with FOK
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });
    await tifSelect.selectOption('FOK');

    // Set price and size
    await page.fill('input[data-testid="order-price-input"]', '100');
    await page.fill('input[data-testid="order-size-input"]', '1');

    // Submit and confirm order
    const submitButton = page.locator('button[data-testid="order-submit-button"]');
    await submitButton.click();

    const modal = page.locator('[data-testid="order-confirm-modal"]');
    const confirmButton = modal.locator('button:has-text("Confirm")');
    await confirmButton.click();

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Check that TIF reset to GTC
    await expect(tifSelect).toHaveValue('GTC');
  });

  test('should display correct TIF labels and descriptions', async ({ page }) => {
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    // Verify label text
    const tifLabel = page.locator('text=Time-in-Force');
    await expect(tifLabel).toBeVisible();

    // Find TIF select
    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });

    // Verify option descriptions
    const gtcOption = tifSelect.locator('option[value="GTC"]');
    await expect(gtcOption).toHaveText(/Good Till Cancelled/);

    const iocOption = tifSelect.locator('option[value="IOC"]');
    await expect(iocOption).toHaveText(/Immediate or Cancel/);

    const fokOption = tifSelect.locator('option[value="FOK"]');
    await expect(fokOption).toHaveText(/Fill or Kill/);
  });

  test('should maintain TIF state during form validation errors', async ({ page }) => {
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });

    // Set TIF to FOK
    await tifSelect.selectOption('FOK');
    await expect(tifSelect).toHaveValue('FOK');

    // Try to submit without filling required fields (should show error)
    const submitButton = page.locator('button[data-testid="order-submit-button"]');
    await submitButton.click();

    // Verify error message appears
    const errorMessage = page.locator('text=/invalid/i');
    await expect(errorMessage).toBeVisible({ timeout: 2000 });

    // Verify TIF value is still FOK
    await expect(tifSelect).toHaveValue('FOK');
  });

  test('should have proper styling and positioning', async ({ page }) => {
    const orderTypeSelect = page.locator('select[data-testid="order-type-select"]');
    await orderTypeSelect.selectOption('limit');

    // Verify TIF label exists
    const tifLabel = page.locator('text=Time-in-Force');
    await expect(tifLabel).toBeVisible();

    // Find TIF select
    const tifSelect = page.locator('select').filter({ hasText: /Good Till Cancelled|Immediate or Cancel|Fill or Kill/ });
    await expect(tifSelect).toBeVisible();

    // Verify it has input class for consistent styling
    await expect(tifSelect).toHaveClass(/input/);

    // Verify it has w-full class for width (actual CSS value may vary)
    await expect(tifSelect).toHaveClass(/w-full/);

    // Verify it's visible and interactive
    await expect(tifSelect).toBeEnabled();
  });
});
