/**
 * Order Modify Modal
 * Allows users to modify existing order price and/or size
 */

'use client';

import { useState, useEffect } from 'react';
import { Order } from '../../types';

interface OrderModifyModalProps {
  isOpen: boolean;
  order: Order | null;
  onConfirm: (newPx?: number, newSz?: number) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function OrderModifyModal({
  isOpen,
  order,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: OrderModifyModalProps) {
  if (!isOpen || !order) return null;

  const [newPrice, setNewPrice] = useState<string>('');
  const [newSize, setNewSize] = useState<string>('');

  // Initialize with current values when modal opens
  useEffect(() => {
    if (isOpen && order) {
      setNewPrice(order.limitPx.toString());
      setNewSize(order.sz.toString());
    }
  }, [isOpen, order]);

  const sideColor = order.side === 'B' ? 'text-long' : 'text-short';
  const sideBgColor = order.side === 'B' ? 'bg-long' : 'bg-short';
  const sideLabel = order.side === 'B' ? 'BUY' : 'SELL';

  const hasChanges = () => {
    const priceChanged = parseFloat(newPrice) !== order.limitPx;
    const sizeChanged = parseFloat(newSize) !== order.sz;
    return priceChanged || sizeChanged;
  };

  const handleSubmit = () => {
    if (!newPrice || !newSize || parseFloat(newPrice) <= 0 || parseFloat(newSize) <= 0) {
      alert('Please enter valid price and size values');
      return;
    }

    const priceChanged = parseFloat(newPrice) !== order.limitPx;
    const sizeChanged = parseFloat(newSize) !== order.sz;

    onConfirm(
      priceChanged ? parseFloat(newPrice) : undefined,
      sizeChanged ? parseFloat(newSize) : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div data-testid="order-modify-modal" className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Modify Order
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current Order Info */}
          <div className="bg-surface-elevated border border-border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Current Order</span>
              <span className={`${sideColor} font-bold text-lg uppercase`}>
                {sideLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-text-secondary">Type:</span>
                <span className="ml-2 font-medium uppercase">{order.orderType}</span>
              </div>
              <div>
                <span className="text-text-secondary">Asset:</span>
                <span className="ml-2 font-mono">{order.coin}</span>
              </div>
              <div>
                <span className="text-text-secondary">Price:</span>
                <span className="ml-2 font-mono">${order.limitPx.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-text-secondary">Size:</span>
                <span className="ml-2 font-mono">{order.sz.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* New Price Input */}
          <div>
            <label className="block text-text-secondary text-sm mb-1">
              New Price
            </label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded font-mono text-text-primary focus:outline-none focus:border-accent"
              disabled={isSubmitting}
            />
          </div>

          {/* New Size Input */}
          <div>
            <label className="block text-text-secondary text-sm mb-1">
              New Size
            </label>
            <input
              type="number"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              step="0.0001"
              min="0"
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded font-mono text-text-primary focus:outline-none focus:border-accent"
              disabled={isSubmitting}
            />
          </div>

          {/* Info */}
          <div className="bg-accent/10 border border-accent/30 rounded p-3">
            <p className="text-sm text-accent">
              ℹ️ Leave a field unchanged to keep the current value. Both fields can be modified simultaneously.
            </p>
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
            onClick={handleSubmit}
            disabled={isSubmitting || !hasChanges()}
            className={`flex-1 py-2 px-4 ${sideBgColor} text-white rounded font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⌛</span>
                Modifying...
              </>
            ) : (
              <>
                <span>✏️</span>
                Update Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
