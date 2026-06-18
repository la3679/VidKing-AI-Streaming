import axios from 'axios';
import { env } from './env';
import { normalizeError } from './errors';
import type { Movie, TvSeasonSummary, TvSeasonDetails, TvEpisode } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: { api_key: env.tmdbApiKey },
});

/** TMDB genre ids, named to avoid magic numbers scattered across the app. */
export const GENRES = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HORROR: 27,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIFI: 878,
  THRILLER: 53,
} as const;

export type MediaKind = 'movie' | 'tv';

interface TmdbListResponse {
  results: Array<Record<string, any>>;
}

// ── Simple in-memory TTL cache for idempotent GETs ──────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: unknown }>();

async function cachedGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const key = `${url}?${JSON.stringify(params ?? {})}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;
  try {
    const { data } = await tmdb.get<T>(url, { params });
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
}

/** Stamps results with a media_type so cards/players can route correctly. */
function tag(results: Array<Record<string, any>>, type?: MediaKind): Movie[] {
  return results.map((r) => ({ ...r, media_type: (r.media_type ?? type ?? 'movie') as MediaKind })) as Movie[];
}

// ── Discovery ───────────────────────────────────────────────────────────────

export const getTrending = async (type: 'movie' | 'tv' | 'all' = 'all'): Promise<Movie[]> => {
  const data = await cachedGet<TmdbListResponse>(`/trending/${type}/week`);
  return tag(data.results);
};

export const getTopRated = async (type: MediaKind = 'movie'): Promise<Movie[]> => {
  const data = await cachedGet<TmdbListResponse>(`/${type}/top_rated`);
  return tag(data.results, type);
};

export const getDiscover = async (params: Record<string, unknown>): Promise<Movie[]> => {
  const data = await cachedGet<TmdbListResponse>('/discover/movie', params);
  return tag(data.results, 'movie');
};

export const discoverByGenre = async (
  genreId: number,
  type: MediaKind = 'movie',
): Promise<Movie[]> => {
  const data = await cachedGet<TmdbListResponse>(`/discover/${type}`, {
    with_genres: genreId,
    sort_by: 'popularity.desc',
  });
  return tag(data.results, type);
};

export const getPopularTv = async (): Promise<Movie[]> => {
  const data = await cachedGet<TmdbListResponse>('/tv/popular');
  return tag(data.results, 'tv');
};

// ── Details ───────────────────────────────────────────────────────────────

export const getMovieDetails = async (id: string) =>
  cachedGet<Record<string, any>>(`/movie/${id}`, {
    append_to_response: 'videos,credits,similar,recommendations',
  });

export const getTvDetails = async (id: string) =>
  cachedGet<Record<string, any>>(`/tv/${id}`, {
    append_to_response: 'videos,credits,similar,recommendations',
  });

// ── TV seasons & episodes ───────────────────────────────────────────────────

/**
 * Returns a show's seasons (from /tv/{id}) ordered by season number. Season 0
 * ("Specials") is sorted to the END rather than hidden, so it's discoverable
 * without dominating the list.
 */
/** Pure: keep non-empty seasons, order ascending, Specials (0) last. */
export function orderSeasons(seasons: TvSeasonSummary[]): TvSeasonSummary[] {
  return seasons
    .filter((s) => (s.episode_count ?? 0) > 0)
    .slice()
    .sort((a, b) => {
      if (a.season_number === 0) return 1;
      if (b.season_number === 0) return -1;
      return a.season_number - b.season_number;
    });
}

export const getTvSeasons = async (id: string): Promise<TvSeasonSummary[]> => {
  const data = await getTvDetails(id);
  return orderSeasons((data.seasons ?? []) as TvSeasonSummary[]);
};

/** Full episode list for one season (cached, so re-selecting a season is instant). */
export const getTvSeasonDetails = async (
  id: string,
  seasonNumber: number,
): Promise<TvSeasonDetails> => {
  const data = await cachedGet<TvSeasonDetails>(`/tv/${id}/season/${seasonNumber}`);
  return { ...data, episodes: data.episodes ?? [] };
};

/** Single episode details (optional deeper view). */
export const getTvEpisodeDetails = async (
  id: string,
  seasonNumber: number,
  episodeNumber: number,
): Promise<TvEpisode> =>
  cachedGet<TvEpisode>(`/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`);

// ── Search (debounced+abortable at the call site) ───────────────────────────

export const searchMulti = async (query: string, signal?: AbortSignal): Promise<Movie[]> => {
  try {
    const { data } = await tmdb.get<TmdbListResponse>('/search/multi', {
      params: { query },
      signal,
    });
    // Only movie/tv results are playable; drop people from the grid.
    return tag(data.results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv'));
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    throw normalizeError(error);
  }
};

// ── People ──────────────────────────────────────────────────────────────────

export const getPersonDetails = async (id: string) =>
  cachedGet<Record<string, any>>(`/person/${id}`, { append_to_response: 'external_ids' });

export const getPersonCredits = async (id: string): Promise<Movie[]> => {
  const data = await cachedGet<{ cast: Array<Record<string, any>> }>(`/person/${id}/combined_credits`);
  return data.cast as Movie[];
};

// ── Images ────────────────────────────────────────────────────────────────

const TRANSPARENT_FALLBACK =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="100%" height="100%" fill="#141414"/></svg>',
  );

export const getImageUrl = (path: string, size: string = 'original'): string => {
  if (!path) return TRANSPARENT_FALLBACK;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
