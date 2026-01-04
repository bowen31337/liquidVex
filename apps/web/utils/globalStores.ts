/**
 * Global stores for testing - available immediately when module loads
 */

import { useOrderStore, useUIStore } from '../stores/orderStore';
import { useMarketStore } from '../stores/marketStore';
import { useWalletStore } from '../stores/walletStore';

// Expose stores to window immediately for testing
if (typeof window !== 'undefined') {
  // Always expose stores for testing purposes - this is a dev/testing utility
  // The stores are needed for E2E tests to populate data and verify state
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
