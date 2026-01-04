/**
 * API hooks for fetching data from backend
 */

import { useCallback } from 'react';
import { ExchangeMeta, AssetInfo, AccountState, AccountHistory, OrderResponse, OrderRequest, CancelRequest } from '../types';

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
    return response.json();
  }, []);

  const getPositions = useCallback(async (address: string): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/account/positions/${address}`);
    if (!response.ok) throw new Error('Failed to fetch positions');
    return response.json();
  }, []);

  const getOpenOrders = useCallback(async (address: string): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/account/orders/${address}`);
    if (!response.ok) throw new Error('Failed to fetch open orders');
    return response.json();
  }, []);

  const getAccountHistory = useCallback(async (address: string): Promise<AccountHistory> => {
    const response = await fetch(`${API_URL}/api/account/history/${address}`);
    if (!response.ok) throw new Error('Failed to fetch account history');
    return response.json();
  }, []);

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

  return {
    getExchangeMeta,
    getAssetInfo,
    getCandles,
    getAccountState,
    getPositions,
    getOpenOrders,
    getAccountHistory,
    placeOrder,
    cancelOrder,
    cancelAllOrders,
  };
}
