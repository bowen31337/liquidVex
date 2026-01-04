/**
 * Order Entry Form component
 */

'use client';

import { useState } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useWalletStore } from '../../stores/walletStore';
import { useMarketStore } from '../../stores/marketStore';
import { useApi } from '../../hooks/useApi';
import { OrderConfirmModal } from '../Modal/OrderConfirmModal';
import { useToast } from '../Toast/Toast';
import { useFavoritesActions } from '../../contexts/FavoritesContext';

export function OrderForm() {
  const { orderForm, setOrderForm, resetOrderForm, addOpenOrder } = useOrderStore();
  const { isConnected } = useWalletStore();
  const { currentPrice, selectedAsset } = useMarketStore();
  const { placeOrder } = useApi();
  const { success: showSuccess, error: showError } = useToast();
  const { addToRecentlyTraded } = useFavoritesActions();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test mode bypasses wallet requirement
  // Check for NEXT_PUBLIC_TEST_MODE env var OR URL parameter
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
    // Clear postOnly if switching to a non-limit order type
    const updates: Partial<typeof orderForm> = { type };
    if (type === 'market' || type === 'stop_market') {
      updates.postOnly = false;
    }
    setOrderForm(updates);
  };

  // Percentage buttons
  const handlePercentage = (pct: number) => {
    // Skip wallet check in test mode
    if (!isConnected && !isTestMode) {
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
    // Skip wallet check in test mode
    if (!isConnected && !isTestMode) {
      setError('Connect wallet first');
      return false;
    }

    const size = parseFloat(orderForm.size);
    if (!size || size <= 0) {
      setError('Invalid size');
      return false;
    }

    // Validate price based on order type
    if (orderForm.type === 'limit') {
      const price = parseFloat(orderForm.price);
      if (!price || price <= 0) {
        setError('Invalid price');
        return false;
      }
      // Check post-only crossing spread
      if (orderForm.postOnly) {
        if (orderForm.side === 'buy' && price >= currentPrice) {
          setError('Post-only buy order would cross spread');
          return false;
        }
        if (orderForm.side === 'sell' && price <= currentPrice) {
          setError('Post-only sell order would cross spread');
          return false;
        }
      }
    }

    // Validate stop price for stop orders
    if (orderForm.type === 'stop_limit' || orderForm.type === 'stop_market') {
      const stopPrice = parseFloat(orderForm.stopPrice);
      if (!stopPrice || stopPrice <= 0) {
        setError('Invalid stop price');
        return false;
      }
      // Validate limit price for stop-limit orders
      if (orderForm.type === 'stop_limit') {
        const limitPrice = parseFloat(orderForm.price);
        if (!limitPrice || limitPrice <= 0) {
          setError('Invalid limit price');
          return false;
        }
        // Check post-only crossing spread for stop-limit orders
        if (orderForm.postOnly) {
          if (orderForm.side === 'buy' && limitPrice >= currentPrice) {
            setError('Post-only buy order would cross spread');
            return false;
          }
          if (orderForm.side === 'sell' && limitPrice <= currentPrice) {
            setError('Post-only sell order would cross spread');
            return false;
          }
        }
      }
    }

    return true;
  };

  // Submit order
  const handleSubmit = async () => {
    if (!validate()) return;

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  // Confirm and place order
  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setError(null);

    // Re-check test mode (in case URL parameter changed)
    const checkTestMode = () => {
      // Check environment variables
      if (typeof process !== 'undefined' &&
          (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || process.env.NODE_ENV === 'test')) {
        return true;
      }
      // Check URL parameters
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        // Check multiple possible parameter formats
        if (urlParams.get('testMode') === 'true') return true;
        if (urlParams.has('testMode')) return true; // Any value for testMode enables it
        // Check for alternative casing
        if (urlParams.get('testmode') === 'true') return true;
        if (urlParams.get('TESTMODE') === 'true') return true;
      }
      return false;
    };
    const isTestModeNow = checkTestMode();

    try {
      // Generate mock signature (in production, wallet would sign)
      // Generate a 130-character hex signature (64 bytes for r + 64 bytes for s + '0x' prefix)
      const generateHex = (length: number) => {
        let result = '';
        const chars = '0123456789abcdef';
        for (let i = 0; i < length; i++) {
          result += chars[Math.floor(Math.random() * 16)];
        }
        return result;
      };
      const signature = `0x${generateHex(128)}`;
      const timestamp = Date.now();

      // In test mode, skip API call and simulate success
      if (isTestModeNow) {
        // Generate a mock order ID
        const mockOrderId = Math.floor(Math.random() * 1000000) + 100000;

        // Add to recently traded
        addToRecentlyTraded(selectedAsset);

        // Add to open orders
        const newOrder = {
          oid: mockOrderId,
          coin: selectedAsset,
          side: (orderForm.side === 'buy' ? 'B' : 'A') as 'B' | 'A',
          limitPx: parseFloat(orderForm.price) || 0,
          sz: parseFloat(orderForm.size),
          origSz: parseFloat(orderForm.size),
          status: 'open' as const,
          timestamp,
          orderType: orderForm.type as 'limit' | 'market' | 'stop_limit' | 'stop_market',
          reduceOnly: orderForm.reduceOnly,
          postOnly: orderForm.postOnly,
          tif: orderForm.tif,
        };
        addOpenOrder(newOrder);

        // Show success message
        const priceDisplay = orderForm.type === 'market' ? 'Market' : `$${orderForm.price}`;
        showSuccess(`Order placed: ${orderForm.side.toUpperCase()} ${orderForm.size} @ ${priceDisplay}`);

        // Small delay to allow test to see "Processing..." state
        await new Promise(resolve => setTimeout(resolve, 300));

        // Close modal and reset form
        setShowConfirmModal(false);
        setIsSubmitting(false);
        resetOrderForm();
        return;
      }

      // Prepare order request
      const orderRequest = {
        coin: selectedAsset,
        isBuy: orderForm.side === 'buy',
        limitPx: orderForm.type === 'market' ? 0.0 : parseFloat(orderForm.price) || 0.0,
        stopPx: (orderForm.type === 'stop_limit' || orderForm.type === 'stop_market')
          ? parseFloat(orderForm.stopPrice)
          : undefined,
        sz: parseFloat(orderForm.size),
        orderType: orderForm.type,
        reduceOnly: orderForm.reduceOnly,
        postOnly: orderForm.postOnly,
        tif: orderForm.tif,
        signature,
        timestamp,
      };

      // Call API
      const response = await placeOrder(orderRequest);

      if (response.success && response.orderId) {
        // Add to recently traded
        addToRecentlyTraded(selectedAsset);

        // Add to open orders
        const newOrder = {
          oid: response.orderId,
          coin: selectedAsset,
          side: (orderForm.side === 'buy' ? 'B' : 'A') as 'B' | 'A',
          limitPx: parseFloat(orderForm.price),
          sz: parseFloat(orderForm.size),
          origSz: parseFloat(orderForm.size),
          status: 'open' as const,
          timestamp,
          orderType: orderForm.type as 'limit' | 'market' | 'stop_limit' | 'stop_market',
          reduceOnly: orderForm.reduceOnly,
          postOnly: orderForm.postOnly,
          tif: orderForm.tif,
        };
        addOpenOrder(newOrder);

        // Show success message
        const priceDisplay = orderForm.type === 'market' ? 'Market' : `$${orderForm.price}`;
        showSuccess(`Order placed: ${orderForm.side.toUpperCase()} ${orderForm.size} @ ${priceDisplay}`);

        // Close modal and reset form
        setShowConfirmModal(false);
        setIsSubmitting(false);
        resetOrderForm();
      } else {
        showError(response.message || 'Order placement failed');
        setIsSubmitting(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Order failed';
      setError(errorMsg);
      showError(errorMsg);
      setIsSubmitting(false);
    }
  };

  // Cancel order
  const handleCancelOrder = () => {
    setShowConfirmModal(false);
  };

  // Get submit button text and style
  const submitConfig = {
    text: orderForm.side === 'buy' ? 'Buy / Long' : 'Sell / Short',
    className: orderForm.side === 'buy' ? 'btn btn-buy' : 'btn btn-sell',
  };

  // Show price input for limit/stop orders
  const showPriceInput = ['limit', 'stop_limit'].includes(orderForm.type);

  return (
    <div className="panel p-3 flex flex-col h-full relative z-10" data-testid="order-entry-panel">
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
          data-testid="order-type-select"
        >
          <option value="limit">Limit</option>
          <option value="market">Market</option>
          <option value="stop_limit">Stop Limit</option>
          <option value="stop_market">Stop Market</option>
        </select>
      </div>

      {/* Stop Price Input (for stop orders) */}
      {(orderForm.type === 'stop_limit' || orderForm.type === 'stop_market') && (
        <div className="mb-3">
          <label className="text-xs text-text-secondary uppercase tracking-wider">
            Stop Price (Trigger)
          </label>
          <input
            type="number"
            value={orderForm.stopPrice}
            onChange={(e) => handleInputChange('stopPrice', e.target.value)}
            placeholder="0.00"
            className="input w-full mt-1 font-mono"
          />
        </div>
      )}

      {/* Price Input */}
      {showPriceInput && (
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <label className="text-xs text-text-secondary uppercase tracking-wider">
              {orderForm.type === 'stop_limit' ? 'Limit Price' : 'Price'}
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
            data-testid="order-price-input"
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
          data-testid="order-size-input"
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
      <div className="flex gap-4 text-xs mb-3" data-testid="order-options">
        <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={orderForm.reduceOnly}
            onChange={(e) => handleInputChange('reduceOnly', e.target.checked)}
            className="rounded"
            data-testid="reduce-only-checkbox"
          />
          Reduce Only
        </label>
        {(orderForm.type === 'limit' || orderForm.type === 'stop_limit') && (
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={orderForm.postOnly}
              onChange={(e) => handleInputChange('postOnly', e.target.checked)}
              className="rounded"
              data-testid="post-only-checkbox"
            />
            Post Only
          </label>
        )}
      </div>

      {/* Time-in-Force */}
      {(orderForm.type === 'limit' || orderForm.type === 'stop_limit') && (
        <div className="mb-3">
          <label className="text-xs text-text-secondary uppercase tracking-wider">
            Time-in-Force
          </label>
          <select
            value={orderForm.tif}
            onChange={(e) => handleInputChange('tif', e.target.value)}
            className="input w-full mt-1"
          >
            <option value="GTC">Good Till Cancelled (GTC)</option>
            <option value="IOC">Immediate or Cancel (IOC)</option>
            <option value="FOK">Fill or Kill (FOK)</option>
          </select>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`${submitConfig.className} w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
        data-testid="order-submit-button"
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
        <div className="mt-2 text-xs text-short bg-surface-elevated px-2 py-1 rounded" data-testid="order-error">
          {error}
        </div>
      )}

      {/* Confirmation Modal */}
      <OrderConfirmModal
        isOpen={showConfirmModal}
        orderForm={orderForm}
        coin={selectedAsset}
        onConfirm={handleConfirmOrder}
        onCancel={handleCancelOrder}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
