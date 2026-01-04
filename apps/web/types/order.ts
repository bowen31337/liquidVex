/**
 * Order and trading type definitions
 */

/**
 * Order types supported
 */
export type OrderType = 'limit' | 'market' | 'stop_limit' | 'stop_market';

/**
 * Time-in-force options
 */
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';

/**
 * Order side
 */
export type OrderSide = 'B' | 'A';  // Buy or Ask (Sell)

/**
 * Order status
 */
export type OrderStatus = 'open' | 'filled' | 'canceled' | 'triggered';

/**
 * Order request (placing a new order)
 */
export interface PlaceOrderRequest {
  coin: string;           // Asset symbol
  is_buy: boolean;        // True for buy, false for sell
  limit_px: number;       // Limit price (ignored for market orders)
  sz: number;             // Order size
  order_type: OrderType;
  reduce_only: boolean;   // If true, only reduces position
  post_only: boolean;     // If true, only posts as maker
  tif: TimeInForce;       // Time in force
  stop_px?: number;       // Stop price (for stop orders)
}

/**
 * Order in the system
 */
export interface Order {
  oid: number;            // Order ID
  coin: string;           // Asset symbol
  side: OrderSide;        // Buy or Ask (Sell)
  limitPx: number;        // Limit price
  sz: number;             // Order size
  origSz: number;         // Original size (before fills)
  status: OrderStatus;
  timestamp: number;      // Creation timestamp
  orderType: OrderType;
  reduceOnly: boolean;
  postOnly: boolean;
  tif: TimeInForce;
  filledSz?: number;      // Filled size
  avgFillPx?: number;     // Average fill price
}

/**
 * Cancel order request
 */
export interface CancelOrderRequest {
  coin: string;
  oid: number;
}

/**
 * Modify order request
 */
export interface ModifyOrderRequest {
  oid: number;
  coin: string;
  limit_px?: number;
  sz?: number;
}

/**
 * Cancel all orders request
 */
export interface CancelAllOrdersRequest {
  coin: string;
}
