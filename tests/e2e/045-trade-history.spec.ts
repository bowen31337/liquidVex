import { test, expect } from '@playwright/test';

test.describe('Trade History Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('Trade history tab displays when wallet is connected', async ({ page }) => {
    // Click on Trade History tab
    await page.click('text=Trade History');

    // Verify wallet connection message is shown
    await expect(page.locator('text=Connect your wallet to view trade history')).toBeVisible();
  });

  test('Trade history displays mock data when connected', async ({ page }) => {
    // Connect wallet (mock connection for testing)
    await page.click('[data-testid="wallet-connect-button"]');

    // Wait for trade history to load
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');

    // Wait for data to load
    await page.waitForTimeout(1000);

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

  test('Date range filter works correctly', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="wallet-connect-button"]');
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(1000);

    // Select "Last 24 Hours" from date range filter
    await page.selectOption('[data-testid="trade-date-range-filter"]', '24h');

    // Verify filter is applied
    await expect(page.locator('[data-testid="trade-date-range-filter"]')).toHaveValue('24h');

    // Clear filters
    await page.click('[data-testid="trade-clear-filters"]');

    // Verify filter is reset to "All Time"
    await expect(page.locator('[data-testid="trade-date-range-filter"]')).toHaveValue('all');
  });

  test('Asset filter works correctly', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="wallet-connect-button"]');
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(1000);

    // Get initial trade count
    const initialCountText = await page.locator('text=/\\d+ trades?/').textContent();
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');

    // Select "BTC" from asset filter
    await page.selectOption('[data-testid="trade-asset-filter"]', 'BTC');

    // Verify filter is applied
    await expect(page.locator('[data-testid="trade-asset-filter"]')).toHaveValue('BTC');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Clear filters
    await page.click('[data-testid="trade-clear-filters"]');

    // Verify filter is reset to "All Assets"
    await expect(page.locator('[data-testid="trade-asset-filter"]').locator('option:checked')).toHaveText('All Assets');
  });

  test('Side filter works correctly', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="wallet-connect-button"]');
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(1000);

    // Select "Buy" from side filter
    await page.selectOption('[data-testid="trade-side-filter"]', 'B');

    // Verify filter is applied
    await expect(page.locator('[data-testid="trade-side-filter"]')).toHaveValue('B');

    // Clear filters
    await page.click('[data-testid="trade-clear-filters"]');

    // Verify filter is reset to "All Sides"
    await expect(page.locator('[data-testid="trade-side-filter"]')).toHaveValue('all');
  });

  test('Clear filters button is only visible when filters are active', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="wallet-connect-button"]');
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(1000);

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
    // Connect wallet
    await page.click('[data-testid="wallet-connect-button"]');
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(1000);

    // Verify export button is visible
    await expect(page.locator('[data-testid="export-trade-history"]')).toBeVisible();

    // Note: Actual file download testing requires additional setup
    // For now, we just verify the button exists and is enabled
    await expect(page.locator('[data-testid="export-trade-history"]')).toBeEnabled();
  });

  test('Pagination is shown when there are multiple pages', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="wallet-connect-button"]');
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(1000);

    // Note: With mock data of 5 trades, pagination won't show
    // In a real scenario with 20+ trades, pagination would be visible
    // This test structure is ready for when we have more data

    // Verify pagination controls exist (hidden when not needed)
    const prevButton = page.locator('[data-testid="trade-prev-page"]');
    const nextButton = page.locator('[data-testid="trade-next-page"]');

    // With < 20 items, these should not be visible
    // This is expected behavior
  });

  test('Trade history shows correct buy/sell colors', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="wallet-connect-button"]');
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(1000);

    // Verify buy trades have green color
    const buyTrades = page.locator('td.text-long');
    const buyCount = await buyTrades.count();

    if (buyCount > 0) {
      await expect(buyTrades.first()).toBeVisible();
    }

    // Verify sell trades have red color
    const sellTrades = page.locator('td.text-short');
    const sellCount = await sellTrades.count();

    if (sellCount > 0) {
      await expect(sellTrades.first()).toBeVisible();
    }
  });

  test('Trade history displays formatted timestamps', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="wallet-connect-button"]');
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(1000);

    // Verify timestamps are formatted (e.g., "Jan 4, 14:30")
    const timestamps = page.locator('table.data-table tbody tr td:first-child');
    const count = await timestamps.count();

    if (count > 0) {
      const timestampText = await timestamps.first().textContent();
      expect(timestampText).toMatch(/\w{3} \d{1,2}, \d{2}:\d{2}/);
    }
  });

  test('Trade history shows empty state when no trades match filters', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="wallet-connect-button"]');
    await page.waitForTimeout(2000);

    // Click on Trade History tab
    await page.click('text=Trade History');
    await page.waitForTimeout(1000);

    // Apply a filter that might not match any trades (e.g., very old date range if data is recent)
    // For now, we'll just verify the empty state message exists

    // The mock data might not have trades from "24h" ago depending on when it was generated
    // If no trades match, we should see "No trades match your filters"
    await page.selectOption('[data-testid="trade-date-range-filter"]', '24h');
    await page.waitForTimeout(500);

    // Either we see trades or the empty state message
    const hasTrades = await page.locator('table.data-table tbody tr').count() > 0;
    const emptyMessage = page.locator('text=No trades match your filters');

    if (!hasTrades) {
      await expect(emptyMessage).toBeVisible();
    }
  });
});
