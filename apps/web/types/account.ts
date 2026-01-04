/**
 * Account and position type definitions
 */

/**
 * Position side
 */
export type PositionSide = 'long' | 'short';

/**
 * Margin type
 */
export type MarginType = 'cross' | 'isolated';

/**
 * Position data
 */
export interface Position {
  coin: string;              // Asset symbol
  side: PositionSide;        // long or short
  entryPx: number;           // Entry price
  sz: number;                // Position size
  leverage: number;          // Leverage multiplier
  marginUsed: number;        // Margin allocated
  unrealizedPnl: number;     // Unrealized PnL
  realizedPnl: number;       // Realized PnL
  liquidationPx: number;     // Liquidation price
  marginType: MarginType;    // cross or isolated
  returnOnEquity: number;    // ROE percentage
  fundingPayment?: number;   // Latest funding payment
}

/**
 * Account state
 */
export interface AccountState {
  equity: number;                    // Total account equity
  marginUsed: number;                // Total margin used
  availableBalance: number;          // Available for trading
  crossMarginSummary: {
    accountValue: number;            // Account value
    totalMarginUsed: number;         // Margin used
  };
  withdrawable: number;              // Withdrawable amount
  leverage: {
    [coin: string]: number;          // Leverage settings per asset
  };
  marginType: {
    [coin: string]: MarginType;      // Margin type per asset
  };
}

/**
 * Wallet connection state
 */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: number | null;
}
