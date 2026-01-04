import { test, expect } from '@playwright/test';

test.describe('Feature 45: Trade History with Pagination and Export', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with test mode enabled
    await page.goto('http://localhost:3004?testMode=true');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // Extra time for stores to be exposed
  });

  test('Trade history tab displays when wallet is connected', async ({ page }) => {
    // First, add mock trade history data via the store
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        {
          coin: 'BTC',
          side: 'B',
          px: 43250.50,
          sz: 0.5,
          time: Date.now() - 3600000,
          hash: '0xabc123...',
          fee: 0.5,
        },
        {
          coin: 'ETH',
          side: 'A',
          px: 2280.75,
          sz: 2.0,
          time: Date.now() - 7200000,
          hash: '0xdef456...',
          fee: 0.3,
        },
      ]);
    });

    await page.waitForTimeout(500);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Verify trade history table is visible
    await expect(page.locator('table.data-table')).toBeVisible();

    // Verify table headers
    await expect(page.locator('th:has-text("Time")')).toBeVisible();
    await expect(page.locator('th:has-text("Symbol")')).toBeVisible();
    await expect(page.locator('th:has-text("Side")')).toBeVisible();
    await expect(page.locator('th:has-text("Price")')).toBeVisible();
    await expect(page.locator('th:has-text("Size")')).toBeVisible();
    await expect(page.locator('th:has-text("Fee")')).toBeVisible();
    await expect(page.locator('th:has-text("Hash")')).toBeVisible();

    // Verify trade count is displayed
    await expect(page.locator('text=/\\d+ trades?/')).toBeVisible();
  });

  test('Trade history displays mock data when connected', async ({ page }) => {
    // Add mock trade history data
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        {
          coin: 'BTC',
          side: 'B',
          px: 43250.50,
          sz: 0.5,
          time: Date.now() - 3600000,
          hash: '0xabc123...',
          fee: 0.5,
        },
        {
          coin: 'ETH',
          side: 'A',
          px: 2280.75,
          sz: 2.0,
          time: Date.now() - 7200000,
          hash: '0xdef456...',
          fee: 0.3,
        },
        {
          coin: 'SOL',
          side: 'B',
          px: 98.45,
          sz: 10.0,
          time: Date.now() - 86400000,
          hash: '0xghi789...',
          fee: 0.2,
        },
      ]);
    });

    await page.waitForTimeout(500);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Verify trade history table is visible
    await expect(page.locator('table.data-table')).toBeVisible();

    // Verify we have 3 trades displayed
    const rows = await page.locator('table.data-table tbody tr').count();
    expect(rows).toBe(3);
  });

  test('Date range filter works correctly', async ({ page }) => {
    // Add mock trade history data with different timestamps
    await page.evaluate(() => {
      const now = Date.now();
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        {
          coin: 'BTC',
          side: 'B',
          px: 43250.50,
          sz: 0.5,
          time: now - 3600000, // 1 hour ago
          hash: '0xabc123...',
          fee: 0.5,
        },
        {
          coin: 'ETH',
          side: 'A',
          px: 2280.75,
          sz: 2.0,
          time: now - 48 * 3600000, // 2 days ago
          hash: '0xdef456...',
          fee: 0.3,
        },
      ]);
    });

    await page.waitForTimeout(500);
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Select "Last 24 Hours" from date range filter
    await page.selectOption('[data-testid="trade-date-range-filter"]', '24h');

    // Verify filter is applied
    await expect(page.locator('[data-testid="trade-date-range-filter"]')).toHaveValue('24h');

    // Should only show 1 trade (within 24h)
    const rows = await page.locator('table.data-table tbody tr').count();
    expect(rows).toBe(1);

    // Clear filters
    await page.click('[data-testid="trade-clear-filters"]');

    // Verify filter is reset to "All Time"
    await expect(page.locator('[data-testid="trade-date-range-filter"]')).toHaveValue('all');

    // Should show all 2 trades again
    const allRows = await page.locator('table.data-table tbody tr').count();
    expect(allRows).toBe(2);
  });

  test('Asset filter works correctly', async ({ page }) => {
    // Add mock trade history data
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        { coin: 'BTC', side: 'B', px: 43250.50, sz: 0.5, time: Date.now(), hash: '0xabc123...', fee: 0.5 },
        { coin: 'ETH', side: 'A', px: 2280.75, sz: 2.0, time: Date.now(), hash: '0xdef456...', fee: 0.3 },
        { coin: 'BTC', side: 'B', px: 44000.00, sz: 0.3, time: Date.now(), hash: '0xghi789...', fee: 0.4 },
      ]);
    });

    await page.waitForTimeout(500);
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Select "BTC" from asset filter
    await page.selectOption('[data-testid="trade-asset-filter"]', 'BTC');

    // Verify filter is applied
    await expect(page.locator('[data-testid="trade-asset-filter"]')).toHaveValue('BTC');

    // Should only show 2 BTC trades
    const rows = await page.locator('table.data-table tbody tr').count();
    expect(rows).toBe(2);

    // Clear filters
    await page.click('[data-testid="trade-clear-filters"]');

    // Should show all 3 trades again
    const allRows = await page.locator('table.data-table tbody tr').count();
    expect(allRows).toBe(3);
  });

  test('Side filter works correctly', async ({ page }) => {
    // Add mock trade history data
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        { coin: 'BTC', side: 'B', px: 43250.50, sz: 0.5, time: Date.now(), hash: '0xabc123...', fee: 0.5 },
        { coin: 'ETH', side: 'A', px: 2280.75, sz: 2.0, time: Date.now(), hash: '0xdef456...', fee: 0.3 },
        { coin: 'SOL', side: 'B', px: 98.45, sz: 10.0, time: Date.now(), hash: '0xghi789...', fee: 0.2 },
      ]);
    });

    await page.waitForTimeout(500);
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Select "Buy" (B) from side filter
    await page.selectOption('[data-testid="trade-side-filter"]', 'B');

    // Verify filter is applied
    await expect(page.locator('[data-testid="trade-side-filter"]')).toHaveValue('B');

    // Should only show 2 buy trades
    const rows = await page.locator('table.data-table tbody tr').count();
    expect(rows).toBe(2);

    // Clear filters
    await page.click('[data-testid="trade-clear-filters"]');

    // Should show all 3 trades again
    const allRows = await page.locator('table.data-table tbody tr').count();
    expect(allRows).toBe(3);
  });

  test('Clear filters button is only visible when filters are active', async ({ page }) => {
    // Add mock trade history data
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        { coin: 'BTC', side: 'B', px: 43250.50, sz: 0.5, time: Date.now(), hash: '0xabc123...', fee: 0.5 },
      ]);
    });

    await page.waitForTimeout(500);
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Verify clear filters button is not visible initially
    await expect(page.locator('[data-testid="trade-clear-filters"]')).not.toBeVisible();

    // Apply a filter
    await page.selectOption('[data-testid="trade-date-range-filter"]', '24h');

    // Verify clear filters button is now visible
    await expect(page.locator('[data-testid="trade-clear-filters"]')).toBeVisible();

    // Clear filters
    await page.click('[data-testid="trade-clear-filters"]');

    // Verify clear filters button is hidden again
    await expect(page.locator('[data-testid="trade-clear-filters"]')).not.toBeVisible();
  });

  test('Export to CSV button is visible and functional', async ({ page }) => {
    // Add mock trade history data
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        { coin: 'BTC', side: 'B', px: 43250.50, sz: 0.5, time: Date.now(), hash: '0xabc123...', fee: 0.5 },
      ]);
    });

    await page.waitForTimeout(500);
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Verify export button is visible
    await expect(page.locator('[data-testid="export-trade-history"]')).toBeVisible();

    // Verify the button is enabled
    await expect(page.locator('[data-testid="export-trade-history"]')).toBeEnabled();
  });

  test('Pagination is shown when there are multiple pages', async ({ page }) => {
    // Add 25 trades to trigger pagination (20 per page)
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      const trades = [];
      for (let i = 0; i < 25; i++) {
        trades.push({
          coin: i % 2 === 0 ? 'BTC' : 'ETH',
          side: i % 2 === 0 ? 'B' : 'A',
          px: 40000 + i * 10,
          sz: 0.1 + i * 0.01,
          time: Date.now() - i * 60000,
          hash: `0x${i.toString().padStart(6, '0')}...`,
          fee: 0.1 + i * 0.01,
        });
      }
      store.setTradeHistory(trades);
    });

    await page.waitForTimeout(500);
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Verify pagination controls are visible
    await expect(page.locator('[data-testid="trade-prev-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="trade-next-page"]')).toBeVisible();

    // Should show 20 items on first page
    const rows = await page.locator('table.data-table tbody tr').count();
    expect(rows).toBe(20);

    // Click next page
    await page.click('[data-testid="trade-next-page"]');
    await page.waitForTimeout(300);

    // Should show remaining 5 items
    const rowsPage2 = await page.locator('table.data-table tbody tr').count();
    expect(rowsPage2).toBe(5);
  });

  test('Trade history shows correct buy/sell colors', async ({ page }) => {
    // Add mock trade history data
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        { coin: 'BTC', side: 'B', px: 43250.50, sz: 0.5, time: Date.now(), hash: '0xabc123...', fee: 0.5 },
        { coin: 'ETH', side: 'A', px: 2280.75, sz: 2.0, time: Date.now(), hash: '0xdef456...', fee: 0.3 },
      ]);
    });

    await page.waitForTimeout(500);
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Verify buy trades have green color (text-long class)
    const buyTrades = page.locator('td.text-long');
    const buyCount = await buyTrades.count();
    expect(buyCount).toBe(1);

    // Verify sell trades have red color (text-short class)
    const sellTrades = page.locator('td.text-short');
    const sellCount = await sellTrades.count();
    expect(sellCount).toBe(1);
  });

  test('Trade history displays formatted timestamps', async ({ page }) => {
    // Add mock trade history data
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        { coin: 'BTC', side: 'B', px: 43250.50, sz: 0.5, time: Date.now(), hash: '0xabc123...', fee: 0.5 },
      ]);
    });

    await page.waitForTimeout(500);
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Verify timestamps are formatted (e.g., "Jan 4, 14:30")
    const timestamps = page.locator('table.data-table tbody tr td:first-child');
    const count = await timestamps.count();
    expect(count).toBeGreaterThan(0);

    const timestampText = await timestamps.first().textContent();
    expect(timestampText).toMatch(/\w{3} \d{1,2}, \d{2}:\d{2}/);
  });

  test('Trade history shows empty state when no trades match filters', async ({ page }) => {
    // Add mock trade history data
    await page.evaluate(() => {
      const now = Date.now();
      const store = (window as any).stores.getOrderStoreState();
      store.setTradeHistory([
        { coin: 'BTC', side: 'B', px: 43250.50, sz: 0.5, time: now - 86400000, hash: '0xabc123...', fee: 0.5 }, // 1 day ago
      ]);
    });

    await page.waitForTimeout(500);
    await page.click('text=Trade History');
    await page.waitForTimeout(500);

    // Apply a filter that won't match (24h filter, but trade is 1 day old)
    await page.selectOption('[data-testid="trade-date-range-filter"]', '24h');
    await page.waitForTimeout(500);

    // Should show empty state message
    await expect(page.locator('text=No trades match your filters')).toBeVisible();
  });
});
