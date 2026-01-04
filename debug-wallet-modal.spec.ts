/**
 * Debug script for Wallet Connection Modal Issue
 * Comprehensive debugging to identify why wallet modal is not opening
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
          // Try to find React dev tools or state
          const reactInstance = Object.values(document).find((obj: any) => {
            return obj && obj.$$typeof && obj._owner;
          });

          // Check for wallet modal state
          const walletModalState = window.walletModalState || window.walletState;

          return {
            reactInstance: !!reactInstance,
            walletModalState,
            walletModalOpen: window.walletModalOpen,
            walletStore: window.walletStore
          };
        });

        console.log('React state check:', reactState);

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

    // Step 17: Check network requests
    console.log('Step 17: Checking network requests');
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });

    await page.waitForTimeout(1000);
    console.log('Network requests during debug:', requests.slice(-10)); // Last 10 requests

    console.log('=== Debug Complete ===');
  });

  test('Debug wallet modal with force click', async ({ page }) => {
    console.log('=== Force Click Debug ===');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Force click using JavaScript
    const result = await page.evaluate(() => {
      const button = document.querySelector('button[data-testid="wallet-connect-button"]') ||
                     document.querySelector('button:has-text("Connect Wallet")') ||
                     document.querySelector('button.btn-accent');

      if (!button) {
        return { success: false, error: 'Button not found' };
      }

      // Check button state
      const rect = button.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      const isDisabled = button.hasAttribute('disabled');
      const isClickable = !isDisabled && isVisible;

      if (!isClickable) {
        return { success: false, error: `Button not clickable. Visible: ${isVisible}, Disabled: ${isDisabled}` };
      }

      // Try to click
      try {
        button.click();
        return { success: true, message: 'Click executed' };
      } catch (e) {
        return { success: false, error: `Click failed: ${e.message}` };
      }
    });

    console.log('Force click result:', result);

    // Wait and check for modal
    await page.waitForTimeout(3000);

    const modalExists = await page.locator('h2:has-text("Connect Wallet")').isVisible();
    console.log('Modal visible after force click:', modalExists);

    if (modalExists) {
      console.log('Modal appeared after force click!');
      await page.screenshot({ path: '/media/DATA/projects/autonomous-coding-liquidvex/liquidvex/debug-screenshot-3-force-click.png' });
    } else {
      console.log('Modal still not visible after force click');
      // Take another screenshot to see state
      await page.screenshot({ path: '/media/DATA/projects/autonomous-coding-liquidvex/liquidvex/debug-screenshot-4-force-click-no-modal.png' });
    }
  });

  test('Debug wallet modal state management', async ({ page }) => {
    console.log('=== State Management Debug ===');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Check if the wallet modal state is being managed correctly
    const stateCheck = await page.evaluate(() => {
      // Check for Zustand store
      const walletStore = window.walletStore || window.__ZUSTAND_STORE__;

      // Check for React state
      const reactElements = document.querySelectorAll('*');
      let walletModalElements = [];

      // Look for elements that might be the wallet modal
      reactElements.forEach(el => {
        const classes = el.className || '';
        const id = el.id || '';
        const textContent = el.textContent || '';

        if (classes.includes('wallet') ||
            classes.includes('modal') ||
            id.includes('wallet') ||
            id.includes('modal') ||
            textContent.includes('Connect Wallet')) {
          walletModalElements.push({
            tag: el.tagName,
            classes,
            id,
            text: textContent.substring(0, 50),
            visible: el.offsetParent !== null,
            style: el.style.display
          });
        }
      });

      // Check for any wallet-related global state
      const walletState = {
        walletStore,
        walletModalOpen: window.walletModalOpen,
        walletModalState: window.walletModalState,
        walletData: window.walletData,
        walletConnected: window.walletConnected
      };

      return {
        walletState,
        walletModalElements: walletModalElements.slice(0, 10), // First 10 matches
        pageTitle: document.title,
        hasWalletButton: !!document.querySelector('button[data-testid="wallet-connect-button"]')
      };
    });

    console.log('State management check:', JSON.stringify(stateCheck, null, 2));

    // Try to manually trigger modal state
    console.log('Attempting to trigger modal state manually');
    await page.evaluate(() => {
      // Try to set wallet modal state to open
      window.walletModalOpen = true;

      // Try to trigger any global event listeners
      window.dispatchEvent(new CustomEvent('wallet-modal-open'));

      // Try to call any wallet functions
      if (window.openWalletModal) {
        window.openWalletModal();
      }
      if (window.showWalletModal) {
        window.showWalletModal();
      }
    });

    await page.waitForTimeout(2000);

    const modalAfterManual = await page.locator('h2:has-text("Connect Wallet")').isVisible();
    console.log('Modal visible after manual state change:', modalAfterManual);

    if (modalAfterManual) {
      console.log('Modal appeared after manual state change!');
      await page.screenshot({ path: '/media/DATA/projects/autonomous-coding-liquidvex/liquidvex/debug-screenshot-5-manual-state.png' });
    } else {
      console.log('Modal still not visible after manual state change');
      await page.screenshot({ path: '/media/DATA/projects/autonomous-coding-liquidvex/liquidvex/debug-screenshot-6-manual-state-no-modal.png' });
    }
  });
});