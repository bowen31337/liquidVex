'use client';

import { useEffect, useState } from 'react';

interface OrderBookLevel {
  px: number;
  sz: number;
  n: number;
}

interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export function OrderBook({ coin = 'BTC' }: { coin?: string }) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial order book data
    const fetchOrderBook = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/info/orderbook/${coin}`);
        if (response.ok) {
          const data = await response.json();
          setOrderBook(data);
        }
      } catch (error) {
        console.error('Failed to fetch order book:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderBook();

    // In production, this would be a WebSocket connection
    const interval = setInterval(fetchOrderBook, 1000); // Poll every second for now

    return () => clearInterval(interval);
  }, [coin]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  const formatSize = (size: number) => {
    return size.toFixed(4);
  };

  const calculateTotalSize = (levels: OrderBookLevel[]) => {
    return levels.reduce((sum, level) => sum + level.sz, 0);
  };

  const getMaxSize = (levels: OrderBookLevel[]) => {
    return Math.max(...levels.map(level => level.sz));
  };

  if (loading) {
    return (
      <div className="panel p-2 h-full">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
          Order Book
        </div>
        <div className="flex items-center justify-center h-40 text-text-tertiary text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (!orderBook) {
    return (
      <div className="panel p-2 h-full">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
          Order Book
        </div>
        <div className="flex items-center justify-center h-40 text-text-tertiary text-sm">
          No data available
        </div>
      </div>
    );
  }

  const bids = orderBook.bids.slice(0, 10).reverse(); // Show highest bids at top
  const asks = orderBook.asks.slice(0, 10);
  const maxBidSize = getMaxSize(bids);
  const maxAskSize = getMaxSize(asks);

  // Calculate spread
  const spread = asks.length > 0 && bids.length > 0
    ? asks[0].px - bids[bids.length - 1].px
    : 0;
  const spreadPercent = spread > 0 && bids.length > 0
    ? (spread / bids[bids.length - 1].px) * 100
    : 0;

  return (
    <div className="panel p-2 h-full flex flex-col">
      {/* Header */}
      <div className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
        Order Book
      </div>

      {/* Spread */}
      {spread > 0 && (
        <div className="text-center py-1 mb-2 border-b border-border">
          <span className="text-text-tertiary text-xs">Spread: </span>
          <span className="text-text-primary text-xs font-mono">{formatPrice(spread)}</span>
          <span className="text-text-tertiary text-xs ml-1">({spreadPercent.toFixed(3)}%)</span>
        </div>
      )}

      {/* Order Book Header */}
      <div className="grid grid-cols-3 text-xs text-text-tertiary mb-1">
        <div>Price</div>
        <div className="text-center">Size</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sell orders) - red */}
      <div className="flex-1 overflow-hidden">
        {asks.map((level, idx) => {
          const widthPercent = maxAskSize > 0 ? (level.sz / maxAskSize) * 100 : 0;
          return (
            <div
              key={`ask-${idx}`}
              className="grid grid-cols-3 text-xs py-0.5 relative hover:bg-surface-elevated"
            >
              {/* Background bar */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-short-muted opacity-30"
                style={{ width: `${widthPercent}%` }}
              />
              <div className="text-short font-mono relative z-10">{formatPrice(level.px)}</div>
              <div className="text-center font-mono relative z-10">{formatSize(level.sz)}</div>
              <div className="text-right font-mono text-text-secondary relative z-10">
                {formatSize(level.sz * level.px)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Price Separator */}
      {bids.length > 0 && asks.length > 0 && (
        <div className="py-1 my-1 border-y border-border text-center">
          <span className="text-lg font-mono text-text-primary">
            {formatPrice((bids[bids.length - 1].px + asks[0].px) / 2)}
          </span>
        </div>
      )}

      {/* Bids (Buy orders) - green */}
      <div className="flex-1 overflow-hidden">
        {bids.map((level, idx) => {
          const widthPercent = maxBidSize > 0 ? (level.sz / maxBidSize) * 100 : 0;
          return (
            <div
              key={`bid-${idx}`}
              className="grid grid-cols-3 text-xs py-0.5 relative hover:bg-surface-elevated"
            >
              {/* Background bar */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-long-muted opacity-30"
                style={{ width: `${widthPercent}%` }}
              />
              <div className="text-long font-mono relative z-10">{formatPrice(level.px)}</div>
              <div className="text-center font-mono relative z-10">{formatSize(level.sz)}</div>
              <div className="text-right font-mono text-text-secondary relative z-10">
                {formatSize(level.sz * level.px)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
