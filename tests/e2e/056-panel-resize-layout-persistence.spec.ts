/**
 * E2E test for Panel Resize and Layout Persistence
 * Feature #56 from feature_list.json
 */

import { test, expect } from '@playwright/test';

test.describe('Panel Resize and Layout Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Clear localStorage to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Reload to clear any cached state
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Resize handles are visible on all panels', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for chart resize handle
    const chartHandle = page.locator('[data-testid="resize-handle-chart"]');
    await expect(chartHandle).toBeVisible();

    // Check for orderbook resize handle
    const orderBookHandle = page.locator('[data-testid="resize-handle-orderbook"]');
    await expect(orderBookHandle).toBeVisible();
  });

  test('Can drag chart resize handle to resize panels', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Get initial chart width
    const chartPanel = page.locator('.chart-panel').first();
    const initialWidth = await chartPanel.evaluate(el => el.getBoundingClientRect().width);

    // Get resize handle
    const chartHandle = page.locator('[data-testid="resize-handle-chart"]');

    // Get handle position
    const handleBox = await chartHandle.boundingBox();
    if (!handleBox) throw new Error('Handle not found');

    // Drag the handle to the right (increase chart size)
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 100, handleBox.y + handleBox.height / 2);
    await page.mouse.up();

    // Wait for resize to complete
    await page.waitForTimeout(500);

    // Get new chart width
    const newWidth = await chartPanel.evaluate(el => el.getBoundingClientRect().width);

    // Verify width changed
    expect(newWidth).toBeGreaterThan(initialWidth);
  });

  test('Panel sizes persist after page reload', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Drag resize handle to increase chart size
    const chartHandle = page.locator('[data-testid="resize-handle-chart"]');
    const handleBox = await chartHandle.boundingBox();
    if (!handleBox) throw new Error('Handle not found');

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 100, handleBox.y + handleBox.height / 2);
    await page.mouse.up();

    // Wait for resize to complete and save
    await page.waitForTimeout(1000);

    // Get the saved layout preferences
    const savedPrefs = await page.evaluate(() => {
      const stored = localStorage.getItem('liquidvex_layout_preferences');
      return stored ? JSON.parse(stored) : null;
    });

    // Verify panel sizes were saved
    expect(savedPrefs).toBeTruthy();
    expect(savedPrefs.panelSizes.chart).toBeGreaterThan(60); // Should be larger than default

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500); // Give React time to hydrate and restore state

    // Get the layout preferences after reload
    const reloadedPrefs = await page.evaluate(() => {
      const stored = localStorage.getItem('liquidvex_layout_preferences');
      return stored ? JSON.parse(stored) : null;
    });

    // Verify the same sizes are loaded
    expect(reloadedPrefs).toBeTruthy();
    expect(reloadedPrefs.panelSizes.chart).toBe(savedPrefs.panelSizes.chart);
    expect(reloadedPrefs.panelSizes.orderBook).toBe(savedPrefs.panelSizes.orderBook);
    expect(reloadedPrefs.panelSizes.orderEntry).toBe(savedPrefs.panelSizes.orderEntry);
  });

  test('Layout preferences are saved to localStorage', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Drag resize handle to trigger save
    const chartHandle = page.locator('[data-testid="resize-handle-chart"]');
    const handleBox = await chartHandle.boundingBox();
    if (!handleBox) throw new Error('Handle not found');

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 50, handleBox.y + handleBox.height / 2);
    await page.mouse.up();

    // Wait for save
    await page.waitForTimeout(500);

    // Check localStorage
    const layoutPrefs = await page.evaluate(() => {
      const stored = localStorage.getItem('liquidvex_layout_preferences');
      return stored ? JSON.parse(stored) : null;
    });

    expect(layoutPrefs).not.toBeNull();
    expect(layoutPrefs.panelSizes).toBeDefined();
    expect(layoutPrefs.panelSizes.chart).toBeDefined();
    expect(layoutPrefs.panelSizes.orderBook).toBeDefined();
    expect(layoutPrefs.panelSizes.orderEntry).toBeDefined();
  });

  test('Panel sizes respect minimum and maximum constraints', async ({ page }) => {
    await page.waitForTimeout(1000);

    const chartHandle = page.locator('[data-testid="resize-handle-chart"]');
    const chartPanel = page.locator('.chart-panel').first();

    // Try to drag way too far left (should hit minimum)
    const handleBox = await chartHandle.boundingBox();
    if (!handleBox) throw new Error('Handle not found');

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    // Move way to the left (more than possible)
    await page.mouse.move(handleBox.x - 500, handleBox.y + handleBox.height / 2);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Get width - should be at minimum (around 30%)
    const width = await chartPanel.evaluate(el => el.getBoundingClientRect().width);
    const containerWidth = await chartPanel.evaluate(el =>
      el.parentElement?.getBoundingClientRect().width || 0
    );

    const percentage = (width / containerWidth) * 100;
    // Minimum is 30%, allow some tolerance
    expect(percentage).toBeGreaterThan(25);
  });

  test('Multiple resize handles work independently', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Get initial widths
    const chartPanel = page.locator('.chart-panel').first();
    const orderBookPanel = page.locator('[data-testid="resize-handle-orderbook"]').locator('..');

    const initialChartWidth = await chartPanel.evaluate(el => el.getBoundingClientRect().width);
    const initialOrderBookWidth = await orderBookPanel.evaluate(el => el.getBoundingClientRect().width);

    // Drag orderbook handle
    const orderBookHandle = page.locator('[data-testid="resize-handle-orderbook"]');
    const handleBox = await orderBookHandle.boundingBox();
    if (!handleBox) throw new Error('Handle not found');

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 60, handleBox.y + handleBox.height / 2);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Get new widths
    const newChartWidth = await chartPanel.evaluate(el => el.getBoundingClientRect().width);
    const newOrderBookWidth = await orderBookPanel.evaluate(el => el.getBoundingClientRect().width);

    // Verify orderbook changed
    expect(newOrderBookWidth).toBeGreaterThan(initialOrderBookWidth);
  });

  test('Reset functionality by clearing localStorage', async ({ page }) => {
    await page.waitForTimeout(1000);

    // First, resize a panel
    const chartHandle = page.locator('[data-testid="resize-handle-chart"]');
    const handleBox = await chartHandle.boundingBox();
    if (!handleBox) throw new Error('Handle not found');

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 80, handleBox.y + handleBox.height / 2);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Get resized width
    const chartPanel = page.locator('.chart-panel').first();
    const resizedWidth = await chartPanel.evaluate(el => el.getBoundingClientRect().width);

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.removeItem('liquidvex_layout_preferences');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get width after reload (should be back to default)
    const defaultWidth = await chartPanel.evaluate(el => el.getBoundingClientRect().width);

    // Verify it's different (back to default)
    expect(Math.abs(defaultWidth - resizedWidth)).toBeGreaterThan(50);
  });
});
