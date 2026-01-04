import { test, expect } from '@playwright/test';

test.describe('Debug Open Orders', () => {
  test('debug orders table', async ({ page }) => {
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Add order
    await page.evaluate(() => {
      console.log('Window stores:', (window as any).stores);
      const store = (window as any).stores?.getOrderStoreState();
      console.log('Store:', store);
      console.log('Open orders before:', store?.openOrders);

      if (store) {
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

        console.log('Open orders after:', store.openOrders);
      }
    });

    await page.waitForTimeout(1000);

    // Switch to Open Orders tab
    await page.click('text=Open Orders');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'debug-orders.png' });

    // Check what's visible
    const table = page.getByTestId('orders-table');
    const isVisible = await table.isVisible();
    console.log('Table visible:', isVisible);

    const textContent = await page.textContent('body');
    console.log('Page contains "BTC":', textContent?.includes('BTC'));
    console.log('Page contains "No open orders":', textContent?.includes('No open orders'));
  });
});
