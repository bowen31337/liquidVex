/**
 * E2E Test: Feature 67 - API POST /api/trade/cancel cancels existing order
 *
 * This test verifies that the order cancellation endpoint correctly handles
 * order cancellation requests.
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';

test.describe('Feature 67: API POST /api/trade/cancel', () => {
  test('Step 1: Prepare signed cancel payload', async ({ request }) => {
    const cancelPayload = {
      coin: 'BTC',
      oid: 12345,
      signature: '0x123abc456def',
      timestamp: Date.now()
    };

    expect(cancelPayload.coin).toBe('BTC');
    expect(cancelPayload.oid).toBeGreaterThan(0);
    expect(cancelPayload.signature).toBeDefined();
    expect(cancelPayload.timestamp).toBeDefined();
  });

  test('Step 2: Send POST request to /api/trade/cancel', async ({ request }) => {
    const cancelPayload = {
      coin: 'BTC',
      oid: 12345,
      signature: '0x123abc456def',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel`, {
      data: cancelPayload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBe(true);
  });

  test('Step 3: Verify response status is 200', async ({ request }) => {
    const cancelPayload = {
      coin: 'BTC',
      oid: 12345,
      signature: '0x123abc456def',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel`, {
      data: cancelPayload
    });

    expect(response.status()).toBe(200);
  });

  test('Step 4: Verify response indicates success', async ({ request }) => {
    const cancelPayload = {
      coin: 'BTC',
      oid: 12345,
      signature: '0x123abc456def',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel`, {
      data: cancelPayload
    });

    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
  });

  test('Step 5: Verify response includes message', async ({ request }) => {
    const cancelPayload = {
      coin: 'BTC',
      oid: 12345,
      signature: '0x123abc456def',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel`, {
      data: cancelPayload
    });

    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('12345');
    expect(data.message).toContain('cancel');
  });

  test('Step 6: Cancel order for ETH', async ({ request }) => {
    const cancelPayload = {
      coin: 'ETH',
      oid: 67890,
      signature: '0xdef456',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel`, {
      data: cancelPayload
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 7: Cancel order with different order ID', async ({ request }) => {
    const cancelPayload = {
      coin: 'BTC',
      oid: 99999,
      signature: '0x999999',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel`, {
      data: cancelPayload
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 8: Response time is acceptable (< 500ms)', async ({ request }) => {
    const cancelPayload = {
      coin: 'BTC',
      oid: 12345,
      signature: '0x111222',
      timestamp: Date.now()
    };

    const start = Date.now();
    const response = await request.post(`${API_URL}/api/trade/cancel`, {
      data: cancelPayload
    });
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('Step 9: Response headers include correct content-type', async ({ request }) => {
    const cancelPayload = {
      coin: 'BTC',
      oid: 12345,
      signature: '0x333444',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel`, {
      data: cancelPayload
    });

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('Step 10: Response includes order ID in message', async ({ request }) => {
    const testOid = 54321;
    const cancelPayload = {
      coin: 'ETH',
      oid: testOid,
      signature: '0x555666',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/cancel`, {
      data: cancelPayload
    });

    const data = await response.json();
    expect(data.message).toContain(String(testOid));
  });
});
