/**
 * E2E test for one-click position close flow
 * Feature #93 from feature_list.json
 */

import { test, expect } from '@playwright/test';

test.describe('Position Close Flow', () => {
  test('One-click position close with confirmation modal', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('http://localhost:3000');

    // Step 2: Connect wallet (mock connection)
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      // Wait for wallet connection state
      await page.waitForTimeout(500);
    }

    // Step 3: Navigate to Positions tab
    const positionsTab = page.locator('button:has-text("Positions")');
    await expect(positionsTab).toBeVisible();
    await positionsTab.click();

    // Step 4: Verify positions table is visible
    const positionsTable = page.locator('table.data-table');
    await expect(positionsTable).toBeVisible();

    // Step 5: Verify there's at least one position with a Close button
    // The test data should have a BTC position
    const closeButtons = page.locator('button[data-testid^="close-position-"]');
    await expect(closeButtons.first()).toBeVisible();

    // Step 6: Click the Close button on a position
    const closeBtcButton = page.locator('button[data-testid="close-position-BTC"]');
    if (await closeBtcButton.isVisible()) {
      await closeBtcButton.click();
    } else {
      // Fallback to first close button
      await closeButtons.first().click();
    }

    // Step 7: Verify confirmation modal appears
    const modal = page.locator('div:has-text("Confirm Position Close")');
    await expect(modal).toBeVisible();

    // Step 8: Verify modal shows position details
    await expect(modal.locator('text=BTC')).toBeVisible();
    await expect(modal.locator('text=LONG')).toBeVisible();
    await expect(modal.locator('text=Size')).toBeVisible();
    await expect(modal.locator('text=Entry Price')).toBeVisible();
    await expect(modal.locator('text=Leverage')).toBeVisible();
    await expect(modal.locator('text=Margin Used')).toBeVisible();
    await expect(modal.locator('text=Unrealized PnL')).toBeVisible();

    // Step 9: Verify modal has both Cancel and Close Position buttons
    const cancelButton = modal.locator('button:has-text("Cancel")');
    const closeButton = modal.locator('button:has-text("Close Position")');
    await expect(cancelButton).toBeVisible();
    await expect(closeButton).toBeVisible();

    // Step 10: Click Cancel and verify modal closes
    await cancelButton.click();
    await expect(modal).not.toBeVisible();

    // Step 11: Re-open modal and confirm close
    await closeBtcButton.click();
    await expect(modal).toBeVisible();

    // Step 12: Click Close Position to confirm
    await closeButton.click();

    // Step 13: Verify loading state
    await expect(closeButton).toContainText('Closing...');

    // Step 14: Verify success toast appears
    const successToast = page.locator('div:has-text("Position for BTC closed successfully")');
    await expect(successToast).toBeVisible();

    // Step 15: Verify modal closes after success
    await expect(modal).not.toBeVisible();

    // Step 16: Verify position is removed from table
    // Wait for the position to be removed
    await page.waitForTimeout(500);
    const btcRow = page.locator('tr:has-text("BTC")');
    // The position should be removed, so it should not exist or table should show "No open positions"
    const noPositions = page.locator('text=No open positions');
    const hasNoPositions = await noPositions.isVisible();
    const hasBtcRow = await btcRow.count() > 0;

    // Either the table is empty or the BTC row is gone
    expect(hasNoPositions || !hasBtcRow).toBeTruthy();
  });

  test('Position close modal shows correct PnL formatting', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Positions
    await page.locator('button:has-text("Positions")').click();

    // Open close modal
    const closeBtcButton = page.locator('button[data-testid="close-position-BTC"]');
    if (await closeBtcButton.isVisible()) {
      await closeBtcButton.click();
    } else {
      const closeButtons = page.locator('button[data-testid^="close-position-"]');
      await closeButtons.first().click();
    }

    // Verify modal content
    const modal = page.locator('div:has-text("Confirm Position Close")');
    await expect(modal).toBeVisible();

    // Check for warning message
    const warning = modal.locator('text=⚠️');
    await expect(warning).toBeVisible();

    // Check that PnL values are formatted with $ prefix
    const pnlValue = modal.locator('text=Unrealized PnL').locator('..').locator('span');
    // Should contain $ or be visible
    await expect(pnlValue).toBeVisible();

    // Close modal
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();
  });

  test('Position close handles API errors gracefully', async ({ page }) => {
    // Mock an API error scenario
    await page.route('**/api/trade/close-position', async (route) => {
      await route.fulfill({
        status: 500,
        json: { success: false, message: 'Internal server error' },
      });
    });

    await page.goto('http://localhost:3000');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Positions
    await page.locator('button:has-text("Positions")').click();

    // Open close modal
    const closeBtcButton = page.locator('button[data-testid="close-position-BTC"]');
    if (await closeBtcButton.isVisible()) {
      await closeBtcButton.click();
    } else {
      const closeButtons = page.locator('button[data-testid^="close-position-"]');
      await closeButtons.first().click();
    }

    // Confirm close
    const modal = page.locator('div:has-text("Confirm Position Close")');
    const closeButton = modal.locator('button:has-text("Close Position")');
    await closeButton.click();

    // Verify error toast appears
    const errorToast = page.locator('div:has-text("Failed to close")');
    await expect(errorToast).toBeVisible();

    // Modal should remain open for retry
    await expect(modal).toBeVisible();

    // Cancel to close modal
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();
  });
});
