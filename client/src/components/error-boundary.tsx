

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      // Here you would typically send the error to a service like Sentry
      console.error("Production error:", { error, errorInfo });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Export as default and named exports
export default ErrorBoundary;
export { ErrorBoundary };

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
        </div>
        <div className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-gray-100 dark:bg-gray-700 p-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Error Details:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">{error.message}</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={resetError}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Try Again
            </button>
            <a
              href="/dashboard"
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors text-center"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page-level error fallback
export function PageErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Page Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This page encountered an error and couldn&apos;t load properly.
          </p>
        </div>
        <div className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-gray-100 dark:bg-gray-700 p-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Error Details:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono break-words">{error.message}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={resetError}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Retry
            </button>
            <a
              href="/dashboard"
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-md transition-colors text-center"
            >
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component-level error fallback
export function ComponentErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Component Error</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            This component failed to load. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-mono">
              {error.message}
            </p>
          )}
        </div>
        <button
          onClick={resetError}
          className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// Hook for error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error("Error caught by useErrorHandler:", error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      // You can add additional error reporting here
      console.error("Error state updated:", error);
    }
  }, [error]);

  return { error, handleError, resetError };
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
