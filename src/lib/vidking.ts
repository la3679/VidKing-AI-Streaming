/**
 * Typed VidKing embed integration.
 *
 * Reference (https://www.vidking.net/#documentation):
 *  - Movie:  https://www.vidking.net/embed/movie/{tmdbId}
 *  - TV:     https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}
 *  - Query params: color (hex, no '#'), autoPlay (bool), nextEpisode (bool, TV),
 *                  episodeSelector (bool, TV), progress (start time in SECONDS).
 *  - The player posts messages to the parent window of the shape:
 *      { type: "PLAYER_EVENT", data: { event, currentTime, duration, progress,
 *        id, mediaType, season, episode, timestamp } }
 *    where `event` is one of play | pause | timeupdate | ended | seeked, and
 *    `data.progress` is a PERCENTAGE (0-100), while `data.currentTime` is seconds.
 *
 * This module is pure and side-effect free so it can be unit-tested without a DOM.
 */
import { isMediaType, isValidTmdbId, normalizeHexColor } from './validation';
import { env } from './env';

export const VIDKING_BASE_URL = 'https://www.vidking.net';

/** Origin used to validate `postMessage` events from the player iframe. */
export const VIDKING_ORIGIN = env.vidkingOrigin;

export type MediaType = 'movie' | 'tv';

export interface EmbedOptions {
  type: MediaType;
  tmdbId: string | number;
  /** Required for TV. */
  season?: number;
  /** Required for TV. */
  episode?: number;
  /** Brand color as hex (with or without leading '#'). Defaults to brand red. */
  color?: string;
  autoPlay?: boolean;
  /** TV only: show the "next episode" button. */
  nextEpisode?: boolean;
  /** TV only: enable the episode selector menu. */
  episodeSelector?: boolean;
  /** Resume position, in seconds. Mapped to the `progress` query param. */
  startSeconds?: number;
}

export class VidkingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VidkingError';
  }
}

/**
 * Builds a validated VidKing embed URL. Throws {@link VidkingError} when inputs
 * are invalid so callers can render a clear error UI instead of a broken iframe.
 */
export function buildEmbedUrl(options: EmbedOptions): string {
  const { type, tmdbId, season, episode } = options;

  if (!isMediaType(type)) {
    throw new VidkingError(`Unsupported media type: ${String(type)}`);
  }
  if (!isValidTmdbId(tmdbId)) {
    throw new VidkingError(`Invalid TMDB id: ${String(tmdbId)}`);
  }

  const params = new URLSearchParams();
  params.set('color', normalizeHexColor(options.color ?? 'e50914'));
  params.set('autoPlay', String(options.autoPlay ?? true));

  if (options.startSeconds && options.startSeconds > 0) {
    params.set('progress', String(Math.floor(options.startSeconds)));
  }

  let path: string;
  if (type === 'movie') {
    path = `/embed/movie/${tmdbId}`;
  } else {
    if (!Number.isInteger(season) || (season as number) < 1) {
      throw new VidkingError('A valid season number is required for TV playback.');
    }
    if (!Number.isInteger(episode) || (episode as number) < 1) {
      throw new VidkingError('A valid episode number is required for TV playback.');
    }
    params.set('nextEpisode', String(options.nextEpisode ?? true));
    params.set('episodeSelector', String(options.episodeSelector ?? true));
    path = `/embed/tv/${tmdbId}/${season}/${episode}`;
  }

  return `${VIDKING_BASE_URL}${path}?${params.toString()}`;
}

// ── Player events ───────────────────────────────────────────────────────────

export const VIDKING_EVENT_NAMES = ['play', 'pause', 'timeupdate', 'ended', 'seeked'] as const;
export type VidkingEventName = (typeof VIDKING_EVENT_NAMES)[number];

export interface VidkingPlayerEvent {
  event: VidkingEventName;
  /** Current playback position, in seconds. */
  currentTime: number;
  /** Total media duration, in seconds. */
  duration: number;
  /** Playback progress as a percentage (0-100). */
  progress: number;
  /** TMDB id reported by the player. */
  id: string;
  mediaType: MediaType;
  season?: number;
  episode?: number;
  timestamp?: number;
}

function isEventName(value: unknown): value is VidkingEventName {
  return typeof value === 'string' && (VIDKING_EVENT_NAMES as readonly string[]).includes(value);
}

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Safely parses a raw `MessageEvent.data` payload into a typed VidKing event.
 * Returns `null` for anything that isn't a well-formed PLAYER_EVENT, so the
 * message listener can ignore unrelated/hostile messages without throwing.
 */
export function parseVidkingEvent(raw: unknown): VidkingPlayerEvent | null {
  let payload: unknown = raw;

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }

  if (!payload || typeof payload !== 'object') return null;
  const outer = payload as Record<string, unknown>;
  if (outer.type !== 'PLAYER_EVENT') return null;

  const data = outer.data;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  if (!isEventName(d.event)) return null;

  const mediaType = d.mediaType;
  if (mediaType !== 'movie' && mediaType !== 'tv') return null;

  return {
    event: d.event,
    currentTime: toNumber(d.currentTime),
    duration: toNumber(d.duration),
    progress: toNumber(d.progress),
    id: String(d.id ?? ''),
    mediaType,
    season: d.season != null ? toNumber(d.season) : undefined,
    episode: d.episode != null ? toNumber(d.episode) : undefined,
    timestamp: d.timestamp != null ? toNumber(d.timestamp) : undefined,
  };
}

/** Validates that a message event originated from the trusted VidKing origin. */
export function isTrustedVidkingOrigin(origin: string): boolean {
  return origin === VIDKING_ORIGIN;
}
