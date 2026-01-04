/**
 * TradingGrid component with resizable panels
 * Main layout: Chart | OrderBook+Trades | OrderForm
 */

'use client';

import { useState, useEffect } from 'react';
import { layoutPreferences } from '@/lib/storage';
import { Chart } from '@/components/Chart/Chart';
import { OrderBook } from '@/components/OrderBook/OrderBook';
import { RecentTrades } from '@/components/OrderBook/RecentTrades';
import { OrderForm } from '@/components/OrderForm/OrderForm';

interface PanelSizes {
  chart: number;
  orderBook: number;
  orderEntry: number;
}

const DEFAULT_SIZES: PanelSizes = {
  chart: 60,
  orderBook: 20,
  orderEntry: 20,
};

const MIN_SIZES: PanelSizes = {
  chart: 30,
  orderBook: 10,
  orderEntry: 15,
};

const MAX_SIZES: PanelSizes = {
  chart: 80,
  orderBook: 40,
  orderEntry: 35,
};

export function TradingGrid() {
  const [sizes, setSizes] = useState<PanelSizes>(() => {
    // Initialize from localStorage on first render
    const saved = layoutPreferences.get();
    if (saved?.panelSizes) {
      return {
        chart: saved.panelSizes.chart ?? DEFAULT_SIZES.chart,
        orderBook: saved.panelSizes.orderBook ?? DEFAULT_SIZES.orderBook,
        orderEntry: saved.panelSizes.orderEntry ?? DEFAULT_SIZES.orderEntry,
      };
    }
    return DEFAULT_SIZES;
  });
  const [isDragging, setIsDragging] = useState(false);

  // Save sizes when they change
  useEffect(() => {
    const current = layoutPreferences.get();
    layoutPreferences.save({
      panelSizes: sizes,
      activeTab: current?.activeTab || 'Positions',
      tradeHistoryFilters: current?.tradeHistoryFilters || { asset: '', timeRange: '', orderType: '' },
    });
  }, [sizes]);

  const handleResize = (panel: keyof PanelSizes, delta: number) => {
    setSizes((prev) => {
      const otherPanels = Object.keys(prev).filter(k => k !== panel) as Array<keyof PanelSizes>;

      // Calculate new size
      let newSize = prev[panel] + delta;
      newSize = Math.max(MIN_SIZES[panel], Math.min(MAX_SIZES[panel], newSize));

      // Calculate total of other panels
      const otherTotal = otherPanels.reduce((sum, key) => sum + prev[key], 0);
      const newOtherTotal = 100 - newSize;

      // Scale other panels proportionally
      const newSizes: PanelSizes = { ...prev, [panel]: newSize };
      otherPanels.forEach(key => {
        newSizes[key] = (prev[key] / otherTotal) * newOtherTotal;
      });

      return newSizes;
    });
  };

  const startDragging = (panel: keyof PanelSizes, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startSize = sizes[panel];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
      handleResize(panel, delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex gap-1 p-1 h-[calc(100vh-3.5rem-200px)]">
      {/* Chart Panel */}
      <div
        className={`relative flex flex-col chart-panel ${isDragging ? 'select-none' : ''}`}
        style={{ width: `${sizes.chart}%` }}
      >
        <Chart />
        {/* Vertical Resize Handle */}
        <div
          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-accent/50 transition-colors z-20"
          onMouseDown={(e) => startDragging('chart', e)}
          data-testid="resize-handle-chart"
        />
      </div>

      {/* Middle Column: Order Book + Recent Trades */}
      <div
        className={`relative flex flex-col gap-1 ${isDragging ? 'select-none' : ''}`}
        style={{ width: `${sizes.orderBook}%` }}
      >
        <div className="flex-1 min-h-0">
          <OrderBook />
        </div>
        <div className="flex-1 min-h-0">
          <RecentTrades />
        </div>
        {/* Vertical Resize Handle */}
        <div
          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-accent/50 transition-colors z-20"
          onMouseDown={(e) => startDragging('orderBook', e)}
          data-testid="resize-handle-orderbook"
        />
      </div>

      {/* Order Entry Panel */}
      <div
        className={`relative ${isDragging ? 'select-none' : ''}`}
        style={{ width: `${sizes.orderEntry}%` }}
      >
        <OrderForm />
      </div>
    </div>
  );
}
