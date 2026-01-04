/**
 * Withdrawal Modal component for withdrawing funds
 */

'use client';

import { useState } from 'react';
import { Modal } from './Modal';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  const handleWithdraw = () => {
    // In a real implementation, this would:
    // 1. Validate the withdrawal amount
    // 2. Validate the withdrawal address
    // 3. Create a withdrawal transaction
    // 4. Submit to Hyperliquid API
    // For now, just close the modal
    console.log('Withdrawal:', { amount: withdrawAmount, address: withdrawAddress });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds">
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-surface-elevated border border-border rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-2">Withdrawal Instructions</h3>
          <p className="text-sm text-text-secondary mb-3">
            To withdraw funds from your liquidVex account:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
            <li>Enter the amount you wish to withdraw</li>
            <li>Provide your destination wallet address</li>
            <li>Ensure the address supports USDC on Arbitrum</li>
            <li>Withdrawals typically complete within 5-10 minutes</li>
          </ol>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-surface-elevated border border-border rounded-lg p-4 space-y-3">
          {/* Amount Input */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Withdrawal Amount (USDC)
            </label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary font-mono focus:outline-none focus:border-accent"
              data-testid="withdrawal-amount-input"
            />
          </div>

          {/* Address Input */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Destination Address
            </label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary font-mono text-sm focus:outline-none focus:border-accent"
              data-testid="withdrawal-address-input"
            />
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
            <div className="flex justify-between">
              <span>Minimum Withdrawal:</span>
              <span className="text-text-primary">10 USDC</span>
            </div>
            <div className="flex justify-between">
              <span>Withdrawal Fee:</span>
              <span className="text-text-primary">~0.5 USDC</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
          <p className="text-sm text-warning">
            ⚠️ <strong>Important:</strong> Only withdraw to Arbitrum-compatible wallets.
            Double-check the destination address before confirming.
            Withdrawals cannot be reversed once submitted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-surface-elevated border border-border rounded hover:bg-border transition-colors text-text-primary"
            data-testid="withdrawal-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={!withdrawAmount || !withdrawAddress}
            className="flex-1 px-4 py-2 bg-short text-white rounded hover:bg-short-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="withdrawal-confirm-button"
          >
            Confirm Withdrawal
          </button>
        </div>
      </div>
    </Modal>
  );
}
