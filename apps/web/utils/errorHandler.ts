/**
 * Error handling utilities for the trading application
 */

export interface AppError {
  type: 'network' | 'validation' | 'authentication' | 'websocket' | 'timeout' | 'unknown';
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private maxErrors = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  reportError(error: AppError): void {
    // Add to queue
    this.errorQueue.push(error);

    // Keep only last N errors
    if (this.errorQueue.length > this.maxErrors) {
      this.errorQueue.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', error);
    }

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorReporting(error);
    }

    // Show user-friendly error message
    this.showUserMessage(error);
  }

  private sendToErrorReporting(error: AppError): void {
    // In a real application, this would send to services like:
    // - Sentry
    // - LogRocket
    // - Custom error reporting service
    try {
      // Example: Send to console.error for now
      console.error('Production error report:', error);
    } catch (e) {
      // Fallback if error reporting fails
      console.error('Failed to report error:', e);
    }
  }

  private showUserMessage(error: AppError): void {
    // Show toast notification or modal
    // This would integrate with your toast/notification system
    const message = this.getUserFriendlyMessage(error);
    console.warn('User message:', message);

    // In a real app, you'd dispatch a toast notification here
    // Example: toast.error(message);
  }

  private getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case 'network':
        return 'Network error. Please check your connection and try again.';
      case 'validation':
        return 'Invalid input. Please check your values and try again.';
      case 'authentication':
        return 'Authentication failed. Please reconnect your wallet.';
      case 'websocket':
        return 'Connection to market data lost. Reconnecting...';
      case 'timeout':
        return 'Request timed out. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  getErrors(): AppError[] {
    return [...this.errorQueue];
  }

  clearErrors(): void {
    this.errorQueue = [];
  }

  getErrorCount(): number {
    return this.errorQueue.length;
  }
}

// Convenience functions
export const errorHandler = ErrorHandler.getInstance();

export const reportNetworkError = (message: string, details?: any): void => {
  errorHandler.reportError({
    type: 'network',
    message,
    details,
    timestamp: Date.now(),
  });
};

export const reportValidationError = (message: string, details?: any): void => {
  errorHandler.reportError({
    type: 'validation',
    message,
    details,
    timestamp: Date.now(),
  });
};

export const reportAuthError = (message: string, details?: any): void => {
  errorHandler.reportError({
    type: 'authentication',
    message,
    details,
    timestamp: Date.now(),
  });
};

export const reportWebSocketError = (message: string, details?: any): void => {
  errorHandler.reportError({
    type: 'websocket',
    message,
    details,
    timestamp: Date.now(),
  });
};

export const reportTimeoutError = (message: string, details?: any): void => {
  errorHandler.reportError({
    type: 'timeout',
    message,
    details,
    timestamp: Date.now(),
  });
};

// Error boundary hook for React components
export const useErrorHandler = () => {
  return {
    reportError: (error: AppError) => errorHandler.reportError(error),
    getErrors: () => errorHandler.getErrors(),
    clearErrors: () => errorHandler.clearErrors(),
    getErrorCount: () => errorHandler.getErrorCount(),
  };
};

// Export the reportError function for direct use
export const reportError = errorHandler.reportError.bind(errorHandler);