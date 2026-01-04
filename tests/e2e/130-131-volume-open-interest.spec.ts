/**
 * E2E Tests for Features 130 & 131:
 * - Feature 130: 24h volume statistics display and update
 * - Feature 131: Open interest display for perpetuals
 *
 * Tests verify:
 * - Volume24h displays in header
 * - Open interest displays in header
 * - Values are formatted correctly (K, M, B suffixes)
 * - Values update when market data changes
 */

import { test, expect } from '@playwright/test';

test.describe('Features 130 & 131: Volume and Open Interest Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with test mode enabled
    await page.goto('http://localhost:3003?testMode=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Clear market data to ensure clean test state
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(0);
      marketStore.setOpenInterest(0);
    });
  });

  test('should display 24h volume in header', async ({ page }) => {
    // Set volume via store
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(50000000); // $50M
    });

    await page.waitForTimeout(500);

    // Check that volume is displayed in header
    // Volume should be visible on desktop (md breakpoint and up)
    const volumeElement = page.locator('div[title="24h Volume"]');
    await expect(volumeElement).toBeVisible();
    await expect(volumeElement).toContainText('Vol:');
  });

  test('should display open interest in header', async ({ page }) => {
    // Set open interest via store
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setOpenInterest(25000000); // $25M
    });

    await page.waitForTimeout(500);

    // Check that open interest is displayed in header
    const oiElement = page.locator('div[title="Open Interest"]');
    await expect(oiElement).toBeVisible();
    await expect(oiElement).toContainText('OI:');
  });

  test('should format volume in billions correctly', async ({ page }) => {
    // Set volume to 1.5 billion
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(1500000000); // $1.5B
    });

    await page.waitForTimeout(500);

    const volumeElement = page.locator('div[title="24h Volume"]');
    const text = await volumeElement.textContent();

    // Should show $1.50B format
    expect(text).toMatch(/Vol: \$1\.50B/);
  });

  test('should format volume in millions correctly', async ({ page }) => {
    // Set volume to 50 million
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(50000000); // $50M
    });

    await page.waitForTimeout(500);

    const volumeElement = page.locator('div[title="24h Volume"]');
    const text = await volumeElement.textContent();

    // Should show $50.00M format
    expect(text).toMatch(/Vol: \$50\.00M/);
  });

  test('should format volume in thousands correctly', async ({ page }) => {
    // Set volume to 750 thousand
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(750000); // $750K
    });

    await page.waitForTimeout(500);

    const volumeElement = page.locator('div[title="24h Volume"]');
    const text = await volumeElement.textContent();

    // Should show $750.00K format
    expect(text).toMatch(/Vol: \$750\.00K/);
  });

  test('should format open interest in billions correctly', async ({ page }) => {
    // Set open interest to 2.3 billion
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setOpenInterest(2300000000); // $2.3B
    });

    await page.waitForTimeout(500);

    const oiElement = page.locator('div[title="Open Interest"]');
    const text = await oiElement.textContent();

    // Should show $2.30B format
    expect(text).toMatch(/OI: \$2\.30B/);
  });

  test('should format open interest in millions correctly', async ({ page }) => {
    // Set open interest to 12.5 million
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setOpenInterest(12500000); // $12.5M
    });

    await page.waitForTimeout(500);

    const oiElement = page.locator('div[title="Open Interest"]');
    const text = await oiElement.textContent();

    // Should show $12.50M format
    expect(text).toMatch(/OI: \$12\.50M/);
  });

  test('should format small values without suffix', async ({ page }) => {
    // Set volume to small value (under 1000)
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(500); // $500
    });

    await page.waitForTimeout(500);

    const volumeElement = page.locator('div[title="24h Volume"]');
    const text = await volumeElement.textContent();

    // Should show $500 format
    expect(text).toMatch(/Vol: \$500/);
  });

  test('should update values when market data changes', async ({ page }) => {
    // Set initial values
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(10000000); // $10M
      marketStore.setOpenInterest(5000000); // $5M
    });

    await page.waitForTimeout(500);

    // Verify initial values
    const volumeElement = page.locator('div[title="24h Volume"]');
    const oiElement = page.locator('div[title="Open Interest"]');

    await expect(volumeElement).toContainText('$10.00M');
    await expect(oiElement).toContainText('$5.00M');

    // Update values
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(20000000); // $20M
      marketStore.setOpenInterest(10000000); // $10M
    });

    await page.waitForTimeout(500);

    // Verify updated values
    await expect(volumeElement).toContainText('$20.00M');
    await expect(oiElement).toContainText('$10.00M');
  });

  test('should handle zero values correctly', async ({ page }) => {
    // Set values to zero
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(0);
      marketStore.setOpenInterest(0);
    });

    await page.waitForTimeout(500);

    const volumeElement = page.locator('div[title="24h Volume"]');
    const oiElement = page.locator('div[title="Open Interest"]');

    // Should show $0 format
    await expect(volumeElement).toContainText('$0');
    await expect(oiElement).toContainText('$0');
  });

  test('should hide volume and open interest on mobile', async ({ page }) => {
    // Set values
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(50000000);
      marketStore.setOpenInterest(25000000);
    });

    await page.waitForTimeout(500);

    // On desktop (default 1280x720), should be visible
    const volumeElement = page.locator('div[title="24h Volume"]');
    const oiElement = page.locator('div[title="Open Interest"]');

    await expect(volumeElement).toBeVisible();
    await expect(oiElement).toBeVisible();

    // Resize to tablet (1024px) - should still be visible
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    await expect(volumeElement).toBeVisible();
    await expect(oiElement).toBeVisible();

    // Resize to mobile (640px) - should be hidden (windowWidth < 768 triggers isMobile)
    await page.setViewportSize({ width: 640, height: 1024 });
    await page.waitForTimeout(500);

    // The component won't render at all when isMobile is true
    await expect(volumeElement).not.toBeVisible();
    await expect(oiElement).not.toBeVisible();
  });

  test('should display both volume and open interest together', async ({ page }) => {
    // Set both values
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setVolume24h(123456789); // $123.46M
      marketStore.setOpenInterest(987654321); // $987.65M
    });

    await page.waitForTimeout(500);

    // Both should be visible with correct formatting
    const volumeElement = page.locator('div[title="24h Volume"]');
    const oiElement = page.locator('div[title="Open Interest"]');

    await expect(volumeElement).toContainText('Vol: $123.46M');
    await expect(oiElement).toContainText('OI: $987.65M');
  });
});
