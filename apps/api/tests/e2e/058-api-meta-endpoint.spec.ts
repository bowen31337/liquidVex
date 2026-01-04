import { test, expect } from '@playwright/test';

test.describe('API GET /api/info/meta', () => {
  test('should return exchange metadata with status 200', async ({ request }) => {
    const response = await request.get('/api/info/meta');

    expect(response.status()).toBe(200);
  });

  test('should contain exchange information', async ({ request }) => {
    const response = await request.get('/api/info/meta');
    const data = await response.json();

    expect(data).toHaveProperty('exchange');
    expect(typeof data.exchange).toBe('string');
    expect(data.exchange.length).toBeGreaterThan(0);
  });

  test('should contain asset list', async ({ request }) => {
    const response = await request.get('/api/info/meta');
    const data = await response.json();

    expect(data).toHaveProperty('assets');
    expect(Array.isArray(data.assets)).toBe(true);
    expect(data.assets.length).toBeGreaterThan(0);
  });

  test('should contain all required asset properties', async ({ request }) => {
    const response = await request.get('/api/info/meta');
    const data = await response.json();

    expect(data.assets.length).toBeGreaterThan(0);

    const asset = data.assets[0];
    expect(asset).toHaveProperty('coin');
    expect(asset).toHaveProperty('sz_decimals');
    expect(asset).toHaveProperty('px_decimals');
    expect(asset).toHaveProperty('min_sz');
    expect(asset).toHaveProperty('max_leverage');
    expect(asset).toHaveProperty('funding_rate');
    expect(asset).toHaveProperty('open_interest');
    expect(asset).toHaveProperty('volume_24h');
    expect(asset).toHaveProperty('price_change_24h');
  });

  test('should have valid data types for asset properties', async ({ request }) => {
    const response = await request.get('/api/info/meta');
    const data = await response.json();

    expect(data.assets.length).toBeGreaterThan(0);

    const asset = data.assets[0];
    expect(typeof asset.coin).toBe('string');
    expect(typeof asset.sz_decimals).toBe('number');
    expect(typeof asset.px_decimals).toBe('number');
    expect(typeof asset.min_sz).toBe('number');
    expect(typeof asset.max_leverage).toBe('number');
    expect(typeof asset.funding_rate).toBe('number');
    expect(typeof asset.open_interest).toBe('number');
    expect(typeof asset.volume_24h).toBe('number');
    expect(typeof asset.price_change_24h).toBe('number');
  });
});
