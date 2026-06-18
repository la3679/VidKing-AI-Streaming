/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Search, Play, Bookmark } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseEnabled } from './lib/firebase';
import { useAuthStore } from './store/useAuthStore';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/Navbar';
import { Hero } from './components/Hero';
import { MovieRow } from './components/MovieRow';
import { AIPickRow } from './components/AIPickRow';
import { ContinueWatchingRow } from './components/ContinueWatchingRow';
import { AIAssistant } from './components/AIAssistant';
import { Toaster } from './components/Toaster';
import { MovieDetails } from './components/MovieDetails';
import { AuthModal } from './components/AuthModal';
import { ActorProfile } from './components/ActorProfile';
import { Player } from './components/Player';
import { EmptyState } from './components/states/EmptyState';
import { ErrorState } from './components/states/ErrorState';
import { HeroSkeleton, RowSkeleton, GridSkeleton } from './components/states/Skeleton';
import { Movie } from './types';
import { getTrending, getDiscover, getTopRated, getPopularTv, discoverByGenre, searchMulti, GENRES } from './lib/tmdb';
import axios from 'axios';
import { logger } from './lib/logger';
import { AnimatePresence } from 'motion/react';
import { useUIStore } from './store/useUIStore';
import { useWatchlistStore } from './store/useWatchlistStore';

