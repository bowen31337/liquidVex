/**
 * Global stores for testing - available immediately when module loads
 */

import { useOrderStore, useUIStore } from '../stores/orderStore';
import { useMarketStore } from '../stores/marketStore';
import { useWalletStore } from '../stores/walletStore';

// Expose stores to window immediately for testing
if (typeof window !== 'undefined') {
  // Check for test mode - handle various detection methods
  const isTestMode = (() => {
    // Check URL parameters first (most reliable in browser)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('testMode') === 'true' || urlParams.has('testMode')) {
      return true;
    }

    // Check environment variables (may not be available in browser)
    if (typeof process !== 'undefined') {
      if (process.env?.NEXT_PUBLIC_TEST_MODE === 'true') return true;
      if (process.env?.NODE_ENV === 'test') return true;
    }

    // Check if running in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      return true;
    }

    return false;
  })();

  if (isTestMode) {
    // Expose the store factory and current state
    (window as any).stores = {
      useOrderStore,
      getOrderStoreState: () => useOrderStore.getState(),
      getOrderStore: () => useOrderStore,
      useUIStore,
      getUIStoreState: () => useUIStore.getState(),
      getUIStore: () => useUIStore,
      useMarketStore,
      getMarketStoreState: () => useMarketStore.getState(),
      getMarketStore: () => useMarketStore,
      useWalletStore,
      getWalletStoreState: () => useWalletStore.getState(),
      getWalletStore: () => useWalletStore,
    };

    console.log('[globalStores] Stores exposed for testing');
  }
}