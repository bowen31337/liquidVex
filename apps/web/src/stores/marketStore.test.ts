/**
 * Unit tests for MarketStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMarketStore } from '@/stores/marketStore';
import { createOrderBook } from '@/utils/mockData';

describe('MarketStore', () => {
  let store: ReturnType<typeof createMarketStore>;

  beforeEach(() => {
    store = createMarketStore();
  });

  it('should initialize with default state', () => {
    expect(store.selectedAsset).toBe('BTC');
    expect(store.currentPrice).toBe(0);
    expect(store.priceIncrement).toBe(0.01);
    expect(store.sizeIncrement).toBe(0.001);
    expect(store.orderBook.bids).toEqual([]);
    expect(store.orderBook.asks).toEqual([]);
    expect(store.trades.length).toBe(0);
  });

  it('should update selected asset', () => {
    store.updateSelectedAsset('ETH');
    expect(store.selectedAsset).toBe('ETH');
  });

  it('should update current price', () => {
    store.updateCurrentPrice(100000);
    expect(store.currentPrice).toBe(100000);
  });

  it('should update order book', () => {
    const mockOrderBook = createOrderBook('BTC', 10);
    store.updateOrderBook(mockOrderBook);

    expect(store.orderBook.bids.length).toBe(10);
    expect(store.orderBook.asks.length).toBe(10);
    expect(store.orderBook.coin).toBe('BTC');
  });

  it('should update trades', () => {
    const mockTrade = {
      coin: 'BTC',
      side: 'B' as const,
      px: 95000,
      sz: 0.1,
      time: Date.now(),
      hash: 'test-hash'
    };

    store.updateTrades([mockTrade]);

    expect(store.trades.length).toBe(1);
    expect(store.trades[0].coin).toBe('BTC');
    expect(store.trades[0].side).toBe('B');
  });

  it('should update candles', () => {
    const mockCandles = [
      { t: Date.now(), o: 95000, h: 95100, l: 94900, c: 95050, v: 100 }
    ];

    store.updateCandles(mockCandles);

    expect(store.candles.length).toBe(1);
    expect(store.candles[0].o).toBe(95000);
  });

  it('should reset state when asset changes', () => {
    // Set some data
    store.updateCurrentPrice(95000);
    store.updateOrderBook(createOrderBook('BTC', 5));
    store.updateTrades([{ coin: 'BTC', side: 'B', px: 95000, sz: 0.1, time: Date.now(), hash: 'test' }]);

    // Change asset
    store.updateSelectedAsset('ETH');

    // Should reset relevant data
    expect(store.currentPrice).toBe(0);
    expect(store.orderBook.bids).toEqual([]);
    expect(store.orderBook.asks).toEqual([]);
    expect(store.trades).toEqual([]);
  });
});