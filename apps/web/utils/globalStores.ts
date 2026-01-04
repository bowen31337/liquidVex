/**
 * Global stores for testing - available immediately when module loads
 */

import { useOrderStore } from '../stores/orderStore';
import { useMarketStore } from '../stores/marketStore';
import { useWalletStore } from '../stores/walletStore';

// Expose stores to window immediately for testing
if (typeof window !== 'undefined') {
  // Only expose in test mode or development
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true' ||
                     process.env.NODE_ENV === 'test' ||
                     window.location.search.includes('testMode=true') ||
                     window.location.search.includes('testMode=1');

  if (isTestMode) {
    // Expose the store factory and current state
    (window as any).stores = {
      useOrderStore,
      getOrderStoreState: () => useOrderStore.getState(),
      getOrderStore: () => useOrderStore,
      useMarketStore,
      getMarketStoreState: () => useMarketStore.getState(),
      getMarketStore: () => useMarketStore,
      useWalletStore,
      getWalletStoreState: () => useWalletStore.getState(),
      getWalletStore: () => useWalletStore,
    };
  }
}