import { useEffect, useRef, useState } from 'react';
import { PlayIcon } from './icons';
import { getImageUrl, getTvSeasonDetails, orderSeasons } from '../lib/tmdb';
import { formatRuntime, formatYear, formatRating } from '../lib/format';
import { logger } from '../lib/logger';
import type { TvEpisode, TvSeasonSummary } from '../types';
import { Skeleton } from './states/Skeleton';
import { ErrorState } from './states/ErrorState';

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-display font-black tracking-tight">Episodes</h3>
        {/* Season selector */}
        <div role="tablist" aria-label="Seasons" className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full">
          {ordered.map((s) => {
            const isSel = s.season_number === selected;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={isSel}
                onClick={() => setSelected(s.season_number)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  isSel
                    ? 'bg-brand text-onaccent shadow-[var(--shadow-brand)]'
                    : 'bg-panel text-muted hover:text-ink border border-line'
                }`}
              >
                {s.season_number === 0 ? 'Specials' : `Season ${s.season_number}`}
              </button>
            );
          })}
        </div>
      </div>

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
