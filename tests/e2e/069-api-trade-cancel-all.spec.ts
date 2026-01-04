/**
 * E2E Test: Feature 69 - API POST /api/trade/cancel-all cancels all orders
 *
 * This test verifies that the cancel-all endpoint correctly handles
 * canceling all orders or orders for a specific coin.
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';

test.describe('Feature 69: API POST /api/trade/cancel-all', () => {
  test('Step 1: Cancel all orders without coin filter', async ({ request }) => {
    const payload = {
      signature: '0x123abc',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel-all`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 2: Verify response indicates all orders canceled', async ({ request }) => {
    const payload = {
      signature: '0x456def',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel-all`, {
      data: payload
    });

    const data = await response.json();
    expect(data.message).toContain('All orders');
    expect(data.message).toContain('canceled');
  });

  test('Step 3: Cancel all orders for specific coin (BTC)', async ({ request }) => {
    const payload = {
      coin: 'BTC',
      signature: '0x789abc',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel-all`, {
      data: payload
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 4: Verify coin-specific message', async ({ request }) => {
    const payload = {
      coin: 'ETH',
      signature: '0xdef012',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel-all`, {
      data: payload
    });

    const data = await response.json();
    expect(data.message).toContain('for ETH');
  });

  test('Step 5: Response time is acceptable (< 500ms)', async ({ request }) => {
    const payload = {
      signature: '0x345678',
      timestamp: Date.now()
    };

    const start = Date.now();
    const response = await request.post(`${API_URL}/api/trade/cancel-all`, {
      data: payload
    });
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('Step 6: Response headers include correct content-type', async ({ request }) => {
    const payload = {
      signature: '0x9abcde',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel-all`, {
      data: payload
    });

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('Step 7: Response includes success field', async ({ request }) => {
    const payload = {
      signature: '0xfedcba',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel-all`, {
      data: payload
    });

    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(typeof data.success).toBe('boolean');
  });

  test('Step 8: Response includes message field', async ({ request }) => {
    const payload = {
      signature: '0x987654',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel-all`, {
      data: payload
    });

    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(typeof data.message).toBe('string');
  });
});
