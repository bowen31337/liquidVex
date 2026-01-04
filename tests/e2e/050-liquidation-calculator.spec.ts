/**
 * E2E test for Liquidation Calculator functionality
 * Feature #50 from feature_list.json
 */

import { test, expect } from '@playwright/test';

test.describe('Liquidation Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForSelector('[data-testid="wallet-connect-button"]', { timeout: 10000 });
  });

  test('Calculator tab is visible in bottom panel', async ({ page }) => {
    // Find the Calculator tab
    const calculatorTab = page.locator('button:has-text("Calculator")');
    await expect(calculatorTab).toBeVisible();
  });

  test('Clicking Calculator tab opens calculator view', async ({ page }) => {
    // Click the Calculator tab
    const calculatorTab = page.locator('button:has-text("Calculator")');
    await calculatorTab.click();

    // Wait for calculator content to appear
    await page.waitForTimeout(500);

    // Verify calculator header is visible
    const header = page.locator('text=Liquidation Calculator');
    await expect(header).toBeVisible();

    // Verify input fields exist
    const positionSizeInput = page.locator('input[placeholder="0.0000"]');
    const entryPriceInput = page.locator('input[placeholder="0.00"]');
    const leverageInput = page.locator('input[type="number"]').filter({ hasText: '' }).nth(1);

    await expect(positionSizeInput).toBeVisible();
    await expect(entryPriceInput).toBeVisible();
    await expect(leverageInput).toBeVisible();
  });

  test('Enter position size and verify calculator accepts input', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Enter position size
    const positionSizeInput = page.locator('input[placeholder="0.0000"]');
    await positionSizeInput.fill('1.5');
    await expect(positionSizeInput).toHaveValue('1.5');
  });

  test('Enter entry price and verify calculator accepts input', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Enter entry price
    const entryPriceInput = page.locator('input[placeholder="0.00"]');
    await entryPriceInput.fill('50000');
    await expect(entryPriceInput).toHaveValue('50000');
  });

  test('Enter leverage and verify calculator accepts input', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Find leverage input (second number input after position size and entry price)
    const leverageInput = page.locator('input[type="number"]').filter({ hasText: '' }).nth(1);
    await leverageInput.fill('20');
    await expect(leverageInput).toHaveValue('20');
  });

  test('Verify liquidation price is calculated when all inputs are provided', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Fill in all inputs
    const positionSizeInput = page.locator('input[placeholder="0.0000"]');
    const entryPriceInput = page.locator('input[placeholder="0.00"]');
    const leverageInput = page.locator('input[type="number"]').filter({ hasText: '' }).nth(1);

    await positionSizeInput.fill('1.0');
    await entryPriceInput.fill('50000');
    await leverageInput.fill('10');

    // Wait for calculation
    await page.waitForTimeout(500);

    // Verify liquidation price is displayed
    const liqPriceText = page.locator('text=Liquidation Price');
    await expect(liqPriceText).toBeVisible();

    // The calculated liquidation price for long position with 10x leverage
    // should be: 50000 - (50000/10) = 45000
    const liqPriceValue = page.locator('.font-mono.font-bold.text-short');
    await expect(liqPriceValue).toBeVisible();

    // Verify it shows a dollar amount
    const text = await liqPriceValue.textContent();
    expect(text).toContain('$');
  });

  test('Verify risk level is displayed', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Fill in inputs with high leverage (high risk)
    const positionSizeInput = page.locator('input[placeholder="0.0000"]');
    const entryPriceInput = page.locator('input[placeholder="0.00"]');
    const leverageInput = page.locator('input[type="number"]').filter({ hasText: '' }).nth(1);

    await positionSizeInput.fill('1.0');
    await entryPriceInput.fill('50000');
    await leverageInput.fill('50'); // High leverage = high risk

    await page.waitForTimeout(500);

    // Risk level should be visible
    const riskLevel = page.locator('text=High Risk');
    await expect(riskLevel).toBeVisible();
  });

  test('Verify distance from entry is displayed', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Fill in inputs
    const positionSizeInput = page.locator('input[placeholder="0.0000"]');
    const entryPriceInput = page.locator('input[placeholder="0.00"]');
    const leverageInput = page.locator('input[type="number"]').filter({ hasText: '' }).nth(1);

    await positionSizeInput.fill('1.0');
    await entryPriceInput.fill('50000');
    await leverageInput.fill('10');

    await page.waitForTimeout(500);

    // Distance should be visible (should be 10% for 10x leverage)
    const distanceText = page.locator('text=Distance from Entry');
    await expect(distanceText).toBeVisible();
  });

  test('Verify margin type selector works', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Find margin type selector
    const marginSelect = page.locator('select').filter({ hasText: /Cross|Isolated/ });
    await expect(marginSelect).toBeVisible();

    // Change to isolated
    await marginSelect.selectOption('isolated');
    await expect(marginSelect).toHaveValue('isolated');

    // Change back to cross
    await marginSelect.selectOption('cross');
    await expect(marginSelect).toHaveValue('cross');
  });

  test('Verify calculator recalculates when inputs change', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Fill in initial inputs
    const positionSizeInput = page.locator('input[placeholder="0.0000"]');
    const entryPriceInput = page.locator('input[placeholder="0.00"]');
    const leverageInput = page.locator('input[type="number"]').filter({ hasText: '' }).nth(1);

    await positionSizeInput.fill('1.0');
    await entryPriceInput.fill('50000');
    await leverageInput.fill('10');

    await page.waitForTimeout(500);

    // Get initial liquidation price
    const liqPriceValue = page.locator('.font-mono.font-bold.text-short');
    const initialText = await liqPriceValue.textContent();

    // Change leverage to 20
    await leverageInput.fill('20');
    await page.waitForTimeout(500);

    // Get new liquidation price (should be different)
    const newText = await liqPriceValue.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('Verify high risk warning appears for risky positions', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Fill in inputs with very high leverage
    const positionSizeInput = page.locator('input[placeholder="0.0000"]');
    const entryPriceInput = page.locator('input[placeholder="0.00"]');
    const leverageInput = page.locator('input[type="number"]').filter({ hasText: '' }).nth(1);

    await positionSizeInput.fill('1.0');
    await entryPriceInput.fill('50000');
    await leverageInput.fill('50'); // Very high leverage

    await page.waitForTimeout(500);

    // Should show high risk warning
    const warning = page.locator('text=High liquidation risk');
    await expect(warning).toBeVisible();
  });

  test('Verify calculator shows info note about estimates', async ({ page }) => {
    // Navigate to calculator
    await page.locator('button:has-text("Calculator")').click();
    await page.waitForTimeout(300);

    // Info note should be visible
    const infoNote = page.locator('text=Note: This calculator provides estimates');
    await expect(infoNote).toBeVisible();
  });
});
