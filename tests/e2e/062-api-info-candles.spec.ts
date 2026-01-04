/**
 * E2E Test: Feature 62 - API GET /api/info/candles/:coin returns OHLCV data
 *
 * This test verifies that the API endpoint correctly returns OHLCV candlestick data
 * for charting for a specific trading asset/coin.
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';

test.describe('Feature 62: API GET /api/info/candles/:coin', () => {
  test('Step 1: GET request to /api/info/candles/BTC returns 200', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC`);
    expect(response.status()).toBe(200);
  });

  test('Step 2: Response contains array of candles', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC`);
    const data = await response.json();

    // Verify response is an array
    expect(Array.isArray(data)).toBe(true);

    // Verify array is not empty
    expect(data.length).toBeGreaterThan(0);

    // Verify first item structure
    expect(data[0]).toHaveProperty('t'); // timestamp
    expect(data[0]).toHaveProperty('o'); // open
    expect(data[0]).toHaveProperty('h'); // high
    expect(data[0]).toHaveProperty('l'); // low
    expect(data[0]).toHaveProperty('c'); // close
    expect(data[0]).toHaveProperty('v'); // volume
  });

  test('Step 3: Response contains correct data types', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC`);
    const data = await response.json();

    // Verify data types for first item
    expect(typeof data[0].t).toBe('number');
    expect(typeof data[0].o).toBe('number');
    expect(typeof data[0].h).toBe('number');
    expect(typeof data[0].l).toBe('number');
    expect(typeof data[0].c).toBe('number');
    expect(typeof data[0].v).toBe('number');
  });

  test('Step 4: Default interval parameter works (1h)', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC`);
    const data = await response.json();

    // Default should return candles
    expect(data.length).toBeGreaterThan(0);
  });

  test('Step 5: Custom interval parameter works correctly', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC?interval=5m`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('Step 6: Custom limit parameter works correctly', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC?limit=50`);
    const data = await response.json();

    expect(data.length).toBeLessThanOrEqual(50);
    expect(data.length).toBeGreaterThan(0);
  });

  test('Step 7: Candles are sorted by timestamp descending', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC?limit=10`);
    const data = await response.json();

    // Verify timestamps are in descending order (newest first)
    for (let i = 0; i < data.length - 1; i++) {
      expect(data[i].t).toBeGreaterThanOrEqual(data[i + 1].t);
    }
  });

  test('Step 8: OHLCV values are realistic', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC?limit=10`);
    const data = await response.json();

    for (const candle of data) {
      // High should be >= Open, Close, Low
      expect(candle.h).toBeGreaterThanOrEqual(candle.o);
      expect(candle.h).toBeGreaterThanOrEqual(candle.c);
      expect(candle.h).toBeGreaterThanOrEqual(candle.l);

      // Low should be <= Open, Close, High
      expect(candle.l).toBeLessThanOrEqual(candle.o);
      expect(candle.l).toBeLessThanOrEqual(candle.c);
      expect(candle.l).toBeLessThanOrEqual(candle.h);

      // Volume should be positive
      expect(candle.v).toBeGreaterThan(0);

      // Timestamp should be reasonable (milliseconds since epoch)
      expect(candle.t).toBeGreaterThan(1000000000000); // After 2001
      expect(candle.t).toBeLessThan(10000000000000); // Before 2286
    }
  });

  test('Step 9: ETH coin returns valid candle data', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/ETH`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // ETH price should be much lower than BTC
    expect(data[0].c).toBeLessThan(10000); // ETH < $10k
  });

  test('Step 10: Case insensitive coin parameter', async ({ request }) => {
    // Test lowercase
    const response1 = await request.get(`${API_URL}/api/info/candles/btc`);
    expect(response1.status()).toBe(200);
    const data1 = await response1.json();
    expect(Array.isArray(data1)).toBe(true);

    // Test mixed case
    const response2 = await request.get(`${API_URL}/api/info/candles/BtC`);
    expect(response2.status()).toBe(200);
    const data2 = await response2.json();
    expect(Array.isArray(data2)).toBe(true);
  });

  test('Step 11: Response headers include correct content-type', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC`);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('Step 12: Response time is acceptable (< 500ms)', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_URL}/api/info/candles/BTC`);
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('Step 13: Multiple timeframes are supported', async ({ request }) => {
    const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];

    for (const interval of intervals) {
      const response = await request.get(`${API_URL}/api/info/candles/BTC?interval=${interval}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    }
  });

  test('Step 14: Large limit parameter is capped at 500', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/info/candles/BTC?limit=1000`);
    const data = await response.json();

    // Should return max 500 candles even if limit is higher
    expect(data.length).toBeLessThanOrEqual(500);
  });

  test('Step 15: Candle timestamps are evenly spaced based on interval', async ({ request }) => {
    // Test 1h interval
    const response = await request.get(`${API_URL}/api/info/candles/BTC?interval=1h&limit=10`);
    const data = await response.json();

    if (data.length >= 2) {
      // Check that timestamps are approximately 1 hour (3600000 ms) apart
      const interval = data[0].t - data[1].t;
      expect(interval).toBeGreaterThanOrEqual(3500000); // ~58 minutes minimum
      expect(interval).toBeLessThanOrEqual(3700000); // ~62 minutes maximum
    }
  });
});
