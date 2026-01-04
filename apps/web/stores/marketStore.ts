/**
 * Zustand store for market data
 */

import { create } from 'zustand';
import { OrderBookData, TradeData, CandleData, AssetInfo } from '../types';

interface MarketState {
  // Current selected asset
  selectedAsset: string;
  setSelectedAsset: (asset: string) => void;

  // Aliases for compatibility
  selectedCoin: string;
  selectedTimeframe: string;

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

  // Placeholder functions for MarketDataProvider compatibility
  fetchAllMarkets: () => Promise<void>;
  fetchMarketInfo: (coin: string) => Promise<void>;
  fetchCandles: (coin: string, timeframe: string) => Promise<void>;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  selectedAsset: 'BTC',
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),

  // Aliases for compatibility
  selectedCoin: 'BTC',
  selectedTimeframe: '1h',

  // Loading states
  isLoadingOrderBook: true,
  isLoadingTrades: true,
  isLoadingCandles: true,
  setIsLoadingOrderBook: (loading) => set({ isLoadingOrderBook: loading }),
  setIsLoadingTrades: (loading) => set({ isLoadingTrades: loading }),
  setIsLoadingCandles: (loading) => set({ isLoadingCandles: loading }),

  orderBook: null,
  setOrderBook: (data) => set({ orderBook: data, isLoadingOrderBook: false }),

  trades: [],
  addTrade: (trade) => {
    const state = get();
    const newTrades = [trade, ...state.trades].slice(0, 50); // Keep last 50
    set({ trades: newTrades, isLoadingTrades: false });
  },
  clearTrades: () => set({ trades: [], isLoadingTrades: true }),

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
    // Normalize candle data from WebSocket message
    // WebSocket sends {type, coin, interval, t, o, h, l, c, v}
    // We want to extract just the candle part: {t, o, h, l, c, v}
    const normalizedCandle = {
      t: candle.t,
      o: candle.o,
      h: candle.h,
      l: candle.l,
      c: candle.c,
      v: candle.v,
    };

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

    set({ candles: newCandles, isLoadingCandles: false });
  },
  clearCandles: () => set({ candles: [], isLoadingCandles: true }),

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
}));
