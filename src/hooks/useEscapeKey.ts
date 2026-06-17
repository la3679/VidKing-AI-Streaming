import { useEffect } from 'react';

/**
 * Invokes `handler` when the Escape key is pressed. Used by modals/overlays so
 * keyboard users can dismiss them. Pass `enabled = false` to temporarily detach.
 */
export function useEscapeKey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handler, enabled]);
}
