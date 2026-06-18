import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useToastStore, type ToastVariant } from '../store/useToastStore';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const STYLES: Record<ToastVariant, string> = {
  success: 'border-l-4 border-l-green-500',
  error: 'border-l-4 border-l-brand',
  info: 'border-l-4 border-l-amber',
};

const ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-green-500',
  error: 'text-brand',
  info: 'text-amber',
};

/** Renders transient toast notifications. Mounted once near the app root. */
export const Toaster = () => {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      className="fixed top-24 right-4 z-[400] flex flex-col gap-2 w-[min(92vw,360px)]"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <motion.div
              key={t.id}
              role="status"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`glass-card text-ink ${STYLES[t.variant]} px-4 py-3 flex items-center gap-3`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${ICON_COLOR[t.variant]}`} aria-hidden="true" />
              <p className="flex-1 text-sm font-medium">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-muted hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
