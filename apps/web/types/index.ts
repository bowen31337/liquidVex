/**
 * Shared TypeScript interfaces for liquidVex
 * Matches the data models from app_spec.txt
 */

// Order types
export interface Order {
  oid: number;
  coin: string;
  side: 'B' | 'A'; // Buy or Ask (Sell)
  limitPx: number;
  sz: number;
  origSz: number;
  status: 'open' | 'filled' | 'canceled' | 'triggered';
  timestamp: number;
  orderType: 'limit' | 'market' | 'stop_limit' | 'stop_market';
  reduceOnly: boolean;
  postOnly: boolean;
  tif: 'GTC' | 'IOC' | 'FOK';
}

// Position types
export interface Position {
  coin: string;
  side: 'long' | 'short';
  entryPx: number;
  sz: number;
  leverage: number;
  marginUsed: number;
  unrealizedPnl: number;
  realizedPnl: number;
  liquidationPx: number;
  marginType: 'cross' | 'isolated';
}

// Order book types
export interface OrderBookLevel {
  px: number; // Price
  sz: number; // Size
  n: number; // Number of orders
}

export interface OrderBookData {
  type: 'orderbook_snapshot' | 'orderbook_update' | 'orderbook';
  coin: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

// Trade types
export interface Trade {
  coin: string;
  side: 'B' | 'A';
  px: number;
  sz: number;
  time: number;
  hash: string;
  fee?: number;  // Optional fee field for trade history
}

export interface TradeData {
  type: 'trade';
  coin: string;
  side: 'B' | 'A';
  px: number;
  sz: number;
  time: number;
  hash: string;
}

// Candle types
export interface Candle {
  t: number; // Timestamp
  o: number; // Open
  h: number; // High
  l: number; // Low
  c: number; // Close
  v: number; // Volume
}

export interface CandleData {
  type: 'candle';
  coin: string;
  interval: string;
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

// Account types
export interface AccountState {
  equity: number;
  marginUsed: number;
  availableBalance: number;
  withdrawable: number;
  crossMarginSummary: {
    accountValue: number;
    totalMarginUsed: number;
  };
}

export interface AccountHistory {
  orders: Order[];
  trades: Trade[];
}

// Market info types
export interface AssetInfo {
  coin: string;
  szDecimals: number;
  pxDecimals: number;
  minSz: number;
  maxLeverage: number;
  fundingRate: number;
  openInterest: number;
  volume24h: number;
  priceChange24h: number;
}

export interface ExchangeMeta {
  exchange: string;
  assets: AssetInfo[];
}

// All mids type
export interface AllMidsData {
  type: 'allMids';
  mids: Record<string, number>;
  timestamp: number;
}

// WebSocket user stream types
export interface UserStreamData {
  type: 'connected' | 'heartbeat';
  address?: string;
  timestamp: number;
}

// Order request types
export interface OrderRequest {
  coin: string;
  isBuy: boolean;
  limitPx: number;
  stopPx?: number;  // Trigger price for stop orders
  sz: number;
  orderType: 'limit' | 'market' | 'stop_limit' | 'stop_market';
  reduceOnly: boolean;
  postOnly: boolean;
  tif: 'GTC' | 'IOC' | 'FOK';
  signature: string;
  timestamp: number;
}

export interface CancelRequest {
  coin: string;
  oid: number;
  signature: string;
  timestamp: number;
}

export interface ModifyRequest {
  coin: string;
  oid: number;
  newPx?: number;
  newSz?: number;
  signature: string;
  timestamp: number;
}

export interface CancelAllRequest {
  coin?: string;
  signature: string;
  timestamp: number;
}

export interface ClosePositionRequest {
  coin: string;
  signature: string;
  timestamp: number;
}

export interface ModifyPositionRequest {
  coin: string;
  addSize?: number;  // Size to add to position
  reduceSize?: number;  // Size to reduce from position
  signature: string;
  timestamp: number;
}

export interface SetMarginModeRequest {
  coin: string;
  marginType: 'cross' | 'isolated';
  signature: string;
  timestamp: number;
}

export interface OrderResponse {
  success: boolean;
  orderId?: number;
  message?: string;
}
