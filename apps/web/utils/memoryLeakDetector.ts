/**
 * Memory leak detection utilities for WebSocket connections and other resources
 */

// This file provides memory leak detection utilities for WebSocket connections and other resources
// It does not depend on the React hook useMemoryMonitor

interface ResourceTracker {
  id: string;
  type: 'websocket' | 'interval' | 'timeout' | 'listener' | 'observer';
  creationTime: number;
  cleanupFunction?: () => void;
  isActive: boolean;
}

class MemoryLeakDetector {
  private trackedResources: Map<string, ResourceTracker> = new Map();
  private cleanupCallbacks: Set<() => void> = new Set();
  private isMonitoring = false;

  /**
   * Start monitoring for memory leaks
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Check for leaks every 30 seconds
    setInterval(() => {
      this.checkForLeaks();
    }, 30000);
  }

  /**
   * Track a WebSocket connection
   */
  trackWebSocket(id: string, ws: WebSocket) {
    const tracker: ResourceTracker = {
      id,
      type: 'websocket',
      creationTime: Date.now(),
      isActive: true,
      cleanupFunction: () => {
        try {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        } catch (error) {
          console.warn('Error closing WebSocket:', error);
        }
      }
    };

    this.trackedResources.set(id, tracker);

    // Track cleanup on close
    const originalClose = ws.close.bind(ws);
    ws.close = () => {
      tracker.isActive = false;
      this.trackedResources.delete(id);
      return originalClose();
    };

    return tracker;
  }

  /**
   * Track a setInterval
   */
  trackInterval(id: string, intervalId: NodeJS.Timeout) {
    const tracker: ResourceTracker = {
      id,
      type: 'interval',
      creationTime: Date.now(),
      isActive: true,
      cleanupFunction: () => {
        clearInterval(intervalId);
      }
    };

    this.trackedResources.set(id, tracker);

    // Return cleanup function
    return () => {
      tracker.isActive = false;
      this.trackedResources.delete(id);
      clearInterval(intervalId);
    };
  }

  /**
   * Track a setTimeout
   */
  trackTimeout(id: string, timeoutId: NodeJS.Timeout) {
    const tracker: ResourceTracker = {
      id,
      type: 'timeout',
      creationTime: Date.now(),
      isActive: true,
      cleanupFunction: () => {
        clearTimeout(timeoutId);
      }
    };

    this.trackedResources.set(id, tracker);

    // Return cleanup function
    return () => {
      tracker.isActive = false;
      this.trackedResources.delete(id);
      clearTimeout(timeoutId);
    };
  }

  /**
   * Track an event listener
   */
  trackEventListener(id: string, target: EventTarget, event: string, listener: EventListener) {
    const tracker: ResourceTracker = {
      id,
      type: 'listener',
      creationTime: Date.now(),
      isActive: true,
      cleanupFunction: () => {
        target.removeEventListener(event, listener);
      }
    };

    this.trackedResources.set(id, tracker);

    return () => {
      tracker.isActive = false;
      this.trackedResources.delete(id);
      target.removeEventListener(event, listener);
    };
  }

  /**
   * Track a MutationObserver
   */
  trackObserver(id: string, observer: MutationObserver) {
    const tracker: ResourceTracker = {
      id,
      type: 'observer',
      creationTime: Date.now(),
      isActive: true,
      cleanupFunction: () => {
        observer.disconnect();
      }
    };

    this.trackedResources.set(id, tracker);

    return () => {
      tracker.isActive = false;
      this.trackedResources.delete(id);
      observer.disconnect();
    };
  }

  /**
   * Add a cleanup callback
   */
  addCleanupCallback(callback: () => void) {
    this.cleanupCallbacks.add(callback);
    return () => this.cleanupCallbacks.delete(callback);
  }

  /**
   * Check for potential memory leaks
   */
  checkForLeaks() {
    const now = Date.now();
    const leaks: string[] = [];

    // Check for old resources
    this.trackedResources.forEach((tracker, id) => {
      const age = now - tracker.creationTime;

      // WebSocket older than 10 minutes
      if (tracker.type === 'websocket' && age > 10 * 60 * 1000) {
        leaks.push(`WebSocket ${id} has been open for ${Math.floor(age / 60000)} minutes`);
      }

      // Interval older than 5 minutes
      if (tracker.type === 'interval' && age > 5 * 60 * 1000) {
        leaks.push(`Interval ${id} has been running for ${Math.floor(age / 60000)} minutes`);
      }

      // Timeout older than 1 hour (should have fired by now)
      if (tracker.type === 'timeout' && age > 60 * 60 * 1000) {
        leaks.push(`Timeout ${id} has not fired after ${Math.floor(age / 3600000)} hours`);
      }

      // Event listener older than 30 minutes
      if (tracker.type === 'listener' && age > 30 * 60 * 1000) {
        leaks.push(`Event listener ${id} has been attached for ${Math.floor(age / 60000)} minutes`);
      }

      // Observer older than 30 minutes
      if (tracker.type === 'observer' && age > 30 * 60 * 1000) {
        leaks.push(`Observer ${id} has been observing for ${Math.floor(age / 60000)} minutes`);
      }
    });

    // Check for cleanup callbacks that might not be called
    if (this.cleanupCallbacks.size > 50) {
      leaks.push(`Large number of cleanup callbacks (${this.cleanupCallbacks.size}) - potential leak`);
    }

    // Report leaks
    if (leaks.length > 0) {
      console.warn('Potential memory leaks detected:', leaks);
      this.reportLeaks(leaks);
    }
  }

  /**
   * Report leaks to console and potentially to monitoring service
   */
  private reportLeaks(leaks: string[]) {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group('Memory Leak Detection Report');
      leaks.forEach(leak => console.warn('⚠️', leak));
      console.groupEnd();
    }

    // In production, could send to monitoring service
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Send to monitoring service
      try {
        fetch('/api/monitoring/memory-leaks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: Date.now(),
            leaks,
            resourceCount: this.trackedResources.size,
            cleanupCallbackCount: this.cleanupCallbacks.size
          })
        });
      } catch (error) {
        console.error('Failed to report memory leaks:', error);
      }
    }
  }

  /**
   * Get current resource count
   */
  getResourceCount(): number {
    return this.trackedResources.size;
  }

  /**
   * Get detailed resource information
   */
  getResourceInfo() {
    return Array.from(this.trackedResources.values()).map(tracker => ({
      id: tracker.id,
      type: tracker.type,
      age: Date.now() - tracker.creationTime,
      isActive: tracker.isActive
    }));
  }

  /**
   * Force cleanup of all tracked resources
   */
  cleanupAll() {
    // Clean up all tracked resources
    this.trackedResources.forEach(tracker => {
      if (tracker.cleanupFunction) {
        try {
          tracker.cleanupFunction();
        } catch (error) {
          console.warn('Error during resource cleanup:', error);
        }
      }
    });

    // Clear all tracked resources
    this.trackedResources.clear();

    // Call all cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Error during cleanup callback:', error);
      }
    });

    this.cleanupCallbacks.clear();
  }
}

// Global instance
export const memoryLeakDetector = new MemoryLeakDetector();

// Auto-start monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  memoryLeakDetector.startMonitoring();
}

// Export types for TypeScript
export type { ResourceTracker };