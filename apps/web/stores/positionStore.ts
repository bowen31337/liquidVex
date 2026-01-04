/**
 * Position management store - manages positions and account state
 */

import { create } from 'zustand';
import type { Position, AccountState } from '../types/account';
import { accountAPI, tradeAPI } from '../lib/api';

interface PositionState {
  // Positions
  positions: Position[];

  // Account state
  accountState: AccountState | null;

  // Loading states
  isLoadingPositions: boolean;
  isLoadingAccount: boolean;

  // Wallet address
  walletAddress: string | null;

  // Actions
  setWalletAddress: (address: string | null) => void;

  fetchPositions: (address: string) => Promise<void>;
  fetchAccountState: (address: string) => Promise<void>;

  closePosition: (coin: string) => Promise<void>;

  setPositions: (positions: Position[]) => void;
  setAccountState: (state: AccountState | null) => void;
}

export const usePositionStore = create<PositionState>((set, get) => ({
  // Initial state
  positions: [],
  accountState: null,
  isLoadingPositions: false,
  isLoadingAccount: false,
  walletAddress: null,

  // Actions
  setWalletAddress: (address: string | null) => {
    set({ walletAddress: address });
    if (address) {
      get().fetchPositions(address);
      get().fetchAccountState(address);
    } else {
      set({ positions: [], accountState: null });
    }
  },

  fetchPositions: async (address: string) => {
    set({ isLoadingPositions: true });
    try {
      const response = await accountAPI.getPositions(address);
      set({ positions: response.positions });
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      set({ positions: [] });
    } finally {
      set({ isLoadingPositions: false });
    }
  },

  fetchAccountState: async (address: string) => {
    set({ isLoadingAccount: true });
    try {
      const state = await accountAPI.getState(address);
      set({ accountState: state });
    } catch (error) {
      console.error('Failed to fetch account state:', error);
      set({ accountState: null });
    } finally {
      set({ isLoadingAccount: false });
    }
  },

  closePosition: async (coin: string) => {
    try {
      await tradeAPI.closePosition(coin);

      // Refresh positions
      const { walletAddress } = get();
      if (walletAddress) {
        get().fetchPositions(walletAddress);
      }
    } catch (error) {
      console.error('Failed to close position:', error);
    }
  },

  setPositions: (positions: Position[]) => {
    set({ positions });
  },

  setAccountState: (state: AccountState | null) => {
    set({ accountState: state });
  },
}));
