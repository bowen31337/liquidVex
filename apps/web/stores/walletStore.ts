/**
 * Zustand store for wallet connection with persistence
 */

import { create } from 'zustand';
import { useWallet } from '../hooks/useWallet';
import { useContext } from 'react';
import { WagmiContext } from 'wagmi';
import { useWalletPersistence } from '../hooks/useWalletPersistence';

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
  setState: (state: Partial<WalletState>) => void;
  clearState: () => void;
}

// Create the store with persistence
export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  isConnected: false,
  connecting: false,
  error: null,
  chainId: null,

  setAddress: (address) => set({ address }),
  setConnecting: (connecting) => set({ connecting }),
  setError: (error) => set({ error }),
  setChainId: (chainId) => set({ chainId }),
  setState: (state) => set(state),
  clearState: () => set({
    address: null,
    isConnected: false,
    connecting: false,
    error: null,
    chainId: null,
  }),
}));

// Export a hook that syncs with wagmi and handles persistence
export function useWalletSync() {
  const wagmiWallet = useWallet();
  const storeState = useWalletStore();

  // Add persistence functionality
  useWalletPersistence();

  // Check if we're in test mode
  const isTestMode = typeof window !== 'undefined' &&
    (window.location.search.includes('testMode=true') ||
     window.location.search.includes('testMode=1'));

  // In test mode, return store state directly
  if (isTestMode) {
    return {
      address: storeState.address,
      isConnected: storeState.isConnected,
      isConnecting: storeState.connecting,
      connectError: storeState.error ? { message: storeState.error } : null,
      chain: storeState.chainId ? { id: storeState.chainId } : null,
      disconnect: () => useWalletStore.setState({ address: null, isConnected: false, connecting: false }),
      // Add other wagmi methods as no-ops
      connect: async () => {},
      signMessage: async () => '',
      signTypedData: async () => '',
    } as any;
  }

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
