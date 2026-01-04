/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateOrderPrice,
  validateOrderSize,
  validateLeverage,
  validateOrderValue,
  validateTimeInForce,
  validateAssetName,
  validateWalletAddress,
  validatePercentageInput
} from '@/utils/validation';

describe('Validation Utilities', () => {
  describe('validateOrderPrice', () => {
    it('should accept valid prices', () => {
      expect(validateOrderPrice(95000, 0.01)).toBe(true);
      expect(validateOrderPrice(95000.5, 0.01)).toBe(true);
      expect(validateOrderPrice(0.001, 0.0001)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(validateOrderPrice(-1, 0.01)).toBe(false);
      expect(validateOrderPrice(0, 0.01)).toBe(false);
      expect(validateOrderPrice(95000.005, 0.01)).toBe(false); // Not aligned to increment
    });
  });

  describe('validateOrderSize', () => {
    it('should accept valid sizes', () => {
      expect(validateOrderSize(0.1, 0.001)).toBe(true);
      expect(validateOrderSize(1.5, 0.001)).toBe(true);
      expect(validateOrderSize(0.001, 0.001)).toBe(true);
    });

    it('should reject invalid sizes', () => {
      expect(validateOrderSize(-0.1, 0.001)).toBe(false);
      expect(validateOrderSize(0, 0.001)).toBe(false);
      expect(validateOrderSize(0.1005, 0.001)).toBe(false); // Not aligned to increment
    });
  });

  describe('validateLeverage', () => {
    it('should accept valid leverage values', () => {
      expect(validateLeverage(1, 10)).toBe(true);
      expect(validateLeverage(5, 10)).toBe(true);
      expect(validateLeverage(10, 10)).toBe(true);
    });

    it('should reject invalid leverage values', () => {
      expect(validateLeverage(0, 10)).toBe(false);
      expect(validateLeverage(11, 10)).toBe(false);
      expect(validateLeverage(-1, 10)).toBe(false);
    });
  });

  describe('validateOrderValue', () => {
    it('should accept valid order values', () => {
      expect(validateOrderValue(1000, 10000)).toBe(true);
      expect(validateOrderValue(5000, 10000)).toBe(true);
    });

    it('should reject invalid order values', () => {
      expect(validateOrderValue(0, 10000)).toBe(false);
      expect(validateOrderValue(-1000, 10000)).toBe(false);
      expect(validateOrderValue(15000, 10000)).toBe(false); // Exceeds available balance
    });
  });

  describe('validateTimeInForce', () => {
    it('should accept valid TIF values', () => {
      expect(validateTimeInForce('GTC')).toBe(true);
      expect(validateTimeInForce('IOC')).toBe(true);
      expect(validateTimeInForce('FOK')).toBe(true);
    });

    it('should reject invalid TIF values', () => {
      expect(validateTimeInForce('INVALID')).toBe(false);
      expect(validateTimeInForce('')).toBe(false);
    });
  });

  describe('validateAssetName', () => {
    it('should accept valid asset names', () => {
      expect(validateAssetName('BTC')).toBe(true);
      expect(validateAssetName('ETH')).toBe(true);
      expect(validateAssetName('SOL')).toBe(true);
      expect(validateAssetName('BTC-PERP')).toBe(true);
    });

    it('should reject invalid asset names', () => {
      expect(validateAssetName('')).toBe(false);
      expect(validateAssetName('btc')).toBe(false); // Should be uppercase
      expect(validateAssetName('BTC123')).toBe(false);
      expect(validateAssetName('BTC-')).toBe(false);
    });
  });

  describe('validateWalletAddress', () => {
    it('should accept valid wallet addresses', () => {
      expect(validateWalletAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
      expect(validateWalletAddress('0xABCDEF1234567890abcdef1234567890abcdef12')).toBe(true);
    });

    it('should reject invalid wallet addresses', () => {
      expect(validateWalletAddress('')).toBe(false);
      expect(validateWalletAddress('1234567890abcdef1234567890abcdef12345678')).toBe(false); // Missing 0x
      expect(validateWalletAddress('0x123')).toBe(false); // Too short
      expect(validateWalletAddress('0x1234567890abcdef1234567890abcdef1234567')).toBe(false); // Wrong length
      expect(validateWalletAddress('0x1234567890abcdef1234567890abcdef1234567g')).toBe(false); // Invalid character
    });
  });

  describe('validatePercentageInput', () => {
    it('should accept valid percentage values', () => {
      expect(validatePercentageInput('25')).toBe(true);
      expect(validatePercentageInput('50')).toBe(true);
      expect(validatePercentageInput('100')).toBe(true);
      expect(validatePercentageInput('0')).toBe(true);
    });

    it('should reject invalid percentage values', () => {
      expect(validatePercentageInput('')).toBe(false);
      expect(validatePercentageInput('101')).toBe(false);
      expect(validatePercentageInput('-1')).toBe(false);
      expect(validatePercentageInput('abc')).toBe(false);
      expect(validatePercentageInput('25.5')).toBe(false); // No decimals
    });
  });
});