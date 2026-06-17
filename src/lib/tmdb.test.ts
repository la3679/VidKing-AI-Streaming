import { describe, it, expect } from 'vitest';
import { GENRES, getImageUrl } from './tmdb';

describe('GENRES', () => {
  it('exposes stable TMDB genre ids', () => {
    expect(GENRES.ACTION).toBe(28);
    expect(GENRES.COMEDY).toBe(35);
    expect(GENRES.HORROR).toBe(27);
    expect(GENRES.SCIFI).toBe(878);
    expect(GENRES.DRAMA).toBe(18);
  });
});

describe('getImageUrl', () => {
  it('builds a sized TMDB image URL', () => {
    expect(getImageUrl('/abc.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
  });

  it('defaults to the original size', () => {
    expect(getImageUrl('/x.jpg')).toBe('https://image.tmdb.org/t/p/original/x.jpg');
  });

  it('returns an inline fallback when no path is given', () => {
    const url = getImageUrl('');
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
  });
});
