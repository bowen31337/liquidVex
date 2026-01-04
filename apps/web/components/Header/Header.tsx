/**
 * Header component with logo, asset selector, price display, and wallet connect
 */

'use client';

import { useEffect } from 'react';
import { useMarketStore } from '../../stores/marketStore';
import { useWalletStore } from '../../stores/walletStore';
import { useApi } from '../../hooks/useApi';
import { AssetSelector } from '../AssetSelector';

export function Header() {
  const {
    selectedAsset,
    currentPrice,
    priceChange24h,
    markPrice,
    indexPrice,
    fundingRate,
    fundingCountdown,
    wsConnected,
  } = useMarketStore();

  const { address, isConnected, connecting, connect, disconnect } = useWalletStore();
  const { getExchangeMeta } = useApi();

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
      connect();
    }
  };

  // Load exchange meta on mount
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const meta = await getExchangeMeta();
        if (meta.assets.length > 0) {
          // Could set default asset here
        }
      } catch (err) {
        console.error('Failed to load exchange meta:', err);
      }
    };
    loadMeta();
  }, [getExchangeMeta]);

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4">
      {/* Left side: Logo and Asset Selector */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-text-primary">liquidVex</h1>

        {/* Asset Selector */}
        <AssetSelector />

        {/* Connection Status Indicator */}
        <div
          className={`w-2 h-2 rounded-full ${
            wsConnected ? 'bg-long animate-pulse' : 'bg-short'
          }`}
          title={wsConnected ? 'Connected' : 'Disconnected'}
        />
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

        {/* Mark/Index Prices (compact display on hover) */}
        <div className="hidden lg:block text-xs text-text-tertiary">
          <div title="Mark Price">M: {formatPrice(markPrice)}</div>
          <div title="Index Price">I: {formatPrice(indexPrice)}</div>
        </div>

        {/* Funding Rate Display */}
        <div className="hidden md:block text-xs text-text-secondary text-right">
          <div title="Funding Rate">F: {(fundingRate * 100).toFixed(3)}%</div>
          <div title="Next Funding">{formatCountdown(fundingCountdown)}</div>
        </div>

        {/* Wallet Connect Button */}
        <button
          onClick={handleWalletClick}
          disabled={connecting}
          className={`btn btn-accent min-w-[140px] ${
            isConnected ? 'bg-long hover:bg-long-muted' : ''
          }`}
        >
          {connecting
            ? 'Connecting...'
            : isConnected
            ? truncateAddress(address || '')
            : 'Connect Wallet'}
        </button>
      </div>
    </header>
  );
}
