/**
 * Deposit Modal component for depositing funds
 */

'use client';

import { Modal } from './Modal';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  // In a real implementation, this would generate a deposit address
  // For now, we show instructions for testnet deposit

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deposit Funds">
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-surface-elevated border border-border rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-2">Deposit Instructions</h3>
          <p className="text-sm text-text-secondary mb-3">
            To deposit funds to your liquidVex account, follow these steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
            <li>Send USDC to your connected wallet address</li>
            <li>Ensure you're on the Arbitrum network</li>
            <li>Minimum deposit: 10 USDC</li>
            <li>Deposit will be reflected in your account balance within 2-3 minutes</li>
          </ol>
        </div>

        {/* Deposit Address (placeholder) */}
        <div className="bg-surface-elevated border border-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-text-secondary">Your Deposit Address</span>
            <span className="text-xs text-text-tertiary">(Connect wallet first)</span>
          </div>
          <div className="text-xs font-mono text-text-tertiary bg-surface rounded p-2 border border-border">
            Please connect your wallet to view your deposit address
          </div>
        </div>

        {/* Network Info */}
        <div className="bg-surface-elevated border border-border rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-2">Network Information</h3>
          <div className="space-y-1 text-sm text-text-secondary">
            <div className="flex justify-between">
              <span>Network:</span>
              <span className="text-text-primary">Arbitrum One</span>
            </div>
            <div className="flex justify-between">
              <span>Chain ID:</span>
              <span className="text-text-primary">42161</span>
            </div>
            <div className="flex justify-between">
              <span>Asset:</span>
              <span className="text-text-primary">USDC</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
          <p className="text-sm text-warning">
            ⚠️ <strong>Important:</strong> Only send funds from Arbitrum-compatible wallets.
            Sending from other networks may result in lost funds.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-surface-elevated border border-border rounded hover:bg-border transition-colors text-text-primary"
          >
            Close
          </button>
          <button
            onClick={() => {
              // In a real app, this would open wallet or copy address
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-long text-white rounded hover:bg-long-muted transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </Modal>
  );
}
