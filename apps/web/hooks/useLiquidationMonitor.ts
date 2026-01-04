/**
 * Hook for monitoring liquidation risk on positions
 */

'use client';

import { useEffect, useRef } from 'react';
import { useOrderStore } from '../stores/orderStore';
import { useMarketStore } from '../stores/marketStore';
import { useToast } from '../components/Toast/Toast';
import { Position } from '../types';

export interface LiquidationRisk {
  position: Position;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  distancePercent: number; // How close to liquidation (0 = liquidated, 100 = far away)
  estimatedLoss: number;
}

export function useLiquidationMonitor() {
  const { positions } = useOrderStore();
  const { allMids } = useMarketStore();
  const { warning, error } = useToast();
  const warnedPositions = useRef<Set<string>>(new Set());
  const lastRiskLevels = useRef<Map<string, 'low' | 'medium' | 'high' | 'critical'>>(new Map());

  // Calculate liquidation risk for a position
  const calculateLiquidationRisk = (position: Position): LiquidationRisk | null => {
    const markPrice = allMids[position.coin];
    if (!markPrice) return null;

    // Calculate distance to liquidation
    let distanceToLiquidation: number;
    let estimatedLoss: number;

    if (position.side === 'long') {
      // Long position: liquidation when price drops below liquidation price
      distanceToLiquidation = markPrice - position.liquidationPx;
      // Unrealized PnL calculation
      estimatedLoss = (position.entryPx - markPrice) * position.sz;
    } else {
      // Short position: liquidation when price rises above liquidation price
      distanceToLiquidation = position.liquidationPx - markPrice;
      estimatedLoss = (markPrice - position.entryPx) * position.sz;
    }

    // Calculate distance as percentage of entry price
    const distancePercent = (distanceToLiquidation / position.entryPx) * 100;

    // Determine risk level based on distance percentage
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (distancePercent <= 0) {
      riskLevel = 'critical'; // Already liquidated or very close
    } else if (distancePercent < 2) {
      riskLevel = 'critical'; // Within 2% of liquidation
    } else if (distancePercent < 5) {
      riskLevel = 'high'; // Within 5% of liquidation
    } else if (distancePercent < 10) {
      riskLevel = 'medium'; // Within 10% of liquidation
    } else {
      riskLevel = 'low'; // Safe zone
    }

    return {
      position,
      riskLevel,
      distancePercent: Math.max(0, distancePercent),
      estimatedLoss: Math.abs(estimatedLoss),
    };
  };

  // Monitor positions for liquidation risk
  useEffect(() => {
    if (positions.length === 0) return;

    positions.forEach((position) => {
      const risk = calculateLiquidationRisk(position);
      if (!risk) return;

      const positionKey = `${position.coin}-${position.side}`;
      const previousRiskLevel = lastRiskLevels.current.get(positionKey);
      const hasBeenWarned = warnedPositions.current.has(positionKey);

      // Only show warnings for medium, high, or critical risk
      if (risk.riskLevel === 'medium' || risk.riskLevel === 'high' || risk.riskLevel === 'critical') {
        // Show warning if risk increased or if this is the first time we're detecting this level
        if (!hasBeenWarned || (previousRiskLevel && risk.riskLevel !== previousRiskLevel)) {
          const positionDesc = `${position.coin} ${position.side.toUpperCase()} position`;

          if (risk.riskLevel === 'critical') {
            error(`⚠️ CRITICAL: ${positionDesc} is at ${risk.distancePercent.toFixed(1)}% from liquidation!`, 5000);
            warnedPositions.current.add(positionKey);
          } else if (risk.riskLevel === 'high') {
            warning(`⚠️ High risk: ${positionDesc} is ${risk.distancePercent.toFixed(1)}% from liquidation`, 4000);
            warnedPositions.current.add(positionKey);
          } else if (risk.riskLevel === 'medium') {
            warning(`⚠️ Medium risk: ${positionDesc} is ${risk.distancePercent.toFixed(1)}% from liquidation`, 3000);
            warnedPositions.current.add(positionKey);
          }
        }
      } else if (risk.riskLevel === 'low' && hasBeenWarned) {
        // Position is now safe, clear the warning flag
        warnedPositions.current.delete(positionKey);
      }

      // Update the last risk level
      lastRiskLevels.current.set(positionKey, risk.riskLevel);
    });

    // Clean up positions that no longer exist
    const currentKeys = new Set(positions.map(p => `${p.coin}-${p.side}`));
    warnedPositions.current.forEach((value, key) => {
      if (!currentKeys.has(key)) {
        warnedPositions.current.delete(key);
        lastRiskLevels.current.delete(key);
      }
    });
  }, [positions, allMids]);

  // Public API to get current risk levels
  const getRiskLevel = (position: Position): LiquidationRisk | null => {
    return calculateLiquidationRisk(position);
  };

  const getRiskBadgeClass = (riskLevel: 'low' | 'medium' | 'high' | 'critical'): string => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500';
      default:
        return 'bg-surface-elevated text-text-secondary';
    }
  };

  const getRiskLabel = (riskLevel: 'low' | 'medium' | 'high' | 'critical'): string => {
    switch (riskLevel) {
      case 'critical':
        return 'CRITICAL';
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      case 'low':
        return 'LOW';
      default:
        return 'UNKNOWN';
    }
  };

  return {
    calculateLiquidationRisk,
    getRiskLevel,
    getRiskBadgeClass,
    getRiskLabel,
  };
}
