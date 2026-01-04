/**
 * Order Book component with bid/ask ladder and depth visualization
 */

'use client';

import { useEffect, useState } from 'react';
import { useMarketStore } from '../../stores/marketStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { OrderBookLevel } from '../../types';

interface OrderBookProps {
  levels?: number; // Number of levels to display
  precision?: number; // Price precision
}

export function OrderBook({ levels = 15, precision = 2 }: OrderBookProps) {
  const { orderBook, selectedAsset, setOrderBook } = useMarketStore();
  const [aggregation, setAggregation] = useState<number>(1); // Price grouping

  // Connect to order book WebSocket
  const { isConnected } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/orderbook/${selectedAsset}`
  );

  // Calculate cumulative volume for depth bars
  const calculateCumulative = (levels: OrderBookLevel[], isAsk: boolean) => {
    let cumulative = 0;
    return levels.map(level => {
      cumulative += level.sz;
      return { ...level, cumulative };
    });
  };

  // Get max cumulative for depth bar scaling
  const getMaxCumulative = (bids: OrderBookLevel[], asks: OrderBookLevel[]) => {
    const maxBid = bids.length > 0 ? Math.max(...bids.map(b => b.cumulative || b.sz)) : 0;
    const maxAsk = asks.length > 0 ? Math.max(...asks.map(a => a.cumulative || a.sz)) : 0;
    return Math.max(maxBid, maxAsk);
  };

  // Format price based on precision
  const formatPrice = (price: number) => {
    return price.toFixed(precision);
  };

  // Format size
  const formatSize = (size: number) => {
    return size.toFixed(4);
  };

  // Handle price click to populate order form
  const handlePriceClick = (price: number) => {
    // This would interact with the order form store
    console.log('Price clicked:', price);
  };

  // Prepare data for rendering
  const renderData = orderBook
    ? {
        bids: calculateCumulative(orderBook.bids.slice(0, levels).reverse(), false),
        asks: calculateCumulative(orderBook.asks.slice(0, levels), true),
      }
    : { bids: [], asks: [] };

  const maxCumulative = getMaxCumulative(renderData.bids, renderData.asks);

  // Calculate spread
  const spread =
    orderBook && orderBook.asks.length > 0 && orderBook.bids.length > 0
      ? {
          absolute: orderBook.asks[0].px - orderBook.bids[0].px,
          percentage:
            ((orderBook.asks[0].px - orderBook.bids[0].px) / orderBook.bids[0].px) * 100,
        }
      : null;

  return (
    <div className="panel p-2 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Order Book
        </div>
        <div className="flex gap-2 text-[10px] text-text-tertiary">
          <button
            onClick={() => setAggregation(1)}
            className={`px-1.5 py-0.5 rounded ${aggregation === 1 ? 'bg-surface-elevated text-text-primary' : ''}`}
          >
            1d
          </button>
          <button
            onClick={() => setAggregation(5)}
            className={`px-1.5 py-0.5 rounded ${aggregation === 5 ? 'bg-surface-elevated text-text-primary' : ''}`}
          >
            5d
          </button>
        </div>
      </div>

      {/* Spread Indicator */}
      {spread && (
        <div className="text-xs text-text-tertiary mb-1 px-1 py-0.5 bg-surface-elevated rounded text-center">
          Spread: {spread.absolute.toFixed(precision)} ({spread.percentage.toFixed(3)}%)
        </div>
      )}

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
                  <div className="flex-1 text-center text-text-primary z-10 font-medium">
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
                  <div className="flex-1 text-center text-text-primary z-10 font-medium">
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
