import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Movie } from '../types';
import { getImageUrl } from '../lib/tmdb';
import { votePercent } from '../lib/format';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useWatchlistStore } from '../store/useWatchlistStore';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  isLarge?: boolean;
  onViewAll?: () => void;
}

export const MovieRow = ({ title, movies, isLarge, onViewAll }: MovieRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const { setSelectedMedia, setIsAuthOpen } = useUIStore();
  const { user } = useAuthStore();
  const { trackInteraction } = usePlayerStore();
  const { toggleWatchlist, isInWatchlist } = useWatchlistStore();

  const handleMovieClick = (movie: Movie) => {
    setSelectedMedia(movie);
    if (user) {
      trackInteraction(user.uid, 'click', movie.id.toString(), { title: movie.title || movie.name });
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/row">
      <div className="flex items-center justify-between mb-4 pr-12">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/50 group-hover/row:text-white transition-colors">
          {title}
        </h2>
        {onViewAll && (
          <div 
            onClick={onViewAll}
            className="text-[10px] text-brand font-black cursor-pointer hover:underline tracking-widest"
          >
            VIEW ALL
          </div>
        )}
      </div>

      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-40 bg-black/80 w-10 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center hover:bg-brand/20 rounded-l-2xl"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div 
          ref={rowRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {movies.map((movie, i) => (
            <motion.div
              key={`${movie.id}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleMovieClick(movie)}
              className={`flex-none relative group cursor-pointer transition-all duration-500 overflow-hidden rounded-2xl border border-white/5 hover:border-brand/50 ${
                isLarge ? 'w-48 md:w-56 aspect-[2/3]' : 'w-64 md:w-72 aspect-video'
              }`}
            >
              <img 
                src={getImageUrl(isLarge ? movie.poster_path : movie.backdrop_path, isLarge ? 'w500' : 'w780')} 
                alt={movie.title || movie.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                <div className="flex gap-2 mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="p-2 bg-brand rounded-lg text-white shadow-lg shadow-brand/20">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (user) toggleWatchlist(user.uid, movie);
                      else setIsAuthOpen(true);
                    }}
                    className={`p-2 backdrop-blur-md border rounded-lg text-white transition-all ${isInWatchlist(movie.id.toString()) ? 'bg-brand border-brand' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                  >
                    <Plus className={`w-4 h-4 transition-transform ${isInWatchlist(movie.id.toString()) ? 'rotate-45' : ''}`} />
                  </div>
                </div>
                <h3 className="text-sm font-bold truncate tracking-tight">{movie.title || movie.name}</h3>
                <div className="flex items-center justify-between mt-1">
                   <p className="text-[10px] text-brand font-black uppercase tracking-widest">{votePercent(movie.vote_average)}% Match</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-40 bg-black/80 w-10 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center hover:bg-brand/20 rounded-r-2xl"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
