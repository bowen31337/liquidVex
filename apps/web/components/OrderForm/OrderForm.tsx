/**
 * Order Entry Form component
 */

'use client';

import { useState, useEffect } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useWalletStore } from '../../stores/walletStore';
import { useMarketStore } from '../../stores/marketStore';

export function OrderForm() {
  const { orderForm, setOrderForm, resetOrderForm } = useOrderStore();
  const { isConnected } = useWalletStore();
  const { currentPrice } = useMarketStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate order value
  const orderValue = (() => {
    const price = parseFloat(orderForm.price) || 0;
    const size = parseFloat(orderForm.size) || 0;
    return price * size;
  })();

  // Get available balance (mock)
  const availableBalance = 10000; // Would come from account state

  // Handle input changes
  const handleInputChange = (field: string, value: string | number | boolean) => {
    setOrderForm({ [field]: value });
    setError(null);
  };

  // Handle side toggle
  const handleSideToggle = (side: 'buy' | 'sell') => {
    setOrderForm({ side });
  };

  // Handle order type change
  const handleTypeChange = (type: 'limit' | 'market' | 'stop_limit' | 'stop_market') => {
    setOrderForm({ type });
  };

  // Percentage buttons
  const handlePercentage = (pct: number) => {
    if (!isConnected) {
      setError('Connect wallet first');
      return;
    }

    // Calculate max size based on available balance and current price
    const maxSize = availableBalance / (parseFloat(orderForm.price) || currentPrice);
    const newSize = maxSize * (pct / 100);
    setOrderForm({ size: newSize.toFixed(4) });
  };

  // Increment/decrement price
  const adjustPrice = (delta: number) => {
    const current = parseFloat(orderForm.price) || currentPrice;
    const newPrice = Math.max(0, current + delta);
    setOrderForm({ price: newPrice.toFixed(2) });
  };

  // Validate form
  const validate = () => {
    if (!isConnected) {
      setError('Connect wallet first');
      return false;
    }

    const price = parseFloat(orderForm.price);
    const size = parseFloat(orderForm.size);

    if (orderForm.type === 'limit' && (!price || price <= 0)) {
      setError('Invalid price');
      return false;
    }

    if (!size || size <= 0) {
      setError('Invalid size');
      return false;
    }

    if (orderForm.type === 'limit' && orderForm.postOnly) {
      // Check if order would cross spread
      if (orderForm.side === 'buy' && price >= currentPrice) {
        setError('Post-only buy order would cross spread');
        return false;
      }
      if (orderForm.side === 'sell' && price <= currentPrice) {
        setError('Post-only sell order would cross spread');
        return false;
      }
    }

    return true;
  };

  // Submit order
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Mock order submission
      await new Promise(resolve => setTimeout(resolve, 500));

      // In real implementation, call API
      // await placeOrder({ ...orderForm, signature: '...', timestamp: Date.now() });

      setSuccess(`Order placed: ${orderForm.side.toUpperCase()} ${orderForm.size} ${orderForm.type}`);
      resetOrderForm();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get submit button text and style
  const submitConfig = {
    text: orderForm.side === 'buy' ? 'Buy / Long' : 'Sell / Short',
    className: orderForm.side === 'buy' ? 'btn btn-buy' : 'btn btn-sell',
  };

  // Show price input for limit/stop orders
  const showPriceInput = ['limit', 'stop_limit', 'stop_market'].includes(orderForm.type);

  return (
    <div className="panel p-3 flex flex-col h-full">
      {/* Buy/Sell Toggle */}
      <div className="flex mb-4">
        <button
          onClick={() => handleSideToggle('buy')}
          className={`flex-1 py-2 text-center rounded-l font-medium transition-colors ${
            orderForm.side === 'buy'
              ? 'bg-long text-white'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => handleSideToggle('sell')}
          className={`flex-1 py-2 text-center rounded-r font-medium transition-colors ${
            orderForm.side === 'sell'
              ? 'bg-short text-white'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          Sell / Short
        </button>
      </div>

      {/* Order Type */}
      <div className="mb-3">
        <label className="text-xs text-text-secondary uppercase tracking-wider">
          Order Type
        </label>
        <select
          value={orderForm.type}
          onChange={(e) => handleTypeChange(e.target.value as any)}
          className="input w-full mt-1"
        >
          <option value="limit">Limit</option>
          <option value="market">Market</option>
          <option value="stop_limit">Stop Limit</option>
          <option value="stop_market">Stop Market</option>
        </select>
      </div>

      {/* Price Input */}
      {showPriceInput && (
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <label className="text-xs text-text-secondary uppercase tracking-wider">
              Price
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => adjustPrice(-0.5)}
                className="px-2 py-0.5 text-xs bg-surface-elevated rounded hover:text-text-primary"
              >
                -
              </button>
              <button
                onClick={() => adjustPrice(0.5)}
                className="px-2 py-0.5 text-xs bg-surface-elevated rounded hover:text-text-primary"
              >
                +
              </button>
            </div>
          </div>
          <input
            type="number"
            value={orderForm.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="0.00"
            className="input w-full mt-1 font-mono"
          />
        </div>
      )}

      {/* Size Input */}
      <div className="mb-3">
        <label className="text-xs text-text-secondary uppercase tracking-wider">
          Size
        </label>
        <input
          type="number"
          value={orderForm.size}
          onChange={(e) => handleInputChange('size', e.target.value)}
          placeholder="0.00"
          className="input w-full mt-1 font-mono"
        />
        <div className="flex gap-1 mt-2">
          {['25%', '50%', '75%', '100%'].map((pct, idx) => (
            <button
              key={pct}
              onClick={() => handlePercentage([25, 50, 75, 100][idx])}
              className="flex-1 py-1 text-xs text-text-secondary bg-surface-elevated rounded hover:text-text-primary"
            >
              {pct}
            </button>
          ))}
        </div>
      </div>

      {/* Leverage */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-text-secondary uppercase tracking-wider">
          <span>Leverage</span>
          <span className="text-text-primary">{orderForm.leverage}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={orderForm.leverage}
          onChange={(e) => handleInputChange('leverage', parseInt(e.target.value))}
          className="w-full mt-1"
        />
      </div>

      {/* Options */}
      <div className="flex gap-4 text-xs mb-3">
        <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={orderForm.reduceOnly}
            onChange={(e) => handleInputChange('reduceOnly', e.target.checked)}
            className="rounded"
          />
          Reduce Only
        </label>
        {orderForm.type === 'limit' && (
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={orderForm.postOnly}
              onChange={(e) => handleInputChange('postOnly', e.target.checked)}
              className="rounded"
            />
            Post Only
          </label>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`${submitConfig.className} w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isSubmitting ? 'Processing...' : submitConfig.text}
      </button>

      {/* Order Summary */}
      <div className="text-xs text-text-tertiary space-y-1 pt-2 border-t border-border">
        <div className="flex justify-between">
          <span>Order Value</span>
          <span className="text-text-secondary font-mono">
            ${orderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Available</span>
          <span className="text-text-secondary font-mono">
            ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mt-2 text-xs text-short bg-surface-elevated px-2 py-1 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-2 text-xs text-long bg-surface-elevated px-2 py-1 rounded">
          {success}
        </div>
      )}
    </div>
  );
}
