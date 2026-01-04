/**
 * Test: Input Validation and Security
 * Feature ID: 74
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 74: Input Validation and Security', () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  test('Step 1: Send request with missing required fields', async ({ request }) => {
    // Test with missing required field 'coin'
    const invalidOrder = {
      is_buy: true,
      limit_px: 95000,
      sz: 0.1,
      order_type: 'limit',
      signature: '0x' + 'a'.repeat(130),
      timestamp: Math.floor(Date.now() / 1000),
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: invalidOrder,
    });

    // Should return 422 Unprocessable Entity for validation error
    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json().catch(() => ({}));
    console.log('Missing field validation:', body);

    // Verify error mentions missing field
    expect(body.detail?.[0]?.type || body.error).toBeTruthy();
  });

  test('Step 2: Verify 400 error with validation message', async ({ request }) => {
    const invalidOrder = {
      coin: 'BTC',
      is_buy: true,
      // Missing limit_px for limit order
      sz: 0.1,
      signature: '0x' + 'a'.repeat(130),
      timestamp: Math.floor(Date.now() / 1000),
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: invalidOrder,
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json().catch(() => ({}));
    console.log('Validation error:', body);

    // Verify validation message
    expect(body.detail || body.error).toBeTruthy();
  });

  test('Step 3: Send request with invalid data types', async ({ request }) => {
    const invalidOrder = {
      coin: 'BTC',
      is_buy: 'true', // Should be boolean, not string
      limit_px: 'not_a_number', // Should be number
      sz: 0.1,
      signature: '0x' + 'a'.repeat(130),
      timestamp: Math.floor(Date.now() / 1000),
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: invalidOrder,
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json().catch(() => ({}));
    console.log('Type validation error:', body);

    // Should get validation error
    expect(body.detail || body.error).toBeTruthy();
  });

  test('Step 4: Verify 400 error with validation message for types', async ({ request }) => {
    const invalidOrder = {
      coin: 123, // Should be string
      is_buy: true,
      limit_px: 95000,
      sz: '0.1', // Should be number
      signature: '0x' + 'a'.repeat(130),
      timestamp: Math.floor(Date.now() / 1000),
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: invalidOrder,
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json().catch(() => ({}));

    // Verify validation message
    expect(body.detail || body.error).toBeTruthy();
    console.log('Type validation message:', body);
  });

  test('Step 5: Send request with SQL injection attempt', async ({ request }) => {
    // Test various SQL injection patterns
    const sqlInjectionAttempts = [
      "BTC'; DROP TABLE orders; --",
      "BTC' OR '1'='1",
      "BTC' UNION SELECT * FROM users --",
      "BTC'; EXEC xp_cmdshell('dir'); --",
      "BTC' OR 1=1 --",
    ];

    for (const injection of sqlInjectionAttempts) {
      const maliciousOrder = {
        coin: injection,
        is_buy: true,
        limit_px: 95000,
        sz: 0.1,
        signature: '0x' + 'a'.repeat(130),
        timestamp: Math.floor(Date.now() / 1000),
      };

      const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
        data: maliciousOrder,
      });

      // Should be rejected
      expect(response.status()).toBeGreaterThanOrEqual(400);

      const body = await response.json().catch(() => ({}));
      console.log(`SQL injection blocked: "${injection}"`);

      // Verify rejection
      expect(response.status()).not.toBe(200);
    }
  });

  test('Step 6: Verify request is sanitized and rejected', async ({ request }) => {
    // Test XSS injection
    const xssAttempt = {
      coin: "<script>alert('xss')</script>",
      is_buy: true,
      limit_px: 95000,
      sz: 0.1,
      signature: '0x' + 'a'.repeat(130),
      timestamp: Math.floor(Date.now() / 1000),
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: xssAttempt,
    });

    // Should be rejected
    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json().catch(() => ({}));
    console.log('XSS blocked:', body);

    // Verify security validation worked
    expect(response.status()).not.toBe(200);
  });

  test('Step 7: Send trading request with valid signature', async ({ request }) => {
    // This test uses a valid signature format (not cryptographically verified in test env)
    const validOrder = {
      coin: 'BTC',
      is_buy: true,
      limit_px: 95000,
      sz: 0.1,
      order_type: 'limit',
      signature: '0x' + '1'.repeat(130), // Valid hex format
      timestamp: Math.floor(Date.now() / 1000),
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: validOrder,
    });

    // Signature format should pass validation
    // Note: The signature won't be cryptographically verified in test mode
    // but the format validation should pass
    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Valid signature request:', body);

    expect(body.success).toBeDefined();
  });

  test('Step 8: Verify request succeeds', async ({ request }) => {
    const validOrder = {
      coin: 'ETH',
      is_buy: false,
      limit_px: 3500,
      sz: 1.0,
      order_type: 'limit',
      signature: '0x' + '2'.repeat(130),
      timestamp: Math.floor(Date.now() / 1000),
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: validOrder,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.orderId).toBeDefined();
  });

  test('Step 9: Send request with invalid signature', async ({ request }) => {
    const invalidSignatureAttempts = [
      '', // Empty
      'not_hex_at_all', // Not hex
      '0xGGG', // Invalid hex chars
      '0x123', // Too short
      'a'.repeat(200), // Too long without 0x
    ];

    for (const invalidSig of invalidSignatureAttempts) {
      const order = {
        coin: 'BTC',
        is_buy: true,
        limit_px: 95000,
        sz: 0.1,
        signature: invalidSig,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
        data: order,
      });

      // Should reject invalid signature format
      expect(response.status()).toBeGreaterThanOrEqual(400);

      console.log(`Invalid signature blocked: "${invalidSig.substring(0, 20)}..."`);
    }
  });

  test('Step 10: Verify 401 error for invalid signature', async ({ request }) => {
    const order = {
      coin: 'BTC',
      is_buy: true,
      limit_px: 95000,
      sz: 0.1,
      signature: 'invalid_signature_format',
      timestamp: Math.floor(Date.now() / 1000),
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: order,
    });

    // Should return 401 Unauthorized or 400 Bad Request
    expect([400, 401, 422]).toContain(response.status());

    const body = await response.json().catch(() => ({}));
    console.log('Invalid signature error:', body);

    // Verify error message
    expect(body.detail || body.error).toBeTruthy();
  });

  test('Additional: Expired timestamp should be rejected', async ({ request }) => {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 500; // 500 seconds ago

    const order = {
      coin: 'BTC',
      is_buy: true,
      limit_px: 95000,
      sz: 0.1,
      signature: '0x' + '3'.repeat(130),
      timestamp: expiredTimestamp,
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: order,
    });

    // Should reject expired timestamp
    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json().catch(() => ({}));
    console.log('Expired timestamp error:', body);

    expect(body.detail || body.error).toBeTruthy();
  });

  test('Additional: Future timestamp should be rejected', async ({ request }) => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 500; // 500 seconds in future

    const order = {
      coin: 'BTC',
      is_buy: true,
      limit_px: 95000,
      sz: 0.1,
      signature: '0x' + '4'.repeat(130),
      timestamp: futureTimestamp,
    };

    const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
      data: order,
    });

    // Should reject future timestamp
    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json().catch(() => ({}));
    console.log('Future timestamp error:', body);

    expect(body.detail || body.error).toBeTruthy();
  });

  test('Additional: Invalid coin symbols should be rejected', async ({ request }) => {
    const invalidCoins = [
      '', // Empty
      'b', // Too short
      'A'.repeat(11), // Too long
      'btc', // Lowercase
      'B T C', // Spaces
      'BTC@', // Special chars
      '123', // Numbers only
    ];

    for (const invalidCoin of invalidCoins) {
      const order = {
        coin: invalidCoin,
        is_buy: true,
        limit_px: 95000,
        sz: 0.1,
        signature: '0x' + '5'.repeat(130),
        timestamp: Math.floor(Date.now() / 1000),
      };

      const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
        data: order,
      });

      // Should reject invalid coin symbol
      expect(response.status()).toBeGreaterThanOrEqual(400);

      console.log(`Invalid coin blocked: "${invalidCoin}"`);
    }
  });

  test('Additional: Path traversal attempts should be blocked', async ({ request }) => {
    const pathTraversalAttempts = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '~/.ssh/config',
      '/etc/passwd',
    ];

    for (const attempt of pathTraversalAttempts) {
      const order = {
        coin: attempt,
        is_buy: true,
        limit_px: 95000,
        sz: 0.1,
        signature: '0x' + '6'.repeat(130),
        timestamp: Math.floor(Date.now() / 1000),
      };

      const response = await request.post(`${API_BASE_URL}/api/trade/place`, {
        data: order,
      });

      // Should be rejected
      expect(response.status()).toBeGreaterThanOrEqual(400);

      console.log(`Path traversal blocked: "${attempt}"`);
    }
  });
});
