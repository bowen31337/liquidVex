import { test, expect } from '@playwright/test';

/**
 * E2E Test for Feature #1725: Bottom panel tab navigation and state
 * Tests tab navigation functionality and state persistence
 */

test.describe('Bottom Panel Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application with test mode
    await page.goto('/?testMode=true');
    await page.waitForLoadState('networkidle');

    // Wait for stores to be available
    await page.waitForFunction(() => {
      return typeof window !== 'undefined' && (window as any).stores;
    }, { timeout: 10000 });

    // Populate account state to make bottom panel visible
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.getOrderStoreState) {
        const orderStoreState = stores.getOrderStoreState();
        if (orderStoreState && orderStoreState.setAccountState) {
          orderStoreState.setAccountState({
            equity: 10000.0,
            marginUsed: 2500.0,
            availableBalance: 7500.0,
            withdrawable: 5000.0,
            crossMarginSummary: {
              accountValue: 10000.0,
              totalMarginUsed: 2500.0,
            },
          });
        }
      }
    });

    // Wait for bottom panel to be visible
    await expect(page.locator('[data-testid="bottom-panel"]')).toBeVisible({ timeout: 10000 });
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
    const orderHistory = page.locator('[data-testid="order-history"]');
    await expect(orderHistory).toBeVisible();

    // Step 8: Click Trade History tab
    const tradeHistoryTab = page.locator('button').filter({ hasText: 'Trade History' });
    await tradeHistoryTab.click();

    // Step 9: Verify trade history content is shown
    const tradeHistory = page.locator('[data-testid="trade-history"]');
    await expect(tradeHistory).toBeVisible();

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
    const orderHistory = page.locator('[data-testid="order-history"]');
    await expect(orderHistory).toBeVisible();

    // Step 12: Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Re-populate stores after refresh
    await page.waitForFunction(() => {
      return typeof window !== 'undefined' && (window as any).stores;
    }, { timeout: 10000 });

    // Step 13: Verify tab selection persists
    const orderHistoryAfterRefresh = page.locator('[data-testid="order-history"]');
    await expect(orderHistoryAfterRefresh).toBeVisible();
  });

  test('should maintain tab selection when switching trading pairs', async ({ page }) => {
    // First, ensure we have an asset selector button
    const assetSelector = page.locator('[data-testid="asset-selector-button"]').first();
    if (await assetSelector.isVisible()) {
      // Click Order History tab
      const orderHistoryTab = page.locator('button').filter({ hasText: 'Order History' });
      await orderHistoryTab.click();

      // Verify order history is shown
      const orderHistory = page.locator('[data-testid="order-history"]');
      await expect(orderHistory).toBeVisible();

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
      const orderHistoryAfterSwitch = page.locator('[data-testid="order-history"]');
      await expect(orderHistoryAfterSwitch).toBeVisible();
    }
  });

  test('should have proper tab activation states', async ({ page }) => {
    // The component uses border-b-2 border-accent for active tabs
    // Check that initially one tab has the active styling
    const activeTabs = page.locator('button.border-accent');
    expect(await activeTabs.count()).toBe(1);

    // Click different tabs and verify activation
    const tabs = ['Positions', 'Open Orders', 'Order History', 'Trade History', 'Calculator'];

    for (const tabName of tabs) {
      const tab = page.locator('button').filter({ hasText: tabName });
      await tab.click();

      // Verify the clicked tab has the active border styling
      const activeTab = page.locator('button').filter({ hasText: tabName }).filter('.border-accent');
      await expect(activeTab).toHaveCount(1);
    }
  });
});
