/**
 * Test script for keyboard shortcuts feature
 * This is a simple test to verify keyboard shortcuts are working
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts Test', () => {
  test('should handle basic keyboard shortcuts', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Test B key for Buy toggle
    await page.keyboard.press('B');
    await page.waitForTimeout(100);

    // Verify Buy button is active
    const buyButton = page.locator('button:has-text("Buy / Long")').first();
    const buyClasses = await buyButton.getAttribute('class');
    expect(buyClasses).toContain('bg-long'); // Should be green when active

    // Test S key for Sell toggle
    await page.keyboard.press('S');
    await page.waitForTimeout(100);

    // Verify Sell button is active
    const sellButton = page.locator('button:has-text("Sell / Short")').first();
    const sellClasses = await sellButton.getAttribute('class');
    expect(sellClasses).toContain('bg-short'); // Should be red when active

    // Test Enter key while in form (should submit)
    // First, fill in some order form data
    const priceInput = page.locator('[data-testid="order-price-input"]').first();
    await priceInput.fill('50000');

    const sizeInput = page.locator('[data-testid="order-size-input"]').first();
    await sizeInput.fill('0.1');

    // Press Enter to submit
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Should see confirmation modal
    const confirmModal = page.locator('[data-testid="order-confirm-modal"]').first();
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    console.log('Keyboard shortcuts test completed successfully!');
  });
});