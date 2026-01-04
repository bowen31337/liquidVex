/**
 * Positions Table component
 */

'use client';

import { useEffect } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useWalletStore } from '../../stores/walletStore';
import { useApi } from '../../hooks/useApi';

export function PositionsTable() {
  const { positions, setPositions } = useOrderStore();
  const { isConnected, address } = useWalletStore();
  const { getPositions } = useApi();

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

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatPnl = (pnl: number) => {
    const cls = pnl >= 0 ? 'text-long' : 'text-short';
    return <span className={cls}>{pnl >= 0 ? '+' : ''}{formatNumber(pnl)}</span>;
  };

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm">
        Connect your wallet to view positions
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm">
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
          {positions.map((pos, idx) => (
            <tr key={idx}>
              <td>{pos.coin}</td>
              <td className={pos.side === 'long' ? 'text-long' : 'text-short'}>
                {pos.side.toUpperCase()}
              </td>
              <td>{formatNumber(pos.sz, 4)}</td>
              <td>{formatNumber(pos.entryPx)}</td>
              <td>--</td> {/* Would need current price */}
              <td>{formatPnl(pos.unrealizedPnl)}</td>
              <td>{formatPnl(pos.realizedPnl)}</td>
              <td>{pos.leverage}x</td>
              <td>{formatNumber(pos.marginUsed)}</td>
              <td>{formatNumber(pos.liquidationPx)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
