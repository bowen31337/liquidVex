/**
 * Zustand store for market data
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OrderBookData, TradeData, CandleData, AssetInfo } from '../types';
import { createDebouncedUpdater, StateBatcher } from '../utils/stateOptimization';
import { reportNetworkError, reportValidationError } from '../utils/errorHandler';

// Interface for persisted market state
interface PersistedMarketState {
  selectedAsset: string;
  selectedTimeframe: string;
  setSelectedAsset: (asset: string) => void;
  setSelectedTimeframe: (timeframe: string) => void;
  // Cached candles by asset and timeframe for persistence
  candlesCache: Record<string, CandleData[]>;
  setCandlesCache: (asset: string, timeframe: string, candles: CandleData[]) => void;
  getCandlesFromCache: (asset: string, timeframe: string) => CandleData[] | null;
  clearCandlesCache: () => void;
}

// Interface for non-persisted market state
interface NonPersistedMarketState {
  // Aliases for compatibility
  selectedCoin: string;

  // Performance monitoring
  performanceMetrics: {
    orderBookUpdates: number;
    tradeUpdates: number;
    candleUpdates: number;
    lastUpdate: number;
  };

  // Loading states
  isLoadingOrderBook: boolean;
  isLoadingTrades: boolean;
  isLoadingCandles: boolean;
  setIsLoadingOrderBook: (loading: boolean) => void;
  setIsLoadingTrades: (loading: boolean) => void;
  setIsLoadingCandles: (loading: boolean) => void;

  // Order book
  orderBook: OrderBookData | null;
  setOrderBook: (data: OrderBookData) => void;

  // Recent trades
  trades: TradeData[];
  addTrade: (trade: TradeData) => void;
  clearTrades: () => void;
  setTrades: (trades: TradeData[]) => void;

  // Current price and 24h change
  currentPrice: number;
  priceChange24h: number;
  setCurrentPrice: (price: number, change: number) => void;

  // Mark and index prices
  markPrice: number;
  indexPrice: number;
  setMarkPrice: (price: number) => void;
  setIndexPrice: (price: number) => void;

  // Funding rate
  fundingRate: number;
  fundingCountdown: number;
  setFundingRate: (rate: number) => void;
  setFundingCountdown: (seconds: number) => void;

  // 24h volume and open interest
  volume24h: number;
  openInterest: number;
  setVolume24h: (volume: number) => void;
  setOpenInterest: (interest: number) => void;

  // All mid prices
  allMids: Record<string, number>;
  setAllMids: (mids: Record<string, number>) => void;

  // Asset info
  assetInfo: AssetInfo | null;
  setAssetInfo: (info: AssetInfo) => void;

  // WebSocket connection status
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;

  // Chart data
  candles: CandleData[];
  setCandles: (candles: CandleData[]) => void;
  addCandle: (candle: CandleData) => void;
  clearCandles: () => void;

  // Chart indicators
  indicators: {
    volume: boolean;
    rsi: boolean;
    macd: boolean;
  };
  setIndicators: (indicators: Partial<{ volume: boolean; rsi: boolean; macd: boolean }>) => void;

  // Placeholder functions for MarketDataProvider compatibility
  fetchAllMarkets: () => Promise<void>;
  fetchMarketInfo: (coin: string) => Promise<void>;
  fetchCandles: (coin: string, timeframe: string) => Promise<void>;
}

// Combined store interface
interface MarketState extends PersistedMarketState, NonPersistedMarketState {}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      // Persisted state
      selectedAsset: 'BTC',
      selectedTimeframe: '1h',
      // Cache candles by asset and timeframe (e.g., "BTC-1h", "ETH-5m")
      candlesCache: {},
      setCandlesCache: (asset, timeframe, candles) => {
        const cacheKey = `${asset}-${timeframe}`;
        set((state) => ({
          candlesCache: {
            ...state.candlesCache,
            [cacheKey]: candles,
          },
        }));
      },
      getCandlesFromCache: (asset, timeframe) => {
        const cacheKey = `${asset}-${timeframe}`;
        const state = get();
        return state.candlesCache[cacheKey] || null;
      },
      clearCandlesCache: () => set({ candlesCache: {} }),

      setSelectedAsset: (asset) => {
        // Reset loading states when switching assets
        set({
          selectedAsset: asset,
          isLoadingOrderBook: true,
          isLoadingTrades: true,
          isLoadingCandles: true,
          // Clear existing data
          orderBook: null,
          trades: [],
          candles: [],
        });
      },
      setSelectedTimeframe: (timeframe) => set({ selectedTimeframe: timeframe }),

      // Non-persisted state
      selectedCoin: 'BTC',

      performanceMetrics: {
        orderBookUpdates: 0,
        tradeUpdates: 0,
        candleUpdates: 0,
        lastUpdate: 0,
      },

      isLoadingOrderBook: true,
      isLoadingTrades: true,
      isLoadingCandles: true,
      setIsLoadingOrderBook: (loading) => set({ isLoadingOrderBook: loading }),
      setIsLoadingTrades: (loading) => set({ isLoadingTrades: loading }),
      setIsLoadingCandles: (loading) => set({ isLoadingCandles: loading }),

      orderBook: null,
      setOrderBook: (data) => {
        // Validate order book data
        if (!data || !Array.isArray(data.bids) || !Array.isArray(data.asks)) {
          reportValidationError('Invalid order book data received', { data });
          return;
        }

        const state = get();
        set({
          orderBook: data,
          isLoadingOrderBook: false,
          performanceMetrics: {
            ...state.performanceMetrics,
            orderBookUpdates: state.performanceMetrics.orderBookUpdates + 1,
            lastUpdate: Date.now(),
          },
        });
      },

      trades: [],
      addTrade: (trade) => {
        const state = get();
        const newTrades = [trade, ...state.trades].slice(0, 50); // Keep last 50
        set({
          trades: newTrades,
          isLoadingTrades: false,
          performanceMetrics: {
            ...state.performanceMetrics,
            tradeUpdates: state.performanceMetrics.tradeUpdates + 1,
            lastUpdate: Date.now(),
          },
        });
      },
      clearTrades: () => set({ trades: [], isLoadingTrades: true }),
      setTrades: (trades) => set({ trades, isLoadingTrades: false }),

      currentPrice: 95420.50,
      priceChange24h: 2.34,
      setCurrentPrice: (price, change) => set({ currentPrice: price, priceChange24h: change }),

      markPrice: 95420.50,
      indexPrice: 95420.00,
      setMarkPrice: (price) => set({ markPrice: price }),
      setIndexPrice: (price) => set({ indexPrice: price }),

      fundingRate: 0.0001,
      fundingCountdown: 3600,
      setFundingRate: (rate) => set({ fundingRate: rate }),
      setFundingCountdown: (seconds) => set({ fundingCountdown: seconds }),

      volume24h: 0,
      openInterest: 0,
      setVolume24h: (volume) => set({ volume24h: volume }),
      setOpenInterest: (interest) => set({ openInterest: interest }),

      allMids: {},
      setAllMids: (mids) => {
        const state = get();
        // Update prices based on current selected asset
        const selectedPrice = mids[state.selectedAsset];
        if (selectedPrice) {
          set({
            allMids: mids,
            currentPrice: selectedPrice,
            markPrice: selectedPrice,  // Mark price follows mid price
            indexPrice: selectedPrice - 0.5,  // Index slightly below for realism
          });
        } else {
          set({ allMids: mids });
        }
      },

      assetInfo: null,
      setAssetInfo: (info) => set({ assetInfo: info }),

      wsConnected: false,
      setWsConnected: (connected) => set({ wsConnected: connected }),

      candles: [],
      setCandles: (candles) => set({ candles, isLoadingCandles: false }),
      addCandle: (candle) => {
        const state = get();
        // WebSocket sends full CandleData structure: {type, coin, interval, t, o, h, l, c, v}
        // Use the candle as-is since it already matches CandleData interface
        const normalizedCandle = candle;

        // Check if this candle already exists (update vs new)
        const existingIndex = state.candles.findIndex((c: any) => c.t === normalizedCandle.t);

        let newCandles;
        if (existingIndex >= 0) {
          // Update existing candle
          newCandles = [...state.candles];
          newCandles[existingIndex] = normalizedCandle;
        } else {
          // Add new candle
          newCandles = [...state.candles, normalizedCandle].slice(-500); // Keep last 500
        }

        // Update the cache for this asset/timeframe combination
        // Extract interval from candle data if available
        const candleData = candle as any;
        if (candleData.coin && candleData.interval) {
          const cacheKey = `${candleData.coin}-${candleData.interval}`;
          const cachedCandles = state.candlesCache[cacheKey] || [];
          const cacheIndex = cachedCandles.findIndex((c: any) => c.t === normalizedCandle.t);

          let updatedCache;
          if (cacheIndex >= 0) {
            // Update existing candle in cache
            updatedCache = [...cachedCandles];
            updatedCache[cacheIndex] = normalizedCandle;
          } else {
            // Add new candle to cache
            updatedCache = [...cachedCandles, normalizedCandle].slice(-500);
          }

          // Update cache
          state.candlesCache = {
            ...state.candlesCache,
            [cacheKey]: updatedCache,
          };
        }

        set({
          candles: newCandles,
          candlesCache: state.candlesCache,
          isLoadingCandles: false,
          performanceMetrics: {
            ...state.performanceMetrics,
            candleUpdates: state.performanceMetrics.candleUpdates + 1,
            lastUpdate: Date.now(),
          },
        });
      },
      clearCandles: () => set({ candles: [], isLoadingCandles: true }),

      indicators: {
        volume: true,
        rsi: false,
        macd: false,
      },
      setIndicators: (updates) => {
        const state = get();
        set({
          indicators: {
            ...state.indicators,
            ...updates,
          },
        });
      },

      // Placeholder functions - these are no-ops but prevent errors
      fetchAllMarkets: async () => {
        // Placeholder - could fetch from API in future
        console.log('fetchAllMarkets called (placeholder)');
      },
      fetchMarketInfo: async (coin: string) => {
        // Placeholder - could fetch from API in future
        console.log('fetchMarketInfo called for:', coin);
      },
      fetchCandles: async (coin: string, timeframe: string) => {
        // Placeholder - candles are fetched via WebSocket in Chart component
        console.log('fetchCandles called for:', coin, timeframe);
      },
    }),
    {
      name: 'liquidvex-market-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedAsset: state.selectedAsset,
        selectedTimeframe: state.selectedTimeframe,
        candlesCache: state.candlesCache,
      }),
    }
  )
);

// Helper function to update selected asset with proper state management
export const useMarketStoreActions = () => {
  const setSelectedAsset = useMarketStore((state) => state.setSelectedAsset);
  const selectedAsset = useMarketStore((state) => state.selectedAsset);

  const updateSelectedAsset = (asset: string) => {
    const store = useMarketStore.getState();
    store.setSelectedAsset(asset);
  };

  return {
    updateSelectedAsset,
    selectedAsset,
  };
};
