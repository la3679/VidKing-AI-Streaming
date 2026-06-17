import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, RotateCcw, RotateCw, AlertTriangle, Bug } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { env } from '../lib/env';
import { logger } from '../lib/logger';
import { formatTime } from '../lib/format';
import {
  buildEmbedUrl,
  isTrustedVidkingOrigin,
  parseVidkingEvent,
  VidkingError,
  VIDKING_ORIGIN,
  type VidkingPlayerEvent,
} from '../lib/vidking';

interface PlayerProps {
  tmdbId: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  onClose: () => void;
}

/** Save at most once per this interval during continuous playback. */
const SAVE_THROTTLE_MS = 10_000;
/** If the iframe hasn't loaded within this window, surface an error. */
const LOAD_TIMEOUT_MS = 15_000;
/** Don't offer resume once a title is essentially finished. */
const RESUME_MAX_COMPLETION = 0.95;

type LoadState = 'loading' | 'ready' | 'error';

export const Player = ({ tmdbId, type, season = 1, episode = 1, onClose }: PlayerProps) => {
  const { saveProgress, getProgress } = usePlayerStore();
  const { user } = useAuthStore();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [startSeconds, setStartSeconds] = useState(0);
  const [resumeResolved, setResumeResolved] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [recentEvents, setRecentEvents] = useState<VidkingPlayerEvent[]>([]);

  const lastSavedAtRef = useRef(0);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEscapeKey(onClose);

  // Resolve resume position before building the embed URL so VidKing receives
  // the correct start time. Falls through quickly when not logged in / no data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user && type) {
        const resume = await getProgress(user.uid, tmdbId);
        if (
          !cancelled &&
          resume &&
          resume.currentTime > 5 &&
          resume.completionRate < RESUME_MAX_COMPLETION
        ) {
          setStartSeconds(resume.currentTime);
        }
      }
      if (!cancelled) setResumeResolved(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, tmdbId, type, getProgress]);

  // Build the embed URL. Invalid inputs throw VidkingError -> error UI.
  const embed = useMemo(() => {
    try {
      const url = buildEmbedUrl({ type, tmdbId, season, episode, startSeconds });
      return { url, error: null as string | null };
    } catch (err) {
      const message =
        err instanceof VidkingError ? err.message : 'Could not build the stream URL.';
      logger.error('Embed URL build failed:', err);
      return { url: null, error: message };
    }
  }, [type, tmdbId, season, episode, startSeconds]);

  // Listen for player events — origin-validated and shape-validated.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!isTrustedVidkingOrigin(event.origin)) return;

      const parsed = parseVidkingEvent(event.data);
      if (!parsed) return;

      if (env.enablePlayerDebug) {
        logger.debug('VidKing event:', parsed);
        setRecentEvents((prev) => [parsed, ...prev].slice(0, 8));
      }

      if (!user) return;

      const persist = () => {
        lastSavedAtRef.current = Date.now();
        void saveProgress(user.uid, {
          tmdbId,
          type,
          season,
          episode,
          progress: parsed.progress,
          duration: parsed.duration,
          timestamp: parsed.currentTime,
        });
      };

      switch (parsed.event) {
        case 'pause':
        case 'ended':
        case 'seeked':
          persist();
          break;
        case 'timeupdate':
          if (Date.now() - lastSavedAtRef.current >= SAVE_THROTTLE_MS) persist();
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, tmdbId, type, season, episode, saveProgress]);

  // Treat a stalled iframe load as an error so users aren't left staring at black.
  useEffect(() => {
    if (!embed.url || loadState !== 'loading') return;
    loadTimerRef.current = setTimeout(() => {
      setLoadState((s) => (s === 'loading' ? 'error' : s));
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, [embed.url, loadState]);

  const handleIframeLoad = useCallback(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    setLoadState('ready');
  }, []);

  const handleRetry = useCallback(() => {
    setRecentEvents([]);
    setLoadState('loading');
    // Force a fresh iframe by nudging resume resolution.
    setResumeResolved(false);
    setTimeout(() => setResumeResolved(true), 0);
  }, []);

  const hasError = loadState === 'error' || Boolean(embed.error);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Video player"
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          aria-label="Back"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <RotateCcw className="w-6 h-6" aria-hidden="true" />
          <span className="font-bold">Back</span>
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold tracking-tight">Now Playing</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest">
            {type}
            {type === 'tv' && ` • S${season} E${episode}`}
            {startSeconds > 0 && ` • Resuming ${formatTime(startSeconds)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {env.enablePlayerDebug && (
            <button
              onClick={() => setShowDebug((v) => !v)}
              aria-label="Toggle player diagnostics"
              aria-pressed={showDebug}
              className="p-3 hover:bg-white/10 rounded-full transition-colors"
            >
              <Bug className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close player"
            className="p-3 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-8 h-8" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Frame / states */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {hasError ? (
          <div role="alert" className="text-center max-w-md px-6">
            <div className="w-16 h-16 mx-auto bg-brand/15 rounded-full flex items-center justify-center mb-5">
              <AlertTriangle className="w-8 h-8 text-brand" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-display font-black uppercase tracking-tight mb-3">
              Unable to load stream
            </h3>
            <p className="text-white/50 text-sm mb-8 leading-relaxed">
              {embed.error ??
                'The player did not respond. This can happen if the title is unavailable, the network is blocked, or an ad blocker is interfering.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {!embed.error && (
                <button onClick={handleRetry} className="btn-primary px-8 gap-2">
                  <RotateCw className="w-4 h-4" aria-hidden="true" /> Retry
                </button>
              )}
              {env.enablePlayerDebug && (
                <button onClick={() => setShowDebug(true)} className="btn-secondary px-8 gap-2">
                  <Bug className="w-4 h-4" aria-hidden="true" /> Open diagnostics
                </button>
              )}
              <button onClick={onClose} className="btn-secondary px-8">
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {loadState === 'loading' && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                role="status"
                aria-label="Loading stream"
              >
                <div className="w-12 h-12 border-4 border-white/10 border-t-brand rounded-full animate-spin" />
              </div>
            )}
            {resumeResolved && embed.url && (
              <iframe
                key={embed.url}
                title="VidKing player"
                src={embed.url}
                className="w-full h-full"
                onLoad={handleIframeLoad}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="origin"
              />
            )}
          </>
        )}
      </div>

      {/* Dev-only diagnostics overlay */}
      {env.enablePlayerDebug && showDebug && (
        <div className="absolute bottom-4 left-4 z-30 w-[min(92vw,420px)] max-h-[50vh] overflow-auto glass-card bg-black/80 border-white/10 p-4 text-xs font-mono">
          <p className="text-brand font-black uppercase tracking-widest mb-2">Player diagnostics</p>
          <dl className="space-y-1 text-white/70">
            <div className="flex justify-between gap-4">
              <dt className="text-white/40">State</dt>
              <dd>{loadState}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/40">Trusted origin</dt>
              <dd className="truncate">{VIDKING_ORIGIN}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/40">Resume</dt>
              <dd>{startSeconds > 0 ? formatTime(startSeconds) : 'none'}</dd>
            </div>
          </dl>
          <p className="text-white/40 mt-3 mb-1 break-all">{embed.url}</p>
          <p className="text-brand/80 mt-3 mb-1">Recent events</p>
          {recentEvents.length === 0 ? (
            <p className="text-white/30">No events received yet.</p>
          ) : (
            <ul className="space-y-1">
              {recentEvents.map((e, i) => (
                <li key={i} className="text-white/60">
                  {e.event} @ {formatTime(e.currentTime)} ({Math.round(e.progress)}%)
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </motion.div>
  );
};
