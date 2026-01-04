/**
 * Toast notification system for displaying alerts and feedback
 */

'use client';

import { useToastStore } from '../../stores/toastStore';
import type { Toast } from '../../stores/toastStore';

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const dismissToast = useToastStore((state) => state.dismissToast);

  const bgColor = {
    success: 'bg-long/20 border-long',
    error: 'bg-short/20 border-short',
    warning: 'bg-warning/20 border-warning',
    info: 'bg-accent/20 border-accent',
  }[toast.type];

  const textColor = {
    success: 'text-long',
    error: 'text-short',
    warning: 'text-warning',
    info: 'text-accent',
  }[toast.type];

  return (
    <div
      data-testid="toast"
      className={`${bgColor} ${textColor} border px-4 py-3 rounded shadow-lg flex items-center justify-between min-w-[300px] max-w-md animate-slide-in`}
    >
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => dismissToast(toast.id)}
        className="ml-3 text-current opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

// Convenience hook
export const useToast = useToastStore;
