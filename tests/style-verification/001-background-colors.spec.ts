/**
 * Test to verify that application uses correct background colors per design system
 * Feature: Application uses correct background colors per design system
 */

import { test, expect } from '@playwright/test';

test.describe('Background Colors - Design System Compliance', () => {
  test('verifies main layout uses correct background colors', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await expect(page.locator('body')).toBeVisible();

    // Check main background color (should be #0a0a0a)
    const bodyStyle = await page.locator('body').evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Convert to hex for comparison
    const bodyColor = rgbToHex(bodyStyle);
    expect(bodyColor.toLowerCase()).toBe('#0a0a0a');

    // Check header background color (should be #171717)
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    const headerStyle = await header.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const headerColor = rgbToHex(headerStyle);
    expect(headerColor.toLowerCase()).toBe('#171717');
  });

  test('verifies trading grid panels use correct background colors', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for trading grid to load
    await page.waitForSelector('.chart-panel', { timeout: 10000 });

    // Check Chart Panel background color (should be #171717)
    const chartPanel = page.locator('.chart-panel').first();
    await expect(chartPanel).toBeVisible();

    const chartPanelStyle = await chartPanel.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const chartPanelColor = rgbToHex(chartPanelStyle);
    expect(chartPanelColor.toLowerCase()).toBe('#171717');

    // Check Order Book Panel background color (should be #171717)
    // Note: This might be the middle column containing both Order Book and Recent Trades
    const middlePanel = page.locator('.orderbook-panel, .panel').nth(1);
    if (await middlePanel.isVisible()) {
      const middlePanelStyle = await middlePanel.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      const middlePanelColor = rgbToHex(middlePanelStyle);
      expect(middlePanelColor.toLowerCase()).toBe('#171717');
    }

    // Check Order Entry Panel background color (should be #171717)
    const orderEntryPanel = page.locator('div').filter({ has: page.locator('[data-testid="order-entry-panel"]') }).first();
    await expect(orderEntryPanel).toBeVisible();

    const orderEntryStyle = await orderEntryPanel.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const orderEntryColor = rgbToHex(orderEntryStyle);
    expect(orderEntryColor.toLowerCase()).toBe('#171717');
  });

  test('verifies bottom panel uses correct background color', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for bottom panel to load
    const bottomPanel = page.locator('[data-testid="bottom-panel"]').first();
    await expect(bottomPanel).toBeVisible();

    const bottomPanelStyle = await bottomPanel.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const bottomPanelColor = rgbToHex(bottomPanelStyle);
    expect(bottomPanelColor.toLowerCase()).toBe('#171717');
  });

  test('verifies elevated panels use correct background color', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Check if any elevated panels exist (modals, tooltips, etc.)
    // These should use #262626 (surface-elevated)
    const elevatedElements = page.locator('.panel-elevated, .bg-surface-elevated, .bg-surface-elevated\\:bg-surface-elevated');

    if (await elevatedElements.count() > 0) {
      const elevatedStyle = await elevatedElements.first().evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      const elevatedColor = rgbToHex(elevatedStyle);
      expect(elevatedColor.toLowerCase()).toBe('#262626');
    }
  });
});

// Helper function to convert RGB to Hex
function rgbToHex(rgb: string): string {
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#000000';

  // Handle rgb(r, g, b) format
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Handle rgba format
  const rgbaMatch = rgb.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // If already in hex format, return as is
  if (rgb.startsWith('#')) {
    return rgb;
  }

  // Default fallback
  return '#000000';
}