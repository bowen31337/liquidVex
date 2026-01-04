'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { useState, useEffect } from 'react';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { wagmiConfig } from '@/lib/wagmi';
import { useOrderStore } from '@/stores/orderStore';
import { useMarketStore } from '@/stores/marketStore';
import { useWalletStore } from '@/stores/walletStore';
import '@/utils/globalStores';

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
