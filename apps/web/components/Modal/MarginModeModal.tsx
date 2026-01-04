/**
 * Margin Mode Selection Modal
 * Allows users to switch between cross and isolated margin modes
 */

'use client';

import { useState } from 'react';
import { Position } from '../../types';

interface MarginModeModalProps {
  isOpen: boolean;
  position: Position | null;
  onConfirm: (marginType: 'cross' | 'isolated') => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function MarginModeModal({
  isOpen,
  position,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: MarginModeModalProps) {
  if (!isOpen || !position) return null;

  const [selectedMode, setSelectedMode] = useState<'cross' | 'isolated'>(position.marginType);

  const sideColor = position.side === 'long' ? 'text-long' : 'text-short';
  const sideLabel = position.side === 'long' ? 'LONG' : 'SHORT';

  const handleConfirm = () => {
    onConfirm(selectedMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in" data-testid="margin-mode-modal">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Set Margin Mode
          </h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current Position Info */}
          <div className="bg-surface-elevated border border-border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Position</span>
              <span className={`${sideColor} font-bold text-lg uppercase`}>
                {sideLabel} {position.coin}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-text-secondary">Size:</span>
                <span className="ml-2 font-mono">{position.sz.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-text-secondary">Current Mode:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  position.marginType === 'cross'
                    ? 'bg-long/20 text-long'
                    : 'bg-short/20 text-short'
                }`}>
                  {position.marginType.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="block text-text-secondary text-sm font-medium">
              Select Margin Mode
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Cross Margin */}
              <button
                onClick={() => setSelectedMode('cross')}
                className={`p-4 text-left rounded-lg border transition-all ${
                  selectedMode === 'cross'
                    ? 'border-long bg-long/10'
                    : 'border-border hover:border-long/50 hover:bg-long/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-long">Cross</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    selectedMode === 'cross' ? 'bg-long text-white' : 'bg-long/20 text-long'
                  }`}>
                    {selectedMode === 'cross' ? 'Selected' : 'Select'}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary">
                  Your entire account balance is used as collateral. Higher potential
                  for liquidation but allows for better capital efficiency.
                </p>
              </button>

              {/* Isolated Margin */}
              <button
                onClick={() => setSelectedMode('isolated')}
                className={`p-4 text-left rounded-lg border transition-all ${
                  selectedMode === 'isolated'
                    ? 'border-short bg-short/10'
                    : 'border-border hover:border-short/50 hover:bg-short/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-short">Isolated</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    selectedMode === 'isolated' ? 'bg-short text-white' : 'bg-short/20 text-short'
                  }`}>
                    {selectedMode === 'isolated' ? 'Selected' : 'Select'}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary">
                  Only the margin allocated to this position is used as collateral.
                  Limits risk to the position size but requires careful margin management.
                </p>
              </button>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="bg-warning/10 border border-warning/30 rounded p-3">
            <p className="text-sm text-warning">
              ⚠️ Changing margin mode may affect your liquidation price and risk profile.
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
            onClick={handleConfirm}
            disabled={isSubmitting || selectedMode === position.marginType}
            className={`flex-1 py-2 px-4 ${
              selectedMode === 'cross' ? 'bg-long' : 'bg-short'
            } text-white rounded font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⌛</span>
                Updating...
              </>
            ) : (
              <>
                <span>⚙️</span>
                Set {selectedMode.toUpperCase()} Margin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}