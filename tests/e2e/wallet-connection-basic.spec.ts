/**
 * Basic E2E test for Wallet Connection functionality
 * Tests the core wallet connection flow without MetaMask dependency
 */

import { test, expect } from '@playwright/test';

test.describe('Wallet Connection - Basic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('Page loads with wallet connect button', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check for the wallet connect button
    const walletButton = page.locator('button:has-text("Connect Wallet")');
    await expect(walletButton).toBeVisible();

    // Button should be enabled and clickable
    await expect(walletButton).toBeEnabled();
  });

  test('Wallet modal opens and shows options', async ({ page }) => {
    // Click wallet connect button
    const walletButton = page.locator('button:has-text("Connect Wallet")');
    await walletButton.click();

    // Wait for modal to appear
    const modal = page.locator('h2:has-text("Connect Wallet")');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check for MetaMask option
    const metamaskButton = page.locator('button:has-text("MetaMask")');
    await expect(metamaskButton).toBeVisible();

    // Check for WalletConnect option
    const walletConnectButton = page.locator('button:has-text("WalletConnect")');
    await expect(walletConnectButton).toBeVisible();

    // Check for cancel button
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();
  });

  test('MetaMask button shows proper state when extension not available', async ({ page }) => {
    // Click wallet connect button
    const walletButton = page.locator('button:has-text("Connect Wallet")');
    await walletButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Connect Wallet")')).toBeVisible();

    // Check MetaMask button state
    const metamaskButton = page.locator('button:has-text("MetaMask")');
    await expect(metamaskButton).toBeVisible();

    // Check that it shows "Extension not detected"
    const subtitle = metamaskButton.locator('div:has-text("Extension not detected")');
    await expect(subtitle).toBeVisible();

    // Button should be disabled
    await expect(metamaskButton).toBeDisabled();
  });

  test('WalletConnect button is enabled and clickable', async ({ page }) => {
    // Click wallet connect button
    const walletButton = page.locator('button:has-text("Connect Wallet")');
    await walletButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Connect Wallet")')).toBeVisible();

    // Check WalletConnect button
    const walletConnectButton = page.locator('button:has-text("WalletConnect")');
    await expect(walletConnectButton).toBeVisible();
    await expect(walletConnectButton).toBeEnabled();
  });

  test('Modal can be closed with cancel button', async ({ page }) => {
    // Click wallet connect button
    const walletButton = page.locator('button:has-text("Connect Wallet")');
    await walletButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Connect Wallet")')).toBeVisible();

    // Click cancel
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Modal should close
    const modalBackdrop = page.locator('div[style*="bg-black bg-opacity-50"]');
    await expect(modalBackdrop).not.toBeVisible({ timeout: 3000 });

    // Wallet button should still be visible
    await expect(walletButton).toBeVisible();
  });

  test('Modal can be closed by clicking outside', async ({ page }) => {
    // Click wallet connect button
    const walletButton = page.locator('button:has-text("Connect Wallet")');
    await walletButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Connect Wallet")')).toBeVisible();

    // Click outside (on backdrop)
    const backdrop = page.locator('div[style*="bg-black bg-opacity-50"]');
    await expect(backdrop).toBeVisible();
    await backdrop.click();

    // Modal should close
    await expect(backdrop).not.toBeVisible({ timeout: 3000 });
  });

  test('Wallet modal shows helpful instructions', async ({ page }) => {
    // Click wallet connect button
    const walletButton = page.locator('button:has-text("Connect Wallet")');
    await walletButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Connect Wallet")')).toBeVisible();

    // Check for instructions
    const instructions = page.locator('text=• Select MetaMask to connect your browser wallet');
    await expect(instructions).toBeVisible();

    const walletConnectInstructions = page.locator('text=• Select WalletConnect to connect via QR code');
    await expect(walletConnectInstructions).toBeVisible();

    const networkInstructions = page.locator('text=• You will be prompted to switch to Arbitrum network if needed');
    await expect(networkInstructions).toBeVisible();
  });
});