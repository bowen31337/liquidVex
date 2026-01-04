'use client';

import { useState } from 'react';

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
}

const MOCK_ASSETS: Asset[] = [
  { symbol: 'BTC-PERP', name: 'Bitcoin Perpetual', price: 95420.50, change24h: 2.34, volume24h: 500000000 },
  { symbol: 'ETH-PERP', name: 'Ethereum Perpetual', price: 3520.75, change24h: -1.25, volume24h: 300000000 },
  { symbol: 'SOL-PERP', name: 'Solana Perpetual', price: 142.30, change24h: 5.67, volume24h: 150000000 },
  { symbol: 'XRP-PERP', name: 'Ripple Perpetual', price: 2.45, change24h: -0.82, volume24h: 80000000 },
  { symbol: 'DOGE-PERP', name: 'Dogecoin Perpetual', price: 0.082, change24h: 3.21, volume24h: 60000000 },
];

export function AssetSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(MOCK_ASSETS[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = MOCK_ASSETS.filter(asset =>
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated hover:bg-surface border border-border rounded transition-colors"
      >
        <span className="text-text-primary font-medium">{selectedAsset.symbol}</span>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-1 w-80 bg-surface-elevated border border-border rounded-lg shadow-lg z-20">
            {/* Search Input */}
            <div className="p-3 border-b border-border">
              <input
                type="text"
                placeholder="Search trading pairs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>

            {/* Asset List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredAssets.length === 0 ? (
                <div className="px-4 py-8 text-center text-text-tertiary text-sm">
                  No results found
                </div>
              ) : (
                filteredAssets.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="w-full px-4 py-3 hover:bg-surface transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-start">
                        <span className="text-text-primary font-medium">{asset.symbol}</span>
                        <span className="text-xs text-text-tertiary">{asset.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-text-primary font-mono">{formatPrice(asset.price)}</span>
                        <span className={`text-xs font-medium ${asset.change24h >= 0 ? 'text-long' : 'text-short'}`}>
                          {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
