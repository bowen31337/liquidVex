import { test, expect } from '@playwright/test';

/**
 * E2E Test for Feature #1725: Bottom panel tab navigation and state
 * Tests tab navigation functionality and state persistence
 */

test.describe('Bottom Panel Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Check that the main trading interface is loaded
    try {
      await expect(page.locator('[data-testid="bottom-panel"]')).toBeVisible({ timeout: 10000 });
    } catch (error) {
      // If bottom panel doesn't load immediately, wait a bit more
      await page.waitForTimeout(5000);
      await expect(page.locator('[data-testid="bottom-panel"]')).toBeVisible();
    }
  });

  test('should display bottom panel with all tabs', async ({ page }) => {
    // Step 1: Navigate to bottom panel
    const bottomPanel = page.locator('[data-testid="bottom-panel"]');
    await expect(bottomPanel).toBeVisible();

    // Verify all tabs are present
    const tabs = ['Positions', 'Open Orders', 'Order History', 'Trade History', 'Calculator'];
    for (const tabName of tabs) {
      const tab = page.locator('button').filter({ hasText: tabName });
      await expect(tab).toBeVisible();
    }
  });

  test('should switch between tabs and show correct content', async ({ page }) => {
    // Step 2: Click Positions tab
    const positionsTab = page.locator('button').filter({ hasText: 'Positions' });
    await positionsTab.click();

    // Step 3: Verify positions content is shown
    const positionsTable = page.locator('[data-testid="positions-table"]');
    await expect(positionsTable).toBeVisible();

    // Step 4: Click Open Orders tab
    const ordersTab = page.locator('button').filter({ hasText: 'Open Orders' });
    await ordersTab.click();

    // Step 5: Verify open orders content is shown
    const ordersTable = page.locator('[data-testid="orders-table"]');
    await expect(ordersTable).toBeVisible();

    // Step 6: Click Order History tab
    const orderHistoryTab = page.locator('button').filter({ hasText: 'Order History' });
    await orderHistoryTab.click();

    // Step 7: Verify order history content is shown
    const orderHistoryTable = page.locator('[data-testid="order-history-table"]');
    await expect(orderHistoryTable).toBeVisible();

    // Step 8: Click Trade History tab
    const tradeHistoryTab = page.locator('button').filter({ hasText: 'Trade History' });
    await tradeHistoryTab.click();

    // Step 9: Verify trade history content is shown
    const tradeHistoryTable = page.locator('[data-testid="trade-history-table"]');
    await expect(tradeHistoryTable).toBeVisible();

    // Click Calculator tab
    const calculatorTab = page.locator('button').filter({ hasText: 'Calculator' });
    await calculatorTab.click();

    // Verify calculator content is shown
    const calculator = page.locator('[data-testid="liquidation-calculator"]');
    await expect(calculator).toBeVisible();
  });

  test('should persist tab selection across page refresh', async ({ page }) => {
    // Click Order History tab
    const orderHistoryTab = page.locator('button').filter({ hasText: 'Order History' });
    await orderHistoryTab.click();

    // Verify order history is shown
    const orderHistoryTable = page.locator('[data-testid="order-history-table"]');
    await expect(orderHistoryTable).toBeVisible();

    // Step 12: Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 13: Verify tab selection persists
    const orderHistoryTableAfterRefresh = page.locator('[data-testid="order-history-table"]');
    await expect(orderHistoryTableAfterRefresh).toBeVisible();
  });

  test('should maintain tab selection when switching trading pairs', async ({ page }) => {
    // First, ensure we have an asset selector
    const assetSelector = page.locator('[data-testid="asset-selector"]').first();
    if (await assetSelector.isVisible()) {
      // Click Order History tab
      const orderHistoryTab = page.locator('button').filter({ hasText: 'Order History' });
      await orderHistoryTab.click();

      // Verify order history is shown
      const orderHistoryTable = page.locator('[data-testid="order-history-table"]');
      await expect(orderHistoryTable).toBeVisible();

      // Step 10: Switch trading pairs
      await assetSelector.click();
      // Select a different pair if available
      const assetOptions = page.locator('[data-testid="asset-selector-option"]');
      if (await assetOptions.count() > 1) {
        // Click on the second option to switch pairs
        await assetOptions.nth(1).click();
        await page.waitForTimeout(500); // Wait for potential updates
      }

      // Step 11: Verify selected tab remains selected
      const orderHistoryTableAfterSwitch = page.locator('[data-testid="order-history-table"]');
      await expect(orderHistoryTableAfterSwitch).toBeVisible();
    }
  });

  test('should show tab counts when data is available', async ({ page }) => {
    // Wait a moment for any data to load
    await page.waitForTimeout(1000);

    // Check if any tabs show counts
    const tabCountElements = page.locator('span').filter({ hasText: /\d+/ });
    const countElements = await tabCountElements.count();

    if (countElements > 0) {
      // If counts are shown, verify they are numeric
      for (let i = 0; i < countElements; i++) {
        const countText = await tabCountElements.nth(i).textContent();
        expect(countText).toMatch(/^\d+$/);
      }
    }
  });

  test('should have proper tab activation states', async ({ page }) => {
    // Check that initially one tab is active
    const activeTabs = page.locator('button[aria-selected="true"]');
    expect(await activeTabs.count()).toBe(1);

    // Click different tabs and verify activation
    const tabs = ['Positions', 'Open Orders', 'Order History', 'Trade History', 'Calculator'];

    for (const tabName of tabs) {
      const tab = page.locator('button').filter({ hasText: tabName });
      await tab.click();

      // Verify the clicked tab is now active
      const activeTab = page.locator('button').filter({ hasText: tabName }).filter('[aria-selected="true"]');
      await expect(activeTab).toHaveCount(1);
    }
  });
});