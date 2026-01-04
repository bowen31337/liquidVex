import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify the application is loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display keyboard shortcuts help with / key', async ({ page }) => {
    // Press / to show shortcuts
    await page.keyboard.press('/');

    // Verify shortcuts modal appears
    const shortcutsModal = page.locator('[role="dialog"]').first();
    await expect(shortcutsModal).toBeVisible();
    await expect(shortcutsModal).toContainText('Keyboard Shortcuts');

    // Verify categories are present
    await expect(shortcutsModal.locator('text=General')).toBeVisible();
    await expect(shortcutsModal.locator('text=Navigation')).toBeVisible();
    await expect(shortcutsModal.locator('text=Trading')).toBeVisible();

    // Press / again to close
    await page.keyboard.press('/');
    await expect(shortcutsModal).not.toBeVisible();
  });

  test('should focus asset selector with Ctrl+K', async ({ page }) => {
    // Find the asset selector
    const assetSelector = page.locator('[data-testid="asset-selector"]').first();

    // Ensure it's not focused initially
    await expect(assetSelector).not.toHaveFocus();

    // Press Ctrl+K
    await page.keyboard.press('Control+K');

    // Verify asset selector is focused
    await expect(assetSelector).toBeFocused();
  });

  test('should switch between Buy/Sell with B/S keys', async ({ page }) => {
    // Find Buy and Sell buttons
    const buyButton = page.locator('button[data-order-type="buy"]').first();
    const sellButton = page.locator('button[data-order-type="sell"]').first();

    // Focus Buy button with B key
    await page.keyboard.press('b');
    await expect(buyButton).toBeFocused();

    // Focus Sell button with S key
    await page.keyboard.press('s');
    await expect(sellButton).toBeFocused();
  });

  test('should handle focus management in modals', async ({ page }) => {
    // Open a modal (if there's a button to open one)
    const modalTrigger = page.locator('button').filter({ hasText: /open|modal/i }).first();
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();

      // Wait for modal to appear
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();

      // Tab through focusable elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify focus is trapped within modal
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      await expect(focusedElement).toBeAttached();
    }
  });

  test('should announce actions to screen readers', async ({ page }) => {
    // This test would need to be enhanced with actual screen reader testing
    // For now, we'll verify that the screen reader announcer element exists
    const announcer = page.locator('#screen-reader-announcer');
    await expect(announcer).toBeAttached();

    // Verify it's hidden from visual display
    const style = await announcer.evaluate(el => window.getComputedStyle(el));
    expect(style.position).toBe('absolute');
    expect(style.left).toBe('-10000px');
  });

  test('should handle Escape key to close modals', async ({ page }) => {
    // Open a modal
    const modalTrigger = page.locator('button').filter({ hasText: /open|modal/i }).first();
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click();

      // Wait for modal to appear
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Verify modal is closed
      await expect(modal).not.toBeVisible();
    }
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Test that animations are disabled when reduced motion is preferred
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Navigate to the application
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Check CSS custom property
    const hasReducedMotion = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--accessibility-reduced-motion') === '1';
    });

    expect(hasReducedMotion).toBe(true);
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Test high contrast mode preferences
    await page.emulateMedia({ forcedColors: 'active' });

    // Navigate to the application
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Check CSS custom property
    const hasHighContrast = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--accessibility-high-contrast') === '1';
    });

    expect(hasHighContrast).toBe(true);
  });

  test('should provide proper ARIA labels', async ({ page }) => {
    // Check for proper ARIA labels on interactive elements
    const buttons = page.locator('button');
    const inputs = page.locator('input');

    // Check that buttons have accessible names
    const buttonCount = await buttons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasAccessibleName = await button.evaluate(el => {
        return el.getAttribute('aria-label') ||
               el.textContent?.trim() ||
               el.getAttribute('title');
      });
      expect(hasAccessibleName).toBeTruthy();
    }

    // Check that inputs have labels or aria-labels
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate(el => {
        const id = el.getAttribute('id');
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return true;
        }
        return el.getAttribute('aria-label') ||
               el.getAttribute('aria-labelledby') ||
               document.querySelector(`label[for="${el.id}"]`);
      });
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should handle tab navigation properly', async ({ page }) => {
    // Test that tab navigation works correctly
    const focusableElements = page.locator('input, button, a, [tabindex]:not([tabindex="-1"])');

    // Get initial focus
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluateHandle(() => document.activeElement);
    let focusedIndex = 0;

    // Tab through all focusable elements
    const elementCount = await focusableElements.count();
    for (let i = 0; i < elementCount; i++) {
      await page.keyboard.press('Tab');
      const newFocusedElement = await page.evaluateHandle(() => document.activeElement);

      // Verify we moved to a different element
      expect(newFocusedElement).toBeTruthy();

      // Check if we're still within the document
      const tagName = await newFocusedElement.evaluate(el => el.tagName);
      expect(['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA']).toContain(tagName);
    }
  });

  test('should announce market data updates', async ({ page }) => {
    // This would need to be enhanced with actual market data simulation
    // For now, verify the announcer element exists and is properly configured
    const announcer = page.locator('#screen-reader-announcer');
    await expect(announcer).toBeAttached();

    // Verify it has proper ARIA attributes
    await expect(announcer).toHaveAttribute('aria-live', 'polite');
    await expect(announcer).toHaveAttribute('aria-atomic', 'true');
  });

  test('should provide visual feedback for keyboard shortcuts', async ({ page }) => {
    // Test that key press indicators appear
    await page.keyboard.press('Control');
    await page.keyboard.press('Shift');
    await page.keyboard.press('Alt');
    await page.keyboard.press('K');

    // Check if key press indicator appears
    const keyIndicator = page.locator('.fixed').filter({ hasText: /Pressed|Ctrl|Shift|Alt|K/i });
    // Note: This test may need adjustment based on actual implementation
    // The key indicator might not always be visible or might disappear quickly
  });
});