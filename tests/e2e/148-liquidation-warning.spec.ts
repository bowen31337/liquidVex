import { test, expect } from '@playwright/test';

test.describe('Feature 148: Liquidation Warning When Approaching Liquidation Price', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with test mode enabled
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display SAFE risk level for positions far from liquidation', async ({ page }) => {
    // Add a position that is far from liquidation
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 50000,
        sz: 0.1,
        leverage: 5,
        marginUsed: 1000,
        unrealizedPnl: 500,
        realizedPnl: 0,
        liquidationPx: 40000, // 20% away from entry
        marginType: 'cross',
      });
    });

    // Set mark price to be far from liquidation
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ BTC: 50000 });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify SAFE badge is displayed
    const riskBadge = page.getByTestId('liquidation-risk-BTC');
    await expect(riskBadge).toBeVisible();
    await expect(riskBadge).toContainText('SAFE');
    await expect(riskBadge).toHaveClass(/bg-green-500/);
  });

  test('should display MEDIUM risk warning for positions approaching liquidation', async ({ page }) => {
    // Add a position that is 8% from liquidation (medium risk)
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'ETH',
        side: 'long',
        entryPx: 3000,
        sz: 1,
        leverage: 10,
        marginUsed: 300,
        unrealizedPnl: -150,
        realizedPnl: 0,
        liquidationPx: 2760, // 8% away from entry
        marginType: 'cross',
      });
    });

    // Set mark price to be 8% from liquidation
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ ETH: 2800 });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify MEDIUM risk badge is displayed
    const riskBadge = page.getByTestId('liquidation-risk-ETH');
    await expect(riskBadge).toBeVisible();
    await expect(riskBadge).toContainText('MEDIUM');
    await expect(riskBadge).toContainText('%');
    // Should have yellow styling
    await expect(riskBadge).toHaveClass(/border-yellow-500/);
  });

  test('should display HIGH risk warning for positions close to liquidation', async ({ page }) => {
    // Add a position that is 3% from liquidation (high risk)
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'BTC',
        side: 'short',
        entryPx: 50000,
        sz: 0.5,
        leverage: 20,
        marginUsed: 1250,
        unrealizedPnl: -600,
        realizedPnl: 0,
        liquidationPx: 51500, // 3% away from entry
        marginType: 'isolated',
      });
    });

    // Set mark price to be 3% from liquidation
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ BTC: 51000 });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify HIGH risk badge is displayed
    const riskBadge = page.getByTestId('liquidation-risk-BTC');
    await expect(riskBadge).toBeVisible();
    await expect(riskBadge).toContainText('HIGH');
    // Should have orange styling
    await expect(riskBadge).toHaveClass(/border-orange-500/);
  });

  test('should display CRITICAL risk warning for positions very close to liquidation', async ({ page }) => {
    // Add a position that is 1% from liquidation (critical risk)
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'ETH',
        side: 'long',
        entryPx: 3000,
        sz: 2,
        leverage: 25,
        marginUsed: 240,
        unrealizedPnl: -550,
        realizedPnl: 0,
        liquidationPx: 2970, // 1% away from entry
        marginType: 'cross',
      });
    });

    // Set mark price to be 1% from liquidation
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ ETH: 2980 });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify CRITICAL risk badge is displayed
    const riskBadge = page.getByTestId('liquidation-risk-ETH');
    await expect(riskBadge).toBeVisible();
    await expect(riskBadge).toContainText('CRITICAL');
    // Should have red styling
    await expect(riskBadge).toHaveClass(/border-red-500/);
  });

  test('should show visual row highlighting for high-risk positions', async ({ page }) => {
    // Add a high-risk position
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 50000,
        sz: 0.2,
        leverage: 15,
        marginUsed: 666,
        unrealizedPnl: -400,
        realizedPnl: 0,
        liquidationPx: 48500, // 3% away
        marginType: 'cross',
      });
    });

    // Set mark price to trigger high risk
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ BTC: 49000 });
    });

    await page.waitForTimeout(500);

    // Switch to Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Find the row and check for border styling
    const table = page.getByTestId('positions-table');
    const row = table.locator('tbody tr').first();

    // Should have orange border-left
    const className = await row.getAttribute('class');
    expect(className).toContain('border-l-4');
    expect(className).toContain('border-orange-500');
  });

  test('should update risk level dynamically as price changes', async ({ page }) => {
    // Add a position
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 50000,
        sz: 0.1,
        leverage: 10,
        marginUsed: 500,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 45000, // 10% away
        marginType: 'cross',
      });
    });

    // Start with SAFE price
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ BTC: 50000 });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(300);

    // Verify initially SAFE
    let riskBadge = page.getByTestId('liquidation-risk-BTC');
    await expect(riskBadge).toContainText('SAFE');

    // Update price to MEDIUM risk
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ BTC: 46000 });
    });
    await page.waitForTimeout(500);

    // Verify MEDIUM risk
    riskBadge = page.getByTestId('liquidation-risk-BTC');
    await expect(riskBadge).toContainText('MEDIUM');

    // Update price to HIGH risk
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ BTC: 45500 });
    });
    await page.waitForTimeout(500);

    // Verify HIGH risk
    riskBadge = page.getByTestId('liquidation-risk-BTC');
    await expect(riskBadge).toContainText('HIGH');
  });

  test('should show toast notification for medium risk positions', async ({ page }) => {
    // Add a position that will become medium risk
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 1,
        leverage: 10,
        marginUsed: 300,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 3300, // 10% away
        marginType: 'cross',
      });
    });

    // Set price to trigger medium risk (8% from liquidation)
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ ETH: 3240 });
    });

    await page.waitForTimeout(1000); // Wait for monitor to trigger

    // Check for toast notification
    const toast = page.getByTestId('toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('ETH');
    await expect(toast).toContainText('Medium risk');
    await expect(toast).toHaveClass(/bg-yellow-500/);
  });

  test('should show toast notification for high risk positions', async ({ page }) => {
    // Add a position that will become high risk
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 50000,
        sz: 0.5,
        leverage: 20,
        marginUsed: 1250,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 47500, // 5% away
        marginType: 'cross',
      });
    });

    // Set price to trigger high risk (3% from liquidation)
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ BTC: 49000 });
    });

    await page.waitForTimeout(1000);

    // Check for toast notification
    const toast = page.getByTestId('toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('BTC');
    await expect(toast).toContainText('High risk');
    await expect(toast).toHaveClass(/bg-orange-500/);
  });

  test('should show toast notification for critical risk positions', async ({ page }) => {
    // Add a position that will become critical risk
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'ETH',
        side: 'long',
        entryPx: 3000,
        sz: 2,
        leverage: 25,
        marginUsed: 240,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 2970, // 1% away
        marginType: 'cross',
      });
    });

    // Set price to trigger critical risk
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ ETH: 2980 });
    });

    await page.waitForTimeout(1000);

    // Check for toast notification
    const toast = page.getByTestId('toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('ETH');
    await expect(toast).toContainText('CRITICAL');
    await expect(toast).toHaveClass(/bg-short/); // Error styling
  });

  test('should display distance percentage in risk badge', async ({ page }) => {
    // Add a position 7% from liquidation
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;
      store.getState().addPosition({
        coin: 'BTC',
        side: 'short',
        entryPx: 50000,
        sz: 0.1,
        leverage: 10,
        marginUsed: 500,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 53500, // 7% away
        marginType: 'isolated',
      });
    });

    // Set price to be 7% from liquidation
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({ BTC: 53150 });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify percentage is shown
    const riskBadge = page.getByTestId('liquidation-risk-BTC');
    await expect(riskBadge).toContainText('MEDIUM');
    await expect(riskBadge).toContainText('7.0%');
  });

  test('should handle multiple positions with different risk levels', async ({ page }) => {
    // Add multiple positions with different risk levels
    await page.evaluate(() => {
      const store = (window as any).stores.useOrderStore;

      // Position 1: SAFE
      store.getState().addPosition({
        coin: 'BTC',
        side: 'long',
        entryPx: 50000,
        sz: 0.1,
        leverage: 5,
        marginUsed: 1000,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 40000,
        marginType: 'cross',
      });

      // Position 2: MEDIUM
      store.getState().addPosition({
        coin: 'ETH',
        side: 'short',
        entryPx: 3000,
        sz: 1,
        leverage: 10,
        marginUsed: 300,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 3240, // 8% away
        marginType: 'cross',
      });

      // Position 3: HIGH
      store.getState().addPosition({
        coin: 'SOL',
        side: 'long',
        entryPx: 100,
        sz: 10,
        leverage: 15,
        marginUsed: 66,
        unrealizedPnl: 0,
        realizedPnl: 0,
        liquidationPx: 95, // 5% away
        marginType: 'isolated',
      });
    });

    // Set prices
    await page.evaluate(() => {
      const store = (window as any).stores.useMarketStore;
      store.getState().setAllMids({
        BTC: 50000,  // SAFE
        ETH: 3240,   // MEDIUM (8% from 3240 liquidation)
        SOL: 98      // HIGH (3% from 95 liquidation)
      });
    });

    await page.waitForTimeout(500);
    await page.click('text=Positions');
    await page.waitForTimeout(500);

    // Verify all risk levels are displayed
    await expect(page.getByTestId('liquidation-risk-BTC')).toContainText('SAFE');
    await expect(page.getByTestId('liquidation-risk-ETH')).toContainText('MEDIUM');
    await expect(page.getByTestId('liquidation-risk-SOL')).toContainText('HIGH');

    // Verify row count
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(3);
  });
});
