import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Movie } from '../types';
import { toast } from './useToastStore';
import { logger } from '../lib/logger';

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

    try {
      if (wasInList) {
        await deleteDoc(doc(db, path));
        toast.success(`Removed "${title}" from your list`);
      } else {
        await setDoc(doc(db, path), {
          tmdbId,
          title,
          poster_path: movie.poster_path,
          type: movie.media_type || 'movie',
          addedAt: serverTimestamp(),
        });
        toast.success(`Added "${title}" to your list`);
      }
    } catch (error) {
      logger.error('Watchlist update failed:', error);
      // Revert the optimistic change.
      set((s) => {
        const reverted = { ...s.items };
        if (wasInList) reverted[tmdbId] = { tmdbId, title, poster_path: movie.poster_path };
        else delete reverted[tmdbId];
        return { items: reverted };
      });
      toast.error('Could not update your list. Please try again.');
    }
  },

  isInWatchlist: (tmdbId) => !!get().items[tmdbId],

  subscribeToWatchlist: (userId) => {
    const q = collection(db, `users/${userId}/watchlist`);
    return onSnapshot(
      q,
      (snapshot) => {
        const items: Record<string, any> = {};
        snapshot.forEach((d) => {
          items[d.id] = d.data();
        });
        set({ items });
      },
      (error) => logger.warn('Watchlist subscription error:', error),
    );
  },

  reset: () => set({ items: {} }),
}));
