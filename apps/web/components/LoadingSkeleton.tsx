/**
 * LoadingSkeleton - Reusable skeleton loading states for components
 */

'use client';

import { memo } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  count?: number;
}

/**
 * Basic loading skeleton component
 */
export const LoadingSkeleton = memo(({
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = 40,
  count = 1,
}: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-surface-elevated rounded';

  const variantClasses = {
    text: 'h-4 w-3/4',
    rectangular: '',
    circular: 'rounded-full',
  };

  // Convert fractional strings to percentages for style
  const getStyleWidth = (w: number | string) => {
    if (typeof w === 'string') {
      if (w === '1/3') return '33.333%';
      if (w === '1/4') return '25%';
      if (w === '1/2') return '50%';
      if (w === '1/6') return '16.666%';
      if (w === '100%') return '100%';
      return w;
    }
    return `${w}px`;
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width: getStyleWidth(width), height: typeof height === 'number' ? `${height}px` : height }}
    />
  ));

  return <>{skeletons}</>;
});
LoadingSkeleton.displayName = 'LoadingSkeleton';

/**
 * Chart loading skeleton - simulates candlestick chart
 */
export const ChartSkeleton = () => (
  <div className="panel p-2 flex flex-col h-full">
    <div className="flex items-center justify-between mb-2">
      <div className="flex gap-2">
        <LoadingSkeleton width={40} height={20} className="rounded" />
        <LoadingSkeleton width={40} height={20} className="rounded" />
        <LoadingSkeleton width={40} height={20} className="rounded" />
      </div>
      <div className="flex gap-2">
        <LoadingSkeleton width={40} height={20} className="rounded" />
        <LoadingSkeleton width={40} height={20} className="rounded" />
      </div>
    </div>
    <div className="flex-1 min-h-[400px] bg-surface-elevated rounded animate-pulse flex items-center justify-center">
      <div className="text-text-tertiary text-sm">Loading chart...</div>
    </div>
  </div>
);

/**
 * OrderBook loading skeleton
 */
