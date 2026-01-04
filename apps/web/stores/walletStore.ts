/**
 * Zustand store for wallet connection
 */

import { create } from 'zustand';
import { useWallet } from '../hooks/useWallet';
import { useContext } from 'react';
import { WagmiContext } from 'wagmi';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  connecting: boolean;
  error: string | null;
  chainId: number | null;

  // Actions
  setAddress: (address: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  setChainId: (chainId: number | null) => void;
}

// Create the store
export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  connecting: false,
  error: null,
  chainId: null,

  setAddress: (address) => set({ address }),
  setConnecting: (connecting) => set({ connecting }),
  setError: (error) => set({ error }),
  setChainId: (chainId) => set({ chainId }),
}));

// Export a hook that syncs with wagmi
export function useWalletSync() {
  const wagmiWallet = useWallet();
  const storeState = useWalletStore();

  // Sync state directly but only if values actually changed
  // This avoids the infinite loop that useEffect can cause
  const newAddress = wagmiWallet.address || null;
  const newIsConnected = wagmiWallet.isConnected;
  const newConnecting = wagmiWallet.isConnecting;
  const newError = wagmiWallet.connectError?.message || null;
  const newChainId = wagmiWallet.chain?.id || null;

  if (storeState.address !== newAddress ||
      storeState.isConnected !== newIsConnected ||
      storeState.connecting !== newConnecting ||
      storeState.error !== newError ||
      storeState.chainId !== newChainId) {
    useWalletStore.setState({
      address: newAddress,
      isConnected: newIsConnected,
      connecting: newConnecting,
      error: newError,
      chainId: newChainId,
    });
  }

  // Return wagmi wallet methods for direct usage
  return wagmiWallet;
}
