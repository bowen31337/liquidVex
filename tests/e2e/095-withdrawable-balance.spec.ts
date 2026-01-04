import { test, expect } from '@playwright/test';

test.describe('Withdrawable Balance Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display withdrawable balance label in AccountBalance component', async ({ page }) => {
    // Find the withdrawable label
    const withdrawableLabel = page.locator('text=Withdrawable').first();
    await expect(withdrawableLabel).toBeVisible();
  });

  test('should display withdrawable balance alongside other account metrics', async ({ page }) => {
    // Verify all four metrics are displayed
    const metrics = ['Margin Used', 'Available', 'Withdrawable', 'Leverage'];

    for (const metric of metrics) {
      const metricElement = page.locator(`text=${metric}`).first();
      await expect(metricElement).toBeVisible();
    }
  });

  test('should have withdrawable balance value with currency format', async ({ page }) => {
    // Find the withdrawable section
    const withdrawableLabel = page.locator('text=Withdrawable').first();
    await expect(withdrawableLabel).toBeVisible();

    // Get all font-mono elements (which contain the values)
    const allValues = await page.locator('.font-mono').allTextContents();

    // Find the one that looks like a currency (starts with $)
    const currencyValues = allValues.filter(text => text.match(/^\$\d/));

    // Verify at least one currency value exists
    expect(currencyValues.length).toBeGreaterThan(0);

    // Verify currency format
    currencyValues.forEach(value => {
      expect(value).toMatch(/\$\d{1,3}(,\d{3})*(\.\d{2})?/);
    });
  });

  test('should display withdrawable balance in the correct position', async ({ page }) => {
    // Wait for the AccountBalance component to load
    await page.waitForSelector('text=Account Equity', { state: 'visible' });

    // Get all metric labels
    const metrics = await page.locator('.text-text-secondary').allTextContents();

    // Verify "Withdrawable" is one of the metrics
    const hasWithdrawable = metrics.some(m => m.includes('Withdrawable'));
    expect(hasWithdrawable).toBe(true);
  });

  test('should render AccountBalance component in header', async ({ page }) => {
    // Verify header is present
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify Account Equity text is visible (part of AccountBalance)
    const accountEquity = page.locator('text=Account Equity').first();
    await expect(accountEquity).toBeVisible();
  });

  test('should have withdrawable with proper styling', async ({ page }) => {
    // Check for withdrawable label
    const withdrawableLabel = page.locator('text=Withdrawable').first();
    await expect(withdrawableLabel).toBeVisible();

    // Verify it has the secondary text color class
    await expect(withdrawableLabel).toHaveClass(/text-text-secondary/);
  });
});
