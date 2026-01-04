/**
 * TradingView-style Chart component using lightweight-charts
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LogicalRange } from 'lightweight-charts';
import { useMarketStore } from '../../stores/marketStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useApi } from '../../hooks/useApi';
import { ErrorState } from '../ErrorState/ErrorState';

const TIMEFRAMES = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
} as const;

type Timeframe = keyof typeof TIMEFRAMES;

// RSI calculation utility
function calculateRSI(prices: number[], period: number = 14): { time: number; value: number }[] {
  if (prices.length < period + 1) {
    return [];
  }

  const gains = [];
  const losses = [];

  // Calculate gains and losses
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
  }

  const rsiValues: { time: number; value: number }[] = [];

  // Calculate initial RSI
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  let rs = avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  rsiValues.push({ time: prices[period], value: rsi });

  // Calculate subsequent RSI values
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    rs = avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    rsiValues.push({ time: prices[i + 1], value: rsi });
  }

  return rsiValues;
}

export function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false);
  const [hasMoreHistorical, setHasMoreHistorical] = useState(true);

  const { selectedAsset, candles, setCandles, indicators, setIndicators, candlesCache, setCandlesCache, getCandlesFromCache, hasCandlesError, candlesError, clearCandlesError } = useMarketStore();
  const { getCandles } = useApi();

  // Check for test mode
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

  // Connect to candle WebSocket (skip in test mode)
  const wsUrl = isTestMode ? null : `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001'}`;
  useWebSocket(
    wsUrl ? `${wsUrl}/ws/candles/${selectedAsset}/${timeframe}` : null,
    {
      autoReconnect: true,
      reconnectInterval: 3000,
    }
  );

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart - check if already disposed
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        // Chart was already disposed, ignore
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      volumeSeriesRef.current = null;
      rsiSeriesRef.current = null;
    }

    // In test mode, skip chart creation if no dimensions to prevent errors
    if (isTestMode && (chartContainerRef.current.clientWidth === 0 || chartContainerRef.current.clientHeight === 0)) {
      const { setIsLoadingCandles } = useMarketStore.getState();
      setIsLoadingCandles(false);
      return;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#171717' },
        textColor: '#f5f5f5',
      },
      grid: {
        vertLines: { color: '#262626' },
        horzLines: { color: '#262626' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#404040',
      },
    });

    chartRef.current = chart;

    // Create main chart series
    if (chartType === 'candles') {
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      candleSeriesRef.current = candleSeries;
      lineSeriesRef.current = null;
    } else {
      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      });
      lineSeriesRef.current = lineSeries;
      candleSeriesRef.current = null;
    }

    // Create indicator series
    if (indicators.volume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#3b82f6',
        priceFormat: { type: 'volume' },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    if (indicators.rsi) {
      const rsiSeries = chart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
      });
      rsiSeriesRef.current = rsiSeries;
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        chart.remove();
      } catch (e) {
        // Chart was already disposed
      }
    };
  }, [chartType, indicators]);

  // Helper function to update chart data
  const updateChartData = () => {
    if (candles.length === 0 || !chartRef.current) return;

    const formatted = candles.map((c: any) => ({
      time: Math.floor(c.t / 1000),
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
    }));

    if (candleSeriesRef.current && chartType === 'candles') {
      candleSeriesRef.current.setData(formatted as any);
    } else if (lineSeriesRef.current && chartType === 'line') {
      const lineData = formatted.map((c: any) => ({
        time: c.time,
        value: c.close,
      }));
      lineSeriesRef.current.setData(lineData as any);
    }

    // Update volume indicator
    if (volumeSeriesRef.current && indicators.volume) {
      const volumeData = candles.map((c: any) => ({
        time: Math.floor(c.t / 1000),
        value: c.v,
        color: c.c >= c.o ? '#22c55e' : '#ef4444',
      }));
      volumeSeriesRef.current.setData(volumeData as any);
    }

    // Update RSI indicator
    if (rsiSeriesRef.current && indicators.rsi) {
      const prices = candles.map((c: any) => c.c);
      const rsiData = calculateRSI(prices);
      rsiSeriesRef.current.setData(rsiData as any);
    }
  };

  // Load initial candle data
  useEffect(() => {
    const loadCandles = async () => {
      // In test mode, skip API call and just stop loading
      if (isTestMode) {
        const { setIsLoadingCandles } = useMarketStore.getState();
        setIsLoadingCandles(false);
        return;
      }

      try {
        // Check cache first for data persistence across timeframe changes
        const cachedCandles = getCandlesFromCache(selectedAsset, timeframe);
        if (cachedCandles && cachedCandles.length > 0) {
          // Use cached data - instant display
          setCandles(cachedCandles);

          // Update chart with cached data
          if (chartRef.current) {
            updateChartData();
          }
          return;
        }

        // No cache hit - fetch from API
        const data = await getCandles(selectedAsset, timeframe, 500);
        // Sort data by time ascending for lightweight-charts (create new sorted array)
        const sortedData = [...data].sort((a: any, b: any) => a.t - b.t);
        const formatted = sortedData.map((c: any) => ({
          time: Math.floor(c.t / 1000), // Use number instead of Time type
          open: c.o,
          high: c.h,
          low: c.l,
          close: c.c,
        }));
        setCandles(sortedData);

        // Store in cache for future use
        setCandlesCache(selectedAsset, timeframe, sortedData);

        // Update chart with initial data
        if (chartRef.current) {
          updateChartData();
        }
      } catch (err) {
        // On error, still stop loading to prevent infinite skeleton
        // The chart will show empty state but UI won't be stuck
        const { setIsLoadingCandles } = useMarketStore.getState();
        setIsLoadingCandles(false);
        console.warn('Failed to load candles:', err);
      }
    };

    loadCandles();
  }, [selectedAsset, timeframe, chartType, isTestMode]);

  // Load historical candle data (before the current oldest candle)
  const loadHistoricalData = useCallback(async () => {
    if (isLoadingHistorical || !hasMoreHistorical || candles.length === 0 || isTestMode) {
      return;
    }

    setIsLoadingHistorical(true);

    try {
      // Get the oldest candle timestamp
      const oldestCandle = candles[0];
      const oldestTimestamp = oldestCandle.t;

      // Load 500 more candles ending before the oldest one
      const endTime = oldestTimestamp - 1; // 1ms before the oldest candle
      const startTime = endTime - (500 * TIMEFRAMES[timeframe] * 1000);

      const historicalData = await getCandles(selectedAsset, timeframe, 500, startTime, endTime);

      if (historicalData.length === 0) {
        // No more historical data available
        setHasMoreHistorical(false);
      } else {
        // Merge historical data with existing candles
        // Create new array with historical data first, then existing data
        const mergedData = [...historicalData, ...candles];
        setCandles(mergedData);

        // Update chart with merged data
        if (chartRef.current) {
          const formatted = mergedData.map((c: any) => ({
            time: Math.floor(c.t / 1000),
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c,
          }));

          if (candleSeriesRef.current && chartType === 'candles') {
            candleSeriesRef.current.setData(formatted as any);
          } else if (lineSeriesRef.current && chartType === 'line') {
            const lineData = formatted.map((c: any) => ({
              time: c.time,
              value: c.close,
            }));
            lineSeriesRef.current.setData(lineData as any);
          }
        }

        // If we got fewer candles than requested, we've reached the beginning
        if (historicalData.length < 500) {
          setHasMoreHistorical(false);
        }
      }
    } catch (err) {
      console.warn('Failed to load historical candles:', err);
      // Don't set hasMoreHistorical to false on error, might be temporary
    } finally {
      setIsLoadingHistorical(false);
    }
  }, [isLoadingHistorical, hasMoreHistorical, candles, isTestMode, selectedAsset, timeframe, getCandles, chartType, setCandles]);

  // Handle historical data loading on scroll
  useEffect(() => {
    if (!chartRef.current || isTestMode || !hasMoreHistorical || isLoadingHistorical) {
      return;
    }

    const handler = (range: LogicalRange | null) => {
      if (!range) return;

      // Check if user is scrolling near the beginning of loaded data
      // Load more historical data when getting close to the left edge
      // Logical is a nominal type wrapping number, so we cast to number for arithmetic
      const from = range.from as unknown as number;
      const to = range.to as unknown as number;
      const visibleRangeWidth = to - from;
      const threshold = from + (visibleRangeWidth * 0.1); // 10% from left edge

      if (from <= threshold && candles.length > 0) {
        loadHistoricalData();
      }
    };

    chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(handler);

    return () => {
      if (chartRef.current) {
        chartRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      }
    };
  }, [chartRef, candles, hasMoreHistorical, isLoadingHistorical, isTestMode, selectedAsset, timeframe, loadHistoricalData]);

  // Handle chart with new candles from WebSocket
  useEffect(() => {
    if (candles.length === 0 || !chartRef.current) return;

    updateChartData();
  }, [candles, chartType]);

  // Handle indicator changes
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove existing indicators
    if (volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }
    if (rsiSeriesRef.current) {
      chartRef.current.removeSeries(rsiSeriesRef.current);
      rsiSeriesRef.current = null;
    }

    // Create new indicators if enabled
    if (indicators.volume) {
      const volumeSeries = chartRef.current.addHistogramSeries({
        color: '#3b82f6',
        priceFormat: { type: 'volume' },
      });
      volumeSeriesRef.current = volumeSeries;
      // Update volume data
      const volumeData = candles.map((c: any) => ({
        time: Math.floor(c.t / 1000),
        value: c.v,
        color: c.c >= c.o ? '#22c55e' : '#ef4444',
      }));
      volumeSeries.setData(volumeData as any);
    }

    if (indicators.rsi) {
      const rsiSeries = chartRef.current.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
      });
      rsiSeriesRef.current = rsiSeries;
      // Update RSI data
      const prices = candles.map((c: any) => c.c);
      const rsiData = calculateRSI(prices);
      rsiSeries.setData(rsiData as any);
    }
  }, [indicators]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.resize(
          chartContainerRef.current?.clientWidth || 0,
          chartContainerRef.current?.clientHeight || 0
        );
      }
    }, 100);
  };

  // Handle retry for failed data loads
  const handleRetry = () => {
    clearCandlesError();
    // Force reconnection by reloading the page
    window.location.reload();
  };

  return (
    <div className={`panel chart-panel ${isFullscreen ? 'fixed inset-4 z-50' : ''} p-2 flex flex-col`}>
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">TradingView Chart</span>
          <div className="flex gap-1">
            {Object.keys(TIMEFRAMES).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as Timeframe)}
                className={`px-2 py-1 text-xs rounded ${
                  timeframe === tf
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setIndicators({ volume: !indicators.volume })}
              className={`px-2 py-1 text-xs rounded ${
                indicators.volume
                  ? 'bg-blue-600 text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              }`}
              data-testid="indicator-volume-toggle"
            >
              Volume
            </button>
            <button
              onClick={() => setIndicators({ rsi: !indicators.rsi })}
              className={`px-2 py-1 text-xs rounded ${
                indicators.rsi
                  ? 'bg-amber-600 text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              }`}
              data-testid="indicator-rsi-toggle"
            >
              RSI
            </button>
          </div>
          <button
            onClick={() => setChartType(chartType === 'candles' ? 'line' : 'candles')}
            className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded"
          >
            {chartType === 'candles' ? 'Line' : 'Candles'}
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded"
          >
            {isFullscreen ? 'Exit' : 'Full'}
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="flex-1 min-h-[400px]" data-testid="chart-container" />
    </div>
  );
}
