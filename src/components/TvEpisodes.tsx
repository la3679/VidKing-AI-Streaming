import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlayIcon } from './icons';
import { getImageUrl, getTvSeasonDetails, orderSeasons } from '../lib/tmdb';
import { formatRuntime, formatYear, formatRating } from '../lib/format';
import { logger } from '../lib/logger';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { TvEpisode, TvSeasonSummary } from '../types';
import { Skeleton } from './states/Skeleton';
import { ErrorState } from './states/ErrorState';

const seasonLabel = (n: number) => (n === 0 ? 'Specials' : `Season ${n}`);

/**
 * Horizontal season tab strip that scrolls so EVERY season is reachable on any
 * screen size. Provides chevron scroll buttons + fade edges when the list
 * overflows, keeps the selected tab in view, and supports roving arrow-key
 * navigation (tablist pattern). Touch/trackpad scrolling work as usual; vertical
 * page/modal scroll is never trapped.
 */
const SeasonTabs = ({
  seasons,
  selected,
  onSelect,
}: {
  seasons: TvSeasonSummary[];
  selected: number;
  onSelect: (n: number) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const updateOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setOverflow({
      left: scrollLeft > 4,
      right: scrollLeft + clientWidth < scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateOverflow();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateOverflow, { passive: true });
    window.addEventListener('resize', updateOverflow);
    return () => {
      el.removeEventListener('scroll', updateOverflow);
      window.removeEventListener('resize', updateOverflow);
    };
  }, [updateOverflow, seasons.length]);

  // Keep the selected season visible; move focus too if the user is keyboarding.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const tab = container.querySelector<HTMLElement>(`[data-season="${selected}"]`);
    if (!tab) return;
    tab.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    });
    if (container.contains(document.activeElement) && document.activeElement !== tab) {
      tab.focus();
    }
  }, [selected, reduced, seasons.length]);

  const scrollByChunk = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = seasons.findIndex((s) => s.season_number === selected);
    if (idx < 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSelect(seasons[Math.min(idx + 1, seasons.length - 1)].season_number);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSelect(seasons[Math.max(idx - 1, 0)].season_number);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSelect(seasons[0].season_number);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSelect(seasons[seasons.length - 1].season_number);
    }
  };

  return (
    <div className="relative">
      {/* Fade edges (decorative) */}
      {overflow.left && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent z-10" aria-hidden="true" />
      )}
      {overflow.right && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent z-10" aria-hidden="true" />
      )}

      {/* Scroll buttons (shown only when scrollable) */}
      {overflow.left && (
        <button
          type="button"
          aria-label="Scroll seasons left"
          onClick={() => scrollByChunk(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-8 h-8 rounded-full bg-card border border-line text-ink shadow-[var(--shadow-soft)] hover:bg-panel"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
      {overflow.right && (
        <button
          type="button"
          aria-label="Scroll seasons right"
          onClick={() => scrollByChunk(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-8 h-8 rounded-full bg-card border border-line text-ink shadow-[var(--shadow-soft)] hover:bg-panel"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      )}

      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Seasons"
        onKeyDown={onKeyDown}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
      >
        {seasons.map((s) => {
          const isSel = s.season_number === selected;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={isSel}
              tabIndex={isSel ? 0 : -1}
              data-season={s.season_number}
              onClick={() => onSelect(s.season_number)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                isSel
                  ? 'bg-brand text-onaccent shadow-[var(--shadow-brand)]'
                  : 'bg-panel text-muted hover:text-ink border border-line'
              }`}
            >
              {seasonLabel(s.season_number)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface TvEpisodesProps {
  tvId: string;
  seasons: TvSeasonSummary[];
  /** Currently-playing episode highlight (when reopened from the player). */
  activeSeason?: number;
  activeEpisode?: number;
  onWatch: (season: number, episode: number, episodeTitle: string) => void;
}

/**
 * TV season selector + episode list. Selecting a season fetches that season's
 * episodes (cached); a per-request id guards against stale responses when the
 * user switches seasons quickly. Each episode has a "Watch" action that routes
 * the exact show/season/episode into the player.
 */
export const TvEpisodes = ({
  tvId,
  seasons,
  activeSeason,
  activeEpisode,
  onWatch,
}: TvEpisodesProps) => {
  const ordered = orderSeasons(seasons);
  const [selected, setSelected] = useState<number>(
    activeSeason ?? ordered[0]?.season_number ?? 1,
  );
  const [episodes, setEpisodes] = useState<TvEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(false);
    getTvSeasonDetails(tvId, selected)
      .then((data) => {
        if (id !== reqId.current) return; // a newer season was selected
        setEpisodes(data.episodes);
        setLoading(false);
      })
      .catch((err) => {
        if (id !== reqId.current) return;
        logger.warn('Failed to load season episodes:', err);
        setError(true);
        setLoading(false);
      });
  }, [tvId, selected]);

  if (ordered.length === 0) return null;

  return (
    <section aria-label="Episodes" className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-display font-black tracking-tight">Episodes</h3>
        <span className="text-xs font-black uppercase tracking-widest text-brand shrink-0">
          {seasonLabel(selected)}
        </span>
      </div>
      {/* Scrollable season selector — every season reachable on any screen */}
      <SeasonTabs seasons={ordered} selected={selected} onSelect={setSelected} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load episodes"
          message="We couldn't load this season. Please try again."
          onRetry={() => setSelected((v) => v)}
          className="py-10"
        />
      ) : (
        <ul className="space-y-3">
          {episodes.map((ep) => {
            const isActive = activeSeason === ep.season_number && activeEpisode === ep.episode_number;
            return (
              <li
                key={ep.id}
                className={`group flex flex-col sm:flex-row gap-4 p-3 rounded-2xl border transition-all ${
                  isActive ? 'border-brand bg-brand/5' : 'border-line bg-panel/40 hover:border-brand/40'
                }`}
              >
                <div className="relative w-full sm:w-44 shrink-0 aspect-video rounded-xl overflow-hidden bg-panel">
                  {ep.still_path ? (
                    <img
                      src={getImageUrl(ep.still_path, 'w300')}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xs">No preview</div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-black">
                    E{ep.episode_number}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-sm sm:text-base truncate">
                      {ep.episode_number}. {ep.name}
                    </h4>
                    <button
                      onClick={() => onWatch(ep.season_number, ep.episode_number, ep.name)}
                      aria-label={`Watch season ${ep.season_number} episode ${ep.episode_number}: ${ep.name}`}
                      className="btn-primary shrink-0 px-4 py-2 text-[10px]"
                    >
                      <PlayIcon className="w-4 h-4" /> {isActive ? 'Now Playing' : 'Watch'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted font-medium">
                    {ep.air_date && <span>{formatYear(ep.air_date)}</span>}
                    {ep.runtime ? <span>{formatRuntime(ep.runtime)}</span> : null}
                    {ep.vote_average > 0 && <span className="text-amber">★ {formatRating(ep.vote_average)}</span>}
                  </div>
                  {ep.overview && (
                    <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2">{ep.overview}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
