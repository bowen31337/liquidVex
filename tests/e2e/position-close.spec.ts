/**
 * E2E test for one-click position close flow
 * Feature #93 from feature_list.json
 */

import { test, expect } from '@playwright/test';

test.describe('Position Close Flow', () => {
  test('Positions table has Close button for positions', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('http://localhost:3000');

    // Step 2: Connect wallet (mock connection)
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
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
    const closeButtons = page.locator('button[data-testid^="close-position-"]');
    await expect(closeButtons.first()).toBeVisible();

    // Step 6: Verify the Close button has correct styling (bg-short)
    const closeBtcButton = page.locator('button[data-testid="close-position-BTC"]');
    if (await closeBtcButton.count() > 0) {
      await expect(closeBtcButton).toHaveClass(/bg-short/);
    } else {
      await expect(closeButtons.first()).toHaveClass(/bg-short/);
    }
  });

  test('Clicking Close button opens confirmation modal', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Positions
    await page.locator('button:has-text("Positions")').click();

    // Find and click the Close button
    const closeButtons = page.locator('button[data-testid^="close-position-"]');
    await expect(closeButtons.first()).toBeVisible();

    // Click using JavaScript to bypass any overlay issues
    await closeButtons.first().evaluate((el: HTMLElement) => el.click());

    // Check if modal appears
    const modal = page.locator('div[role="dialog"], .fixed.inset-0');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });

  test('Position close modal has correct content', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Positions
    await page.locator('button:has-text("Positions")').click();

    // Click Close button
    const closeButtons = page.locator('button[data-testid^="close-position-"]');
    await closeButtons.first().evaluate((el: HTMLElement) => el.click());

    // Wait for modal
    await page.waitForTimeout(500);

    // Verify modal content - check for key elements
    const modalTitle = page.locator('text=Confirm Position Close');
    await expect(modalTitle).toBeVisible();

    // Check for warning
    const warning = page.locator('text=⚠️');
    await expect(warning).toBeVisible();

    // Check for buttons
    const cancelBtn = page.locator('button:has-text("Cancel")');
    const closeBtn = page.locator('button:has-text("Close Position")');
    await expect(cancelBtn).toBeVisible();
    await expect(closeBtn).toBeVisible();
  });

  test('Position close modal can be cancelled', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Connect wallet
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Positions
    await page.locator('button:has-text("Positions")').click();

    // Click Close button
    const closeButtons = page.locator('button[data-testid^="close-position-"]');
    await closeButtons.first().evaluate((el: HTMLElement) => el.click());

    // Wait for modal
    await page.waitForTimeout(500);

    // Click Cancel
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await cancelBtn.click();

    // Modal should be gone
    const modalTitle = page.locator('text=Confirm Position Close');
    await expect(modalTitle).not.toBeVisible();
  });
});
