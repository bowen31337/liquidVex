/**
 * API hooks for fetching data from backend
 */

import { useCallback } from 'react';
import { ExchangeMeta, AssetInfo, AccountState, AccountHistory, OrderResponse, OrderRequest, CancelRequest, ClosePositionRequest, ModifyPositionRequest, SetMarginModeRequest, ModifyOrderRequest } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useApi() {
  const getExchangeMeta = useCallback(async (): Promise<ExchangeMeta> => {
    const response = await fetch(`${API_URL}/api/info/meta`);
    if (!response.ok) throw new Error('Failed to fetch exchange meta');
    return response.json();
  }, []);

  const getAssetInfo = useCallback(async (coin: string): Promise<AssetInfo> => {
    const response = await fetch(`${API_URL}/api/info/asset/${coin}`);
    if (!response.ok) throw new Error(`Failed to fetch asset info for ${coin}`);
    return response.json();
  }, []);

  const getCandles = useCallback(async (coin: string, interval: string = '1h', limit: number = 500): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/info/candles/${coin}?interval=${interval}&limit=${limit}`);
    if (!response.ok) throw new Error(`Failed to fetch candles for ${coin}`);
    return response.json();
  }, []);

  const getAccountState = useCallback(async (address: string): Promise<AccountState> => {
    const response = await fetch(`${API_URL}/api/account/state/${address}`);
    if (!response.ok) throw new Error('Failed to fetch account state');
    const data = await response.json();
    // Transform snake_case to camelCase
    return {
      equity: data.equity,
      marginUsed: data.margin_used,
      availableBalance: data.available_balance,
      withdrawable: data.withdrawable,
      crossMarginSummary: {
        accountValue: data.cross_margin_summary?.account_value || 0,
        totalMarginUsed: data.cross_margin_summary?.total_margin_used || 0,
      },
    };
  }, []);

  const getPositions = useCallback(async (address: string): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/account/positions/${address}`);
    if (!response.ok) throw new Error('Failed to fetch positions');
    const data = await response.json();
    // Transform snake_case to camelCase
    return data.map((pos: any) => ({
      coin: pos.coin,
      side: pos.side,
      entryPx: pos.entry_px,
      sz: pos.sz,
      leverage: pos.leverage,
      marginUsed: pos.margin_used,
      unrealizedPnl: pos.unrealized_pnl,
      realizedPnl: pos.realized_pnl,
      liquidationPx: pos.liquidation_px,
      marginType: pos.margin_type,
    }));
  }, []);

  const getOpenOrders = useCallback(async (address: string): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/account/orders/${address}`);
    if (!response.ok) throw new Error('Failed to fetch open orders');
    const data = await response.json();
    // Transform snake_case to camelCase
    return data.map((order: any) => ({
      oid: order.oid,
      coin: order.coin,
      side: order.side,
      limitPx: order.limit_px,
      sz: order.sz,
      origSz: order.orig_sz,
      status: order.status,
      timestamp: order.timestamp,
      orderType: order.order_type,
      reduceOnly: order.reduce_only,
      postOnly: order.post_only,
      tif: order.tif,
    }));
  }, []);

  const getAccountHistory = useCallback(async (address: string): Promise<AccountHistory> => {
    const response = await fetch(`${API_URL}/api/account/history/${address}`);
    if (!response.ok) throw new Error('Failed to fetch account history');
    const data = await response.json();
    // Transform snake_case to camelCase
    return {
      orders: data.orders.map((order: any) => ({
        oid: order.oid,
        coin: order.coin,
        side: order.side,
        limitPx: order.limit_px,
        sz: order.sz,
        origSz: order.orig_sz,
        status: order.status,
        timestamp: order.timestamp,
        orderType: order.order_type,
        reduceOnly: order.reduce_only,
        postOnly: order.post_only,
        tif: order.tif,
      })),
      trades: data.trades.map((trade: any) => ({
        coin: trade.coin,
        side: trade.side,
        px: trade.px,
        sz: trade.sz,
        time: trade.time,
        fee: trade.fee,
        hash: trade.hash,
      })),
    };
  }, []);

  const getOrderHistory = useCallback(async (address: string): Promise<any[]> => {
    const history = await getAccountHistory(address);
    return history.orders;
  }, [getAccountHistory]);

  const placeOrder = useCallback(async (request: OrderRequest): Promise<OrderResponse> => {
    const response = await fetch(`${API_URL}/api/trade/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to place order');
    return response.json();
  }, []);

  const cancelOrder = useCallback(async (request: CancelRequest): Promise<OrderResponse> => {
    const response = await fetch(`${API_URL}/api/trade/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to cancel order');
    return response.json();
  }, []);

  const cancelAllOrders = useCallback(async (coin?: string): Promise<OrderResponse> => {
    const response = await fetch(`${API_URL}/api/trade/cancel-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coin }),
    });
    if (!response.ok) throw new Error('Failed to cancel all orders');
    return response.json();
  }, []);

  const closePosition = useCallback(async (request: ClosePositionRequest): Promise<OrderResponse> => {
    const response = await fetch(`${API_URL}/api/trade/close-position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to close position');
    return response.json();
  }, []);

  const modifyPosition = useCallback(async (request: ModifyPositionRequest): Promise<OrderResponse> => {
    const response = await fetch(`${API_URL}/api/trade/modify-position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to modify position');
    return response.json();
  }, []);

  const setMarginMode = useCallback(async (request: SetMarginModeRequest): Promise<OrderResponse> => {
    const response = await fetch(`${API_URL}/api/trade/set-margin-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to set margin mode');
    return response.json();
  }, []);

  const modifyOrder = useCallback(async (request: ModifyOrderRequest): Promise<OrderResponse> => {
    const response = await fetch(`${API_URL}/api/trade/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to modify order');
    return response.json();
  }, []);

  return {
    getExchangeMeta,
    getAssetInfo,
    getCandles,
    getAccountState,
    getPositions,
    getOpenOrders,
    getAccountHistory,
    getOrderHistory,
    placeOrder,
    cancelOrder,
    cancelAllOrders,
    closePosition,
    modifyPosition,
    setMarginMode,
    modifyOrder,
  };
}
