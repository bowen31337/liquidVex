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
import { useMarketStore } from '@/stores/marketStore';
import { SectionErrorBoundary } from '@/components/ErrorBoundary';
import {
  ChartSkeleton,
  OrderBookSkeleton,
  RecentTradesSkeleton,
} from '@/components/LoadingSkeleton';

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

  // Get loading states from store
  const { isLoadingCandles, isLoadingOrderBook, isLoadingTrades } = useMarketStore();

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
    <div className="flex h-[calc(100vh-3.5rem-200px)] overflow-hidden">
      {/* Chart Panel */}
      <div
        className={`relative flex flex-col chart-panel ${isDragging ? 'select-none' : ''}`}
        style={{ width: `${sizes.chart}%`, minWidth: '30%' }}
      >
        <div className="flex-1 overflow-hidden p-1">
          <SectionErrorBoundary sectionName="Chart">
            {isLoadingCandles ? <ChartSkeleton /> : <Chart />}
          </SectionErrorBoundary>
        </div>
        {/* Vertical Resize Handle - overlay on right edge */}
        <div
          className="absolute inset-y-0 right-0 w-3 cursor-col-resize hover:bg-accent/30 transition-colors z-30 flex items-center justify-center"
          onMouseDown={(e) => startDragging('chart', e)}
          data-testid="resize-handle-chart"
          title="Drag to resize chart panel"
        >
          <div className="w-0.5 h-8 bg-border hover:bg-accent transition-colors rounded-full" />
        </div>
      </div>

      {/* Middle Column: Order Book + Recent Trades */}
      <div
        className={`relative flex flex-col ${isDragging ? 'select-none' : ''}`}
        style={{ width: `${sizes.orderBook}%`, minWidth: '10%' }}
      >
        <div className="flex-1 overflow-hidden p-1">
          <SectionErrorBoundary sectionName="Order Book">
            {isLoadingOrderBook ? <OrderBookSkeleton /> : <OrderBook />}
          </SectionErrorBoundary>
        </div>
        <div className="flex-1 overflow-hidden p-1 border-t border-border">
          <SectionErrorBoundary sectionName="Recent Trades">
            {isLoadingTrades ? <RecentTradesSkeleton /> : <RecentTrades />}
          </SectionErrorBoundary>
        </div>
        {/* Vertical Resize Handle - overlay on right edge */}
        <div
          className="absolute inset-y-0 right-0 w-3 cursor-col-resize hover:bg-accent/30 transition-colors z-30 flex items-center justify-center"
          onMouseDown={(e) => startDragging('orderBook', e)}
          data-testid="resize-handle-orderbook"
          title="Drag to resize order book panel"
        >
          <div className="w-0.5 h-8 bg-border hover:bg-accent transition-colors rounded-full" />
        </div>
      </div>

      {/* Order Entry Panel */}
      <div
        className={`relative flex-1 ${isDragging ? 'select-none' : ''}`}
        style={{ minWidth: '15%' }}
      >
        <div className="h-full overflow-hidden p-1">
          <SectionErrorBoundary sectionName="Order Form">
            <OrderForm />
          </SectionErrorBoundary>
        </div>
      </div>
    </div>
  );
}
