import React from 'react';
import { logger } from '../lib/logger';

interface Props {
  children: React.ReactNode;
  /** Optional custom fallback renderer. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-level error boundary. Catches render-time crashes anywhere in the tree
 * and shows a recoverable failure screen instead of a blank page. Production
 * never sees a raw stack trace; the details are only logged in development.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('Render error caught by ErrorBoundary:', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div
        role="alert"
        className="min-h-screen w-full flex flex-col items-center justify-center bg-surface text-slate-100 px-6 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-brand/15 flex items-center justify-center mb-6">
          <span className="text-brand text-2xl font-black">!</span>
        </div>
        <h1 className="text-2xl font-display font-black uppercase tracking-tight mb-3">
          Something went wrong
        </h1>
        <p className="text-white/50 max-w-md mb-8 text-sm leading-relaxed">
          The app hit an unexpected error. You can try to recover, or reload the page.
        </p>
        <div className="flex gap-4">
          <button onClick={this.reset} className="btn-primary px-8">
            Try again
          </button>
          <button onClick={() => window.location.reload()} className="btn-secondary px-8">
            Reload
          </button>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-10 max-w-xl overflow-auto text-left text-[11px] text-white/40 bg-black/40 p-4 rounded-xl border border-white/5">
            {error.message}
          </pre>
        )}
      </div>
    );
  }
}
