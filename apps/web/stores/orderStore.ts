/**
 * Zustand store for order and position management
 */

import { create } from 'zustand';
import { Order, Position, AccountState, AccountHistory } from '../types';

export type OrderFormState = {
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop_limit' | 'stop_market';
  price: string;
  stopPrice: string; // Trigger price for stop orders
  size: string;
  leverage: number;
  reduceOnly: boolean;
  postOnly: boolean;
  tif: 'GTC' | 'IOC' | 'FOK';
};

interface OrderState {
  // Open positions
  positions: Position[];
  setPositions: (positions: Position[]) => void;
  addPosition: (position: Position) => void;
  removePosition: (coin: string) => void;
  clearPositions: () => void;

  // Open orders
  openOrders: Order[];
  setOpenOrders: (orders: Order[]) => void;
  addOpenOrder: (order: Order) => void;
  removeOpenOrder: (oid: number) => void;
  clearOpenOrders: () => void;

  // Order history
  orderHistory: Order[];
  setOrderHistory: (orders: Order[]) => void;
  clearOrderHistory: () => void;

  // Trade history
  tradeHistory: AccountHistory['trades'];
  setTradeHistory: (trades: AccountHistory['trades']) => void;
  clearTradeHistory: () => void;

  // Account state
  accountState: AccountState | null;
  setAccountState: (state: AccountState) => void;

  // Order form state
  orderForm: OrderFormState;
  setOrderForm: (form: Partial<OrderState['orderForm']>) => void;
  resetOrderForm: () => void;

  // UI state
  activeTab: 'Positions' | 'Open Orders' | 'Order History' | 'Trade History';
  setActiveTab: (tab: OrderState['activeTab']) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  positions: [],
  setPositions: (positions) => set({ positions }),
  addPosition: (position) => set((state) => ({ positions: [...state.positions, position] })),
  removePosition: (coin) => set((state) => ({ positions: state.positions.filter(p => p.coin !== coin) })),
  clearPositions: () => set({ positions: [] }),

  openOrders: [],
  setOpenOrders: (orders) => set({ openOrders: orders }),
  addOpenOrder: (order) => set((state) => ({ openOrders: [...state.openOrders, order] })),
  removeOpenOrder: (oid) => set((state) => ({ openOrders: state.openOrders.filter(o => o.oid !== oid) })),
  clearOpenOrders: () => set({ openOrders: [] }),

  orderHistory: [],
  setOrderHistory: (orders) => set({ orderHistory: orders }),
  clearOrderHistory: () => set({ orderHistory: [] }),

  tradeHistory: [],
  setTradeHistory: (trades) => set({ tradeHistory: trades }),
  clearTradeHistory: () => set({ tradeHistory: [] }),

  accountState: null,
  setAccountState: (state) => set({ accountState: state }),

  orderForm: {
    side: 'buy',
    type: 'limit',
    price: '',
    stopPrice: '',
    size: '',
    leverage: 10,
    reduceOnly: false,
    postOnly: false,
    tif: 'GTC',
  },
  setOrderForm: (form) => set((state) => ({ orderForm: { ...state.orderForm, ...form } })),
  resetOrderForm: () => set({
    orderForm: {
      side: 'buy',
      type: 'limit',
      price: '',
      stopPrice: '',
      size: '',
      leverage: 10,
      reduceOnly: false,
      postOnly: false,
      tif: 'GTC',
    }
  }),

  activeTab: 'Positions',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
