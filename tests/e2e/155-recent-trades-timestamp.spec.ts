/**
 * Test: Recent trades timestamp formatting
 * Feature ID: 155
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 155: Recent Trades Timestamp Formatting', () => {
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

  test('Timestamps show time only for today\'s trades', async ({ page }) => {
    // Add mock trades from today
    const now = Date.now();
    await page.evaluate((timestamp) => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        { coin: 'BTC', side: 'B', px: 95000, sz: 0.5, time: timestamp - 3600000, hash: '0xabc1' }, // 1 hour ago
        { coin: 'BTC', side: 'A', px: 95050, sz: 0.3, time: timestamp - 1800000, hash: '0xdef2' }, // 30 min ago
      ]);
    }, now);

    await page.waitForTimeout(500);

    // Get the Recent Trades panel using data-testid
    const recentTradesPanel = page.getByTestId('recent-trades-panel');

    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');
    const rowCount = await tradeRows.count();
    expect(rowCount).toBe(2);

    // Get time elements from each row
    for (let i = 0; i < rowCount; i++) {
      const timeElement = tradeRows.nth(i).locator('span.text-text-tertiary');
      const text = await timeElement.textContent();
      // Should match format: 14:30:45 (time only, no date)
      expect(text).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    }
  });

  test('Timestamps show date and time for older trades', async ({ page }) => {
    // Add mock trades from yesterday and earlier
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000; // 24 hours ago
    const twoDaysAgo = now - 48 * 60 * 60 * 1000; // 48 hours ago

    await page.evaluate((timestamps) => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        { coin: 'BTC', side: 'B', px: 95000, sz: 0.5, time: timestamps.yesterday, hash: '0xabc1' },
        { coin: 'BTC', side: 'A', px: 95050, sz: 0.3, time: timestamps.twoDaysAgo, hash: '0xdef2' },
      ]);
    }, { yesterday, twoDaysAgo });

    await page.waitForTimeout(500);

    // Get the Recent Trades panel using data-testid
    const recentTradesPanel = page.getByTestId('recent-trades-panel');

    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');
    const rowCount = await tradeRows.count();
    expect(rowCount).toBe(2);

    // Get time elements from each row
    for (let i = 0; i < rowCount; i++) {
      const timeElement = tradeRows.nth(i).locator('span.text-text-tertiary');
      const text = await timeElement.textContent();
      // Should match format: "Jan 3 14:30" (date + time)
      expect(text).toMatch(/^\w{3} \d{1,2} \d{2}:\d{2}$/);
    }
  });

  test('Mixed timestamps show correct format for each', async ({ page }) => {
    // Add mix of today and older trades
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;

    await page.evaluate((timestamps) => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        // Today's trade
        { coin: 'BTC', side: 'B', px: 95000, sz: 0.5, time: timestamps.now - 3600000, hash: '0xabc1' },
        // Yesterday's trade
        { coin: 'BTC', side: 'A', px: 95050, sz: 0.3, time: timestamps.yesterday, hash: '0xdef2' },
        // Today's trade again
        { coin: 'ETH', side: 'B', px: 3500, sz: 1.0, time: timestamps.now - 1800000, hash: '0xghi3' },
      ]);
    }, { now, yesterday });

    await page.waitForTimeout(500);

    // Get the Recent Trades panel using data-testid
    const recentTradesPanel = page.getByTestId('recent-trades-panel');

    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');
    const rowCount = await tradeRows.count();
    expect(rowCount).toBe(3);

    // First trade (today) - time only
    const text1 = await tradeRows.nth(0).locator('span.text-text-tertiary').textContent();
    expect(text1).toMatch(/^\d{2}:\d{2}:\d{2}$/);

    // Second trade (yesterday) - date + time
    const text2 = await tradeRows.nth(1).locator('span.text-text-tertiary').textContent();
    expect(text2).toMatch(/^\w{3} \d{1,2} \d{2}:\d{2}$/);

    // Third trade (today) - time only
    const text3 = await tradeRows.nth(2).locator('span.text-text-tertiary').textContent();
    expect(text3).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  test('Recent trades panel is visible and has timestamp column', async ({ page }) => {
    // Add a mock trade
    await page.evaluate(() => {
      const store = (window as any).stores.getMarketStoreState();
      store.setTrades([
        { coin: 'BTC', side: 'B', px: 95000, sz: 0.5, time: Date.now(), hash: '0xabc1' },
      ]);
    });

    await page.waitForTimeout(500);

    // Get the Recent Trades panel using data-testid
    const recentTradesPanel = page.getByTestId('recent-trades-panel');

    await expect(recentTradesPanel).toBeVisible();

    // Verify there's a timestamp column (time element exists within a trade row)
    const tradeRows = recentTradesPanel.locator('.space-y-0\\.5 > div');
    const rowCount = await tradeRows.count();
    expect(rowCount).toBeGreaterThan(0);

    const timeElement = tradeRows.nth(0).locator('span.text-text-tertiary');
    await expect(timeElement).toBeVisible();
  });
});
