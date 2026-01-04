'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setupAccessibilityEvents, announce } from '../components/ScreenReaderAnnouncements/ScreenReaderAnnouncements';

interface AccessibilityContextType {
  isHighContrast: boolean;
  isReducedMotion: boolean;
  isScreenReaderActive: boolean;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  checkColorContrast: (color1: string, color2: string) => boolean;
  setupFocusManagement: () => void;
  cleanupFocusManagement: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  // Check system preferences on mount
  useEffect(() => {
    // Check high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(highContrastQuery.matches);

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
      document.documentElement.style.setProperty('--accessibility-high-contrast', e.matches ? '1' : '0');
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);

    // Check reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(reducedMotionQuery.matches);

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
      document.documentElement.style.setProperty('--accessibility-reduced-motion', e.matches ? '1' : '0');
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    // Setup global accessibility events
    setupAccessibilityEvents();

    // Check if screen reader is active
    checkScreenReader();

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => {
      const newValue = !prev;
      document.documentElement.style.setProperty('--accessibility-high-contrast', newValue ? '1' : '0');
      return newValue;
    });
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setIsReducedMotion(prev => {
      const newValue = !prev;
      document.documentElement.style.setProperty('--accessibility-reduced-motion', newValue ? '1' : '0');
      return newValue;
    });
  }, []);

  const checkScreenReader = useCallback(() => {
    // Simple heuristic to detect screen reader
    const div = document.createElement('div');
    div.setAttribute('aria-live', 'polite');
    div.style.position = 'absolute';
    div.style.left = '-10000px';
    document.body.appendChild(div);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          setIsScreenReaderActive(true);
          observer.disconnect();
        }
      });
    });

    observer.observe(div, { childList: true });

    // Test screen reader detection
    setTimeout(() => {
      div.textContent = 'Screen reader test';
      setTimeout(() => {
        observer.disconnect();
        document.body.removeChild(div);
      }, 100);
    }, 100);
  }, []);

  const checkColorContrast = useCallback((color1: string, color2: string): boolean => {
    // Simple contrast check - in a real implementation, you'd use the accessibility.ts functions
    const getLuminance = (color: string): number => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const rs = r / 255;
      const gs = g / 255;
      const bs = b / 255;
      const rCorrected = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
      const gCorrected = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
      const bCorrected = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
      return 0.2126 * rCorrected + 0.7152 * gCorrected + 0.0722 * bCorrected;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);

    return ratio >= 4.5; // WCAG AA standard
  }, []);

  const setupFocusManagement = useCallback(() => {
    // Add focus management for modals and overlays
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;

        const visibleElements = Array.from(focusableElements).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });

        if (visibleElements.length > 0) {
          const firstElement = visibleElements[0];
          const lastElement = visibleElements[visibleElements.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    });
  }, []);

  const cleanupFocusManagement = useCallback(() => {
    // Cleanup focus management
  }, []);

  const value: AccessibilityContextType = {
    isHighContrast,
    isReducedMotion,
    isScreenReaderActive,
    toggleHighContrast,
    toggleReducedMotion,
    announce,
    checkColorContrast,
    setupFocusManagement,
    cleanupFocusManagement
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

/**
 * Hook for managing focus within a component
 */
export function useFocusManagement() {
  const focusNextElement = useCallback((currentElement: HTMLElement) => {
    const focusableElements = document.querySelectorAll(
      'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const elements = Array.from(focusableElements).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    const currentIndex = elements.indexOf(currentElement);
    if (currentIndex >= 0 && currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
      return elements[currentIndex + 1];
    }
    return null;
  }, []);

  const focusPreviousElement = useCallback((currentElement: HTMLElement) => {
    const focusableElements = document.querySelectorAll(
      'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const elements = Array.from(focusableElements).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    const currentIndex = elements.indexOf(currentElement);
    if (currentIndex > 0) {
      elements[currentIndex - 1].focus();
      return elements[currentIndex - 1];
    }
    return null;
  }, []);

  return { focusNextElement, focusPreviousElement };
}

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnouncements() {
  const { announce } = useAccessibility();

  const announceSuccess = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  const announceError = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  const announceLoading = useCallback((isLoading: boolean, message: string) => {
    const fullMessage = isLoading ? `Loading: ${message}` : `Finished loading: ${message}`;
    announce(fullMessage, 'polite');
  }, [announce]);

  return { announceSuccess, announceError, announceLoading };
}