'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  modifiers: ('Ctrl' | 'Shift' | 'Alt')[];
  description: string;
  action: () => void;
  category: 'navigation' | 'trading' | 'general';
}

/**
 * Keyboard shortcuts handler and display component
 */
export default function KeyboardShortcuts() {
  const [isVisible, setIsVisible] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'k',
      modifiers: ['Ctrl'],
      description: 'Focus asset selector',
      action: () => focusElement('asset-selector'),
      category: 'navigation'
    },
    {
      key: 'Enter',
      modifiers: [],
      description: 'Open/close order form',
      action: () => toggleOrderForm(),
      category: 'navigation'
    },
    {
      key: 'Escape',
      modifiers: [],
      description: 'Close modal/focus away',
      action: () => closeActiveModal(),
      category: 'navigation'
    },

    // Trading shortcuts
    {
      key: 'b',
      modifiers: [],
      description: 'Focus Buy order form',
      action: () => focusOrderType('buy'),
      category: 'trading'
    },
    {
      key: 's',
      modifiers: [],
      description: 'Focus Sell order form',
      action: () => focusOrderType('sell'),
      category: 'trading'
    },
    {
      key: 'Enter',
      modifiers: ['Ctrl'],
      description: 'Submit order',
      action: () => submitOrder(),
      category: 'trading'
    },
    {
      key: 'c',
      modifiers: ['Ctrl'],
      description: 'Cancel all orders',
      action: () => cancelAllOrders(),
      category: 'trading'
    },

    // General shortcuts
    {
      key: '/',
      modifiers: [],
      description: 'Show shortcuts help',
      action: () => setIsVisible(!isVisible),
      category: 'general'
    },
    {
      key: 'r',
      modifiers: [],
      description: 'Refresh market data',
      action: () => refreshMarketData(),
      category: 'general'
    }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, shiftKey, altKey } = event;

    // Show/hide shortcuts help
    if (key === '/' && !ctrlKey && !shiftKey && !altKey) {
      event.preventDefault();
      setIsVisible(prev => !prev);
      return;
    }

    // Build pressed keys array for visual feedback
    const currentKeys: string[] = [];
    if (ctrlKey) currentKeys.push('Ctrl');
    if (shiftKey) currentKeys.push('Shift');
    if (altKey) currentKeys.push('Alt');
    if (key !== 'Control' && key !== 'Shift' && key !== 'Alt') {
      currentKeys.push(key);
    }
    setPressedKeys(currentKeys);

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const hasCorrectKey = shortcut.key.toLowerCase() === key.toLowerCase();
      const hasCorrectModifiers = (
        shortcut.modifiers.includes('Ctrl') === ctrlKey &&
        shortcut.modifiers.includes('Shift') === shiftKey &&
        shortcut.modifiers.includes('Alt') === altKey
      );

      return hasCorrectKey && hasCorrectModifiers;
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
      announceAction(matchingShortcut.description);
    }
  }, [shortcuts]);

  const handleKeyUp = useCallback(() => {
    setPressedKeys([]);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <>
      {/* Visual key press indicator */}
      {pressedKeys.length > 0 && (
        <div className="fixed top-4 right-4 bg-surface-elevated border border-border rounded-lg p-3 shadow-lg z-50">
          <div className="text-xs text-text-tertiary mb-1">Pressed:</div>
          <div className="flex gap-1">
            {pressedKeys.map((key, index) => (
              <kbd
                key={index}
                className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-text-primary"
              >
                {key}
              </kbd>
            ))}
          </div>
        </div>
      )}

      {/* Shortcuts help modal */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsVisible(false)}
          role="dialog"
          aria-labelledby="shortcuts-title"
        >
          <div
            className="panel p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="shortcuts-title" className="text-xl font-bold mb-4 text-text-primary">Keyboard Shortcuts</h2>

            <div className="space-y-6">
              {['general', 'navigation', 'trading'].map(category => {
                const categoryShortcuts = shortcuts.filter(s => s.category === category);
                if (categoryShortcuts.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3 text-text-secondary capitalize">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="bg-surface-elevated border border-border rounded-lg p-3 hover:bg-surface-hover transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-text-secondary text-sm">{shortcut.description}</span>
                            <div className="flex gap-1">
                              {shortcut.modifiers.map(mod => (
                                <kbd
                                  key={mod}
                                  className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-text-primary"
                                >
                                  {mod}
                                </kbd>
                              ))}
                              <kbd
                                className="bg-surface border border-border px-2 py-1 rounded text-xs font-mono text-text-primary"
                              >
                                {shortcut.key}
                              </kbd>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-3 bg-surface-elevated border border-border rounded">
              <h4 className="text-sm font-semibold mb-2 text-text-secondary">Tips:</h4>
              <ul className="text-xs text-text-tertiary space-y-1">
                <li>• Use Ctrl+K to quickly focus the asset selector</li>
                <li>• Use B/S keys to quickly switch between Buy/Sell</li>
                <li>• Use Ctrl+Enter to submit orders</li>
                <li>• Press / to show this help at any time</li>
                <li>• All shortcuts work regardless of input focus</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper functions for shortcut actions
function focusElement(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function toggleOrderForm() {
  const buyButton = document.querySelector('button[data-order-type="buy"]') as HTMLElement;
  const sellButton = document.querySelector('button[data-order-type="sell"]') as HTMLElement;

  if (document.activeElement === buyButton || document.activeElement === sellButton) {
    // Close form
    const orderForm = document.querySelector('[data-order-form]') as HTMLElement;
    if (orderForm) orderForm.style.display = 'none';
  } else {
    // Open buy form
    if (buyButton) buyButton.focus();
  }
}

function closeActiveModal() {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement?.closest('[role="dialog"]')) {
    // Close modal
    const closeButton = activeElement.closest('.modal')?.querySelector('[data-close]') as HTMLElement;
    if (closeButton) closeButton.click();
  } else {
    // Just blur current element
    activeElement?.blur();
  }
}

function focusOrderType(type: 'buy' | 'sell') {
  const button = document.querySelector(`button[data-order-type="${type}"]`) as HTMLElement;
  if (button) {
    button.focus();
    announceAction(`Focused ${type} order form`);
  }
}

function submitOrder() {
  const submitButton = document.querySelector('button[type="submit"]') as HTMLElement;
  if (submitButton) {
    submitButton.click();
    announceAction('Order submitted');
  }
}

function cancelAllOrders() {
  const cancelButton = document.querySelector('button[data-action="cancel-all"]') as HTMLElement;
  if (cancelButton) {
    cancelButton.click();
    announceAction('Cancelling all orders');
  }
}

function refreshMarketData() {
  // Trigger market data refresh
  window.dispatchEvent(new CustomEvent('refresh-market-data'));
  announceAction('Refreshing market data');
}

function announceAction(message: string) {
  // Create screen reader announcement
  const announcer = document.getElementById('screen-reader-announcer');
  if (announcer) {
    announcer.textContent = message;
  }
}