import { test, expect } from '@playwright/test';

test.describe('Account Balance Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with test mode to skip WebSocket connections
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');

    // Wait for stores to be available - try multiple store accessors
    await page.waitForFunction(() => {
      const hasStores = typeof window !== 'undefined' && (window as any).stores;
      if (!hasStores) return false;
      const stores = (window as any).stores;
      return stores.getOrderStoreState || stores.getMarketStoreState;
    }, { timeout: 10000 });

    // Populate account state data to show real components instead of skeletons
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (!stores) return;

      // Try to get order store state
      let orderState = null;
      if (stores.getOrderStoreState) {
        orderState = stores.getOrderStoreState();
      }

      if (orderState && orderState.setAccountState) {
        // Set equity to 11000 so PnL is positive (10% profit)
        // This ensures the PnL element has text-profit class
        orderState.setAccountState({
          equity: 11000,
          marginUsed: 2500,
          availableBalance: 8500,
          withdrawable: 8500,
          crossMarginSummary: {
            accountValue: 11000,
            totalMarginUsed: 2500
          }
        });
      }
    });

    // Wait for component to render
    await page.waitForTimeout(500);
  });

  test('should display account balance in header', async ({ page }) => {
    // Check if the account balance component is visible
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Check for key elements in the account balance display
    await expect(accountBalance.locator('text=Account Equity').first()).toBeVisible();

    // Check for the main equity value (text-2xl font-bold font-mono)
    const equityValue = accountBalance.locator('.text-2xl.font-bold.font-mono');
    await expect(equityValue).toBeVisible();

    // Check for margin utilization bar - look for the colored inner div
    // The inner div has bg-accent, bg-warning, or bg-loss
    const marginBar = accountBalance.locator('div[class*="bg-accent"], div[class*="bg-warning"], div[class*="bg-loss"]').first();
    await expect(marginBar).toBeVisible();
  });

  test('should show correct account values', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Should show equity value with the specific text-2xl font-mono class
    const equityValue = accountBalance.locator('.text-2xl.font-bold.font-mono');
    await expect(equityValue).toBeVisible();

    // Verify it contains the expected dollar value (11000 = 10% profit)
    const equityText = await equityValue.textContent();
    expect(equityText).toMatch(/\$11,000\.00/);

    // Check for other key values
    await expect(accountBalance.locator('text=$2,500.00').first()).toBeVisible(); // Margin Used
    await expect(accountBalance.locator('text=$8,500.00').first()).toBeVisible(); // Available/Withdrawable
    await expect(accountBalance.locator('text=10x').first()).toBeVisible(); // Leverage
  });

  test('should display PnL percentage with correct color', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Check for PnL percentage display - the span with text-sm font-mono
    // Since equity is 11000 and initial is 10000, PnL is +10%
    const pnlElement = accountBalance.locator('span').filter({ hasText: '+' }).filter({ hasText: '%' });
    await expect(pnlElement).toBeVisible();

    // Check that it has text-profit class (positive PnL)
    await expect(pnlElement).toHaveClass(/text-profit/);
  });

  test('should display margin utilization bar with correct styling', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Check for margin utilization section
    await expect(accountBalance.locator('text=Margin Utilization').first()).toBeVisible();

    // The margin bar structure:
    // Outer: <div class="w-full bg-surface-elevated rounded-full h-1.5 mt-1">
    // Inner: <div class="h-1.5 rounded-full transition-all duration-300 bg-accent" style="width: 22.7%">
    // We need the inner div which has bg-accent/bg-warning/bg-loss
    // Use attribute selector to find div with bg-accent class
    const marginBar = accountBalance.locator('div[class*="bg-accent"], div[class*="bg-warning"], div[class*="bg-loss"]').first();
    await expect(marginBar).toBeVisible();

    // Verify the bar has correct styling - should be bg-accent for 22.7% utilization (2500/11000)
    const barClass = await marginBar.getAttribute('class');
    expect(barClass).toContain('bg-accent');

    // Verify the bar has width style set
    const barStyle = await marginBar.getAttribute('style');
    expect(barStyle).toContain('width');
  });

  test('should show margin utilization percentage', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Margin used is 2500, equity is 11000, so utilization is 22.7%
    // The component shows it with one decimal place
    const utilizationText = accountBalance.locator('text=22.7%');
    await expect(utilizationText).toBeVisible();
  });
});
