/**
 * TradingView-style Chart component using lightweight-charts
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useMarketStore } from '../../stores/marketStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useApi } from '../../hooks/useApi';

const TIMEFRAMES = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
} as const;

type Timeframe = keyof typeof TIMEFRAMES;

export function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { selectedAsset, candles, setCandles } = useMarketStore();
  const { getCandles } = useApi();

  // Connect to candle WebSocket
  useWebSocket(
    `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/candles/${selectedAsset}/${timeframe}`,
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

    // Create series
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
  }, [chartType]);

  // Load initial candle data
  useEffect(() => {
    const loadCandles = async () => {
      try {
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

        if (candleSeriesRef.current && chartType === 'candles') {
          candleSeriesRef.current.setData(formatted as any);
        } else if (lineSeriesRef.current && chartType === 'line') {
          const lineData = formatted.map((c: any) => ({
            time: c.time,
            value: c.close,
          }));
          lineSeriesRef.current.setData(lineData as any);
        }
      } catch (err) {
        // Silently ignore candle loading errors
      }
    };

    loadCandles();
  }, [selectedAsset, timeframe, chartType]);

  // Update chart with new candles from WebSocket
  useEffect(() => {
    if (candles.length === 0) return;

    const latestCandle = candles[candles.length - 1];
    const formatted = {
      time: Math.floor(latestCandle.t / 1000), // Use number instead of Time type
      open: latestCandle.o,
      high: latestCandle.h,
      low: latestCandle.l,
      close: latestCandle.c,
    };

    try {
      if (candleSeriesRef.current && chartType === 'candles') {
        candleSeriesRef.current.update(formatted as any);
      } else if (lineSeriesRef.current && chartType === 'line') {
        lineSeriesRef.current.update({
          time: formatted.time,
          value: formatted.close,
        } as any);
      }
    } catch (e) {
      // Ignore update errors (e.g., out-of-order timestamps)
    }
  }, [candles, chartType]);

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
