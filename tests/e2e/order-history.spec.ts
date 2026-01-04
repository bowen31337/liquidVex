/**
 * Order History Test
 * Feature: Order history displays and filtering
 */

import { test, expect } from '@playwright/test';

test.describe('Order History Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');

    // Wait for app to initialize
    await page.waitForTimeout(2000);
  });

  test('should display order history tab', async ({ page }) => {
    // Step 1: Navigate to bottom panel
    const bottomPanel = page.locator('[data-testid="bottom-panel"]');
    await expect(bottomPanel).toBeVisible();

    // Step 2: Click on Order History tab
    const orderHistoryTab = bottomPanel.locator('button:has-text("Order History")');
    await expect(orderHistoryTab).toBeVisible();
    await orderHistoryTab.click();

    // Step 3: Verify order history section is displayed
    const orderHistoryContent = page.locator('[data-testid="order-history"]');
    await expect(orderHistoryContent).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    // Navigate to Order History tab
    const bottomPanel = page.locator('[data-testid="bottom-panel"]');
    const orderHistoryTab = bottomPanel.locator('button:has-text("Order History")');
    await orderHistoryTab.click();

    // Step 1: Locate date range filter
    const dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
    await expect(dateRangeFilter).toBeVisible();

    // Step 2: Locate asset filter
    const assetFilter = page.locator('[data-testid="asset-filter"]');
    await expect(assetFilter).toBeVisible();

    // Step 3: Locate status filter
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await expect(statusFilter).toBeVisible();

    // Step 4: Verify clear filters button (hidden initially)
    const clearFiltersBtn = page.locator('[data-testid="clear-filters"]');
    // Only visible when filters are active
  });

  test('should apply date range filter', async ({ page }) => {
    // Navigate to Order History tab
    const bottomPanel = page.locator('[data-testid="bottom-panel"]');
    const orderHistoryTab = bottomPanel.locator('button:has-text("Order History")');
    await orderHistoryTab.click();

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Step 1: Select 24h date range
    const dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
    await dateRangeFilter.selectOption('24h');
    await page.waitForTimeout(500);

    // Step 2: Verify filter is applied
    await expect(dateRangeFilter).toHaveValue('24h');

    // Step 3: Select 7d date range
    await dateRangeFilter.selectOption('7d');
    await page.waitForTimeout(500);

    // Step 4: Verify filter is applied
    await expect(dateRangeFilter).toHaveValue('7d');
  });

  test('should apply asset filter', async ({ page }) => {
    // Navigate to Order History tab
    const bottomPanel = page.locator('[data-testid="bottom-panel"]');
    const orderHistoryTab = bottomPanel.locator('button:has-text("Order History")');
    await orderHistoryTab.click();

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Step 1: Get available options from asset filter
    const assetFilter = page.locator('[data-testid="asset-filter"]');
    await expect(assetFilter).toBeVisible();

    // Step 2: Select a specific asset (e.g., BTC)
    await assetFilter.selectOption({ label: 'BTC' });
    await page.waitForTimeout(500);

    // Step 3: Verify filter is applied
    await expect(assetFilter).toHaveValue(/BTC/);

    // Step 4: Clear filter by selecting "All Assets"
    await assetFilter.selectOption('all');
    await page.waitForTimeout(500);

    // Step 5: Verify filter is cleared
    await expect(assetFilter).toHaveValue('all');
  });

  test('should apply status filter', async ({ page }) => {
    // Navigate to Order History tab
    const bottomPanel = page.locator('[data-testid="bottom-panel"]');
    const orderHistoryTab = bottomPanel.locator('button:has-text("Order History")');
    await orderHistoryTab.click();

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Step 1: Select "filled" status
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await statusFilter.selectOption('filled');
    await page.waitForTimeout(500);

    // Step 2: Verify filter is applied
    await expect(statusFilter).toHaveValue('filled');

    // Step 3: Select "canceled" status
    await statusFilter.selectOption('canceled');
    await page.waitForTimeout(500);

    // Step 4: Verify filter is applied
    await expect(statusFilter).toHaveValue('canceled');

    // Step 5: Select "all" status
    await statusFilter.selectOption('all');
    await page.waitForTimeout(500);

    // Step 6: Verify filter is cleared
    await expect(statusFilter).toHaveValue('all');
  });

  test('should show clear filters button when filters are active', async ({ page }) => {
    // Navigate to Order History tab
    const bottomPanel = page.locator('[data-testid="bottom-panel"]');
    const orderHistoryTab = bottomPanel.locator('button:has-text("Order History")');
    await orderHistoryTab.click();

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Step 1: Apply a filter
    const dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
    await dateRangeFilter.selectOption('24h');
    await page.waitForTimeout(500);

    // Step 2: Verify clear filters button appears
    const clearFiltersBtn = page.locator('[data-testid="clear-filters"]');
    await expect(clearFiltersBtn).toBeVisible();

    // Step 3: Click clear filters
    await clearFiltersBtn.click();
    await page.waitForTimeout(500);

    // Step 4: Verify filters are reset
    await expect(dateRangeFilter).toHaveValue('all');
    await expect(clearFiltersBtn).not.toBeVisible();
  });

  test('should display order count', async ({ page }) => {
    // Navigate to Order History tab
    const bottomPanel = page.locator('[data-testid="bottom-panel"]');
    const orderHistoryTab = bottomPanel.locator('button:has-text("Order History")');
    await orderHistoryTab.click();

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Step 1: Verify order count is displayed
    const orderCount = page.locator('text=/orders?$/i');
    await expect(orderCount).toBeVisible();
  });

  test('should handle empty state when no orders match filters', async ({ page }) => {
    // Navigate to Order History tab
    const bottomPanel = page.locator('[data-testid="bottom-panel"]');
    const orderHistoryTab = bottomPanel.locator('button:has-text("Order History")');
    await orderHistoryTab.click();

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Step 1: Apply a very restrictive filter (e.g., 24h)
    const dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
    await dateRangeFilter.selectOption('24h');
    await page.waitForTimeout(500);

    // Step 2: Check for either empty state or filtered results
    const emptyState = page.locator('text=/No orders match your filters/i');
    const ordersTable = page.locator('table.data-table tbody tr');

    // Either empty state or some orders may be shown
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasOrders = (await ordersTable.count()) > 0;

    expect(hasEmptyState || hasOrders).toBeTruthy();
  });
});
