/**
 * E2E Test for Loading Skeleton States
 *
 * This test verifies that all data panels show skeleton loading states
 * while data is being fetched from the API.
 */

import { test, expect } from '@playwright/test';

test.describe('Loading Skeleton States', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app with test mode enabled
    await page.goto('http://localhost:3002?testMode=true');
  });

  test('should display skeleton states in all panels during initial load', async ({ page }) => {
    // Test that skeleton components are rendered when loading states are true

    // Navigate to the app and trigger loading states
    await page.goto('http://localhost:3002?testMode=true');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Inject loading states into the store
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useOrderStore) {
        stores.useOrderStore.getState().setIsLoadingPositions(true);
        stores.useOrderStore.getState().setIsLoadingOpenOrders(true);
        stores.useOrderStore.getState().setIsLoadingOrderHistory(true);
        stores.useOrderStore.getState().setIsLoadingTradeHistory(true);
        stores.useMarketStore.getState().setIsLoadingOrderBook(true);
        stores.useMarketStore.getState().setIsLoadingTrades(true);
        stores.useMarketStore.getState().setIsLoadingCandles(true);
      }
    });

    // Wait for React to update
    await page.waitForTimeout(100);

    // Verify Chart skeleton is visible
    const chartSkeleton = page.locator('[data-testid="chart-skeleton"]').first();
    await expect(chartSkeleton).toBeVisible();

    // Verify OrderBook skeleton is visible
    const orderbookSkeleton = page.locator('[data-testid="orderbook-skeleton"]').first();
    await expect(orderbookSkeleton).toBeVisible();

    // Verify RecentTrades skeleton is visible
    const recenttradesSkeleton = page.locator('[data-testid="recenttrades-skeleton"]').first();
    await expect(recenttradesSkeleton).toBeVisible();

    // Verify that skeleton panels have the expected structure
    // Chart skeleton should have loading text
    await expect(chartSkeleton).toContainText('Loading Chart');

    // All skeletons should have pulsing animation
    const skeletons = page.locator('.animate-pulse');
    await expect(skeletons.first()).toBeVisible();
  });

  test('should display skeleton in Positions table during loading', async ({ page }) => {
    // First navigate to the app
    await page.goto('http://localhost:3002?testMode=true');

    // Set loading state for positions and trigger wallet connection
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useOrderStore && stores.useWalletStore && stores.useUIStore) {
        // Simulate wallet connection
        (stores.useWalletStore.getState() as any).address = '0x1234567890abcdef1234567890abcdef12345678';
        (stores.useWalletStore.getState() as any).isConnected = true;

        // Make sure we're on the Positions tab
        stores.useUIStore.getState().setActiveTab('Positions');

        // Clear any existing positions first
        stores.useOrderStore.getState().setPositions([]);

        // Then set loading state
        stores.useOrderStore.getState().setIsLoadingPositions(true);
      }
    });

    // Wait for React to update
    await page.waitForTimeout(200);

    // Should see skeleton loading state (PositionsTableSkeleton)
    const skeleton = page.locator('[data-testid="bottom-panel"]').locator('.animate-pulse').first();
    await expect(skeleton).toBeVisible();
  });

  test('should display skeleton in Open Orders table during loading', async ({ page }) => {
    // Set loading state and switch to Open Orders tab
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useOrderStore && stores.useWalletStore && stores.useUIStore) {
        // Simulate wallet connection
        (stores.useWalletStore.getState() as any).address = '0x1234567890abcdef1234567890abcdef12345678';
        (stores.useWalletStore.getState() as any).isConnected = true;

        // Switch to Open Orders tab
        stores.useUIStore.getState().setActiveTab('Open Orders');

        // Set loading state
        stores.useOrderStore.getState().setIsLoadingOpenOrders(true);
      }
    });

    await page.waitForTimeout(100);

    // Should see skeleton loading state
    const skeleton = page.locator('.animate-pulse').first();
    await expect(skeleton).toBeVisible();
  });

  test('should display skeleton in Order History during loading', async ({ page }) => {
    // Set loading state and switch to Order History tab
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useOrderStore && stores.useWalletStore && stores.useUIStore) {
        // Simulate wallet connection
        (stores.useWalletStore.getState() as any).address = '0x1234567890abcdef1234567890abcdef12345678';
        (stores.useWalletStore.getState() as any).isConnected = true;

        // Switch to Order History tab
        stores.useUIStore.getState().setActiveTab('Order History');

        // Set loading state
        stores.useOrderStore.getState().setIsLoadingOrderHistory(true);
      }
    });

    await page.waitForTimeout(100);

    // Should see skeleton loading state
    const skeleton = page.locator('.animate-pulse').first();
    await expect(skeleton).toBeVisible();
  });

  test('should display skeleton in Trade History during loading', async ({ page }) => {
    // Set loading state and switch to Trade History tab
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useOrderStore && stores.useWalletStore && stores.useUIStore) {
        // Simulate wallet connection
        (stores.useWalletStore.getState() as any).address = '0x1234567890abcdef1234567890abcdef12345678';
        (stores.useWalletStore.getState() as any).isConnected = true;

        // Switch to Trade History tab
        stores.useUIStore.getState().setActiveTab('Trade History');

        // Set loading state
        stores.useOrderStore.getState().setIsLoadingTradeHistory(true);
      }
    });

    await page.waitForTimeout(100);

    // Should see skeleton loading state
    const skeleton = page.locator('.animate-pulse').first();
    await expect(skeleton).toBeVisible();
  });

  test('should transition from skeleton to actual content', async ({ page }) => {
    // Set loading states to true
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useOrderStore && stores.useWalletStore && stores.useUIStore) {
        // Simulate wallet connection
        (stores.useWalletStore.getState() as any).address = '0x1234567890abcdef1234567890abcdef12345678';
        (stores.useWalletStore.getState() as any).isConnected = true;

        // Ensure we're on Positions tab
        stores.useUIStore.getState().setActiveTab('Positions');

        // Set loading state
        stores.useOrderStore.getState().setIsLoadingPositions(true);
      }
    });

    await page.waitForTimeout(100);

    // Should see skeleton
    let skeleton = page.locator('.animate-pulse').first();
    await expect(skeleton).toBeVisible();

    // Set loading state to false and add mock data
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useOrderStore) {
        stores.useOrderStore.getState().setIsLoadingPositions(false);
        stores.useOrderStore.getState().setPositions([{
          coin: 'BTC',
          side: 'long',
          entryPx: 43250.50,
          sz: 0.5,
          leverage: 10,
          marginUsed: 2162.53,
          unrealizedPnl: 0,
          realizedPnl: 0,
          liquidationPx: 38925.45,
          marginType: 'cross',
        }]);
      }
    });

    await page.waitForTimeout(100);

    // Skeleton should be gone, replaced by actual content
    skeleton = page.locator('[data-testid="positions-table"]');
    await expect(skeleton).toContainText('BTC');
  });

  test('skeleton should have proper styling and structure', async ({ page }) => {
    // Set loading states
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useMarketStore) {
        stores.useMarketStore.getState().setIsLoadingCandles(true);
        stores.useMarketStore.getState().setIsLoadingOrderBook(true);
        stores.useMarketStore.getState().setIsLoadingTrades(true);
      }
    });

    await page.waitForTimeout(100);

    // Check that skeleton elements have the correct CSS classes
    const animatedElements = page.locator('.animate-pulse');
    const count = await animatedElements.count();

    // Should have multiple animated skeleton elements
    expect(count).toBeGreaterThan(5);

    // Check that skeleton elements have bg-surface-elevated class
    const skeletonBackgrounds = page.locator('.bg-surface-elevated.animate-pulse');
    const bgCount = await skeletonBackgrounds.count();

    // Should have at least some elements with proper background
    expect(bgCount).toBeGreaterThan(0);
  });
});

