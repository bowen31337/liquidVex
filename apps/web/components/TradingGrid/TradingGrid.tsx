/**
 * TradingGrid component with resizable panels and responsive layout
 * Main layout: Chart | OrderBook+Trades | OrderForm
 * Supports: Full-screen chart mode, compact mode, responsive breakpoints
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

interface TradingGridState {
  sizes: PanelSizes;
  isDragging: boolean;
  fullScreenChart: boolean;
  compactMode: boolean;
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

// Responsive size adjustments for different viewports
const getResponsiveSizes = (width: number, baseSizes: PanelSizes): PanelSizes => {
  if (width < 1024) {
    // Tablet: More space for chart, stacked feel
    return {
      chart: 65,
      orderBook: 18,
      orderEntry: 17,
    };
  }
  if (width < 1366) {
    // Laptop: Slightly adjusted
    return {
      chart: 58,
      orderBook: 21,
      orderEntry: 21,
    };
  }
  // Desktop (1920+): Use saved or default
  return baseSizes;
};

export function TradingGrid() {
  const [state, setState] = useState<TradingGridState>(() => {
    // Initialize from localStorage on first render
    const saved = layoutPreferences.get();
    const savedSizes = saved?.panelSizes || DEFAULT_SIZES;

    return {
      sizes: savedSizes,
      isDragging: false,
      fullScreenChart: saved?.fullScreenChart || false,
      compactMode: saved?.compactMode || false,
    };
  });

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

  // Get loading states from store
  const { isLoadingCandles, isLoadingOrderBook, isLoadingTrades } = useMarketStore();

  // Track window size for responsive behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply responsive sizes when window width changes
  useEffect(() => {
    const responsiveSizes = getResponsiveSizes(windowWidth, state.sizes);
    if (JSON.stringify(responsiveSizes) !== JSON.stringify(state.sizes)) {
      setState(prev => ({ ...prev, sizes: responsiveSizes }));
    }
  }, [windowWidth]);

  // Save state when it changes
  useEffect(() => {
    const current = layoutPreferences.get();
    layoutPreferences.save({
      panelSizes: state.sizes,
      activeTab: current?.activeTab || 'Positions',
      tradeHistoryFilters: current?.tradeHistoryFilters || { asset: '', timeRange: '', orderType: '' },
      fullScreenChart: state.fullScreenChart,
      compactMode: state.compactMode,
    });
  }, [state.sizes, state.fullScreenChart, state.compactMode]);

  // Toggle full-screen chart mode
  const toggleFullScreen = () => {
    setState(prev => ({
      ...prev,
      fullScreenChart: !prev.fullScreenChart,
    }));
  };

  // Toggle compact mode
  const toggleCompactMode = () => {
    setState(prev => ({
      ...prev,
      compactMode: !prev.compactMode,
    }));
  };

  const handleResize = (panel: keyof PanelSizes, delta: number) => {
    setState((prev) => {
      const otherPanels = Object.keys(prev.sizes).filter(k => k !== panel) as Array<keyof PanelSizes>;

      // Calculate new size
      let newSize = prev.sizes[panel] + delta;
      newSize = Math.max(MIN_SIZES[panel], Math.min(MAX_SIZES[panel], newSize));

      // Calculate total of other panels
      const otherTotal = otherPanels.reduce((sum, key) => sum + prev.sizes[key], 0);
      const newOtherTotal = 100 - newSize;

      // Scale other panels proportionally
      const newSizes: PanelSizes = { ...prev.sizes, [panel]: newSize };
      otherPanels.forEach(key => {
        newSizes[key] = (prev.sizes[key] / otherTotal) * newOtherTotal;
      });

      return { ...prev, sizes: newSizes };
    });
  };

  const startDragging = (panel: keyof PanelSizes, e: React.MouseEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragging: true }));

    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
      handleResize(panel, delta);
    };

    const handleMouseUp = () => {
      setState(prev => ({ ...prev, isDragging: false }));
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Calculate dynamic height based on compact mode
  const getContainerHeight = () => {
    const baseHeight = state.compactMode ? 'calc(100vh-3rem-160px)' : 'calc(100vh-3.5rem-200px)';
    return baseHeight;
  };

  // Calculate dynamic padding based on compact mode
  const getPaddingClass = () => {
    return state.compactMode ? 'p-0.5' : 'p-1';
  };

  // Full-screen chart mode - only show chart
  if (state.fullScreenChart) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
        {/* Full-screen chart controls */}
        <div className="flex items-center justify-between bg-surface border-b border-border px-4 py-2">
          <div className="text-sm text-text-secondary">Full-screen Chart Mode</div>
          <div className="flex gap-2">
            <button
              onClick={toggleFullScreen}
              className="px-3 py-1 text-xs bg-accent hover:bg-accent/90 text-white rounded transition-colors"
              data-testid="exit-fullscreen"
              title="Exit Full-screen"
            >
              Exit Full-screen
            </button>
            <button
              onClick={toggleCompactMode}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                state.compactMode
                  ? 'bg-long hover:bg-long-muted text-white'
                  : 'bg-surface-elevated hover:bg-border text-text-primary border border-border'
              }`}
              data-testid="toggle-compact"
              title="Toggle Compact Mode"
            >
              {state.compactMode ? 'Compact' : 'Normal'}
            </button>
          </div>
        </div>

        {/* Full-screen chart */}
        <div className="flex-1 overflow-hidden">
          <SectionErrorBoundary sectionName="Chart">
            {isLoadingCandles ? <ChartSkeleton /> : <Chart />}
          </SectionErrorBoundary>
        </div>
      </div>
    );
  }

  // Normal responsive layout
  return (
    <>
      {/* Control Bar */}
      <div className="flex items-center justify-end gap-2 px-4 py-1 bg-surface border-b border-border">
        <button
          onClick={toggleFullScreen}
          className="px-2 py-1 text-xs bg-surface-elevated hover:bg-border text-text-primary border border-border rounded transition-colors"
          data-testid="toggle-fullscreen"
          title="Full-screen Chart"
        >
          Full-screen
        </button>
        <button
          onClick={toggleCompactMode}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            state.compactMode
              ? 'bg-long hover:bg-long-muted text-white'
              : 'bg-surface-elevated hover:bg-border text-text-primary border border-border'
          }`}
          data-testid="toggle-compact"
          title="Toggle Compact Mode"
        >
          {state.compactMode ? 'Compact' : 'Normal'}
        </button>
      </div>

      {/* Main Trading Grid */}
      <div
        className={`flex overflow-hidden ${state.compactMode ? 'gap-0.5' : 'gap-1'} ${state.compactMode ? 'h-[calc(100vh-3.5rem-160px)]' : 'h-[calc(100vh-3.5rem-200px)]'}`}
        style={{
          padding: state.compactMode ? '2px' : '4px',
          gap: state.compactMode ? '2px' : '4px'
        }}
      >
        {/* Chart Panel */}
        <div
          className={`relative flex flex-col chart-panel panel ${state.isDragging ? 'select-none' : ''} ${state.compactMode ? 'rounded-sm' : 'rounded-lg'}`}
          style={{
            width: `${state.sizes.chart}%`,
            minWidth: '30%',
            padding: state.compactMode ? '2px' : '4px'
          }}
          data-testid="chart-panel"
        >
          <div className={`flex-1 overflow-hidden ${getPaddingClass()}`}>
            <SectionErrorBoundary sectionName="Chart">
              {isLoadingCandles ? <ChartSkeleton /> : <Chart />}
            </SectionErrorBoundary>
          </div>
          {/* Vertical Resize Handle */}
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
          className={`relative flex flex-col panel ${state.isDragging ? 'select-none' : ''} ${state.compactMode ? 'rounded-sm' : 'rounded-lg'}`}
          style={{
            width: `${state.sizes.orderBook}%`,
            minWidth: '10%',
            padding: state.compactMode ? '2px' : '4px'
          }}
          data-testid="orderbook-panel"
        >
          <div className={`flex-1 overflow-hidden ${getPaddingClass()}`}>
            <SectionErrorBoundary sectionName="Order Book">
              {isLoadingOrderBook ? <OrderBookSkeleton /> : <OrderBook />}
            </SectionErrorBoundary>
          </div>
          <div className={`flex-1 overflow-hidden border-t border-border ${getPaddingClass()}`}>
            <SectionErrorBoundary sectionName="Recent Trades">
              {isLoadingTrades ? <RecentTradesSkeleton /> : <RecentTrades />}
            </SectionErrorBoundary>
          </div>
          {/* Vertical Resize Handle */}
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
          className={`relative flex-1 panel ${state.isDragging ? 'select-none' : ''} ${state.compactMode ? 'rounded-sm' : 'rounded-lg'}`}
          style={{
            minWidth: '15%',
            padding: state.compactMode ? '2px' : '4px'
          }}
          data-testid="orderform-panel"
        >
          <div className={`h-full overflow-hidden ${getPaddingClass()}`}>
            <SectionErrorBoundary sectionName="Order Form">
              <OrderForm />
            </SectionErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
}
