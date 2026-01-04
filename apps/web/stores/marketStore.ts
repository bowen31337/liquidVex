/**
 * Zustand store for market data
 */

import { create } from 'zustand';
import { OrderBookData, TradeData, CandleData, AllMidsData, AssetInfo } from '../types';

interface MarketState {
  // Current selected asset
  selectedAsset: string;
  setSelectedAsset: (asset: string) => void;

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
}

export const useMarketStore = create<MarketState>((set, get) => ({
  selectedAsset: 'BTC',
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),

  orderBook: null,
  setOrderBook: (data) => set({ orderBook: data }),

  trades: [],
  addTrade: (trade) => {
    const state = get();
    const newTrades = [trade, ...state.trades].slice(0, 50); // Keep last 50
    set({ trades: newTrades });
  },
  clearTrades: () => set({ trades: [] }),

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
  setAllMids: (mids) => set({ allMids: mids }),

  assetInfo: null,
  setAssetInfo: (info) => set({ assetInfo: info }),

  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),

  candles: [],
  setCandles: (candles) => set({ candles }),
  addCandle: (candle) => {
    const state = get();
    const newCandles = [...state.candles, candle].slice(-500); // Keep last 500
    set({ candles: newCandles });
  },
  clearCandles: () => set({ candles: [] }),
}));
