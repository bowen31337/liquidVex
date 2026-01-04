/**
 * E2E test for header component
 * Feature #2 from feature_list.json
 */

import { test, expect } from '@playwright/test';

test.describe('Header Component', () => {
  test('Header displays logo, asset selector, and wallet connect button', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('http://localhost:3002');

    // Step 2: Verify logo is displayed on the left side of header
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const logo = header.locator('h1:has-text("liquidVex")');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveCSS('font-weight', '600'); // font-semibold

    // Step 3: Verify asset selector dropdown is present
    // The current implementation shows BTC-PERP in a button
    const assetSelector = header.locator('button:has-text("BTC-PERP")');
    await expect(assetSelector).toBeVisible();

    // Step 4: Verify wallet connect button is displayed on the right
    const walletButton = header.locator('button:has-text("Connect Wallet")');
    await expect(walletButton).toBeVisible();
    await expect(walletButton).toHaveClass(/btn-accent/);

    // Verify header layout structure
    // Header should have flex items-center justify-between
    await expect(header).toHaveClass(/flex.*items-center.*justify-between/);
  });

  test('Header displays price with 24h change percentage', async ({ page }) => {
    await page.goto('http://localhost:3002');

    const header = page.locator('header');

    // Verify current price is displayed
    const priceElement = header.locator('div[class*="text-right"] div.font-mono');
    await expect(priceElement).toBeVisible();
    // Price should be in format like $95,420.50
    const priceText = await priceElement.textContent();
    expect(priceText).toMatch(/\$\d{1,3}(,\d{3})*\.\d{2}/);

    // Verify 24h change percentage is shown
    const changeElement = header.locator('div[class*="text-right"] div.text-long, div[class*="text-right"] div.text-short');
    await expect(changeElement).toBeVisible();
    const changeText = await changeElement.textContent();
    expect(changeText).toMatch(/[+-]\d+\.\d+%/);
  });
});
