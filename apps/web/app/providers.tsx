'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { FavoritesProvider } from '@/contexts/FavoritesContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider>
        {children}
      </FavoritesProvider>
    </QueryClientProvider>
  );
}
