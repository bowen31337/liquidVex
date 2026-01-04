/**
 * Utility functions for liquidVex
 */

/**
 * Format currency with proper decimal places and separators
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Format a number with fixed decimal places
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Get color class based on positive/negative value
 */
export function getValueColor(value: number): string {
  return value >= 0 ? 'text-profit' : 'text-loss';
}

/**
 * Format asset size with appropriate decimals
 */
export function formatSize(size: number, decimals: number = 4): string {
  return size.toFixed(decimals);
}

/**
 * Format price with appropriate decimals
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return price.toFixed(decimals);
}

/**
 * Format timestamp to readable date
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}