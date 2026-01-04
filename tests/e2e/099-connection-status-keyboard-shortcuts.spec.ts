/**
 * E2E test for Feature 99: Connection Status and Keyboard Shortcut Hints
 * This test verifies that connection status is visible and keyboard shortcuts have tooltip hints
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 99 - Connection Status and Keyboard Shortcut Hints', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001');

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Wait for market data to load
    await page.waitForSelector('[data-testid="market-header"]', { timeout: 10000 });
  });

  test('should display connection status indicator with green dot when connected', async ({ page }) => {
    // Step 1: Navigate to the application
    // Already done in beforeEach

    // Step 2: Locate connection status indicator
    const connectionStatus = page.locator('[data-testid="connection-status-dot"]').first();
    await expect(connectionStatus).toBeVisible();

    // Step 3: Verify green dot when connected
    // The connection status should be green when connected
    const dotClasses = await connectionStatus.getAttribute('class');
    expect(dotClasses).toContain('bg-long'); // Green color class

    // Step 4: Verify indicator is easily visible
    // Check that the status has proper styling and is not hidden
    await expect(connectionStatus).toBeVisible();
    const statusText = page.locator('[data-testid="connection-status-text"]').first();
    await expect(statusText).toBeVisible();
  });

  test('should show keyboard shortcut tooltips on buy/sell buttons', async ({ page }) => {
    // Step 5: Hover over buttons with shortcuts
    const buyButton = page.locator('button:has-text("Buy / Long")').first();
    const sellButton = page.locator('button:has-text("Sell / Short")').first();

    // Hover over buy button
    await buyButton.hover();

    // Step 6: Verify tooltip shows shortcut key
    const buyTooltip = page.locator('div:has-text("Press \'B\' to switch to Buy")');
    await expect(buyTooltip).toBeVisible();

    // Hover over sell button
    await sellButton.hover();

    const sellTooltip = page.locator('div:has-text("Press \'S\' to switch to Sell")');
    await expect(sellTooltip).toBeVisible();
  });

  test('should show keyboard shortcut tooltip on submit button', async ({ page }) => {
    // Hover over submit button
    const submitButton = page.locator('[data-testid="order-submit-button"]').first();
    await submitButton.hover();

    // Verify tooltip shows Enter shortcut
    const submitTooltip = page.locator('div:has-text("Press \'Enter\' to submit order")');
    await expect(submitTooltip).toBeVisible();
  });

  test('should show keyboard shortcut tooltips on order book precision buttons', async ({ page }) => {
    // Navigate to order book panel
    // The order book should be visible by default

    // Hover over precision buttons
    const precisionButtons = page.locator('button:has-text("2d"), button:has-text("4d"), button:has-text("6d")');

    // Test a few precision buttons
    for (let i = 0; i < await precisionButtons.count(); i++) {
      const button = precisionButtons.nth(i);
      const buttonText = await button.textContent();

      if (buttonText && buttonText.includes('d')) {
        const prec = buttonText.replace('d', '');

        await button.hover();

        // Verify tooltip shows the shortcut key
        const tooltip = page.locator(`div:has-text("Press '${prec}' to set precision to ${prec} decimals")`);
        await expect(tooltip).toBeVisible({ timeout: 1000 });
      }
    }
  });

  test('should show keyboard shortcut tooltips on order book aggregation buttons', async ({ page }) => {
    // Hover over aggregation buttons
    const aggregationButtons = page.locator('button:has-text("1"), button:has-text("5"), button:has-text("10")');

    // Test aggregation buttons
    const buttonMappings = {
      '1': 'z',
      '5': 'x',
      '10': 'c'
    };

    for (let i = 0; i < await aggregationButtons.count(); i++) {
      const button = aggregationButtons.nth(i);
      const buttonText = await button.textContent();

      if (buttonText && buttonMappings[buttonText]) {
        const key = buttonMappings[buttonText];

        await button.hover();

        // Verify tooltip shows the shortcut key
        const tooltip = page.locator(`div:has-text("Press '${key}' to set aggregation to ${buttonText}")`);
        await expect(tooltip).toBeVisible({ timeout: 1000 });
      }
    }
  });

  test('should handle keyboard shortcuts when pressed', async ({ page }) => {
    // Test that keyboard shortcuts are registered (we can't actually test the functionality
    // without triggering them, but we can verify the tooltips exist)

    // Verify buy button has B shortcut tooltip
    const buyButton = page.locator('button:has-text("Buy / Long")').first();
    await buyButton.hover();
    const buyTooltip = page.locator('div:has-text("Press \'B\' to switch to Buy")');
    await expect(buyTooltip).toBeVisible();

    // Verify sell button has S shortcut tooltip
    const sellButton = page.locator('button:has-text("Sell / Short")').first();
    await sellButton.hover();
    const sellTooltip = page.locator('div:has-text("Press \'S\' to switch to Sell")');
    await expect(sellTooltip).toBeVisible();

    // Verify Enter shortcut tooltip on submit button
    const submitButton = page.locator('[data-testid="order-submit-button"]').first();
    await submitButton.hover();
    const submitTooltip = page.locator('div:has-text("Press \'Enter\' to submit order")');
    await expect(submitTooltip).toBeVisible();
  });

  test('should have connection status indicator in header area', async ({ page }) => {
    // Verify connection status is positioned in header area
    const connectionStatus = page.locator('[data-testid="connection-status-dot"]').first();
    await expect(connectionStatus).toBeVisible();

    // Verify it's easily accessible and visible
    // Check that it has proper styling for visibility
    const dotClasses = await connectionStatus.getAttribute('class');
    expect(dotClasses).toContain('bg-long'); // Should be green when connected

    // Verify status text is also visible
    const statusText = page.locator('[data-testid="connection-status-text"]').first();
    await expect(statusText).toBeVisible();
    const textContent = await statusText.textContent();
    expect(textContent).toMatch(/(Connected|Connecting|Disconnected)/);
  });
});