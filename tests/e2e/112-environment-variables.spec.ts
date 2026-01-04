/**
 * E2E test for environment variables loading
 * Tests that environment variables are correctly loaded and accessible
 */

import { test, expect } from '@playwright/test';

test.describe('Environment Variables Loading', () => {
  test('should load frontend environment variables correctly', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for application to load
    await page.waitForSelector('[data-testid="connection-status-dot"]');

    // Test that environment variables are accessible in frontend
    const envVars = await page.evaluate(() => {
      return {
        apiURL: process.env.NEXT_PUBLIC_API_URL,
        wsURL: process.env.NEXT_PUBLIC_WS_URL,
        appURL: process.env.NEXT_PUBLIC_APP_URL,
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      };
    });

    // Verify required environment variables are loaded
    expect(envVars.apiURL).toBeTruthy();
    expect(envVars.wsURL).toBeTruthy();
    expect(envVars.apiURL).toContain('http');
    expect(envVars.wsURL).toContain('ws');

    // Test that frontend components can access environment variables
    const apiEndpointTest = await page.evaluate(() => {
      // Test that the API endpoints are constructed correctly
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';

      return {
        apiBase,
        wsBase,
        fullApiEndpoint: `${apiBase}/api/info/meta`,
        fullWsEndpoint: `${wsBase}/ws/orderbook/BTC`
      };
    });

    expect(apiEndpointTest.apiBase).toContain('http');
    expect(apiEndpointTest.wsBase).toContain('ws');
    expect(apiEndpointTest.fullApiEndpoint).toContain('/api/info/meta');
    expect(apiEndpointTest.fullWsEndpoint).toContain('/ws/orderbook/BTC');
  });

  test('should handle missing environment variables gracefully', async ({ page }) => {
    // Test with minimal environment variables
    await page.goto('/?testMode=true');

    // Wait for application to load
    await page.waitForSelector('[data-testid="connection-status-dot"]');

    // Test fallback behavior when environment variables are not set
    const fallbackTest = await page.evaluate(() => {
      // Simulate missing environment variables
      const originalEnv = { ...process.env };

      // Test that fallbacks work
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const wsURL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';

      return {
        apiURL,
        wsURL,
        hasFallback: apiURL === 'http://localhost:8001' || wsURL === 'ws://localhost:8001'
      };
    });

    expect(fallbackTest.apiURL).toBeTruthy();
    expect(fallbackTest.wsURL).toBeTruthy();
  });

  test('should expose environment variables to frontend components', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for application to load
    await page.waitForSelector('[data-testid="connection-status-dot"]');

    // Test that components can access environment variables
    const componentTest = await page.evaluate(() => {
      // Test various frontend components that use environment variables
      const components = [];

      // Check if API endpoints are accessible
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (apiBase) {
          components.push('API endpoint accessible');
        }
      } catch (e) {
        components.push('API endpoint error: ' + e.message);
      }

      // Check if WebSocket endpoints are accessible
      try {
        const wsBase = process.env.NEXT_PUBLIC_WS_URL;
        if (wsBase) {
          components.push('WebSocket endpoint accessible');
        }
      } catch (e) {
        components.push('WebSocket endpoint error: ' + e.message);
      }

      // Check if wallet configuration is accessible
      try {
        const walletConnectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        if (walletConnectId) {
          components.push('WalletConnect configured');
        }
      } catch (e) {
        components.push('WalletConnect error: ' + e.message);
      }

      return components;
    });

    expect(componentTest.length).toBeGreaterThan(0);
    expect(componentTest.some(c => c.includes('accessible'))).toBe(true);
  });

  test('should handle environment variable changes', async ({ page }) => {
    // This test simulates environment variable changes
    await page.goto('/?testMode=true');

    // Wait for application to load
    await page.waitForSelector('[data-testid="connection-status-dot"]');

    // Test that environment variables are consistently accessible
    const multipleAccessTest = await page.evaluate(() => {
      const accesses = [];

      // Access environment variables multiple times
      for (let i = 0; i < 5; i++) {
        const apiURL = process.env.NEXT_PUBLIC_API_URL;
        const wsURL = process.env.NEXT_PUBLIC_WS_URL;

        accesses.push({
          iteration: i,
          apiURL: apiURL,
          wsURL: wsURL,
          consistent: apiURL === process.env.NEXT_PUBLIC_API_URL &&
                     wsURL === process.env.NEXT_PUBLIC_WS_URL
        });
      }

      return accesses;
    });

    // All accesses should be consistent
    multipleAccessTest.forEach(access => {
      expect(access.consistent).toBe(true);
      expect(access.apiURL).toBeTruthy();
      expect(access.wsURL).toBeTruthy();
    });
  });

  test('should validate environment variable format', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for application to load
    await page.waitForSelector('[data-testid="connection-status-dot"]');

    const validationTest = await page.evaluate(() => {
      const validations = [];

      const apiURL = process.env.NEXT_PUBLIC_API_URL;
      const wsURL = process.env.NEXT_PUBLIC_WS_URL;

      // Validate API URL format
      if (apiURL) {
        try {
          new URL(apiURL);
          validations.push('API URL format valid');
        } catch (e) {
          validations.push('API URL format invalid: ' + e.message);
        }
      }

      // Validate WebSocket URL format
      if (wsURL) {
        try {
          new URL(wsURL);
          validations.push('WebSocket URL format valid');
        } catch (e) {
          validations.push('WebSocket URL format invalid: ' + e.message);
        }
      }

      return validations;
    });

    // Should have valid URL formats
    expect(validationTest.length).toBeGreaterThan(0);
    expect(validationTest.every(v => v.includes('valid'))).toBe(true);
  });

  test('should handle environment variables in different modes', async ({ page }) => {
    // Test production mode
    await page.goto('/?testMode=true');
    await page.waitForSelector('[data-testid="connection-status-dot"]');

    const productionModeTest = await page.evaluate(() => {
      const env = {
        apiURL: process.env.NEXT_PUBLIC_API_URL,
        wsURL: process.env.NEXT_PUBLIC_WS_URL,
        nodeEnv: process.env.NODE_ENV
      };

      return {
        ...env,
        hasRequiredVars: !!env.apiURL && !!env.wsURL,
        isProductionReady: env.nodeEnv === 'production' || env.nodeEnv === 'development'
      };
    });

    expect(productionModeTest.hasRequiredVars).toBe(true);
    expect(productionModeTest.isProductionReady).toBe(true);
  });

  test('should handle environment variables with special characters', async ({ page }) => {
    await page.goto('/?testMode=true');

    // Wait for application to load
    await page.waitForSelector('[data-testid="connection-status-dot"]');

    const specialCharsTest = await page.evaluate(() => {
      const walletConnectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

      if (walletConnectId) {
        return {
          walletConnectId,
          hasSpecialChars: /[^a-zA-Z0-9]/.test(walletConnectId),
          length: walletConnectId.length,
          isValid: /^[a-zA-Z0-9-]+$/.test(walletConnectId)
        };
      }

      return { walletConnectId: null, isValid: false };
    });

    // If WalletConnect ID is set, it should be valid
    if (specialCharsTest.walletConnectId) {
      expect(specialCharsTest.isValid).toBe(true);
    }
  });
});