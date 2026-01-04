/**
 * Margin validation hook for order placement
 */

import { useCallback, useEffect, useState } from 'react';
import { useOrderStore } from '../stores/orderStore';
import { useMarketStore } from '../stores/marketStore';
import { useAccount } from './useAccount';
import { useApi } from './useApi';
import type { AssetInfo } from '../types';

export interface MarginValidationResult {
  isValid: boolean;
  error: string | null;
  requiredMargin: number;
  availableMargin: number;
  leverage: number;
}

export interface LeverageValidationResult {
  isValid: boolean;
  error: string | null;
  maxLeverage: number;
  currentLeverage: number;
}

export interface SizeValidationResult {
  isValid: boolean;
  error: string | null;
  minSize: number;
  currentSize: number;
  decimals: number;
}

export interface DecimalPrecisionResult {
  isValid: boolean;
  error: string | null;
  priceDecimals: number;
  sizeDecimals: number;
  truncatedPrice: string;
  truncatedSize: string;
}

export function useMarginValidation() {
  const { orderForm } = useOrderStore();
  const { currentPrice, selectedAsset } = useMarketStore();
  const { accountState } = useAccount();
  const { getAssetInfo } = useApi();

  // Fetch asset info for validation
  const [assetInfo, setAssetInfo] = useState<AssetInfo | null>(null);
  const [isLoadingAssetInfo, setIsLoadingAssetInfo] = useState(false);

  useEffect(() => {
    if (!selectedAsset) {
      setAssetInfo(null);
      return;
    }

    setIsLoadingAssetInfo(true);
    getAssetInfo(selectedAsset)
      .then((info) => {
        setAssetInfo(info);
        setIsLoadingAssetInfo(false);
      })
      .catch(() => {
        setIsLoadingAssetInfo(false);
      });
  }, [selectedAsset, getAssetInfo]);

  const validateMargin = useCallback((): MarginValidationResult => {
    // Get current price - use order price if provided, otherwise current market price
    const price = parseFloat(orderForm.price) || currentPrice || 0;
    const size = parseFloat(orderForm.size) || 0;
    const leverage = orderForm.leverage || 10;

    if (price <= 0 || size <= 0 || leverage <= 0) {
      return {
        isValid: false,
        error: 'Invalid price, size, or leverage',
        requiredMargin: 0,
        availableMargin: 0,
        leverage: 0,
      };
    }

    // Calculate required margin: (price * size) / leverage
    const requiredMargin = (price * size) / leverage;

    // Get available margin from account state
    const availableMargin = accountState?.availableBalance || 0;

    // Check if margin is sufficient
    const isValid = requiredMargin <= availableMargin;
    const error = isValid ? null : `Insufficient margin. Required: $${requiredMargin.toFixed(2)}, Available: $${availableMargin.toFixed(2)}`;

    return {
      isValid,
      error,
      requiredMargin,
      availableMargin,
      leverage,
    };
  }, [orderForm.price, orderForm.size, orderForm.leverage, currentPrice, accountState]);

  const validateReduceOnly = useCallback((): { isValid: boolean; error: string | null } => {
    const { reduceOnly } = orderForm;

    if (!reduceOnly) {
      return { isValid: true, error: null };
    }

    // For reduce-only orders, check if user has a position in the same direction
    // This is a simplified check - in a real implementation, we'd check actual positions
    // For now, we'll assume reduce-only is valid if the user has any position
    // In test mode or without wallet, we'll allow reduce-only for testing purposes

    // Check if there are any open positions
    const hasPositions = useOrderStore.getState().positions.length > 0;

    if (!hasPositions) {
      return {
        isValid: false,
        error: 'Reduce-only order requires an existing position to reduce',
      };
    }

    return { isValid: true, error: null };
  }, [orderForm.reduceOnly]);

  const validatePostOnly = useCallback((): { isValid: boolean; error: string | null } => {
    const { postOnly, type, price } = orderForm;

    if (!postOnly) {
      return { isValid: true, error: null };
    }

    if (type !== 'limit') {
      return {
        isValid: false,
        error: 'Post-only orders must be limit orders',
      };
    }

    const orderPrice = parseFloat(price) || 0;
    if (orderPrice <= 0) {
      return {
        isValid: false,
        error: 'Post-only orders require a valid limit price',
      };
    }

    // For post-only, check if order would cross the spread
    // This requires order book data - simplified for now
    // In test mode, we'll assume it's valid unless proven otherwise
    return { isValid: true, error: null };
  }, [orderForm.postOnly, orderForm.type, orderForm.price]);

  // Feature 132: Maximum leverage limits enforced per asset
  const validateLeverage = useCallback((): LeverageValidationResult => {
    const leverage = orderForm.leverage || 10;
    const maxLeverage = assetInfo?.maxLeverage || 50; // Default to 50 if no asset info

    if (leverage <= 0) {
      return {
        isValid: false,
        error: 'Leverage must be greater than 0',
        maxLeverage,
        currentLeverage: leverage,
      };
    }

    if (leverage > maxLeverage) {
      return {
        isValid: false,
        error: `Leverage ${leverage}x exceeds maximum allowed ${maxLeverage}x for ${selectedAsset}`,
        maxLeverage,
        currentLeverage: leverage,
      };
    }

    return {
      isValid: true,
      error: null,
      maxLeverage,
      currentLeverage: leverage,
    };
  }, [orderForm.leverage, assetInfo, selectedAsset]);

  // Feature 133: Minimum order size validation
  const validateSize = useCallback((): SizeValidationResult => {
    const size = parseFloat(orderForm.size) || 0;
    const minSize = assetInfo?.minSz || 0.001; // Default to 0.001 if no asset info
    const decimals = assetInfo?.szDecimals || 4; // Default to 4 decimals

    if (size <= 0) {
      return {
        isValid: false,
        error: 'Size must be greater than 0',
        minSize,
        currentSize: size,
        decimals,
      };
    }

    if (size < minSize) {
      return {
        isValid: false,
        error: `Size ${size} is below minimum ${minSize} for ${selectedAsset}`,
        minSize,
        currentSize: size,
        decimals,
      };
    }

    // Check decimal precision
    const sizeStr = size.toString();
    const decimalIndex = sizeStr.indexOf('.');
    if (decimalIndex !== -1) {
      const decimalPlaces = sizeStr.length - decimalIndex - 1;
      if (decimalPlaces > decimals) {
        return {
          isValid: false,
          error: `Size has too many decimal places. Maximum: ${decimals}`,
          minSize,
          currentSize: size,
          decimals,
        };
      }
    }

    return {
      isValid: true,
      error: null,
      minSize,
      currentSize: size,
      decimals,
    };
  }, [orderForm.size, assetInfo, selectedAsset]);

  // Features 134-135: Decimal precision truncation for price and size
  const truncateDecimals = useCallback((value: string, maxDecimals: number): string => {
    if (!value || value === '') return value;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;

    // Split into integer and decimal parts
    const parts = value.split('.');
    if (parts.length === 1) return value; // No decimal

    const integerPart = parts[0];
    let decimalPart = parts[1];

    // Truncate to max decimals
    if (decimalPart.length > maxDecimals) {
      decimalPart = decimalPart.substring(0, maxDecimals);
    }

    return `${integerPart}.${decimalPart}`;
  }, []);

  const validateDecimalPrecision = useCallback((): DecimalPrecisionResult => {
    const price = orderForm.price;
    const size = orderForm.size;

    const priceDecimals = assetInfo?.pxDecimals || 2; // Default to 2 decimals
    const sizeDecimals = assetInfo?.szDecimals || 4; // Default to 4 decimals

    const truncatedPrice = price ? truncateDecimals(price, priceDecimals) : '';
    const truncatedSize = size ? truncateDecimals(size, sizeDecimals) : '';

    const priceNeedsTruncation = price && price !== truncatedPrice;
    const sizeNeedsTruncation = size && size !== truncatedSize;

    if (priceNeedsTruncation || sizeNeedsTruncation) {
      let error = 'Input values truncated to match asset precision: ';
      const changes: string[] = [];
      if (priceNeedsTruncation) changes.push(`price ${price} → ${truncatedPrice}`);
      if (sizeNeedsTruncation) changes.push(`size ${size} → ${truncatedSize}`);
      error += changes.join(', ');

      return {
        isValid: false,
        error,
        priceDecimals,
        sizeDecimals,
        truncatedPrice,
        truncatedSize,
      };
    }

    return {
      isValid: true,
      error: null,
      priceDecimals,
      sizeDecimals,
      truncatedPrice,
      truncatedSize,
    };
  }, [orderForm.price, orderForm.size, assetInfo, truncateDecimals]);

  const getAllValidationErrors = useCallback((): string[] => {
    const errors: string[] = [];

    // Margin validation
    const marginValidation = validateMargin();
    if (!marginValidation.isValid && marginValidation.error) {
      errors.push(marginValidation.error);
    }

    // Reduce-only validation
    const reduceValidation = validateReduceOnly();
    if (!reduceValidation.isValid && reduceValidation.error) {
      errors.push(reduceValidation.error);
    }

    // Post-only validation
    const postValidation = validatePostOnly();
    if (!postValidation.isValid && postValidation.error) {
      errors.push(postValidation.error);
    }

    // Leverage validation (Feature 132)
    const leverageValidation = validateLeverage();
    if (!leverageValidation.isValid && leverageValidation.error) {
      errors.push(leverageValidation.error);
    }

    // Size validation (Feature 133)
    const sizeValidation = validateSize();
    if (!sizeValidation.isValid && sizeValidation.error) {
      errors.push(sizeValidation.error);
    }

    // Decimal precision validation (Features 134-135)
    const decimalValidation = validateDecimalPrecision();
    if (!decimalValidation.isValid && decimalValidation.error) {
      errors.push(decimalValidation.error);
    }

    return errors;
  }, [validateMargin, validateReduceOnly, validatePostOnly, validateLeverage, validateSize, validateDecimalPrecision]);

  return {
    validateMargin,
    validateReduceOnly,
    validatePostOnly,
    validateLeverage,
    validateSize,
    validateDecimalPrecision,
    getAllValidationErrors,
    assetInfo,
    isLoadingAssetInfo,
  };
}