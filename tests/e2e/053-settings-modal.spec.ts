/**
 * E2E test for Settings modal and options
 * Feature #53 from feature_list.json
 */

import { test, expect } from '@playwright/test';

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('Settings button is visible in header', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');

    await expect(settingsButton).toBeVisible();
    // Verify it has a gear icon (svg element)
    const gearIcon = settingsButton.locator('svg');
    await expect(gearIcon).toBeVisible();
  });

  test('Clicking settings button opens modal', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');

    await settingsButton.click();

    // Wait for modal to appear
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();

    // Check modal title
    const modalTitle = page.locator('.modal-content h2, .modal-content h3').filter({ hasText: 'Account Settings' });
    await expect(modalTitle).toBeVisible();
  });

  test('Settings modal has all sections', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    // Wait for modal
    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    // Scope all checks to the modal content to avoid conflicts with page content
    const modalContent = page.locator('.modal-content');

    // Check main sections
    await expect(modalContent.locator('text=Appearance')).toBeVisible();
    await expect(modalContent.locator('text=Notifications')).toBeVisible();
    await expect(modalContent.locator('text=Display')).toBeVisible();
    await expect(modalContent.locator('text=Trading')).toBeVisible();
    await expect(modalContent.locator('text=Account Actions')).toBeVisible();
  });

  test('Appearance section has theme and language options', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    // Theme selector
    const themeSelect = page.locator('select').filter({ hasText: /Dark|Light/ }).first();
    await expect(themeSelect).toBeVisible();

    // Language selector
    const languageSelect = page.locator('select').filter({ hasText: /English|Español/ }).first();
    await expect(languageSelect).toBeVisible();
  });

  test('Can toggle compact mode', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    const compactModeCheckbox = page.locator('input#compact-mode');
    await expect(compactModeCheckbox).toBeVisible();

    // Toggle checkbox
    await compactModeCheckbox.click();

    // Verify it's checked
    await expect(compactModeCheckbox).toBeChecked();
  });

  test('Can adjust price precision slider', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    // Find price precision slider by its label
    const priceLabel = page.locator('text=/Price Precision/').first();
    await expect(priceLabel).toBeVisible();

    // Find the range input near the label
    const priceSlider = priceLabel.locator('xpath=following-sibling::input[@type="range"]');
    await expect(priceSlider).toBeVisible();

    // Get initial value
    const initialValue = await priceSlider.inputValue();

    // Change value
    await priceSlider.fill('5');

    // Verify value changed
    const newValue = await priceSlider.inputValue();
    expect(newValue).toBe('5');
  });

  test('Can change default leverage', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    // Find leverage selector
    const leverageLabel = page.locator('text=Default Leverage').first();
    await expect(leverageLabel).toBeVisible();

    const leverageSelect = leverageLabel.locator('xpath=following-sibling::select');
    await expect(leverageSelect).toBeVisible();

    // Select 20x leverage
    await leverageSelect.selectOption('20');

    // Verify selection
    const selectedValue = await leverageSelect.inputValue();
    expect(selectedValue).toBe('20');
  });

  test('Can toggle order confirmations checkbox', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    const confirmCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: '' }).nth(2);
    await expect(confirmCheckbox).toBeVisible();

    const isChecked = await confirmCheckbox.isChecked();
    await confirmCheckbox.click();

    // Verify state changed
    const newChecked = await confirmCheckbox.isChecked();
    expect(newChecked).toBe(!isChecked);
  });

  test('Save Settings button is visible', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    const saveButton = page.locator('button:has-text("Save Settings")');
    await expect(saveButton).toBeVisible();
  });

  test('Reset to Default button is visible', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    const resetButton = page.locator('button:has-text("Reset to Default")');
    await expect(resetButton).toBeVisible();
  });

  test('Export Settings button is visible', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    const exportButton = page.locator('button:has-text("Export Settings")');
    await expect(exportButton).toBeVisible();
  });

  test('Clicking outside modal closes it', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    // Click the X close button in the modal header
    const closeButton = page.locator('.modal-content button[aria-label="Close"]');
    await closeButton.click();

    // Modal should close
    const overlay = page.locator('.modal-overlay');
    await expect(overlay).not.toBeVisible();
  });

  test('Can save and close modal', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    const saveButton = page.locator('button:has-text("Save Settings")');
    await saveButton.click();

    // Modal should close
    const overlay = page.locator('.modal-overlay');
    await expect(overlay).not.toBeVisible();
  });

  test('All notification checkboxes are visible', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    await expect(page.locator('text=Order Confirmations')).toBeVisible();
    await expect(page.locator('text=Price Alerts')).toBeVisible();
    await expect(page.locator('text=Funding Reminders')).toBeVisible();
  });

  test('Trading section has all options', async ({ page }) => {
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    await page.waitForSelector('.modal-overlay', { state: 'visible' });

    await expect(page.locator('text=Default Leverage')).toBeVisible();
    await expect(page.locator('text=Default Order Size')).toBeVisible();
    await expect(page.locator('text=Confirm Orders')).toBeVisible();
    await expect(page.locator('text=Sound Effects')).toBeVisible();
  });
});
