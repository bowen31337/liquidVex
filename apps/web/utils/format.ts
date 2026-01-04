/**
 * Utility functions for formatting values
 */

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8
  }).format(num);
};

export const formatPrice = (price: number): string => {
  if (price >= 1) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  } else {
    return price.toFixed(8);
  }
};

export const formatSize = (size: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: size >= 1 ? 2 : 4,
    maximumFractionDigits: size >= 1 ? 8 : 8
  }).format(size);
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};