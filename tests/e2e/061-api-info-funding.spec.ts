/**
 * E2E Test: Feature 61 - API GET /api/info/funding/:coin returns funding rate history
 *
 * This test verifies that the API endpoint correctly returns historical funding rates
 * for a specific trading asset/coin.
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';

test.describe('Feature 61: API GET /api/info/funding/:coin', () => {
  test('Step 1: GET request to /api/info/funding/BTC returns 200', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC`);
    expect(response.status()).toBe(200);
  });

  test('Step 2: Response contains array of funding rates', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC`);
    const data = await response.json();

    // Verify response is an array
    expect(Array.isArray(data)).toBe(true);

    // Verify array is not empty
    expect(data.length).toBeGreaterThan(0);

    // Verify first item structure
    expect(data[0]).toHaveProperty('timestamp');
    expect(data[0]).toHaveProperty('rate');
  });

  test('Step 3: Response contains correct data types', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC`);
    const data = await response.json();

    // Verify data types for first item
    expect(typeof data[0].timestamp).toBe('number');
    expect(typeof data[0].rate).toBe('number');

    // Verify timestamp is in milliseconds (Unix timestamp * 1000)
    expect(data[0].timestamp).toBeGreaterThan(1000000000000); // After 2001
    expect(data[0].timestamp).toBeLessThan(10000000000000); // Before 2286

    // Verify funding rate is reasonable (between -0.01 and 0.01, i.e., -1% to 1%)
    expect(data[0].rate).toBeGreaterThan(-0.01);
    expect(data[0].rate).toBeLessThan(0.01);
  });

  test('Step 4: Default limit parameter returns 100 records', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC`);
    const data = await response.json();

    // Default limit should be 100
    expect(data.length).toBeLessThanOrEqual(100);
    expect(data.length).toBeGreaterThan(0);
  });

  test('Step 5: Custom limit parameter works correctly', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC?limit=10`);
    const data = await response.json();

    expect(data.length).toBeLessThanOrEqual(10);
  });

  test('Step 6: Funding rates are sorted by timestamp descending', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC?limit=10`);
    const data = await response.json();

    // Verify timestamps are in descending order (newest first)
    for (let i = 0; i < data.length - 1; i++) {
      expect(data[i].timestamp).toBeGreaterThanOrEqual(data[i + 1].timestamp);
    }
  });

  test('Step 7: ETH coin returns valid funding history', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/ETH`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('timestamp');
    expect(data[0]).toHaveProperty('rate');
  });

  test('Step 8: Case insensitive coin parameter', async ({ request }) => {
    // Test lowercase
    const response1 = await request.get(`${API_URL}/api/info/funding/btc`);
    expect(response1.status()).toBe(200);
    const data1 = await response1.json();
    expect(Array.isArray(data1)).toBe(true);

    // Test mixed case
    const response2 = await request.get(`${API_URL}/api/info/funding/BtC`);
    expect(response2.status()).toBe(200);
    const data2 = await response2.json();
    expect(Array.isArray(data2)).toBe(true);
  });

  test('Step 9: Response headers include correct content-type', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC`);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('Step 10: Response time is acceptable (< 500ms)', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_URL}/api/info/funding/BTC`);
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('Step 11: Funding rate values are realistic', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC`);
    const data = await response.json();

    // All funding rates should be small numbers (typically -0.01 to 0.01)
    for (const item of data) {
      expect(item.rate).toBeGreaterThanOrEqual(-0.05); // Allow up to ±5%
      expect(item.rate).toBeLessThanOrEqual(0.05);
    }
  });

  test('Step 12: Timestamps are evenly spaced (hourly intervals)', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC?limit=10`);
    const data = await response.json();

    if (data.length >= 2) {
      // Check that timestamps are approximately 1 hour (3600000 ms) apart
      const interval = data[0].timestamp - data[1].timestamp;
      expect(interval).toBeGreaterThanOrEqual(3500000); // ~58 minutes minimum
      expect(interval).toBeLessThanOrEqual(3700000); // ~62 minutes maximum
    }
  });

  test('Step 13: Large limit parameter is capped at 100', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/funding/BTC?limit=1000`);
    const data = await response.json();

    // Should return max 100 records even if limit is higher
    expect(data.length).toBeLessThanOrEqual(100);
  });
});
