import { Movie } from '../types';
import { ai, MODELS } from './gemini';
import { db } from './firebase';
import { collection, query, limit, getDocs, orderBy, where } from 'firebase/firestore';

/**
 * Weights for the hybrid ranking formula
 */
const RANKING_WEIGHTS = {
  SEARCH_SIMILARITY: 0.3,
  GENRE_MATCH: 0.2,
  COMPLETION_RATE: 0.15,
  RECENCY: 0.1,
  EMBEDDING_SIMILARITY: 0.25
};

export interface UserSignals {
  history: any[];
  watchlist: any[];
  interactions: any[];
  lastQuery?: string;
}

export class RankingService {
  private static instance: RankingService;
  private embeddingsCache: Map<string, number[]> = new Map();

  static getInstance() {
    if (!RankingService.instance) {
      RankingService.instance = new RankingService();
    }
    return RankingService.instance;
  }

  /**
   * Fetches the latest signals for a user from Firestore
   */
  async getUserSignals(userId: string): Promise<UserSignals> {
    try {
      const historyRef = collection(db, `users/${userId}/progress`);
      const interactionsRef = collection(db, `users/${userId}/interactions`);
      const watchlistRef = collection(db, `users/${userId}/watchlist`);

      const [historySnap, interactionsSnap, watchlistSnap] = await Promise.all([
        getDocs(query(historyRef, orderBy('updatedAt', 'desc'), limit(10))),
        getDocs(query(interactionsRef, orderBy('timestamp', 'desc'), limit(20))),
        getDocs(watchlistRef)
      ]);

      return {
        history: historySnap.docs.map(d => d.data()),
        interactions: interactionsSnap.docs.map(d => d.data()),
        watchlist: watchlistSnap.docs.map(d => d.data()),
      };
    } catch (error) {
      console.error("AI Ranking Failure:", error);
      // Return empty signals on failure to prevent UI crash, but log for system diagnosis
      return {
        history: [],
        interactions: [],
        watchlist: []
      };
    }
  }

  /**
   * Real-Time Hybrid Ranking
   */
  async rankCandidates(candidates: Movie[], signals: UserSignals): Promise<Movie[]> {
    // 1. Get embedding for the "Contextual Lead" (last interaction or query)
    const leadText = signals.lastQuery || 
                     signals.interactions.find(i => i.type === 'click')?.metadata?.title ||
                     signals.history[0]?.title || "";
    
    const contextVector = leadText ? await this.getEmbedding(leadText) : null;

    const scoredCandidates = await Promise.all(candidates.map(async (movie) => {
      let score = 0;

      // a. Semantic Similarity (Content-Based)
      if (contextVector) {
        const movieText = `${movie.title} ${movie.overview} ${movie.genre_ids?.join(' ')}`;
        const movieVector = await this.getEmbedding(movieText);
        const similarity = this.cosineSimilarity(contextVector, movieVector);
        score += similarity * RANKING_WEIGHTS.EMBEDDING_SIMILARITY;
      }

      // b. Collaborative Bias (Implicit Loops)
      // Check if user has high completion rate on similar genres
      const userGenrePerformance: Record<number, number> = {};
      signals.history.forEach(h => {
        (h.genre_ids || []).forEach((g: number) => {
          userGenrePerformance[g] = (userGenrePerformance[g] || 0) + (h.completionRate || 0);
        });
      });

      const movieGenreScore = (movie.genre_ids || []).reduce((sum, g) => sum + (userGenrePerformance[g] || 0), 0);
      score += (movieGenreScore / Math.max(1, signals.history.length)) * RANKING_WEIGHTS.GENRE_MATCH;

      // c. Interaction Penalties (Skip logic)
      const skipCount = signals.interactions.filter(i => i.type === 'skip' && i.itemId === movie.id.toString()).length;
      score -= skipCount * 0.2;

      // d. Watchlist Bonus
      if (signals.watchlist.some(w => w.tmdbId === movie.id.toString())) {
        score += 0.4;
      }

      return { ...movie, aiScore: score };
    }));

    return scoredCandidates.sort((a: any, b: any) => b.aiScore - a.aiScore);
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const cleanText = text.slice(0, 1000); // Token limit safety
    if (this.embeddingsCache.has(cleanText)) return this.embeddingsCache.get(cleanText)!;

    try {
      const response = await ai.models.embedContent({
        model: MODELS.embedding,
        contents: [{ parts: [{ text: cleanText }] }]
      });
      const vector = response.embeddings?.[0]?.values || [];
      this.embeddingsCache.set(cleanText, vector);
      return vector;
    } catch (err) {
      return new Array(768).fill(0);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    const denom = magA * magB;
    return denom === 0 ? 0 : dotProduct / denom;
  }
}

