/**
 * NetworkWarning component - displays warning when wallet is on wrong network
 * and provides button to switch to Arbitrum
 */

'use client';

import { useWalletSync } from '../../stores/walletStore';

export function NetworkWarning() {
  const wallet = useWalletSync();
  const { chain, needsArbitrum, switchToArbitrum } = wallet;

  // Don't show if wallet is not connected or already on Arbitrum
  if (!wallet.isConnected || !needsArbitrum) {
    return null;
  }

  const currentNetworkName = chain?.name || 'Unknown Network';
  const targetNetworkName = 'Arbitrum';

  const handleSwitchNetwork = async () => {
    try {
      await switchToArbitrum();
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div
      data-testid="network-warning"
      className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 mb-4"
      style={{ width: 'auto', maxWidth: '90%' }}
    >
      <div className="bg-warning border border-warning/30 rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
        {/* Warning Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-warning shrink-0"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        {/* Warning Message */}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-primary">
            Wrong Network
          </span>
          <span className="text-xs text-text-secondary">
            Switch from {currentNetworkName} to {targetNetworkName}
          </span>
        </div>

        {/* Switch Network Button */}
        <button
          onClick={handleSwitchNetwork}
          data-testid="switch-network-button"
          className="btn btn-sm bg-surface-elevated hover:bg-border text-text-primary border border-border px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ml-2"
        >
          Switch Network
        </button>
      </div>
    </div>
  );
}
