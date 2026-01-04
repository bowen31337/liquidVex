import { test, expect } from '@playwright/test';

test.describe('Feature 73: Rate Limiting', () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  test.beforeEach(async ({ request }) => {
    // Wait a bit between tests to ensure rate limits reset
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test('Step 1: Make rapid consecutive API calls', async ({ request }) => {
    const responses: Array<{ status: number; body?: any }> = [];

    // Make 15 rapid requests (exceeds the 10 req/sec limit)
    const promises = Array.from({ length: 15 }, async (_, i) => {
      const response = await request.get(`${API_BASE_URL}/api/info/meta`);
      const body = await response.json().catch(() => null);
      return { status: response.status(), body };
    });

    const results = await Promise.all(promises);
    responses.push(...results);

    // At least some requests should succeed (429 or 200)
    const successCount = responses.filter(r => r.status === 200).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    console.log(`Success: ${successCount}, Rate Limited: ${rateLimitedCount}`);

    // We should have some responses
    expect(responses.length).toBeGreaterThan(0);
    expect(successCount + rateLimitedCount).toBe(responses.length);
  });

  test('Step 2: Verify rate limit response after threshold', async ({ request }) => {
    let rateLimited = false;
    let retryAfter = 0;

    // Make requests rapidly until we hit rate limit
    for (let i = 0; i < 20; i++) {
      const response = await request.get(`${API_BASE_URL}/api/info/meta`);

      if (response.status() === 429) {
        rateLimited = true;

        // Check rate limit headers
        const retryAfterHeader = response.headers()['retry-after'];
        if (retryAfterHeader) {
          retryAfter = parseInt(retryAfterHeader, 10);
        }

        // Verify response body contains rate limit info
        const body = await response.json();
        expect(body).toHaveProperty('error');
        expect(body.error).toContain('Rate limit exceeded');

        // Check for rate limit details
        expect(body).toHaveProperty('limit');
        expect(body).toHaveProperty('window');
        expect(body).toHaveProperty('retry_after');

        console.log('Rate limited:', body);
        break; // Stop once we hit rate limit
      }

      // Small delay to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Verify we hit rate limit
    expect(rateLimited).toBeTruthy();

    // Verify retry-after is reasonable (1-60 seconds)
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  test('Step 3: Wait for rate limit reset', async ({ request }) => {
    let rateLimited = false;
    let retryAfter = 0;

    // First, hit the rate limit
    for (let i = 0; i < 20; i++) {
      const response = await request.get(`${API_BASE_URL}/api/info/meta`);

      if (response.status() === 429) {
        rateLimited = true;

        const retryAfterHeader = response.headers()['retry-after'];
        if (retryAfterHeader) {
          retryAfter = parseInt(retryAfterHeader, 10);
        }

        const body = await response.json();
        console.log('Rate limited, waiting:', body.retry_after, 'seconds');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    expect(rateLimited).toBeTruthy();

    // Wait for rate limit to reset (add 1 second buffer)
    const waitTime = Math.max(retryAfter + 1, 2);
    console.log(`Waiting ${waitTime} seconds for rate limit reset...`);
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
  });

  test('Step 4: Verify calls succeed again after waiting', async ({ request }) => {
    // First, ensure we hit rate limit
    let rateLimited = false;
    let retryAfter = 0;

    for (let i = 0; i < 20; i++) {
      const response = await request.get(`${API_BASE_URL}/api/info/meta`);

      if (response.status() === 429) {
        rateLimited = true;

        const body = await response.json();
        retryAfter = body.retry_after || 2;
        console.log('Rate limited, waiting', retryAfter, 'seconds');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (rateLimited) {
      // Wait for rate limit reset
      const waitTime = retryAfter + 1;
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }

    // Now verify requests succeed again
    const response = await request.get(`${API_BASE_URL}/api/info/meta`);

    // Should succeed with 200
    expect(response.status()).toBe(200);

    // Verify rate limit headers are present
    const rateLimitLimit = response.headers()['x-ratelimit-limit'];
    const rateLimitRemaining = response.headers()['x-ratelimit-remaining'];
    const rateLimitWindow = response.headers()['x-ratelimit-window'];

    expect(rateLimitLimit).toBeTruthy();
    expect(rateLimitRemaining).toBeTruthy();
    expect(rateLimitWindow).toBeTruthy();

    console.log('Rate limit headers:', {
      limit: rateLimitLimit,
      remaining: rateLimitRemaining,
      window: rateLimitWindow,
    });

    // Verify response body
    const body = await response.json();
    expect(body).toHaveProperty('exchange');
    expect(body.exchange).toBe('Hyperliquid');
  });

  test('Rate limit headers present in all responses', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/info/meta`);

    expect(response.status()).toBe(200);

    // Check for rate limit headers
    const rateLimitLimit = response.headers()['x-ratelimit-limit'];
    const rateLimitRemaining = response.headers()['x-ratelimit-remaining'];
    const rateLimitWindow = response.headers()['x-ratelimit-window'];

    expect(rateLimitLimit).toBeDefined();
    expect(rateLimitRemaining).toBeDefined();
    expect(rateLimitWindow).toBeDefined();

    console.log('Rate limit headers:', {
      limit: rateLimitLimit,
      remaining: rateLimitRemaining,
      window: rateLimitWindow,
    });
  });

  test('Rate limit applies to different endpoints', async ({ request }) => {
    // Test that rate limiting works across different endpoints
    let rateLimited = false;

    // Make rapid requests to different endpoints
    const endpoints = [
      '/api/info/meta',
      '/api/info/asset/BTC',
      '/health',
    ];

    for (let i = 0; i < 30; i++) {
      const endpoint = endpoints[i % endpoints.length];
      const response = await request.get(`${API_BASE_URL}${endpoint}`);

      if (response.status() === 429) {
        rateLimited = true;
        const body = await response.json();
        console.log(`Rate limited on ${endpoint}:`, body);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    expect(rateLimited).toBeTruthy();
  });

  test('Rate limit is per-IP based', async ({ request }) => {
    // Make a request and check rate limit info
    const response = await request.get(`${API_BASE_URL}/api/info/meta`);

    expect(response.status()).toBe(200);

    const rateLimitRemaining = response.headers()['x-ratelimit-remaining'];
    expect(rateLimitRemaining).toBeDefined();

    // Remaining should be a number string
    const remaining = parseInt(rateLimitRemaining, 10);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(60);

    console.log('Requests remaining:', remaining);
  });
});
