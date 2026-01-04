/**
 * Performance monitoring hook for measuring UI update times
 */

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  lastUpdate: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  updateCount: number;
}

export function usePerformanceMonitor(enabled: boolean = true) {
  const metricsRef = useRef<PerformanceMetrics>({
    lastUpdate: 0,
    averageLatency: 0,
    minLatency: Infinity,
    maxLatency: 0,
    updateCount: 0,
  });

  const measureUpdate = useCallback((label: string) => {
    if (!enabled) return;

    const now = performance.now();
    const metrics = metricsRef.current;

    if (metrics.lastUpdate > 0) {
      const latency = now - metrics.lastUpdate;

      // Update metrics
      metrics.updateCount++;
      metrics.averageLatency = ((metrics.averageLatency * (metrics.updateCount - 1)) + latency) / metrics.updateCount;
      metrics.minLatency = Math.min(metrics.minLatency, latency);
      metrics.maxLatency = Math.max(metrics.maxLatency, latency);

      // Log performance warnings
      if (latency > 100) {
        console.warn(`Performance warning: ${label} update took ${latency.toFixed(2)}ms (target: <100ms)`);
      }
    }

    metrics.lastUpdate = now;
  }, [enabled]);

  const resetMetrics = useCallback(() => {
    if (!enabled) return;

    metricsRef.current = {
      lastUpdate: 0,
      averageLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      updateCount: 0,
    };
  }, [enabled]);

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Log metrics periodically in development
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      const metrics = getMetrics();
      if (metrics.updateCount > 0) {
        console.log('Performance Metrics:', {
          updateCount: metrics.updateCount,
          avgLatency: `${metrics.averageLatency.toFixed(2)}ms`,
          minLatency: `${metrics.minLatency.toFixed(2)}ms`,
          maxLatency: `${metrics.maxLatency.toFixed(2)}ms`,
          targetMet: metrics.maxLatency < 100 ? '✅' : '❌',
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled, getMetrics]);

  return {
    measureUpdate,
    resetMetrics,
    getMetrics,
  };
}