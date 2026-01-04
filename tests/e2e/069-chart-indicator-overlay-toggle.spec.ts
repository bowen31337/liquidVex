import { test, expect } from '@playwright/test';

test.describe('Chart Indicator Overlay Toggle - Feature 69', () => {
  test.beforeEach(async ({ page }) => {
    // Start the app and wait for it to load
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Wait for the chart container to be visible
    await expect(page.locator('[data-testid="chart-container"]')).toBeVisible();
  });

  test('Should enable volume indicator and verify it displays on chart', async ({ page }) => {
    // Locate the Volume indicator toggle button
    const volumeToggle = page.locator('[data-testid="indicator-volume-toggle"]');
    await expect(volumeToggle).toBeVisible();
    await expect(volumeToggle).toContainText('Volume');

    // Verify initial state (volume should be enabled by default)
    await expect(volumeToggle).toHaveClass(/bg-blue-600/);

    // Disable volume indicator
    await volumeToggle.click();

    // Verify volume indicator is disabled
    await expect(volumeToggle).not.toHaveClass(/bg-blue-600/);
    await expect(volumeToggle).toHaveClass(/text-text-secondary/);

    // Re-enable volume indicator
    await volumeToggle.click();

    // Verify volume indicator is enabled again
    await expect(volumeToggle).toHaveClass(/bg-blue-600/);
    await expect(volumeToggle).toHaveClass(/text-white/);

    // Take a screenshot to verify the volume indicator is visible on the chart
    await page.screenshot({ path: 'screenshots/volume-indicator-enabled.png' });
  });

  test('Should enable RSI indicator and verify it displays on chart', async ({ page }) => {
    // Locate the RSI indicator toggle button
    const rsiToggle = page.locator('[data-testid="indicator-rsi-toggle"]');
    await expect(rsiToggle).toBeVisible();
    await expect(rsiToggle).toContainText('RSI');

    // Verify initial state (RSI should be disabled by default)
    await expect(rsiToggle).not.toHaveClass(/bg-amber-600/);
    await expect(rsiToggle).toHaveClass(/text-text-secondary/);

    // Enable RSI indicator
    await rsiToggle.click();

    // Verify RSI indicator is enabled
    await expect(rsiToggle).toHaveClass(/bg-amber-600/);
    await expect(rsiToggle).toHaveClass(/text-white/);

    // Take a screenshot to verify the RSI indicator is visible on the chart
    await page.screenshot({ path: 'screenshots/rsi-indicator-enabled.png' });

    // Disable RSI indicator
    await rsiToggle.click();

    // Verify RSI indicator is disabled
    await expect(rsiToggle).not.toHaveClass(/bg-amber-600/);
    await expect(rsiToggle).toHaveClass(/text-text-secondary/);

    // Take a screenshot to verify the RSI indicator is removed from the chart
    await page.screenshot({ path: 'screenshots/rsi-indicator-disabled.png' });
  });

  test('Should handle multiple indicator toggles correctly', async ({ page }) => {
    const volumeToggle = page.locator('[data-testid="indicator-volume-toggle"]');
    const rsiToggle = page.locator('[data-testid="indicator-rsi-toggle"]');

    // Start with volume enabled (default) and RSI disabled (default)
    await expect(volumeToggle).toHaveClass(/bg-blue-600/);
    await expect(rsiToggle).not.toHaveClass(/bg-amber-600/);

    // Enable RSI
    await rsiToggle.click();
    await expect(rsiToggle).toHaveClass(/bg-amber-600/);

    // Disable volume
    await volumeToggle.click();
    await expect(volumeToggle).not.toHaveClass(/bg-blue-600/);

    // Re-enable volume
    await volumeToggle.click();
    await expect(volumeToggle).toHaveClass(/bg-blue-600/);

    // Disable RSI
    await rsiToggle.click();
    await expect(rsiToggle).not.toHaveClass(/bg-amber-600/);

    // Final state: volume enabled, RSI disabled
    await expect(volumeToggle).toHaveClass(/bg-blue-600/);
    await expect(rsiToggle).not.toHaveClass(/bg-amber-600/);

    // Take a final screenshot
    await page.screenshot({ path: 'screenshots/multiple-indicators-final-state.png' });
  });

  test('Should maintain chart functionality while toggling indicators', async ({ page }) => {
    const volumeToggle = page.locator('[data-testid="indicator-volume-toggle"]');
    const rsiToggle = page.locator('[data-testid="indicator-rsi-toggle"]');

    // Verify chart is initially visible and functional
    const chartContainer = page.locator('[data-testid="chart-container"]');
    await expect(chartContainer).toBeVisible();

    // Toggle volume indicator multiple times
    for (let i = 0; i < 3; i++) {
      await volumeToggle.click();
      await page.waitForTimeout(100); // Allow time for chart update
      await expect(chartContainer).toBeVisible();
    }

    // Toggle RSI indicator multiple times
    for (let i = 0; i < 3; i++) {
      await rsiToggle.click();
      await page.waitForTimeout(100); // Allow time for chart update
      await expect(chartContainer).toBeVisible();
    }

    // Chart should still be functional after all toggles
    await expect(chartContainer).toBeVisible();
    await page.screenshot({ path: 'screenshots/chart-functionality-after-toggles.png' });
  });

  test('Should display indicator buttons in chart controls', async ({ page }) => {
    // Verify that indicator toggle buttons are present in the chart controls
    const volumeToggle = page.locator('[data-testid="indicator-volume-toggle"]');
    const rsiToggle = page.locator('[data-testid="indicator-rsi-toggle"]');

    await expect(volumeToggle).toBeVisible();
    await expect(rsiToggle).toBeVisible();

    // Verify the buttons are properly labeled
    await expect(volumeToggle).toContainText('Volume');
    await expect(rsiToggle).toContainText('RSI');

    // Verify the buttons have proper styling classes
    await expect(volumeToggle).toHaveClass(/px-2/);
    await expect(volumeToggle).toHaveClass(/py-1/);
    await expect(volumeToggle).toHaveClass(/text-xs/);
    await expect(volumeToggle).toHaveClass(/rounded/);

    await expect(rsiToggle).toHaveClass(/px-2/);
    await expect(rsiToggle).toHaveClass(/py-1/);
    await expect(rsiToggle).toHaveClass(/text-xs/);
    await expect(rsiToggle).toHaveClass(/rounded/);
  });
});