test.describe('Loading Skeleton Accessibility', () => {
  test('skeleton states should not block accessibility', async ({ page }) => {
    await page.goto('http://localhost:3002?testMode=true');

    // Set loading states
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useMarketStore) {
        stores.useMarketStore.getState().setIsLoadingCandles(true);
        stores.useMarketStore.getState().setIsLoadingOrderBook(true);
        stores.useMarketStore.getState().setIsLoadingTrades(true);
      }
    });

    await page.waitForTimeout(100);

    // Check that skeleton elements don't interfere with screen readers
    // They should not have focusable elements or inappropriate ARIA labels
    const focusableElements = page.locator('[data-testid*="skeleton"]').locator('button, input, select, a[href], [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();

    // Skeletons should not contain focusable elements
    expect(count).toBe(0);
  });
});

test.describe('Loading Skeleton Performance', () => {
  test('skeleton states should render quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3002?testMode=true');

    // Set loading states immediately
    await page.evaluate(() => {
      const stores = (window as any).stores;
      if (stores && stores.useMarketStore) {
        stores.useMarketStore.getState().setIsLoadingCandles(true);
        stores.useMarketStore.getState().setIsLoadingOrderBook(true);
      }
    });

    // Wait for skeletons to appear
    await page.waitForSelector('.animate-pulse', { timeout: 5000 });

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // Skeletons should render within 1 second
    expect(renderTime).toBeLessThan(1000);
  });
});
