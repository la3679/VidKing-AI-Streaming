export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  preferences?: {
    favoriteGenres: string[];
    theme: 'dark' | 'light';
    /** TMDB ids the user has "liked" (favorited). */
    likedIds?: string[];
  };
}

/** A season summary as returned in a TV show's `seasons[]` (TMDB /tv/{id}). */
export interface TvSeasonSummary {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
  vote_average?: number;
}

/** A single episode from TMDB /tv/{id}/season/{n}. */
export interface TvEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

/** Season details (episodes) from TMDB /tv/{id}/season/{n}. */
export interface TvSeasonDetails {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
  episodes: TvEpisode[];
}

export interface WatchProgress {
  tmdbId: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  progress: number;
  duration: number;
  timestamp: number;
  updatedAt: string;
}

export interface WatchListItem {
  tmdbId: string;
  type: 'movie' | 'tv';
  addedAt: string;
  title: string;
  posterPath: string;
}
