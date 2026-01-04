import { test, expect } from '@playwright/test';

test.describe('Account Balance Integration', () => {
  test('Account Balance component renders correctly in header', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Check that Account Balance component is visible and contains expected content
    await expect(page.locator('text=Account Equity')).toBeVisible();
    await expect(page.locator('text=Margin Used')).toBeVisible();
    await expect(page.locator('text=Withdrawable')).toBeVisible();

    // Check that equity value is displayed
    const equityValue = await page.locator('[class*="text-2xl"]').textContent();
    expect(equityValue).toMatch(/\$10,000\.00/);

    // Check that PnL percentage is displayed
    const pnlElement = page.locator('[class*="font-mono"]').first();
    await expect(pnlElement).toBeVisible();
  });

  test('Account Balance shows correct values', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Verify specific values are displayed
    await expect(page.locator('text=$10,000.00')).toBeVisible();
    await expect(page.locator('text=$2,500.00')).toBeVisible();
    await expect(page.locator('text=$7,500.00')).toBeVisible();
    await expect(page.locator('text=10x')).toBeVisible();
  });
});