export default function App() {
  const { user, setUser } = useAuthStore();
  const { selectedMedia, setSelectedMedia, isAuthOpen, setIsAuthOpen, selectedActorId, searchQuery, setSearchQuery, isWatchlistOpen, setIsWatchlistOpen } = useUIStore();
  const { subscribeToWatchlist, items: watchlistItems, reset: resetWatchlist } = useWatchlistStore();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [originals, setOriginals] = useState<Movie[]>([]);
  const [action, setAction] = useState<Movie[]>([]);
  const [comedy, setComedy] = useState<Movie[]>([]);
  const [horror, setHorror] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [scifi, setScifi] = useState<Movie[]>([]);
  const [drama, setDrama] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [isPlaying, setIsPlaying] = useState<{
    movie: Movie;
    season?: number;
    episode?: number;
    episodeTitle?: string;
  } | null>(null);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setSearchError(false);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setSearchError(false);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await searchMulti(searchQuery, controller.signal);
        setSearchResults(results.filter((m: any) => m.backdrop_path || m.poster_path));
        setSearchLoading(false);
      } catch (err) {
        if (axios.isCancel(err)) return; // superseded by a newer query
        logger.error('Search failed:', err);
        setSearchError(true);
        setSearchLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    // Skip the auth subscription entirely when Firebase isn't configured, so we
    // don't fire doomed network calls with a placeholder key.
    if (!firebaseEnabled) {
      setUser(null);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      return subscribeToWatchlist(user.uid);
    }
    // Signed out — clear any stale watchlist state.
    resetWatchlist();
  }, [user, subscribeToWatchlist, resetWatchlist]);

  const loadHome = useCallback(async () => {
    setHomeLoading(true);
    setHomeError(false);
    try {
      const [trendData, origData, actData, comData, horData, topData, sciData, dramaData, tvData] =
        await Promise.all([
          getTrending(),
          getDiscover({ with_networks: 213 }), // Netflix originals catalogue
          discoverByGenre(GENRES.ACTION),
          discoverByGenre(GENRES.COMEDY),
          discoverByGenre(GENRES.HORROR),
          getTopRated('movie'),
          discoverByGenre(GENRES.SCIFI),
          discoverByGenre(GENRES.DRAMA),
          getPopularTv(),
        ]);
      setTrending(trendData);
      setOriginals(origData);
      setAction(actData);
      setComedy(comData);
      setHorror(horData);
      setTopRated(topData);
      setScifi(sciData);
      setDrama(dramaData);
      setTvShows(tvData);
    } catch (err) {
      logger.error('Failed to fetch TMDB data:', err);
      setHomeError(true);
    } finally {
      setHomeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const handlePlay = (
    movie: Movie,
    opts?: { season?: number; episode?: number; episodeTitle?: string },
  ) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setIsPlaying({ movie, ...opts });
    setSelectedMedia(null);
  };

  const watchlistArr = Object.values(watchlistItems);

  return (
    <div className="flex h-screen w-full app-canvas text-ink overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        <TopHeader />
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 sm:px-6 lg:px-8 pb-12 space-y-12">
            {isWatchlistOpen ? (
              <div className="pt-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-4xl font-display font-black tracking-tighter uppercase mb-2">My Library</h2>
                    <p className="text-sm text-muted uppercase tracking-[0.2em]">{watchlistArr.length} Saved Titles</p>
                  </div>
                  <button 
                    onClick={() => setIsWatchlistOpen(false)}
                    className="btn-secondary py-2 px-6"
                  >
                    Back to Home
                  </button>
                </div>
                
                {watchlistArr.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6" aria-label="Saved titles">
                    {watchlistArr.map((movie: any) => (
                      <button
                        type="button"
                        key={movie.tmdbId}
                        className="group cursor-pointer text-left"
                        aria-label={`Open ${movie.title}`}
                        onClick={() => setSelectedMedia({
                          id: parseInt(movie.tmdbId),
                          title: movie.title,
                          poster_path: movie.poster_path,
                          media_type: movie.type,
                          backdrop_path: movie.poster_path // Fallback
                        } as any)}
                      >
                        <div className="lift aspect-[2/3] rounded-2xl overflow-hidden border border-line relative group-hover:border-brand/40 transition-all shadow-xl">
                          <img 
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
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
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Bookmark}
                    title="Your list is empty"
                    description="Add movies and shows to keep track of what you want to watch next."
                    action={{ label: 'Start Exploring', onClick: () => setIsWatchlistOpen(false) }}
                    className="h-[50vh]"
                  />
                )}
              </div>
            ) : searchQuery ? (
              <div className="pt-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-display font-black tracking-tighter uppercase mb-2">Search Results</h2>
                    <p className="text-sm text-muted uppercase tracking-[0.2em]">Found {searchResults.length} matches for "{searchQuery}"</p>
                  </div>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="btn-secondary py-2 px-6"
                  >
                    Clear Search
                  </button>
                </div>
                {searchLoading ? (
                  <GridSkeleton count={12} />
                ) : searchError ? (
                  <ErrorState
                    title="Search failed"
                    message="We couldn't complete that search. Check your connection and try again."
                    onRetry={() => setSearchQuery(searchQuery)}
                    className="h-[40vh]"
                  />
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {searchResults.map((movie) => (
                      <button
                        type="button"
                        key={movie.id}
                        className="group cursor-pointer text-left"
                        aria-label={`Open ${movie.title || movie.name}`}
                        onClick={() => setSelectedMedia(movie)}
                      >
                        <div className="lift aspect-[2/3] rounded-2xl overflow-hidden border border-line relative group-hover:border-brand/40 transition-all shadow-xl">
                          <img 
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
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
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Search}
                    title="No results found"
                    description="Try searching for something else or explore trending titles."
                    className="h-[40vh]"
                  />
                )}
              </div>
            ) : (
              <>
                {/* Immersive Hero Section */}
                <div className="pt-6">
                  <div className="h-[75vh] relative rounded-3xl overflow-hidden shadow-2xl">
                    {homeLoading ? <HeroSkeleton /> : <Hero movie={trending[0]} />}
                  </div>
                </div>

                {homeError ? (
                  <ErrorState
                    title="Couldn't load content"
                    message="We couldn't reach the catalog. Check your connection or TMDB configuration and try again."
                    onRetry={loadHome}
                    className="min-h-[40vh]"
                  />
                ) : homeLoading ? (
                  <div className="space-y-16">
                    <RowSkeleton large />
                    <RowSkeleton />
                    <RowSkeleton />
                  </div>
                ) : (
                  <>
                    {/* Continue Watching (in-progress titles) */}
                    <ContinueWatchingRow />

                    {/* AI Custom Picks */}
                    <AIPickRow />

                    {/* Standard Rows */}
                    <div className="space-y-16">
                      {originals.length > 0 && (
                        <MovieRow title="VidKing Originals" movies={originals} isLarge onViewAll={() => setSearchQuery('Netflix Originals')} />
                      )}
                      <MovieRow title="Trending Now" movies={trending.slice(1)} onViewAll={() => setSearchQuery('Trending')} />
                      <MovieRow title="Top Rated" movies={topRated} isLarge onViewAll={() => setSearchQuery('Top Rated')} />
                      <MovieRow title="High Octane Action" movies={action} onViewAll={() => setSearchQuery('Action Movies')} />
                      <MovieRow title="Tonight's Top Comedies" movies={comedy} onViewAll={() => setSearchQuery('Comedy')} />
                      <MovieRow title="Sci-Fi & Beyond" movies={scifi} onViewAll={() => setSearchQuery('Science Fiction')} />
                      <MovieRow title="Atmospheric Horror" movies={horror} onViewAll={() => setSearchQuery('Horror')} />
                      <MovieRow title="Acclaimed Drama" movies={drama} onViewAll={() => setSearchQuery('Drama')} />
                      <MovieRow title="Binge-Worthy TV Shows" movies={tvShows} onViewAll={() => setSearchQuery('TV Shows')} />
                    </div>
                  </>
                )}
              </>
            )}

            <footer className="pt-24 pb-12 border-t border-line">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-black uppercase tracking-[0.4em] opacity-40">
                <span className="text-brand">VIDKING STREAMING</span>
                {/* Informational labels — not yet linked, so rendered as
                    non-interactive text rather than dead links. */}
                <div className="flex gap-12">
                  <span>Privacy</span>
                  <span>Terms</span>
                  <span>Help</span>
                </div>
              </div>
              {/* TMDB requires attribution for use of their API. */}
              <p className="mt-6 text-center text-[10px] text-muted leading-relaxed normal-case tracking-normal">
                This product uses the{' '}
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-ink"
                >
                  TMDB
                </a>{' '}
                API but is not endorsed or certified by TMDB. Streaming provided via VidKing.
              </p>
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
            tmdbId={isPlaying.movie.id.toString()}
            type={isPlaying.movie.media_type || 'movie'}
            season={isPlaying.season}
            episode={isPlaying.episode}
            title={isPlaying.movie.title || isPlaying.movie.name}
            episodeTitle={isPlaying.episodeTitle}
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

      <Toaster />
    </div>
  );
}
