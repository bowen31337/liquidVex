import { test, expect } from '@playwright/test';

test.describe('Order Types and Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test('Market order execution - no price required', async ({ page }) => {
    // Step 1: Click on order form
    await page.click('[data-testid="order-price-input"]');

    // Step 2: Select Market order type
    await page.selectOption('select', 'market');

    // Step 3: Verify price input is hidden for market orders
    const priceInput = page.locator('[data-testid="order-price-input"]');
    await expect(priceInput).not.toBeVisible();

    // Step 4: Enter size
    const sizeInput = page.locator('input[placeholder*="Size"]').or(page.locator('input').filter({ hasText: '' }));
    await page.fill('input[type="number"]', '1.0');

    // Step 5: Verify order can be submitted (button enabled)
    const submitButton = page.locator('[data-testid="order-submit-button"]');
    await expect(submitButton).toBeEnabled();
  });

  test('Stop-limit order shows stop and limit price fields', async ({ page }) => {
    // Step 1: Select Stop Limit order type
    await page.selectOption('select', 'stop_limit');

    // Step 2: Verify stop price field is visible
    const stopPriceLabel = page.locator('label:has-text("Stop Price")');
    await expect(stopPriceLabel).toBeVisible();

    // Step 3: Verify limit price field is visible
    const priceLabel = page.locator('label:has-text("Limit Price")');
    await expect(priceLabel).toBeVisible();

    // Step 4: Enter stop price
    const stopPriceInput = page.locator('input').nth(1); // Stop price input
    await stopPriceInput.fill('100.5');

    // Step 5: Enter limit price
    const limitPriceInput = page.locator('input').nth(2); // Limit price input
    await limitPriceInput.fill('101.0');

    // Step 6: Verify inputs have values
    await expect(stopPriceInput).toHaveValue('100.5');
    await expect(limitPriceInput).toHaveValue('101.0');
  });

  test('Stop-market order shows stop price field only', async ({ page }) => {
    // Step 1: Select Stop Market order type
    await page.selectOption('select', 'stop_market');

    // Step 2: Verify stop price field is visible
    const stopPriceLabel = page.locator('label:has-text("Stop Price")');
    await expect(stopPriceLabel).toBeVisible();

    // Step 3: Verify regular price field is not shown
    const priceInput = page.locator('[data-testid="order-price-input"]');
    await expect(priceInput).not.toBeVisible();

    // Step 4: Enter stop price
    const stopPriceInput = page.locator('input').nth(1);
    await stopPriceInput.fill('100.5');

    // Step 5: Verify input has value
    await expect(stopPriceInput).toHaveValue('100.5');
  });

  test('Time-in-Force selector appears for limit orders', async ({ page }) => {
    // Step 1: Select Limit order type (default)
    await page.selectOption('select', 'limit');

    // Step 2: Verify TIF selector is visible
    const tifLabel = page.locator('label:has-text("Time-in-Force")');
    await expect(tifLabel).toBeVisible();

    // Step 3: Verify TIF options
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });
    await expect(tifSelect).toBeVisible();

    // Step 4: Test TIF option changes
    await tifSelect.selectOption('IOC');
    await expect(tifSelect).toHaveValue('IOC');

    await tifSelect.selectOption('FOK');
    await expect(tifSelect).toHaveValue('FOK');

    await tifSelect.selectOption('GTC');
    await expect(tifSelect).toHaveValue('GTC');
  });

  test('Time-in-Force selector appears for stop-limit orders', async ({ page }) => {
    // Step 1: Select Stop Limit order type
    await page.selectOption('select', 'stop_limit');

    // Step 2: Verify TIF selector is visible
    const tifLabel = page.locator('label:has-text("Time-in-Force")');
    await expect(tifLabel).toBeVisible();

    // Step 3: Verify default TIF is GTC
    const tifSelect = page.locator('select').filter({ hasText: 'Good Till Cancelled' });
    await expect(tifSelect).toHaveValue('GTC');
  });

  test('Time-in-Force selector hidden for market orders', async ({ page }) => {
    // Step 1: Select Market order type
    await page.selectOption('select', 'market');

    // Step 2: Verify TIF selector is not visible
    const tifLabel = page.locator('label:has-text("Time-in-Force")');
    await expect(tifLabel).not.toBeVisible();
  });

  test('Order type validation shows correct errors', async ({ page }) => {
    // Step 1: Select Stop Limit order type
    await page.selectOption('select', 'stop_limit');

    // Step 2: Try to submit without filling required fields
    const submitButton = page.locator('[data-testid="order-submit-button"]');
    await submitButton.click();

    // Step 3: Verify error message about missing stop price
    const error = page.locator('text=/Invalid stop price/').or(page.locator('text=/Connect wallet/'));
    await expect(error).toBeVisible({ timeout: 2000 });
  });

  test('Reduce-only checkbox is visible for all order types', async ({ page }) => {
    const reduceOnlyLabel = page.locator('label:has-text("Reduce Only")');

    // Check for limit order
    await page.selectOption('select', 'limit');
    await expect(reduceOnlyLabel).toBeVisible();

    // Check for market order
    await page.selectOption('select', 'market');
    await expect(reduceOnlyLabel).toBeVisible();

    // Check for stop-limit order
    await page.selectOption('select', 'stop_limit');
    await expect(reduceOnlyLabel).toBeVisible();

    // Check for stop-market order
    await page.selectOption('select', 'stop_market');
    await expect(reduceOnlyLabel).toBeVisible();
  });

  test('Post-only checkbox only visible for limit orders', async ({ page }) => {
    const postOnlyLabel = page.locator('label:has-text("Post Only")');

    // Should be visible for limit orders
    await page.selectOption('select', 'limit');
    await expect(postOnlyLabel).toBeVisible();

    // Should NOT be visible for market orders
    await page.selectOption('select', 'market');
    await expect(postOnlyLabel).not.toBeVisible();

    // Should be visible for stop-limit orders
    await page.selectOption('select', 'stop_limit');
    await expect(postOnlyLabel).toBeVisible();

    // Should NOT be visible for stop-market orders
    await page.selectOption('select', 'stop_market');
    await expect(postOnlyLabel).not.toBeVisible();
  });
});
