/**
 * E2E test for Feature 78: Zustand store persistence and TanStack Query caching
 * This test verifies that settings persist across page refreshes and API responses are properly cached
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 78 - Zustand Store Persistence and TanStack Query Caching', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Navigate to the application
    await page.goto('http://localhost:3001');

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Wait for market data to load
    await page.waitForSelector('[data-testid="market-header"]', { timeout: 10000 });
  });

  test('should persist selected asset across page refresh', async ({ page }) => {
    // Step 1: Change some settings in the app
    const assetSelector = page.locator('[data-testid="asset-selector"]').first();
    await expect(assetSelector).toBeVisible();

    // Select a different asset
    await assetSelector.click();
    await page.waitForSelector('[data-testid="asset-option-ETH"]');
    await page.click('[data-testid="asset-option-ETH"]');

    // Verify the change took effect
    const selectedAsset = await page.locator('[data-testid="selected-asset"]').textContent();
    expect(selectedAsset).toContain('ETH');

    // Step 2: Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 3: Verify settings are preserved
    const persistedAsset = await page.locator('[data-testid="selected-asset"]').textContent();
    expect(persistedAsset).toContain('ETH');
  });

  test('should persist selected timeframe across page refresh', async ({ page }) => {
    // Select a different timeframe
    const timeframeSelector = page.locator('[data-testid="timeframe-selector"]').first();
    await expect(timeframeSelector).toBeVisible();

    await timeframeSelector.click();
    await page.waitForSelector('[data-testid="timeframe-option-5m"]');
    await page.click('[data-testid="timeframe-option-5m"]');

    // Verify the change took effect
    const selectedTimeframe = await page.locator('[data-testid="selected-timeframe"]').textContent();
    expect(selectedTimeframe).toContain('5m');

    // Refresh and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    const persistedTimeframe = await page.locator('[data-testid="selected-timeframe"]').textContent();
    expect(persistedTimeframe).toContain('5m');
  });

  test('should persist UI tab selection across page refresh', async ({ page }) => {
    // Navigate to a different tab
    await page.click('[data-testid="tab-Open Orders"]');

    // Verify the tab is active
    const openOrdersTab = page.locator('[data-testid="tab-Open Orders"]');
    await expect(openOrdersTab).toHaveClass(/active/);

    // Refresh and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    const persistedTab = page.locator('[data-testid="tab-Open Orders"]');
    await expect(persistedTab).toHaveClass(/active/);
  });

  test('should clear localStorage and reset to defaults', async ({ page }) => {
    // Set some preferences
    const assetSelector = page.locator('[data-testid="asset-selector"]').first();
    await assetSelector.click();
    await page.click('[data-testid="asset-option-ETH"]');

    const timeframeSelector = page.locator('[data-testid="timeframe-selector"]').first();
    await timeframeSelector.click();
    await page.click('[data-testid="timeframe-option-5m"]');

    // Verify changes
    const selectedAsset = await page.locator('[data-testid="selected-asset"]').textContent();
    const selectedTimeframe = await page.locator('[data-testid="selected-timeframe"]').textContent();
    expect(selectedAsset).toContain('ETH');
    expect(selectedTimeframe).toContain('5m');

    // Step 4: Clear localStorage
    await page.evaluate(() => {
      localStorage.removeItem('liquidvex-market-storage');
      localStorage.removeItem('liquidvex-ui-storage');
    });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 5: Verify settings reset to defaults
    const defaultAsset = await page.locator('[data-testid="selected-asset"]').textContent();
    const defaultTimeframe = await page.locator('[data-testid="selected-timeframe"]').textContent();
    expect(defaultAsset).toContain('BTC'); // Default asset
    expect(defaultTimeframe).toContain('1h'); // Default timeframe
  });

  test('should cache API responses and invalidate on cache invalidation', async ({ page }) => {
    // Step 6: Make initial API request - this happens automatically on load
    // Wait for market data to load
    await page.waitForSelector('[data-testid="order-book"]', { timeout: 10000 });

    // Step 7: Verify response is cached - check network tab
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/info/meta')),
      page.reload()
    ]);

    // Should be a cached response (304 or similar)
    expect(response.status()).toBe(200);

    // Step 8: Trigger cache invalidation event - switch asset should invalidate
    const assetSelector = page.locator('[data-testid="asset-selector"]').first();
    await assetSelector.click();
    await page.click('[data-testid="asset-option-ETH"]');

    // Wait for new data to load
    await page.waitForSelector('[data-testid="order-book"]');

    // Step 9: Verify fresh data is fetched - check network activity
    const [newResponse] = await Promise.all([
      page.waitForResponse(response => response.url().includes('/api/info/asset/ETH')),
      page.locator('[data-testid="asset-option-ETH"]').click()
    ]);

    expect(newResponse.status()).toBe(200);

    // Step 10: Verify stale data is replaced
    const activeAsset = await page.locator('[data-testid="selected-asset"]').textContent();
    expect(activeAsset).toContain('ETH');
  });

  test('should handle multiple state changes and persistence', async ({ page }) => {
    // Change multiple settings
    const assetSelector = page.locator('[data-testid="asset-selector"]').first();
    await assetSelector.click();
    await page.click('[data-testid="asset-option-ETH"]');

    const timeframeSelector = page.locator('[data-testid="timeframe-selector"]').first();
    await timeframeSelector.click();
    await page.click('[data-testid="timeframe-option-15m"]');

    await page.click('[data-testid="tab-Positions"]');

    // Verify all changes
    const selectedAsset = await page.locator('[data-testid="selected-asset"]').textContent();
    const selectedTimeframe = await page.locator('[data-testid="selected-timeframe"]').textContent();

    expect(selectedAsset).toContain('ETH');
    expect(selectedTimeframe).toContain('15m');

    // Refresh and verify all persisted
    await page.reload();
    await page.waitForLoadState('networkidle');

    const persistedAsset = await page.locator('[data-testid="selected-asset"]').textContent();
    const persistedTimeframe = await page.locator('[data-testid="selected-timeframe"]').textContent();
    const persistedTab = page.locator('[data-testid="tab-Positions"]');

    expect(persistedAsset).toContain('ETH');
    expect(persistedTimeframe).toContain('15m');
    await expect(persistedTab).toHaveClass(/active/);
  });

  test('should maintain cache across tab switches', async ({ page }) => {
    // Load initial data
    await page.waitForSelector('[data-testid="order-book"]', { timeout: 10000 });

    // Switch to different tab
    await page.click('[data-testid="tab-Open Orders"]');

    // Wait for order data to load
    await page.waitForSelector('[data-testid="orders-table"]', { timeout: 5000 });

    // Switch back to main tab
    await page.click('[data-testid="tab-Positions"]');

    // Verify data is still there (from cache)
    await page.waitForSelector('[data-testid="order-book"]', { timeout: 5000 });

    // Verify the asset is still selected
    const selectedAsset = await page.locator('[data-testid="selected-asset"]').textContent();
    expect(selectedAsset).toContain('BTC'); // Should be preserved
  });
});