/**
 * Zustand store for wallet connection
 */

import { create } from 'zustand';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  connecting: boolean;
  error: string | null;

  connect: () => Promise<void>;
  disconnect: () => void;
  setAddress: (address: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  connecting: false,
  error: null,

  connect: async () => {
    set({ connecting: true, error: null });
    try {
      // Mock wallet connection - in real implementation, use wagmi/viem
      // For now, simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 500));

      // In a real app, this would come from wagmi
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      set({
        address: mockAddress,
        isConnected: true,
        connecting: false,
        error: null
      });
    } catch (err) {
      set({
        address: null,
        isConnected: false,
        connecting: false,
        error: err instanceof Error ? err.message : 'Connection failed'
      });
    }
  },

  disconnect: () => {
    set({
      address: null,
      isConnected: false,
      connecting: false,
      error: null
    });
  },

  setAddress: (address) => set({ address }),
  setConnecting: (connecting) => set({ connecting }),
  setError: (error) => set({ error }),
}));
