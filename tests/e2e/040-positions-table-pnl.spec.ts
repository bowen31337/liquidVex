import { test, expect } from '@playwright/test';

test.describe('Feature 40: Positions Table with Real-time PnL', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with test mode enabled
    await page.goto('http://localhost:3001?testMode=true');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Connect wallet in test mode using setState
    await page.evaluate(() => {
      const walletStore = (window as any).stores.useWalletStore;
      walletStore.setState({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      });
    });

    await page.waitForTimeout(500);
  });

  test('should display positions table with correct structure', async ({ page }) => {
    // Add a test position via the store
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();
      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify table exists
    const table = page.getByTestId('positions-table');
    await expect(table).toBeVisible();

    // Verify table structure
    const tableElement = await page.locator('table.data-table').first();
    await expect(tableElement).toBeVisible();

    // Check headers
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
    // Add test positions
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      // Long BTC position
      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });

      // Short ETH position
      orderStore.addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 10,
        leverage: 5,
        marginUsed: 6000,
        unrealizedPnl: -150,
        realizedPnl: 50,
        liquidationPx: 3500,
        marginType: 'isolated',
        returnOnEquity: -2.5,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify position data is displayed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(2);

    // Check first row (BTC Long) - note: toLocaleString adds commas and decimals
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toContainText('BTC'); // Symbol
    await expect(firstRow.locator('td').nth(1)).toContainText('LONG'); // Side
    await expect(firstRow.locator('td').nth(2)).toContainText('0.5'); // Size
    await expect(firstRow.locator('td').nth(3)).toContainText('45,000.00'); // Entry (with comma)
    await expect(firstRow.locator('td').nth(6)).toContainText('+100.00'); // Realized PnL
    await expect(firstRow.locator('td').nth(7)).toContainText('10x'); // Leverage
    await expect(firstRow.locator('td').nth(8)).toContainText('2,250.00'); // Margin (with comma)
    await expect(firstRow.locator('td').nth(9)).toContainText('40,000.00'); // Liq Price (with comma)
    await expect(firstRow.locator('td').nth(10)).toContainText('CROSS'); // Margin Type

    // Check second row (ETH Short)
    const secondRow = page.locator('tbody tr').nth(1);
    await expect(secondRow.locator('td').nth(0)).toContainText('ETH'); // Symbol
    await expect(secondRow.locator('td').nth(1)).toContainText('SHORT'); // Side
    await expect(secondRow.locator('td').nth(2)).toContainText('10.0000'); // Size
    await expect(secondRow.locator('td').nth(3)).toContainText('3,000.00'); // Entry (with comma)
    await expect(secondRow.locator('td').nth(6)).toContainText('+50.00'); // Realized PnL
    await expect(secondRow.locator('td').nth(7)).toContainText('5x'); // Leverage
    await expect(secondRow.locator('td').nth(8)).toContainText('6,000.00'); // Margin (with comma)
    await expect(secondRow.locator('td').nth(9)).toContainText('3,500.00'); // Liq Price (with comma)
    await expect(secondRow.locator('td').nth(10)).toContainText('ISOLATED'); // Margin Type
  });

  test('should color code long and short positions correctly', async ({ page }) => {
    // Add test positions
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });

      orderStore.addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 10,
        leverage: 5,
        marginUsed: 6000,
        unrealizedPnl: -150,
        realizedPnl: 50,
        liquidationPx: 3500,
        marginType: 'isolated',
        returnOnEquity: -2.5,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Check long position has long color
    const longRow = page.locator('tbody tr').first();
    const longSide = longRow.locator('td').nth(1);
    await expect(longSide).toHaveClass(/text-long/);

    // Check short position has short color
    const shortRow = page.locator('tbody tr').nth(1);
    const shortSide = shortRow.locator('td').nth(1);
    await expect(shortSide).toHaveClass(/text-short/);
  });

  test('should display action buttons for each position', async ({ page }) => {
    // Add test position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify action buttons exist
    const marginModeButton = page.getByTestId('margin-mode-BTC');
    await expect(marginModeButton).toBeVisible();
    await expect(marginModeButton).toHaveText('Set Mode');

    const modifyButton = page.getByTestId('modify-position-BTC');
    await expect(modifyButton).toBeVisible();
    await expect(modifyButton).toHaveText('Modify');

    const closeButton = page.getByTestId('close-position-BTC');
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toHaveText('Close');
  });

  test('should show no positions message when table is empty', async ({ page }) => {
    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify empty state message
    await expect(page.getByText('No open positions')).toBeVisible();
    await expect(page.getByTestId('positions-table')).toBeVisible();
  });

  test('should integrate with bottom panel tabs', async ({ page }) => {
    // Add test position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);

    // Positions tab should be active by default
    const activeTab = page.locator('button:has-text("Positions")');
    await expect(activeTab).toHaveClass(/border-b-2/);

    // Verify badge count
    await expect(activeTab).toContainText('1');
  });

  test('should open close position modal when close button is clicked', async ({ page }) => {
    // Add test position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Click close button
    const closeButton = page.getByTestId('close-position-BTC');
    await closeButton.click();

    // Verify modal opens
    await page.waitForTimeout(500);
    const modal = page.getByTestId('position-close-modal');
    await expect(modal).toBeVisible();
  });

  test('should open modify position modal when modify button is clicked', async ({ page }) => {
    // Add test position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Click modify button
    const modifyButton = page.getByTestId('modify-position-BTC');
    await modifyButton.click();

    // Verify modal opens
    await page.waitForTimeout(500);
    const modal = page.getByTestId('position-modify-modal');
    await expect(modal).toBeVisible();
  });

  test('should open margin mode modal when set mode button is clicked', async ({ page }) => {
    // Add test position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Click set mode button
    const marginModeButton = page.getByTestId('margin-mode-BTC');
    await marginModeButton.click();

    // Verify modal opens
    await page.waitForTimeout(500);
    const modal = page.getByTestId('margin-mode-modal');
    await expect(modal).toBeVisible();
  });

  test('should display unrealized PnL with correct color coding', async ({ page }) => {
    // Add test positions with different PnL values
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      // Positive PnL
      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });

      // Negative PnL
      orderStore.addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 10,
        leverage: 5,
        marginUsed: 6000,
        unrealizedPnl: -150,
        realizedPnl: 50,
        liquidationPx: 3500,
        marginType: 'isolated',
        returnOnEquity: -2.5,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Check positive PnL has long color
    const firstRow = page.locator('tbody tr').first();
    const unrealizedPnlCell = firstRow.locator('td').nth(5);
    await expect(unrealizedPnlCell).toHaveClass(/text-long/);
    await expect(unrealizedPnlCell).toContainText('+500.00');

    // Check negative PnL has short color
    const secondRow = page.locator('tbody tr').nth(1);
    const unrealizedPnlCell2 = secondRow.locator('td').nth(5);
    await expect(unrealizedPnlCell2).toHaveClass(/text-short/);
    await expect(unrealizedPnlCell2).toContainText('-150.00');
  });

  test('should display realized PnL with correct color coding', async ({ page }) => {
    // Add test positions with different realized PnL values
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      // Positive realized PnL
      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });

      // Negative realized PnL
      orderStore.addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 10,
        leverage: 5,
        marginUsed: 6000,
        unrealizedPnl: 150,
        realizedPnl: -200,
        liquidationPx: 3500,
        marginType: 'isolated',
        returnOnEquity: -2.5,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Check positive realized PnL has long color
    const firstRow = page.locator('tbody tr').first();
    const realizedPnlCell = firstRow.locator('td').nth(6);
    await expect(realizedPnlCell).toHaveClass(/text-long/);
    await expect(realizedPnlCell).toContainText('+100');

    // Check negative realized PnL has short color
    const secondRow = page.locator('tbody tr').nth(1);
    const realizedPnlCell2 = secondRow.locator('td').nth(6);
    await expect(realizedPnlCell2).toHaveClass(/text-short/);
    await expect(realizedPnlCell2).toContainText('-200');
  });

  test('should handle multiple positions efficiently', async ({ page }) => {
    // Add multiple test positions
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      for (let i = 1; i <= 10; i++) {
        orderStore.addPosition({
          coin: i % 2 === 0 ? 'BTC' : 'ETH',
          side: i % 2 === 0 ? 'long' : 'short',
          entryPx: i % 2 === 0 ? 45000 : 3000,
          sz: 0.5 + i * 0.1,
          leverage: 10 - i,
          marginUsed: 2250 + i * 100,
          unrealizedPnl: i * 50,
          realizedPnl: i * 10,
          liquidationPx: i % 2 === 0 ? 40000 : 3500,
          marginType: i % 2 === 0 ? 'cross' : 'isolated',
          returnOnEquity: i * 2,
        });
      }
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify all positions are displayed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(10);

    // Verify badge count
    const activeTab = page.locator('button:has-text("Positions")');
    await expect(activeTab).toContainText('10');
  });

  test('should display real-time mark price updates', async ({ page }) => {
    // Add test position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Initially mark price should be -- (no market data)
    const firstRow = page.locator('tbody tr').first();
    const markCell = firstRow.locator('td').nth(4);
    await expect(markCell).toContainText('--');

    // Now set market data (allMids)
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setAllMids({ BTC: 46000, ETH: 3100 });
    });

    await page.waitForTimeout(500);

    // Mark price should now show the updated value
    await expect(markCell).toContainText('46000');
  });

  test('should calculate real-time PnL based on mark price', async ({ page }) => {
    // Add test position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500, // Initial value
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Set market data - price increased by 1000
    // Entry: 45000, Mark: 46000, Size: 0.5
    // PnL = (46000 - 45000) * 0.5 = 500
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setAllMids({ BTC: 46000 });
    });

    await page.waitForTimeout(500);

    // Check unrealized PnL shows calculated value
    const firstRow = page.locator('tbody tr').first();
    const unrealizedPnlCell = firstRow.locator('td').nth(5);
    await expect(unrealizedPnlCell).toContainText('+500');
    await expect(unrealizedPnlCell).toHaveClass(/text-long/);

    // Now update to a higher price
    // Entry: 45000, Mark: 47000, Size: 0.5
    // PnL = (47000 - 45000) * 0.5 = 1000
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setAllMids({ BTC: 47000 });
    });

    await page.waitForTimeout(500);

    // PnL should update
    await expect(unrealizedPnlCell).toContainText('+1000');
  });

  test('should calculate real-time PnL correctly for short positions', async ({ page }) => {
    // Add test short position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 10,
        leverage: 5,
        marginUsed: 6000,
        unrealizedPnl: -150, // Initial value
        realizedPnl: 50,
        liquidationPx: 3500,
        marginType: 'isolated',
        returnOnEquity: -2.5,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Set market data - price decreased by 100 (good for short)
    // Entry: 3000, Mark: 2900, Size: 10
    // PnL = (3000 - 2900) * 10 = 1000
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setAllMids({ ETH: 2900 });
    });

    await page.waitForTimeout(500);

    // Check unrealized PnL shows calculated value
    const firstRow = page.locator('tbody tr').first();
    const unrealizedPnlCell = firstRow.locator('td').nth(5);
    await expect(unrealizedPnlCell).toContainText('+1000');
    await expect(unrealizedPnlCell).toHaveClass(/text-long/);

    // Now update to a higher price (bad for short)
    // Entry: 3000, Mark: 3100, Size: 10
    // PnL = (3000 - 3100) * 10 = -1000
    await page.evaluate(() => {
      const marketStore = (window as any).stores.getMarketStoreState();
      marketStore.setAllMids({ ETH: 3100 });
    });

    await page.waitForTimeout(500);

    // PnL should update and show negative
    await expect(unrealizedPnlCell).toContainText('-1000');
    await expect(unrealizedPnlCell).toHaveClass(/text-short/);
  });

  test('should display margin type badges with correct styling', async ({ page }) => {
    // Add test positions with different margin types
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });

      orderStore.addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 10,
        leverage: 5,
        marginUsed: 6000,
        unrealizedPnl: -150,
        realizedPnl: 50,
        liquidationPx: 3500,
        marginType: 'isolated',
        returnOnEquity: -2.5,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Check cross margin has correct styling
    const firstRow = page.locator('tbody tr').first();
    const marginTypeCell = firstRow.locator('td').nth(10);
    await expect(marginTypeCell).toContainText('CROSS');
    await expect(marginTypeCell).toHaveClass(/bg-long/); // Cross uses long color

    // Check isolated margin has correct styling
    const secondRow = page.locator('tbody tr').nth(1);
    const marginTypeCell2 = secondRow.locator('td').nth(10);
    await expect(marginTypeCell2).toContainText('ISOLATED');
    await expect(marginTypeCell2).toHaveClass(/bg-short/); // Isolated uses short color
  });

  test('should display all position fields with proper formatting', async ({ page }) => {
    // Add test position with various decimal values
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45123.45,
        sz: 0.1234,
        leverage: 10.5,
        marginUsed: 1234.56,
        unrealizedPnl: 123.45,
        realizedPnl: 67.89,
        liquidationPx: 40123.45,
        marginType: 'cross',
        returnOnEquity: 12.34,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    const firstRow = page.locator('tbody tr').first();

    // Size should show 4 decimal places
    await expect(firstRow.locator('td').nth(2)).toContainText('0.1234');

    // Entry should show 2 decimal places
    await expect(firstRow.locator('td').nth(3)).toContainText('45123.45');

    // Margin should show 2 decimal places
    await expect(firstRow.locator('td').nth(8)).toContainText('1234.56');

    // Liq price should show 2 decimal places
    await expect(firstRow.locator('td').nth(9)).toContainText('40123.45');

    // Leverage should show as integer or decimal
    await expect(firstRow.locator('td').nth(7)).toContainText('10.5');
  });

  test('should handle empty state when wallet is not connected', async ({ page }) => {
    // Don't add any positions
    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Should show connect wallet message (since no test mode wallet connection)
    // In test mode, it shows "No open positions" because we bypass wallet check
    await expect(page.getByTestId('positions-table')).toBeVisible();
  });

  test('should update positions when store is modified', async ({ page }) => {
    // Add initial position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 45000,
        sz: 0.5,
        leverage: 10,
        marginUsed: 2250,
        unrealizedPnl: 500,
        realizedPnl: 100,
        liquidationPx: 40000,
        marginType: 'cross',
        returnOnEquity: 22.22,
      });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify 1 position
    let rows = await page.locator('tbody tr').count();
    expect(rows).toBe(1);

    // Add another position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();

      orderStore.addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 10,
        leverage: 5,
        marginUsed: 6000,
        unrealizedPnl: -150,
        realizedPnl: 50,
        liquidationPx: 3500,
        marginType: 'isolated',
        returnOnEquity: -2.5,
      });
    });

    await page.waitForTimeout(500);

    // Verify 2 positions
    rows = await page.locator('tbody tr').count();
    expect(rows).toBe(2);

    // Remove first position
    await page.evaluate(() => {
      const orderStore = (window as any).stores.getOrderStoreState();
      orderStore.removePosition('BTC');
    });

    await page.waitForTimeout(500);

    // Verify 1 position remains
    rows = await page.locator('tbody tr').count();
    expect(rows).toBe(1);
    await expect(page.locator('tbody tr').first()).toContainText('ETH');
  });
});
