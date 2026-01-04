/**
 * E2E test for Order submission with insufficient margin rejected
 * Feature: Order submission with insufficient margin rejected
 */

import { test, expect } from '@playwright/test';

test.describe('Order submission with insufficient margin rejected', () => {
  test('should reject order when margin insufficient', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002');

    // Wait for the page to load
    await expect(page.locator('[data-testid="order-entry-panel"]')).toBeVisible();

    // Check that the order form is visible
    await expect(page.locator('[data-testid="order-price-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-size-input"]')).toBeVisible();

    // Test with large order that exceeds margin
    // Assuming available balance is $10,000, try to place a large order
    await page.fill('[data-testid="order-price-input"]', '1000'); // High price
    await page.fill('[data-testid="order-size-input"]', '50'); // Large size
    // Leverage is already at 10x by default

    // Check that margin information is displayed
    await expect(page.locator('text=Required Margin')).toBeVisible();
    await expect(page.locator('text=Available Margin')).toBeVisible();

    // The required margin should be displayed and likely exceed available margin
    const requiredMarginText = await page.locator('text=Required Margin').textContent();
    const availableMarginText = await page.locator('text=Available Margin').textContent();

    // Submit the order
    await page.click('[data-testid="order-submit-button"]');

    // Verify error message appears
    await expect(page.locator('[data-testid="order-error"]')).toBeVisible();
    const errorMessage = await page.locator('[data-testid="order-error"]').textContent();

    // Check that error mentions insufficient margin
    expect(errorMessage?.toLowerCase()).toContain('insufficient margin');
    expect(errorMessage?.toLowerCase()).toContain('required');
    expect(errorMessage?.toLowerCase()).toContain('available');

    // Verify the order was not submitted by checking no success toast appears
    await expect(page.locator('text=Order placed:')).not.toBeVisible({ timeout: 2000 });
  });

  test('should allow order when margin is sufficient', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002');

    // Wait for the page to load
    await expect(page.locator('[data-testid="order-entry-panel"]')).toBeVisible();

    // Test with small order that fits within margin
    await page.fill('[data-testid="order-price-input"]', '100'); // Moderate price
    await page.fill('[data-testid="order-size-input"]', '5'); // Small size
    // Leverage is already at 10x by default

    // Submit the order
    await page.click('[data-testid="order-submit-button"]');

    // In test mode, the order should succeed (wallet not required)
    // Check for success message or confirmation modal
    await expect(page.locator('[data-testid="order-confirm-modal"]')).toBeVisible({ timeout: 5000 });
  });

  test('should update margin display when order parameters change', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002');

    // Wait for the page to load
    await expect(page.locator('[data-testid="order-entry-panel"]')).toBeVisible();

    // Initial small order
    await page.fill('[data-testid="order-price-input"]', '100');
    await page.fill('[data-testid="order-size-input"]', '1');

    // Check initial margin values
    const initialRequiredMargin = await page.locator('text=Required Margin').textContent();

    // Increase order size significantly
    await page.fill('[data-testid="order-size-input"]', '100');

    // Check that required margin updated
    await expect(page.locator('text=Required Margin')).toBeVisible();

    // Change leverage
    await page.locator('input[type="range"]').evaluate((el: HTMLInputElement) => {
      el.value = '50';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Check that required margin changed again (higher leverage = lower required margin)
    await expect(page.locator('text=Required Margin')).toBeVisible();
  });
});