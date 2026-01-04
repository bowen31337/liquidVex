import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Feature #27: Order options checkboxes (reduce-only, post-only)
 *
 * Tests the reduce-only and post-only checkbox functionality in the order entry form.
 * These options control order execution behavior:
 * - Reduce Only: Order will only reduce existing positions, never open new ones
 * - Post Only: Order will be posted to the book as a maker order (no immediate fill)
 */

test.describe('Order Options Checkboxes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('/');

    // Wait for the main trading interface to be visible
    await page.waitForSelector('[data-testid="wallet-connect-button"]', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('should display reduce-only checkbox for all order types', async ({ page }) => {
    // Find order entry panel
    const orderPanel = page.locator('[data-testid="order-entry-panel"]');
    await expect(orderPanel).toBeVisible();

    // Check that reduce-only checkbox is present
    const reduceOnlyCheckbox = orderPanel.locator('[data-testid="reduce-only-checkbox"]');
    await expect(reduceOnlyCheckbox).toBeVisible();
    await expect(reduceOnlyCheckbox).not.toBeChecked();

    // Get the order type selector using specific data-testid
    const orderTypeSelect = orderPanel.locator('[data-testid=\"order-type-select\"]');

    // Verify reduce-only checkbox appears for Market orders
    await orderTypeSelect.selectOption('market');
    await expect(reduceOnlyCheckbox).toBeVisible();

    // Verify reduce-only checkbox appears for Limit orders
    await orderTypeSelect.selectOption('limit');
    await expect(reduceOnlyCheckbox).toBeVisible();

    // Verify reduce-only checkbox appears for Stop-Limit orders
    await orderTypeSelect.selectOption('stop_limit');
    await expect(reduceOnlyCheckbox).toBeVisible();

    // Verify reduce-only checkbox appears for Stop-Market orders
    await orderTypeSelect.selectOption('stop_market');
    await expect(reduceOnlyCheckbox).toBeVisible();
  });

  test('should display post-only checkbox only for limit and stop-limit orders', async ({ page }) => {
    const orderPanel = page.locator('[data-testid="order-entry-panel"]');
    const orderTypeSelect = orderPanel.locator('[data-testid="order-type-select"]');

    // For Limit orders - post-only should be visible
    await orderTypeSelect.selectOption('limit');
    const postOnlyCheckbox = orderPanel.locator('[data-testid="post-only-checkbox"]');
    await expect(postOnlyCheckbox).toBeVisible();
    await expect(postOnlyCheckbox).not.toBeChecked();

    // For Stop-Limit orders - post-only should be visible
    await orderTypeSelect.selectOption('stop_limit');
    await expect(postOnlyCheckbox).toBeVisible();

    // For Market orders - post-only should NOT be visible
    await orderTypeSelect.selectOption('market');
    await expect(postOnlyCheckbox).not.toBeVisible();

    // For Stop-Market orders - post-only should NOT be visible
    await orderTypeSelect.selectOption('stop_market');
    await expect(postOnlyCheckbox).not.toBeVisible();
  });

  test('should toggle reduce-only checkbox state', async ({ page }) => {
    const orderPanel = page.locator('[data-testid="order-entry-panel"]');

    // Find the reduce-only checkbox
    const reduceOnlyCheckbox = orderPanel.locator('[data-testid="reduce-only-checkbox"]');

    // Initially unchecked
    await expect(reduceOnlyCheckbox).not.toBeChecked();

    // Click to check
    await reduceOnlyCheckbox.click();
    await expect(reduceOnlyCheckbox).toBeChecked();

    // Click again to uncheck
    await reduceOnlyCheckbox.click();
    await expect(reduceOnlyCheckbox).not.toBeChecked();
  });

  test('should toggle post-only checkbox state', async ({ page }) => {
    const orderPanel = page.locator('[data-testid="order-entry-panel"]');

    // Ensure we're on a limit order type
    await orderPanel.locator('[data-testid="order-type-select"]').selectOption('limit');

    // Find the post-only checkbox
    const postOnlyCheckbox = orderPanel.locator('[data-testid="post-only-checkbox"]');

    // Initially unchecked
    await expect(postOnlyCheckbox).not.toBeChecked();

    // Click to check
    await postOnlyCheckbox.click();
    await expect(postOnlyCheckbox).toBeChecked();

    // Click again to uncheck
    await postOnlyCheckbox.click();
    await expect(postOnlyCheckbox).not.toBeChecked();
  });

  test('should preserve checkbox state when switching between limit and stop-limit orders', async ({ page }) => {
    const orderPanel = page.locator('[data-testid="order-entry-panel"]');
    const orderTypeSelect = orderPanel.locator('[data-testid="order-type-select"]');

    // Start with Limit order
    await orderTypeSelect.selectOption('limit');

    // Check reduce-only
    const reduceOnlyCheckbox = orderPanel.locator('[data-testid="reduce-only-checkbox"]');
    await reduceOnlyCheckbox.click();

    // Check post-only
    const postOnlyCheckbox = orderPanel.locator('[data-testid="post-only-checkbox"]');
    await postOnlyCheckbox.click();

    // Verify both are checked
    await expect(reduceOnlyCheckbox).toBeChecked();
    await expect(postOnlyCheckbox).toBeChecked();

    // Switch to Stop-Limit
    await orderTypeSelect.selectOption('stop_limit');

    // Both checkboxes should still be present and checked
    await expect(reduceOnlyCheckbox).toBeChecked();
    await expect(postOnlyCheckbox).toBeChecked();

    // Switch back to Limit
    await orderTypeSelect.selectOption('limit');

    // Both should still be checked
    await expect(reduceOnlyCheckbox).toBeChecked();
    await expect(postOnlyCheckbox).toBeChecked();
  });

  test('should clear post-only when switching to market order types', async ({ page }) => {
    const orderPanel = page.locator('[data-testid="order-entry-panel"]');
    const orderTypeSelect = orderPanel.locator('[data-testid="order-type-select"]');

    // Start with Limit order
    await orderTypeSelect.selectOption('limit');

    // Check post-only
    const postOnlyCheckbox = orderPanel.locator('[data-testid="post-only-checkbox"]');
    await postOnlyCheckbox.click();
    await expect(postOnlyCheckbox).toBeChecked();

    // Switch to Market order
    await orderTypeSelect.selectOption('market');

    // Post-only checkbox should disappear (not applicable to market orders)
    await expect(postOnlyCheckbox).not.toBeVisible();

    // Switch back to Limit
    await orderTypeSelect.selectOption('limit');

    // Post-only checkbox should reappear, unchecked (state was cleared)
    await expect(postOnlyCheckbox).toBeVisible();
    await expect(postOnlyCheckbox).not.toBeChecked();
  });

  test('should maintain reduce-only state across all order type changes', async ({ page }) => {
    const orderPanel = page.locator('[data-testid="order-entry-panel"]');
    const orderTypeSelect = orderPanel.locator('[data-testid="order-type-select"]');

    // Start with Limit order
    await orderTypeSelect.selectOption('limit');

    // Check reduce-only
    const reduceOnlyCheckbox = orderPanel.locator('[data-testid="reduce-only-checkbox"]');
    await reduceOnlyCheckbox.click();
    await expect(reduceOnlyCheckbox).toBeChecked();

    // Switch through all order types
    await orderTypeSelect.selectOption('market');
    await expect(reduceOnlyCheckbox).toBeChecked();

    await orderTypeSelect.selectOption('stop_limit');
    await expect(reduceOnlyCheckbox).toBeChecked();

    await orderTypeSelect.selectOption('stop_market');
    await expect(reduceOnlyCheckbox).toBeChecked();

    // Back to limit
    await orderTypeSelect.selectOption('limit');
    await expect(reduceOnlyCheckbox).toBeChecked();
  });

  test('should have accessible labels', async ({ page }) => {
    const orderPanel = page.locator('[data-testid="order-entry-panel"]');

    // Check that reduce-only checkbox is properly labeled
    const reduceOnlyLabel = orderPanel.locator('label:has-text("Reduce Only")');
    await expect(reduceOnlyLabel).toBeVisible();

    // Same for post-only (on limit order)
    await orderPanel.locator('[data-testid="order-type-select"]').selectOption('limit');
    const postOnlyLabel = orderPanel.locator('label:has-text("Post Only")');
    await expect(postOnlyLabel).toBeVisible();
  });
});
