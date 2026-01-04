/**
 * Test: Recent trades show trade size formatting
 * Feature ID: 154
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 154: Recent Trades Size Formatting', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with test mode enabled
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Clear any existing trades before each test
    // Also disconnect WebSocket to prevent real trade data from interfering
    await page.evaluate(() => {
      // Disconnect all WebSocket connections
      if ((window as any).wsManager) {
        (window as any).wsManager.disconnectAll();
      }

      // Clear trades
      const store = (window as any).stores?.getMarketStoreState();
      if (store) {
        store.setTrades([]);
      }
    });
    await page.waitForTimeout(200);
  });

  test('Small trades (< 1000) show full precision (4 decimal places)', async ({ page }) => {
    // Add mock small trades
    await page.evaluate(() => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        { coin: 'BTC', side: 'B', px: 95000, sz: 0.1234, time: Date.now(), hash: '0xabc1' },
        { coin: 'BTC', side: 'A', px: 95050, sz: 500.5678, time: Date.now(), hash: '0xdef2' },
        { coin: 'ETH', side: 'B', px: 3500, sz: 999.9999, time: Date.now(), hash: '0xghi3' },
      ]);
    });

    await page.waitForTimeout(500);

    // Get the Recent Trades panel
    const recentTradesPanel = page.getByTestId('recent-trades-panel');
    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');

    // Verify first trade size (0.1234)
    const size1 = await tradeRows.nth(0).locator('span.text-text-secondary').nth(0).textContent();
    expect(size1).toBe('0.1234');

    // Verify second trade size (500.5678)
    const size2 = await tradeRows.nth(1).locator('span.text-text-secondary').nth(0).textContent();
    expect(size2).toBe('500.5678');

    // Verify third trade size (999.9999)
    const size3 = await tradeRows.nth(2).locator('span.text-text-secondary').nth(0).textContent();
    expect(size3).toBe('999.9999');
  });

  test('Large trades (1000+) abbreviate with K suffix', async ({ page }) => {
    // Add mock trades in thousands
    await page.evaluate(() => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        { coin: 'BTC', side: 'B', px: 95000, sz: 1500, time: Date.now(), hash: '0xabc1' },
        { coin: 'BTC', side: 'A', px: 95050, sz: 12345.678, time: Date.now(), hash: '0xdef2' },
        { coin: 'ETH', side: 'B', px: 3500, sz: 999999.999, time: Date.now(), hash: '0xghi3' },
      ]);
    });

    await page.waitForTimeout(500);

    // Get the Recent Trades panel
    const recentTradesPanel = page.getByTestId('recent-trades-panel');
    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');

    // Verify first trade size (1500 -> 1.50K)
    const size1 = await tradeRows.nth(0).locator('span.text-text-secondary').nth(0).textContent();
    expect(size1).toBe('1.50K');

    // Verify second trade size (12345.678 -> 12.35K)
    const size2 = await tradeRows.nth(1).locator('span.text-text-secondary').nth(0).textContent();
    expect(size2).toBe('12.35K');

    // Verify third trade size (999999.999 -> 1000.00K)
    const size3 = await tradeRows.nth(2).locator('span.text-text-secondary').nth(0).textContent();
    expect(size3).toBe('1000.00K');
  });

  test('Very large trades (1M+) abbreviate with M suffix', async ({ page }) => {
    // Add mock trades in millions
    await page.evaluate(() => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        { coin: 'BTC', side: 'B', px: 95000, sz: 1500000, time: Date.now(), hash: '0xabc1' },
        { coin: 'BTC', side: 'A', px: 95050, sz: 12345678.90, time: Date.now(), hash: '0xdef2' },
        { coin: 'ETH', side: 'B', px: 3500, sz: 999999999.99, time: Date.now(), hash: '0xghi3' },
      ]);
    });

    await page.waitForTimeout(500);

    // Get the Recent Trades panel
    const recentTradesPanel = page.getByTestId('recent-trades-panel');
    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');

    // Verify first trade size (1500000 -> 1.50M)
    const size1 = await tradeRows.nth(0).locator('span.text-text-secondary').nth(0).textContent();
    expect(size1).toBe('1.50M');

    // Verify second trade size (12345678.90 -> 12.35M)
    const size2 = await tradeRows.nth(1).locator('span.text-text-secondary').nth(0).textContent();
    expect(size2).toBe('12.35M');

    // Verify third trade size (999999999.99 -> 1000.00M)
    const size3 = await tradeRows.nth(2).locator('span.text-text-secondary').nth(0).textContent();
    expect(size3).toBe('1000.00M');
  });

  test('Massive trades (1B+) abbreviate with B suffix', async ({ page }) => {
    // Add mock trades in billions
    await page.evaluate(() => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        { coin: 'BTC', side: 'B', px: 95000, sz: 1500000000, time: Date.now(), hash: '0xabc1' },
        { coin: 'BTC', side: 'A', px: 95050, sz: 12345678901.23, time: Date.now(), hash: '0xdef2' },
      ]);
    });

    await page.waitForTimeout(500);

    // Get the Recent Trades panel
    const recentTradesPanel = page.getByTestId('recent-trades-panel');
    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');

    // Verify first trade size (1500000000 -> 1.50B)
    const size1 = await tradeRows.nth(0).locator('span.text-text-secondary').nth(0).textContent();
    expect(size1).toBe('1.50B');

    // Verify second trade size (12345678901.23 -> 12.35B)
    const size2 = await tradeRows.nth(1).locator('span.text-text-secondary').nth(0).textContent();
    expect(size2).toBe('12.35B');
  });

  test('Formatting is consistent across different trade sizes', async ({ page }) => {
    // Add trades across all size ranges
    await page.evaluate(() => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        { coin: 'BTC', side: 'B', px: 95000, sz: 0.5, time: Date.now(), hash: '0xabc1' }, // Small
        { coin: 'BTC', side: 'A', px: 95050, sz: 5000, time: Date.now(), hash: '0xdef2' }, // K
        { coin: 'ETH', side: 'B', px: 3500, sz: 2000000, time: Date.now(), hash: '0xghi3' }, // M
        { coin: 'BTC', side: 'A', px: 95100, sz: 3000000000, time: Date.now(), hash: '0xjkl4' }, // B
      ]);
    });

    await page.waitForTimeout(500);

    // Get the Recent Trades panel
    const recentTradesPanel = page.getByTestId('recent-trades-panel');
    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');

    // All sizes should have consistent 2 decimal places when abbreviated
    const sizes = [
      await tradeRows.nth(0).locator('span.text-text-secondary').nth(0).textContent(),
      await tradeRows.nth(1).locator('span.text-text-secondary').nth(0).textContent(),
      await tradeRows.nth(2).locator('span.text-text-secondary').nth(0).textContent(),
      await tradeRows.nth(3).locator('span.text-text-secondary').nth(0).textContent(),
    ];

    // Check that abbreviated values have 2 decimal places
    expect(sizes[1]).toMatch(/^\d+\.\d{2}K$/); // 5.00K
    expect(sizes[2]).toMatch(/^\d+\.\d{2}M$/); // 2.00M
    expect(sizes[3]).toMatch(/^\d+\.\d{2}B$/); // 3.00B
  });

  test('Recent trades panel displays sizes correctly', async ({ page }) => {
    // Add a mock trade
    await page.evaluate(() => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        { coin: 'BTC', side: 'B', px: 95000, sz: 1.5, time: Date.now(), hash: '0xabc1' },
      ]);
    });

    await page.waitForTimeout(500);

    // Get the Recent Trades panel
    const recentTradesPanel = page.getByTestId('recent-trades-panel');
    await expect(recentTradesPanel).toBeVisible();

    // Verify size column exists and shows formatted size
    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');
    const rowCount = await tradeRows.count();
    expect(rowCount).toBeGreaterThan(0);

    const sizeElement = tradeRows.nth(0).locator('span.text-text-secondary').nth(0);
    await expect(sizeElement).toBeVisible();

    const sizeText = await sizeElement.textContent();
    expect(sizeText).toBeTruthy();
    expect(sizeText).not.toBe('');
  });
});
