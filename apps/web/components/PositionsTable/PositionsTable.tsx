/**
 * Positions Table component
 */

'use client';

import { useEffect, useState } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useWalletStore } from '../../stores/walletStore';
import { useApi } from '../../hooks/useApi';
import { useMarketStore } from '../../stores/marketStore';

export function PositionsTable() {
  const { positions, setPositions } = useOrderStore();
  const { isConnected, address } = useWalletStore();
  const { getPositions } = useApi();
  const { allMids } = useMarketStore();
  const [markPrices, setMarkPrices] = useState<Record<string, number>>({});

  // Load positions when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      const loadPositions = async () => {
        try {
          const data = await getPositions(address);
          setPositions(data);
        } catch (err) {
          console.error('Failed to load positions:', err);
        }
      };
      loadPositions();

      // Refresh every 5 seconds
      const interval = setInterval(loadPositions, 5000);
      return () => clearInterval(interval);
    } else {
      setPositions([]);
    }
  }, [isConnected, address]);

  // Update mark prices from allMids (real-time updates)
  useEffect(() => {
    if (positions.length > 0 && Object.keys(allMids).length > 0) {
      const newMarkPrices: Record<string, number> = {};
      positions.forEach(pos => {
        // Try to find the mid price for this coin
        // Handle different naming conventions (BTC vs BTC-PERP)
        let price = allMids[pos.coin];
        if (!price) {
          // Try with -PERP suffix
          price = allMids[`${pos.coin}-PERP`];
        }
        if (!price) {
          // Try without -PERP suffix
          const baseCoin = pos.coin.replace(/-PERP$/, '');
          price = allMids[baseCoin];
        }
        if (price) {
          newMarkPrices[pos.coin] = price;
        }
      });
      if (Object.keys(newMarkPrices).length > 0) {
        setMarkPrices(prev => ({ ...prev, ...newMarkPrices }));
      }
    }
  }, [positions, allMids]);

  // Calculate real-time PnL based on mark prices
  const calculateRealTimePnl = (pos: any) => {
    const markPrice = markPrices[pos.coin];
    if (!markPrice) return null;

    const entryValue = pos.entryPx * pos.sz;
    const currentValue = markPrice * pos.sz;
    const pnl = pos.side === 'long' ? currentValue - entryValue : entryValue - currentValue;
    return pnl;
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPnl = (pnl: number) => {
    const cls = pnl >= 0 ? 'text-long' : 'text-short';
    return <span className={cls}>{pnl >= 0 ? '+' : ''}{formatNumber(pnl)}</span>;
  };

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none">
        Connect your wallet to view positions and orders
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none">
        No open positions
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="data-table w-full">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Side</th>
            <th>Size</th>
            <th>Entry</th>
            <th>Mark</th>
            <th>Unrealized PnL</th>
            <th>Realized PnL</th>
            <th>Leverage</th>
            <th>Margin</th>
            <th>Liq. Price</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos, idx) => {
            const markPrice = markPrices[pos.coin];
            const realTimePnl = markPrice ? calculateRealTimePnl(pos) : null;
            return (
              <tr key={idx}>
                <td>{pos.coin}</td>
                <td className={pos.side === 'long' ? 'text-long' : 'text-short'}>
                  {pos.side.toUpperCase()}
                </td>
                <td>{formatNumber(pos.sz, 4)}</td>
                <td>{formatNumber(pos.entryPx)}</td>
                <td>{markPrice ? formatNumber(markPrice) : '--'}</td>
                <td>
                  {realTimePnl !== null
                    ? formatPnl(realTimePnl)
                    : formatPnl(pos.unrealizedPnl)
                  }
                </td>
                <td>{formatPnl(pos.realizedPnl)}</td>
                <td>{pos.leverage}x</td>
                <td>{formatNumber(pos.marginUsed)}</td>
                <td>{formatNumber(pos.liquidationPx)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
