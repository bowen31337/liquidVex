/**
 * Order Book component with bid/ask ladder and depth visualization
 */

'use client';

import { useState } from 'react';
import { useMarketStore } from '../../stores/marketStore';
import { useOrderStore } from '../../stores/orderStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { OrderBookLevel } from '../../types';

interface OrderBookProps {
  levels?: number; // Number of levels to display
  precision?: number; // Price precision
}

export function OrderBook({ levels = 15, precision = 2 }: OrderBookProps) {
  const { orderBook, selectedAsset } = useMarketStore();
  const { setOrderForm } = useOrderStore();
  const [aggregation, setAggregation] = useState<number>(1); // Price grouping in decimals
  const [selectedPrecision, setSelectedPrecision] = useState<number>(2); // Price precision

  // Connect to order book WebSocket
  const { isConnected } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001'}/ws/orderbook/${selectedAsset}`
  );

  // Group price levels by aggregation
  const groupLevels = (levels: OrderBookLevel[], isAsk: boolean) => {
    if (levels.length === 0) return [];

    const grouped = new Map<number, { px: number; sz: number; n: number }>();

    levels.forEach(level => {
      // Round price based on aggregation
      const roundedPrice = Math.round(level.px / aggregation) * aggregation;
      if (!grouped.has(roundedPrice)) {
        grouped.set(roundedPrice, { px: roundedPrice, sz: 0, n: 0 });
      }
      const group = grouped.get(roundedPrice)!;
      group.sz += level.sz;
      group.n += level.n;
    });

    // Convert to array and sort
    const result = Array.from(grouped.values());
    result.sort((a, b) => (isAsk ? a.px - b.px : b.px - a.px));
    return result;
  };

  // Calculate cumulative volume for depth bars
  const calculateCumulative = (levels: OrderBookLevel[]) => {
    let cumulative = 0;
    return levels.map(level => {
      cumulative += level.sz;
      return { ...level, cumulative };
    });
  };

  // Get max cumulative for depth bar scaling
  const getMaxCumulative = (bids: any[], asks: any[]) => {
    const maxBid = bids.length > 0 ? Math.max(...bids.map(b => b.cumulative || b.sz)) : 0;
    const maxAsk = asks.length > 0 ? Math.max(...asks.map(a => a.cumulative || a.sz)) : 0;
    return Math.max(maxBid, maxAsk);
  };

  // Format price based on precision
  const formatPrice = (price: number) => {
    return price.toFixed(selectedPrecision);
  };

  // Format size
  const formatSize = (size: number) => {
    return size.toFixed(4);
  };

  // Handle price click to populate order form
  const handlePriceClick = (price: number) => {
    // Format price to match display precision
    const formattedPrice = price.toFixed(selectedPrecision);
    // Update order form with clicked price
    setOrderForm({ price: formattedPrice });
  };

  // Prepare data for rendering
  const renderData = orderBook
    ? {
        bids: calculateCumulative(groupLevels(orderBook.bids.slice(0, levels).reverse(), false)),
        asks: calculateCumulative(groupLevels(orderBook.asks.slice(0, levels), true)),
      }
    : { bids: [], asks: [] };

  const maxCumulative = getMaxCumulative(renderData.bids, renderData.asks);

  // Calculate order book imbalance
  const calculateImbalance = () => {
    if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) {
      return { ratio: 0, percentage: 0, direction: 'neutral' };
    }

    // Calculate total volume for bids and asks (top N levels)
    const bidLevels = groupLevels(orderBook.bids.slice(0, levels).reverse(), false);
    const askLevels = groupLevels(orderBook.asks.slice(0, levels), true);

    const bidVolume = bidLevels.reduce((sum, level) => sum + level.sz, 0);
    const askVolume = askLevels.reduce((sum, level) => sum + level.sz, 0);

    const totalVolume = bidVolume + askVolume;
    const ratio = bidVolume / askVolume;
    const percentage = totalVolume > 0 ? (bidVolume / totalVolume) * 100 : 50;

    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (ratio > 1.2) direction = 'bullish'; // More bid pressure
    else if (ratio < 0.8) direction = 'bearish'; // More ask pressure

    return { ratio, percentage, direction };
  };

  const imbalance = calculateImbalance();
  const spread =
    orderBook && orderBook.asks.length > 0 && orderBook.bids.length > 0
      ? {
          absolute: orderBook.asks[0].px - orderBook.bids[0].px,
          percentage: ((orderBook.asks[0].px - orderBook.bids[0].px) / ((orderBook.asks[0].px + orderBook.bids[0].px) / 2)) * 100,
        }
      : null;

  return (
    <div className="panel orderbook-panel p-2 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Order Book
        </div>
        <div className="flex gap-2 text-[10px] text-text-tertiary">
          {/* Precision Controls */}
          <div className="flex gap-1">
            <span className="px-1 py-0.5 rounded bg-surface-elevated">Precision:</span>
            {[1, 2, 4, 6].map(prec => (
              <button
                key={prec}
                onClick={() => setSelectedPrecision(prec)}
                className={`px-1.5 py-0.5 rounded ${selectedPrecision === prec ? 'bg-surface-elevated text-text-primary' : ''}`}
              >
                {prec}d
              </button>
            ))}
          </div>
          {/* Aggregation Controls */}
          <div className="flex gap-1">
            <span className="px-1 py-0.5 rounded bg-surface-elevated">Group:</span>
            {[1, 5, 10, 25].map(group => (
              <button
                key={group}
                onClick={() => setAggregation(group)}
                className={`px-1.5 py-0.5 rounded ${aggregation === group ? 'bg-surface-elevated text-text-primary' : ''}`}
                data-testid={`aggregation-${group}`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Spread Indicator */}
      {spread && (
        <div
          className="text-xs text-text-tertiary mb-1 px-1 py-0.5 bg-surface-elevated rounded text-center"
          data-testid="spread-display"
        >
          Spread: {spread.absolute.toFixed(precision)} (<span data-testid="spread-percentage">{spread.percentage.toFixed(3)}%</span>)
        </div>
      )}

      {/* Order Book Imbalance Indicator */}
      <div className="flex items-center justify-between mb-1 px-1 py-0.5 bg-surface-elevated rounded">
        <div className="text-xs text-text-tertiary font-medium">Imbalance:</div>
        <div className="flex items-center gap-2 text-xs">
          {/* Visual indicator bar */}
          <div className="flex-1 bg-surface h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                imbalance.direction === 'bullish' ? 'bg-long' : imbalance.direction === 'bearish' ? 'bg-short' : 'bg-text-tertiary'
              }`}
              style={{ width: `${imbalance.percentage}%` }}
            />
          </div>
          {/* Text indicator */}
          <div
            className={`font-medium ${
              imbalance.direction === 'bullish' ? 'text-long' : imbalance.direction === 'bearish' ? 'text-short' : 'text-text-tertiary'
            }`}
            data-testid="imbalance-direction"
          >
            {imbalance.direction === 'bullish' ? 'BULLISH' : imbalance.direction === 'bearish' ? 'BEARISH' : 'NEUTRAL'}
          </div>
          {/* Percentage value */}
          <div className="text-text-tertiary font-mono" data-testid="imbalance-percentage">
            {imbalance.percentage.toFixed(1)}% / {(100 - imbalance.percentage).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="flex-1 overflow-hidden flex flex-col gap-1">
        {/* Asks (Sell Orders) - Top */}
        <div className="flex-1 overflow-y-auto flex flex-col-reverse">
          {renderData.asks.length > 0 ? (
            renderData.asks.map((level, idx) => {
              const barWidth = maxCumulative > 0 ? (level.cumulative / maxCumulative) * 100 : 0;
              return (
                <div
                  key={`ask-${idx}`}
                  className="relative flex items-center text-xs font-mono py-0.5 px-1 hover:bg-surface-elevated cursor-pointer group"
                  onClick={() => handlePriceClick(level.px)}
                >
                  {/* Depth Bar */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-short opacity-20"
                    style={{ width: `${barWidth}%` }}
                  />
                  {/* Size (Left) */}
                  <div className="flex-1 text-short z-10">{formatSize(level.sz)}</div>
                  {/* Price (Center) */}
                  <div className="flex-1 text-center text-text-primary z-10 font-medium" data-testid="ask-price">
                    {formatPrice(level.px)}
                  </div>
                  {/* Empty (Right for symmetry) */}
                  <div className="flex-1"></div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-text-tertiary text-xs py-4">
              No ask data
            </div>
          )}
        </div>

        {/* Bids (Buy Orders) - Bottom */}
        <div className="flex-1 overflow-y-auto">
          {renderData.bids.length > 0 ? (
            renderData.bids.map((level, idx) => {
              const barWidth = maxCumulative > 0 ? (level.cumulative / maxCumulative) * 100 : 0;
              return (
                <div
                  key={`bid-${idx}`}
                  className="relative flex items-center text-xs font-mono py-0.5 px-1 hover:bg-surface-elevated cursor-pointer group"
                  onClick={() => handlePriceClick(level.px)}
                >
                  {/* Depth Bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-long opacity-20"
                    style={{ width: `${barWidth}%` }}
                  />
                  {/* Empty (Left for symmetry) */}
                  <div className="flex-1"></div>
                  {/* Price (Center) */}
                  <div className="flex-1 text-center text-text-primary z-10 font-medium" data-testid="bid-price">
                    {formatPrice(level.px)}
                  </div>
                  {/* Size (Right) */}
                  <div className="flex-1 text-right text-long z-10">{formatSize(level.sz)}</div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-text-tertiary text-xs py-4">
              No bid data
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="text-[10px] text-warning text-center mt-1">
          Connecting...
        </div>
      )}
    </div>
  );
}
