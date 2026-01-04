import { test, expect } from '@playwright/test';

test.describe('Test Component', () => {
  test('should find TestComponent text on page', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if "TEST ACCOUNT BALANCE" text exists anywhere on the page
    await expect(page.locator('text=TEST ACCOUNT BALANCE')).toBeVisible();
  });
});