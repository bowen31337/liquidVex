import { test, expect } from '@playwright/test';

test.describe('Account Balance Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with test mode to skip WebSocket connections
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');

    // Wait for stores to be available
    await page.waitForFunction(() => {
      return typeof window !== 'undefined' &&
             (window as any).stores &&
             (window as any).stores.getOrderStoreState;
    }, { timeout: 10000 });

    // Populate account state data
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (!stores || !stores.getOrderStoreState) return;

      const orderState = stores.getOrderStoreState();
      orderState.setAccountState({
        equity: 10000,
        marginUsed: 2500,
        availableBalance: 7500,
        withdrawable: 7500,
        crossMarginSummary: {
          accountValue: 10000,
          totalMarginUsed: 2500
        }
      });
    });

    // Wait for component to render
    await page.waitForTimeout(500);
  });

  test('Account Balance component renders correctly in header', async ({ page }) => {
    // Check that Account Balance component is visible and contains expected content
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Check for key labels - use first() to avoid strict mode with multiple matches
    await expect(accountBalance.locator('text=Account Equity').first()).toBeVisible();
    // Margin Used appears twice (in main section and cross margin summary), use first()
    await expect(accountBalance.locator('text=Margin Used').first()).toBeVisible();
    await expect(accountBalance.locator('text=Withdrawable').first()).toBeVisible();

    // Check that equity value is displayed (the large text-2xl value)
    const equityValue = accountBalance.locator('.text-2xl.font-bold.font-mono');
    await expect(equityValue).toBeVisible();
    const equityText = await equityValue.textContent();
    expect(equityText).toMatch(/\$10,000\.00/);

    // Check that PnL percentage is displayed (the first font-mono with %, which is the PnL)
    const pnlElement = accountBalance.locator('.font-mono.text-sm').filter({ hasText: '%' });
    await expect(pnlElement).toBeVisible();
  });

  test('Account Balance shows correct values', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Verify specific values are displayed within the AccountBalance component
    // Use first() to get the first occurrence (main account balance section)
    await expect(accountBalance.locator('text=$10,000.00').first()).toBeVisible();
    await expect(accountBalance.locator('text=$2,500.00').first()).toBeVisible();
    await expect(accountBalance.locator('text=$7,500.00').first()).toBeVisible();
    await expect(accountBalance.locator('text=10x').first()).toBeVisible();
  });
});
