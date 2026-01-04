/**
 * Positions Table component
 */

'use client';

import { useEffect, useState } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useWalletStore } from '../../stores/walletStore';
import { useApi } from '../../hooks/useApi';
import { useMarketStore } from '../../stores/marketStore';
import { PositionCloseModal } from '../Modal/PositionCloseModal';
import { PositionModifyModal } from '../Modal/PositionModifyModal';
import { MarginModeModal } from '../Modal/MarginModeModal';
import { useToast } from '../Toast/Toast';
import { Position } from '../../types';

export function PositionsTable() {
  const { positions, setPositions, removePosition } = useOrderStore();
  const { isConnected, address } = useWalletStore();
  const { getPositions, closePosition, modifyPosition, setMarginMode } = useApi();
  const { allMids } = useMarketStore();
  const { success, error } = useToast();
  const [markPrices, setMarkPrices] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [marginModeModalOpen, setMarginModeModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [isSettingMargin, setIsSettingMargin] = useState(false);

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

  // Handle close position click
  const handleOpenCloseModal = (position: Position) => {
    setSelectedPosition(position);
    setModalOpen(true);
  };

  // Confirm close position
  const handleConfirmClose = async () => {
    if (!selectedPosition || !address) return;

    setIsClosing(true);
    try {
      // Call the API to close the position
      await closePosition({
        coin: selectedPosition.coin,
        signature: 'mock-signature', // In real implementation, this would come from wallet
        timestamp: Date.now(),
      });

      // Remove position from store
      removePosition(selectedPosition.coin);

      // Show success toast
      success(`Position for ${selectedPosition.coin} closed successfully`);

      // Close modal
      setModalOpen(false);
      setSelectedPosition(null);
    } catch (err) {
      console.error('Failed to close position:', err);
      error(`Failed to close ${selectedPosition.coin} position`);
    } finally {
      setIsClosing(false);
    }
  };

  // Cancel close modal
  const handleCancelClose = () => {
    setModalOpen(false);
    setSelectedPosition(null);
    setIsClosing(false);
  };

  // Handle modify position click
  const handleOpenModifyModal = (position: Position) => {
    setSelectedPosition(position);
    setModifyModalOpen(true);
  };

  // Confirm modify position
  const handleConfirmModify = async (addSize?: number, reduceSize?: number) => {
    if (!selectedPosition || !address) return;

    setIsModifying(true);
    try {
      // Call the API to modify the position
      await modifyPosition({
        coin: selectedPosition.coin,
        addSize,
        reduceSize,
        signature: 'mock-signature', // In real implementation, this would come from wallet
        timestamp: Date.now(),
      });

      // Show success toast
      const action = addSize ? `added ${addSize}` : `reduced ${reduceSize}`;
      success(`Position for ${selectedPosition.coin} ${action} successfully`);

      // Close modal
      setModifyModalOpen(false);
      setSelectedPosition(null);
    } catch (err) {
      console.error('Failed to modify position:', err);
      error(`Failed to modify ${selectedPosition.coin} position`);
    } finally {
      setIsModifying(false);
    }
  };

  // Cancel modify modal
  const handleCancelModify = () => {
    setModifyModalOpen(false);
    setSelectedPosition(null);
    setIsModifying(false);
  };

  // Handle margin mode click
  const handleOpenMarginModeModal = (position: Position) => {
    setSelectedPosition(position);
    setMarginModeModalOpen(true);
  };

  // Confirm margin mode change
  const handleConfirmMarginMode = async (marginType: 'cross' | 'isolated') => {
    if (!selectedPosition || !address) return;

    setIsSettingMargin(true);
    try {
      // Call the API to set margin mode
      await setMarginMode({
        coin: selectedPosition.coin,
        marginType,
        signature: 'mock-signature', // In real implementation, this would come from wallet
        timestamp: Date.now(),
      });

      // Show success toast
      success(`Margin mode for ${selectedPosition.coin} set to ${marginType}`);

      // Close modal
      setMarginModeModalOpen(false);
      setSelectedPosition(null);
    } catch (err) {
      console.error('Failed to set margin mode:', err);
      error(`Failed to set margin mode for ${selectedPosition.coin}`);
    } finally {
      setIsSettingMargin(false);
    }
  };

  // Cancel margin mode modal
  const handleCancelMarginMode = () => {
    setMarginModeModalOpen(false);
    setSelectedPosition(null);
    setIsSettingMargin(false);
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
    <>
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
              <th>Margin Type</th>
              <th>Actions</th>
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
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pos.marginType === 'cross'
                        ? 'bg-long/20 text-long'
                        : 'bg-short/20 text-short'
                    }`}>
                      {pos.marginType.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenMarginModeModal(pos)}
                        className="px-2 py-1 text-xs bg-accent hover:bg-accent-muted text-white rounded disabled:opacity-50"
                        data-testid={`margin-mode-${pos.coin}`}
                      >
                        Set Mode
                      </button>
                      <button
                        onClick={() => handleOpenModifyModal(pos)}
                        className="px-2 py-1 text-xs bg-accent hover:bg-accent-muted text-white rounded disabled:opacity-50"
                        data-testid={`modify-position-${pos.coin}`}
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => handleOpenCloseModal(pos)}
                        className="px-2 py-1 text-xs bg-short hover:bg-short-muted text-white rounded disabled:opacity-50"
                        data-testid={`close-position-${pos.coin}`}
                      >
                        Close
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Position Close Confirmation Modal */}
      <PositionCloseModal
        isOpen={modalOpen}
        position={selectedPosition}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        isSubmitting={isClosing}
      />

      {/* Position Modify Modal */}
      <PositionModifyModal
        isOpen={modifyModalOpen}
        position={selectedPosition}
        onConfirm={handleConfirmModify}
        onCancel={handleCancelModify}
        isSubmitting={isModifying}
      />

      {/* Margin Mode Selection Modal */}
      <MarginModeModal
        isOpen={marginModeModalOpen}
        position={selectedPosition}
        onConfirm={handleConfirmMarginMode}
        onCancel={handleCancelMarginMode}
        isSubmitting={isSettingMargin}
      />
    </>
  );
}
