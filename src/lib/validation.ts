/**
 * Small, dependency-free validators shared across the app (player URL building,
 * forms, API inputs). Backend input validation uses zod separately.
 */

export type MediaType = 'movie' | 'tv';

export function isMediaType(value: unknown): value is MediaType {
  return value === 'movie' || value === 'tv';
}

/** True for positive-integer-like TMDB IDs (accepts number or numeric string). */
export function isValidTmdbId(value: unknown): boolean {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0;
  if (typeof value === 'string') return /^\d+$/.test(value.trim()) && Number(value) > 0;
  return false;
}

export function isPositiveInt(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= 6;
}

/** Normalizes a hex color to the bare 6-digit form VidKing expects (no `#`). */
export function normalizeHexColor(input: string, fallback = 'e50914'): string {
  const cleaned = input.replace(/^#/, '').trim().toLowerCase();
  return /^[0-9a-f]{6}$/.test(cleaned) ? cleaned : fallback;
}
