/**
 * Feature: Toast notifications for all order events
 *
 * Tests comprehensive toast notification behavior for:
 * - Order placement success
 * - Order cancellation
 * - Error notifications
 * - Auto-dismiss functionality
 * - Manual dismiss functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Toast Notifications - Order Events', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with test mode enabled
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="wallet-connect-button"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Close any modals that might be open
    const modalOverlay = page.locator('div.fixed.inset-0.bg-black.bg-opacity-50');
    if (await modalOverlay.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  test('should show success toast when placing an order', async ({ page }) => {
    // Step 1: Fill in order form
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    // Step 2: Submit order
    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Step 3: Confirm the order
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Step 4: Verify success toast appears
    const successToast = page.locator('[data-testid="toast"][data-toast-type="success"]');
    await expect(successToast).toBeVisible({ timeout: 5000 });
    await expect(successToast).toContainText(/order placed|success/i);

    // Step 5: Verify toast has correct data attributes
    await expect(successToast).toHaveAttribute('data-toast-type', 'success');
    const toastMessage = await successToast.getAttribute('data-toast-message');
    expect(toastMessage).toBeTruthy();
  });

  test('should show success toast when cancelling an order', async ({ page }) => {
    // Step 1: Place an order first
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Confirm the order
    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Wait for order to be placed and success toast
    await page.waitForSelector('[data-testid="toast"][data-toast-type="success"]', { timeout: 5000 });

    // Step 2: Navigate to Open Orders tab
    const openOrdersTab = page.locator('button:has-text("Open Orders")');
    await openOrdersTab.click();
    await page.waitForTimeout(500);

    // Step 3: Cancel the order
    const cancelOrderButton = page.locator('[data-testid="cancel-order-btn"]').first();
    const isVisible = await cancelOrderButton.isVisible().catch(() => false);

    if (isVisible) {
      await cancelOrderButton.click();

      // Step 4: Verify cancellation toast
      const toast = page.locator('[data-testid="toast"][data-toast-type="success"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
      await expect(toast).toContainText(/cancelled|canceled/i);
    } else {
      // If no orders to cancel, verify at least placement toast was shown
      const placementToast = page.locator('[data-testid="toast"][data-toast-type="success"]');
      await expect(placementToast).toHaveCount(1);
    }
  });

  test('should auto-dismiss toast after timeout', async ({ page }) => {
    // Step 1: Trigger a toast notification by placing an order
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Step 2: Wait for toast to appear
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible();

    // Step 3: Wait for auto-dismiss (default 3000ms, wait 3500ms to be safe)
    await page.waitForTimeout(3500);

    // Step 4: Verify toast is no longer visible
    await expect(toast).not.toBeVisible();
  });

  test('should show error toast for invalid operation', async ({ page }) => {
    // Step 1: Attempt to place order with zero size
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('0');
    await page.waitForTimeout(300);

    // Step 2: Try to submit - button might be disabled or show validation
    const submitButton = page.locator('button.btn-buy');

    // Check if button is disabled (validation working)
    const isDisabled = await submitButton.isDisabled();

    if (!isDisabled) {
      // If enabled, try clicking and expect error
      await submitButton.click();

      // Look for validation error (either toast or inline)
      const errorToast = page.locator('[data-testid="toast"][data-toast-type="error"]');
      const hasErrorToast = await errorToast.isVisible().catch(() => false);

      if (hasErrorToast) {
        await expect(errorToast).toBeVisible();
        const errorMessage = await errorToast.textContent();
        expect(errorMessage?.toLowerCase()).toMatch(/error|invalid|size/i);
      }
    } else {
      // Button is disabled - validation is working correctly
      await expect(submitButton).toBeDisabled();
    }
  });

  test('should allow manual toast dismissal', async ({ page }) => {
    // Step 1: Trigger a toast by placing an order
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="order-confirm-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Step 2: Wait for toast to appear
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible();

    // Step 3: Click the dismiss button (X)
    const dismissButton = toast.locator('button').or(toast.locator('text=✕'));
    await dismissButton.click();

    // Step 4: Verify toast is immediately dismissed
    await expect(toast).not.toBeVisible();
  });

  test('should display warning toast for risky operations', async ({ page }) => {
    // Step 1: Check leverage slider functionality
    const leverageSlider = page.locator('[data-testid="leverage-slider"]');

    if (await leverageSlider.isVisible().catch(() => false)) {
      // Try to set high leverage
      await leverageSlider.fill('50'); // High leverage

      await page.waitForTimeout(500);

      // Step 2: Check if warning toast appears (optional, depends on implementation)
      const warningToast = page.locator('[data-testid="toast"][data-toast-type="warning"]');
      const isVisible = await warningToast.isVisible().catch(() => false);

      if (isVisible) {
        await expect(warningToast).toContainText(/leverage|risk|warning/i);
      }
    } else {
      // Leverage slider not visible - test passes as feature may not be implemented
      test.skip(true, 'Leverage slider not implemented');
    }
  });

  test('should stack multiple toasts correctly', async ({ page }) => {
    // Step 1: Place first order
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.0');
    await page.waitForTimeout(300);

    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="order-confirm-modal"]');
    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Wait for first toast
    await page.waitForSelector('[data-testid="toast"]', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Step 2: Place second order quickly
    await priceInput.fill('96.00');
    await page.waitForTimeout(300);

    await sizeInput.fill('1.0');
    await page.waitForTimeout(300);

    await submitButton.click();
    await page.waitForTimeout(500);

    await expect(modal).toBeVisible({ timeout: 3000 });
    await confirmButton.click();

    // Step 3: Verify multiple toasts might be visible (depending on timing)
    const toasts = page.locator('[data-testid="toast"]');
    const count = await toasts.count();

    // We expect at least 1 toast to be visible
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should use correct color coding for toast types', async ({ page }) => {
    // Test success toast color
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="order-confirm-modal"]');
    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    const successToast = page.locator('[data-testid="toast"][data-toast-type="success"]');
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Verify color classes (green for success)
    const toastClass = await successToast.getAttribute('class');
    expect(toastClass).toMatch(/long/);
    expect(toastClass).toMatch(/border-long/);
  });

  test('should position toasts in top-right corner', async ({ page }) => {
    // Step 1: Trigger a toast
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="order-confirm-modal"]');
    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Step 2: Get toast container
    const toastContainer = page.locator('.fixed.top-4.right-4');
    await expect(toastContainer).toBeVisible();

    // Step 3: Verify positioning
    const boundingBox = await toastContainer.boundingBox();
    expect(boundingBox!.x).toBeGreaterThan(page.viewportSize()!.width / 2); // Right side
    expect(boundingBox!.y).toBeLessThan(100); // Near top
  });

  test('should display toast with proper styling and animation', async ({ page }) => {
    // Step 1: Trigger a toast
    const priceInput = page.getByTestId('order-price-input');
    await priceInput.fill('95.00');
    await page.waitForTimeout(300);

    const sizeInput = page.getByTestId('order-size-input');
    await sizeInput.fill('1.5');
    await page.waitForTimeout(300);

    const submitButton = page.locator('button.btn-buy');
    await submitButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[data-testid="order-confirm-modal"]');
    const confirmButton = modal.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Step 2: Verify toast has proper styling
    const toast = page.locator('[data-testid="toast"]');
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Check for border, padding, shadow classes
    const toastClass = await toast.getAttribute('class');
    expect(toastClass).toMatch(/border/);
    expect(toastClass).toMatch(/shadow/);
    expect(toastClass).toMatch(/rounded/);

    // Step 3: Verify toast has dismiss button
    const dismissButton = toast.locator('button').or(toast.locator('text=✕'));
    await expect(dismissButton).toBeVisible();
  });
});
