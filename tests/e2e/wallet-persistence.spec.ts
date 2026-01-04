import { test, expect } from '@playwright/test';

test.describe('Wallet Persistence - Browser Refresh Preserves Connected Wallet', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // Navigate to the application with test mode
    await page.goto('http://localhost:3003?testMode=true');
    await page.waitForLoadState('networkidle');
  });

  test('should preserve wallet connection state after browser refresh', async ({ page }) => {
    // Test data for wallet state
    const mockWalletState = {
      address: '0x742d35Cc6634C0532925a3b8D000e3295a659390',
      isConnected: true,
      chainId: 42161, // Arbitrum
      timestamp: Date.now()
    };

    // Simulate a connected wallet by setting the persisted state in localStorage
    await page.evaluate((state) => {
      localStorage.setItem('liquidvex_wallet_state', JSON.stringify(state));
    }, mockWalletState);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify that the wallet connection is preserved
    const walletButton = page.getByTestId('wallet-connect-button');
    await expect(walletButton).toBeVisible();

    // Check that the button shows the connected wallet address
    const buttonText = await walletButton.textContent();
    expect(buttonText).toContain('0x742d...390');

    // Verify that the wallet modal is not visible (should be closed after refresh)
    const walletModal = page.locator('[data-testid="wallet-modal"]').or(page.locator('.bg-black.bg-opacity-50'));
    await expect(walletModal).not.toBeVisible();

    // Verify that the copy address button is available
    const copyButton = page.getByTestId('copy-address-button');
    await expect(copyButton).toBeVisible();
  });

  test('should clear stale wallet state after 24 hours', async ({ page }) => {
    // Create a wallet state that is older than 24 hours
    const staleWalletState = {
      address: '0x742d35Cc6634C0532925a3b8D000e3295a659390',
      isConnected: true,
      chainId: 42161,
      timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
    };

    // Set the stale state in localStorage
    await page.evaluate((state) => {
      localStorage.setItem('liquidvex_wallet_state', JSON.stringify(state));
    }, staleWalletState);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify that the wallet is not connected (stale state should be cleared)
    const walletButton = page.getByTestId('wallet-connect-button');
    await expect(walletButton).toBeVisible();

    // Check that the button shows "Connect Wallet" instead of an address
    const buttonText = await walletButton.textContent();
    expect(buttonText).toBe('Connect Wallet');

    // Verify that the copy address button is not visible
    const copyButton = page.getByTestId('copy-address-button');
    await expect(copyButton).not.toBeVisible();
  });

  test('should not save wallet state when not connected', async ({ page }) => {
    // Ensure no wallet state exists initially
    const initialState = await page.evaluate(() => {
      return localStorage.getItem('liquidvex_wallet_state');
    });
    expect(initialState).toBeNull();

    // Interact with the application (but don't connect wallet)
    const walletButton = page.getByTestId('wallet-connect-button');
    await expect(walletButton).toBeVisible();
    await expect(walletButton).toContainText('Connect Wallet');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify that no wallet state was saved
    const finalState = await page.evaluate(() => {
      return localStorage.getItem('liquidvex_wallet_state');
    });
    expect(finalState).toBeNull();
  });

  test('should save wallet state when connecting in test mode', async ({ page }) => {
    // Navigate to test mode
    await page.goto('/?testMode=true');
    await page.waitForLoadState('networkidle');

    // Set wallet state directly through the store (simulating connection)
    await page.evaluate(() => {
      // This would be handled by the actual wallet connection logic
      localStorage.setItem('liquidvex_wallet_state', JSON.stringify({
        address: '0x742d35Cc6634C0532925a3b8D000e3295a659390',
        isConnected: true,
        chainId: 42161,
        timestamp: Date.now()
      }));
    });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify that the wallet state persists in test mode
    const walletState = await page.evaluate(() => {
      return localStorage.getItem('liquidvex_wallet_state');
    });
    expect(walletState).toBeTruthy();

    const parsedState = JSON.parse(walletState as string);
    expect(parsedState.address).toBe('0x742d35Cc6634C0532925a3b8D000e3295a659390');
    expect(parsedState.isConnected).toBe(true);
  });

  test('should handle corrupted localStorage gracefully', async ({ page }) => {
    // Set corrupted data in localStorage
    await page.evaluate(() => {
      localStorage.setItem('liquidvex_wallet_state', 'invalid json');
    });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify that the application doesn't crash and shows connect button
    const walletButton = page.getByTestId('wallet-connect-button');
    await expect(walletButton).toBeVisible();
    await expect(walletButton).toContainText('Connect Wallet');

    // Verify that the corrupted data was cleared
    const walletState = await page.evaluate(() => {
      return localStorage.getItem('liquidvex_wallet_state');
    });
    expect(walletState).toBeNull();
  });
});