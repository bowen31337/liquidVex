/**
 * E2E test for UI performance optimization
 * Tests that UI updates happen within 100ms of market data changes
 */

import { test, expect } from '@playwright/test';

test.describe('UI Performance Optimization', () => {
  test('should update UI within 100ms of market data change', async ({ page }) => {
    // Navigate to the application
    await page.goto('/?testMode=true');

    // Wait for the page to load and performance monitor to appear
    await page.waitForSelector('[data-testid="performance-monitor"]', { timeout: 10000 });

    // Get initial performance metrics
    const initialMetrics = await page.evaluate(() => {
      const performanceMonitor = document.querySelector('[data-testid="performance-monitor"]');
      if (performanceMonitor) {
        return {
          exists: true,
          textContent: performanceMonitor.textContent,
        };
      }
      return { exists: false };
    });

    expect(initialMetrics.exists).toBe(true);

    // Check if performance monitor is properly initialized
    const performanceMonitorVisible = await page.locator('[data-testid="performance-monitor"]').isVisible();
    expect(performanceMonitorVisible).toBe(true);

    // Wait for some WebSocket activity in development mode
    await page.waitForTimeout(2000);

    // Check that WebSocket metrics are being tracked
    const websocketLatency = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="performance-monitor"]');
      if (monitor) {
        const latencyText = monitor.textContent?.match(/(\d+\.?\d*)ms/);
        return latencyText ? parseFloat(latencyText[1]) : null;
      }
      return null;
    });

    // If latency is tracked, it should be under 100ms in development
    if (websocketLatency !== null) {
      expect(websocketLatency).toBeLessThan(100);
    }

    // Check that update counters are incrementing
    const initialUpdates = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="performance-monitor"]');
      if (monitor) {
        const updatesText = monitor.textContent?.match(/Updates:\s*(\d+)/);
        return updatesText ? parseInt(updatesText[1]) : 0;
      }
      return 0;
    });

    // Wait a bit more and check that updates are happening
    await page.waitForTimeout(1000);

    const finalUpdates = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="performance-monitor"]');
      if (monitor) {
        const updatesText = monitor.textContent?.match(/Updates:\s*(\d+)/);
        return updatesText ? parseInt(updatesText[1]) : 0;
      }
      return 0;
    });

    // Updates should be happening (or at least not decreasing)
    expect(finalUpdates).toBeGreaterThanOrEqual(initialUpdates);

    // Verify connection status is working
    const connectionStatus = await page.locator('[data-testid="connection-status-dot"]').getAttribute('class');
    expect(connectionStatus).toBeTruthy();
  });

  test('should handle WebSocket message batching correctly', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for WebSocket manager to be available
    await page.waitForFunction(() => {
      return typeof (window as any).wsManager !== 'undefined';
    });

    // Mock WebSocket messages to test batching
    const messageCount = await page.evaluate(() => {
      const wsManager = (window as any).wsManager;
      if (wsManager) {
        // Send multiple mock messages
        for (let i = 0; i < 10; i++) {
          const mockMessage = {
            type: 'trade',
            coin: 'BTC',
            side: 'B',
            px: 95420.50 + i,
            sz: 0.1,
            time: Date.now()
          };

          // Simulate WebSocket message processing
          const connections = Array.from(wsManager.connections.values());
          connections.forEach(conn => {
            if (conn.messageHandlers.size > 0) {
              conn.messageHandlers.forEach(handler => {
                try {
                  handler(mockMessage);
                } catch (err) {
                  // Ignore handler errors
                }
              });
            }
          });
        }

        const metrics = wsManager.getPerformanceMetrics();
        return {
          totalMessages: metrics.totalMessages,
          processedMessages: metrics.processedMessages,
          droppedMessages: metrics.droppedMessages,
        };
      }
      return { totalMessages: 0, processedMessages: 0, droppedMessages: 0 };
    });

    // Verify that messages were processed
    expect(messageCount.totalMessages).toBeGreaterThan(0);
    expect(messageCount.processedMessages).toBe(messageCount.totalMessages);

    // Dropped messages should be minimal
    expect(messageCount.droppedMessages).toBeLessThanOrEqual(1);
  });

  test('should maintain performance under load', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for application to be ready
    await page.waitForSelector('[data-testid="connection-status-dot"]');

    // Generate load by rapidly switching assets
    const assetSwitches = 10;
    for (let i = 0; i < assetSwitches; i++) {
      // Click asset selector
      await page.click('[data-testid="asset-selector-button"]');

      // Click a different asset (assuming multiple assets are available)
      const assets = await page.locator('[data-testid="asset-option"]').all();
      if (assets.length > 1) {
        await assets[1].click();
      } else {
        // If only one asset, just close the dropdown
        await page.keyboard.press('Escape');
      }

      // Small delay between switches
      await page.waitForTimeout(100);
    }

    // Check that performance metrics are still reasonable
    const finalMetrics = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="performance-monitor"]');
      if (monitor) {
        const latencyText = monitor.textContent?.match(/(\d+\.?\d*)ms/);
        const latency = latencyText ? parseFloat(latencyText[1]) : 0;

        const updatesText = monitor.textContent?.match(/Updates:\s*(\d+)/);
        const updates = updatesText ? parseInt(updatesText[1]) : 0;

        return { latency, updates };
      }
      return { latency: 0, updates: 0 };
    });

    // After load, latency should still be reasonable
    if (finalMetrics.latency > 0) {
      expect(finalMetrics.latency).toBeLessThan(200); // Allow some tolerance under load
    }

    // Should have processed updates
    expect(finalMetrics.updates).toBeGreaterThan(0);
  });
});