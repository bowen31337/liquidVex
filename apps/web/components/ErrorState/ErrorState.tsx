/**
 * Error State Component
 *
 * Displays an error state with icon, message, and retry button
 * Used when data loads fail due to API or network issues
 */

'use client';

import { ReactNode } from 'react';

interface ErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Optional detailed error description */
  details?: string;
  /** Retry button click handler */
  onRetry?: () => void;
  /** Additional CSS classes for styling */
  className?: string;
  /** Custom icon element (default is error icon) */
  icon?: ReactNode;
  /** Hide retry button */
  hideRetry?: boolean;
  /** Test ID for E2E testing */
  testId?: string;
}

export function ErrorState({
  message = 'Failed to load data',
  details,
  onRetry,
  className = '',
  icon,
  hideRetry = false,
  testId = 'error-state',
}: ErrorStateProps) {
  const defaultIcon = (
    <svg
      className="w-8 h-8 text-loss"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <div
      className={`flex flex-col items-center justify-center py-8 px-4 text-center ${className}`}
      data-testid={testId}
      role="alert"
      aria-live="polite"
    >
      {/* Error Icon */}
      <div className="mb-3" aria-hidden="true">
        {icon || defaultIcon}
      </div>

      {/* Error Message */}
      <div className="text-sm font-medium text-text-primary mb-1">
        {message}
      </div>

      {/* Error Details */}
      {details && (
        <div className="text-xs text-text-secondary mb-4 max-w-md">
          {details}
        </div>
      )}

      {/* Retry Button */}
      {!hideRetry && onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 text-xs font-medium rounded bg-accent text-white hover:bg-accent/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
          data-testid={`${testId}-retry`}
          aria-label="Retry loading data"
        >
          Retry
        </button>
      )}
    </div>
  );
}
