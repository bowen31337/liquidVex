# Zustand Store Persistence and TanStack Query Caching

This document describes the implementation of Zustand store persistence and TanStack Query caching in liquidVex.

## Zustand Store Persistence

### Market Store (`stores/marketStore.ts`)

The market store now persists selected user preferences across browser sessions:

**Persisted State:**
- `selectedAsset`: Currently selected trading pair (e.g., 'BTC')
- `selectedTimeframe`: Currently selected chart timeframe (e.g., '1h')

**Non-Persisted State:**
- Real-time market data (order book, trades, prices)
- Loading states
- WebSocket connection status
- Chart data (candles)

**Implementation Details:**
```typescript
export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'liquidvex-market-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedAsset: state.selectedAsset,
        selectedTimeframe: state.selectedTimeframe,
      }),
    }
  )
);
```

### Order Store (`stores/orderStore.ts`)

Already had partial persistence implementation for UI state:

**Persisted State:**
- `activeTab`: Currently selected bottom panel tab

**Non-Persisted State:**
- Positions, orders, account state (fetched from API)
- Order form state (reset on refresh for security)

### Benefits

1. **User Experience**: Users don't lose their preferred trading pair and chart settings
2. **Performance**: Reduced initial API calls for UI preferences
3. **Consistency**: Application state persists across browser sessions

## TanStack Query Caching

### Market Data Hooks (`hooks/useMarketData.ts`)

Provides cached API calls for market data with intelligent refetching:

**Available Hooks:**
- `useMarketMeta()`: Exchange metadata (5min cache)
- `useAssetInfo(coin)`: Asset details (30s cache, 30s refetch)
- `useFundingHistory(coin)`: Funding rates (1min cache, 1min refetch)
- `useCandles(coin, interval)`: OHLCV data (10s cache, 10s refetch)

**Caching Strategy:**
- **Stale Time**: How long data is considered fresh
- **GC Time**: How long unused data is kept in memory
- **Refetch Interval**: Automatic refetching for real-time data

### Account Data Hooks (`hooks/useAccountData.ts`)

Cached account operations with mutation support:

**Available Hooks:**
- `useAccountState(address)`: Account balance and margin (5s cache)
- `useAccountPositions(address)`: Open positions (3s cache)
- `useAccountOrders(address)`: Open orders (2s cache)
- `useAccountHistory(address, type)`: Order/trade history (10s cache)
- `usePlaceOrder()`: Order placement mutations
- `useCancelOrder()`: Order cancellation mutations
- `useClosePosition()`: Position closure mutations

**Mutation Strategy:**
- Automatic cache invalidation after successful operations
- Optimistic updates for better UX
- Error handling and retry logic

### Performance Benefits

1. **Reduced API Calls**: Intelligent caching prevents unnecessary requests
2. **Faster UI**: Instant access to cached data
3. **Background Updates**: Automatic refetching keeps data fresh
4. **Optimistic Updates**: UI responds immediately to user actions
5. **Error Recovery**: Automatic retries and graceful error handling

## Usage Examples

### Basic Market Data
```typescript
import { useMarketMeta, useAssetInfo } from '@/hooks/useMarketData';

function MarketOverview() {
  const { data: meta, isLoading } = useMarketMeta();
  const { data: assetInfo } = useAssetInfo('BTC');

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Available Assets: {meta?.coins?.length}</h2>
      <p>BTC Price: {assetInfo?.price}</p>
    </div>
  );
}
```

### Account Operations
```typescript
import { useAccountPositions, usePlaceOrder } from '@/hooks/useAccountData';

function TradingPanel() {
  const { data: positions } = useAccountPositions(walletAddress);
  const placeOrder = usePlaceOrder();

  const handlePlaceOrder = async (orderData) => {
    try {
      await placeOrder.mutateAsync(orderData);
      // Cache automatically invalidated, UI updates
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  return (
    <div>
      <h3>Positions: {positions?.length}</h3>
      <OrderForm onSubmit={handlePlaceOrder} />
    </div>
  );
}
```

### Store Integration
```typescript
import { useMarketStoreWithQuery } from '@/hooks/useMarketData';

function AssetSelector() {
  const { selectedAsset, updateSelectedAsset } = useMarketStoreWithQuery();

  const handleAssetChange = (asset) => {
    updateSelectedAsset(asset); // Updates store AND invalidates relevant queries
  };

  return (
    <select value={selectedAsset} onChange={(e) => handleAssetChange(e.target.value)}>
      {/* Asset options */}
    </select>
  );
}
```

## Configuration

### QueryClient Defaults
```typescript
// In ClientProviders.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      gcTime: 5 * 60 * 1000,  // 5 minutes
      staleTime: 30 * 1000,   // 30 seconds
    },
    mutations: {
      retry: 2,
    },
  },
});
```

### Cache Keys
All queries use structured cache keys for proper invalidation:
- `['market', 'meta']` - Exchange metadata
- `['market', 'asset', coin]` - Asset-specific data
- `['account', 'state', address]` - Account state
- `['account', 'positions', address]` - Account positions

## Best Practices

1. **Use Specific Cache Keys**: Always include relevant parameters
2. **Set Appropriate Timeouts**: Balance freshness with performance
3. **Handle Errors Gracefully**: Use `onError` callbacks for mutations
4. **Invalidate Strategically**: Only invalidate when data actually changes
5. **Monitor Performance**: Use TanStack Query DevTools for debugging

## Future Improvements

1. **Optimistic Updates**: Implement for order placement/cancellation
2. **Background Sync**: Sync data when user returns to app
3. **Smart Prefetching**: Load data before user navigates
4. **Query Deduplication**: Prevent duplicate requests
5. **Cache Persistence**: Persist query cache across sessions