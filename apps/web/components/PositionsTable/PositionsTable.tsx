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
import { useLiquidationMonitor } from '../../hooks/useLiquidationMonitor';

export function PositionsTable() {
  const { positions, setPositions, removePosition } = useOrderStore();
  const { isConnected, address } = useWalletStore();
  const { getPositions, closePosition, modifyPosition, setMarginMode } = useApi();
  const { allMids } = useMarketStore();
  const { success, error } = useToast();
  const { calculateLiquidationRisk, getRiskBadgeClass, getRiskLabel } = useLiquidationMonitor();
  const [markPrices, setMarkPrices] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [marginModeModalOpen, setMarginModeModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [isSettingMargin, setIsSettingMargin] = useState(false);

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

  // Load positions when wallet connects
  useEffect(() => {
    // In test mode, don't load from API (positions are added directly to store)
    if (isTestMode) {
      return;
    }

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
      return undefined;
    }
  }, [isConnected, address, isTestMode]);

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

    // For long: PnL = (markPrice - entryPx) * sz
    // For short: PnL = (entryPx - markPrice) * sz
    const pnl = pos.side === 'long'
      ? (markPrice - pos.entryPx) * pos.sz
      : (pos.entryPx - markPrice) * pos.sz;
    return pnl;
  };

  // Format number with commas and fixed decimals (always shows decimals)
  const formatFixedDecimals = (num: number, decimals: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Format number with commas and variable decimals (trims trailing zeros)
  const formatVariableDecimals = (num: number, maxDecimals: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals
    });
  };

  // Get PnL class (for td)
  const getPnlClass = (pnl: number) => {
    return pnl >= 0 ? 'text-long' : 'text-short';
  };

  // Format PnL value with sign
  const formatPnlValue = (pnl: number) => {
    return `${pnl >= 0 ? '+' : ''}${formatFixedDecimals(pnl, 2)}`;
  };

  // Handle close position click
  const handleOpenCloseModal = (position: Position) => {
    setSelectedPosition(position);
    setModalOpen(true);
  };

  // Confirm close position
  const handleConfirmClose = async () => {
    if (!selectedPosition || (!address && !isTestMode)) return;

    setIsClosing(true);
    try {
      // In test mode, skip API call
      if (!isTestMode) {
        // Call the API to close the position
        await closePosition({
          coin: selectedPosition.coin,
          signature: 'mock-signature', // In real implementation, this would come from wallet
          timestamp: Date.now(),
        });
      }

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
    if (!selectedPosition || (!address && !isTestMode)) return;

    setIsModifying(true);
    try {
      // In test mode, skip API call
      if (!isTestMode) {
        // Call the API to modify the position
        await modifyPosition({
          coin: selectedPosition.coin,
          addSize,
          reduceSize,
          signature: 'mock-signature', // In real implementation, this would come from wallet
          timestamp: Date.now(),
        });
      }

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
    if (!selectedPosition || (!address && !isTestMode)) return;

    setIsSettingMargin(true);
    try {
      // In test mode, skip API call
      if (!isTestMode) {
        // Call the API to set margin mode
        await setMarginMode({
          coin: selectedPosition.coin,
          marginType,
          signature: 'mock-signature', // In real implementation, this would come from wallet
          timestamp: Date.now(),
        });
      }

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

  if (!isConnected && !isTestMode) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none" data-testid="positions-table">
        Connect your wallet to view positions and orders
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="p-4 text-center text-text-tertiary text-sm pointer-events-none" data-testid="positions-table">
        No open positions
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto" data-testid="positions-table">
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
              <th>Liq. Risk</th>
              <th>Margin Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, idx) => {
              const markPrice = markPrices[pos.coin];
              const realTimePnl = markPrice ? calculateRealTimePnl(pos) : null;
              const risk = calculateLiquidationRisk(pos);
              const rowClass = risk && risk.riskLevel !== 'low'
                ? `border-l-4 ${risk.riskLevel === 'critical' ? 'border-red-500' : risk.riskLevel === 'high' ? 'border-orange-500' : 'border-yellow-500'}`
                : '';
              // Determine unrealized PnL value and class
              const unrealizedPnlValue = realTimePnl !== null ? realTimePnl : pos.unrealizedPnl;
              const unrealizedPnlClass = getPnlClass(unrealizedPnlValue);
              const unrealizedPnlText = formatPnlValue(unrealizedPnlValue);

              // Realized PnL
              const realizedPnlClass = getPnlClass(pos.realizedPnl);
              const realizedPnlText = formatPnlValue(pos.realizedPnl);

              return (
                <tr key={idx} className={rowClass}>
                  <td>{pos.coin}</td>
                  <td className={pos.side === 'long' ? 'text-long' : 'text-short'}>
                    {pos.side.toUpperCase()}
                  </td>
                  <td>{formatVariableDecimals(pos.sz, 4)}</td>
                  <td>{formatFixedDecimals(pos.entryPx, 2)}</td>
                  <td>{markPrice ? formatFixedDecimals(markPrice, 2) : '--'}</td>
                  <td className={unrealizedPnlClass}>{unrealizedPnlText}</td>
                  <td className={realizedPnlClass}>{realizedPnlText}</td>
                  <td>{pos.leverage}x</td>
                  <td>{formatFixedDecimals(pos.marginUsed, 2)}</td>
                  <td>{formatFixedDecimals(pos.liquidationPx, 2)}</td>
                  <td>
                    {risk && risk.riskLevel !== 'low' && (
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskBadgeClass(risk.riskLevel)}`} data-testid={`liquidation-risk-${pos.coin}`}>
                        {getRiskLabel(risk.riskLevel)} ({risk.distancePercent.toFixed(1)}%)
                      </span>
                    )}
                    {(!risk || risk.riskLevel === 'low') && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30" data-testid={`liquidation-risk-${pos.coin}`}>
                        SAFE
                      </span>
                    )}
                  </td>
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
