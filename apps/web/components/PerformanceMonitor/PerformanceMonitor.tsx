/**
 * Performance Monitor component for real-time performance tracking
 */

'use client';

import { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { wsManager } from '../../hooks/useWebSocketManager';
import { useMarketStore } from '../../stores/marketStore';

interface PerformanceStats {
  uiUpdates: number;
  websocketMessages: number;
  websocketDropped: number;
  websocketLatency: number;
  orderBookUpdates: number;
  tradeUpdates: number;
  candleUpdates: number;
}

export function PerformanceMonitor({ enabled = true }: { enabled?: boolean }) {
  const [stats, setStats] = useState<PerformanceStats>({
    uiUpdates: 0,
    websocketMessages: 0,
    websocketDropped: 0,
    websocketLatency: 0,
    orderBookUpdates: 0,
    tradeUpdates: 0,
    candleUpdates: 0,
  });

  const performanceMonitor = usePerformanceMonitor(enabled);
  const { performanceMetrics } = useMarketStore();

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      // Get WebSocket metrics
      const wsMetrics = wsManager.getPerformanceMetrics();

      // Get UI metrics
      const uiMetrics = performanceMonitor.getMetrics();

      // Update stats
      setStats({
        uiUpdates: uiMetrics.updateCount || 0,
        websocketMessages: wsMetrics.totalMessages || 0,
        websocketDropped: wsMetrics.droppedMessages || 0,
        websocketLatency: wsMetrics.averageLatency || 0,
        orderBookUpdates: performanceMetrics.orderBookUpdates || 0,
        tradeUpdates: performanceMetrics.tradeUpdates || 0,
        candleUpdates: performanceMetrics.candleUpdates || 0,
      });

      // Log warnings for performance issues
      if (wsMetrics.averageLatency > 100) {
        console.warn(`WebSocket latency: ${wsMetrics.averageLatency.toFixed(2)}ms`);
      }

      if (wsMetrics.droppedMessages > 0) {
        console.warn(`Dropped WebSocket messages: ${wsMetrics.droppedMessages}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, performanceMonitor, performanceMetrics]);

  if (!enabled || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const targetMet = stats.websocketLatency < 100;
  const efficiency = stats.websocketMessages > 0
    ? ((stats.websocketMessages - stats.websocketDropped) / stats.websocketMessages) * 100
    : 100;

  return (
    <div className="fixed bottom-4 left-4 bg-surface-elevated border border-border rounded-lg p-3 text-xs font-mono z-50">
      <div className="text-text-secondary mb-1">Performance Monitor</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-text-secondary">WebSocket:</span>
          <span className={targetMet ? 'text-long' : 'text-short'}>
            {stats.websocketLatency.toFixed(1)}ms {targetMet ? '✅' : '❌'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Efficiency:</span>
          <span>{efficiency.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Dropped:</span>
          <span className="text-short">{stats.websocketDropped}</span>
        </div>
        <div className="border-t border-border my-1"></div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Updates:</span>
          <span>{stats.orderBookUpdates + stats.tradeUpdates + stats.candleUpdates}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">OrderBook:</span>
          <span>{stats.orderBookUpdates}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Trades:</span>
          <span>{stats.tradeUpdates}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Candles:</span>
          <span>{stats.candleUpdates}</span>
        </div>
      </div>
    </div>
  );
}