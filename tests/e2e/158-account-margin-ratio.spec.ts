/**
 * Test: Account margin ratio display
 * Feature ID: 158
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Account Margin Ratio Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');

    // Wait for account balance to be visible (it uses mock data by default)
    await page.waitForSelector('[data-testid="account-balance"]', { timeout: 15000 });
    await page.waitForTimeout(500);
  });

  test('Step 1: Locate margin ratio indicator', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');

    // Verify margin utilization section is visible
    const marginUtilization = accountBalance.locator('text=Margin Utilization');
    await expect(marginUtilization).toBeVisible();
  });

  test('Step 2: Verify ratio is displayed correctly', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');

    // With equity=10000 and marginUsed=2500 (from useAccount mock), ratio should be 25.0%
    const marginUtilizationSection = accountBalance.locator('text=Margin Utilization').locator('..');
    const ratioText = await marginUtilizationSection.textContent();

    // Should contain the percentage
    expect(ratioText).toContain('25.0%');
  });

  test('Step 3: Verify color changes with risk level - low risk (25%)', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');

    // With 25% utilization, should show green (bg-accent) - low risk
    // Use attribute selector to find the colored bar (has bg-accent, bg-warning, or bg-loss)
    const coloredBar = accountBalance.locator('div[class*="bg-accent"], div[class*="bg-warning"], div[class*="bg-loss"]').first();
    await expect(coloredBar).toBeVisible();

    // Should have bg-accent class for low utilization (25% < 70%)
    const classAttr = await coloredBar.getAttribute('class');
    expect(classAttr).toContain('bg-accent');
  });

  test('Step 4: Verify color changes with risk level - medium risk', async ({ page }) => {
    // Update account state to medium risk (75% utilization)
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.getOrderStoreState) {
        const orderStoreState = stores.getOrderStoreState();
        if (orderStoreState && orderStoreState.setAccountState) {
          orderStoreState.setAccountState({
            equity: 10000.0,
            marginUsed: 7500.0,  // 75% utilization
            availableBalance: 2500.0,
            withdrawable: 2000.0,
            crossMarginSummary: {
              accountValue: 10000.0,
              totalMarginUsed: 7500.0,
            },
          });
        }
      }
    });

    await page.waitForTimeout(500);

    const accountBalance = page.locator('[data-testid="account-balance"]');
    const coloredBar = accountBalance.locator('div[class*="bg-accent"], div[class*="bg-warning"], div[class*="bg-loss"]').first();

    // Should have bg-warning class for medium utilization (75% > 70% and < 90%)
    const classAttr = await coloredBar.getAttribute('class');
    expect(classAttr).toContain('bg-warning');
  });

  test('Step 5: Verify color changes with risk level - high risk', async ({ page }) => {
    // Update account state to high risk (95% utilization)
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.getOrderStoreState) {
        const orderStoreState = stores.getOrderStoreState();
        if (orderStoreState && orderStoreState.setAccountState) {
          orderStoreState.setAccountState({
            equity: 10000.0,
            marginUsed: 9500.0,  // 95% utilization
            availableBalance: 500.0,
            withdrawable: 500.0,
            crossMarginSummary: {
              accountValue: 10000.0,
              totalMarginUsed: 9500.0,
            },
          });
        }
      }
    });

    await page.waitForTimeout(500);

    const accountBalance = page.locator('[data-testid="account-balance"]');
    const coloredBar = accountBalance.locator('div[class*="bg-accent"], div[class*="bg-warning"], div[class*="bg-loss"]').first();

    // Should have bg-loss class for high utilization (> 90%)
    const classAttr = await coloredBar.getAttribute('class');
    expect(classAttr).toContain('bg-loss');
  });

  test('Step 6: Verify margin utilization bar width scales with ratio', async ({ page }) => {
    // Update account state to 50% utilization
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.getOrderStoreState) {
        const orderStoreState = stores.getOrderStoreState();
        if (orderStoreState && orderStoreState.setAccountState) {
          orderStoreState.setAccountState({
            equity: 10000.0,
            marginUsed: 5000.0,  // 50% utilization
            availableBalance: 5000.0,
            withdrawable: 5000.0,
            crossMarginSummary: {
              accountValue: 10000.0,
              totalMarginUsed: 5000.0,
            },
          });
        }
      }
    });

    await page.waitForTimeout(500);

    const accountBalance = page.locator('[data-testid="account-balance"]');
    const coloredBar = accountBalance.locator('div[class*="bg-accent"], div[class*="bg-warning"], div[class*="bg-loss"]').first();

    // Should have bg-accent class (50% < 70%)
    const classAttr = await coloredBar.getAttribute('class');
    expect(classAttr).toContain('bg-accent');

    // Verify the width style is set (50%)
    const style = await coloredBar.getAttribute('style');
    expect(style).toContain('width: 50%');
  });

  test('Step 7: Verify margin utilization percentage text updates', async ({ page }) => {
    // Update account state to 85% utilization
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.getOrderStoreState) {
        const orderStoreState = stores.getOrderStoreState();
        if (orderStoreState && orderStoreState.setAccountState) {
          orderStoreState.setAccountState({
            equity: 10000.0,
            marginUsed: 8500.0,  // 85% utilization
            availableBalance: 1500.0,
            withdrawable: 1500.0,
            crossMarginSummary: {
              accountValue: 10000.0,
              totalMarginUsed: 8500.0,
            },
          });
        }
      }
    });

    await page.waitForTimeout(500);

    const accountBalance = page.locator('[data-testid="account-balance"]');

    // Find the percentage text next to "Margin Utilization"
    const marginUtilizationSection = accountBalance.locator('text=Margin Utilization').locator('..');
    const ratioText = await marginUtilizationSection.textContent();

    // Should show 85.0%
    expect(ratioText).toContain('85.0%');
  });
});
