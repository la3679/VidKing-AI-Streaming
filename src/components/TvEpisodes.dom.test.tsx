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
        episodes: s === 1 ? [ep(1, 1, 'Pilot'), ep(1, 2, 'Cat')] : [ep(2, 1, 'Seven')],
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
