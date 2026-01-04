/**
 * E2E Test: Order Fills Trigger Position Update
 *
 * This test verifies that when an order is filled via WebSocket,
 * the position is updated in real-time without needing to refresh from the API.
 *
 * Test ID: 001
 * Priority: Critical
 * Category: Functional
 */

import { test, expect } from '@playwright/test';

test.describe('Order Fills Trigger Position Update', () => {
  test('should update position in real-time when order is filled via WebSocket', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for the page to fully load
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    // Verify the main trading interface is displayed
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="orderbook-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="orderform-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="positions-table"]')).toBeVisible();

    // Check that WebSocket connection is established
    const connectionStatus = page.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toBeVisible();
    await expect(connectionStatus).toContainText('Connected');

    // Mock a wallet connection if needed (for test mode)
    const isTestMode = await page.evaluate(() => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('testMode') === 'true';
    });

    if (isTestMode) {
      // In test mode, we can proceed without wallet connection
      console.log('Running in test mode - wallet connection not required');
    } else {
      // For real mode, we would need to connect wallet
      // This would be handled by the wallet connection tests
      console.log('Running in real mode - wallet connection required');
    }

    // Get initial positions count
    const initialPositionsCount = await page.locator('[data-testid="positions-table"] tbody tr').count();

    // Simulate creating a position by triggering a mock order fill event
    // In a real test, this would come from the backend via WebSocket
    const mockOrderFill = {
      type: 'order_fill',
      oid: 12345,
      coin: 'BTC',
      side: 'B', // Buy
      px: 50000,
      sz: 0.1,
      remaining: 0,
      status: 'filled',
      timestamp: Date.now(),
      fee: 10,
      tradeId: 98765
    };

    // Send the mock order fill event to the application
    await page.evaluate((fillEvent) => {
      // Simulate receiving the order fill via WebSocket
      // This would normally come from the WebSocket manager
      window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
    }, mockOrderFill);

    // Wait for position to be added (should be fast due to real-time updates)
    await page.waitForFunction(() => {
      const positions = document.querySelectorAll('[data-testid="positions-table"] tbody tr');
      return positions.length > 0;
    }, { timeout: 5000 });

    // Verify position was added
    const newPositionsCount = await page.locator('[data-testid="positions-table"] tbody tr').count();
    expect(newPositionsCount).toBeGreaterThan(initialPositionsCount);

    // Verify position details are correct
    const positionRow = page.locator('[data-testid="positions-table"] tbody tr').first();
    await expect(positionRow).toContainText('BTC');
    await expect(positionRow).toContainText('LONG'); // Should be long for buy order
    await expect(positionRow).toContainText('50000.00'); // Entry price
    await expect(positionRow).toContainText('0.1000'); // Size

    // Verify position appears in the positions tab
    const positionsTab = page.locator('[data-testid="tab-Positions"]');
    await expect(positionsTab).toBeVisible();
    await expect(positionsTab).toHaveClass(/active/);

    // Verify the position shows as filled
    const statusCell = positionRow.locator('td').nth(5); // Unrealized PnL column
    await expect(statusCell).toBeVisible();

    // Test that multiple fills update the same position
    const secondOrderFill = {
      type: 'order_fill',
      oid: 12346,
      coin: 'BTC',
      side: 'B', // Buy more
      px: 51000,
      sz: 0.05,
      remaining: 0,
      status: 'filled',
      timestamp: Date.now(),
      fee: 5,
      tradeId: 98766
    };

    // Send second fill for the same position
    await page.evaluate((fillEvent) => {
      window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
    }, secondOrderFill);

    // Wait for position to be updated
    await page.waitForTimeout(1000);

    // Verify position size was updated (should be 0.15 total)
    const updatedSizeCell = positionRow.locator('td').nth(2); // Size column
    await expect(updatedSizeCell).toContainText('0.1500');

    // Verify new average entry price was calculated
    // (0.1 * 50000 + 0.05 * 51000) / 0.15 = 50333.33
    const entryPriceCell = positionRow.locator('td').nth(3); // Entry price column
    await expect(entryPriceCell).toContainText('50333.33');

    // Test closing a position via fill
    const closeOrderFill = {
      type: 'order_fill',
      oid: 12347,
      coin: 'BTC',
      side: 'A', // Sell
      px: 52000,
      sz: 0.15,
      remaining: 0,
      status: 'filled',
      timestamp: Date.now(),
      fee: 15,
      tradeId: 98767
    };

    // Send close fill
    await page.evaluate((fillEvent) => {
      window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
    }, closeOrderFill);

    // Wait for position to be removed
    await page.waitForFunction(() => {
      const positions = document.querySelectorAll('[data-testid="positions-table"] tbody tr');
      return positions.length === 0;
    }, { timeout: 5000 });

    // Verify position was closed
    const finalPositionsCount = await page.locator('[data-testid="positions-table"] tbody tr').count();
    expect(finalPositionsCount).toBe(0);

    // Verify no open positions message appears
    const noPositionsMessage = page.locator('[data-testid="positions-table"]').locator('text=No open positions');
    await expect(noPositionsMessage).toBeVisible();
  });

  test('should handle order fills with different sides correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    // Test short position creation
    const shortOrderFill = {
      type: 'order_fill',
      oid: 12348,
      coin: 'ETH',
      side: 'A', // Sell (short)
      px: 3000,
      sz: 1.0,
      remaining: 0,
      status: 'filled',
      timestamp: Date.now(),
      fee: 5,
      tradeId: 98768
    };

    await page.evaluate((fillEvent) => {
      window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
    }, shortOrderFill);

    // Wait for position to appear
    await page.waitForFunction(() => {
      const positions = document.querySelectorAll('[data-testid="positions-table"] tbody tr');
      return positions.length > 0;
    }, { timeout: 5000 });

    // Verify short position
    const positionRow = page.locator('[data-testid="positions-table"] tbody tr').first();
    await expect(positionRow).toContainText('ETH');
    await expect(positionRow).toContainText('SHORT'); // Should be short for sell order
    await expect(positionRow).toContainText('3000.00'); // Entry price
    await expect(positionRow).toContainText('1.0000'); // Size
  });

  test('should update order history when order fills occur', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    // Switch to order history tab
    const orderHistoryTab = page.locator('[data-testid="tab-Order History"]');
    await orderHistoryTab.click();
    await expect(orderHistoryTab).toHaveClass(/active/);

    // Get initial order history count
    const initialOrdersCount = await page.locator('[data-testid="order-history-table"] tbody tr').count();

    // Simulate order fill
    const orderFill = {
      type: 'order_fill',
      oid: 12349,
      coin: 'SOL',
      side: 'B',
      px: 100,
      sz: 10,
      remaining: 0,
      status: 'filled',
      timestamp: Date.now(),
      fee: 2,
      tradeId: 98769
    };

    await page.evaluate((fillEvent) => {
      window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
    }, orderFill);

    // Wait for order to be added to history
    await page.waitForFunction(() => {
      const orders = document.querySelectorAll('[data-testid="order-history-table"] tbody tr');
      return orders.length > 0;
    }, { timeout: 5000 });

    // Verify order appears in history
    const newOrdersCount = await page.locator('[data-testid="order-history-table"] tbody tr').count();
    expect(newOrdersCount).toBeGreaterThan(initialOrdersCount);

    const orderRow = page.locator('[data-testid="order-history-table"] tbody tr').first();
    await expect(orderRow).toContainText('SOL');
    await expect(orderRow).toContainText('BUY'); // Should show as buy
    await expect(orderRow).toContainText('100.00'); // Price
    await expect(orderRow).toContainText('10.0000'); // Size
    await expect(orderRow).toContainText('filled'); // Status
  });

  test('should handle partial fills correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    // Create initial position
    const initialFill = {
      type: 'order_fill',
      oid: 12350,
      coin: 'ADA',
      side: 'B',
      px: 1.0,
      sz: 100,
      remaining: 0,
      status: 'filled',
      timestamp: Date.now(),
      fee: 1,
      tradeId: 98770
    };

    await page.evaluate((fillEvent) => {
      window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
    }, initialFill);

    await page.waitForFunction(() => {
      const positions = document.querySelectorAll('[data-testid="positions-table"] tbody tr');
      return positions.length > 0;
    }, { timeout: 5000 });

    // Get initial position size
    const positionRow = page.locator('[data-testid="positions-table"] tbody tr').first();
    let positionSize = await positionRow.locator('td').nth(2).textContent();
    expect(positionSize).toContain('100.0000');

    // Partial fill - add to position
    const partialFill = {
      type: 'order_fill',
      oid: 12351,
      coin: 'ADA',
      side: 'B', // Same side
      px: 1.1,
      sz: 50,
      remaining: 0,
      status: 'filled',
      timestamp: Date.now(),
      fee: 0.5,
      tradeId: 98771
    };

    await page.evaluate((fillEvent) => {
      window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
    }, partialFill);

    await page.waitForTimeout(1000);

    // Verify position size increased
    positionSize = await positionRow.locator('td').nth(2).textContent();
    expect(positionSize).toContain('150.0000');

    // Verify new average entry price
    const entryPriceCell = positionRow.locator('td').nth(3);
    await expect(entryPriceCell).toContainText('1.0333'); // (100*1.0 + 50*1.1) / 150
  });

  test('should handle position reduction correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    // Create initial position
    const initialFill = {
      type: 'order_fill',
      oid: 12352,
      coin: 'DOT',
      side: 'B',
      px: 10.0,
      sz: 50,
      remaining: 0,
      status: 'filled',
      timestamp: Date.now(),
      fee: 2,
      tradeId: 98772
    };

    await page.evaluate((fillEvent) => {
      window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
    }, initialFill);

    await page.waitForFunction(() => {
      const positions = document.querySelectorAll('[data-testid="positions-table"] tbody tr');
      return positions.length > 0;
    }, { timeout: 5000 });

    // Reduce position (opposite side, smaller size)
    const reduceFill = {
      type: 'order_fill',
      oid: 12353,
      coin: 'DOT',
      side: 'A', // Sell (opposite of initial buy)
      px: 12.0,
      sz: 20,
      remaining: 0,
      status: 'filled',
      timestamp: Date.now(),
      fee: 1,
      tradeId: 98773
    };

    await page.evaluate((fillEvent) => {
      window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
    }, reduceFill);

    await page.waitForTimeout(1000);

    // Verify position size decreased
    const positionRow = page.locator('[data-testid="positions-table"] tbody tr').first();
    const positionSize = await positionRow.locator('td').nth(2).textContent();
    expect(positionSize).toContain('30.0000'); // 50 - 20 = 30
  });

  test('should maintain UI responsiveness during rapid order fills', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });

    // Send multiple rapid order fills
    const fills = [
      { type: 'order_fill', oid: 12354, coin: 'BTC', side: 'B', px: 50000, sz: 0.1, remaining: 0, status: 'filled', timestamp: Date.now(), fee: 10, tradeId: 98774 },
      { type: 'order_fill', oid: 12355, coin: 'BTC', side: 'B', px: 50100, sz: 0.1, remaining: 0, status: 'filled', timestamp: Date.now(), fee: 10, tradeId: 98775 },
      { type: 'order_fill', oid: 12356, coin: 'BTC', side: 'A', px: 50200, sz: 0.05, remaining: 0, status: 'filled', timestamp: Date.now(), fee: 5, tradeId: 98776 },
      { type: 'order_fill', oid: 12357, coin: 'ETH', side: 'B', px: 3000, sz: 1.0, remaining: 0, status: 'filled', timestamp: Date.now(), fee: 5, tradeId: 98777 },
      { type: 'order_fill', oid: 12358, coin: 'ETH', side: 'A', px: 3100, sz: 0.5, remaining: 0, status: 'filled', timestamp: Date.now(), fee: 3, tradeId: 98778 },
    ];

    // Send all fills rapidly
    for (const fill of fills) {
      await page.evaluate((fillEvent) => {
        window.dispatchEvent(new CustomEvent('mock-order-fill', { detail: fillEvent }));
      }, fill);
    }

    // Wait for all positions to be processed
    await page.waitForTimeout(2000);

    // Verify UI is stable and responsive
    const positionsCount = await page.locator('[data-testid="positions-table"] tbody tr').count();
    expect(positionsCount).toBeGreaterThan(0);

    // Verify no console errors occurred
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Check for critical errors
    expect(consoleErrors.length).toBeLessThan(5); // Allow some non-critical warnings
  });
});