/**
 * Zustand store for toast notifications
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (type, message, duration) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, type, message, duration };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-dismiss after duration
    const toastDuration = duration || 3000;
    setTimeout(() => {
      get().dismissToast(id);
    }, toastDuration);

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  success: (message, duration) => get().showToast('success', message, duration),
  error: (message, duration) => get().showToast('error', message, duration),
  warning: (message, duration) => get().showToast('warning', message, duration),
  info: (message, duration) => get().showToast('info', message, duration),
}));
