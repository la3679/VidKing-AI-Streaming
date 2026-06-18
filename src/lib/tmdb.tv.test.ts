import { describe, it, expect } from 'vitest';
import { orderSeasons } from './tmdb';
import type { TvSeasonSummary } from '../types';

const s = (season_number: number, episode_count = 5): TvSeasonSummary => ({
  id: season_number,
  season_number,
  name: season_number === 0 ? 'Specials' : `Season ${season_number}`,
  episode_count,
  overview: '',
  poster_path: null,
  air_date: null,
});

describe('orderSeasons', () => {
  it('orders numbered seasons ascending', () => {
    const out = orderSeasons([s(3), s(1), s(2)]);
    expect(out.map((x) => x.season_number)).toEqual([1, 2, 3]);
  });

  it('places Specials (season 0) last', () => {
    const out = orderSeasons([s(0), s(2), s(1)]);
    expect(out.map((x) => x.season_number)).toEqual([1, 2, 0]);
  });

  it('drops seasons with no episodes', () => {
    const out = orderSeasons([s(1, 0), s(2, 8)]);
    expect(out.map((x) => x.season_number)).toEqual([2]);
  });
});
