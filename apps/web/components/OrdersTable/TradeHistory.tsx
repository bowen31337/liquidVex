/**
 * Trade History component
 */

'use client';

import { useEffect } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useWalletStore } from '../../stores/walletStore';
import { useApi } from '../../hooks/useApi';

export function TradeHistory() {
  const { tradeHistory, setTradeHistory } = useOrderStore();
  const { isConnected, address } = useWalletStore();
  const { getAccountHistory } = useApi();

  // Load trade history when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      const loadHistory = async () => {
        try {
          const data = await getAccountHistory(address);
          setTradeHistory(data.trades);
        } catch (err) {
          console.error('Failed to load trade history:', err);
        }
      };
      loadHistory();
    } else {
      setTradeHistory([]);
    }
  }, [isConnected, address]);

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none">
        Connect your wallet to view trade history
      </div>
    );
  }

  if (tradeHistory.length === 0) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none">
        No trade history
      </div>
    );
  }

  return (
    <div className="overflow-auto">
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
          {tradeHistory.map((trade, idx) => (
            <tr key={idx}>
              <td>{formatTime(trade.time)}</td>
              <td>{trade.coin}</td>
              <td className={trade.side === 'B' ? 'text-long' : 'text-short'}>
                {trade.side === 'B' ? 'Buy' : 'Sell'}
              </td>
              <td>{formatNumber(trade.px)}</td>
              <td>{formatNumber(trade.sz, 4)}</td>
              <td>{formatNumber(trade.fee)}</td>
              <td className="text-text-tertiary">{trade.hash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
