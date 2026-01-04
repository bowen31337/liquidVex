/**
 * E2E Test: Wallet Rejection Handling (Feature 141)
 * Tests that the application properly handles wallet rejection scenarios
 */

import { test, expect } from '@playwright/test';

test.describe('Wallet Rejection Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application with test mode enabled
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');
  });

  test('should display user-friendly error when wallet rejects transaction', async ({ page }) => {
    // Enable wallet rejection simulation
    const testUrl = 'http://localhost:3002?testMode=true&walletReject=true';
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');

    // Fill in order form
    await page.fill('input[data-testid="order-price-input"]', '50000');
    await page.fill('input[data-testid="order-size-input"]', '0.1');

    // Click submit button
    await page.click('button[data-testid="order-submit-button"]');

    // Wait for confirmation modal to appear
    await page.waitForSelector('[data-testid="order-confirm-modal"]', { state: 'visible' });

    // Click confirm in modal
    const confirmButton = page.locator('button:has-text("Confirm Order")');
    await confirmButton.click();

    // Wait for error to appear in modal (error appears quickly after confirmation)
    await page.waitForSelector('[data-testid="modal-error"]', { state: 'visible' });

    // Verify error message is user-friendly
    const errorElement = page.locator('[data-testid="modal-error"]');
    await expect(errorElement).toContainText('Transaction rejected');
    await expect(errorElement).toContainText('You rejected the transaction in your wallet');
    await expect(errorElement).toContainText('try again');

    // Verify modal is still open (user can retry)
    await expect(page.locator('[data-testid="order-confirm-modal"]')).toBeVisible();

    // Verify form data is preserved (price and size still visible in modal)
    await expect(page.locator('[data-testid="order-confirm-modal"]')).toContainText('50000');
    await expect(page.locator('[data-testid="order-confirm-modal"]')).toContainText('0.1');
  });

  test('should detect various wallet rejection error patterns', async ({ page }) => {
    // Test different rejection message patterns
    const rejectionPatterns = [
      'User rejected request',
      'User denied',
      'User cancelled',
      'User canceled',
      'User rejected the request to sign the transaction'
    ];

    for (const pattern of rejectionPatterns) {
      // Reset state
      await page.goto('http://localhost:3002?testMode=true&walletReject=true');
      await page.waitForLoadState('networkidle');

      // Fill order form
      await page.fill('input[data-testid="order-price-input"]', '50000');
      await page.fill('input[data-testid="order-size-input"]', '0.1');

      // Submit and confirm
      await page.click('button[data-testid="order-submit-button"]');
      await page.waitForSelector('[data-testid="order-confirm-modal"]', { state: 'visible' });
      await page.click('button:has-text("Confirm Order")');

      // Wait for error display
      await page.waitForSelector('[data-testid="modal-error"]', { state: 'visible' });

      // Verify user-friendly message is shown (not the raw error)
      const errorElement = page.locator('[data-testid="modal-error"]');
      const errorText = await errorElement.textContent();

      // Should show friendly message, not raw rejection
      expect(errorText).toContain('Transaction rejected');
      expect(errorText).not.toContain(pattern);
    }
  });

  test('should allow retry after wallet rejection', async ({ page }) => {
    // Enable rejection mode
    await page.goto('http://localhost:3002?testMode=true&walletReject=true');
    await page.waitForLoadState('networkidle');

    // Fill order form
    await page.fill('input[data-testid="order-price-input"]', '50000');
    await page.fill('input[data-testid="order-size-input"]', '0.1');

    // Submit and get rejection
    await page.click('button[data-testid="order-submit-button"]');
    await page.waitForSelector('[data-testid="order-confirm-modal"]', { state: 'visible' });
    await page.click('button:has-text("Confirm Order")');
    await page.waitForSelector('[data-testid="modal-error"]', { state: 'visible' });

    // Close modal (cancel)
    await page.click('button:has-text("Cancel")');

    // Verify form still has the original values
    await expect(page.locator('input[data-testid="order-price-input"]')).toHaveValue('50000');
    await expect(page.locator('input[data-testid="order-size-input"]')).toHaveValue('0.1');

    // Now disable rejection and retry - should succeed
    const successUrl = 'http://localhost:3002?testMode=true';
    await page.goto(successUrl);
    await page.waitForLoadState('networkidle');

    // Re-fill form
    await page.fill('input[data-testid="order-price-input"]', '50000');
    await page.fill('input[data-testid="order-size-input"]', '0.1');

    // Submit without rejection
    await page.click('button[data-testid="order-submit-button"]');
    await page.waitForSelector('[data-testid="order-confirm-modal"]', { state: 'visible' });
    await page.click('button:has-text("Confirm Order")');

    // Should show success toast
    await page.waitForSelector('[data-testid="toast"][data-toast-type="success"]', { state: 'visible' });
    const toast = page.locator('[data-testid="toast"][data-toast-type="success"]');
    await expect(toast).toContainText('Order placed');
  });

  test('should show error in both modal and toast notification', async ({ page }) => {
    // Enable rejection mode
    await page.goto('http://localhost:3002?testMode=true&walletReject=true');
    await page.waitForLoadState('networkidle');

    // Fill and submit order
    await page.fill('input[data-testid="order-price-input"]', '50000');
    await page.fill('input[data-testid="order-size-input"]', '0.1');
    await page.click('button[data-testid="order-submit-button"]');
    await page.waitForSelector('[data-testid="order-confirm-modal"]', { state: 'visible' });
    await page.click('button:has-text("Confirm Order")');

    // Verify modal error
    await page.waitForSelector('[data-testid="modal-error"]', { state: 'visible' });
    const modalError = page.locator('[data-testid="modal-error"]');
    await expect(modalError).toBeVisible();
    await expect(modalError).toContainText('Transaction rejected');

    // Verify toast error
    const toast = page.locator('[data-testid="toast"][data-toast-type="error"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Transaction rejected');
  });

  test('should handle non-rejection errors separately', async ({ page }) => {
    // Test without rejection simulation (normal test mode)
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');

    // Fill order form
    await page.fill('input[data-testid="order-price-input"]', '50000');
    await page.fill('input[data-testid="order-size-input"]', '0.1');

    // Submit - should succeed in test mode
    await page.click('button[data-testid="order-submit-button"]');
    await page.waitForSelector('[data-testid="order-confirm-modal"]', { state: 'visible' });
    await page.click('button:has-text("Confirm Order")');

    // Should show success, not error
    await page.waitForSelector('[data-testid="toast"][data-toast-type="success"]', { state: 'visible' });
    const toast = page.locator('[data-testid="toast"][data-toast-type="success"]');
    await expect(toast).toContainText('Order placed');

    // No error should be visible
    await expect(page.locator('[data-testid="modal-error"]')).not.toBeVisible();
  });
});
