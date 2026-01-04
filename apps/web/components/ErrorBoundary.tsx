/**
 * ErrorBoundary - React error boundary for graceful error handling
 */

'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-surface-elevated rounded-lg border border-short m-4">
          <div className="text-2xl mb-2">⚠️</div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Something went wrong</h2>
          <p className="text-sm text-text-secondary mb-4">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent text-white rounded hover:opacity-90 transition"
          >
            Refresh Page
          </button>
          {this.state.error && (
            <details className="mt-4 text-xs text-text-tertiary bg-surface p-2 rounded">
              <summary className="cursor-pointer">Technical Details</summary>
              <pre className="mt-2 overflow-x-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * SectionErrorBoundary - Wraps a section with error handling
 */
export function SectionErrorBoundary({
  children,
  sectionName,
  className = ''
}: {
  children: ReactNode;
  sectionName?: string;
  className?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className={`bg-surface-elevated border border-short rounded p-4 ${className}`}>
          <div className="text-sm text-text-secondary">
            {sectionName ? `${sectionName} failed to load` : 'Component failed to load'}
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * withErrorBoundary - HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  sectionName?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <SectionErrorBoundary sectionName={sectionName}>
        <Component {...props} />
      </SectionErrorBoundary>
    );
  };
}
