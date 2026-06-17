/**
 * Server-side hybrid ranking: semantic similarity (Gemini embeddings) +
 * collaborative signals (genre completion, skips, watchlist). Runs on the
 * server so the embedding model — and the API key — stay off the client.
 */
import { embed } from './gemini.js';

const WEIGHTS = {
  EMBEDDING_SIMILARITY: 0.25,
  GENRE_MATCH: 0.2,
};

export interface RankCandidate {
  id: number | string;
  title?: string;
  name?: string;
  overview?: string;
  genre_ids?: number[];
}

export interface UserSignals {
  history?: Array<{ tmdbId?: string; title?: string; genre_ids?: number[]; completionRate?: number }>;
  watchlist?: Array<{ tmdbId?: string }>;
  interactions?: Array<{ type?: string; itemId?: string; metadata?: { title?: string } }>;
  lastQuery?: string;
}

export interface RankedResult {
  id: string;
  aiScore: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

export async function rankCandidates(
  candidates: RankCandidate[],
  signals: UserSignals,
): Promise<RankedResult[]> {
  const history = signals.history ?? [];
  const interactions = signals.interactions ?? [];
  const watchlist = signals.watchlist ?? [];

  const leadText =
    signals.lastQuery ||
    interactions.find((i) => i.type === 'click')?.metadata?.title ||
    history[0]?.title ||
    '';

  // Pre-compute the genre performance map once.
  const genrePerf: Record<number, number> = {};
  for (const h of history) {
    for (const g of h.genre_ids ?? []) {
      genrePerf[g] = (genrePerf[g] || 0) + (h.completionRate || 0);
    }
  }

  let contextVector: number[] = [];
  if (leadText) {
    try {
      contextVector = await embed(leadText);
    } catch {
      contextVector = [];
    }
  }

  const results = await Promise.all(
    candidates.map(async (movie) => {
      let score = 0;

      if (contextVector.length) {
        const movieText = `${movie.title || movie.name} ${movie.overview} ${(movie.genre_ids || []).join(' ')}`;
        try {
          const v = await embed(movieText);
          score += cosineSimilarity(contextVector, v) * WEIGHTS.EMBEDDING_SIMILARITY;
        } catch {
          /* ignore individual embedding failures */
        }
      }

      const genreScore = (movie.genre_ids || []).reduce((sum, g) => sum + (genrePerf[g] || 0), 0);
      score += (genreScore / Math.max(1, history.length)) * WEIGHTS.GENRE_MATCH;

      const id = movie.id.toString();
      const skips = interactions.filter((i) => i.type === 'skip' && i.itemId === id).length;
      score -= skips * 0.2;
      if (watchlist.some((w) => w.tmdbId === id)) score += 0.4;

      return { id, aiScore: score };
    }),
  );

  return results.sort((a, b) => b.aiScore - a.aiScore);
}
