/**
 * E2E test for Feature 40: Positions table with real-time PnL
 *
 * Steps verified:
 * - Positions table displays correctly with all columns
 * - Real-time PnL updates based on mark prices from allMids WebSocket
 * - PnL color coding (green for profit, red for loss)
 * - Mark price display and updates
 * - All position data fields are visible
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 40: Positions Table with Real-time PnL', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with test mode enabled
    await page.goto('http://localhost:3001?testMode=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Clear any existing market data and positions to ensure clean test state
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      const orderStore = (window as any).stores.getOrderStoreState();
      marketStore.setAllMids({});
      orderStore.setPositions([]);
    });
  });

  test('should display positions table with correct structure', async ({ page }) => {
    // Add test position via store
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify table exists
    const table = page.getByTestId('positions-table');
    await expect(table).toBeVisible();

    // Verify table structure with correct headers
    const headers = await page.locator('thead th').allTextContents();
    expect(headers).toContain('Symbol');
    expect(headers).toContain('Side');
    expect(headers).toContain('Size');
    expect(headers).toContain('Entry');
    expect(headers).toContain('Mark');
    expect(headers).toContain('Unrealized PnL');
    expect(headers).toContain('Realized PnL');
    expect(headers).toContain('Leverage');
    expect(headers).toContain('Margin');
    expect(headers).toContain('Liq. Price');
    expect(headers).toContain('Margin Type');
    expect(headers).toContain('Actions');
  });

  test('should display position information correctly', async ({ page }) => {
    // Add test position
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 1000,
        realizedPnl: 500,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify position data is displayed
    const row = page.locator('tbody tr').first();

    // Check Symbol
    await expect(row.locator('td').nth(0)).toContainText('BTC');

    // Check Side (long should be green)
    await expect(row.locator('td').nth(1)).toContainText('LONG');
    await expect(row.locator('td').nth(1)).toHaveClass(/text-long/);

    // Check Size
    await expect(row.locator('td').nth(2)).toContainText('0.5');

    // Check Entry (formatted with commas)
    await expect(row.locator('td').nth(3)).toContainText('45,000');

    // Check Leverage
    await expect(row.locator('td').nth(7)).toContainText('10x');

    // Check Margin
    await expect(row.locator('td').nth(8)).toContainText('2,250');

    // Check Liquidation Price
    await expect(row.locator('td').nth(9)).toContainText('40,500');

    // Check Margin Type
    await expect(row.locator('td').nth(10)).toContainText('CROSS');
  });

  test('should show short position with correct color coding', async ({ page }) => {
    // Add short position
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 10,
        leverage: 5,
        marginUsed: 6000,
        unrealizedPnl: -200,
        realizedPnl: 0,
        liquidationPx: 3600,
        marginType: 'isolated',
        returnOnEquity: -3.33,
      });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Check short position has short color
    const row = page.locator('tbody tr').first();
    await expect(row.locator('td').nth(1)).toContainText('SHORT');
    await expect(row.locator('td').nth(1)).toHaveClass(/text-short/);
  });

  test('should display real-time PnL when mark price is available', async ({ page }) => {
    // Add position and set mark price via market store
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();
      const marketStore = (window as any).stores.getMarketStoreState();

      // Add position
      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });

      // Set mark price in allMids (higher than entry = profit)
      marketStore.setAllMids({ 'BTC': 46000 });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Check that PnL is calculated and displayed
    const pnlCell = page.locator('tbody tr').first().locator('td').nth(5);
    const pnlText = await pnlCell.textContent();

    // Should show positive PnL (46000 - 45000) * 0.5 = 500
    expect(pnlText).toContain('+');
    expect(pnlText).toMatch(/500|500\.00/);

    // Should be green (positive)
    await expect(pnlCell).toHaveClass(/text-long/);
  });

  test('should update PnL to negative when mark price drops below entry', async ({ page }) => {
    // Add position and set mark price lower than entry
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();
      const marketStore = (window as any).stores.getMarketStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });

      // Set mark price lower than entry (loss)
      marketStore.setAllMids({ 'BTC': 44000 });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    const pnlCell = page.locator('tbody tr').first().locator('td').nth(5);
    const pnlText = await pnlCell.textContent();

    // Should show negative PnL (44000 - 45000) * 0.5 = -500
    expect(pnlText).toContain('-');
    expect(pnlText).toMatch(/500|500\.00/);

    // Should be red (negative)
    await expect(pnlCell).toHaveClass(/text-short/);
  });

  test('should display realized PnL with correct color coding', async ({ page }) => {
    // Add position with positive realized PnL
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: 750,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Check realized PnL (column 6) - formatted with + and commas
    const realizedCell = page.locator('tbody tr').first().locator('td').nth(6);
    const realizedText = await realizedCell.textContent();
    expect(realizedText).toContain('+');
    expect(realizedText).toMatch(/750|750\.00/);
    await expect(realizedCell).toHaveClass(/text-long/);
  });

  test('should show negative realized PnL in red', async ({ page }) => {
    // Add position with negative realized PnL
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: -300,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    const realizedCell = page.locator('tbody tr').first().locator('td').nth(6);
    const realizedText = await realizedCell.textContent();
    expect(realizedText).toContain('-');
    expect(realizedText).toMatch(/300|300\.00/);
    await expect(realizedCell).toHaveClass(/text-short/);
  });

  test('should display margin type badge with correct styling', async ({ page }) => {
    // Add cross margin position
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Check margin type badge
    const marginCell = page.locator('tbody tr').first().locator('td').nth(10);
    await expect(marginCell).toContainText('CROSS');
    await expect(marginCell.locator('span')).toHaveClass(/bg-long/);
  });

  test('should display isolated margin type with correct styling', async ({ page }) => {
    // Add isolated margin position
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 10,
        leverage: 5,
        marginUsed: 6000,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 3600,
        marginType: 'isolated',
        returnOnEquity: 0,
      });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    const marginCell = page.locator('tbody tr').first().locator('td').nth(10);
    await expect(marginCell).toContainText('ISOLATED');
    await expect(marginCell.locator('span')).toHaveClass(/bg-short/);
  });

  test('should display action buttons for each position', async ({ page }) => {
    // Add test position
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify all action buttons exist
    const marginModeBtn = page.getByTestId('margin-mode-BTC');
    await expect(marginModeBtn).toBeVisible();
    await expect(marginModeBtn).toHaveText('Set Mode');

    const modifyBtn = page.getByTestId('modify-position-BTC');
    await expect(modifyBtn).toBeVisible();
    await expect(modifyBtn).toHaveText('Modify');

    const closeBtn = page.getByTestId('close-position-BTC');
    await expect(closeBtn).toBeVisible();
    await expect(closeBtn).toHaveText('Close');
    await expect(closeBtn).toHaveClass(/bg-short/);
  });

  test('should show mark price as -- when no real-time data available', async ({ page }) => {
    // Add position without setting mark price
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Mark price column should show --
    const markCell = page.locator('tbody tr').first().locator('td').nth(4);
    await expect(markCell).toContainText('--');
  });

  test('should handle multiple positions efficiently', async ({ page }) => {
    // Add multiple positions
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      for (let i = 1; i <= 5; i++) {
        store.addPosition({
          coin: i % 2 === 0 ? 'BTC' : 'ETH',
          side: i % 2 === 0 ? 'long' : 'short',
          entryPx: i % 2 === 0 ? 45000 : 3000,
          sz: 0.5 * i,
          leverage: 10 - i,
          marginUsed: 2250 * i,
          unrealizedPnl: i * 100,
          realizedPnl: i * 50,
          liquidationPx: i % 2 === 0 ? 40500 : 3600,
          marginType: i % 2 === 0 ? 'cross' : 'isolated',
          returnOnEquity: 5,
        });
      }
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify all positions are displayed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(5);

    // Verify first and last rows
    await expect(page.locator('tbody tr').first().locator('td').nth(0)).toContainText('ETH');
    await expect(page.locator('tbody tr').nth(4).locator('td').nth(0)).toContainText('BTC');
  });

  test('should show empty state when no positions exist', async ({ page }) => {
    // Don't add any positions
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify empty state message
    await expect(page.getByText('No open positions')).toBeVisible();
    await expect(page.getByTestId('positions-table')).toBeVisible();
  });

  test('should show real-time PnL updates when mark price changes', async ({ page }) => {
    // Add position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();
      const marketStore = (window as any).stores.getMarketStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });

      // Initial mark price
      marketStore.setAllMids({ 'BTC': 45500 });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Check initial PnL - (45500 - 45000) * 0.5 = 250
    const pnlCell = page.locator('tbody tr').first().locator('td').nth(5);
    const initialPnl = await pnlCell.textContent();
    expect(initialPnl).toContain('+');
    expect(initialPnl).toMatch(/250|250\.00/);

    // Update mark price
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setAllMids({ 'BTC': 46000 });
    });

    await page.waitForTimeout(500);

    // Check updated PnL - (46000 - 45000) * 0.5 = 500
    const updatedPnl = await pnlCell.textContent();
    expect(updatedPnl).toContain('+');
    expect(updatedPnl).toMatch(/500|500\.00/);
  });

  test('should handle BTC-PERP naming convention for mark prices', async ({ page }) => {
    // Add position with BTC coin name
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();
      const marketStore = (window as any).stores.getMarketStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 40500,
        marginType: 'cross',
        returnOnEquity: 0,
      });

      // Set mark price with -PERP suffix
      marketStore.setAllMids({ 'BTC-PERP': 46000 });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Should still find the price and calculate PnL
    const pnlCell = page.locator('tbody tr').first().locator('td').nth(5);
    const pnlText = await pnlCell.textContent();
    expect(pnlText).toContain('+');
  });
});
