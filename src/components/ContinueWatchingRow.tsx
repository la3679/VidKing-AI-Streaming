import { useCallback, useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUIStore } from '../store/useUIStore';
import { getMovieDetails, getTvDetails, getImageUrl } from '../lib/tmdb';
import { clampPercent } from '../lib/format';
import { logger } from '../lib/logger';
import { Movie } from '../types';
import { RowSkeleton } from './states/Skeleton';

interface Entry {
  movie: Movie;
  progressPercent: number;
}

/**
 * "Continue Watching" — in-progress titles pulled from Firestore. Clicking a
 * card opens details; the player auto-resumes from the saved position.
 */
export const ContinueWatchingRow = () => {
  const { user } = useAuthStore();
  const { getContinueWatching } = usePlayerStore();
  const { setSelectedMedia } = useUIStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items = await getContinueWatching(user.uid);
      const resolved = await Promise.all(
        items.map(async (item) => {
          try {
            const details =
              item.type === 'tv'
                ? await getTvDetails(item.tmdbId)
                : await getMovieDetails(item.tmdbId);
            const movie: Movie = {
              id: Number(item.tmdbId),
              title: details.title,
              name: details.name,
              overview: details.overview,
              poster_path: details.poster_path,
              backdrop_path: details.backdrop_path,
              vote_average: details.vote_average,
              media_type: item.type,
              genre_ids: (details.genres || []).map((g: { id: number }) => g.id),
            };
            return { movie, progressPercent: clampPercent(item.completionRate * 100) } as Entry;
          } catch {
            return null;
          }
        }),
      );
      setEntries(resolved.filter((e): e is Entry => e !== null));
    } catch (err) {
      logger.warn('Continue Watching failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [user, getContinueWatching]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return null;
  if (loading) return <RowSkeleton />;
  if (entries.length === 0) return null;

  return (
    <div className="relative">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-4">
        Continue Watching
      </h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {entries.map(({ movie, progressPercent }, i) => (
          <motion.button
            key={movie.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedMedia(movie)}
            aria-label={`Resume ${movie.title || movie.name} (${progressPercent}% watched)`}
            className="flex-none w-64 md:w-72 group cursor-pointer text-left"
          >
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/5 relative group-hover:border-brand/50 transition-all">
              <img
                src={getImageUrl(movie.backdrop_path, 'w780')}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 fill-current text-white" aria-hidden="true" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div className="h-full bg-brand" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <h3 className="mt-3 text-xs font-black uppercase tracking-tight truncate group-hover:text-brand transition-colors">
              {movie.title || movie.name}
            </h3>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
