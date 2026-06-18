import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Recoverable error placeholder with an optional retry action. */
export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) => (
  <div
    role="alert"
    className={`flex flex-col items-center justify-center text-center py-16 ${className}`}
  >
    <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-5">
      <AlertTriangle className="w-7 h-7 text-brand" aria-hidden="true" />
    </div>
    <h3 className="text-xl font-black uppercase tracking-tight mb-2">{title}</h3>
    <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed mb-6">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary px-8 gap-2">
        <RotateCw className="w-4 h-4" aria-hidden="true" />
        Retry
      </button>
    )}
  </div>
);
