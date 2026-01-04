/**
 * E2E Test: Feature 132 - API GET /api/info/asset/:coin returns single asset info
 *
 * This test verifies that the API endpoint correctly returns detailed information
 * for a specific trading asset/coin.
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';

test.describe('Feature 132: API GET /api/info/asset/:coin', () => {
  test('Step 1: GET request to /api/info/asset/BTC returns 200', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/asset/BTC`);
    expect(response.status()).toBe(200);
  });

  test('Step 2: Response contains all required asset fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/asset/BTC`);
    const data = await response.json();

    // Verify all required fields are present
    expect(data).toHaveProperty('coin', 'BTC');
    expect(data).toHaveProperty('sz_decimals');
    expect(data).toHaveProperty('px_decimals');
    expect(data).toHaveProperty('min_sz');
    expect(data).toHaveProperty('max_leverage');
    expect(data).toHaveProperty('funding_rate');
    expect(data).toHaveProperty('open_interest');
    expect(data).toHaveProperty('volume_24h');
    expect(data).toHaveProperty('price_change_24h');
  });

  test('Step 3: Response contains correct data types', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/asset/BTC`);
    const data = await response.json();

    // Verify data types
    expect(typeof data.coin).toBe('string');
    expect(typeof data.sz_decimals).toBe('number');
    expect(typeof data.px_decimals).toBe('number');
    expect(typeof data.min_sz).toBe('number');
    expect(typeof data.max_leverage).toBe('number');
    expect(typeof data.funding_rate).toBe('number');
    expect(typeof data.open_interest).toBe('number');
    expect(typeof data.volume_24h).toBe('number');
    expect(typeof data.price_change_24h).toBe('number');
  });

  test('Step 4: ETH asset returns correct information', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/asset/ETH`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.coin).toBe('ETH');
    expect(data.sz_decimals).toBe(3);
    expect(data.px_decimals).toBe(2);
    expect(data.min_sz).toBe(0.01);
    expect(data.max_leverage).toBe(50);
  });

  test('Step 5: Invalid coin returns 404 error', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/asset/INVALID`);
    expect(response.status()).toBe(404);
  });

  test('Step 6: Case insensitive coin parameter', async ({ request }) => {
    // Test lowercase
    const response1 = await request.get(`${API_URL}/api/info/asset/btc`);
    expect(response1.status()).toBe(200);
    const data1 = await response1.json();
    expect(data1.coin).toBe('BTC');

    // Test mixed case
    const response2 = await request.get(`${API_URL}/api/info/asset/BtC`);
    expect(response2.status()).toBe(200);
    const data2 = await response2.json();
    expect(data2.coin).toBe('BTC');
  });

  test('Step 7: Response format matches expected schema', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/asset/BTC`);
    const data = await response.json();

    // Verify numeric values are reasonable
    expect(data.sz_decimals).toBeGreaterThanOrEqual(0);
    expect(data.px_decimals).toBeGreaterThanOrEqual(0);
    expect(data.min_sz).toBeGreaterThan(0);
    expect(data.max_leverage).toBeGreaterThan(0);
    expect(data.max_leverage).toBeLessThanOrEqual(100); // Reasonable max
  });

  test('Step 8: All supported assets return valid data', async ({ request }) => {
    const assets = ['BTC', 'ETH'];

    for (const asset of assets) {
      const response = await request.get(`${API_URL}/api/info/asset/${asset}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.coin).toBe(asset);
      expect(data.sz_decimals).toBeDefined();
      expect(data.px_decimals).toBeDefined();
      expect(data.min_sz).toBeDefined();
    }
  });

  test('Step 9: Response headers include correct content-type', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/asset/BTC`);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('Step 10: Response time is acceptable (< 500ms)', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_URL}/api/info/asset/BTC`);
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(500);
  });
});
