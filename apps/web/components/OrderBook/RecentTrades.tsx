/**
 * Recent Trades component with real-time trade feed
 */

'use client';

import { useMarketStore } from '../../stores/marketStore';
import { useWebSocket } from '../../hooks/useWebSocket';

export function RecentTrades() {
  const { trades, selectedAsset, clearTrades } = useMarketStore();

  // Connect to trades WebSocket
  const { isConnected } = useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001'}/ws/trades/${selectedAsset}`
  );

  // Format price
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format size
  const formatSize = (size: number) => {
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
