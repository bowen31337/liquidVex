/**
 * E2E test for memory stability during extended use
 * Tests that memory usage remains stable during extended application use
 */

import { test, expect } from '@playwright/test';

test.describe('Memory Stability', () => {
  test('should maintain stable memory usage during extended use', async ({ page }) => {
    // Enable memory monitoring in test mode
    await page.goto('/?testMode=true&memoryMonitor=true');

    // Wait for memory monitor to be available
    await page.waitForSelector('[data-testid="memory-monitor"]', { timeout: 10000 });

    // Get baseline memory metrics
    const baselineMetrics = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="memory-monitor"]');
      if (monitor) {
        // Wait for metrics to be available
        return new Promise((resolve) => {
          setTimeout(() => {
            const stats = (window as any).getMemoryStats?.();
            resolve(stats || null);
          }, 2000);
        });
      }
      return null;
    });

    // Perform extended operations to simulate real usage
    const operations = 20;

    for (let i = 0; i < operations; i++) {
      // Rapid asset switching
      await page.click('[data-testid="asset-selector-button"]');
      const assets = await page.locator('[data-testid="asset-option"]').all();
      if (assets.length > 1) {
        await assets[1].click();
      } else {
        await page.keyboard.press('Escape');
      }

      // Rapid order form interactions
      const priceInput = page.locator('[data-testid="order-price-input"]');
      if (await priceInput.isVisible()) {
        await priceInput.fill((95000 + i).toString());
        await page.keyboard.press('Tab');
      }

      const sizeInput = page.locator('[data-testid="order-size-input"]');
      if (await sizeInput.isVisible()) {
        await sizeInput.fill((0.1 + i * 0.01).toString());
        await page.keyboard.press('Tab');
      }

      // Resize window to test layout changes
      if (i % 5 === 0) {
        await page.setViewportSize({
          width: 1200 + (i * 10),
          height: 800 + (i * 10)
        });
      }

      // Small delay between operations
      await page.waitForTimeout(100);
    }

    // Get final memory metrics
    const finalMetrics = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="memory-monitor"]');
      if (monitor) {
        return new Promise((resolve) => {
          setTimeout(() => {
            const stats = (window as any).getMemoryStats?.();
            resolve(stats || null);
          }, 2000);
        });
      }
      return null;
    });

    // Memory should not have grown excessively
    if (baselineMetrics && finalMetrics) {
      const baselineGrowth = parseFloat(baselineMetrics.growthMB);
      const finalGrowth = parseFloat(finalMetrics.growthMB);

      // Allow some growth but not excessive (max 100MB)
      const growthDifference = finalGrowth - baselineGrowth;
      expect(growthDifference).toBeLessThan(100);

      // Growth rate should be minimal
      const finalGrowthRate = parseFloat(finalMetrics.growthRateMBps);
      expect(finalGrowthRate).toBeLessThan(5); // Less than 5MB/s growth rate
    }

    // Check for memory leak warnings
    const memoryWarnings = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="memory-monitor"]');
      if (monitor) {
        const warningCount = monitor.textContent?.match(/Memory Warnings/g);
        return warningCount ? warningCount.length : 0;
      }
      return 0;
    });

    // Should not have excessive memory warnings
    expect(memoryWarnings).toBeLessThan(5);
  });

  test('should handle WebSocket message processing without memory leaks', async ({ page }) => {
    await page.goto('/?testMode=true&memoryMonitor=true');

    // Wait for WebSocket manager to be available
    await page.waitForFunction(() => {
      return typeof (window as any).wsManager !== 'undefined';
    });

    // Simulate heavy WebSocket message processing
    const messageCount = 1000;
    const startTime = Date.now();

    await page.evaluate((count) => {
      const wsManager = (window as any).wsManager;
      if (wsManager) {
        // Send many mock messages to test memory handling
        for (let i = 0; i < count; i++) {
          const mockMessage = {
            type: 'trade',
            coin: 'BTC',
            side: i % 2 === 0 ? 'B' : 'A',
            px: 95000 + Math.random() * 1000,
            sz: 0.1 + Math.random() * 0.9,
            time: Date.now()
          };

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
      }
    }, messageCount);

    const processingTime = Date.now() - startTime;

    // Processing should complete in reasonable time
    expect(processingTime).toBeLessThan(5000); // Less than 5 seconds

    // Get memory metrics after processing
    const finalMetrics = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="memory-monitor"]');
      if (monitor) {
        return new Promise((resolve) => {
          setTimeout(() => {
            const stats = (window as any).getMemoryStats?.();
            resolve(stats || null);
          }, 2000);
        });
      }
      return null;
    });

    // Memory should not have grown excessively from processing
    if (finalMetrics) {
      const finalGrowth = parseFloat(finalMetrics.growthMB);
      expect(finalGrowth).toBeLessThan(50); // Less than 50MB growth
    }

    // Check resource count
    const resourceCount = await page.evaluate(() => {
      return (window as any).memoryLeakDetector?.getResourceCount() || 0;
    });

    // Should not have excessive tracked resources
    expect(resourceCount).toBeLessThan(50);
  });

  test('should handle rapid state updates without memory leaks', async ({ page }) => {
    await page.goto('/?testMode=true&memoryMonitor=true');

    // Wait for memory monitor
    await page.waitForSelector('[data-testid="memory-monitor"]');

    // Rapidly update market data to test state management
    const updates = 100;

    await page.evaluate((count) => {
      const marketStore = (window as any).marketStore;
      if (marketStore) {
        for (let i = 0; i < count; i++) {
          // Simulate rapid order book updates
          const mockOrderBook = {
            coin: 'BTC',
            bids: Array.from({ length: 10 }, (_, idx) => ({
              px: 95000 - idx * 10,
              sz: Math.random() * 10,
              n: Math.floor(Math.random() * 100)
            })),
            asks: Array.from({ length: 10 }, (_, idx) => ({
              px: 95000 + idx * 10,
              sz: Math.random() * 10,
              n: Math.floor(Math.random() * 100)
            })),
            timestamp: Date.now()
          };

          try {
            marketStore.updateOrderBook(mockOrderBook);
          } catch (err) {
            // Ignore update errors
          }
        }
      }
    }, updates);

    // Get final memory state
    const finalMetrics = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="memory-monitor"]');
      if (monitor) {
        return new Promise((resolve) => {
          setTimeout(() => {
            const stats = (window as any).getMemoryStats?.();
            resolve(stats || null);
          }, 2000);
        });
      }
      return null;
    });

    // Memory should remain stable after state updates
    if (finalMetrics) {
      const finalUsage = parseFloat(finalMetrics.currentUsageMB);
      const growthRate = parseFloat(finalMetrics.growthRateMBps);

      // Usage should be reasonable
      expect(finalUsage).toBeLessThan(500); // Less than 500MB
      // Growth rate should be minimal
      expect(growthRate).toBeLessThan(1); // Less than 1MB/s
    }
  });

  test('should detect and report memory leaks', async ({ page }) => {
    await page.goto('/?testMode=true&memoryMonitor=true');

    // Wait for memory monitor
    await page.waitForSelector('[data-testid="memory-monitor"]');

    // Simulate potential memory leak scenario
    await page.evaluate(() => {
      // Create many unclosed WebSocket connections
      const connections = [];
      for (let i = 0; i < 20; i++) {
        const ws = new WebSocket('ws://localhost:12345'); // Invalid URL to simulate failed connections
        connections.push(ws);

        // Don't close them to simulate leak
        ws.onopen = () => console.log('Connection opened');
        ws.onerror = () => console.log('Connection error');
      }

      // Store references to prevent garbage collection
      (window as any).leakedConnections = connections;
    });

    // Wait for leak detection
    await page.waitForTimeout(5000);

    // Check for leak detection
    const hasLeakDetection = await page.evaluate(() => {
      const monitor = document.querySelector('[data-testid="memory-monitor"]');
      if (monitor) {
        const hasWarning = monitor.textContent?.includes('Potential Memory Leak');
        const hasResourceCount = monitor.textContent?.includes('resources');
        return hasWarning || hasResourceCount;
      }
      return false;
    });

    // Should detect potential issues
    expect(hasLeakDetection).toBe(true);
  });
});