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
