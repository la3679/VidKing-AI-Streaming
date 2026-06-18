/**
 * Small localStorage persistence keyed by user id. Used as a resilient fallback
 * for likes and watchlist so those features work — and survive a refresh — even
 * when Firestore isn't configured/available. When Firestore IS available it's
 * authoritative and these values are kept in sync.
 */
const PREFIX = 'vk';

type Kind = 'likes' | 'watchlist';

function storageKey(kind: Kind, uid?: string | null): string {
  return `${PREFIX}_${kind}_${uid || 'guest'}`;
}

export function loadLocal<T>(kind: Kind, uid: string | null | undefined, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(kind, uid));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocal<T>(kind: Kind, uid: string | null | undefined, value: T): void {
  try {
    localStorage.setItem(storageKey(kind, uid), JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode / quota) — non-fatal */
  }
}