export const OrderBookSkeleton = () => (
  <div className="panel p-2 flex flex-col h-full">
    <div className="flex items-center justify-between mb-2">
      <LoadingSkeleton width={80} height={16} className="rounded" />
      <div className="flex gap-2">
        <LoadingSkeleton width={30} height={16} className="rounded" />
        <LoadingSkeleton width={30} height={16} className="rounded" />
      </div>
    </div>
    <div className="flex flex-col gap-1">
      {/* Spread indicator */}
      <LoadingSkeleton width="100%" height={20} className="rounded mb-1" />
      {/* Imbalance indicator */}
      <LoadingSkeleton width="100%" height={20} className="rounded mb-1" />
      {/* Order book rows */}
      <div className="flex-1 overflow-hidden flex flex-col gap-1">
        <div className="flex-1 overflow-y-auto flex flex-col-reverse">
          {[...Array(8)].map((_, i) => (
            <div key={`ask-${i}`} className="flex gap-2 py-0.5">
              <LoadingSkeleton width="1/3" height={16} className="rounded" />
              <LoadingSkeleton width="1/3" height={16} className="rounded" />
              <LoadingSkeleton width="1/3" height={16} className="rounded" />
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {[...Array(8)].map((_, i) => (
            <div key={`bid-${i}`} className="flex gap-2 py-0.5">
              <LoadingSkeleton width="1/3" height={16} className="rounded" />
              <LoadingSkeleton width="1/3" height={16} className="rounded" />
              <LoadingSkeleton width="1/3" height={16} className="rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * OrderForm loading skeleton
 */
export const OrderFormSkeleton = () => (
  <div className="panel p-3 flex flex-col h-full">
    {/* Buy/Sell toggle */}
    <div className="flex mb-4 gap-2">
      <LoadingSkeleton width="1/2" height={40} className="rounded" />
      <LoadingSkeleton width="1/2" height={40} className="rounded" />
    </div>

    {/* Order Type */}
    <div className="mb-3">
      <LoadingSkeleton width={80} height={12} className="rounded mb-1" />
      <LoadingSkeleton width="100%" height={36} className="rounded" />
    </div>

    {/* Price Input */}
    <div className="mb-3">
      <LoadingSkeleton width={80} height={12} className="rounded mb-1" />
      <LoadingSkeleton width="100%" height={36} className="rounded" />
    </div>

    {/* Size Input */}
    <div className="mb-3">
      <LoadingSkeleton width={80} height={12} className="rounded mb-1" />
      <LoadingSkeleton width="100%" height={36} className="rounded" />
      <div className="flex gap-1 mt-2">
        {[25, 50, 75, 100].map(pct => (
          <LoadingSkeleton key={pct} width="1/4" height={24} className="rounded" />
        ))}
      </div>
    </div>

    {/* Leverage */}
    <div className="mb-3">
      <LoadingSkeleton width="100%" height={12} className="rounded mb-1" />
      <LoadingSkeleton width="100%" height={8} className="rounded" />
    </div>

    {/* Options */}
    <div className="flex gap-4 mb-3">
      <LoadingSkeleton width={80} height={16} className="rounded" />
      <LoadingSkeleton width={80} height={16} className="rounded" />
    </div>

    {/* Submit Button */}
    <LoadingSkeleton width="100%" height={48} className="rounded" />

    {/* Summary */}
    <div className="mt-2">
      <LoadingSkeleton width="100%" height={16} className="rounded mb-1" />
      <LoadingSkeleton width="100%" height={16} className="rounded" />
    </div>
  </div>
);

/**
 * RecentTrades loading skeleton
 */
export const RecentTradesSkeleton = () => (
  <div className="panel p-2 flex flex-col h-full">
    <div className="mb-2">
      <LoadingSkeleton width={100} height={16} className="rounded" />
    </div>
    <div className="flex-1 overflow-y-auto">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex justify-between py-0.5 text-xs font-mono">
          <LoadingSkeleton width={60} height={12} className="rounded" />
          <LoadingSkeleton width={60} height={12} className="rounded" />
          <LoadingSkeleton width={60} height={12} className="rounded" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Header loading skeleton
 */
export const HeaderSkeleton = () => (
  <header className="bg-surface border-b border-border px-4 py-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <LoadingSkeleton width={120} height={24} className="rounded" />
        <LoadingSkeleton width={100} height={24} className="rounded" />
        <LoadingSkeleton width={80} height={24} className="rounded" />
      </div>
      <div className="flex items-center gap-3">
        <LoadingSkeleton width={120} height={24} className="rounded" />
        <LoadingSkeleton width={40} height={40} className="rounded-full" />
      </div>
    </div>
  </header>
);

/**
 * BottomPanel loading skeleton
 */
export const BottomPanelSkeleton = () => (
  <div className="bg-surface border-t border-border">
    <div className="flex gap-1 px-2 pt-2">
      {[...Array(4)].map((_, i) => (
        <LoadingSkeleton key={i} width={100} height={32} className="rounded-t" />
      ))}
    </div>
    <div className="p-4">
      <LoadingSkeleton width="100%" height={100} className="rounded" />
    </div>
  </div>
);

/**
 * PositionsTable loading skeleton
 */
export const PositionsTableSkeleton = () => (
  <div className="panel p-3">
    <div className="mb-2">
      <LoadingSkeleton width={120} height={20} className="rounded" />
    </div>
    <div className="space-y-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-2 py-1">
          <LoadingSkeleton width="1/6" height={20} className="rounded" />
          <LoadingSkeleton width="1/6" height={20} className="rounded" />
          <LoadingSkeleton width="1/6" height={20} className="rounded" />
          <LoadingSkeleton width="1/6" height={20} className="rounded" />
          <LoadingSkeleton width="1/6" height={20} className="rounded" />
          <LoadingSkeleton width="1/6" height={20} className="rounded" />
        </div>
      ))}
    </div>
  </div>
);
