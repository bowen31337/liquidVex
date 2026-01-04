/**
 * E2E Test: Percentage buttons and leverage slider functionality
 * Feature: Percentage buttons and leverage slider functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Percentage Buttons and Leverage Slider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="wallet-connect-button"]', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  test('should verify percentage buttons exist and are clickable', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    await expect(orderForm).toBeVisible();

    const pct25 = orderForm.locator('button:has-text("25%")');
    const pct50 = orderForm.locator('button:has-text("50%")');
    const pct75 = orderForm.locator('button:has-text("75%")');
    const pct100 = orderForm.locator('button:has-text("100%")');

    await expect(pct25).toBeVisible();
    await expect(pct50).toBeVisible();
    await expect(pct75).toBeVisible();
    await expect(pct100).toBeVisible();

    await pct25.click();
    await pct50.click();
    await pct75.click();
    await pct100.click();
  });

  test('should verify leverage slider exists with correct range', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    await expect(orderForm).toBeVisible();

    const leverageSlider = orderForm.locator('input[type="range"][min="1"][max="50"]');
    await expect(leverageSlider).toBeVisible();

    const minAttr = await leverageSlider.getAttribute('min');
    const maxAttr = await leverageSlider.getAttribute('max');
    expect(minAttr).toBe('1');
    expect(maxAttr).toBe('50');

    const leverageDisplay = orderForm.locator('span.text-text-primary:has-text("x")');
    await expect(leverageDisplay).toBeVisible();
  });

  test('should verify percentage buttons work with price set', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    const orderTypeSelect = orderForm.locator('label:has-text("Order Type") + select').first();
    await orderTypeSelect.selectOption('limit');
    await page.waitForTimeout(200);

    const priceInput = orderForm.locator('input[data-testid="order-price-input"]');
    await priceInput.fill('100');
    await page.waitForTimeout(200);

    await expect(priceInput).toHaveValue('100');

    const pct25Btn = orderForm.locator('button:has-text("25%")');
    await pct25Btn.click();
    await page.waitForTimeout(200);
  });

  test('should verify leverage slider can be interacted with', async ({ page }) => {
    const orderForm = page.locator('div.panel:has(label:has-text("Order Type"))').first();
    const leverageSlider = orderForm.locator('input[type="range"][min="1"][max="50"]');

    const initialValue = await leverageSlider.inputValue();
    expect(parseInt(initialValue)).toBeGreaterThanOrEqual(1);
    expect(parseInt(initialValue)).toBeLessThanOrEqual(50);

    const isDisabled = await leverageSlider.isDisabled();
    expect(isDisabled).toBe(false);
  });
});
