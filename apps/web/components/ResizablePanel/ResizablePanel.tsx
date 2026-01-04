/**
 * ResizablePanel component for drag-to-resize panel functionality
 * Supports persistence via localStorage
 */

'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { layoutPreferences } from '@/lib/storage';

interface ResizablePanelProps {
  children: ReactNode;
  direction: 'horizontal' | 'vertical';
  initialSize: number; // percentage
  minSize: number; // percentage
  maxSize: number; // percentage
  storageKey: string;
  className?: string;
}

export function ResizablePanel({
  children,
  direction,
  initialSize,
  minSize,
  maxSize,
  storageKey,
  className = '',
}: ResizablePanelProps) {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved size on mount
  useEffect(() => {
    const saved = layoutPreferences.get();
    if (saved && saved.panelSizes && saved.panelSizes[storageKey as keyof typeof saved.panelSizes]) {
      const savedSize = saved.panelSizes[storageKey as keyof typeof saved.panelSizes];
      if (typeof savedSize === 'number' && savedSize >= minSize && savedSize <= maxSize) {
        setSize(savedSize);
      }
    }
  }, [storageKey, minSize, maxSize]);

  // Save size when it changes
  useEffect(() => {
    if (size !== initialSize) {
      const current = layoutPreferences.get();
      const panelSizes = current?.panelSizes || { chart: 60, orderBook: 20, orderEntry: 20 };

      // Update the specific panel size
      const newSizes = {
        ...panelSizes,
        [storageKey]: size,
      };

      layoutPreferences.save({
        panelSizes: newSizes,
        activeTab: current?.activeTab || 'Positions',
        tradeHistoryFilters: current?.tradeHistoryFilters || { asset: '', timeRange: '', orderType: '' },
      });
    }
  }, [size, storageKey, initialSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      if (direction === 'horizontal') {
        const newPercentage = ((e.clientX - rect.left) / rect.width) * 100;
        const clamped = Math.max(minSize, Math.min(maxSize, newPercentage));
        setSize(clamped);
      } else {
        const newPercentage = ((e.clientY - rect.top) / rect.height) * 100;
        const clamped = Math.max(minSize, Math.min(maxSize, newPercentage));
        setSize(clamped);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minSize, maxSize]);

  return (
    <div
      ref={containerRef}
      className={`${className} ${isDragging ? 'select-none' : ''}`}
      style={{
        [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
        flexShrink: 0,
      }}
    >
      {children}
      {/* Resize Handle */}
      <div
        className={`
          absolute
          ${direction === 'horizontal' ? 'right-0 top-0 w-1 h-full cursor-col-resize hover:bg-accent/50' : 'bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-accent/50'}
          z-20
          transition-colors
          ${isDragging ? 'bg-accent' : ''}
        `}
        onMouseDown={handleMouseDown}
        data-testid={`resize-handle-${storageKey}`}
        data-direction={direction}
      />
    </div>
  );
}
