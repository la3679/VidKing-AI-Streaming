/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, BrainCircuit, Search, Play, Bookmark } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useAuthStore } from './store/useAuthStore';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/Navbar';
import { Hero } from './components/Hero';
import { MovieRow } from './components/MovieRow';
import { AIPickRow } from './components/AIPickRow';
import { AIAssistant } from './components/AIAssistant';
import { MovieDetails } from './components/MovieDetails';
import { AuthModal } from './components/AuthModal';
import { ActorProfile } from './components/ActorProfile';
import { Player } from './components/Player';
import { Movie } from './types';
import { getTrending, getDiscover, searchMulti } from './lib/tmdb';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from './store/useUIStore';
import { useWatchlistStore } from './store/useWatchlistStore';

export default function App() {
  const { user, setUser } = useAuthStore();
  const { selectedMedia, setSelectedMedia, isAuthOpen, setIsAuthOpen, selectedActorId, searchQuery, setSearchQuery, isWatchlistOpen, setIsWatchlistOpen } = useUIStore();
  const { subscribeToWatchlist, items: watchlistItems } = useWatchlistStore();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [originals, setOriginals] = useState<Movie[]>([]);
  const [action, setAction] = useState<Movie[]>([]);
  const [comedy, setComedy] = useState<Movie[]>([]);
  const [horror, setHorror] = useState<Movie[]>([]);
  const [isPlaying, setIsPlaying] = useState<Movie | null>(null);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchMulti(searchQuery);
      setSearchResults(results.filter((m: any) => m.backdrop_path || m.poster_path));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      return subscribeToWatchlist(user.uid);
    }
  }, [user, subscribeToWatchlist]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendData, origData, actData, comData, horData] = await Promise.all([
          getTrending(),
          getDiscover({ with_networks: 213 }), // Netflix (as placeholder for originals)
          getDiscover({ with_genres: 28 }),    // Action
          getDiscover({ with_genres: 35 }),    // Comedy
          getDiscover({ with_genres: 27 }),    // Horror
        ]);
        setTrending(trendData);
        setOriginals(origData);
        setAction(actData);
        setComedy(comData);
        setHorror(horData);
      } catch (err) {
        console.error("Failed to fetch TMDB data:", err);
      }
    };
    fetchData();
  }, []);

  const handlePlay = (movie: Movie) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setIsPlaying(movie);
    setSelectedMedia(null);
  };

  const watchlistArr = Object.values(watchlistItems);

  return (
    <div className="flex h-screen w-full bg-surface text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        <TopHeader />
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-8 pb-12 space-y-12">
            {isWatchlistOpen ? (
              <div className="pt-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-4xl font-display font-black tracking-tighter uppercase mb-2">My Library</h2>
                    <p className="text-sm text-white/40 uppercase tracking-[0.2em]">{watchlistArr.length} Saved Titles</p>
                  </div>
                  <button 
                    onClick={() => setIsWatchlistOpen(false)}
                    className="btn-secondary py-2 px-6"
                  >
                    Back to Home
                  </button>
                </div>
                
                {watchlistArr.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {watchlistArr.map((movie: any) => (
                      <div 
                        key={movie.tmdbId} 
                        className="group cursor-pointer" 
                        onClick={() => setSelectedMedia({
                          id: parseInt(movie.tmdbId),
                          title: movie.title,
                          poster_path: movie.poster_path,
                          media_type: movie.type,
                          backdrop_path: movie.poster_path // Fallback
                        } as any)}
                      >
                        <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 relative group-hover:border-brand/40 transition-all shadow-xl">
                          <img 
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg">
                                <Play className="w-6 h-6 fill-current text-white" />
                             </div>
                          </div>
                        </div>
                        <h3 className="mt-4 text-xs font-black uppercase tracking-tight truncate group-hover:text-brand transition-colors">
                          {movie.title}
                        </h3>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[50vh] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                       <Bookmark className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-2xl font-black uppercase mb-4 tracking-tighter">Your list is empty</h3>
                    <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed uppercase tracking-widest font-black">Add movies and shows to keep track of what you want to watch next.</p>
                    <button 
                      onClick={() => setIsWatchlistOpen(false)}
                      className="btn-primary mt-12 px-12"
                    >
                      Start Exploring
                    </button>
                  </div>
                )}
              </div>
            ) : searchQuery ? (
              <div className="pt-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-display font-black tracking-tighter uppercase mb-2">Search Results</h2>
                    <p className="text-sm text-white/40 uppercase tracking-[0.2em]">Found {searchResults.length} matches for "{searchQuery}"</p>
                  </div>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="btn-secondary py-2 px-6"
                  >
                    Clear Search
                  </button>
                </div>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {searchResults.map((movie) => (
                      <div key={movie.id} className="group cursor-pointer" onClick={() => setSelectedMedia(movie)}>
                        <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 relative group-hover:border-brand/40 transition-all shadow-xl">
                          <img 
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg">
                                <Play className="w-6 h-6 fill-current text-white" />
                             </div>
                          </div>
                        </div>
                        <h3 className="mt-4 text-xs font-black uppercase tracking-tight truncate group-hover:text-brand transition-colors">
                          {movie.title || movie.name}
                        </h3>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[40vh] flex flex-col items-center justify-center text-center">
                    <Search className="w-12 h-12 text-white/10 mb-4" />
                    <h3 className="text-xl font-bold mb-2">No results found</h3>
                    <p className="text-white/40 text-sm">Try searching for something else or explore trending titles.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Immersive Hero Section */}
                <div className="pt-6">
                  <div className="h-[75vh] relative rounded-3xl overflow-hidden shadow-2xl">
                    <Hero movie={trending[0]} />
                  </div>
                </div>

                {/* AI Custom Picks */}
                <AIPickRow />
                
                {/* Standard Rows */}
                <div className="space-y-16">
                  {originals.length > 0 && (
                    <MovieRow title="VidKing Originals" movies={originals} isLarge onViewAll={() => setSearchQuery('Netflix Originals')} />
                  )}
                  <MovieRow title="High Octane Thrillers" movies={action} onViewAll={() => setSearchQuery('Action Movies')} />
                  <MovieRow title="Tonight's Top Comedies" movies={comedy} onViewAll={() => setSearchQuery('Comedy')} />
                  <MovieRow title="Atmospheric Horrors" movies={horror} onViewAll={() => setSearchQuery('Horror')} />
                  <MovieRow title="Trending Now" movies={trending.slice(1)} onViewAll={() => setSearchQuery('Trending')} />
                </div>
              </>
            )}

            <footer className="pt-24 pb-12 border-t border-white/5 opacity-40">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-black uppercase tracking-[0.4em]">
                <span className="text-brand">VIDKING STREAMING</span>
                <div className="flex gap-12">
                  <a href="#" className="hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms</a>
                  <a href="#" className="hover:text-white transition-colors">Help</a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>


      <AIAssistant />

      <AnimatePresence>
        {selectedMedia && (
          <MovieDetails 
            media={selectedMedia} 
            onClose={() => setSelectedMedia(null)} 
            onPlay={handlePlay}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPlaying && (
          <Player 
            tmdbId={isPlaying.id.toString()} 
            type={isPlaying.media_type || 'movie'} 
            onClose={() => setIsPlaying(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal 
            isOpen={isAuthOpen} 
            onClose={() => setIsAuthOpen(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedActorId && <ActorProfile />}
      </AnimatePresence>
    </div>
  );
}
