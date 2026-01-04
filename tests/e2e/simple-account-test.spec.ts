import { test, expect } from '@playwright/test';

test.describe('Account Equity Text', () => {
  test('should find Account Equity text on page', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if "Account Equity" text exists anywhere on the page
    await expect(page.locator('text=Account Equity')).toBeVisible();
  });

  test('should find equity value', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check for any currency-formatted number (equity value)
    const equityText = await page.locator('[class*="font-mono"]').textContent();
    console.log('Found equity text:', equityText);

    // Should contain a number starting with $
    expect(equityText).toMatch(/\$\d/);
  });
});