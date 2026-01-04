import { test, expect } from '@playwright/test';

test.describe('Account Balance Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
  });

  test('Account Balance component renders correctly in header', async ({ page }) => {
    // Check that Account Balance component is visible and contains expected content
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Check for key labels
    await expect(accountBalance.locator('text=Account Equity')).toBeVisible();
    await expect(accountBalance.locator('text=Margin Used')).toBeVisible();
    await expect(accountBalance.locator('text=Withdrawable')).toBeVisible();

    // Check that equity value is displayed (the large text-2xl value)
    const equityValue = accountBalance.locator('.text-2xl.font-bold.font-mono');
    await expect(equityValue).toBeVisible();
    const equityText = await equityValue.textContent();
    expect(equityText).toMatch(/\$10,000\.00/);

    // Check that PnL percentage is displayed
    const pnlElement = accountBalance.locator('.font-mono').filter({ hasText: '%' });
    await expect(pnlElement).toBeVisible();
  });

  test('Account Balance shows correct values', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Verify specific values are displayed within the AccountBalance component
    await expect(accountBalance.locator('text=$10,000.00').first()).toBeVisible();
    await expect(accountBalance.locator('text=$2,500.00').first()).toBeVisible();
    await expect(accountBalance.locator('text=$7,500.00').first()).toBeVisible();
    await expect(accountBalance.locator('text=10x').first()).toBeVisible();
  });
});
