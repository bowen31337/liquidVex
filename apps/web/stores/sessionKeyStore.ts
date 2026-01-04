/**
 * Zustand store for session key management
 */

import { create } from 'zustand';
import { SessionKey } from '@/types';
import { accountAPI } from '@/lib/api';

interface SessionKeyState {
  sessionKeys: SessionKey[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createSessionKey: (name: string, permissions: string[]) => Promise<void>;
  revokeSessionKey: (keyId: string) => Promise<void>;
  getSessionKeys: () => Promise<void>;
  setError: (error: string | null) => void;
  setState: (state: Partial<SessionKeyState>) => void;
}

export const useSessionKeyStore = create<SessionKeyState>((set, get) => ({
  sessionKeys: [],
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),
  setState: (state) => set(state),

  createSessionKey: async (name: string, permissions: string[]) => {
    try {
      set({ isLoading: true, error: null });

      const newKey = await accountAPI.createSessionKey(name, permissions);

      set((state) => ({
        sessionKeys: [...state.sessionKeys, newKey],
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session key';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  revokeSessionKey: async (keyId: string) => {
    try {
      set({ isLoading: true, error: null });

      await accountAPI.revokeSessionKey(keyId);

      set((state) => ({
        sessionKeys: state.sessionKeys.map((key) =>
          key.id === keyId ? { ...key, is_active: false } : key
        ),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke session key';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  getSessionKeys: async () => {
    try {
      set({ isLoading: true, error: null });

      // In a real implementation, this would fetch from the API
      // For now, we'll use the local storage approach from the Settings component
      const savedSettings = localStorage.getItem('liquidvex-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        set({
          sessionKeys: settings.sessionKeys?.keys || [],
          isLoading: false,
          error: null,
        });
      } else {
        set({ sessionKeys: [], isLoading: false, error: null });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get session keys';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));