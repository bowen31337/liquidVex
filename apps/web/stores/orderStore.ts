/**
 * Zustand store for order and position management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Order, Position, AccountState, AccountHistory } from '../types';
import { useApi } from '../hooks/useApi';

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
  updateOpenOrder: (oid: number, updates: Partial<Order>) => void;
  clearOpenOrders: () => void;

  // Order history
  orderHistory: Order[];
  setOrderHistory: (orders: Order[]) => void;
  addOrderHistory: (order: Order) => void;
  clearOrderHistory: () => void;

  // Trade history
  tradeHistory: AccountHistory['trades'];
  setTradeHistory: (trades: AccountHistory['trades']) => void;
  clearTradeHistory: () => void;

  // Account state
  accountState: AccountState | null;
  setAccountState: (state: AccountState) => void;
  fetchAccountState: (address: string) => Promise<void>;

  // Order form state
  orderForm: OrderFormState;
  setOrderForm: (form: Partial<OrderState['orderForm']>) => void;
  resetOrderForm: () => void;

  // UI state
  activeTab: 'Positions' | 'Open Orders' | 'Order History' | 'Trade History' | 'Calculator';
  setActiveTab: (tab: OrderState['activeTab']) => void;
}

// Separate interface for persisted UI state
interface PersistedUIState {
  activeTab: OrderState['activeTab'];
  setActiveTab: (tab: OrderState['activeTab']) => void;
}

// Store for non-persistent data (positions, orders, etc.)
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
  updateOpenOrder: (oid, updates) => set((state) => ({
    openOrders: state.openOrders.map(o => o.oid === oid ? { ...o, ...updates } : o)
  })),
  clearOpenOrders: () => set({ openOrders: [] }),

  orderHistory: [],
  setOrderHistory: (orders) => set({ orderHistory: orders }),
  addOrderHistory: (order) => set((state) => ({ orderHistory: [...state.orderHistory, order] })),
  clearOrderHistory: () => set({ orderHistory: [] }),

  tradeHistory: [],
  setTradeHistory: (trades) => set({ tradeHistory: trades }),
  clearTradeHistory: () => set({ tradeHistory: [] }),

  accountState: null,
  setAccountState: (state) => set({ accountState: state }),
  fetchAccountState: async (address: string) => {
    try {
      const api = useApi();
      const state = await api.getAccountState(address);
      set({ accountState: state });
    } catch (error) {
      console.error('Failed to fetch account state:', error);
    }
  },

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

// Separate store for persisted UI state (tab selection)
export const useUIStore = create<PersistedUIState>()(
  persist(
    (set) => ({
      activeTab: 'Positions',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'liquidvex-ui-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeTab: state.activeTab }), // Only persist activeTab
    }
  )
);
