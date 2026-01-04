/**
 * Debounced state update utilities for performance optimization
 */

export function createDebouncedUpdater<T>(
  updateFn: (value: T) => void,
  delay: number = 16 // ~60fps
): (value: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (value: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      updateFn(value);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Batching utility for multiple state updates
 */
export class StateBatcher {
  private updates: Map<string, any> = new Map();
  private timeoutId: NodeJS.Timeout | null = null;
  private batchSize: number = 0;
  private flushDelay: number = 16; // ~60fps

  constructor(private onUpdate: (updates: Map<string, any>) => void) {}

  queueUpdate(key: string, value: any) {
    this.updates.set(key, value);
    this.batchSize++;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.flushDelay);
  }

  flush() {
    if (this.updates.size > 0) {
      this.onUpdate(new Map(this.updates));
      this.updates.clear();
      this.batchSize = 0;
    }
    this.timeoutId = null;
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.updates.clear();
    this.batchSize = 0;
  }
}