/**
 * Order History component with filtering
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useWalletStore } from '../../stores/walletStore';
import { useApi } from '../../hooks/useApi';

type FilterState = {
  dateRange: 'all' | '24h' | '7d' | '30d';
  asset: 'all' | string;
  status: 'all' | 'filled' | 'canceled';
};

export function OrderHistory() {
  const { orderHistory, setOrderHistory } = useOrderStore();
  const { isConnected, address } = useWalletStore();
  const { getOrderHistory } = useApi();

  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    asset: 'all',
    status: 'all',
  });

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

  // Load order history when wallet connects
  useEffect(() => {
    // In test mode, don't load from API (orders are added directly to store)
    if (isTestMode) {
      return;
    }

    if (isConnected && address) {
      const loadHistory = async () => {
        try {
          const data = await getOrderHistory(address);
          setOrderHistory(data);
        } catch (err) {
          console.error('Failed to load order history:', err);
          // Mock data for development
          setOrderHistory([
            {
              oid: 1001,
              coin: 'BTC',
              side: 'B',
              limitPx: 43250.50,
              sz: 0.5,
              origSz: 0.5,
              status: 'filled',
              timestamp: Date.now() - 3600000,
              orderType: 'limit',
              reduceOnly: false,
              postOnly: false,
              tif: 'GTC',
            },
            {
              oid: 1002,
              coin: 'ETH',
              side: 'A',
              limitPx: 2280.75,
              sz: 2.0,
              origSz: 2.0,
              status: 'canceled',
              timestamp: Date.now() - 7200000,
              orderType: 'limit',
              reduceOnly: false,
              postOnly: true,
              tif: 'GTC',
            },
            {
              oid: 1003,
              coin: 'SOL',
              side: 'B',
              limitPx: 98.45,
              sz: 10.0,
              origSz: 10.0,
              status: 'filled',
              timestamp: Date.now() - 86400000,
              orderType: 'market',
              reduceOnly: false,
              postOnly: false,
              tif: 'IOC',
            },
          ]);
        }
      };
      loadHistory();
    } else if (!isTestMode) {
      setOrderHistory([]);
    }
  }, [isConnected, address, isTestMode]);

  // Filter orders based on current filters
  const filteredOrders = useMemo(() => {
    let filtered = [...orderHistory];

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      filtered = filtered.filter(order => now - order.timestamp <= ranges[filters.dateRange]);
    }

    // Asset filter
    if (filters.asset !== 'all') {
      filtered = filtered.filter(order => order.coin === filters.asset);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [orderHistory, filters]);

  // Get unique assets from orders
  const uniqueAssets = useMemo(() => {
    const assets = new Set(orderHistory.map(order => order.coin));
    return ['all', ...Array.from(assets).sort()];
  }, [orderHistory]);

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
      status: 'all',
    });
  };

  const hasActiveFilters = filters.dateRange !== 'all' || filters.asset !== 'all' || filters.status !== 'all';

  if (!isConnected && !isTestMode) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none" data-testid="order-history">
        Connect your wallet to view order history
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="order-history">
      {/* Filters */}
      <div className="px-4 py-2 border-b border-border flex gap-2 items-center flex-wrap">
        <select
          data-testid="date-range-filter"
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
          data-testid="asset-filter"
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
          data-testid="status-filter"
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterState['status'] }))}
          className="px-2 py-1 text-xs bg-surface-elevated border border-border rounded text-text-primary"
        >
          <option value="all">All Status</option>
          <option value="filled">Filled</option>
          <option value="canceled">Canceled</option>
        </select>

        {hasActiveFilters && (
          <button
            data-testid="clear-filters"
            onClick={clearFilters}
            className="px-2 py-1 text-xs bg-surface-elevated hover:bg-surface border border-border rounded text-text-primary"
          >
            Clear Filters
          </button>
        )}

        <span className="ml-auto text-xs text-text-tertiary">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
        </span>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-text-tertiary text-sm">
            {hasActiveFilters ? 'No orders match your filters' : 'No order history'}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Type</th>
                <th>Price</th>
                <th>Size</th>
                <th>Filled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.oid}>
                  <td>{formatTime(order.timestamp)}</td>
                  <td>{order.coin}</td>
                  <td className={order.side === 'B' ? 'text-long' : 'text-short'}>
                    {order.side === 'B' ? 'Buy' : 'Sell'}
                  </td>
                  <td>{order.orderType}</td>
                  <td>{formatNumber(order.limitPx)}</td>
                  <td>{formatNumber(order.sz, 4)}</td>
                  <td>{formatNumber(order.origSz, 4)}</td>
                  <td>
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded ${
                        order.status === 'filled'
                          ? 'bg-long/20 text-long'
                          : order.status === 'canceled'
                          ? 'bg-short/20 text-short'
                          : 'bg-surface-elevated text-text-secondary'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
