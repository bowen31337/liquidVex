import { test, expect } from '@playwright/test';

test('Debug window.stores', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:3002?testMode=true');

  // Check what's on window
  const windowInfo = await page.evaluate(() => {
    return {
      hasStores: typeof (window as any).stores !== 'undefined',
      storesKeys: (window as any).stores ? Object.keys((window as any).stores) : [],
      url: window.location.href,
    };
  });

  console.log('Window info:', windowInfo);

  // Wait a bit longer
  await page.waitForTimeout(2000);

  const windowInfo2 = await page.evaluate(() => {
    return {
      hasStores: typeof (window as any).stores !== 'undefined',
      storesKeys: (window as any).stores ? Object.keys((window as any).stores) : [],
    };
  });

  console.log('Window info after 2s:', windowInfo2);
});
