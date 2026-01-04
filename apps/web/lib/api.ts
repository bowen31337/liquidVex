/**
 * API client for liquidVex backend
 * Handles all REST API calls to the FastAPI backend
 */

import type {
  MetaResponse,
  MarketInfo,
  CandlesResponse,
  TradesResponse,
  Timeframe,
} from '../types/market';
import type {
  Order,
  PlaceOrderRequest,
  CancelOrderRequest,
  ModifyOrderRequest,
  CancelAllOrdersRequest,
} from '../types/order';
import type { AccountState, Position } from '../types/account';

// API base URL - default to localhost, override with env var
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Info API - Market metadata and data
 */
export const infoAPI = {
  /**
   * Get exchange metadata (all available assets)
   */
  async getMeta(): Promise<MetaResponse> {
    return fetchAPI<MetaResponse>('/api/info/meta');
  },

  /**
   * Get info for a specific asset
   */
  async getAsset(coin: string): Promise<MarketInfo> {
    return fetchAPI<MarketInfo>(`/api/info/asset/${coin}`);
  },

  /**
   * Get funding rate history for an asset
   */
  async getFunding(coin: string): Promise<{ fundingHistory: Array<{ time: number; rate: number }> }> {
    return fetchAPI(`/api/info/funding/${coin}`);
  },

  /**
   * Get OHLCV candlestick data
   */
  async getCandles(
    coin: string,
    interval: Timeframe = '1h',
    startTime?: number,
    endTime?: number
  ): Promise<CandlesResponse> {
    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime.toString());
    if (endTime) params.append('endTime', endTime.toString());

    const queryString = params.toString();
    return fetchAPI<CandlesResponse>(
      `/api/info/candles/${coin}?interval=${interval}${queryString ? `&${queryString}` : ''}`
    );
  },
};

/**
 * Trading API - Order management
 */
export const tradeAPI = {
  /**
   * Place a new order
   */
  async placeOrder(order: PlaceOrderRequest): Promise<{ success: boolean; orderId?: number; error?: string }> {
    return fetchAPI('/api/trade/place', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  /**
   * Cancel an order
   */
  async cancelOrder(request: CancelOrderRequest): Promise<{ success: boolean }> {
    return fetchAPI('/api/trade/cancel', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Modify an existing order
   */
  async modifyOrder(request: ModifyOrderRequest): Promise<{ success: boolean }> {
    return fetchAPI('/api/trade/modify', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Cancel all orders for an asset
   */
  async cancelAllOrders(request: CancelAllOrdersRequest): Promise<{ success: boolean; canceledCount: number }> {
    return fetchAPI('/api/trade/cancel-all', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Close a position
   */
  async closePosition(coin: string): Promise<{ success: boolean }> {
    return fetchAPI('/api/trade/close-position', {
      method: 'POST',
      body: JSON.stringify({ coin }),
    });
  },
};

/**
 * Account API - Account state and positions
 */
export const accountAPI = {
  /**
   * Get account state
   */
  async getState(address: string): Promise<AccountState> {
    return fetchAPI<AccountState>(`/api/account/state/${address}`);
  },

  /**
   * Get open positions
   */
  async getPositions(address: string): Promise<{ positions: Position[] }> {
    return fetchAPI(`/api/account/positions/${address}`);
  },

  /**
   * Get open orders
   */
  async getOrders(address: string): Promise<{ orders: Order[] }> {
    return fetchAPI(`/api/account/orders/${address}`);
  },

  /**
   * Get order and trade history
   */
  async getHistory(
    address: string,
    type: 'orders' | 'trades' = 'orders'
  ): Promise<{ history: any[] }> {
    return fetchAPI(`/api/account/history/${address}?type=${type}`);
  },
};

/**
 * Export a combined API object
 */
export const api = {
  info: infoAPI,
  trade: tradeAPI,
  account: accountAPI,
};
