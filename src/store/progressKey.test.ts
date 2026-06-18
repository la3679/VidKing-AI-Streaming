import { describe, it, expect } from 'vitest';
import { progressDocId } from './usePlayerStore';

describe('progressDocId', () => {
  it('uses the bare TMDB id for movies', () => {
    expect(progressDocId('550', 'movie')).toBe('550');
  });

  it('keys TV progress per season and episode', () => {
    expect(progressDocId('1396', 'tv', 1, 1)).toBe('1396_s1_e1');
    expect(progressDocId('1396', 'tv', 2, 5)).toBe('1396_s2_e5');
  });

  it('does not collide between episodes of the same show', () => {
    const e1 = progressDocId('1396', 'tv', 1, 1);
    const e2 = progressDocId('1396', 'tv', 1, 2);
    expect(e1).not.toBe(e2);
  });

  it('defaults TV season/episode to 1 when missing', () => {
    expect(progressDocId('1396', 'tv')).toBe('1396_s1_e1');
  });
});
