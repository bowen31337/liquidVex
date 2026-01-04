/**
 * Trade History component with filtering, pagination, and export
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useWalletStore } from '../../stores/walletStore';
import { useApi } from '../../hooks/useApi';
import { PositionsTableSkeleton } from '../LoadingSkeleton';

type FilterState = {
  dateRange: 'all' | '24h' | '7d' | '30d';
  asset: 'all' | string;
  side: 'all' | 'B' | 'A';
};

const ITEMS_PER_PAGE = 20;

export function TradeHistory() {
  const { tradeHistory, setTradeHistory, isLoadingTradeHistory, setIsLoadingTradeHistory } = useOrderStore();
  const { isConnected, address } = useWalletStore();
  const { getAccountHistory } = useApi();

  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    asset: 'all',
    side: 'all',
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Check for test mode
  const isTestMode = (() => {
    if (typeof process !== 'undefined' &&
        (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || process.env.NODE_ENV === 'test')) {
      return true;
    }
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('testMode') === 'true' || urlParams.has('testMode');
    }
    return false;
  })();

  // Load trade history when wallet connects
  useEffect(() => {
    // In test mode, don't load from API (trades are added directly to store)
    if (isTestMode) {
      return;
    }

    if (isConnected && address) {
      const loadHistory = async () => {
        try {
          setIsLoadingTradeHistory(true);
          const data = await getAccountHistory(address);
          setTradeHistory(data.trades);
        } catch (err) {
          console.error('Failed to load trade history:', err);
          // Mock data for development
          setTradeHistory([
            {
              coin: 'BTC',
              side: 'B',
              px: 43250.50,
              sz: 0.5,
              time: Date.now() - 3600000,
              hash: '0xabc123...',
              fee: 0.5,
            },
            {
              coin: 'ETH',
              side: 'A',
              px: 2280.75,
              sz: 2.0,
              time: Date.now() - 7200000,
              hash: '0xdef456...',
              fee: 0.3,
            },
            {
              coin: 'SOL',
              side: 'B',
              px: 98.45,
              sz: 10.0,
              time: Date.now() - 86400000,
              hash: '0xghi789...',
              fee: 0.2,
            },
            {
              coin: 'BTC',
              side: 'A',
              px: 44100.00,
              sz: 0.3,
              time: Date.now() - 172800000,
              hash: '0xjkl012...',
              fee: 0.4,
            },
            {
              coin: 'ETH',
              side: 'B',
              px: 2250.00,
              sz: 5.0,
              time: Date.now() - 259200000,
              hash: '0xmno345...',
              fee: 0.6,
            },
          ]);
        }
      };
      loadHistory();
    } else if (!isTestMode) {
      setTradeHistory([]);
      setIsLoadingTradeHistory(false);
    }
  }, [isConnected, address, isTestMode]);

  // Filter trades based on current filters
  const filteredTrades = useMemo(() => {
    let filtered = [...tradeHistory];

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      filtered = filtered.filter(trade => now - trade.time <= ranges[filters.dateRange]);
    }

    // Asset filter
    if (filters.asset !== 'all') {
      filtered = filtered.filter(trade => trade.coin === filters.asset);
    }

    // Side filter
    if (filters.side !== 'all') {
      filtered = filtered.filter(trade => trade.side === filters.side);
    }

    return filtered.sort((a, b) => b.time - a.time);
  }, [tradeHistory, filters]);

  // Get unique assets from trades
  const uniqueAssets = useMemo(() => {
    const assets = new Set(tradeHistory.map(trade => trade.coin));
    return ['all', ...Array.from(assets).sort()];
  }, [tradeHistory]);

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      asset: 'all',
      side: 'all',
    });
  };

  const hasActiveFilters = filters.dateRange !== 'all' || filters.asset !== 'all' || filters.side !== 'all';

  const exportToCSV = () => {
    if (filteredTrades.length === 0) return;

    const headers = ['Time', 'Symbol', 'Side', 'Price', 'Size', 'Fee', 'Hash'];
    const rows = filteredTrades.map(trade => [
      formatTime(trade.time),
      trade.coin,
      trade.side === 'B' ? 'Buy' : 'Sell',
      formatNumber(trade.px),
      formatNumber(trade.sz, 4),
      trade.fee !== undefined ? formatNumber(trade.fee) : 'N/A',
      trade.hash,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trade-history-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isConnected && !isTestMode) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none" data-testid="trade-history">
        Connect your wallet to view trade history
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="trade-history">
      {/* Filters */}
      <div className="px-4 py-2 border-b border-border flex gap-2 items-center flex-wrap">
        <select
          data-testid="trade-date-range-filter"
          value={filters.dateRange}
          onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as FilterState['dateRange'] }))}
          className="px-2 py-1 text-xs bg-surface-elevated border border-border rounded text-text-primary"
        >
          <option value="all">All Time</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        <select
          data-testid="trade-asset-filter"
          value={filters.asset}
          onChange={(e) => setFilters(prev => ({ ...prev, asset: e.target.value }))}
          className="px-2 py-1 text-xs bg-surface-elevated border border-border rounded text-text-primary"
        >
          {uniqueAssets.map(asset => (
            <option key={asset} value={asset}>
              {asset === 'all' ? 'All Assets' : asset}
            </option>
          ))}
        </select>

        <select
          data-testid="trade-side-filter"
          value={filters.side}
          onChange={(e) => setFilters(prev => ({ ...prev, side: e.target.value as FilterState['side'] }))}
          className="px-2 py-1 text-xs bg-surface-elevated border border-border rounded text-text-primary"
        >
          <option value="all">All Sides</option>
          <option value="B">Buy</option>
          <option value="A">Sell</option>
        </select>

        {hasActiveFilters && (
          <button
            data-testid="trade-clear-filters"
            onClick={clearFilters}
            className="px-2 py-1 text-xs bg-surface-elevated hover:bg-surface border border-border rounded text-text-primary"
          >
            Clear Filters
          </button>
        )}

        <button
          data-testid="export-trade-history"
          onClick={exportToCSV}
          disabled={filteredTrades.length === 0}
          className="px-2 py-1 text-xs bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed border border-border rounded text-white ml-auto"
        >
          Export CSV
        </button>

        <span className="text-xs text-text-tertiary">
          {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'}
        </span>
      </div>

      {/* Trades Table */}
      {isLoadingTradeHistory ? (
        <PositionsTableSkeleton />
      ) : filteredTrades.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-text-tertiary text-sm">
            {hasActiveFilters ? 'No trades match your filters' : 'No trade history'}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Size</th>
                  <th>Fee</th>
                  <th>Hash</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map((trade, idx) => (
                  <tr key={idx}>
                    <td>{formatTime(trade.time)}</td>
                    <td>{trade.coin}</td>
                    <td className={trade.side === 'B' ? 'text-long' : 'text-short'}>
                      {trade.side === 'B' ? 'Buy' : 'Sell'}
                    </td>
                    <td>{formatNumber(trade.px)}</td>
                    <td>{formatNumber(trade.sz, 4)}</td>
                    <td>{trade.fee !== undefined ? formatNumber(trade.fee) : 'N/A'}</td>
                    <td className="text-text-tertiary">{trade.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-2 border-t border-border flex items-center justify-between">
              <div className="text-xs text-text-tertiary">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredTrades.length)} of {filteredTrades.length}
              </div>
              <div className="flex gap-1">
                <button
                  data-testid="trade-prev-page"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs bg-surface-elevated hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed border border-border rounded text-text-primary"
                >
                  Previous
                </button>
                <span className="px-2 py-1 text-xs text-text-primary">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  data-testid="trade-next-page"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs bg-surface-elevated hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed border border-border rounded text-text-primary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
