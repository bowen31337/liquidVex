/**
 * Test: Deposit flow navigation
 * Feature ID: 159
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Deposit Flow Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application with test mode
    await page.goto('http://localhost:3002?testMode=true');

    // Populate store data to render components
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.getMarketStoreState) {
        const marketState = stores.getMarketStoreState();
        marketState.setIsLoadingOrderBook(false);
        marketState.setIsLoadingTrades(false);
        marketState.setIsLoadingCandles(false);
      }

      // Set wallet as connected for deposit tests
      const walletStore = (window as any).stores?.useWalletStore;
      if (walletStore) {
        walletStore.setState({
          address: '0x1234567890123456789012345678901234567890',
          isConnected: true,
          connecting: false,
        });
      }

      // Populate account state
      const orderStore = (window as any).stores?.useOrderStore;
      if (orderStore) {
        orderStore.setState({
          accountState: {
            equity: 10000,
            marginUsed: 2500,
            availableBalance: 7500,
            withdrawable: 7500,
            crossMarginSummary: {
              accountValue: 10000,
              totalMarginUsed: 2500,
            },
          },
        });
      }
    });

    await page.waitForTimeout(300);
  });

  test('Step 1: Connect wallet', async ({ page }) => {
    // Verify wallet is connected
    const walletButton = page.locator('[data-testid="wallet-connect-button"]');
    await expect(walletButton).toBeVisible();
    await expect(walletButton).toContainText('0x1234...');
  });

  test('Step 2: Click deposit button', async ({ page }) => {
    // Find and click the deposit button - scroll to top first
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    const depositButton = page.locator('[data-testid="deposit-button"]');
    await expect(depositButton).toBeVisible();
    await expect(depositButton).toContainText('Deposit');
    await depositButton.click({ force: true });
  });

  test('Step 3: Verify deposit modal opens', async ({ page }) => {
    // Scroll to top and click deposit button
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    const depositButton = page.locator('[data-testid="deposit-button"]');
    await depositButton.click({ force: true });

    // Verify modal is visible
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();

    // Verify modal title
    const modalTitle = page.locator('h2', { hasText: 'Deposit Funds' });
    await expect(modalTitle).toBeVisible();
  });

  test('Step 4: Verify deposit instructions displayed', async ({ page }) => {
    // Scroll to top and click deposit button
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    const depositButton = page.locator('[data-testid="deposit-button"]');
    await depositButton.click({ force: true });

    // Verify modal is visible
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();

    // Verify key instruction elements are present
    await expect(page.locator('text=Deposit Instructions')).toBeVisible();
    await expect(page.locator('text=Arbitrum')).toBeVisible();
    await expect(page.locator('text=USDC')).toBeVisible();
    await expect(page.locator('text=Network Information')).toBeVisible();

    // Verify warning message
    const warning = page.locator('text=Important');
    await expect(warning).toBeVisible();

    // Verify close button works
    const closeButton = page.locator('button', { hasText: 'Close' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });
});
