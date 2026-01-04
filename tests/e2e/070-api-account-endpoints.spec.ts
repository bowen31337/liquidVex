/**
 * E2E Test: Feature 70 - API GET /api/account endpoints
 *
 * This test verifies that all account-related endpoints work correctly:
 * - /api/account/state/{address}
 * - /api/account/positions/{address}
 * - /api/account/orders/{address}
 * - /api/account/history/{address}
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';
const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';

test.describe('Feature 70: API GET /api/account endpoints', () => {
  test('Step 1: GET /api/account/state/{address} returns 200', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/state/${TEST_ADDRESS}`);
    expect(response.status()).toBe(200);
  });

  test('Step 2: Account state contains required fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/state/${TEST_ADDRESS}`);
    const data = await response.json();

    expect(data).toHaveProperty('equity');
    expect(data).toHaveProperty('margin_used');
    expect(data).toHaveProperty('available_balance');
    expect(data).toHaveProperty('withdrawable');
    expect(data).toHaveProperty('cross_margin_summary');
  });

  test('Step 3: Account state has correct data types', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/state/${TEST_ADDRESS}`);
    const data = await response.json();

    expect(typeof data.equity).toBe('number');
    expect(typeof data.margin_used).toBe('number');
    expect(typeof data.available_balance).toBe('number');
    expect(typeof data.withdrawable).toBe('number');
    expect(typeof data.cross_margin_summary).toBe('object');
  });

  test('Step 4: GET /api/account/positions/{address} returns 200', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/positions/${TEST_ADDRESS}`);
    expect(response.status()).toBe(200);
  });

  test('Step 5: Positions response is an array', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/positions/${TEST_ADDRESS}`);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
  });

  test('Step 6: Position objects have required fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/positions/${TEST_ADDRESS}`);
    const data = await response.json();

    if (data.length > 0) {
      const position = data[0];
      expect(position).toHaveProperty('coin');
      expect(position).toHaveProperty('side');
      expect(position).toHaveProperty('entry_px');
      expect(position).toHaveProperty('sz');
      expect(position).toHaveProperty('leverage');
      expect(position).toHaveProperty('margin_used');
      expect(position).toHaveProperty('unrealized_pnl');
      expect(position).toHaveProperty('realized_pnl');
      expect(position).toHaveProperty('liquidation_px');
      expect(position).toHaveProperty('margin_type');
    }
  });

  test('Step 7: GET /api/account/orders/{address} returns 200', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/orders/${TEST_ADDRESS}`);
    expect(response.status()).toBe(200);
  });

  test('Step 8: Orders response is an array', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/orders/${TEST_ADDRESS}`);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
  });

  test('Step 9: Order objects have required fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/orders/${TEST_ADDRESS}`);
    const data = await response.json();

    if (data.length > 0) {
      const order = data[0];
      expect(order).toHaveProperty('oid');
      expect(order).toHaveProperty('coin');
      expect(order).toHaveProperty('side');
      expect(order).toHaveProperty('limit_px');
      expect(order).toHaveProperty('sz');
      expect(order).toHaveProperty('orig_sz');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('timestamp');
      expect(order).toHaveProperty('order_type');
      expect(order).toHaveProperty('reduce_only');
      expect(order).toHaveProperty('post_only');
      expect(order).toHaveProperty('tif');
    }
  });

  test('Step 10: GET /api/account/history/{address} returns 200', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/history/${TEST_ADDRESS}`);
    expect(response.status()).toBe(200);
  });

  test('Step 11: History response has orders and trades', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/history/${TEST_ADDRESS}`);
    const data = await response.json();

    expect(data).toHaveProperty('orders');
    expect(data).toHaveProperty('trades');
    expect(Array.isArray(data.orders)).toBe(true);
    expect(Array.isArray(data.trades)).toBe(true);
  });

  test('Step 12: Trade objects have required fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/history/${TEST_ADDRESS}`);
    const data = await response.json();

    if (data.trades.length > 0) {
      const trade = data.trades[0];
      expect(trade).toHaveProperty('coin');
      expect(trade).toHaveProperty('side');
      expect(trade).toHaveProperty('px');
      expect(trade).toHaveProperty('sz');
      expect(trade).toHaveProperty('time');
      expect(trade).toHaveProperty('fee');
      expect(trade).toHaveProperty('hash');
    }
  });

  test('Step 13: Response time is acceptable (< 500ms)', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_URL}/api/account/state/${TEST_ADDRESS}`);
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('Step 14: All endpoints return JSON content-type', async ({ request }) => {
    const endpoints = [
      `${API_URL}/api/account/state/${TEST_ADDRESS}`,
      `${API_URL}/api/account/positions/${TEST_ADDRESS}`,
      `${API_URL}/api/account/orders/${TEST_ADDRESS}`,
      `${API_URL}/api/account/history/${TEST_ADDRESS}`
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    }
  });

  test('Step 15: Account state values are positive', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/account/state/${TEST_ADDRESS}`);
    const data = await response.json();

    expect(data.equity).toBeGreaterThanOrEqual(0);
    expect(data.margin_used).toBeGreaterThanOrEqual(0);
    expect(data.available_balance).toBeGreaterThanOrEqual(0);
    expect(data.withdrawable).toBeGreaterThanOrEqual(0);
  });
});
