/**
 * Bottom Panel component with tabs for Positions, Orders, History, Calculator
 */

'use client';

import { useOrderStore } from '../../stores/orderStore';
import { useUIStore } from '../../stores/orderStore';
import { PositionsTable } from '../PositionsTable/PositionsTable';
import { OrdersTable } from '../OrdersTable/OrdersTable';
import { OrderHistory } from '../OrdersTable/OrderHistory';
import { TradeHistory } from '../OrdersTable/TradeHistory';
import { LiquidationCalculator } from '../LiquidationCalculator';
import { ConnectionStatus } from '../ConnectionStatus/ConnectionStatus';

const TABS = ['Positions', 'Open Orders', 'Order History', 'Trade History', 'Calculator'] as const;

export function BottomPanel() {
  const { activeTab, setActiveTab } = useUIStore();
  const { positions, openOrders, orderHistory, tradeHistory } = useOrderStore();

  const getCount = (tab: (typeof TABS)[number]) => {
    switch (tab) {
      case 'Positions':
        return positions.length;
      case 'Open Orders':
        return openOrders.length;
      case 'Order History':
        return orderHistory.length;
      case 'Trade History':
        return tradeHistory.length;
      default:
        return 0;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Positions':
        return <PositionsTable />;
      case 'Open Orders':
        return <OrdersTable />;
      case 'Order History':
        return <OrderHistory />;
      case 'Trade History':
        return <TradeHistory />;
      case 'Calculator':
        return <LiquidationCalculator />;
      default:
        return null;
    }
  };

  return (
    <div className="h-[200px] border-t border-border bg-surface flex flex-col" data-testid="bottom-panel">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border pr-2">
        <div className="flex">
          {TABS.map((tab) => {
            const count = getCount(tab);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'text-text-primary border-b-2 border-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
                {count > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-surface-elevated rounded">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 px-2">
          <ConnectionStatus showText={true} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
