/**
 * Hook for wallet state persistence across browser refreshes
 * Uses localStorage to save and restore wallet connection state
 */

import { useEffect } from 'react';
import { useWalletStore } from '../stores/walletStore';

// Persistence key for localStorage
const WALLET_PERSISTENCE_KEY = 'liquidvex_wallet_state';

// Interface for the persisted wallet state
interface PersistedWalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  timestamp: number;
}

/**
 * Hook that handles wallet state persistence
 * Loads saved state on mount and saves state changes to localStorage
 */
export function useWalletPersistence() {
  const {
    address,
    isConnected,
    chainId,
    setAddress,
    setState,
    clearState,
  } = useWalletStore();

  // Load persisted wallet state on mount
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const savedState = localStorage.getItem(WALLET_PERSISTENCE_KEY);

        if (savedState) {
          const parsed: PersistedWalletState = JSON.parse(savedState);

          // Check if the saved state is recent (within last 24 hours)
          // This prevents using stale connection data
          const now = Date.now();
          const isRecent = (now - parsed.timestamp) < (24 * 60 * 60 * 1000); // 24 hours

          if (isRecent && parsed.address && parsed.isConnected) {
            console.log('Restoring wallet connection from localStorage:', parsed.address);
            setState({
              address: parsed.address,
              isConnected: true,
              chainId: parsed.chainId,
              connecting: false,
              error: null,
            });
          } else {
            // Clear stale data
            localStorage.removeItem(WALLET_PERSISTENCE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to load wallet state from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem(WALLET_PERSISTENCE_KEY);
      }
    };

    loadPersistedState();
  }, [setState]);

  // Save wallet state changes to localStorage
  useEffect(() => {
    const saveState = () => {
      try {
        const stateToSave: PersistedWalletState = {
          address,
          isConnected,
          chainId,
          timestamp: Date.now(),
        };

        localStorage.setItem(WALLET_PERSISTENCE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Failed to save wallet state to localStorage:', error);
      }
    };

    // Only save if we have a connected address
    if (isConnected && address) {
      saveState();
    }
  }, [address, isConnected, chainId]);

  // Clear persisted state when wallet is disconnected
  useEffect(() => {
    if (!isConnected || !address) {
      try {
        localStorage.removeItem(WALLET_PERSISTENCE_KEY);
        console.log('Cleared wallet state from localStorage');
      } catch (error) {
        console.error('Failed to clear wallet state from localStorage:', error);
      }
    }
  }, [isConnected, address]);

  // Cleanup function to clear state on unmount (optional)
  useEffect(() => {
    return () => {
      // Keep state on unmount - we want it to persist
    };
  }, []);
}