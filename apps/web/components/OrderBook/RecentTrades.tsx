/**
 * Recent Trades component with real-time trade feed
 */

'use client';

import { useMarketStore } from '../../stores/marketStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ErrorState } from '../ErrorState/ErrorState';

export function RecentTrades() {
  const { trades, selectedAsset, clearTrades, hasTradesError, tradesError, clearTradesError } = useMarketStore();

  // Connect to trades WebSocket
  const { isConnected } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001'}/ws/trades/${selectedAsset}`
  );

  // Format price
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format size - abbreviate large trades, full precision for small trades
  const formatSize = (size: number) => {
    // For very small trades or trades < 1000, show full precision
    if (size < 1000) {
      return size.toFixed(4);
    }
    // For larger trades, abbreviate with K/M/B suffixes
    if (size >= 1e9) {
      return `${(size / 1e9).toFixed(2)}B`;
    }
    if (size >= 1e6) {
      return `${(size / 1e6).toFixed(2)}M`;
    }
    if (size >= 1e3) {
      return `${(size / 1e3).toFixed(2)}K`;
    }
    return size.toFixed(4);
  };

  // Format timestamp - shows time only for today, date for older trades
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      // Show only time for today's trades
      return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else {
      // Show date and time for older trades
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
             date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    }
  };

  // Handle retry for failed data loads
  const handleRetry = () => {
    clearTradesError();
    // Force reconnection by reloading the page
    window.location.reload();
  };

  return (
    <div className="panel p-2 flex flex-col h-full" data-testid="recent-trades-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Recent Trades
        </div>
        <button
          onClick={clearTrades}
          className="text-[10px] text-text-tertiary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          title="Clear trades"
        >
          Clear
        </button>
      </div>

      {/* Error State */}
      {hasTradesError && (
        <ErrorState
          message="Failed to load trades"
          details={tradesError || undefined}
          onRetry={handleRetry}
          testId="recent-trades-error"
        />
      )}

      {/* Trade Feed */}
      <div className="flex-1 overflow-y-auto">
        {trades.length > 0 ? (
          <div className="space-y-0.5">
            {trades.map((trade, idx) => {
              const isBuy = trade.side === 'B';
              return (
                <div
                  key={`${trade.hash}-${idx}`}
                  className="flex items-center justify-between text-xs font-mono py-0.5 px-1 hover:bg-surface-elevated animate-slide-in"
                >
                  {/* Price */}
                  <span className={isBuy ? 'text-long' : 'text-short'}>
                    {formatPrice(trade.px)}
                  </span>

                  {/* Size */}
                  <span className="text-text-secondary">{formatSize(trade.sz)}</span>

                  {/* Time */}
                  <span className="text-text-tertiary text-[10px]">
                    {formatTime(trade.time)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-text-tertiary text-xs py-4">
            No recent trades
          </div>
        )}
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
