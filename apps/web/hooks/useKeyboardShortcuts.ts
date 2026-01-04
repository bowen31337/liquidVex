/**
 * Keyboard shortcuts hook for trading interface
 */
import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
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
    // Get the active element
    const activeElement = document.activeElement;

    // Don't override form inputs unless explicitly allowed
    const isFormInput = activeElement instanceof HTMLInputElement ||
                      activeElement instanceof HTMLTextAreaElement ||
                      activeElement instanceof HTMLSelectElement;

    // Special case: Allow Enter key even in inputs for order submission
    const isEnterKey = event.key === 'Enter';

    // Only process shortcuts if not in a form input, or if it's Enter key
    if (isFormInput && !isEnterKey) {
      return;
    }

    for (const shortcut of shortcuts) {
      const { key, modifiers = {} } = shortcut;

      // Check modifiers - only check if modifier is specified
      const hasCtrl = modifiers.ctrl === undefined || modifiers.ctrl === event.ctrlKey;
      const hasAlt = modifiers.alt === undefined || modifiers.alt === event.altKey;
      const hasShift = modifiers.shift === undefined || modifiers.shift === event.shiftKey;
      const hasMeta = modifiers.meta === undefined || modifiers.meta === event.metaKey;

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