/**
 * Performance optimization hooks for liquidVex
 */

import { useMemo, useCallback } from 'react';
import { useMarketStore } from '../stores/marketStore';
import type { CandleData, TradeData } from '../types';

/**
 * Hook for memoizing order book calculations
 */
export const useOrderBookCalculations = () => {
  const orderBook = useMarketStore((state) => state.orderBook);

  return useMemo(() => {
    if (!orderBook) return { spread: 0, midPrice: 0, totalBidVolume: 0, totalAskVolume: 0 };

    const bestBid = orderBook.bids[0]?.px || 0;
    const bestAsk = orderBook.asks[0]?.px || 0;
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;

    const totalBidVolume = orderBook.bids.reduce((sum, level) => sum + level.sz, 0);
    const totalAskVolume = orderBook.asks.reduce((sum, level) => sum + level.sz, 0);

    return {
      spread,
      midPrice,
      totalBidVolume,
      totalAskVolume,
      bestBid,
      bestAsk,
    };
  }, [orderBook]);
};

/**
 * Hook for memoizing PnL calculations
 */
export const usePnLCalculations = (positions: any[]) => {
  return useMemo(() => {
    return positions.map(position => {
      const unrealizedPnL = position.unrealizedPnl || 0;
      const realizedPnL = position.realizedPnl || 0;
      const totalPnL = unrealizedPnL + realizedPnL;

      return {
        ...position,
        unrealizedPnL,
        realizedPnL,
        totalPnL,
        pnlPercentage: position.entryPx
          ? ((position.entryPx - position.markPx) / position.entryPx) * 100
          : 0,
      };
    });
  }, [positions]);
};

/**
 * Hook for memoizing trade statistics
 */
export const useTradeStatistics = (trades: TradeData[], timeframe: string) => {
  return useMemo(() => {
    if (!trades.length) return {
      totalVolume: 0,
      buyVolume: 0,
      sellVolume: 0,
      avgTradeSize: 0,
      tradeCount: 0,
    };

    const buyTrades = trades.filter(t => t.side === 'B');
    const sellTrades = trades.filter(t => t.side === 'A');

    const buyVolume = buyTrades.reduce((sum, t) => sum + t.sz, 0);
    const sellVolume = sellTrades.reduce((sum, t) => sum + t.sz, 0);
    const totalVolume = buyVolume + sellVolume;
    const avgTradeSize = totalVolume / trades.length;

    return {
      totalVolume,
      buyVolume,
      sellVolume,
      avgTradeSize,
      tradeCount: trades.length,
      buyRatio: trades.length > 0 ? buyVolume / totalVolume : 0,
    };
  }, [trades, timeframe]);
};

/**
 * Hook for memoizing candlestick analysis
 */
export const useCandleAnalysis = (candles: CandleData[]) => {
  return useMemo(() => {
    if (!candles.length) return {
      priceChange: 0,
      priceChangePercent: 0,
      highLowRange: 0,
      avgVolume: 0,
      volatility: 0,
    };

    const firstCandle = candles[0];
    const lastCandle = candles[candles.length - 1];
    const priceChange = lastCandle.c - firstCandle.o;
    const priceChangePercent = (priceChange / firstCandle.o) * 100;

    const highs = candles.map(c => c.h);
    const lows = candles.map(c => c.l);
    const highLowRange = Math.max(...highs) - Math.min(...lows);

    const totalVolume = candles.reduce((sum, c) => sum + c.v, 0);
    const avgVolume = totalVolume / candles.length;

    // Simple volatility calculation (standard deviation of prices)
    const prices = candles.map(c => c.c);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);

    return {
      priceChange,
      priceChangePercent,
      highLowRange,
      avgVolume,
      volatility,
      firstPrice: firstCandle.o,
      lastPrice: lastCandle.c,
      highestPrice: Math.max(...highs),
      lowestPrice: Math.min(...lows),
    };
  }, [candles]);
};

/**
 * Hook for debouncing rapid updates
 */
export const useDebouncedCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  // Implementation would go here
  return useCallback(callback, [delay]);
};

/**
 * Hook for throttling expensive calculations
 */
export const useThrottledCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  // Implementation would go here
  return useCallback(callback, [delay]);
};