import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { Movie } from '../types';

interface WatchlistState {
  items: Record<string, any>;
  toggleWatchlist: (userId: string, movie: Movie) => Promise<void>;
  isInWatchlist: (tmdbId: string) => boolean;
  subscribeToWatchlist: (userId: string) => () => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: {},
  
  toggleWatchlist: async (userId, movie) => {
    const tmdbId = movie.id.toString();
    const path = `users/${userId}/watchlist/${tmdbId}`;
    
    if (get().items[tmdbId]) {
      await deleteDoc(doc(db, path));
    } else {
      await setDoc(doc(db, path), {
        tmdbId,
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        type: movie.media_type || 'movie',
        addedAt: serverTimestamp()
      });
    }
  },

  isInWatchlist: (tmdbId) => !!get().items[tmdbId],

  subscribeToWatchlist: (userId) => {
    const q = query(collection(db, `users/${userId}/watchlist`));
    return onSnapshot(q, (snapshot) => {
      const items: Record<string, any> = {};
      snapshot.forEach((doc) => {
        items[doc.id] = doc.data();
      });
      set({ items });
    });
  }
}));
