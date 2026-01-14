import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches rendering errors and displays user-friendly fallback UI
 *
 * Prevents white screen of death when React components throw errors.
 * Shows actionable error message with option to refresh or report the issue.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload the page to reset app state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-[var(--bg-base)] p-8">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-xl p-6 shadow-lg">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[var(--error-bg)] rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-[var(--error)]" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl font-semibold text-[var(--fg-default)] text-center mb-2">
                Something went wrong
              </h1>

              {/* User-friendly message */}
              <p className="text-sm text-[var(--fg-muted)] text-center mb-6">
                The app encountered an unexpected error. Don't worry, your work is safe.
                Try refreshing the page to continue.
              </p>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3
                           bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                           text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh App
                </button>

                {/* Show technical details in dev mode */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 p-4 bg-[var(--bg-base)] rounded-lg border border-[var(--border-default)]">
                    <summary className="text-xs font-medium text-[var(--fg-muted)] cursor-pointer mb-2">
                      Technical Details
                    </summary>
                    <div className="text-xs text-[var(--error)] font-mono mt-2 whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Help text */}
            <p className="text-xs text-[var(--fg-subtle)] text-center mt-4">
              If this keeps happening, please report this issue
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
