import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Movie } from '../types';
import { toast } from './useToastStore';
import { logger } from '../lib/logger';
import { loadLocal, saveLocal } from '../lib/localPersist';

interface WatchlistState {
  items: Record<string, any>;
  toggleWatchlist: (userId: string, movie: Movie) => Promise<void>;
  isInWatchlist: (tmdbId: string) => boolean;
  subscribeToWatchlist: (userId: string) => () => void;
  reset: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: {},

  toggleWatchlist: async (userId, movie) => {
    const tmdbId = movie.id.toString();
    const path = `users/${userId}/watchlist/${tmdbId}`;
    const title = movie.title || movie.name || 'Title';
    const wasInList = Boolean(get().items[tmdbId]);

    // Optimistic update — reflect the change immediately, revert on failure.
    const optimistic = { ...get().items };
    if (wasInList) {
      delete optimistic[tmdbId];
    } else {
      optimistic[tmdbId] = {
        tmdbId,
        title,
        poster_path: movie.poster_path,
        type: movie.media_type || 'movie',
      };
    }
    set({ items: optimistic });
    // Persist locally immediately so the change survives a refresh even if
    // Firestore is unavailable.
    saveLocal('watchlist', userId, optimistic);

    try {
      if (wasInList) {
        await deleteDoc(doc(db, path));
      } else {
        await setDoc(doc(db, path), {
          tmdbId,
          title,
          poster_path: movie.poster_path,
          type: movie.media_type || 'movie',
          addedAt: serverTimestamp(),
        });
      }
      toast.success(wasInList ? `Removed "${title}" from your list` : `Added "${title}" to your list`);
    } catch (error) {
      // Firestore unavailable — KEEP the local change rather than reverting, so
      // the watchlist still works (and persists via localStorage).
      logger.warn('Watchlist cloud sync failed; kept local copy:', error);
      toast.success(wasInList ? `Removed "${title}" from your list` : `Added "${title}" to your list`);
    }
  },

  isInWatchlist: (tmdbId) => !!get().items[tmdbId],

  subscribeToWatchlist: (userId) => {
    // Hydrate from localStorage immediately so saved titles show without waiting.
    set({ items: loadLocal('watchlist', userId, {}) });

    const q = collection(db, `users/${userId}/watchlist`);
    return onSnapshot(
      q,
      (snapshot) => {
        const items: Record<string, any> = {};
        snapshot.forEach((d) => {
          items[d.id] = d.data();
        });
        set({ items });
        saveLocal('watchlist', userId, items); // keep local mirror in sync
      },
      // On error keep the locally-hydrated items rather than clearing.
      (error) => logger.warn('Watchlist subscription error (using local copy):', error),
    );
  },

  reset: () => set({ items: {} }),
}));
