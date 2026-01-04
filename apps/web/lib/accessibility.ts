/**
 * Accessibility utilities for liquidVex trading interface
 */

/**
 * Check if a color combination meets WCAG AA contrast requirements
 * @param color1 First color (foreground)
 * @param color2 Second color (background)
 * @param isLargeText Whether the text is large (18pt+ or 14pt+ bold)
 * @returns boolean indicating if contrast meets requirements
 */
export function checkContrast(color1: string, color2: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  const requiredRatio = isLargeText ? 3.0 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Calculate the contrast ratio between two colors
 * @param color1 First color
 * @param color2 Second color
 * @returns Contrast ratio as a number
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Get the relative luminance of a color
 * @param color Color in hex format (#RRGGBB)
 * @returns Luminance value between 0 and 1
 */
export function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;

  const rCorrected = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const gCorrected = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const bCorrected = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

  return 0.2126 * rCorrected + 0.7152 * gCorrected + 0.0722 * bCorrected;
}

/**
 * Convert hex color to RGB object
 * @param hex Hex color string (#RRGGBB)
 * @returns RGB object or null if invalid
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Check if color is accessible for text
 * @param textHex Text color
 * @param bgHex Background color
 * @returns Object with accessibility information
 */
export function checkTextColorAccessibility(textHex: string, bgHex: string) {
  const normalContrast = getContrastRatio(textHex, bgHex);
  const largeContrast = normalContrast; // Same calculation, different requirements

  return {
    normal: {
      ratio: normalContrast,
      meetsAA: normalContrast >= 4.5,
      meetsAAA: normalContrast >= 7.0,
      status: normalContrast >= 4.5 ? 'AA' : (normalContrast >= 3.0 ? 'Fail-AA' : 'Fail')
    },
    large: {
      ratio: largeContrast,
      meetsAA: largeContrast >= 3.0,
      meetsAAA: largeContrast >= 4.5,
      status: largeContrast >= 3.0 ? 'AA' : 'Fail'
    }
  };
}

/**
 * Get accessible text color for a given background
 * @param bgHex Background color
 * @returns '#ffffff' or '#000000' depending on which provides better contrast
 */
export function getAccessibleTextColor(bgHex: string): string {
  const whiteContrast = getContrastRatio('#ffffff', bgHex);
  const blackContrast = getContrastRatio('#000000', bgHex);

  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Check if element is focusable
 * @param element DOM element
 * @returns boolean indicating if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (!element || element.tabIndex < 0) return false;

  const style = window.getComputedStyle(element);
  const hidden = style.display === 'none' || style.visibility === 'hidden';

  if (hidden) return false;

  const tabIndex = element.getAttribute('tabindex');
  const isTabbable = tabIndex === null || parseInt(tabIndex, 10) >= 0;

  const focusableTags = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A', 'AREA'];
  const isFocusableTag = focusableTags.includes(element.tagName);

  return isTabbable || isFocusableTag;
}

/**
 * Focus the next focusable element
 * @param currentElement Current focused element
 * @param container Container to search within (optional)
 * @returns The next focusable element or null
 */
export function focusNextElement(currentElement: HTMLElement, container?: HTMLElement): HTMLElement | null {
  const focusableSelector = 'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])';
  const elements = Array.from((container || document.body).querySelectorAll(focusableSelector)) as HTMLElement[];
  const currentIndex = elements.indexOf(currentElement);

  if (currentIndex >= 0 && currentIndex < elements.length - 1) {
    const nextElement = elements[currentIndex + 1];
    nextElement.focus();
    return nextElement;
  }

  return null;
}

/**
 * Focus the previous focusable element
 * @param currentElement Current focused element
 * @param container Container to search within (optional)
 * @returns The previous focusable element or null
 */
export function focusPreviousElement(currentElement: HTMLElement, container?: HTMLElement): HTMLElement | null {
  const focusableSelector = 'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])';
  const elements = Array.from((container || document.body).querySelectorAll(focusableSelector)) as HTMLElement[];
  const currentIndex = elements.indexOf(currentElement);

  if (currentIndex > 0) {
    const prevElement = elements[currentIndex - 1];
    prevElement.focus();
    return prevElement;
  }

  return null;
}

/**
 * Announce message to screen readers
 * @param message Message to announce
 * @param priority Priority level (polite, assertive)
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcer = document.getElementById('screen-reader-announcer');
  if (announcer) {
    announcer.textContent = message;
  } else {
    const element = document.createElement('div');
    element.id = 'screen-reader-announcer';
    element.setAttribute('aria-live', priority);
    element.setAttribute('aria-atomic', 'true');
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';
    element.textContent = message;
    document.body.appendChild(element);
  }
}

/**
 * Trap focus within an element (useful for modals)
 * @param element Element to trap focus within
 * @returns Cleanup function
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    } else if (e.key === 'Escape') {
      // Handle escape key if needed
      element.dispatchEvent(new CustomEvent('escape'));
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check if user prefers reduced motion
 * @returns boolean indicating if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 * @returns boolean indicating if high contrast is preferred
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Add aria-live region to the page for dynamic announcements
 */
export function setupScreenReaderAnnouncer() {
  if (typeof document === 'undefined') return;

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
    document.body.appendChild(announcer);
  }
}

/**
 * Validate form accessibility
 * @param formElement HTML form element
 * @returns Array of accessibility issues
 */
export function validateFormAccessibility(formElement: HTMLFormElement): string[] {
  const issues: string[] = [];
  const inputs = formElement.querySelectorAll('input, select, textarea') as NodeListOf<HTMLInputElement>;

  inputs.forEach((input, index) => {
    const label = document.querySelector(`label[for="${input.id}"]`) ||
                 input.closest('label') ||
                 input.previousElementSibling?.tagName === 'LABEL' ? input.previousElementSibling : null;

    if (!label) {
      issues.push(`Input ${index + 1} is missing a label`);
    }

    if (input.required && !input.getAttribute('aria-required')) {
      issues.push(`Input ${index + 1} is required but missing aria-required="true"`);
    }

    if (input.type === 'password' && !input.getAttribute('aria-describedby')) {
      issues.push(`Password input ${index + 1} should have aria-describedby for help text`);
    }
  });

  return issues;
}

// Predefined color pairs for liquidVex
export const liquidVexColors = {
  background: '#0a0a0a',
  surface: '#171717',
  surfaceElevated: '#1f1f1f',
  textPrimary: '#ffffff',
  textSecondary: '#d1d1d1',
  textTertiary: '#a1a1a1',
  long: '#34d399',
  short: '#ef4444',
  accent: '#60a5fa',
  border: '#4a4a4a'
};

/**
 * Check if liquidVex color palette meets accessibility standards
 * @returns Object with accessibility validation results
 */
export function validateLiquidVexColors() {
  const results = {
    textOnBackground: checkTextColorAccessibility(liquidVexColors.textPrimary, liquidVexColors.background),
    secondaryOnBackground: checkTextColorAccessibility(liquidVexColors.textSecondary, liquidVexColors.background),
    tertiaryOnBackground: checkTextColorAccessibility(liquidVexColors.textTertiary, liquidVexColors.background),
    borderOnSurface: checkTextColorAccessibility(liquidVexColors.border, liquidVexColors.surface),
    longOnWhite: checkTextColorAccessibility(liquidVexColors.long, '#ffffff'),
    shortOnWhite: checkTextColorAccessibility(liquidVexColors.short, '#ffffff')
  };

  return results;
}