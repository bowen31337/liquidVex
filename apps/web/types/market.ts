/**
 * Market data type definitions for liquidVex
 * These types match the Python Pydantic models in the backend
 */

/**
 * Order book level (price and size at a specific price point)
 */
export interface OrderBookLevel {
  px: number;      // Price
  sz: number;      // Size
  n: number;       // Number of orders
}

/**
 * Market metadata and configuration
 */
export interface MarketInfo {
  coin: string;                  // Asset symbol (e.g., "BTC", "ETH")
  szDecimals: number;            // Decimal places for size
  pxDecimals: number;            // Decimal places for price
  minSz: number;                 // Minimum order size
  maxLeverage: number;           // Maximum allowed leverage
  fundingRate: number;           // Current funding rate
  openInterest: number;          // Open interest
  volume24h: number;             // 24h volume
  priceChange24h: number;        // 24h price change percentage
  markPrice: number;             // Current mark price
  indexPrice: number;            // Index price
}

/**
 * OHLCV candlestick data
 */
export interface Candle {
  t: number;   // Timestamp (milliseconds)
  o: number;   // Open price
  h: number;   // High price
  l: number;   // Low price
  c: number;   // Close price
  v: number;   // Volume
}

/**
 * Trade data
 */
export interface Trade {
  coin: string;    // Asset symbol
  side: 'B' | 'A'; // Side: 'B' = Buy, 'A' = Ask (Sell)
  px: number;      // Price
  sz: number;      // Size
  time: number;    // Timestamp
  hash: string;    // Trade hash
}

/**
 * Order fill event (execution of an order)
 */
export interface OrderFill {
  type: 'order_fill';
  oid: number;              // Order ID
  coin: string;             // Asset symbol
  side: 'B' | 'A';          // Order side
  px: number;              // Fill price
  sz: number;              // Filled size
  remaining: number;       // Remaining size
  status: 'open' | 'filled' | 'canceled' | 'triggered'; // New order status
  timestamp: number;       // Fill timestamp
  fee: number;             // Fee paid
  tradeId: number;         // Trade ID
}

/**
 * Trade event (executed trade)
 */
export interface TradeEvent {
  type: 'trade';
  coin: string;
  side: 'B' | 'A';
  px: number;
  sz: number;
  timestamp: number;
  tradeId: number;
  taker: boolean;          // True if taker, false if maker
}

/**
 * L2 Order book snapshot
 */
export interface OrderBook {
  coin: string;
  bids: OrderBookLevel[];  // Buy orders (descending)
  asks: OrderBookLevel[];  // Sell orders (ascending)
  timestamp: number;
}

/**
 * All market mid prices
 */
export interface AllMids {
  [coin: string]: number;  // Map of coin -> mid price
}

/**
 * Timeframe intervals for candlestick charts
 */
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

/**
 * API response wrappers
 */
export interface MetaResponse {
  [symbol: string]: MarketInfo;
}

export interface CandlesResponse {
  candles: Candle[];
}

export interface TradesResponse {
  trades: Trade[];
}
