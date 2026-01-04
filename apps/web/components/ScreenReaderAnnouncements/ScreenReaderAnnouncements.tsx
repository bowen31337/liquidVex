'use client';

import React, { useEffect } from 'react';

/**
 * Screen reader announcement component
 * Provides live regions for dynamic content updates
 */
export default function ScreenReaderAnnouncements() {
  useEffect(() => {
    // Setup screen reader announcer
    let announcer = document.getElementById('screen-reader-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'screen-reader-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      announcer.style.clip = 'rect(1px, 1px, 1px, 1px)';
      announcer.style.whiteSpace = 'nowrap';
      document.body.appendChild(announcer);
    }

    // Setup assertive announcer for important messages
    let assertiveAnnouncer = document.getElementById('screen-reader-assertive');
    if (!assertiveAnnouncer) {
      assertiveAnnouncer = document.createElement('div');
      assertiveAnnouncer.id = 'screen-reader-assertive';
      assertiveAnnouncer.setAttribute('aria-live', 'assertive');
      assertiveAnnouncer.setAttribute('aria-atomic', 'true');
      assertiveAnnouncer.style.position = 'absolute';
      assertiveAnnouncer.style.left = '-10000px';
      assertiveAnnouncer.style.width = '1px';
      assertiveAnnouncer.style.height = '1px';
      assertiveAnnouncer.style.overflow = 'hidden';
      assertiveAnnouncer.style.clip = 'rect(1px, 1px, 1px, 1px)';
      assertiveAnnouncer.style.whiteSpace = 'nowrap';
      document.body.appendChild(assertiveAnnouncer);
    }

    // Listen for custom announcement events
    const handleAnnouncement = (event: CustomEvent) => {
      const { message, priority = 'polite' } = event.detail;
      const target = priority === 'assertive' ? assertiveAnnouncer : announcer;
      if (target) {
        target.textContent = '';
        // Use timeout to ensure screen readers pick up the change
        setTimeout(() => {
          target.textContent = message;
        }, 100);
      }
    };

    window.addEventListener('announce' as any, handleAnnouncement as EventListener);

    return () => {
      window.removeEventListener('announce' as any, handleAnnouncement as EventListener);
    };
  }, []);

  return null; // This component doesn't render anything visible
}

/**
 * Utility function to announce messages to screen readers
 * @param message The message to announce
 * @param priority The priority level (polite, assertive)
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  window.dispatchEvent(new CustomEvent('announce', {
    detail: { message, priority }
  }));
}

/**
 * Utility function to announce trading actions
 * @param action The trading action that occurred
 * @param details Additional details about the action
 */
export function announceTradingAction(action: string, details?: string) {
  const message = details ? `${action}. ${details}` : action;
  announce(message, 'assertive');
}

/**
 * Utility function to announce market data updates
 * @param updates Array of market data changes
 */
export function announceMarketUpdate(updates: string[]) {
  const message = `Market update: ${updates.join(', ')}`;
  announce(message, 'polite');
}

/**
 * Utility function to announce form validation errors
 * @param errors Array of validation error messages
 */
export function announceFormErrors(errors: string[]) {
  const message = `Form errors: ${errors.join(', ')}`;
  announce(message, 'assertive');
}

/**
 * Utility function to announce successful actions
 * @param action The successful action that occurred
 */
export function announceSuccess(action: string) {
  announce(`${action} completed successfully`, 'polite');
}

/**
 * Utility function to announce loading states
 * @param isLoading Whether loading is in progress
 * @param message The loading message
 */
export function announceLoading(isLoading: boolean, message: string) {
  const fullMessage = isLoading ? `Loading: ${message}` : `Finished loading: ${message}`;
  announce(fullMessage, 'polite');
}

/**
 * Utility function to announce navigation changes
 * @param page The page or section being navigated to
 */
export function announceNavigation(page: string) {
  announce(`Navigated to ${page}`, 'polite');
}

/**
 * Utility function to announce focus changes
 * @param element The element that received focus
 */
export function announceFocus(element: HTMLElement) {
  const label = element.getAttribute('aria-label') ||
                element.textContent ||
                element.tagName.toLowerCase();
  announce(`Focus moved to ${label}`, 'polite');
}

/**
 * Utility function to announce keyboard shortcuts
 * @param shortcut The keyboard shortcut that was pressed
 * @param action The action that was performed
 */
export function announceShortcut(shortcut: string, action: string) {
  announce(`Keyboard shortcut ${shortcut} activated: ${action}`, 'polite');
}

/**
 * Setup global event listeners for common accessibility events
 */
export function setupAccessibilityEvents() {
  // Announce focus changes
  document.addEventListener('focusin', (event) => {
    const target = event.target as HTMLElement;
    if (target && target.tagName !== 'BODY') {
      announceFocus(target);
    }
  });

  // Announce form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    if (form) {
      announce('Form submitted', 'polite');
    }
  });

  // Announce successful form submissions (when we know they succeeded)
  document.addEventListener('form-success', (event: any) => {
    announceSuccess(event.detail?.message || 'Form submitted successfully');
  });

  // Announce errors
  document.addEventListener('error', (event) => {
    if (event.target && (event.target as HTMLElement).tagName === 'IMG') {
      announce('Image failed to load', 'polite');
    }
  });

  // Announce market data updates
  document.addEventListener('market-update', (event: any) => {
    announceMarketUpdate(event.detail?.updates || []);
  });

  // Announce trading actions
  document.addEventListener('trading-action', (event: any) => {
    const { action, details } = event.detail;
    announceTradingAction(action, details);
  });
}