/**
 * Test: Withdrawal flow navigation
 * Feature ID: 161
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Withdrawal Flow Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');

    // Wait for stores to be available
    await page.waitForFunction(() => {
      return typeof window !== 'undefined' && (window as any).stores;
    }, { timeout: 10000 });

    // Populate account state to make account balance visible
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

  test('Step 1: Withdraw button is visible in Account Balance component', async ({ page }) => {
    const accountBalance = page.locator('[data-testid="account-balance"]');

    // Verify withdraw button is present
    const withdrawButton = accountBalance.locator('[data-testid="withdraw-button"]');
    await expect(withdrawButton).toBeVisible();
    await expect(withdrawButton).toHaveText('Withdraw');
  });

  test('Step 2: Clicking withdraw button opens withdrawal modal', async ({ page }) => {
    // Click withdraw button
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(300);

    // Verify modal is visible by checking for modal title
    const modalTitle = page.locator('text=Withdraw Funds');
    await expect(modalTitle).toBeVisible();
  });

  test('Step 3: Modal displays withdrawal instructions', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Verify instructions are shown
    const instructions = page.locator('text=Withdrawal Instructions');
    await expect(instructions).toBeVisible();

    // Verify instruction steps
    const step1 = page.locator('text=Enter the amount you wish to withdraw');
    await expect(step1).toBeVisible();

    const step2 = page.locator('text=Provide your destination wallet address');
    await expect(step2).toBeVisible();
  });

  test('Step 4: Modal displays withdrawal form inputs', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Verify amount input
    const amountInput = page.locator('[data-testid="withdrawal-amount-input"]');
    await expect(amountInput).toBeVisible();
    await expect(amountInput).toHaveAttribute('placeholder', '0.00');

    // Verify address input
    const addressInput = page.locator('[data-testid="withdrawal-address-input"]');
    await expect(addressInput).toBeVisible();
    await expect(addressInput).toHaveAttribute('placeholder', '0x...');
  });

  test('Step 5: Modal displays network information', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Verify network info section
    const networkInfo = page.locator('text=Network Information');
    await expect(networkInfo).toBeVisible();

    // Verify network details
    const network = page.locator('text=Arbitrum One');
    await expect(network).toBeVisible();

    const chainId = page.locator('text=42161');
    await expect(chainId).toBeVisible();

    const asset = page.locator('text=USDC');
    await expect(asset).toBeVisible();
  });

  test('Step 6: Modal displays minimum withdrawal and fee information', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Verify minimum withdrawal
    const minWithdrawal = page.locator('text=Minimum Withdrawal:');
    await expect(minWithdrawal).toBeVisible();

    const minAmount = page.locator('text=10 USDC');
    await expect(minAmount).toBeVisible();

    // Verify withdrawal fee
    const feeLabel = page.locator('text=Withdrawal Fee:');
    await expect(feeLabel).toBeVisible();

    const fee = page.locator('text=~0.5 USDC');
    await expect(fee).toBeVisible();
  });

  test('Step 7: Modal displays important warning message', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Verify warning message
    const warning = page.locator('.text-warning').filter({ hasText: 'Important:' });
    await expect(warning).toBeVisible();

    // Verify warning content
    const warningText = await warning.textContent();
    expect(warningText).toContain('Only withdraw to Arbitrum-compatible wallets');
    expect(warningText).toContain('Double-check the destination address');
    expect(warningText).toContain('Withdrawals cannot be reversed');
  });

  test('Step 8: Modal displays Cancel and Confirm buttons', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Verify Cancel button
    const cancelButton = page.locator('[data-testid="withdrawal-cancel-button"]');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toHaveText('Cancel');

    // Verify Confirm button
    const confirmButton = page.locator('[data-testid="withdrawal-confirm-button"]');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toHaveText('Confirm Withdrawal');
  });

  test('Step 9: Cancel button closes modal', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Verify modal is open
    const modalTitle = page.locator('text=Withdraw Funds');
    await expect(modalTitle).toBeVisible();

    // Click Cancel button
    const cancelButton = page.locator('[data-testid="withdrawal-cancel-button"]');
    await cancelButton.click();
    await page.waitForTimeout(300);

    // Verify modal is closed
    await expect(modalTitle).not.toBeVisible();
  });

  test('Step 10: Withdrawal amount input accepts values', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Fill in amount
    const amountInput = page.locator('[data-testid="withdrawal-amount-input"]');
    await amountInput.fill('100');

    // Verify value
    const value = await amountInput.inputValue();
    expect(value).toBe('100');
  });

  test('Step 11: Withdrawal address input accepts values', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Fill in address
    const addressInput = page.locator('[data-testid="withdrawal-address-input"]');
    await addressInput.fill('0x1234567890abcdef1234567890abcdef12345678');

    // Verify value
    const value = await addressInput.inputValue();
    expect(value).toBe('0x1234567890abcdef1234567890abcdef12345678');
  });

  test('Step 12: Confirm button is disabled when form is incomplete', async ({ page }) => {
    // Open withdrawal modal
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await withdrawButton.click();
    await page.waitForTimeout(300);

    // Verify Confirm button is disabled initially
    const confirmButton = page.locator('[data-testid="withdrawal-confirm-button"]');
    await expect(confirmButton).toBeDisabled();

    // Fill in only amount
    const amountInput = page.locator('[data-testid="withdrawal-amount-input"]');
    await amountInput.fill('100');
    await page.waitForTimeout(100);

    // Verify Confirm button is still disabled
    await expect(confirmButton).toBeDisabled();

    // Fill in address
    const addressInput = page.locator('[data-testid="withdrawal-address-input"]');
    await addressInput.fill('0x1234567890abcdef1234567890abcdef12345678');
    await page.waitForTimeout(100);

    // Verify Confirm button is now enabled
    await expect(confirmButton).toBeEnabled();
  });
});
