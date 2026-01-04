'use client';

import { useState, useEffect } from 'react';
import { useMarketStore } from '../stores/marketStore';

interface Asset {
  coin: string;
  name: string;
  szDecimals: number;
  pxDecimals: number;
  minSz: number;
  maxLeverage: number;
}

interface AssetWithPrice extends Asset {
  price: number;
  change24h: number;
}

export function AssetSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [assets, setAssets] = useState<AssetWithPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Market store integration
  const { selectedAsset, setSelectedAsset: setMarketSelectedAsset, allMids } = useMarketStore();

  // Load assets from backend API
  useEffect(() => {
    const loadAssets = async () => {
      setIsLoading(true);
      try {
        // Use full URL to backend API
        const response = await fetch('http://localhost:8000/api/info/meta');
        if (!response.ok) throw new Error('Failed to fetch assets');

        const data = await response.json();

        // Convert backend format to our format
        const assetsWithPrices = data.assets.map((asset: any) => ({
          coin: asset.coin,
          name: `${asset.coin} Perpetual`,
          szDecimals: asset.szDecimals,
          pxDecimals: asset.pxDecimals,
          minSz: asset.minSz,
          maxLeverage: asset.maxLeverage,
          price: allMids[asset.coin] || 0,
          change24h: 0, // Could fetch from API if needed
        }));

        setAssets(assetsWithPrices);
      } catch (error) {
        console.error('Failed to load assets:', error);
        // Fallback to mock data
        setAssets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets();
  }, [allMids]);

  // Update prices when allMids changes
  useEffect(() => {
    setAssets(prev => prev.map(asset => ({
      ...asset,
      price: allMids[asset.coin] || asset.price
    })));
  }, [allMids]);

  const filteredAssets = assets
    .filter(asset =>
      asset.coin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.price - a.price); // Sort by price descending

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const getDisplayName = (coin: string) => {
    return `${coin}-PERP`;
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated hover:bg-surface border border-border rounded transition-colors"
      >
        <span className="text-text-primary font-medium">
          {isLoading ? 'Loading...' : getDisplayName(assets.find(a => a.coin === selectedAsset)?.coin || selectedAsset)}
        </span>
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
                  {isLoading ? 'Loading assets...' : 'No assets available'}
                </div>
              ) : (
                filteredAssets.map((asset) => (
                  <button
                    key={asset.coin}
                    onClick={() => {
                      setMarketSelectedAsset(asset.coin);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-4 py-3 hover:bg-surface transition-colors border-b border-border last:border-b-0 text-left ${
                      selectedAsset === asset.coin ? 'bg-surface' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-start">
                        <span className="text-text-primary font-medium">{getDisplayName(asset.coin)}</span>
                        <span className="text-xs text-text-tertiary">{asset.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-text-primary font-mono">{formatPrice(asset.price)}</span>
                        <span className="text-xs text-text-tertiary">{asset.maxLeverage}x</span>
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
