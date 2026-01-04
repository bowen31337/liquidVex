import { test, expect } from '@playwright/test';

test.describe('Feature 37: Open Orders Table Complete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with test mode enabled
    await page.goto('http://localhost:3001?testMode=true');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display open orders table with correct structure', async ({ page }) => {
    // Add a test order via the store
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();
      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Verify table exists
    const table = page.getByTestId('orders-table');
    await expect(table).toBeVisible();

    // Verify table structure
    const tableElement = await page.locator('table.data-table').first();
    await expect(tableElement).toBeVisible();

    // Check headers
    const headers = await page.locator('thead th').allTextContents();
    expect(headers).toContain('Time');
    expect(headers).toContain('Symbol');
    expect(headers).toContain('Side');
    expect(headers).toContain('Type');
    expect(headers).toContain('Price');
    expect(headers).toContain('Size');
    expect(headers).toContain('Filled');
    expect(headers).toContain('Status');
    // The last header contains "Actions" and may also contain "Cancel All" button text
    const lastHeader = headers[headers.length - 1];
    expect(lastHeader).toContain('Actions');
  });

  test('should display order information correctly', async ({ page }) => {
    // Add test orders
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      // Add buy order
      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });

      // Add sell order
      store.addOpenOrder({
        oid: 2,
        coin: 'ETH',
        side: 'A',
        limitPx: 3000,
        sz: 10,
        origSz: 10,
        status: 'open',
        timestamp: Date.now() - 3600000,
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Verify order data is displayed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(2);

    // Check first order (Buy BTC)
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toBeVisible(); // Time
    await expect(firstRow.locator('td').nth(1)).toContainText('BTC'); // Symbol
    await expect(firstRow.locator('td').nth(2)).toContainText('Buy'); // Side
    await expect(firstRow.locator('td').nth(3)).toContainText('limit'); // Type
    await expect(firstRow.locator('td').nth(4)).toContainText('45000'); // Price
    await expect(firstRow.locator('td').nth(5)).toContainText('0.5'); // Size

    // Check second order (Sell ETH)
    const secondRow = page.locator('tbody tr').nth(1);
    await expect(secondRow.locator('td').nth(1)).toContainText('ETH'); // Symbol
    await expect(secondRow.locator('td').nth(2)).toContainText('Sell'); // Side
  });

  test('should color code buy and sell orders correctly', async ({ page }) => {
    // Add test orders
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });

      store.addOpenOrder({
        oid: 2,
        coin: 'ETH',
        side: 'A',
        limitPx: 3000,
        sz: 10,
        origSz: 10,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Check buy order has long color
    const buyRow = page.locator('tbody tr').first();
    const buySide = buyRow.locator('td').nth(2);
    await expect(buySide).toHaveClass(/text-long/);

    // Check sell order has short color
    const sellRow = page.locator('tbody tr').nth(1);
    const sellSide = sellRow.locator('td').nth(2);
    await expect(sellSide).toHaveClass(/text-short/);
  });

  test('should display modify and cancel buttons for each order', async ({ page }) => {
    // Add test order
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Verify buttons exist
    const modifyButton = page.getByTestId('modify-order-1');
    await expect(modifyButton).toBeVisible();
    await expect(modifyButton).toHaveText('Modify');

    const cancelButton = page.getByTestId('cancel-order-1');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toHaveText('Cancel');
  });

  test('should display cancel all button when orders exist', async ({ page }) => {
    // Add test orders
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });

      store.addOpenOrder({
        oid: 2,
        coin: 'ETH',
        side: 'A',
        limitPx: 3000,
        sz: 10,
        origSz: 10,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Verify cancel all button exists
    const cancelAllButton = page.getByTestId('cancel-all-orders');
    await expect(cancelAllButton).toBeVisible();
    await expect(cancelAllButton).toHaveText('Cancel All');
  });

  test('should show no orders message when table is empty', async ({ page }) => {
    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Verify empty state message
    await expect(page.getByText('No open orders')).toBeVisible();
    await expect(page.getByTestId('orders-table')).toBeVisible();
  });

  test('should integrate with bottom panel tabs', async ({ page }) => {
    // Add test order
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Verify tab is active
    const activeTab = page.locator('button:has-text("Open Orders")');
    await expect(activeTab).toHaveClass(/border-b-2/);

    // Verify badge count
    await expect(activeTab).toContainText('1');
  });

  test('should handle cancel order action', async ({ page }) => {
    // Add test order
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Click cancel button
    const cancelButton = page.getByTestId('cancel-order-1');
    await cancelButton.click();

    // Wait for cancellation to process
    await page.waitForTimeout(1000);

    // Verify order is removed from open orders
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(0);

    // Verify "No open orders" message is displayed
    await expect(page.getByText('No open orders')).toBeVisible();
  });

  test('should handle cancel all orders action', async ({ page }) => {
    // Add test orders
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });

      store.addOpenOrder({
        oid: 2,
        coin: 'ETH',
        side: 'A',
        limitPx: 3000,
        sz: 10,
        origSz: 10,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Click cancel all button
    const cancelAllButton = page.getByTestId('cancel-all-orders');
    await cancelAllButton.click();

    // Wait for cancellation to process
    await page.waitForTimeout(1000);

    // Verify all orders are removed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(0);

    // Verify "No open orders" message is displayed
    await expect(page.getByText('No open orders')).toBeVisible();
  });

  test('should open modify modal when modify button is clicked', async ({ page }) => {
    // Add test order
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Click modify button
    const modifyButton = page.getByTestId('modify-order-1');
    await modifyButton.click();

    // Verify modal opens
    await page.waitForTimeout(500);
    const modal = page.getByTestId('order-modify-modal');
    await expect(modal).toBeVisible();
  });

  test('should display correct filled amount', async ({ page }) => {
    // Add test order with partial fill
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.3, // Remaining size
        origSz: 0.5, // Original size
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Check filled column shows 0.2 (0.5 - 0.3)
    const filledCell = page.locator('tbody tr').first().locator('td').nth(6);
    await expect(filledCell).toContainText('0.2');
  });

  test('should handle multiple orders efficiently', async ({ page }) => {
    // Add multiple test orders
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      for (let i = 1; i <= 10; i++) {
        store.addOpenOrder({
          oid: i,
          coin: i % 2 === 0 ? 'BTC' : 'ETH',
          side: i % 2 === 0 ? 'B' : 'A',
          limitPx: 45000 + i * 100,
          sz: 0.5 + i * 0.1,
          origSz: 0.5 + i * 0.1,
          status: 'open',
          timestamp: Date.now() - i * 60000,
          orderType: 'limit',
          reduceOnly: false,
          postOnly: false,
          tif: 'GTC',
        });
      }
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Verify all orders are displayed
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBe(10);

    // Verify badge count
    const activeTab = page.locator('button:has-text("Open Orders")');
    await expect(activeTab).toContainText('10');
  });

  test('should disable buttons during cancellation', async ({ page }) => {
    // Add test order
    await page.evaluate(() => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp: Date.now(),
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    });

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Click cancel button
    const cancelButton = page.getByTestId('cancel-order-1');
    await cancelButton.click();

    // Verify button shows loading state
    await expect(cancelButton).toHaveText('...');
  });

  test('should format time correctly', async ({ page }) => {
    // Add test order with specific timestamp
    const testTimestamp = Date.now();
    await page.evaluate((timestamp) => {
      const store = (window as any).stores.getOrderStoreState();

      store.addOpenOrder({
        oid: 1,
        coin: 'BTC',
        side: 'B',
        limitPx: 45000,
        sz: 0.5,
        origSz: 0.5,
        status: 'open',
        timestamp,
        orderType: 'limit',
        reduceOnly: false,
        postOnly: false,
        tif: 'GTC',
      });
    }, testTimestamp);

    await page.waitForTimeout(500);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(500);

    // Verify time is displayed in HH:MM format
    const timeCell = page.locator('tbody tr').first().locator('td').nth(0);
    const timeText = await timeCell.textContent();
    expect(timeText).toMatch(/\d{2}:\d{2}/);
  });
});
