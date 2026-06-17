import { useCallback, useEffect, useState } from 'react';
import { Sparkles, BrainCircuit, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { RankingService } from '../lib/ranking';
import { getTrending } from '../lib/tmdb';
import { useUIStore } from '../store/useUIStore';
import { votePercent } from '../lib/format';
import { logger } from '../lib/logger';
import { Movie } from '../types';

export const AIPickRow = () => {
  const { user } = useAuthStore();
  const { setSelectedMedia } = useUIStore();
  const [picks, setPicks] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPicks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rankingService = RankingService.getInstance();
      const signals = await rankingService.getUserSignals(user.uid);
      const candidates = await getTrending();
      const ranked = await rankingService.rankCandidates(candidates, signals);
      const filtered = ranked
        .filter((m) => !signals.history.some((h) => h.tmdbId === m.id.toString()))
        .slice(0, 4);
      setPicks(filtered);
    } catch (err) {
      logger.warn('Could not build AI picks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPicks();
  }, [loadPicks]);

  if (!user || (picks.length === 0 && !loading)) return null;

  return (
    <div className="pt-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand/20 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">Neural Recommendation Core</h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-brand uppercase font-black tracking-widest">Hybrid Signal Ranking</p>
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </div>
        <button
          onClick={loadPicks}
          disabled={loading}
          aria-label="Refresh recommendations"
          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh picks
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-64 bento-card animate-pulse border-brand/5" />
            ))
          ) : (
            picks.map((pick, i) => (
              <motion.div
                key={pick.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedMedia(pick)}
                className="bento-card p-6 border-brand/10 hover:bg-brand/5 group flex flex-col justify-between h-72 relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Sparkles className="w-20 h-20 text-brand" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <Sparkles className="w-5 h-5 text-brand opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="text-[9px] font-black bg-brand/20 text-brand px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {votePercent(pick.vote_average)}% Match
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight group-hover:text-brand transition-colors line-clamp-1">{pick.title || pick.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-4 leading-relaxed opacity-80 mix-blend-plus-lighter">
                    {pick.overview}
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Why this pick</span>
                    <span className="text-[10px] font-bold text-gray-500">AI ranked for you</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMedia(pick);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline"
                  >
                    Explore Insight
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

