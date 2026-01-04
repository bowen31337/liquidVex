/**
 * Wallet Connection Modal
 */

'use client';

import { useWalletSync } from '../../stores/walletStore';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const wagmiWallet = useWalletSync();
  const { connectMetaMask, connectWalletConnect, connectError, isConnecting } = wagmiWallet;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 w-96 border border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Connect Wallet</h2>

        {connectError && (
          <div className="mb-4 p-3 bg-warning/20 border border-warning/50 rounded text-warning text-sm">
            {connectError.message}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={async () => {
              await connectMetaMask();
              onClose();
            }}
            disabled={isConnecting}
            className="w-full p-3 bg-surface-elevated rounded-lg border border-border hover:bg-surface/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
                <div>
                  <div className="text-text-primary font-medium">MetaMask</div>
                  <div className="text-text-tertiary text-sm">Browser extension</div>
                </div>
              </div>
              {isConnecting && <div className="w-4 h-4 border-2 border-text-tertiary border-t-long rounded-full animate-spin" />}
            </div>
          </button>

          <button
            onClick={async () => {
              await connectWalletConnect();
              onClose();
            }}
            disabled={isConnecting}
            className="w-full p-3 bg-surface-elevated rounded-lg border border-border hover:bg-surface/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">WC</span>
                </div>
                <div>
                  <div className="text-text-primary font-medium">WalletConnect</div>
                  <div className="text-text-tertiary text-sm">Mobile wallets</div>
                </div>
              </div>
              {isConnecting && <div className="w-4 h-4 border-2 border-text-tertiary border-t-long rounded-full animate-spin" />}
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full p-2 text-text-tertiary hover:text-text-primary text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}