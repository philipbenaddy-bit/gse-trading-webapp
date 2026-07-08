import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, WifiOff } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** If true, renders a compact inline error instead of full-page */
  inline?: boolean;
  /** Label shown in the error (e.g. "Portfolio", "Chart") */
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ── Main ErrorBoundary class ──────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    // Inline / section error
    if (this.props.inline) {
      return (
        <InlineError
          section={this.props.section}
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    // Full-page error
    return (
      <FullPageError
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        onReset={this.handleReset}
      />
    );
  }
}

// ── Full-page error UI ────────────────────────────────────────────────────────

function FullPageError({
  error,
  errorInfo,
  onReset,
}: {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}) {
  const isNetworkError =
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch') ||
    error?.message?.toLowerCase().includes('axios');

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="african-card p-8 max-w-md w-full text-center animate-scale-in">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/20 flex items-center justify-center mx-auto mb-5">
          {isNetworkError ? (
            <WifiOff className="w-8 h-8 text-[#DC143C]" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-[#DC143C]" />
          )}
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">
          {isNetworkError ? 'Connection Error' : 'Something went wrong'}
        </h1>

        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          {isNetworkError
            ? 'Unable to reach the server. Check your connection and try again.'
            : "We hit an unexpected error. It's been logged and we're on it."}
        </p>

        {/* Dev details */}
        {import.meta.env.DEV && error && (
          <details className="text-left mb-6 p-3 bg-background border border-border rounded-xl">
            <summary className="text-xs text-muted-foreground cursor-pointer mb-2 select-none">
              Error details (dev only)
            </summary>
            <pre className="text-xs price-down whitespace-pre-wrap overflow-auto max-h-40 leading-relaxed">
              {error.toString()}
              {errorInfo?.componentStack}
            </pre>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl text-[#1a1200] shadow-gold-sm hover:shadow-gold-md transition-all"
            style={{ background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/hub')}
            className="flex-1 african-card flex items-center justify-center gap-2 py-2.5 text-sm font-semibold hover:scale-105 transition-transform"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline / section error UI ─────────────────────────────────────────────────

function InlineError({
  section,
  error,
  onReset,
}: {
  section?: string;
  error: Error | null;
  onReset: () => void;
}) {
  return (
    <div className="african-card p-6 text-center">
      <AlertTriangle className="w-8 h-8 text-[#DC143C] mx-auto mb-3" />
      <p className="font-semibold text-sm mb-1">
        {section ? `${section} failed to load` : 'Failed to load'}
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={onReset}
        className="text-xs px-4 py-2 flex items-center gap-1.5 mx-auto font-semibold rounded-lg text-[#1a1200] shadow-gold-sm"
        style={{ background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' }}
      >
        <RefreshCw className="w-3 h-3" />
        Retry
      </button>
    </div>
  );
}

// ── Hook for functional components ───────────────────────────────────────────

export function useErrorHandler() {
  return (error: Error) => {
    console.error('[useErrorHandler]', error);
    throw error; // re-throw to nearest ErrorBoundary
  };
}

// ── Async error boundary wrapper ─────────────────────────────────────────────

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: { section?: string; inline?: boolean } = {},
) {
  return function WrappedWithErrorBoundary(props: P) {
    return (
      <ErrorBoundary inline={options.inline} section={options.section}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
