/**
 * Input validation utilities for the trading application
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class Validator {
  /**
   * Validate order price
   */
  static validatePrice(price: number, minPrice?: number, maxPrice?: number): ValidationResult {
    if (isNaN(price) || price <= 0) {
      return { isValid: false, error: 'Price must be a positive number' };
    }

    if (minPrice && price < minPrice) {
      return { isValid: false, error: `Price must be at least ${minPrice}` };
    }

    if (maxPrice && price > maxPrice) {
      return { isValid: false, error: `Price must not exceed ${maxPrice}` };
    }

    return { isValid: true };
  }

  /**
   * Validate order size
   */
  static validateSize(size: number, minSize?: number, maxSize?: number): ValidationResult {
    if (isNaN(size) || size <= 0) {
      return { isValid: false, error: 'Size must be a positive number' };
    }

    if (minSize && size < minSize) {
      return { isValid: false, error: `Size must be at least ${minSize}` };
    }

    if (maxSize && size > maxSize) {
      return { isValid: false, error: `Size must not exceed ${maxSize}` };
    }

    return { isValid: true };
  }

  /**
   * Validate leverage
   */
  static validateLeverage(leverage: number, maxLeverage: number = 50): ValidationResult {
    if (isNaN(leverage) || leverage < 1) {
      return { isValid: false, error: 'Leverage must be at least 1x' };
    }

    if (leverage > maxLeverage) {
      return { isValid: false, error: `Leverage must not exceed ${maxLeverage}x` };
    }

    return { isValid: true };
  }

  /**
   * Validate order value against available balance
   */
  static validateOrderValue(
    price: number,
    size: number,
    leverage: number,
    availableBalance: number
  ): ValidationResult {
    const orderValue = price * size / leverage;

    if (orderValue > availableBalance) {
      return {
        isValid: false,
        error: `Insufficient balance. Order value: $${orderValue.toFixed(2)}, Available: $${availableBalance.toFixed(2)}`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate time-in-force
   */
  static validateTif(tif: string): ValidationResult {
    const validTifs = ['GTC', 'IOC', 'FOK'];
    if (!validTifs.includes(tif)) {
      return { isValid: false, error: 'Invalid time-in-force value' };
    }
    return { isValid: true };
  }

  /**
   * Validate order type
   */
  static validateOrderType(type: string): ValidationResult {
    const validTypes = ['limit', 'market', 'stop_limit', 'stop_market'];
    if (!validTypes.includes(type)) {
      return { isValid: false, error: 'Invalid order type' };
    }
    return { isValid: true };
  }

  /**
   * Validate asset name
   */
  static validateAsset(asset: string): ValidationResult {
    if (!asset || typeof asset !== 'string') {
      return { isValid: false, error: 'Invalid asset name' };
    }

    // Basic format validation (e.g., "BTC-PERP", "ETH-USDC")
    const assetPattern = /^[A-Z0-9]+(-[A-Z0-9]+)?$/;
    if (!assetPattern.test(asset)) {
      return { isValid: false, error: 'Invalid asset format' };
    }

    return { isValid: true };
  }

  /**
   * Validate wallet address
   */
  static validateWalletAddress(address: string): ValidationResult {
    if (!address || typeof address !== 'string') {
      return { isValid: false, error: 'Invalid wallet address' };
    }

    // Basic Ethereum address validation
    const addressPattern = /^0x[a-fA-F0-9]{40}$/;
    if (!addressPattern.test(address)) {
      return { isValid: false, error: 'Invalid wallet address format' };
    }

    return { isValid: true };
  }

  /**
   * Validate percentage input (25%, 50%, etc.)
   */
  static validatePercentage(percentage: number): ValidationResult {
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      return { isValid: false, error: 'Percentage must be between 1 and 100' };
    }
    return { isValid: true };
  }

  /**
   * Comprehensive order validation
   */
  static validateOrder(order: {
    price?: number;
    size: number;
    leverage: number;
    type: string;
    tif: string;
    availableBalance: number;
  }): ValidationResult {
    // Validate required fields
    if (!order.size || !order.leverage || !order.type || !order.tif) {
      return { isValid: false, error: 'Missing required order fields' };
    }

    // Validate individual fields
    const sizeResult = this.validateSize(order.size);
    if (!sizeResult.isValid) return sizeResult;

    const leverageResult = this.validateLeverage(order.leverage);
    if (!leverageResult.isValid) return leverageResult;

    const typeResult = this.validateOrderType(order.type);
    if (!typeResult.isValid) return typeResult;

    const tifResult = this.validateTif(order.tif);
    if (!tifResult.isValid) return tifResult;

    // Validate order value if price is provided
    if (order.price) {
      const priceResult = this.validatePrice(order.price);
      if (!priceResult.isValid) return priceResult;

      const valueResult = this.validateOrderValue(
        order.price,
        order.size,
        order.leverage,
        order.availableBalance
      );
      if (!valueResult.isValid) return valueResult;
    }

    return { isValid: true };
  }
}

// Hook for using validation in React components
export const useValidation = () => {
  return {
    validatePrice: (price: number, minPrice?: number, maxPrice?: number) =>
      Validator.validatePrice(price, minPrice, maxPrice),
    validateSize: (size: number, minSize?: number, maxSize?: number) =>
      Validator.validateSize(size, minSize, maxSize),
    validateLeverage: (leverage: number, maxLeverage?: number) =>
      Validator.validateLeverage(leverage, maxLeverage),
    validateOrderValue: (price: number, size: number, leverage: number, availableBalance: number) =>
      Validator.validateOrderValue(price, size, leverage, availableBalance),
    validateOrder: (order: any) => Validator.validateOrder(order),
  };
};