/**
 * Test: Dark mode is the only theme (no light mode)
 * Feature ID: 999
 * Category: functional
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 999: Dark Mode Only (No Light Mode)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app with test mode enabled
    await page.goto('http://localhost:3002?testMode=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Settings modal has no theme toggle', async ({ page }) => {
    // Open settings modal
    await page.click('[data-testid="settings-button"]');
    await page.waitForTimeout(500);

    // Verify settings modal is open
    const modal = page.locator('.modal-overlay').or(page.locator('.modal-content'));
    await expect(modal.first()).toBeVisible();

    // Get all text content from settings modal
    const modalText = await modal.first().textContent();

    // Verify "Theme" label is NOT present
    expect(modalText).not.toContain('Theme');

    // Verify "Dark" and "Light" options are NOT present (as theme options)
    // Note: "Dark" might appear in other contexts, so we check it's not with "Theme" or in a select
    expect(modalText).not.toMatch(/Theme.*Dark/);
    expect(modalText).not.toMatch(/Theme.*Light/);

    // Verify there's a Language selector (to show we're in the right section)
    expect(modalText).toContain('Language');

    // Close settings
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('Application always uses dark mode colors', async ({ page }) => {
    // Get the background color of the main page
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(el => window.getComputedStyle(el).backgroundColor);

    // Verify it's a dark color (close to #0a0a0a as defined in tailwind.config.ts)
    // RGB(10, 10, 10) = #0a0a0a
    expect(backgroundColor).toMatch(/rgb\(10,\s*10,\s*10\)|rgba\(10,\s*10,\s*10/);
  });

  test('Settings modal shows only Language selector in Appearance section', async ({ page }) => {
    // Open settings modal
    await page.click('[data-testid="settings-button"]');
    await page.waitForTimeout(500);

    // Look for the Appearance section
    const appearanceSection = page.locator('h3:has-text("Appearance")');
    await expect(appearanceSection).toBeVisible();

    // Get the parent container of the Appearance section
    const sectionContainer = appearanceSection.locator('xpath=ancestor::div[contains(@class, "space-y-4")]').first();

    // Count select elements in this section (should only be Language)
    const selects = sectionContainer.locator('select');
    const selectCount = await selects.count();

    // Should only have 1 select (Language), not 2 (Language + Theme)
    expect(selectCount).toBe(1);

    // Verify it's the Language select
    const languageLabel = selects.first().locator('xpath=preceding-sibling::label[contains(text(), "Language")]');
    await expect(languageLabel).toBeVisible();

    // Verify no theme select exists
    const themeLabel = sectionContainer.locator('label:has-text("Theme")');
    await expect(themeLabel).not.toBeVisible();

    // Close settings
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('Settings modal contains other options but no theme controls', async ({ page }) => {
    // Open settings modal
    await page.click('[data-testid="settings-button"]');
    await page.waitForTimeout(500);

    // Verify settings modal has content
    const modal = page.locator('.modal-overlay').or(page.locator('.modal-content'));
    await expect(modal.first()).toBeVisible();

    const modalText = await modal.first().textContent();

    // Should have these sections
    expect(modalText).toContain('Appearance');
    expect(modalText).toContain('Notifications');
    expect(modalText).toContain('Language');
    expect(modalText).toContain('Compact Mode');

    // Should NOT have theme controls
    expect(modalText).not.toMatch(/theme|Theme/);

    // Close settings
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });
});
