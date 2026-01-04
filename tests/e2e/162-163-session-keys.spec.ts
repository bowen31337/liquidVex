/**
 * E2E tests for Features 162-163: Session Key Management
 *
 * Tests for:
 * - Feature 162: Session key creation for reduced signing
 * - Feature 163: Session key revocation
 */

import { test, expect } from '@playwright/test';

test.describe('Features 162-163: Session Key Management', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Navigate to app with test mode enabled
    await page.goto(`${baseURL}?testMode=true`);
    await page.waitForLoadState('networkidle');
  });

  test('Feature 162: Should create a session key with specified permissions', async ({ page }) => {
    // Open settings modal
    const settingsButton = page.locator('button[data-testid="settings-button"]');
    await settingsButton.click();

    // Wait for modal to open
    const settingsModal = page.locator('[data-testid="settings-modal"]');
    await expect(settingsModal).toBeVisible();

    // Enable session keys toggle
    const sessionKeysToggle = page.locator('input[data-testid="session-keys-toggle"]');
    await sessionKeysToggle.check();

    // Wait for session keys section to be visible
    const sessionKeysSection = page.locator('[data-testid="session-keys-section"]');
    await expect(sessionKeysSection).toBeVisible();

    // Click create session key button
    const createButton = page.locator('button[data-testid="create-session-key-button"]');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for create modal to appear
    const createModal = page.locator('[data-testid="create-session-key-modal"]');
    await expect(createModal).toBeVisible();

    // Fill in session key name
    const nameInput = page.locator('input[data-testid="session-key-name-input"]');
    await nameInput.fill('Test Session Key');

    // Select permissions (checkboxes)
    const tradePermission = page.locator('input[data-testid="permission-trade-checkbox"]');
    const viewPermission = page.locator('input[data-testid="permission-view-checkbox"]');

    await tradePermission.check();
    await viewPermission.check();

    // Confirm creation
    const confirmButton = page.locator('button[data-testid="confirm-session-key-button"]');
    await confirmButton.click();

    // Wait for creation to complete and modal to close
    await page.waitForTimeout(500);
    await expect(createModal).not.toBeVisible();

    // Verify session key appears in the list
    const sessionKeyList = page.locator('[data-testid="session-key-list"]');
    await expect(sessionKeyList).toBeVisible();

    const sessionKeyItem = page.locator('[data-testid="session-key-item"]', { hasText: 'Test Session Key' });
    await expect(sessionKeyItem).toBeVisible();

    // Verify key has active status
    const statusBadge = sessionKeyItem.locator('[data-testid="session-key-status"]');
    const statusText = await statusBadge.textContent();
    expect(statusText?.toLowerCase()).toContain('active');

    // Verify permissions are displayed
    const permissionsDisplay = sessionKeyItem.locator('[data-testid="session-key-permissions"]');
    await expect(permissionsDisplay).toBeVisible();
  });

  test('Feature 162: Should show error when creating session key with no permissions', async ({ page }) => {
    // Open settings modal
    await page.locator('button[data-testid="settings-button"]').click();
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();

    // Enable session keys toggle
    await page.locator('input[data-testid="session-keys-toggle"]').check();

    // Click create session key button
    await page.locator('button[data-testid="create-session-key-button"]').click();

    // Wait for create modal
    await expect(page.locator('[data-testid="create-session-key-modal"]')).toBeVisible();

    // Fill in name but don't select any permissions
    await page.locator('input[data-testid="session-key-name-input"]').fill('No Permissions Key');

    // Try to confirm without permissions
    const confirmButton = page.locator('button[data-testid="confirm-session-key-button"]');
    await confirmButton.click();

    // Verify error message appears
    const errorMessage = page.locator('[data-testid="session-key-error"]');
    await expect(errorMessage).toBeVisible();
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toContain('permission');
  });

  test('Feature 162: Should show error when creating session key with no name', async ({ page }) => {
    // Open settings modal
    await page.locator('button[data-testid="settings-button"]').click();
    await expect(page.locator('[data-testid="settings-modal"]')).toBeVisible();

    // Enable session keys toggle
    await page.locator('input[data-testid="session-keys-toggle"]').check();

    // Click create session key button
    await page.locator('button[data-testid="create-session-key-button"]').click();

    // Wait for create modal
    await expect(page.locator('[data-testid="create-session-key-modal"]')).toBeVisible();

    // Select permission but don't fill name
    await page.locator('input[data-testid="permission-trade-checkbox"]').check();

    // Try to confirm without name
    const confirmButton = page.locator('button[data-testid="confirm-session-key-button"]');
    await confirmButton.click();

    // Verify error message appears
    const errorMessage = page.locator('[data-testid="session-key-error"]');
    await expect(errorMessage).toBeVisible();
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toContain('name');
  });

  test('Feature 163: Should revoke an active session key', async ({ page }) => {
    // First, create a session key (setup)
    await page.locator('button[data-testid="settings-button"]').click();
    await page.locator('input[data-testid="session-keys-toggle"]').check();
    await page.locator('button[data-testid="create-session-key-button"]').click();
    await page.locator('input[data-testid="session-key-name-input"]').fill('Key to Revoke');
    await page.locator('input[data-testid="permission-trade-checkbox"]').check();
    await page.locator('button[data-testid="confirm-session-key-button"]').click();

    // Wait for creation
    await page.waitForTimeout(500);

    // Find the session key item
    const sessionKeyItem = page.locator('[data-testid="session-key-item"]', { hasText: 'Key to Revoke' });
    await expect(sessionKeyItem).toBeVisible();

    // Click revoke button
    const revokeButton = sessionKeyItem.locator('button[data-testid="revoke-session-key-button"]');
    await revokeButton.click();

    // Confirm revocation in confirmation dialog
    const revokeConfirmModal = page.locator('[data-testid="revoke-confirm-modal"]');
    await expect(revokeConfirmModal).toBeVisible();

    const confirmRevokeButton = page.locator('button[data-testid="confirm-revoke-button"]');
    await expect(confirmRevokeButton).toBeVisible();
    await confirmRevokeButton.click();

    // Wait for revocation to complete
    await page.waitForTimeout(500);

    // Verify session key shows as revoked
    const statusBadge = sessionKeyItem.locator('[data-testid="session-key-status"]');
    const statusText = await statusBadge.textContent();
    expect(statusText?.toLowerCase()).toContain('revoked');

    // Verify revoke button is hidden (since key is revoked)
    await expect(revokeButton).not.toBeVisible();
  });

  test('Feature 162-163: Should manage multiple session keys', async ({ page }) => {
    // Open settings and enable session keys
    await page.locator('button[data-testid="settings-button"]').click();
    await page.locator('input[data-testid="session-keys-toggle"]').check();

    // Create first session key
    await page.locator('button[data-testid="create-session-key-button"]').click();
    await page.locator('input[data-testid="session-key-name-input"]').fill('Key 1');
    await page.locator('input[data-testid="permission-trade-checkbox"]').check();
    await page.locator('button[data-testid="confirm-session-key-button"]').click();
    await page.waitForTimeout(300);

    // Create second session key
    await page.locator('button[data-testid="create-session-key-button"]').click();
    await page.locator('input[data-testid="session-key-name-input"]').fill('Key 2');
    await page.locator('input[data-testid="permission-view-checkbox"]').check();
    await page.locator('button[data-testid="confirm-session-key-button"]').click();
    await page.waitForTimeout(300);

    // Verify both keys are in the list
    const key1 = page.locator('[data-testid="session-key-item"]', { hasText: 'Key 1' });
    const key2 = page.locator('[data-testid="session-key-item"]', { hasText: 'Key 2' });

    await expect(key1).toBeVisible();
    await expect(key2).toBeVisible();

    // Verify list shows correct count
    const allKeys = page.locator('[data-testid="session-key-item"]');
    const count = await allKeys.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('Feature 162: Should allow canceling session key creation', async ({ page }) => {
    // Open settings modal
    await page.locator('button[data-testid="settings-button"]').click();
    await page.locator('input[data-testid="session-keys-toggle"]').check();

    // Click create session key button
    await page.locator('button[data-testid="create-session-key-button"]').click();

    // Wait for create modal
    const createModal = page.locator('[data-testid="create-session-key-modal"]');
    await expect(createModal).toBeVisible();

    // Fill in some data
    await page.locator('input[data-testid="session-key-name-input"]').fill('Test');
    await page.locator('input[data-testid="permission-trade-checkbox"]').check();

    // Click cancel
    await page.locator('button[data-testid="cancel-create-button"]').click();

    // Modal should be closed
    await expect(createModal).not.toBeVisible();

    // No keys should be in the list
    const sessionKeyList = page.locator('[data-testid="session-key-list"]');
    await expect(sessionKeyList).not.toBeVisible();
  });

  test('Feature 163: Should allow canceling revocation', async ({ page }) => {
    // Create a session key first
    await page.locator('button[data-testid="settings-button"]').click();
    await page.locator('input[data-testid="session-keys-toggle"]').check();
    await page.locator('button[data-testid="create-session-key-button"]').click();
    await page.locator('input[data-testid="session-key-name-input"]').fill('Cancel Test');
    await page.locator('input[data-testid="permission-trade-checkbox"]').check();
    await page.locator('button[data-testid="confirm-session-key-button"]').click();
    await page.waitForTimeout(500);

    // Click revoke
    const sessionKeyItem = page.locator('[data-testid="session-key-item"]', { hasText: 'Cancel Test' });
    const revokeButton = sessionKeyItem.locator('button[data-testid="revoke-session-key-button"]');
    await revokeButton.click();

    // Verify confirmation modal appears
    const revokeConfirmModal = page.locator('[data-testid="revoke-confirm-modal"]');
    await expect(revokeConfirmModal).toBeVisible();

    // Click cancel
    await page.locator('button[data-testid="cancel-revoke-button"]').click();

    // Modal should be closed
    await expect(revokeConfirmModal).not.toBeVisible();

    // Key should still be active
    const statusBadge = sessionKeyItem.locator('[data-testid="session-key-status"]');
    const statusText = await statusBadge.textContent();
    expect(statusText?.toLowerCase()).toContain('active');
  });
});
