import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PlayIcon, AddIcon, CloseIcon } from './icons';
import { motion } from 'motion/react';
import { Movie } from '../types';
import { getImageUrl, getMovieDetails, getTvDetails } from '../lib/tmdb';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUIStore } from '../store/useUIStore';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { formatRuntime, formatYear, votePercent } from '../lib/format';
import { logger } from '../lib/logger';
import { Skeleton } from './states/Skeleton';
import { AudioIcon } from './icons/AudioIcon';
import { HeartIcon } from './icons/HeartIcon';
import {
  buildTrailerEmbedUrl,
  sendYouTubeCommand,
  registerYouTubeListener,
  isYouTubeOrigin,
} from '../lib/youtube';

interface MovieDetailsProps {
  media: Movie;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
}

export const MovieDetails = ({ media, onClose, onPlay }: MovieDetailsProps) => {
  const { user, isLiked, toggleLike } = useAuthStore();
  const { trackInteraction } = usePlayerStore();
  const { setSelectedActorId, setIsAuthOpen, setSelectedMedia } = useUIStore();
  const { toggleWatchlist, isInWatchlist } = useWatchlistStore();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [liking, setLiking] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const trailerRef = useRef<HTMLIFrameElement>(null);
  const desiredMutedRef = useRef(true);

  const liked = isLiked(media.id.toString());

  const handleLike = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setLiking(true);
    try {
      await toggleLike(media.id.toString());
    } finally {
      setLiking(false);
    }
  };

  // Apply a mute state to the (ready) YouTube player via the IFrame API.
  const applyMute = (muted: boolean) => {
    sendYouTubeCommand(trailerRef.current, muted ? 'mute' : 'unMute');
    if (!muted) sendYouTubeCommand(trailerRef.current, 'setVolume', [100]);
  };

  // Toggle audio without reloading the iframe. If the player isn't ready yet the
  // intent is stored and applied once YouTube signals readiness (below).
  const toggleMute = () => {
    const next = !isMuted;
    desiredMutedRef.current = next;
    setIsMuted(next);
    if (ytReady) applyMute(next);
  };

  // YouTube ignores commands sent before the player is ready. Register as a
  // listener on iframe load, then apply the pending mute state on the first
  // message from the YouTube origin (its readiness signal).
  const handleTrailerLoad = () => registerYouTubeListener(trailerRef.current);

  useEffect(() => {
    if (!showTrailer) return;
    const onMessage = (e: MessageEvent) => {
      if (!isYouTubeOrigin(e.origin) || ytReady) return;
      setYtReady(true);
      applyMute(desiredMutedRef.current);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTrailer, ytReady]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = media.media_type === 'tv' 
          ? await getTvDetails(media.id.toString())
          : await getMovieDetails(media.id.toString());
        setDetails(data);
        
        // Track view interaction for ML Ranking
        if (user && media) {
          trackInteraction(user.uid, 'view', media.id.toString(), { 
            title: media.title || media.name,
            genres: data.genres?.map((g: any) => g.id)
          });
        }
      } catch (err) {
        logger.error('Failed to load title details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();

    // Reset trailer/audio state for the new title, then reveal the trailer.
    setShowTrailer(false);
    setIsMuted(true);
    setYtReady(false);
    desiredMutedRef.current = true;
    const timer = setTimeout(() => setShowTrailer(true), 2000);
    return () => clearTimeout(timer);
  }, [media, user, trackInteraction]);

  useEscapeKey(onClose);

  const trailer = details?.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
  const year = formatYear(media.release_date || media.first_air_date);
  const runtime = formatRuntime(details?.runtime || details?.episode_run_time?.[0]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-card text-ink w-full max-w-5xl h-fit max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative scrollbar-hide border border-line"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${media.title || media.name}`}
      >
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Hero Section */}
        <div className="relative aspect-video w-full overflow-hidden">
          {showTrailer && trailer ? (
            <div className="absolute inset-0 z-0">
              <iframe
                ref={trailerRef}
                title={`${media.title || media.name} trailer`}
                className="w-full h-full scale-[1.35] pointer-events-none"
                src={buildTrailerEmbedUrl(trailer.key)}
                onLoad={handleTrailerLoad}
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
                aria-pressed={!isMuted}
                className="absolute bottom-8 right-8 p-3 bg-black/50 border border-white/20 text-white rounded-full hover:bg-black/70 hover:border-white/40 transition-all z-20 active:scale-95"
              >
                <AudioIcon muted={isMuted} className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <>
              <img 
                src={getImageUrl(media.backdrop_path)} 
                alt={media.title || media.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            </>
          )}
          
          <div className="absolute bottom-8 left-8 right-8 z-10">
            <h2 className="text-3xl md:text-5xl font-display font-black mb-6 tracking-tighter">
              {media.title || media.name}
            </h2>
            <div className="flex flex-wrap gap-4 items-center">
              <button 
                onClick={() => onPlay(media)}
                className="btn-primary"
              >
                <PlayIcon className="w-6 h-6" /> Play
              </button>
              <button
                onClick={() => (user ? toggleWatchlist(user.uid, media) : setIsAuthOpen(true))}
                aria-label={isInWatchlist(media.id.toString()) ? 'Remove from My List' : 'Add to My List'}
                aria-pressed={isInWatchlist(media.id.toString())}
                className={`p-2.5 border rounded-full transition-all active:scale-95 ${isInWatchlist(media.id.toString()) ? 'bg-brand border-brand text-white' : 'bg-card/70 border-line text-ink hover:bg-panel'}`}
              >
                <AddIcon active={isInWatchlist(media.id.toString())} className="w-6 h-6" />
              </button>
              <button
                onClick={handleLike}
                disabled={liking}
                aria-label={!user ? 'Sign in to like' : liked ? 'Unlike' : 'Like'}
                aria-pressed={liked}
                className={`p-2.5 border rounded-full transition-all active:scale-95 disabled:opacity-60 ${liked ? 'bg-brand/20 border-brand text-brand' : 'bg-card/70 border-line text-ink hover:bg-panel'}`}
              >
                {liking ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <HeartIcon filled={liked} className={`w-6 h-6 transition-transform ${liked ? 'scale-110' : ''}`} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
              {media.vote_average > 0 && (
                <span className="text-green-400 font-bold">{votePercent(media.vote_average)}% Match</span>
              )}
              {year && <span className="text-muted">{year}</span>}
              {runtime && <span className="text-muted">{runtime}</span>}
              <span className="border border-gray-500 rounded px-1.5 py-0 text-[10px] uppercase font-black text-muted">
                {media.media_type === 'tv' ? 'Series' : 'Film'}
              </span>
            </div>

            <p className="text-lg leading-relaxed text-ink">
              {media.overview}
            </p>

            {details?.genres && (
              <div className="flex flex-wrap gap-2 pt-4">
                {details.genres.map((g: any) => (
                  <span key={g.id} className="bg-panel border border-line px-3 py-1 rounded-full text-xs text-muted">
                    {g.name}
                  </span>
                ))}
              </div>
            )}
            
            <div className="pt-8 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                Audience Insights
              </h3>
              <div className="bg-panel border border-line rounded-2xl p-6">
                <p className="text-sm text-muted italic">
                  "This title is highly recommended for its {media.vote_average > 7 ? 'exceptional cinematic quality' : 'compelling narrative'} and strong emotional core."
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-muted text-xs uppercase font-black tracking-widest mb-2">Cast</p>
              {loading && !details ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
                {details?.credits?.cast?.slice(0, 10).map((c: any) => (
                  <button
                    type="button"
                    key={c.id}
                    aria-label={`View ${c.name}`}
                    className="text-muted hover:text-brand hover:underline cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedActorId(c.id.toString());
                      onClose();
                    }}
                  >
                    {c.name},
                  </button>
                ))}
                {details?.credits?.cast?.length > 10 && <span className="text-muted italic">more</span>}
              </div>
              )}
            </div>

            {details?.recommendations?.results && (
              <div>
                <p className="text-muted text-xs uppercase font-black tracking-widest mb-4">Recommended for you</p>
                <div className="grid grid-cols-2 gap-2">
                  {details.recommendations.results.slice(0, 4).map((rec: any) => (
                    <button
                      type="button"
                      key={rec.id}
                      onClick={() => setSelectedMedia(rec)}
                      aria-label={`Open ${rec.title || rec.name}`}
                      className="aspect-video relative rounded overflow-hidden group cursor-pointer"
                    >
                      <img
                        src={getImageUrl(rec.backdrop_path, 'w342')}
                        className="w-full h-full object-cover"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
