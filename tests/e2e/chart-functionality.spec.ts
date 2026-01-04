/**
 * Chart Functionality Test
 * Feature: Chart complete functionality test
 */

import { test, expect } from '@playwright/test';

test.describe('Chart Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for chart to load
    await page.waitForTimeout(2000);
  });

  test('should render chart with timeframe buttons', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel');
    await expect(chartPanel).toBeVisible();

    // Step 1: Verify chart container is visible
    const chartContainer = chartPanel.locator('[data-testid="chart-container"]');
    await expect(chartContainer).toBeVisible();

    // Step 2: Verify timeframe buttons are present (6 buttons: 1m, 5m, 15m, 1h, 4h, 1D)
    const timeframeButtons = chartPanel.locator('button:has-text("1m"), button:has-text("5m"), button:has-text("15m"), button:has-text("1h"), button:has-text("4h"), button:has-text("1D")');
    await expect(timeframeButtons).toHaveCount(6);

    // Step 3: Verify default timeframe is selected (1h based on Chart component)
    const defaultButton = chartPanel.locator('button:has-text("1h")');
    await expect(defaultButton).toHaveClass(/bg-accent/);
  });

  test('should switch between timeframe buttons', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel');

    // Test switching to 5m timeframe
    const fiveMButton = chartPanel.locator('button:has-text("5m")').first();
    await expect(fiveMButton).toBeVisible();
    await fiveMButton.click();

    // Verify button is now active
    await expect(fiveMButton).toHaveClass(/bg-accent/);

    // Test switching to 15m timeframe
    const fifteenMButton = chartPanel.locator('button:has-text("15m")').first();
    await expect(fifteenMButton).toBeVisible();
    await fifteenMButton.click();

    // Verify button is now active
    await expect(fifteenMButton).toHaveClass(/bg-accent/);

    // Test switching to 1h timeframe
    const oneHButton = chartPanel.locator('button:has-text("1h")').first();
    await expect(oneHButton).toBeVisible();
    await oneHButton.click();

    // Verify button is now active
    await expect(oneHButton).toHaveClass(/bg-accent/);
  });

  test('should render candlestick chart by default', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel');

    // Wait for chart data to load
    await page.waitForTimeout(1000);

    // Verify chart is rendered (lightweight-charts creates canvas elements)
    const chartCanvas = chartPanel.locator('[data-testid="chart-container"] canvas').first();
    await expect(chartCanvas).toBeVisible();

    // Chart should have some content (not empty)
    const canvasBoundingBox = await chartCanvas.boundingBox();
    expect(canvasBoundingBox?.width).toBeGreaterThan(0);
    expect(canvasBoundingBox?.height).toBeGreaterThan(0);
  });

  test('should switch between candlestick and line chart modes', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel');

    // Wait for initial chart to load
    await page.waitForTimeout(1000);

    // Find and click chart type toggle
    const chartTypeToggle = chartPanel.locator('button:has-text("Candles"), button:has-text("Line")');
    await expect(chartTypeToggle).toBeVisible();

    // Click to switch to line chart
    await chartTypeToggle.click();

    // Wait for chart to update
    await page.waitForTimeout(500);

    // Find and click to switch back to candles
    await chartTypeToggle.click();

    // Wait for chart to update
    await page.waitForTimeout(500);

    // Verify chart is still visible
    const chartCanvas = chartPanel.locator('[data-testid="chart-container"] canvas').first();
    await expect(chartCanvas).toBeVisible();
  });

  test('should handle full-screen toggle', async ({ page }) => {
    // Use the chart-panel class for more specific targeting
    const chartPanel = page.locator('.chart-panel');

    // Find full-screen button
    const fullscreenButton = chartPanel.locator('button:has-text("Full"), button:has-text("Exit")');
    await expect(fullscreenButton).toBeVisible();

    // Click to enter full screen
    await fullscreenButton.click();

    // Wait for transition
    await page.waitForTimeout(500);

    // After fullscreen, the panel gets fixed positioning - need to re-locate
    // The button text changes to "Exit" after entering fullscreen
    const exitFullscreenButton = page.locator('button:has-text("Exit")').first();
    await expect(exitFullscreenButton).toBeVisible();
    await exitFullscreenButton.click();

    // Wait for transition
    await page.waitForTimeout(500);

    // Verify chart is still visible
    const chartCanvas = page.locator('[data-testid="chart-container"] canvas').first();
    await expect(chartCanvas).toBeVisible();
  });

  test('should update chart with real-time data from WebSocket', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel');

    // Wait for initial data
    await page.waitForTimeout(2000);

    // Verify chart has data points (multiple candles visible)
    const chartCanvas = chartPanel.locator('[data-testid="chart-container"] canvas').first();
    await expect(chartCanvas).toBeVisible();

    // Wait for potential new candle updates
    await page.waitForTimeout(3000);

    // Chart should still be visible and have data
    await expect(chartCanvas).toBeVisible();

    // If WebSocket is working, chart should update with new data
    // This is a basic test - actual data validation would require knowing the data format
    const canvasBoundingBox = await chartCanvas.boundingBox();
    expect(canvasBoundingBox?.width).toBeGreaterThan(0);
    expect(canvasBoundingBox?.height).toBeGreaterThan(0);
  });

  test('should display chart controls and labels', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel');

    // Verify chart controls are present
    const timeframeControls = chartPanel.locator('div.flex.items-center.justify-between');
    await expect(timeframeControls).toBeVisible();

    // Verify chart type controls
    const chartTypeControls = chartPanel.locator('button:has-text("Line"), button:has-text("Candles")');
    await expect(chartTypeControls).toBeVisible();

    // Verify full-screen controls
    const fullscreenControls = chartPanel.locator('button:has-text("Full"), button:has-text("Exit")');
    await expect(fullscreenControls).toBeVisible();
  });

  test('should handle chart loading states gracefully', async ({ page }) => {
    const chartPanel = page.locator('.chart-panel');

    // Chart should either show data or loading state
    const chartCanvas = chartPanel.locator('[data-testid="chart-container"] canvas').first();
    const loadingIndicator = chartPanel.locator('text=Loading...');

    // Wait a moment for chart to initialize
    await page.waitForTimeout(1000);

    // Either chart is loaded or still loading
    const hasCanvas = await chartCanvas.count() > 0;
    const isLoading = await loadingIndicator.count() > 0;

    expect(hasCanvas || isLoading).toBe(true);
  });
});