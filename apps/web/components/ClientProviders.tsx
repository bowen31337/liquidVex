'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { useState, useEffect } from 'react';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { wagmiConfig } from '@/lib/wagmi';
import { useOrderStore } from '@/stores/orderStore';
import { useMarketStore } from '@/stores/marketStore';
import { useWalletStore } from '@/stores/walletStore';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        gcTime: 5 * 60 * 1000, // 5 minutes default cache time
        staleTime: 30 * 1000,  // 30 seconds default stale time
      },
      mutations: {
        retry: 2,
      },
    },
  }));

  // Expose stores to window for testing
  // Run immediately on mount to ensure stores are available early
  if (typeof window !== 'undefined') {
    // Only expose in test mode or development
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true' ||
                       process.env.NODE_ENV === 'test' ||
                       window.location.search.includes('testMode=true') ||
                       window.location.search.includes('testMode=1');

    if (isTestMode && !(window as any).stores) {
      // Expose the store factory and current state
      (window as any).stores = {
        useOrderStore: useOrderStore,
        getOrderStoreState: () => useOrderStore.getState(),
        useMarketStore: useMarketStore,
        getMarketStoreState: () => useMarketStore.getState(),
        useWalletStore: useWalletStore,
        getWalletStoreState: () => useWalletStore.getState(),
      };
    }
  }

  // Render providers directly - no client-side blocking
  // WagmiProvider and QueryClientProvider handle SSR correctly
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FavoritesProvider>
          {children}
        </FavoritesProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
