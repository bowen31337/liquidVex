/**
 * Diagnostic Test to understand wallet connection issues
 */

import { test, expect } from '@playwright/test';

test.describe('Wallet Connection Diagnostic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('Check actual DOM structure', async ({ page }) => {
    // Get page HTML
    const html = await page.content();
    console.log('Page HTML contains:', html.includes('Connect Wallet'));

    // Check for wallet button
    const walletButton = page.locator('button');
    const buttonCount = await walletButton.count();
    console.log('Number of buttons found:', buttonCount);

    for (let i = 0; i < buttonCount; i++) {
      const buttonText = await walletButton.nth(i).textContent();
      const buttonClasses = await walletButton.nth(i).getAttribute('class');
      console.log(`Button ${i}:`, buttonText, buttonClasses);
    }

    // Check for MetaMask/WalletConnect text
    const metamaskText = page.locator('text=MetaMask');
    const metamaskCount = await metamaskText.count();
    console.log('MetaMask text elements found:', metamaskCount);

    const walletConnectText = page.locator('text=WalletConnect');
    const walletConnectCount = await walletConnectText.count();
    console.log('WalletConnect text elements found:', walletConnectCount);

    // Check for modal elements
    const modalBackdrop = page.locator('div[style*="z-index: 50"]');
    const modalBackdropCount = await modalBackdrop.count();
    console.log('Modal backdrop elements found:', modalBackdropCount);

    const modalContent = page.locator('div.bg-surface.rounded-lg');
    const modalContentCount = await modalContent.count();
    console.log('Modal content elements found:', modalContentCount);
  });

  test('Check JavaScript console for errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    console.log('Console errors found:', errors.length);
    errors.forEach((error, index) => {
      console.log(`Error ${index + 1}:`, error);
    });
  });

  test('Check wallet button click behavior', async ({ page }) => {
    const walletButton = page.locator('button:has-text("Connect Wallet")');
    await expect(walletButton).toBeVisible();

    // Click and wait
    await walletButton.click();
    await page.waitForTimeout(2000);

    // Check if anything changed
    const newHtml = await page.content();
    console.log('After click - HTML changed:', newHtml !== await page.content());

    // Check for modal
    const modal = page.locator('h2:has-text("Connect Wallet")');
    const modalExists = await modal.isVisible();
    console.log('Modal title visible after click:', modalExists);
  });
});