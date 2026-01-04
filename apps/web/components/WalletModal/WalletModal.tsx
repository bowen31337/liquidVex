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
  const { connectMetaMask, connectWalletConnect, connectError, isConnecting, isMetaMaskAvailable } = wagmiWallet;

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
              try {
                if (!isMetaMaskAvailable) {
                  throw new Error('MetaMask extension not detected. Please install MetaMask to connect.');
                }
                await connectMetaMask();
                onClose();
              } catch (error) {
                console.error('MetaMask connection failed:', error);
              }
            }}
            disabled={isConnecting || !isMetaMaskAvailable}
            className={`w-full p-3 bg-surface-elevated rounded-lg border border-border hover:bg-surface/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              !isMetaMaskAvailable ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
                <div>
                  <div className="text-text-primary font-medium">MetaMask</div>
                  <div className="text-text-tertiary text-sm">
                    {isMetaMaskAvailable ? 'Browser extension' : 'Extension not detected'}
                  </div>
                </div>
              </div>
              {isConnecting && <div className="w-4 h-4 border-2 border-text-tertiary border-t-long rounded-full animate-spin" />}
            </div>
          </button>

          <button
            onClick={async () => {
              try {
                await connectWalletConnect();
                onClose();
              } catch (error) {
                console.error('WalletConnect connection failed:', error);
              }
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

        <div className="mt-4 text-xs text-text-tertiary">
          <div className="space-y-1">
            <div>• Select MetaMask to connect your browser wallet</div>
            <div>• Select WalletConnect to connect via QR code</div>
            <div>• You will be prompted to switch to Arbitrum network if needed</div>
          </div>
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