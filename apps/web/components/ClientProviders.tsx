'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { useState, useEffect } from 'react';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { wagmiConfig } from '@/lib/wagmi';

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

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render WagmiProvider on client side to avoid SSR issues with WalletConnect
  // During SSR, render a placeholder to avoid calling wagmi hooks without provider
  if (!mounted) {
    return (
      <QueryClientProvider client={queryClient}>
        <FavoritesProvider>
          {/* Render a minimal layout during SSR - children that don't use wagmi hooks */}
          <div suppressHydrationWarning>{children}</div>
        </FavoritesProvider>
      </QueryClientProvider>
    );
  }

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
