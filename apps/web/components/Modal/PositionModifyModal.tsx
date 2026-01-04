/**
 * Position Modify Modal
 * Allows users to add to or reduce from existing positions
 */

'use client';

import { useState } from 'react';
import { Position } from '../../types';

interface PositionModifyModalProps {
  isOpen: boolean;
  position: Position | null;
  onConfirm: (addSize?: number, reduceSize?: number) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PositionModifyModal({
  isOpen,
  position,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: PositionModifyModalProps) {
  if (!isOpen || !position) return null;

  const [mode, setMode] = useState<'add' | 'reduce'>('add');
  const [size, setSize] = useState<string>('');

  const sideColor = position.side === 'long' ? 'text-long' : 'text-short';
  const sideBgColor = position.side === 'long' ? 'bg-long' : 'bg-short';
  const sideLabel = position.side === 'long' ? 'LONG' : 'SHORT';

  const handleSubmit = () => {
    if (!size || parseFloat(size) <= 0) {
      alert('Please enter a valid size');
      return;
    }

    const sizeNum = parseFloat(size);
    if (mode === 'reduce' && sizeNum > position.sz) {
      alert('Cannot reduce more than current position size');
      return;
    }

    onConfirm(mode === 'add' ? sizeNum : undefined, mode === 'reduce' ? sizeNum : undefined);
  };

  const formatPnl = (pnl: number) => {
    const cls = pnl >= 0 ? 'text-long' : 'text-short';
    return <span className={cls}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span>;
  };

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
            Modify Position
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('add')}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                mode === 'add'
                  ? 'bg-long/20 text-long border border-long'
                  : 'bg-surface-elevated text-text-primary border border-border'
              }`}
            >
              Add to Position
            </button>
            <button
              onClick={() => setMode('reduce')}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                mode === 'reduce'
                  ? 'bg-short/20 text-short border border-short'
                  : 'bg-surface-elevated text-text-primary border border-border'
              }`}
            >
              Reduce Position
            </button>
          </div>

          {/* Current Position Info */}
          <div className="bg-surface-elevated border border-border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Current Position</span>
              <span className={`${sideColor} font-bold text-lg uppercase`}>
                {sideLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-text-secondary">Size:</span>
                <span className="ml-2 font-mono">{position.sz.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-text-secondary">Entry:</span>
                <span className="ml-2 font-mono">${position.entryPx.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-text-secondary">Leverage:</span>
                <span className="ml-2">{position.leverage}x</span>
              </div>
              <div>
                <span className="text-text-secondary">PnL:</span>
                {formatPnl(position.unrealizedPnl)}
              </div>
            </div>
          </div>

          {/* Size Input */}
          <div>
            <label className="block text-text-secondary text-sm mb-1">
              {mode === 'add' ? 'Size to Add' : 'Size to Reduce'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="0.0000"
                step="0.0001"
                min="0"
                className="flex-1 px-3 py-2 bg-surface-elevated border border-border rounded font-mono text-text-primary focus:outline-none focus:border-accent"
                disabled={isSubmitting}
              />
              <button
                onClick={() => setSize(String(position.sz))}
                className="px-3 py-2 bg-surface-elevated border border-border rounded text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                disabled={mode === 'add' || isSubmitting}
              >
                Max
              </button>
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {mode === 'reduce' && (
                <span>Max reduction: {position.sz.toFixed(4)}</span>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-warning/10 border border-warning/30 rounded p-3">
            <p className="text-sm text-warning">
              ⚠️ Position modification will execute at market price.
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
            disabled={isSubmitting || !size || parseFloat(size) <= 0}
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
                {mode === 'add' ? 'Add to Position' : 'Reduce Position'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}