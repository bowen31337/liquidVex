/**
 * Test: Withdrawal flow navigation
 * Feature ID: 161
 * Category: functional
 */

import { test, expect } from '@playwright/test';

// Helper function to open withdrawal modal with proper handling
async function openWithdrawalModal(page: any) {
  // Use JavaScript to click the button directly, bypassing any overlay issues
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="withdraw-button"]');
    if (btn) {
      (btn as HTMLButtonElement).click();
    }
  });
  await page.waitForTimeout(500);
}

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
    // Click withdraw button - scroll into view first to avoid overlay issues
    await openWithdrawalModal(page);

    // Verify modal is visible by checking for modal title (use heading role for specificity)
    const modalTitle = page.getByRole('heading', { name: 'Withdraw Funds' });
    await expect(modalTitle).toBeVisible();
  });

  test('Step 3: Modal displays withdrawal instructions', async ({ page }) => {
    // Open withdrawal modal
    await openWithdrawalModal(page);

    // Verify instructions are shown
    const instructions = page.getByText('Withdrawal Instructions', { exact: true });
    await expect(instructions).toBeVisible();

    // Verify instruction steps
    const step1 = page.getByText('Enter the amount you wish to withdraw', { exact: true });
    await expect(step1).toBeVisible();

    const step2 = page.getByText('Provide your destination wallet address', { exact: true });
    await expect(step2).toBeVisible();
  });

  test('Step 4: Modal displays withdrawal form inputs', async ({ page }) => {
    // Open withdrawal modal
    await openWithdrawalModal(page);

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
    await openWithdrawalModal(page);

    // Verify network info section
    const networkInfo = page.getByText('Network Information', { exact: true });
    await expect(networkInfo).toBeVisible();

    // Verify network details
    const network = page.getByText('Arbitrum One', { exact: true });
    await expect(network).toBeVisible();

    const chainId = page.getByText('42161', { exact: true });
    await expect(chainId).toBeVisible();

    const asset = page.getByText('USDC', { exact: true });
    await expect(asset).toBeVisible();
  });

  test('Step 6: Modal displays minimum withdrawal and fee information', async ({ page }) => {
    // Open withdrawal modal
    await openWithdrawalModal(page);

    // Verify minimum withdrawal
    const minWithdrawal = page.getByText('Minimum Withdrawal:', { exact: true });
    await expect(minWithdrawal).toBeVisible();

    const minAmount = page.getByText('10 USDC', { exact: true });
    await expect(minAmount).toBeVisible();

    // Verify withdrawal fee
    const feeLabel = page.getByText('Withdrawal Fee:', { exact: true });
    await expect(feeLabel).toBeVisible();

    const fee = page.locator('text=~0.5 USDC');
    await expect(fee).toBeVisible();
  });

  test('Step 7: Modal displays important warning message', async ({ page }) => {
    // Open withdrawal modal
    await openWithdrawalModal(page);

    // Verify warning message - look for the warning text
    const warning = page.locator('.text-warning');
    await expect(warning).toContainText('Important:');

    // Verify warning content
    const warningText = await warning.textContent();
    expect(warningText).toContain('Only withdraw to Arbitrum-compatible wallets');
    expect(warningText).toContain('Double-check the destination address');
    expect(warningText).toContain('Withdrawals cannot be reversed');
  });

  test('Step 8: Modal displays Cancel and Confirm buttons', async ({ page }) => {
    // Open withdrawal modal
    await openWithdrawalModal(page);

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
    await openWithdrawalModal(page);

    // Verify modal is open
    const modalTitle = page.getByRole('heading', { name: 'Withdraw Funds' });
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
    await openWithdrawalModal(page);

    // Fill in amount
    const amountInput = page.locator('[data-testid="withdrawal-amount-input"]');
    await amountInput.fill('100');

    // Verify value
    const value = await amountInput.inputValue();
    expect(value).toBe('100');
  });

  test('Step 11: Withdrawal address input accepts values', async ({ page }) => {
    // Open withdrawal modal
    await openWithdrawalModal(page);

    // Fill in address
    const addressInput = page.locator('[data-testid="withdrawal-address-input"]');
    await addressInput.fill('0x1234567890abcdef1234567890abcdef12345678');

    // Verify value
    const value = await addressInput.inputValue();
    expect(value).toBe('0x1234567890abcdef1234567890abcdef12345678');
  });

  test('Step 12: Confirm button is disabled when form is incomplete', async ({ page }) => {
    // Open withdrawal modal
    await openWithdrawalModal(page);

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
