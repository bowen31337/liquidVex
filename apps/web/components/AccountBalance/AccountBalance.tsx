/**
 * Account Balance component - displays equity, margin, available, and withdrawable balances
 */

'use client';

import { useState } from 'react';
import { useAccount } from '../../hooks/useAccount';
import { useMarketStore } from '../../stores/marketStore';
import { formatCurrency } from '../../lib/utils';
import { DepositModal } from '../Modal/DepositModal';
import { WithdrawalModal } from '../Modal/WithdrawalModal';

export function AccountBalance() {
  const { accountState, getPNLPercent } = useAccount();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  const pnlPercent = getPNLPercent();
  const isProfit = pnlPercent >= 0;

  // Get max leverage from asset info or fallback
  const maxLeverage = useMarketStore.getState().assetInfo?.maxLeverage || 10;

  if (!accountState) {
    return (
      <>
        <div data-testid="account-balance-loading" className="bg-surface border border-border rounded-lg p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-surface-elevated rounded w-1/3"></div>
            <div className="h-8 bg-surface-elevated rounded w-2/3"></div>
            <div className="h-3 bg-surface-elevated rounded w-1/4"></div>
          </div>
        </div>
        <DepositModal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} />
        <WithdrawalModal isOpen={withdrawalModalOpen} onClose={() => setWithdrawalModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div data-testid="account-balance" className="bg-surface border border-border rounded-lg p-4 space-y-3">
        {/* Account Equity */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Account Equity</span>
            <span className={`text-sm font-mono ${isProfit ? 'text-profit' : 'text-loss'}`}>
              {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-text-primary">
            {formatCurrency(accountState.equity)}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <span className="text-text-secondary">Margin Used</span>
            <div className="text-text-primary font-mono">
              {formatCurrency(accountState.marginUsed)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-text-secondary">Available</span>
            <div className="text-text-primary font-mono">
              {formatCurrency(accountState.availableBalance)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-text-secondary">Withdrawable</span>
            <div className="text-text-primary font-mono">
              {formatCurrency(accountState.withdrawable)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-text-secondary">Leverage</span>
            <div className="text-text-primary font-mono">
              {maxLeverage}x
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center text-xs text-text-secondary">
            <span>Margin Utilization</span>
            <span>
              {((accountState.marginUsed / accountState.equity) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-surface-elevated rounded-full h-1.5 mt-1">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                accountState.marginUsed / accountState.equity > 0.9
                  ? 'bg-loss'
                  : accountState.marginUsed / accountState.equity > 0.7
                  ? 'bg-warning'
                  : 'bg-accent'
              }`}
              style={{
                width: `${Math.min((accountState.marginUsed / accountState.equity) * 100, 100)}%`
              }}
            />
          </div>
        </div>

        {/* Cross Margin Summary */}
        {accountState.crossMarginSummary && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-text-secondary mb-2">Cross Margin Summary</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-text-secondary">Account Value</div>
              <div className="text-text-primary font-mono">
                {formatCurrency(accountState.crossMarginSummary.accountValue)}
              </div>
              <div className="text-text-secondary">Total Margin Used</div>
              <div className="text-text-primary font-mono">
                {formatCurrency(accountState.crossMarginSummary.totalMarginUsed)}
              </div>
            </div>
          </div>
        )}

        {/* Deposit/Withdraw Actions */}
        <div className="pt-3 border-t border-border flex gap-2">
          <button
            onClick={() => setDepositModalOpen(true)}
            data-testid="deposit-button"
            className="flex-1 px-3 py-2 bg-long text-white text-sm rounded hover:bg-long-muted transition-colors"
          >
            Deposit
          </button>
          <button
            onClick={() => setWithdrawalModalOpen(true)}
            data-testid="withdraw-button"
            className="flex-1 px-3 py-2 bg-short text-white text-sm rounded hover:bg-short-muted transition-colors"
          >
            Withdraw
          </button>
        </div>
      </div>
      <DepositModal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} />
      <WithdrawalModal isOpen={withdrawalModalOpen} onClose={() => setWithdrawalModalOpen(false)} />
    </>
  );
}
