import { test, expect } from '@playwright/test';

test('Debug AccountBalance rendering', async ({ page }) => {
  await page.goto('http://localhost:3002');
  await page.waitForLoadState('networkidle');

  // Get all elements with data-testid
  const allTestIds = await page.locator('[data-testid]').all();
  console.log('=== All data-testid elements ===');
  for (const el of allTestIds) {
    const testId = await el.getAttribute('data-testid');
    console.log('data-testid:', testId);
  }

  // Check the header
  const header = page.locator('header');
  const headerCount = await header.count();
  console.log('Header count:', headerCount);

  if (headerCount > 0) {
    const headerHTML = await header.first().innerHTML();
    console.log('Header HTML (first 1000 chars):', headerHTML.substring(0, 1000));
  }

  // Check for any account balance related elements
  const accountBalanceDiv = page.locator('[data-testid="account-balance"]');
  console.log('Account balance div count:', await accountBalanceDiv.count());

  // Check for loading state
  const loadingDiv = page.locator('[data-testid="account-balance-loading"]');
  console.log('Loading div count:', await loadingDiv.count());

  // Take screenshot for visual inspection
  await page.screenshot({ path: '/tmp/debug-screenshot.png' });
  console.log('Screenshot saved to /tmp/debug-screenshot.png');
});
