import { Movie } from '../types';
import { db } from './firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { rank } from './api';
import { logger } from './logger';

export interface UserSignals {
  history: any[];
  watchlist: any[];
  interactions: any[];
  lastQuery?: string;
}

/**
 * Client-side facade over the backend ranking API. User signals are read from
 * Firestore as the signed-in user (client SDK), then sent to the server, which
 * performs the embedding-based hybrid ranking with the Gemini key held server-side.
 */
export class RankingService {
  private static instance: RankingService;

  static getInstance() {
    if (!RankingService.instance) RankingService.instance = new RankingService();
    return RankingService.instance;
  }

  /** Fetches the latest signals for a user from Firestore. */
  async getUserSignals(userId: string): Promise<UserSignals> {
    try {
      const historyRef = collection(db, `users/${userId}/progress`);
      const interactionsRef = collection(db, `users/${userId}/interactions`);
      const watchlistRef = collection(db, `users/${userId}/watchlist`);

      const [historySnap, interactionsSnap, watchlistSnap] = await Promise.all([
        getDocs(query(historyRef, orderBy('updatedAt', 'desc'), limit(10))),
        getDocs(query(interactionsRef, orderBy('timestamp', 'desc'), limit(20))),
        getDocs(watchlistRef),
      ]);

      return {
        history: historySnap.docs.map((d) => d.data()),
        interactions: interactionsSnap.docs.map((d) => d.data()),
        watchlist: watchlistSnap.docs.map((d) => d.data()),
      };
    } catch (error) {
      logger.warn('Could not load user signals:', error);
      return { history: [], interactions: [], watchlist: [] };
    }
  }

  /**
   * Ranks candidates via the backend. Falls back to rating order if the AI
   * service is unavailable, so the row always renders something useful.
   */
  async rankCandidates(candidates: Movie[], signals: UserSignals): Promise<Movie[]> {
    try {
      const { ranked } = await rank(
        candidates.map((c) => ({
          id: c.id,
          title: c.title,
          name: c.name,
          overview: c.overview,
          genre_ids: c.genre_ids,
        })),
        signals,
      );
      const scoreById = new Map(ranked.map((r) => [r.id, r.aiScore]));
      return candidates
        .map((m) => ({ ...m, aiScore: scoreById.get(m.id.toString()) ?? 0 }))
        .sort((a, b) => (b as any).aiScore - (a as any).aiScore);
    } catch (error) {
      logger.warn('AI ranking unavailable; using rating order:', error);
      return [...candidates].sort((a, b) => b.vote_average - a.vote_average);
    }
  }
}
