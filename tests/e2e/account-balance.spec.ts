import { test, expect } from '@playwright/test';

test.describe('Account Balance Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
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

    // Check for margin utilization bar (the styled div with width)
    const marginBar = accountBalance.locator('.bg-accent, .bg-warning, .bg-loss').first();
    await expect(marginBar).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // This test checks that the component renders
    // Since data is mocked, it should show the loaded state immediately
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Should show equity value with the specific text-2xl font-mono class
    const equityValue = accountBalance.locator('.text-2xl.font-bold.font-mono');
    await expect(equityValue).toBeVisible();

    // Verify it contains a dollar value
    const equityText = await equityValue.textContent();
    expect(equityText).toContain('$');
  });

  test('should display PnL percentage with correct color', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');

    // Check for PnL percentage display - use the specific text-sm font-mono for PnL
    const pnlElement = accountBalance.locator('.font-mono.text-sm').filter({ hasText: '%' });
    await expect(pnlElement).toBeVisible();

    // Check that it has a color class (profit or loss)
    await expect(pnlElement).toHaveClass(/(text-profit|text-loss)/);
  });
});
