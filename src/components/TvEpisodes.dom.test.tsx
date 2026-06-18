import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TvEpisode, TvSeasonSummary } from '../types';

vi.mock('../lib/tmdb', () => ({
  getImageUrl: (p: string) => (p ? `https://img${p}` : 'data:fallback'),
  orderSeasons: (s: TvSeasonSummary[]) =>
    [...s].sort((a, b) => (a.season_number === 0 ? 1 : a.season_number - b.season_number)),
  getTvSeasonDetails: vi.fn(),
}));

import { TvEpisodes } from './TvEpisodes';
import { getTvSeasonDetails } from '../lib/tmdb';

const getSeason = getTvSeasonDetails as unknown as Mock;

const season = (n: number): TvSeasonSummary => ({
  id: n,
  season_number: n,
  name: `Season ${n}`,
  episode_count: 2,
  overview: '',
  poster_path: null,
  air_date: null,
});

const ep = (s: number, e: number, name: string): TvEpisode => ({
  id: s * 100 + e,
  season_number: s,
  episode_number: e,
  name,
  overview: 'x',
  still_path: null,
  air_date: '2020-01-01',
  runtime: 42,
  vote_average: 8,
});

describe('TvEpisodes selector', () => {
  beforeEach(() => {
    getSeason.mockReset();
    getSeason.mockImplementation((_id: string, s: number) =>
      Promise.resolve({
        id: s,
        season_number: s,
        name: `Season ${s}`,
        overview: '',
        poster_path: null,
        air_date: null,
        episodes:
          s === 1
            ? [ep(1, 1, 'Pilot'), ep(1, 2, 'Cat')]
            : s === 2
              ? [ep(2, 1, 'Seven')]
              : [ep(s, 1, `S${s}E1`)],
      }),
    );
  });

  it('loads the first season and updates when a new season is selected', async () => {
    render(<TvEpisodes tvId="1396" seasons={[season(2), season(1)]} onWatch={vi.fn()} />);

    // Season 1 episodes load first
    expect(await screen.findByText('1. Pilot')).toBeInTheDocument();
    expect(screen.getByText('2. Cat')).toBeInTheDocument();

    // Switch to Season 2 -> list updates
    await userEvent.click(screen.getByRole('tab', { name: /season 2/i }));
    expect(await screen.findByText('1. Seven')).toBeInTheDocument();
    expect(screen.queryByText('1. Pilot')).not.toBeInTheDocument();
  });

  it('exposes every season for a long-running show and can select the FINAL season', async () => {
    const many = Array.from({ length: 10 }, (_, i) => season(i + 1)); // 10 seasons
    const onWatch = vi.fn();
    render(<TvEpisodes tvId="1399" seasons={many} onWatch={onWatch} />);

    await screen.findByText('1. Pilot'); // season 1 loaded first

    // All 10 season tabs are rendered (reachable, not clipped out of existence).
    expect(screen.getAllByRole('tab')).toHaveLength(10);

    // Select the LAST season and confirm its episodes load + Watch routes it.
    await userEvent.click(screen.getByRole('tab', { name: /season 10/i }));
    expect(await screen.findByText('1. S10E1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /watch season 10 episode 1/i }));
    expect(onWatch).toHaveBeenCalledWith(10, 1, 'S10E1');
  });

  it('passes the exact season + episode to onWatch', async () => {
    const onWatch = vi.fn();
    render(<TvEpisodes tvId="1396" seasons={[season(1)]} onWatch={onWatch} />);

    const watch = await screen.findByRole('button', {
      name: /watch season 1 episode 2: cat/i,
    });
    await userEvent.click(watch);
    expect(onWatch).toHaveBeenCalledWith(1, 2, 'Cat');
  });
});
