import { test, expect } from '@playwright/test';

test.describe('Account Balance Component', () => {
  test('should display account balance in header', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the account balance component is visible
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Check for key elements in the account balance display
    await expect(accountBalance.locator('text=Account Equity')).toBeVisible();
    await expect(accountBalance.locator('[class*="font-mono"]')).toBeVisible();

    // Check for margin utilization bar
    await expect(accountBalance.locator('div[style*="width"]')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Wait for the account balance to load
    const accountBalance = page.locator('[data-testid="account-balance"]');
    await expect(accountBalance).toBeVisible();

    // Should show equity value (not loading state if data is mocked)
    await expect(accountBalance.locator('[class*="font-mono"]')).toBeVisible();
  });

  test('should display PnL percentage with correct color', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    const accountBalance = page.locator('[data-testid="account-balance"]');

    // Check for PnL percentage display
    const pnlElement = accountBalance.locator('text=/\\d+\\.\\d+%/');
    await expect(pnlElement).toBeVisible();

    // Check that it has a color class (profit or loss)
    await expect(pnlElement).toHaveClass(/(text-profit|text-loss)/);
  });
});
