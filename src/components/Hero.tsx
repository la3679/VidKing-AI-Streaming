import { PlayIcon, AddIcon } from './icons';
import { motion } from 'motion/react';
import { Movie } from '../types';
import { getImageUrl } from '../lib/tmdb';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useWatchlistStore } from '../store/useWatchlistStore';

interface HeroProps {
  movie: Movie | null;
}

export const Hero = ({ movie }: HeroProps) => {
  const { setSelectedMedia, setIsAuthOpen } = useUIStore();
  const { user } = useAuthStore();
  const { trackInteraction } = usePlayerStore();
  const { toggleWatchlist, isInWatchlist } = useWatchlistStore();

  if (!movie) return <div className="h-full bento-card bg-neutral-900 animate-pulse" />;

  const handlePlay = () => {
    setSelectedMedia(movie);
    if (user) {
      trackInteraction(user.uid, 'click', movie.id.toString(), { action: 'hero_play', title: movie.title || movie.name });
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden group">
      <div className="absolute inset-0">
        <img 
          src={getImageUrl(movie.backdrop_path, 'original')} 
          alt={movie.title || movie.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-90" />
      </div>

      <div className="relative h-full flex flex-col justify-end p-8 md:p-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand/90 text-[9px] font-black uppercase tracking-widest text-white shadow-xl">
              EXCLUSIVE
            </div>
            <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] hidden sm:block">Premiere Streaming</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter leading-[0.85] text-white">
            {(movie.title || movie.name)?.toUpperCase()}
          </h1>

          <p className="text-white/60 text-base md:text-lg line-clamp-2 max-w-xl leading-relaxed mix-blend-plus-lighter font-medium">
            {movie.overview}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={handlePlay}
              className="flex items-center gap-3 px-10 py-4 bg-white text-black rounded-lg font-black uppercase text-xs tracking-[0.2em] hover:bg-brand hover:text-white transition-all shadow-2xl group/btn"
            >
              <PlayIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
              Watch Now
            </button>
            <button 
              onClick={() => user ? toggleWatchlist(user.uid, movie) : setIsAuthOpen(true)}
              className={`flex items-center gap-3 px-8 py-4 rounded-lg font-black uppercase text-xs tracking-[0.2em] backdrop-blur-md border transition-all font-sans ${isInWatchlist(movie.id.toString()) ? 'bg-brand border-brand text-white' : 'bg-white/5 text-white hover:bg-white/10 border-white/10'}`}
            >
              <AddIcon active={isInWatchlist(movie.id.toString())} className="w-5 h-5" />
              {isInWatchlist(movie.id.toString()) ? 'In Your List' : 'Add to List'}
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-16 right-16 hidden xl:block">
         <div className="flex flex-col items-end gap-6 text-right">
            <div className="text-[14px] font-black italic text-white/20 uppercase tracking-[0.3em]">
               VK PREMIUM
            </div>
         </div>
      </div>
    </div>
  );
};
