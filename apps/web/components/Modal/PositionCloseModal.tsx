/**
 * Position Close Confirmation Modal
 * Displays position details for user confirmation before closing
 */

'use client';

import { Position } from '../../types';

interface PositionCloseModalProps {
  isOpen: boolean;
  position: Position | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PositionCloseModal({
  isOpen,
  position,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: PositionCloseModalProps) {
  if (!isOpen || !position) return null;

  const sideColor = position.side === 'long' ? 'text-long' : 'text-short';
  const sideBgColor = position.side === 'long' ? 'bg-long' : 'bg-short';
  const sideLabel = position.side === 'long' ? 'LONG' : 'SHORT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in" data-testid="position-close-modal">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Confirm Position Close
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Warning */}
          <div className="bg-short/10 border border-short/30 rounded p-3">
            <p className="text-sm text-short">
              ⚠️ This will close your entire position at market price.
            </p>
          </div>

          {/* Side and Type */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Side</span>
            <span className={`${sideColor} font-bold text-lg uppercase`}>
              {sideLabel}
            </span>
          </div>

          <div className="border-t border-border my-2" />

          {/* Asset */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Asset</span>
            <span className="text-text-primary font-medium">{position.coin}</span>
          </div>

          {/* Size */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Size</span>
            <span className="text-text-primary font-mono font-medium">
              {position.sz.toFixed(4)}
            </span>
          </div>

          {/* Entry Price */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Entry Price</span>
            <span className="text-text-primary font-mono font-medium">
              ${position.entryPx.toFixed(2)}
            </span>
          </div>

          {/* Leverage */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Leverage</span>
            <span className="text-text-primary font-medium">{position.leverage}x</span>
          </div>

          {/* Margin */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Margin Used</span>
            <span className="text-text-primary font-mono font-medium">
              ${position.marginUsed.toFixed(2)}
            </span>
          </div>

          {/* Current PnL */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Unrealized PnL</span>
            <span className={`font-mono font-medium ${position.unrealizedPnl >= 0 ? 'text-long' : 'text-short'}`}>
              {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
            </span>
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
                Closing...
              </>
            ) : (
              <>
                <span>✕</span>
                Close Position
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
