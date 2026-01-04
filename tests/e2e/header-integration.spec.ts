import { test, expect } from '@playwright/test';

test.describe('Header Integration', () => {
  test('header should be visible', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Check if header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check if logo is visible
    await expect(page.locator('text=liquidVex')).toBeVisible();

    // Check if price display is visible
    await expect(page.locator('[class*="font-mono"]')).toBeVisible();
  });

  test('header should contain AccountBalance component', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Check for any element with AccountBalance in class name
    const elements = await page.locator('*').all();
    for (const element of elements) {
      const className = await element.getAttribute('class') || '';
      if (className.includes('AccountBalance')) {
        console.log('Found AccountBalance element:', className);
        await expect(element).toBeVisible();
        return;
      }
    }

    // If not found, check for the text content that should be in AccountBalance
    await expect(page.locator('text=Account Equity')).toBeVisible();
  });
});