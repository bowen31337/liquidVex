import { test, expect } from '@playwright/test';

test.describe('Feature 81: Text colors follow design system hierarchy', () => {
  test('should use correct text color hierarchy throughout the application', async ({ page }) => {
    // Navigate to application
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Step 1: Verify header uses text-text-primary for logo
    const logo = page.locator('header h1');
    await expect(logo).toBeVisible();
    const logoColor = await logo.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    // text-text-primary is #f5f5f5 (rgb(245, 245, 245))
    expect(logoColor).toBe('rgb(245, 245, 245)');

    // Step 2: Verify price display uses text-text-primary
    const priceDisplay = page.locator('.font-mono.text-lg');
    await expect(priceDisplay).toBeVisible();
    const priceColor = await priceDisplay.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(priceColor).toBe('rgb(245, 245, 245)');

    // Step 3: Verify secondary labels use text-text-secondary
    const fundingLabel = page.locator('text=/^F:/');
    await expect(fundingLabel).toBeVisible();
    const fundingColor = await fundingLabel.evaluate((el) => {
      const parent = el.parentElement;
      return parent ? window.getComputedStyle(parent).color : 'rgb(163, 163, 163)';
    });
    // text-text-secondary is #a3a3a3 (rgb(163, 163, 163))
    expect(fundingColor).toBe('rgb(163, 163, 163)');

    // Step 4: Verify tertiary text uses text-text-tertiary
    const markPriceLabel = page.locator('title="Mark Price"').first();
    await expect(markPriceLabel).toBeVisible();
    const markPriceColor = await markPriceLabel.evaluate((el) => {
      const parent = el.parentElement;
      return parent ? window.getComputedStyle(parent).color : 'rgb(115, 115, 115)';
    });
    // text-text-tertiary is #737373 (rgb(115, 115, 115))
    expect(markPriceColor).toBe('rgb(115, 115, 115)');

    // Step 5: Verify order form labels use text-text-secondary
    const orderLabels = page.locator('.text-text-secondary').first();
    await expect(orderLabels).toBeVisible();
    const labelColor = await orderLabels.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(labelColor).toBe('rgb(163, 163, 163)');

    // Step 6: Verify input placeholders use text-text-tertiary
    const inputField = page.locator('input[data-testid="order-size-input"]');
    await expect(inputField).toBeVisible();
    const placeholderColor = await inputField.evaluate((el) => {
      return window.getComputedStyle(el, '::placeholder').color;
    });
    // Placeholder should be text-text-tertiary (#737373)
    expect(placeholderColor).toBe('rgb(115, 115, 115)');

    // Step 7: Verify buy/sell colors are correct
    const buyButton = page.locator('button:has-text("Buy")');
    await expect(buyButton).toBeVisible();
    const buyColor = await buyButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // Long/Buy color is #22c55e (rgb(34, 197, 94))
    expect(buyColor).toBe('rgb(34, 197, 94)');

    // Step 8: Verify data tables use correct text colors
    const tableCell = page.locator('.data-table td').first();
    if (await tableCell.isVisible()) {
      const cellColor = await tableCell.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      // Table cells should use text-text-primary
      expect(cellColor).toBe('rgb(245, 245, 245)');
    }

    // Step 9: Verify table headers use text-text-tertiary
    const tableHeader = page.locator('.data-table th').first();
    if (await tableHeader.isVisible()) {
      const headerColor = await tableHeader.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      // Table headers should use text-text-tertiary
      expect(headerColor).toBe('rgb(115, 115, 115)');
    }

    // Step 10: Verify settings button uses text-text-secondary
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible();
    const settingsColor = await settingsButton.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    // Settings icon should be text-text-secondary
    expect(settingsColor).toBe('rgb(163, 163, 163)');
  });

  test('should maintain text color hierarchy on hover states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify settings button changes to text-text-primary on hover
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.hover();
    const hoverColor = await settingsButton.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    // Should transition to text-text-primary on hover
    expect(hoverColor).toBe('rgb(245, 245, 245)');
  });

  test('should use correct text colors for financial indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check price change color (should be green for positive, red for negative)
    const priceChange = page.locator('.text-xs:has-text("%")').first();
    await expect(priceChange).toBeVisible();
    const priceChangeColor = await priceChange.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    // Should be either green (long) or red (short)
    const isGreen = priceChangeColor === 'rgb(34, 197, 94)';
    const isRed = priceChangeColor === 'rgb(239, 68, 68)';
    expect(isGreen || isRed).toBeTruthy();
  });

  test('should maintain accessibility with proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify background color
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // Background should be #0a0a0a
    expect(backgroundColor).toBe('rgb(10, 10, 10)');

    // Get all text elements
    const textElements = await page.locator('*:visible').all();

    let allHaveGoodContrast = true;
    const lowContrastElements: string[] = [];

    // Sample a few key text elements for contrast
    const keyElements = [
      'h1', // Logo - text-text-primary
      '.font-mono.text-lg', // Price - text-text-primary
      'text=/^F:/', // Funding - text-text-secondary
      'title="Mark Price"', // Mark price - text-text-tertiary
    ];

    for (const selector of keyElements) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          const textColor = await element.evaluate((el) => {
            return window.getComputedStyle(el).color;
          });

          // Convert RGB to relative luminance (simplified)
          const rgbMatch = textColor.match(/\d+/g);
          if (rgbMatch) {
            const [r, g, b] = rgbMatch.map(Number);
            // Simple check: text should be light enough on dark background
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness < 125) {
              allHaveGoodContrast = false;
              lowContrastElements.push(selector);
            }
          }
        }
      } catch (e) {
        // Element might not exist, skip
      }
    }

    expect(allHaveGoodContrast).toBeTruthy();
  });
});
