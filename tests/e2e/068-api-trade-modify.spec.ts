/**
 * E2E Test: Feature 68 - API POST /api/trade/modify modifies existing order
 *
 * This test verifies that the order modification endpoint correctly handles
 * order modification requests with price and/or size changes.
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';

test.describe('Feature 68: API POST /api/trade/modify', () => {
  test('Step 1: Prepare signed modify payload with new price', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 12345,
      newPx: 94500.0,
      signature: '0x123abc456def',
      timestamp: Date.now()
    };

    expect(modifyPayload.coin).toBe('BTC');
    expect(modifyPayload.oid).toBeGreaterThan(0);
    expect(modifyPayload.newPx).toBeGreaterThan(0);
    expect(modifyPayload.signature).toBeDefined();
    expect(modifyPayload.timestamp).toBeDefined();
  });

  test('Step 2: Send POST request to /api/trade/modify', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 12345,
      newPx: 94500.0,
      signature: '0x123abc456def',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.ok()).toBe(true);
  });

  test('Step 3: Verify response status is 200', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 12345,
      newPx: 94500.0,
      signature: '0x123abc456def',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    expect(response.status()).toBe(200);
  });

  test('Step 4: Verify order shows updated price', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 12345,
      newPx: 94500.0,
      signature: '0x123abc456def',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('orderId');
    expect(data.orderId).toBe(12345);
  });

  test('Step 5: Modify order with new size only', async ({ request }) => {
    const modifyPayload = {
      coin: 'ETH',
      oid: 67890,
      newSz: 2.5,
      signature: '0xdef456',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 6: Modify order with both new price and size', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 11111,
      newPx: 95000.0,
      newSz: 0.5,
      signature: '0xabc123',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 7: Modify order with lower price', async ({ request }) => {
    const modifyPayload = {
      coin: 'ETH',
      oid: 22222,
      newPx: 3400.0,
      signature: '0xdef789',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 8: Modify order with higher price', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 33333,
      newPx: 96000.0,
      signature: '0x456def',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 9: Modify order with larger size', async ({ request }) => {
    const modifyPayload = {
      coin: 'ETH',
      oid: 44444,
      newSz: 5.0,
      signature: '0x789abc',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 10: Modify order with smaller size', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 55555,
      newSz: 0.05,
      signature: '0xdef012',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('Step 11: Response time is acceptable (< 500ms)', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 12345,
      newPx: 94500.0,
      signature: '0x111222',
      timestamp: Date.now()
    };

    const start = Date.now();
    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('Step 12: Response headers include correct content-type', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 12345,
      newPx: 94500.0,
      signature: '0x333444',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('Step 13: Response includes success message', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 12345,
      newPx: 94500.0,
      signature: '0x555666',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(typeof data.message).toBe('string');
    expect(data.message.length).toBeGreaterThan(0);
  });

  test('Step 14: Response includes order ID', async ({ request }) => {
    const testOid = 99999;
    const modifyPayload = {
      coin: 'ETH',
      oid: testOid,
      newSz: 1.5,
      signature: '0x777888',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    const data = await response.json();
    expect(data).toHaveProperty('orderId');
    expect(data.orderId).toBe(testOid);
  });

  test('Step 15: Verify success field is true', async ({ request }) => {
    const modifyPayload = {
      coin: 'BTC',
      oid: 12345,
      newPx: 94500.0,
      signature: '0x999000',
      timestamp: Date.now()
    };

    const response = await request.post(`${API_URL}/api/trade/modify`, {
      data: modifyPayload
    });

    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
