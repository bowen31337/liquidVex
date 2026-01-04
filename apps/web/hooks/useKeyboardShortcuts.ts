/**
 * Keyboard shortcuts hook for trading interface
 */
import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  description: string;
  callback: (event: KeyboardEvent) => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const { key, modifiers = {} } = shortcut;

      // Check modifiers
      const hasCtrl = modifiers.ctrl ? event.ctrlKey : !event.ctrlKey;
      const hasAlt = modifiers.alt ? event.altKey : !event.altKey;
      const hasShift = modifiers.shift ? event.shiftKey : !event.shiftKey;
      const hasMeta = modifiers.meta ? event.metaKey : !event.metaKey;

      if (hasCtrl && hasAlt && hasShift && hasMeta && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        shortcut.callback(event);
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Return shortcuts for tooltip display
  return { shortcuts };
}