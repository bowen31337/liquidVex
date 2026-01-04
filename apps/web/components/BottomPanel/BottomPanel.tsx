/**
 * Bottom Panel component with tabs for Positions, Orders, History, Calculator
 * Responsive: Collapses tabs to icons or dropdown on smaller screens
 */

'use client';

import { useEffect, useState } from 'react';
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track window size for responsive behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Responsive breakpoints
  const isTablet = windowWidth < 1024;
  const isMobile = windowWidth < 640;

  // For mobile, show dropdown menu instead of tabs
  if (isMobile) {
    return (
      <div className="h-[200px] border-t border-border bg-surface flex flex-col" data-testid="bottom-panel">
        {/* Mobile Dropdown Menu */}
        <div className="flex items-center justify-between border-b border-border px-2 py-1">
          <div className="relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="px-3 py-1.5 text-sm bg-surface-elevated border border-border rounded hover:bg-border transition-colors flex items-center gap-2"
              data-testid="mobile-tab-dropdown"
            >
              <span>{activeTab}</span>
              {getCount(activeTab) > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-surface rounded">
                  {getCount(activeTab)}
                </span>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {mobileMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border rounded shadow-lg z-50">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-elevated transition-colors ${
                      activeTab === tab ? 'text-text-primary font-medium' : 'text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{tab}</span>
                      {getCount(tab) > 0 && (
                        <span className="px-1.5 py-0.5 text-xs bg-surface rounded">
                          {getCount(tab)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ConnectionStatus showText={false} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    );
  }

  // For tablet, show compact tabs with smaller padding
  if (isTablet) {
    return (
      <div className="h-[180px] border-t border-border bg-surface flex flex-col" data-testid="bottom-panel">
        {/* Compact Tabs */}
        <div className="flex items-center justify-between border-b border-border pr-2">
          <div className="flex flex-wrap">
            {TABS.map((tab) => {
              const count = getCount(tab);
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'text-text-primary border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span className="ml-1 px-1 py-0.5 text-[10px] bg-surface-elevated rounded">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 px-2">
            <ConnectionStatus showText={false} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    );
  }

  // Desktop layout (original)
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
