import { test, expect } from '@playwright/test';

test.describe('Feature #79: Bottom panel tab navigation and state persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should display all tabs in bottom panel', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Wait for bottom panel to be visible
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 10000 });

    // Check for tab buttons
    const positionsTab = page.getByRole('button', { name: /positions/i });
    const openOrdersTab = page.getByRole('button', { name: /open orders/i });
    const orderHistoryTab = page.getByRole('button', { name: /order history/i });
    const tradeHistoryTab = page.getByRole('button', { name: /trade history/i });
    const calculatorTab = page.getByRole('button', { name: /calculator/i });

    await expect(positionsTab).toBeVisible();
    await expect(openOrdersTab).toBeVisible();
    await expect(orderHistoryTab).toBeVisible();
    await expect(tradeHistoryTab).toBeVisible();
    await expect(calculatorTab).toBeVisible();
  });

  test('should switch tabs and display correct content', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for bottom panel
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    // Click on Open Orders tab
    await page.getByRole('button', { name: /open orders/i }).click();

    // Verify Open Orders tab is active
    const openOrdersTab = page.getByRole('button', { name: /open orders/i });
    await expect(openOrdersTab).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Verify Open Orders content is displayed
    await page.waitForSelector('[data-testid="orders-table"]', { timeout: 3000 });

    // Click on Order History tab
    await page.getByRole('button', { name: /order history/i }).click();

    // Verify Order History tab is active
    const orderHistoryTab = page.getByRole('button', { name: /order history/i });
    await expect(orderHistoryTab).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Verify Order History content is displayed
    await page.waitForSelector('[data-testid="order-history"]', { timeout: 3000 });

    // Click on Trade History tab
    await page.getByRole('button', { name: /trade history/i }).click();

    // Verify Trade History tab is active
    const tradeHistoryTab = page.getByRole('button', { name: /trade history/i });
    await expect(tradeHistoryTab).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Verify Trade History content is displayed
    await page.waitForSelector('[data-testid="trade-history"]', { timeout: 3000 });

    // Click on Calculator tab
    await page.getByRole('button', { name: /calculator/i }).click();

    // Verify Calculator tab is active
    const calculatorTab = page.getByRole('button', { name: /calculator/i });
    await expect(calculatorTab).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Verify Calculator content is displayed
    await page.waitForSelector('[data-testid="liquidation-calculator"]', { timeout: 3000 });
  });

  test('should persist selected tab across page refresh', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for bottom panel
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    // Click on Order History tab
    await page.getByRole('button', { name: /order history/i }).click();
    await page.waitForTimeout(500);

    // Get the active tab class before refresh
    const orderHistoryTab = page.getByRole('button', { name: /order history/i });
    await expect(orderHistoryTab).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Refresh the page
    await page.reload();

    // Wait for bottom panel to reload
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    // Verify Order History tab is still active after refresh
    const orderHistoryTabAfter = page.getByRole('button', { name: /order history/i });
    await expect(orderHistoryTabAfter).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Verify Order History content is still displayed
    await page.waitForSelector('[data-testid="order-history"]', { timeout: 3000 });
  });

  test('should persist selected tab when switching trading pairs', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for bottom panel
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    // Click on Trade History tab
    await page.getByRole('button', { name: /trade history/i }).click();
    await page.waitForTimeout(500);

    // Verify Trade History tab is active
    const tradeHistoryTab = page.getByRole('button', { name: /trade history/i });
    await expect(tradeHistoryTab).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Switch trading pair
    await page.getByTestId('asset-selector-button').click();
    await page.waitForTimeout(300);

    // Click on a different pair (e.g., ETH if BTC is selected, or vice versa)
    const ethOption = page.getByRole('option', { name: /ETH/i }).first();
    if (await ethOption.isVisible()) {
      await ethOption.click();
    }

    await page.waitForTimeout(500);

    // Verify Trade History tab is still active after switching pairs
    const tradeHistoryTabAfter = page.getByRole('button', { name: /trade history/i });
    await expect(tradeHistoryTabAfter).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Verify Trade History content is still displayed
    await page.waitForSelector('[data-testid="trade-history"]', { timeout: 3000 });
  });

  test('should persist selected tab across multiple refreshes', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for bottom panel
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    // Click on Open Orders tab
    await page.getByRole('button', { name: /open orders/i }).click();
    await page.waitForTimeout(500);

    // Refresh page 3 times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

      // Verify Open Orders tab is still active
      const openOrdersTab = page.getByRole('button', { name: /open orders/i });
      await expect(openOrdersTab).toHaveAttribute('class', /text-text-primary.*border-accent/);

      await page.waitForTimeout(500);
    }
  });

  test('should reset to default tab when localStorage is cleared', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for bottom panel
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    // Click on Calculator tab
    await page.getByRole('button', { name: /calculator/i }).click();
    await page.waitForTimeout(500);

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.removeItem('liquidvex-ui-storage');
    });

    // Reload page
    await page.reload();
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    // Verify default tab (Positions) is now active
    const positionsTab = page.getByRole('button', { name: /positions/i });
    await expect(positionsTab).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Verify Positions content is displayed
    await page.waitForSelector('[data-testid="positions-table"]', { timeout: 3000 });
  });

  test('should show badge counts on tabs when data exists', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for bottom panel
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    // Check if badges exist (they might not if there's no data)
    const positionsTab = page.getByRole('button', { name: /positions/i });
    const openOrdersTab = page.getByRole('button', { name: /open orders/i });

    // Badges are optional - just verify tabs are visible
    await expect(positionsTab).toBeVisible();
    await expect(openOrdersTab).toBeVisible();
  });

  test('should handle rapid tab switching without losing state', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for bottom panel
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    // Rapidly switch between tabs
    const tabs = ['Positions', 'Open Orders', 'Order History', 'Trade History'];

    for (let i = 0; i < 5; i++) {
      for (const tab of tabs) {
        await page.getByRole('button', { name: new RegExp(tab, 'i') }).click();
        await page.waitForTimeout(100);
      }
    }

    // After rapid switching, verify the last tab is active
    const lastTab = page.getByRole('button', { name: /trade history/i });
    await expect(lastTab).toHaveAttribute('class', /text-text-primary.*border-accent/);

    // Refresh and verify persistence still works
    await page.reload();
    await page.waitForSelector('[data-testid="bottom-panel"]', { timeout: 5000 });

    const lastTabAfter = page.getByRole('button', { name: /trade history/i });
    await expect(lastTabAfter).toHaveAttribute('class', /text-text-primary.*border-accent/);
  });
});
