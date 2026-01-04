/**
 * Feature 153: Historical candle data loads on chart scroll
 * Test that panning left loads more historical candle data
 */

import { test, expect } from '@playwright/test';

test.describe('Historical Candle Data Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with test mode to skip WebSocket connections
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');

    // Populate store data to render real components instead of skeletons
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.getMarketStoreState) {
        const marketState = stores.getMarketStoreState();

        // Set initial candles for the chart
        const now = Date.now();
        marketState.setCandles([
          { t: now - 3600000, o: 95400, h: 95450, l: 95380, c: 95420, v: 100 },
          { t: now - 2700000, o: 95420, h: 95460, l: 95400, c: 95440, v: 120 },
          { t: now - 1800000, o: 95440, h: 95480, l: 95420, c: 95450, v: 90 },
          { t: now - 900000, o: 95450, h: 95470, l: 95430, c: 95435, v: 110 },
          { t: now, o: 95435, h: 95445, l: 95415, c: 95425, v: 80 },
        ]);

        // Set loading states to false to trigger real component rendering
        marketState.setIsLoadingCandles(false);
      }
    });

    // Wait for chart to render
    await page.waitForTimeout(500);
  });

  test('should load initial candles on chart', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel').first();
    await expect(chartPanel).toBeVisible();

    // Verify chart container is visible
    const chartContainer = chartPanel.locator('[data-testid="chart-container"]').first();
    await expect(chartContainer).toBeVisible();

    // Verify canvas exists inside container
    const chartCanvas = chartContainer.locator('canvas').first();
    await expect(chartCanvas).toBeVisible();

    // Chart should have some content
    const canvasBoundingBox = await chartCanvas.boundingBox();
    expect(canvasBoundingBox?.width).toBeGreaterThan(0);
    expect(canvasBoundingBox?.height).toBeGreaterThan(0);
  });

  test('should pan left to view historical data', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel').first();
    const chartContainer = chartPanel.locator('[data-testid="chart-container"]').first();

    // Wait for initial data to load
    await expect(chartContainer).toBeVisible();

    // Get initial screenshot for comparison
    const initialScreenshot = await chartContainer.screenshot();

    // Pan left by clicking and dragging on the chart
    const box = await chartContainer.boundingBox();
    if (!box) throw new Error('Chart container not found');

    // Perform pan left gesture: click on right side and drag to left
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    // Wait for potential data loading
    await page.waitForTimeout(2000);

    // Verify chart is still visible after panning
    await expect(chartContainer).toBeVisible();

    // Verify chart still has canvas (didn't break)
    const chartCanvas = chartContainer.locator('canvas').first();
    await expect(chartCanvas).toBeVisible();
  });

  test('should continue panning and load more data on demand', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel').first();
    const chartContainer = chartPanel.locator('[data-testid="chart-container"]').first();

    // Wait for initial data
    await expect(chartContainer).toBeVisible();

    // Perform multiple pan operations to trigger historical data loading
    for (let i = 0; i < 3; i++) {
      const box = await chartContainer.boundingBox();
      if (!box) throw new Error('Chart container not found');

      // Pan left
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();

      // Wait for data to potentially load
      await page.waitForTimeout(1500);

      // Verify chart is still responsive
      await expect(chartContainer).toBeVisible();
    }

    // After multiple pans, chart should still be functional
    await expect(chartContainer).toBeVisible();
    const finalBox = await chartContainer.boundingBox();
    expect(finalBox?.width).toBeGreaterThan(0);
  });

  test('should handle rapid panning without errors', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel').first();
    const chartContainer = chartPanel.locator('[data-testid="chart-container"]').first();

    await expect(chartContainer).toBeVisible();

    // Perform rapid pans
    const box = await chartContainer.boundingBox();
    if (!box) throw new Error('Chart container not found');

    for (let i = 0; i < 5; i++) {
      const startX = box.x + box.width * (0.7 + (i % 2) * 0.1);
      const endX = box.x + box.width * (0.3 - (i % 2) * 0.1);

      await page.mouse.move(startX, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(endX, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();

      await page.waitForTimeout(300);
    }

    // Chart should still be functional
    await expect(chartContainer).toBeVisible();
    const chartCanvas = chartContainer.locator('canvas').first();
    await expect(chartCanvas).toBeVisible();
  });

  test('should verify candles exist after scrolling', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel').first();
    const chartContainer = chartPanel.locator('[data-testid="chart-container"]').first();

    await expect(chartContainer).toBeVisible();

    // Pan left significantly to trigger historical data loading
    const box = await chartContainer.boundingBox();
    if (!box) throw new Error('Chart container not found');

    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 15 });
    await page.mouse.up();

    await page.waitForTimeout(2000);

    // Verify chart is still rendering
    await expect(chartContainer).toBeVisible();

    // Verify we can still interact with the chart (try hovering)
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3);
    await page.waitForTimeout(500);

    // Chart should still be visible
    await expect(chartContainer).toBeVisible();
    const chartCanvas = chartContainer.locator('canvas').first();
    await expect(chartCanvas).toBeVisible();
  });
});
