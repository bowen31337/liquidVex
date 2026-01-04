/**
 * Header component with logo, asset selector, price display, and wallet connect
 */

'use client';

import { useEffect, useState } from 'react';
import { useMarketStore } from '../../stores/marketStore';
import { useWalletSync } from '../../stores/walletStore';
import { useApi } from '../../hooks/useApi';
import { AssetSelector } from '../AssetSelector';
import { SettingsModal } from '../Settings/SettingsModal';
import { AccountBalance } from '../AccountBalance/AccountBalance';
import { WalletModal } from '../WalletModal/WalletModal';
import { ConnectionStatus } from '../ConnectionStatus/ConnectionStatus';
import { NetworkWarning } from '../NetworkWarning';

export function Header() {
  const {
    selectedAsset,
    currentPrice,
    priceChange24h,
    markPrice,
    indexPrice,
    fundingRate,
    fundingCountdown,
  } = useMarketStore();

  const wagmiWallet = useWalletSync();
  const { address, isConnected, isConnecting, disconnect } = wagmiWallet;
  const { getExchangeMeta } = useApi();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Format price with commas and decimals
  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format percentage
  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Truncate wallet address
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Handle wallet connect/disconnect
  const handleWalletClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      // Show wallet connection modal
      setWalletModalOpen(true);
    }
  };

  // Load exchange meta on mount and update prices periodically
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const meta = await getExchangeMeta();
        if (meta.assets.length > 0) {
          // Update current price from meta
          const asset = meta.assets.find((a: any) => a.coin === selectedAsset);
          if (asset) {
            // Prices are updated via store defaults, but we could fetch more specific data here
          }
        }
      } catch (err) {
        // Silently ignore meta loading errors
      }
    };

    loadMeta();

    // Update prices every 5 seconds
    const interval = setInterval(() => {
      loadMeta();
    }, 5000);

    return () => clearInterval(interval);
  }, [getExchangeMeta, selectedAsset]);

  return (
    <>
      {/* Network Warning Banner */}
      <NetworkWarning />

      <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4">
        {/* Left side: Logo and Asset Selector */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-text-primary">liquidVex</h1>

          {/* Asset Selector */}
          <AssetSelector />

          {/* Connection Status Indicator */}
          <ConnectionStatus showText={false} />
        </div>

      {/* Right side: Price and Wallet */}
      <div className="flex items-center gap-4">
        {/* Price Display */}
        <div className="text-right">
          <div className="font-mono text-lg text-text-primary">
            {formatPrice(currentPrice)}
          </div>
          <div className={`text-xs ${priceChange24h >= 0 ? 'text-long' : 'text-short'}`}>
            {formatPercent(priceChange24h)}
          </div>
        </div>

        {/* Mark/Index Prices */}
        <div className="text-xs text-text-tertiary">
          <div title="Mark Price">M: {formatPrice(markPrice)}</div>
          <div title="Index Price">I: {formatPrice(indexPrice)}</div>
        </div>

        {/* Funding Rate Display */}
        <div className="text-xs text-text-secondary text-right">
          <div title="Funding Rate">F: {(fundingRate * 100).toFixed(3)}%</div>
          <div title="Next Funding">{formatCountdown(fundingCountdown)}</div>
        </div>

        {/* Account Balance */}
        <AccountBalance />

        {/* Settings Gear Icon */}
        <button
          onClick={() => setSettingsOpen(true)}
          data-testid="settings-button"
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          title="Settings"
        >
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
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* Wallet Connect Button */}
        <button
          onClick={handleWalletClick}
          disabled={isConnecting}
          data-testid="wallet-connect-button"
          className={`btn btn-accent min-w-[140px] ${
            isConnected ? 'bg-long hover:bg-long-muted' : ''
          }`}
        >
          {isConnecting
            ? 'Connecting...'
            : isConnected
            ? truncateAddress(address || '')
            : 'Connect Wallet'}
        </button>

        {/* Settings Modal */}
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {/* Wallet Modal */}
        <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      </div>
    </header>
    </>
  );
}
