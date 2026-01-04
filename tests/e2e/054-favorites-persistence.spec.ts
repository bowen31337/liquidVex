import { test, expect } from '@playwright/test';

test.describe('Favorites and Recently Traded Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Clear localStorage to ensure clean state
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('Asset selector shows favorites and recently traded sections', async ({ page }) => {
    // Click on asset selector to open dropdown
    await page.click('[data-testid="asset-selector-trigger"]');

    // Verify dropdown is open
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Verify search input is present
    await expect(page.locator('[data-testid="asset-selector-search"]')).toBeVisible();

    // Verify asset list is visible
    await expect(page.locator('[data-testid="asset-list"]')).toBeVisible();

    // Verify some assets are displayed (should have mock data)
    const assetItems = page.locator('[data-testid="asset-item"]');
    await expect(assetItems.first()).toBeVisible();

    console.log('✓ Asset selector dropdown opens and shows assets');
  });

  test('User can favorite and unfavorite assets', async ({ page }) => {
    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown to be visible
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Get first asset item
    const firstAsset = page.locator('[data-testid="asset-item"]').first();
    const assetCoin = await firstAsset.getAttribute('data-coin');

    // Find the favorite button for this asset
    const favoriteButton = firstAsset.locator('[data-testid="favorite-button"]');

    // Verify button exists and is in unfavored state
    await expect(favoriteButton).toBeVisible();
    await expect(favoriteButton.locator('svg')).toHaveAttribute('fill', 'none');

    // Click to favorite the asset
    await favoriteButton.click();

    // Verify button is now filled (favorited)
    await expect(favoriteButton).toBeVisible();
    await expect(favoriteButton.locator('svg')).toHaveAttribute('fill', 'currentColor');

    // Verify favorite label appears
    const favoriteLabel = firstAsset.locator('text=Favorite');
    await expect(favoriteLabel).toBeVisible();

    // Click again to unfavorite
    await favoriteButton.click();

    // Verify button is no longer filled
    await expect(favoriteButton.locator('svg')).toHaveAttribute('fill', 'none');

    // Verify favorite label is gone
    await expect(favoriteLabel).not.toBeVisible();

    console.log('✓ User can favorite and unfavorite assets');
  });

  test('Favorites persist after page reload', async ({ page }) => {
    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown to be visible
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Favorite first asset
    const firstAsset = page.locator('[data-testid="asset-item"]').first();
    const favoriteButton = firstAsset.locator('[data-testid="favorite-button"]');

    await favoriteButton.click();

    // Verify it's favorited
    await expect(favoriteButton.locator('svg')).toHaveAttribute('fill', 'currentColor');
    await expect(firstAsset.locator('text=Favorite')).toBeVisible();

    // Reload the page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Open asset selector again
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Verify the asset is still favorited
    const reloadedFirstAsset = page.locator('[data-testid="asset-item"]').first();
    const reloadedFavoriteButton = reloadedFirstAsset.locator('[data-testid="favorite-button"]');

    await expect(reloadedFavoriteButton.locator('svg')).toHaveAttribute('fill', 'currentColor');
    await expect(reloadedFirstAsset.locator('text=Favorite')).toBeVisible();

    console.log('✓ Favorites persist after page reload');
  });

  test('Recently traded assets are shown', async ({ page }) => {
    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Select an asset to make it recently traded
    const firstAsset = page.locator('[data-testid="asset-item"]').first();
    await firstAsset.click();

    // Wait for selection to complete
    await page.waitForTimeout(500);

    // Reopen asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Verify the selected asset now has "Recent" label
    const selectedAsset = page.locator(`[data-coin="${await firstAsset.getAttribute('data-coin')}"]`);
    await expect(selectedAsset.locator('text=Recent')).toBeVisible();

    console.log('✓ Recently traded assets show "Recent" label');
  });

  test('Recently traded assets persist after page reload', async ({ page }) => {
    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Select an asset
    const firstAsset = page.locator('[data-testid="asset-item"]').first();
    const assetCoin = await firstAsset.getAttribute('data-coin');
    await firstAsset.click();

    // Wait for selection
    await page.waitForTimeout(500);

    // Reload the page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Verify the asset still has "Recent" label
    const reloadedAsset = page.locator(`[data-coin="${assetCoin}"]`);
    await expect(reloadedAsset.locator('text=Recent')).toBeVisible();

    console.log('✓ Recently traded assets persist after page reload');
  });

  test('Favorites appear at the top of the list', async ({ page }) => {
    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Favorite an asset that's not the first one
    const secondAsset = page.locator('[data-testid="asset-item"]').nth(1);
    const secondFavoriteButton = secondAsset.locator('[data-testid="favorite-button"]');

    await secondFavoriteButton.click();

    // Wait for state to update
    await page.waitForTimeout(500);

    // Verify it's favorited
    await expect(secondFavoriteButton.locator('svg')).toHaveAttribute('fill', 'currentColor');

    // Close and reopen dropdown to trigger sorting
    await page.keyboard.press('Escape');
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Get the first asset in the list
    const firstAssetInList = page.locator('[data-testid="asset-item"]').first();

    // The favorited asset should now be first
    const favoritedAssetCoin = await secondAsset.getAttribute('data-coin');
    const firstAssetCoin = await firstAssetInList.getAttribute('data-coin');

    expect(favoritedAssetCoin).toBe(firstAssetCoin);

    console.log('✓ Favorited assets appear at the top of the list');
  });

  test('Search still works with favorites', async ({ page }) => {
    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Favorite first asset
    const firstAsset = page.locator('[data-testid="asset-item"]').first();
    const firstFavoriteButton = firstAsset.locator('[data-testid="favorite-button"]');

    await firstFavoriteButton.click();

    // Verify it's favorited
    await expect(firstFavoriteButton.locator('svg')).toHaveAttribute('fill', 'currentColor');
    await expect(firstAsset.locator('text=Favorite')).toBeVisible();

    // Search for a specific asset (assuming BTC exists in mock data)
    const searchInput = page.locator('[data-testid="asset-selector-search"]');
    await searchInput.fill('BTC');

    // Wait for search results
    await page.waitForTimeout(500);

    // Verify search results are filtered
    const visibleAssets = page.locator('[data-testid="asset-item"]:visible');
    const count = await visibleAssets.count();

    expect(count).toBeGreaterThan(0);

    // Verify the favorited asset still appears if it matches search
    if (await firstAsset.isVisible()) {
      await expect(firstAsset.locator('text=Favorite')).toBeVisible();
    }

    console.log('✓ Search functionality works with favorites');
  });

  test('Clearing localStorage removes favorites', async ({ page }) => {
    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Favorite an asset
    const firstAsset = page.locator('[data-testid="asset-item"]').first();
    const favoriteButton = firstAsset.locator('[data-testid="favorite-button"]');

    await favoriteButton.click();

    // Verify it's favorited
    await expect(favoriteButton.locator('svg')).toHaveAttribute('fill', 'currentColor');

    // Clear localStorage via browser evaluation
    await page.evaluate(() => {
      localStorage.removeItem('liquidvex_favorites');
    });

    // Reload the page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Verify the asset is no longer favorited
    const reloadedFirstAsset = page.locator('[data-testid="asset-item"]').first();
    const reloadedFavoriteButton = reloadedFirstAsset.locator('[data-testid="favorite-button"]');

    await expect(reloadedFavoriteButton.locator('svg')).toHaveAttribute('fill', 'none');
    await expect(reloadedFirstAsset.locator('text=Favorite')).not.toBeVisible();

    console.log('✓ Clearing localStorage removes favorites');
  });

  test('Favorites and recently traded labels do not overlap', async ({ page }) => {
    // Open asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Favorite first asset
    const firstAsset = page.locator('[data-testid="asset-item"]').first();
    const firstFavoriteButton = firstAsset.locator('[data-testid="favorite-button"]');

    await firstFavoriteButton.click();

    // Verify it's favorited
    await expect(firstFavoriteButton.locator('svg')).toHaveAttribute('fill', 'currentColor');
    await expect(firstAsset.locator('text=Favorite')).toBeVisible();

    // Select the favorited asset to make it recently traded
    await firstAsset.click();

    // Wait for selection
    await page.waitForTimeout(500);

    // Reopen asset selector
    await page.click('[data-testid="asset-selector-trigger"]');

    // Wait for dropdown
    await expect(page.locator('[data-testid="asset-selector-dropdown"]')).toBeVisible();

    // Verify only "Favorite" label is shown (not "Recent" since it's already favorited)
    await expect(firstAsset.locator('text=Favorite')).toBeVisible();

    // Verify no "Recent" label appears for favorited assets
    const recentLabel = firstAsset.locator('text=Recent');
    const recentLabelExists = await recentLabel.isVisible();
    expect(recentLabelExists).toBe(false);

    console.log('✓ Favorites and recently traded labels do not overlap');
  });
});