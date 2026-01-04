/**
 * Order Book Panel Layout Test
 * Feature: Order book panel layout per spec
 * Description: Verify bid size on left, price in center, ask size on right, spread display
 */

import { test, expect } from '@playwright/test';

test.describe('Order Book Panel Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test mode
    await page.addInitScript(() => {
      window.localStorage.setItem('NEXT_PUBLIC_TEST_MODE', 'true');
    });

    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Wait for order book data to load and stabilize
    await page.waitForTimeout(3000);
  });

  test('should display order book panel layout per spec', async ({ page }) => {
    const orderBook = page.locator('.panel', { hasText: 'Order Book' });
    await expect(orderBook).toBeVisible();

    // Step 1: Navigate to order book panel
    // Already done in beforeEach - order book panel is visible

    // Step 2: Verify bid size on left
    // Bids should show size on left, price in center
    const bidRows = orderBook.locator('[data-testid="bid-price"]').locator('..');
    const firstBidRow = bidRows.first();

    // Bid row should have size on left, price in center, empty on right
    await expect(firstBidRow).toBeVisible();

    // Get the bid row structure - should be: Size (left) | Price (center) | Empty (right)
    const bidCells = firstBidRow.locator('.flex-1');
    await expect(bidCells).toHaveCount(3);

    // Left cell should contain size (number)
    const leftCell = bidCells.first();
    const leftCellText = await leftCell.textContent();
    expect(leftCellText).toBeTruthy();
    // Should be a number (size value)
    expect(!isNaN(parseFloat(leftCellText!.replace(/[^\d.]/g, '')))).toBe(true);

    // Center cell should contain price (number, font-mono)
    const centerCell = bidCells.nth(1);
    await expect(centerCell).toHaveClass(/font-mono/);
    const centerCellText = await centerCell.textContent();
    expect(centerCellText).toBeTruthy();
    // Should be a number (price value)
    expect(!isNaN(parseFloat(centerCellText!.replace(/[^\d.]/g, '')))).toBe(true);

    // Right cell should be empty or contain minimal content
    const rightCell = bidCells.last();
    const rightCellText = await rightCell.textContent();
    // Should be empty or just whitespace
    expect(rightCellText?.trim()).toBe('');

    // Step 3: Verify price in center
    // Already verified above - center cell contains price

    // Step 4: Verify ask size on right
    // Asks should show empty on left, price in center, size on right
    const askRows = orderBook.locator('[data-testid="ask-price"]').locator('..');
    const firstAskRow = askRows.first();

    // Ask row should have empty on left, price in center, size on right
    await expect(firstAskRow).toBeVisible();

    // Get the ask row structure - should be: Empty (left) | Price (center) | Size (right)
    const askCells = firstAskRow.locator('.flex-1');
    await expect(askCells).toHaveCount(3);

    // Left cell should be empty
    const askLeftCell = askCells.first();
    const askLeftCellText = await askLeftCell.textContent();
    expect(askLeftCellText?.trim()).toBe('');

    // Center cell should contain price (number, font-mono)
    const askCenterCell = askCells.nth(1);
    await expect(askCenterCell).toHaveClass(/font-mono/);
    const askCenterCellText = await askCenterCell.textContent();
    expect(askCenterCellText).toBeTruthy();
    // Should be a number (price value)
    expect(!isNaN(parseFloat(askCenterCellText!.replace(/[^\d.]/g, '')))).toBe(true);

    // Right cell should contain size (number)
    const askRightCell = askCells.last();
    const askRightCellText = await askRightCell.textContent();
    expect(askRightCellText).toBeTruthy();
    // Should be a number (size value)
    expect(!isNaN(parseFloat(askRightCellText!.replace(/[^\d.]/g, '')))).toBe(true);

    // Step 5: Verify spread display between bids/asks
    // Check for spread display element
    const spreadDisplay = orderBook.locator('[data-testid="spread-display"]');
    await expect(spreadDisplay).toBeVisible();

    const spreadText = await spreadDisplay.textContent();
    expect(spreadText).toBeTruthy();
    expect(spreadText).toContain('Spread:');

    // Should contain both absolute spread and percentage
    expect(spreadText).toContain('(');
    expect(spreadText).toContain('%');
  });

  test('should show bid side layout correctly', async ({ page }) => {
    const orderBook = page.locator('.panel', { hasText: 'Order Book' });

    // Find first bid row
    const bidRow = orderBook.locator('[data-testid="bid-price"]').first().locator('..');

    // Verify bid row has 3 columns
    const cells = bidRow.locator('.flex-1');
    await expect(cells).toHaveCount(3);

    // Verify layout: Size (left) | Price (center) | Empty (right)
    const leftCell = cells.first();
    const centerCell = cells.nth(1);
    const rightCell = cells.last();

    // Left cell should have size content
    await expect(leftCell).toBeVisible();
    const leftText = await leftCell.textContent();
    expect(leftText && leftText.trim().length > 0).toBe(true);

    // Center cell should have price and be font-mono
    await expect(centerCell).toBeVisible();
    await expect(centerCell).toHaveClass(/font-mono/);
    const centerText = await centerCell.textContent();
    expect(centerText && centerText.trim().length > 0).toBe(true);

    // Right cell should be empty
    await expect(rightCell).toBeVisible();
    const rightText = await rightCell.textContent();
    expect(rightText?.trim()).toBe('');
  });

  test('should show ask side layout correctly', async ({ page }) => {
    const orderBook = page.locator('.panel', { hasText: 'Order Book' });

    // Find first ask row
    const askRow = orderBook.locator('[data-testid="ask-price"]').first().locator('..');

    // Verify ask row has 3 columns
    const cells = askRow.locator('.flex-1');
    await expect(cells).toHaveCount(3);

    // Verify layout: Empty (left) | Price (center) | Size (right)
    const leftCell = cells.first();
    const centerCell = cells.nth(1);
    const rightCell = cells.last();

    // Left cell should be empty
    await expect(leftCell).toBeVisible();
    const leftText = await leftCell.textContent();
    expect(leftText?.trim()).toBe('');

    // Center cell should have price and be font-mono
    await expect(centerCell).toBeVisible();
    await expect(centerCell).toHaveClass(/font-mono/);
    const centerText = await centerCell.textContent();
    expect(centerText && centerText.trim().length > 0).toBe(true);

    // Right cell should have size content
    await expect(rightCell).toBeVisible();
    const rightText = await rightCell.textContent();
    expect(rightText && rightText.trim().length > 0).toBe(true);
  });

  test('should display spread in correct format', async ({ page }) => {
    const orderBook = page.locator('.panel', { hasText: 'Order Book' });

    // Check spread display format
    const spreadDisplay = orderBook.locator('[data-testid="spread-display"]');
    await expect(spreadDisplay).toBeVisible();

    const spreadText = await spreadDisplay.textContent();
    expect(spreadText).toBeTruthy();

    // Should contain spread value and percentage
    expect(spreadText).toContain('Spread:');
    expect(spreadText).toContain('(');
    expect(spreadText).toContain('%');

    // Should match expected format: "Spread: X.XXX (X.XXX%)"
    const spreadFormat = /Spread: \d+\.?\d* \(\d+\.?\d*%\)/;
    expect(spreadFormat.test(spreadText!)).toBe(true);
  });

  test('should show visual separation between bids and asks', async ({ page }) => {
    const orderBook = page.locator('.panel', { hasText: 'Order Book' });

    // Should have spread display between bid and ask sections
    const spreadDisplay = orderBook.locator('[data-testid="spread-display"]');
    await expect(spreadDisplay).toBeVisible();

    // Should have imbalance indicator
    const imbalanceDisplay = orderBook.locator('[data-testid="imbalance-direction"]');
    await expect(imbalanceDisplay).toBeVisible();

    // Should have precision and aggregation controls
    const precisionControls = orderBook.locator('text=Precision:');
    await expect(precisionControls).toBeVisible();

    const aggregationControls = orderBook.locator('text=Group:');
    await expect(aggregationControls).toBeVisible();
  });

  test('should maintain layout consistency across different price levels', async ({ page }) => {
    const orderBook = page.locator('.panel', { hasText: 'Order Book' });

    // Check multiple bid rows
    const bidRows = orderBook.locator('[data-testid="bid-price"]');
    await expect(bidRows).toHaveCountGreaterThan(0);

    for (let i = 0; i < Math.min(3, await bidRows.count()); i++) {
      const bidRow = bidRows.nth(i).locator('..');
      const cells = bidRow.locator('.flex-1');

      await expect(cells).toHaveCount(3);

      // Verify bid layout: Size | Price | Empty
      const leftCell = cells.first();
      const centerCell = cells.nth(1);
      const rightCell = cells.last();

      const leftText = await leftCell.textContent();
      const centerText = await centerCell.textContent();
      const rightText = await rightCell.textContent();

      expect(leftText && leftText.trim().length > 0).toBe(true); // Size
      expect(centerText && centerText.trim().length > 0).toBe(true); // Price
      expect(rightText?.trim()).toBe(''); // Empty
    }

    // Check multiple ask rows
    const askRows = orderBook.locator('[data-testid="ask-price"]');
    await expect(askRows).toHaveCountGreaterThan(0);

    for (let i = 0; i < Math.min(3, await askRows.count()); i++) {
      const askRow = askRows.nth(i).locator('..');
      const cells = askRow.locator('.flex-1');

      await expect(cells).toHaveCount(3);

      // Verify ask layout: Empty | Price | Size
      const leftCell = cells.first();
      const centerCell = cells.nth(1);
      const rightCell = cells.last();

      const leftText = await leftCell.textContent();
      const centerText = await centerCell.textContent();
      const rightText = await rightCell.textContent();

      expect(leftText?.trim()).toBe(''); // Empty
      expect(centerText && centerText.trim().length > 0).toBe(true); // Price
      expect(rightText && rightText.trim().length > 0).toBe(true); // Size
    }
  });
});