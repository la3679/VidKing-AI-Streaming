/**
 * Lightweight logger that is verbose in development and quiet in production.
 *
 * Use this instead of raw `console.*` so production builds don't leak noisy
 * logs or sensitive context. `error` is always emitted because surfacing
 * failures matters even in production, but it is routed through one place so it
 * can later be wired to a reporting service.
 */
import { env } from './env';

type LogArgs = unknown[];

export const logger = {
  debug: (...args: LogArgs) => {
    if (env.isDev) console.debug('[vidking]', ...args);
  },
  info: (...args: LogArgs) => {
    if (env.isDev) console.info('[vidking]', ...args);
  },
  warn: (...args: LogArgs) => {
    if (env.isDev) console.warn('[vidking]', ...args);
  },
  error: (...args: LogArgs) => {
    // Always emitted; keep the surface area small and free of secrets.
    console.error('[vidking]', ...args);
  },
};
