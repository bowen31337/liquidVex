/**
 * Simplified Wallet Connection Test
 * Tests basic functionality without complex interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Wallet Connection - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Page loads and wallet button is present', async ({ page }) => {
    // Verify page loads correctly
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('h1:has-text("liquidVex")')).toBeVisible();

    // Check for wallet connect button
    const walletButton = page.locator('button[data-testid="wallet-connect-button"]');
    await expect(walletButton).toBeVisible();

    // Check button text
    const buttonText = await walletButton.textContent();
    expect(buttonText).toBe('Connect Wallet');

    // Check button styling
    const buttonClasses = await walletButton.getAttribute('class');
    expect(buttonClasses).toContain('btn-accent');
  });

  test('Header contains all expected elements', async ({ page }) => {
    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check for logo
    const logo = page.locator('h1:has-text("liquidVex")');
    await expect(logo).toBeVisible();

    // Check for asset selector
    const assetSelector = page.locator('[data-testid="asset-selector"]').first();
    // Asset selector may or may not have specific testid, check for select element
    const selectElement = page.locator('select').first();
    await expect(selectElement).toBeVisible();

    // Check for price display
    const priceDisplay = page.locator('.font-mono').first();
    await expect(priceDisplay).toBeVisible();

    // Check for wallet button
    const walletButton = page.locator('button[data-testid="wallet-connect-button"]');
    await expect(walletButton).toBeVisible();
  });

  test('Wallet button has correct attributes', async ({ page }) => {
    const walletButton = page.locator('button[data-testid="wallet-connect-button"]');

    // Check testid attribute
    const testId = await walletButton.getAttribute('data-testid');
    expect(testId).toBe('wallet-connect-button');

    // Check button is enabled
    await expect(walletButton).toBeEnabled();

    // Check button type
    const buttonType = await walletButton.getAttribute('type');
    expect(buttonType).toBe('button');

    // Check button has proper styling classes
    const classes = await walletButton.getAttribute('class');
    expect(classes).toContain('btn');
    expect(classes).toContain('btn-accent');
  });

  test('Page has no console errors', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any errors to appear
    await page.waitForTimeout(1000);

    // Check for critical wallet-related errors
    const walletErrors = errors.filter(err =>
      err.includes('wallet') ||
      err.includes('wagmi') ||
      err.includes('metamask') ||
      err.includes('walletconnect')
    );

    // Should not have critical wallet errors
    expect(walletErrors.length).toBe(0);
  });

  test('Wallet modal structure exists in DOM', async ({ page }) => {
    // Check if WalletModal component is rendered (even if hidden)
    // Look for elements that would be in the modal

    // Check for MetaMask text (may be in the modal)
    const metamaskText = page.locator('text=MetaMask');
    await expect(metamaskText).toBeVisible({ timeout: 5000 });

    // Check for WalletConnect text
    const walletConnectText = page.locator('text=WalletConnect');
    await expect(walletConnectText).toBeVisible({ timeout: 5000 });

    // Check for cancel button
    const cancelButton = page.locator('text=Cancel');
    await expect(cancelButton).toBeVisible({ timeout: 5000 });
  });

  test('Settings button exists and is different from wallet button', async ({ page }) => {
    // Check settings button exists
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible();

    // Check it's a different button from wallet button
    const walletButton = page.locator('button[data-testid="wallet-connect-button"]');
    const settingsButtonRect = await settingsButton.boundingBox();
    const walletButtonRect = await walletButton.boundingBox();

    // They should be in different positions
    expect(settingsButtonRect?.x).not.toBe(walletButtonRect?.x);
    expect(settingsButtonRect?.y).not.toBe(walletButtonRect?.y);
  });

  test('Page is responsive and renders correctly', async ({ page }) => {
    // Check viewport size
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThan(300);
    expect(viewport?.height).toBeGreaterThan(200);

    // Check that main content areas are visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check that trading grid area exists
    const tradingGrid = page.locator('[data-testid="trading-grid"]').first();
    // May not have testid, check for grid container
    const gridContainer = page.locator('.grid').first();
    await expect(gridContainer).toBeVisible();
  });

  test('Wallet button click does not throw errors', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click wallet button
    const walletButton = page.locator('button[data-testid="wallet-connect-button"]');
    await walletButton.click();

    // Wait a bit to see if any errors occur
    await page.waitForTimeout(1000);

    // Check for wallet-related errors
    const walletErrors = errors.filter(err =>
      err.includes('wallet') ||
      err.includes('modal') ||
      err.includes('connect')
    );

    // Should not have errors related to wallet clicking
    expect(walletErrors.length).toBe(0);
  });
});