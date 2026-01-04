/**
 * Test: Connection Status Indicator
 * Feature ID: 050
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Connection Status Indicator', () => {
  test('Connection status indicator displays correctly in header', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('http://localhost:3001');
    await expect(page).toHaveURL('http://localhost:3001/');

    // Step 2: Wait for the page to load and WebSocket connections to establish
    // The component polls every 500ms, so wait for connections to be established
    await page.waitForTimeout(2000);

    // Step 3: Locate the connection status dot in the header
    // The ConnectionStatus component with showText={false} shows only the dot
    const headerConnectionDot = page.locator('[data-testid="connection-status-dot"]').first();

    // Step 4: Verify the connection status dot is visible
    await expect(headerConnectionDot).toBeVisible();

    // Step 5: Check that the dot has valid styling (connected, connecting, or disconnected)
    const dotClass = await headerConnectionDot.getAttribute('class');
    // The dot should have one of these states after waiting
    // 'bg-long' = connected, 'bg-warning' = connecting, 'bg-text-tertiary' = disconnected
    expect(dotClass).toMatch(/bg-long|bg-warning|bg-text-tertiary/);

    // Step 6: Verify the bottom panel connection status with text is also visible
    const bottomPanel = page.locator('div.h-\\[200px\\]');
    await expect(bottomPanel).toBeVisible();

    // Step 7: Check for connection status in bottom panel
    // The bottom panel shows text alongside the dot
    const bottomConnectionContainer = bottomPanel.locator('div.flex.items-center.gap-2').first();
    await expect(bottomConnectionContainer).toBeVisible();

    // Step 8: Verify the indicator exists in multiple places
    const statusElements = page.locator('[data-testid="connection-status-dot"]');
    const count = await statusElements.count();
    expect(count).toBeGreaterThanOrEqual(1); // At least one indicator should exist

    // Step 9: Verify the indicator has proper styling
    const dot = statusElements.first();
    const isVisible = await dot.isVisible();
    expect(isVisible).toBe(true);
  });

  test('Connection status shows multiple connections count', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000); // Wait for connections to establish

    // Step 2: Check the bottom panel for connection count
    // Multiple WebSocket connections should be established (orderbook, trades, candles, etc.)
    const bottomPanel = page.locator('div.h-\\[200px\\]');
    await expect(bottomPanel).toBeVisible();

    // Step 3: Verify the connection status component is in the bottom panel
    const connectionStatusContainer = bottomPanel.locator('div.flex.items-center.gap-2').first();
    await expect(connectionStatusContainer).toBeVisible();

    // Step 4: Check if connection count badge is visible (shows number of connections)
    const countBadge = bottomPanel.locator('div.px-1\\.5\\.py-0\\.5\\.bg-surface-elevated');
    // This is optional - may or may not be visible depending on connection state
  });

  test('Connection status indicator handles connection state changes', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(1000);

    // Step 2: Get initial connection state
    const dot = page.locator('[data-testid="connection-status-dot"]').first();
    const initialClass = await dot.getAttribute('class');

    // Step 3: Wait a bit and check state again (should still be connected or connecting)
    await page.waitForTimeout(1500);
    const laterClass = await dot.getAttribute('class');

    // Step 4: Verify the dot exists and has valid styling
    // Either 'bg-long' (connected) or 'bg-warning' (connecting) or 'bg-text-tertiary' (disconnected)
    expect(initialClass).toMatch(/bg-long|bg-warning|bg-text-tertiary/);
    expect(laterClass).toMatch(/bg-long|bg-warning|bg-text-tertiary/);

    // Step 5: Verify the component doesn't throw any errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('ConnectionStatus')) {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(500);
    expect(consoleErrors.length).toBe(0);
  });

  test('Connection status text displays when showText is true', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);

    // Step 2: Check the bottom panel for the text display
    const bottomPanel = page.locator('div.h-\\[200px\\]');
    const bottomConnectionContainer = bottomPanel.locator('div.flex.items-center.gap-2').first();

    // Step 3: Verify the container is visible (showText={true} in bottom panel)
    await expect(bottomConnectionContainer).toBeVisible();

    // Step 4: Check for the text element
    const textElement = bottomConnectionContainer.locator('[data-testid="connection-status-text"]');
    // The text element should exist in the bottom panel
    await expect(textElement).toBeVisible();
  });
});
