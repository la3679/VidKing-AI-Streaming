import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { getMissingEnv } from '../lib/env';

/**
 * Non-blocking banner shown when important environment variables are missing.
 * Keeps the app usable (it never crashes) while telling the developer exactly
 * what to configure. Only meaningful in development / misconfigured deploys.
 */
export const EnvBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const missing = getMissingEnv();

  if (dismissed || missing.length === 0) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] w-[min(92vw,640px)] glass-card border-amber-400/30 bg-amber-500/10 px-5 py-4 flex items-start gap-4"
    >
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 text-sm">
        <p className="font-bold text-ink mb-1">Configuration incomplete</p>
        <ul className="text-muted space-y-1 text-xs leading-relaxed">
          {missing.map((m) => (
            <li key={m.name}>
              <code className="text-ink">{m.name}</code> — {m.purpose}
            </li>
          ))}
        </ul>
        <p className="text-muted text-[11px] mt-2">
          Copy <code>.env.example</code> to <code>.env.local</code> and fill in the values.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss configuration warning"
        className="text-muted hover:text-ink transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
