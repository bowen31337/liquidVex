/**
 * Debug script for Wallet Connection Modal Issue
 * Focused debugging with better error handling and screenshots
 */

import { test, expect } from '@playwright/test';

test.describe('Wallet Modal Debug', () => {
  test('Debug wallet modal not opening', async ({ page }) => {
    console.log('=== Starting Wallet Modal Debug ===');

    // Step 1: Navigate to application
    console.log('Step 1: Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Step 2: Take initial screenshot
    console.log('Step 2: Taking initial screenshot');
    await page.screenshot({ path: '/media/DATA/projects/autonomous-coding-liquidvex/liquidvex/debug-screenshot-1-before.png' });

    // Step 3: Find wallet connect button
    console.log('Step 3: Locating wallet connect button');
    const walletButton = page.locator('button[data-testid="wallet-connect-button"]');

    // Check if button exists
    const buttonExists = await walletButton.isVisible();
    console.log('Wallet button exists:', buttonExists);

    if (!buttonExists) {
      console.log('ERROR: Wallet button not found!');
      // Try alternative selectors
      const alternativeSelectors = [
        'button:has-text("Connect Wallet")',
        'button.btn-accent',
        'button',
        '[data-testid*="wallet"]',
        'button[aria-label*="wallet"]'
      ];

      for (const selector of alternativeSelectors) {
        try {
          const elements = await page.locator(selector).count();
          console.log(`Alternative selector "${selector}" found ${elements} elements`);
          if (elements > 0) {
            const firstElement = page.locator(selector).first();
            const rect = await firstElement.boundingBox();
            console.log(`First element bounds:`, rect);
          }
        } catch (e) {
          console.log(`Selector "${selector}" failed:`, e.message);
        }
      }
    }

    // Step 4: Check button state and properties
    if (buttonExists) {
      console.log('Step 4: Analyzing button properties');
      const buttonText = await walletButton.textContent();
      const buttonClasses = await walletButton.getAttribute('class');
      const buttonDisabled = await walletButton.getAttribute('disabled');
      const buttonStyle = await walletButton.getAttribute('style');

      console.log('Button text:', buttonText);
      console.log('Button classes:', buttonClasses);
      console.log('Button disabled:', buttonDisabled);
      console.log('Button style:', buttonStyle);

      // Check if button is clickable
      const buttonRect = await walletButton.boundingBox();
      console.log('Button position:', buttonRect);

      // Check if button is covered by other elements
      const isCovered = await page.evaluate((btn) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const elementAtPoint = document.elementFromPoint(centerX, centerY);
        return elementAtPoint !== btn && !btn.contains(elementAtPoint);
      }, await walletButton.elementHandle());

      console.log('Button is covered by another element:', isCovered);

      // Step 5: Check for JavaScript errors before clicking
      console.log('Step 5: Checking console for errors before click');
      let consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Step 6: Click the wallet button
      console.log('Step 6: Clicking wallet connect button');
      try {
        await walletButton.click({ timeout: 5000 });
        console.log('Click successful');

        // Step 7: Wait a moment for modal to appear
        console.log('Step 7: Waiting for modal to appear');
        await page.waitForTimeout(2000);

        // Step 8: Take screenshot after click
        console.log('Step 8: Taking screenshot after click');
        await page.screenshot({ path: '/media/DATA/projects/autonomous-coding-liquidvex/liquidvex/debug-screenshot-2-after-click.png' });

        // Step 9: Check for modal elements
        console.log('Step 9: Looking for modal elements');
        const modalSelectors = [
          'div[style*="z-index: 50"]',
          'div[style*="bg-black bg-opacity-50"]',
          'h2:has-text("Connect Wallet")',
          'div.bg-surface.rounded-lg',
          '[data-modal]',
          '[role="dialog"]'
        ];

        let modalFound = false;
        for (const selector of modalSelectors) {
          try {
            const count = await page.locator(selector).count();
            console.log(`Modal selector "${selector}" found ${count} elements`);
            if (count > 0) {
              const firstElement = page.locator(selector).first();
              const isVisible = await firstElement.isVisible();
              console.log(`First element visible:`, isVisible);
              if (isVisible) {
                const rect = await firstElement.boundingBox();
                console.log(`Element bounds:`, rect);
                modalFound = true;
              }
            }
          } catch (e) {
            console.log(`Modal selector "${selector}" failed:`, e.message);
          }
        }

        // Step 10: Check console errors after click
        console.log('Step 10: Checking console errors after click');
        console.log('Console errors during click:', consoleErrors);

        // Step 11: Check page state
        console.log('Step 11: Checking page state');
        const url = page.url();
        const title = await page.title();
        console.log('Current URL:', url);
        console.log('Page title:', title);

        // Step 12: Check for any alerts or dialogs
        console.log('Step 12: Checking for dialogs');
        page.on('dialog', async dialog => {
          console.log('Dialog detected:', dialog.type(), dialog.message());
          await dialog.accept();
        });

        // Step 13: Check if modal might be hidden
        console.log('Step 13: Checking for hidden modal');
        const hiddenModalSelectors = [
          'div[style*="display: none"]',
          'div[style*="visibility: hidden"]',
          'div[style*="opacity: 0"]',
          'div[style*="z-index: -1"]'
        ];

        for (const selector of hiddenModalSelectors) {
          try {
            const count = await page.locator(selector).count();
            console.log(`Hidden modal selector "${selector}" found ${count} elements`);
          } catch (e) {
            console.log(`Hidden modal selector "${selector}" failed:`, e.message);
          }
        }

        // Step 14: Check DOM structure for modal
        console.log('Step 14: Checking DOM structure for modal');
        const bodyHtml = await page.locator('body').innerHTML();
        const hasModalBackdrop = bodyHtml.includes('bg-black bg-opacity-50');
        const hasModalContent = bodyHtml.includes('Connect Wallet');
        const hasZIndex = bodyHtml.includes('z-index');

        console.log('Body contains modal backdrop class:', hasModalBackdrop);
        console.log('Body contains "Connect Wallet" text:', hasModalContent);
        console.log('Body contains z-index style:', hasZIndex);

        // Step 15: Check for React state or component issues
        console.log('Step 15: Checking React state');
        const reactState = await page.evaluate(() => {
          // Check for wallet modal state
          const walletModalState = window.walletModalState || window.walletState;

          return {
            walletModalState,
            walletModalOpen: window.walletModalOpen,
            walletStore: window.walletStore
          };
        });

        console.log('React state check:', reactState);

        // Step 16: Final assessment
        console.log('=== FINAL ASSESSMENT ===');
        console.log('Button clicked successfully:', true);
        console.log('Modal elements found:', modalFound);
        console.log('Console errors:', consoleErrors);
        console.log('Modal visibility status:', await page.locator('h2:has-text("Connect Wallet")').isVisible());

      } catch (clickError) {
        console.log('Click failed:', clickError.message);

        // Try different click methods
        console.log('Trying alternative click methods...');

        try {
          await walletButton.click({ position: { x: 10, y: 10 }, timeout: 5000 });
          console.log('Position click successful');
        } catch (posError) {
          console.log('Position click failed:', posError.message);
        }

        try {
          await page.evaluate((btn) => btn.click(), await walletButton.elementHandle());
          console.log('Evaluate click successful');
        } catch (evalError) {
          console.log('Evaluate click failed:', evalError.message);
        }
      }
    }

    // Step 16: Check for any remaining console errors
    console.log('Step 16: Final console check');
    console.log('All console errors:', consoleErrors);

    console.log('=== Debug Complete ===');
  });
});