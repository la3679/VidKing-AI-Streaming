/**
 * Pure formatting helpers for display. Kept side-effect free and unit-tested.
 */

/** Extracts the four-digit year from a TMDB date string. */
export function formatYear(date?: string | null): string {
  if (!date) return '';
  const year = date.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : '';
}

/** Formats a runtime in minutes as e.g. "2h 16m" or "47m". */
export function formatRuntime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Formats a TMDB vote average (0-10) as a one-decimal rating, e.g. "8.4". */
export function formatRating(vote?: number | null): string {
  if (vote == null || Number.isNaN(vote)) return '';
  return vote.toFixed(1);
}

/** Converts a TMDB vote average (0-10) to a whole-number percentage, clamped 0-100. */
export function votePercent(vote?: number | null): number {
  if (vote == null || Number.isNaN(vote)) return 0;
  return Math.max(0, Math.min(100, Math.round(vote * 10)));
}

/** Formats elapsed/total seconds as "1:05:09" or "4:32". */
export function formatTime(seconds?: number | null): string {
  if (!seconds || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Clamps a 0-100 percentage to a safe display value. */
export function clampPercent(value?: number | null): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Truncates text to `max` characters on a word boundary, appending an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}
