import { test, expect } from '@playwright/test';

test.describe('Time-in-Force (TIF) Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode to bypass wallet requirement
    await page.goto('/?testMode=true');
  });

  test('GTC: Good Till Cancelled order placement', async ({ page }) => {
    // Step 1: Order entry form should be visible
    await expect(page.getByTestId('order-entry-panel')).toBeVisible();

    // Step 2: Select Limit order type
    await page.getByTestId('order-type-select').selectOption('limit');

    // Step 3: Verify TIF dropdown is visible for limit orders
    await expect(page.locator('select').filter({ hasText: 'Good Till Cancelled' })).toBeVisible();

    // Step 4: Verify GTC is the default option
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });
    await expect(tifSelect).toHaveValue('GTC');

    // Step 5: Fill in order details
    await page.getByTestId('order-price-input').fill('95000');
    await page.getByTestId('order-size-input').fill('0.1');

    // Step 6: Submit order
    await page.getByTestId('order-submit-button').click();

    // Step 7: Wait for modal and confirm order
    await expect(page.getByTestId('order-confirm-modal')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Confirm Order' }).click();

    // Step 8: Verify success toast appears
    const successToast = page.locator('[data-testid="toast"]', { hasText: /Order placed/ });
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Step 9: Navigate to Open Orders tab
    const openOrdersTab = page.locator('button').filter({ hasText: 'Open Orders' });
    await openOrdersTab.click();

    // Step 10: Verify order appears in open orders
    await expect(page.getByTestId('orders-table')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('orders-table')).toContainText('0.1', { timeout: 5000 });
  });

  test('TIF dropdown visibility for different order types', async ({ page }) => {
    // Step 1: Select Limit order type
    await page.getByTestId('order-type-select').selectOption('limit');
    await expect(page.locator('select').filter({ hasText: 'Good Till Cancelled' })).toBeVisible();

    // Step 2: Select Market order type
    await page.getByTestId('order-type-select').selectOption('market');
    await expect(page.locator('select').filter({ hasText: 'Good Till Cancelled' })).not.toBeVisible();

    // Step 3: Select Stop Market order type
    await page.getByTestId('order-type-select').selectOption('stop_market');
    await expect(page.locator('select').filter({ hasText: 'Good Till Cancelled' })).not.toBeVisible();

    // Step 4: Select Stop Limit order type
    await page.getByTestId('order-type-select').selectOption('stop_limit');
    await expect(page.locator('select').filter({ hasText: 'Good Till Cancelled' })).toBeVisible();
  });

  test('IOC: Immediate or Cancel option selection', async ({ page }) => {
    // Step 1: Select Limit order type
    await page.getByTestId('order-type-select').selectOption('limit');

    // Step 2: Locate TIF dropdown
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });

    // Step 3: Select IOC option
    await tifSelect.selectOption('IOC');

    // Step 4: Verify IOC is selected
    await expect(tifSelect).toHaveValue('IOC');

    // Step 5: Verify dropdown shows correct text
    await expect(tifSelect).toContainText('Immediate or Cancel');

    // Step 6: Fill order details
    await page.getByTestId('order-price-input').fill('94000');
    await page.getByTestId('order-size-input').fill('0.1');

    // Step 7: Submit order
    await page.getByTestId('order-submit-button').click();

    // Step 8: Confirm in modal
    await expect(page.getByTestId('order-confirm-modal')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Confirm Order' }).click();

    // Step 9: Verify success message
    const successToast = page.locator('[data-testid="toast"]', { hasText: /Order placed/ });
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('FOK: Fill or Kill option selection', async ({ page }) => {
    // Step 1: Select Limit order type
    await page.getByTestId('order-type-select').selectOption('limit');

    // Step 2: Locate TIF dropdown
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });

    // Step 3: Select FOK option
    await tifSelect.selectOption('FOK');

    // Step 4: Verify FOK is selected
    await expect(tifSelect).toHaveValue('FOK');

    // Step 5: Verify dropdown shows correct text
    await expect(tifSelect).toContainText('Fill or Kill');

    // Step 6: Fill order details
    await page.getByTestId('order-price-input').fill('96000');
    await page.getByTestId('order-size-input').fill('0.1');

    // Step 7: Submit order
    await page.getByTestId('order-submit-button').click();

    // Step 8: Confirm in modal
    await expect(page.getByTestId('order-confirm-modal')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Confirm Order' }).click();

    // Step 9: Verify success message
    const successToast = page.locator('[data-testid="toast"]', { hasText: /Order placed/ });
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('TIF options persist across order type changes', async ({ page }) => {
    // Step 1: Select Limit order type
    await page.getByTestId('order-type-select').selectOption('limit');

    // Step 2: Select IOC TIF option
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });
    await tifSelect.selectOption('IOC');
    await expect(tifSelect).toHaveValue('IOC');

    // Step 3: Switch to Market order (TIF should be hidden)
    await page.getByTestId('order-type-select').selectOption('market');
    await expect(page.locator('select').filter({ hasText: 'Good Till Cancelled' })).not.toBeVisible();

    // Step 4: Switch back to Limit (TIF should reappear with IOC selected)
    await page.getByTestId('order-type-select').selectOption('limit');
    await expect(page.locator('select').filter({ hasText: 'Good Till Cancelled' })).toBeVisible();
    await expect(tifSelect).toHaveValue('IOC');

    // Step 5: Change to FOK
    await tifSelect.selectOption('FOK');
    await expect(tifSelect).toHaveValue('FOK');

    // Step 6: Switch to Stop Limit (TIF should be visible with FOK selected)
    await page.getByTestId('order-type-select').selectOption('stop_limit');
    await expect(page.locator('select').filter({ hasText: 'Good Till Cancelled' })).toBeVisible();
    await expect(tifSelect).toHaveValue('FOK');
  });

  test('TIF with Sell orders', async ({ page }) => {
    // Step 1: Switch to Sell side
    await page.click('button:has-text("Sell / Short")');

    // Step 2: Verify TIF dropdown is visible
    await page.getByTestId('order-type-select').selectOption('limit');
    await expect(page.locator('select').filter({ hasText: 'Good Till Cancelled' })).toBeVisible();

    // Step 3: Test each TIF option with sell order
    const tifOptions = ['GTC', 'IOC', 'FOK'];
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });

    for (const tif of tifOptions) {
      // Select TIF option
      await tifSelect.selectOption(tif);
      await expect(tifSelect).toHaveValue(tif);

      // Fill order details
      await page.getByTestId('order-price-input').fill('97000');
      await page.getByTestId('order-size-input').fill('0.1');

      // Submit order
      await page.getByTestId('order-submit-button').click();
      await expect(page.getByTestId('order-confirm-modal')).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: 'Confirm Order' }).click();

      // Verify success
      const successToast = page.locator('[data-testid="toast"]', { hasText: /Order placed/ }).first();
      await expect(successToast).toBeVisible({ timeout: 5000 });

      // Small delay between orders
      await page.waitForTimeout(500);
    }
  });

  test('TIF dropdown styling and labels', async ({ page }) => {
    // Step 1: Select Limit order type
    await page.getByTestId('order-type-select').selectOption('limit');

    // Step 2: Verify TIF label is present
    await expect(page.locator('label').filter({ hasText: 'TIME-IN-FORCE' })).toBeVisible();

    // Step 3: Verify all three options are present
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });
    await expect(tifSelect).toBeVisible();

    const options = await tifSelect.locator('option').all();
    expect(options).toHaveLength(3);

    // Step 4: Verify option texts
    const optionTexts = await Promise.all(options.map(opt => opt.textContent()));
    expect(optionTexts).toContain('Good Till Cancelled (GTC)');
    expect(optionTexts).toContain('Immediate or Cancel (IOC)');
    expect(optionTexts).toContain('Fill or Kill (FOK)');

    // Step 5: Verify option values
    const optionValues = await Promise.all(options.map(opt => opt.getAttribute('value')));
    expect(optionValues).toContain('GTC');
    expect(optionValues).toContain('IOC');
    expect(optionValues).toContain('FOK');
  });

  test('Complete workflow: GTC order placement and verification', async ({ page }) => {
    // Step 1: Verify default TIF is GTC
    await page.getByTestId('order-type-select').selectOption('limit');
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });
    await expect(tifSelect).toHaveValue('GTC');

    // Step 2: Place buy order with GTC
    await page.getByTestId('order-price-input').fill('94500');
    await page.getByTestId('order-size-input').fill('0.5');
    await page.getByTestId('order-submit-button').click();
    await expect(page.getByTestId('order-confirm-modal')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Confirm Order' }).click();
    const successToast = page.locator('[data-testid="toast"]', { hasText: /Order placed/ });
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Step 3: Check open orders
    const openOrdersTab = page.locator('button').filter({ hasText: 'Open Orders' });
    await openOrdersTab.click();
    await expect(page.getByTestId('orders-table')).toBeVisible({ timeout: 5000 });

    // Step 4: Verify order is present (in test mode, orders remain in open orders)
    await expect(page.getByTestId('orders-table')).toContainText('0.5');
  });

  test('Stop Limit order with TIF options', async ({ page }) => {
    // Step 1: Select Stop Limit order type
    await page.getByTestId('order-type-select').selectOption('stop_limit');

    // Step 2: Verify both price inputs are visible
    await expect(page.getByPlaceholder('0.00').first()).toBeVisible(); // Stop price
    await expect(page.getByTestId('order-price-input')).toBeVisible(); // Limit price

    // Step 3: Verify TIF dropdown is visible
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });
    await expect(tifSelect).toBeVisible();

    // Step 4: Test with GTC option
    await tifSelect.selectOption('GTC');
    await expect(tifSelect).toHaveValue('GTC');

    // Fill in both prices
    const allNumberInputs = page.locator('input[type="number"]');
    await allNumberInputs.nth(0).fill('96000'); // Stop price (trigger)
    await page.getByTestId('order-price-input').fill('95500'); // Limit price

    // Fill size
    await page.getByTestId('order-size-input').fill('0.1');

    // Submit
    await page.getByTestId('order-submit-button').click();
    await expect(page.getByTestId('order-confirm-modal')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Confirm Order' }).click();

    // Verify success
    const successToast = page.locator('[data-testid="toast"]', { hasText: /Order placed/ });
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });
});
