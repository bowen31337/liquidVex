/**
 * Order Confirmation Modal
 * Displays order details for user confirmation before submission
 */

'use client';

import { OrderFormState } from '../../stores/orderStore';

interface OrderConfirmModalProps {
  isOpen: boolean;
  orderForm: OrderFormState;
  coin: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function OrderConfirmModal({
  isOpen,
  orderForm,
  coin,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: OrderConfirmModalProps) {
  if (!isOpen) return null;

  const sideColor = orderForm.side === 'buy' ? 'text-long' : 'text-short';
  const sideBgColor = orderForm.side === 'buy' ? 'bg-long' : 'bg-short';
  const sideLabel = orderForm.side === 'buy' ? 'BUY / LONG' : 'SELL / SHORT';
  const price = parseFloat(orderForm.price).toFixed(2);
  const size = orderForm.size;
  const value = (parseFloat(orderForm.price) * parseFloat(size || '0')).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Confirm Order
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Side and Type */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Side</span>
            <span className={`${sideColor} font-bold text-lg uppercase`}>
              {sideLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Type</span>
            <span className="text-text-primary font-medium uppercase">
              {orderForm.type}
            </span>
          </div>

          <div className="border-t border-border my-2" />

          {/* Asset */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Asset</span>
            <span className="text-text-primary font-medium">{coin}</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Price</span>
            <span className="text-text-primary font-mono font-medium">
              ${price}
            </span>
          </div>

          {/* Size */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Size</span>
            <span className="text-text-primary font-mono font-medium">
              {size}
            </span>
          </div>

          {/* Order Value */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Order Value</span>
            <span className="text-text-primary font-mono font-bold">
              ${value}
            </span>
          </div>

          {/* Options */}
          <div className="border-t border-border pt-3 space-y-1">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Leverage</span>
              <span className="text-text-primary">{orderForm.leverage}x</span>
            </div>
            {orderForm.reduceOnly && (
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Reduce Only</span>
                <span className="text-long">Yes</span>
              </div>
            )}
            {orderForm.postOnly && orderForm.type === 'limit' && (
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Post Only</span>
                <span className="text-accent">Yes</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2 px-4 bg-surface-elevated text-text-primary rounded font-medium hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`flex-1 py-2 px-4 ${sideBgColor} text-white rounded font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⌛</span>
                Processing...
              </>
            ) : (
              <>
                <span>✓</span>
                Confirm Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
