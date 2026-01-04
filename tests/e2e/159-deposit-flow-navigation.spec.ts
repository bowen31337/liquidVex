/**
 * Test: Deposit flow navigation
 * Feature ID: 159
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Deposit Flow Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');

    // Wait for stores to be available
    await page.waitForFunction(() => {
      return typeof window !== 'undefined' && (window as any).stores;
    }, { timeout: 10000 });

    // Populate account state to make deposit button visible
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.getOrderStoreState) {
        const orderStoreState = stores.getOrderStoreState();
        if (orderStoreState && orderStoreState.setAccountState) {
          orderStoreState.setAccountState({
            equity: 10000.0,
            marginUsed: 2500.0,
            availableBalance: 7500.0,
            withdrawable: 5000.0,
            crossMarginSummary: {
              accountValue: 10000.0,
              totalMarginUsed: 2500.0,
            },
          });
        }
      }
    });

    // Wait for account balance to render
    await page.waitForSelector('[data-testid="account-balance"]', { timeout: 10000 });
    await page.waitForTimeout(300);
  });

  test('Step 1: Verify deposit button is visible', async ({ page }) => {
    const depositButton = page.locator('[data-testid="deposit-button"]');
    await expect(depositButton).toBeVisible({ timeout: 10000 });
    await expect(depositButton).toContainText('Deposit');
  });

  test('Step 2: Click deposit button opens modal', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // Click using JavaScript to ensure React state updates
    const modalOpened = await page.evaluate(() => {
      const depositButton = document.querySelector('[data-testid="deposit-button"]') as HTMLElement;
      if (depositButton) {
        depositButton.click();
        return true;
      }
      return false;
    });

    expect(modalOpened).toBe(true);

    // Wait for modal to appear
    await page.waitForTimeout(500);
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();
  });

  test('Step 3: Verify deposit modal title', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // Open modal
    await page.evaluate(() => {
      const depositButton = document.querySelector('[data-testid="deposit-button"]') as HTMLElement;
      if (depositButton) depositButton.click();
    });

    await page.waitForTimeout(500);
    const modalTitle = page.locator('h2', { hasText: 'Deposit Funds' });
    await expect(modalTitle).toBeVisible();
  });

  test('Step 4: Verify deposit instructions are displayed', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // Open modal
    await page.evaluate(() => {
      const depositButton = document.querySelector('[data-testid="deposit-button"]') as HTMLElement;
      if (depositButton) depositButton.click();
    });

    await page.waitForTimeout(500);
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();
    await expect(page.locator('text=Deposit Instructions')).toBeVisible();
    // Use exact text match for "Arbitrum One" to avoid matching other "Arbitrum" text
    await expect(page.locator('text=/^Arbitrum One$/')).toBeVisible();
    // Use regex for exact match of USDC token type
    await expect(page.locator('text=/^USDC$/')).toBeVisible();
    await expect(page.locator('text=Network Information')).toBeVisible();
    const warning = page.locator('text=Important');
    await expect(warning).toBeVisible();
  });

  test('Step 5: Verify close button functionality', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // Open modal
    await page.evaluate(() => {
      const depositButton = document.querySelector('[data-testid="deposit-button"]') as HTMLElement;
      if (depositButton) depositButton.click();
    });

    await page.waitForTimeout(500);
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();
    const closeButton = page.locator('button', { hasText: 'Close' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await page.waitForTimeout(300);
    await expect(modal).not.toBeVisible();
  });

  test('Step 6: Verify I Understand button functionality', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // Open modal
    await page.evaluate(() => {
      const depositButton = document.querySelector('[data-testid="deposit-button"]') as HTMLElement;
      if (depositButton) depositButton.click();
    });

    await page.waitForTimeout(500);
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();
    const understandButton = page.locator('button', { hasText: 'I Understand' });
    await expect(understandButton).toBeVisible();
    await understandButton.click();
    await page.waitForTimeout(300);
    await expect(modal).not.toBeVisible();
  });
});
