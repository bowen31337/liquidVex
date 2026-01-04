/**
 * Liquidation Price Calculator
 * Calculates liquidation price based on position parameters
 */

'use client';

import { useState, useEffect } from 'react';

interface CalculatorState {
  positionSize: string;
  entryPrice: string;
  leverage: string;
  marginType: 'cross' | 'isolated';
}

export function LiquidationCalculator() {
  const [state, setState] = useState<CalculatorState>({
    positionSize: '',
    entryPrice: '',
    leverage: '10',
    marginType: 'cross',
  });

  const [liquidationPrice, setLiquidationPrice] = useState<number | null>(null);

  // Calculate liquidation price
  useEffect(() => {
    const size = parseFloat(state.positionSize);
    const entry = parseFloat(state.entryPrice);
    const lev = parseFloat(state.leverage);

    if (!size || !entry || !lev || lev <= 0) {
      setLiquidationPrice(null);
      return;
    }

    // Liquidation price formula for perpetual futures
    // For long: entry - (entry / leverage)
    // For short: entry + (entry / leverage)
    // This is a simplified formula - real Hyperliquid formula is more complex

    // Assuming long position for calculation
    // Liquidation occurs when position value = margin used + fees
    // For isolated margin: liq_price = entry - (entry / leverage)
    // For cross margin: depends on account balance

    const liqPrice = entry - (entry / lev);
    setLiquidationPrice(liqPrice);
  }, [state]);

  const handleInputChange = (field: keyof CalculatorState, value: string | 'cross' | 'isolated') => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateRisk = () => {
    if (!liquidationPrice) return null;
    const entry = parseFloat(state.entryPrice);
    if (!entry) return null;

    const liqDistance = ((entry - liquidationPrice) / entry) * 100;
    return {
      distance: liqDistance.toFixed(2),
      status: liqDistance > 10 ? 'Low Risk' : liqDistance > 5 ? 'Medium Risk' : 'High Risk',
    };
  };

  const risk = calculateRisk();

  return (
    <div className="p-4 space-y-4" data-testid="liquidation-calculator">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Liquidation Calculator</h3>
        <span className="text-xs text-text-tertiary">Est. liquidation price</span>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Position Size</label>
          <input
            type="number"
            value={state.positionSize}
            onChange={(e) => handleInputChange('positionSize', e.target.value)}
            placeholder="0.0000"
            className="w-full px-3 py-2 bg-surface border border-border rounded font-mono text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">Entry Price</label>
          <input
            type="number"
            value={state.entryPrice}
            onChange={(e) => handleInputChange('entryPrice', e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-surface border border-border rounded font-mono text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">Leverage</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={state.leverage}
              onChange={(e) => handleInputChange('leverage', e.target.value)}
              min="1"
              max="100"
              className="w-full px-3 py-2 bg-surface border border-border rounded font-mono text-text-primary focus:outline-none focus:border-accent"
            />
            <span className="text-text-secondary self-center">x</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">Margin Type</label>
          <select
            value={state.marginType}
            onChange={(e) => handleInputChange('marginType', e.target.value as 'cross' | 'isolated')}
            className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="cross">Cross</option>
            <option value="isolated">Isolated</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-surface-elevated border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Liquidation Price</span>
          <span className={`text-xl font-mono font-bold ${liquidationPrice !== null ? 'text-short' : 'text-text-tertiary'}`}>
            {liquidationPrice !== null ? formatPrice(liquidationPrice) : '--'}
          </span>
        </div>

        {liquidationPrice !== null && risk && (
          <>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary">Distance from Entry</span>
              <span className={`text-sm font-medium ${
                parseFloat(risk.distance) > 10 ? 'text-long' :
                parseFloat(risk.distance) > 5 ? 'text-accent' : 'text-short'
              }`}>
                {risk.distance}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Risk Level</span>
              <span className={`text-sm font-bold px-2 py-1 rounded ${
                risk.status === 'Low Risk' ? 'bg-long/20 text-long' :
                risk.status === 'Medium Risk' ? 'bg-accent/20 text-accent' :
                'bg-short/20 text-short'
              }`}>
                {risk.status}
              </span>
            </div>

            {/* Warning for high risk */}
            {parseFloat(risk.distance) < 5 && (
              <div className="bg-short/10 border border-short/30 rounded p-2">
                <p className="text-xs text-short">
                  ⚠️ High liquidation risk! Consider reducing leverage or adding margin.
                </p>
              </div>
            )}
          </>
        )}

        {!liquidationPrice && state.positionSize && state.entryPrice && state.leverage && (
          <div className="text-xs text-text-tertiary text-center py-2">
            Enter valid values to calculate
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-accent/10 border border-accent/30 rounded p-3">
        <p className="text-xs text-accent">
          <strong>Note:</strong> This calculator provides estimates. Actual liquidation prices may vary based on:
        </p>
        <ul className="text-xs text-accent mt-1 list-disc list-inside">
          <li>Trading fees</li>
          <li>Funding payments</li>
          <li>Account balance (for cross margin)</li>
          <li>Market conditions</li>
        </ul>
      </div>
    </div>
  );
}
