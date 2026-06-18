import { describe, it, expect, beforeEach } from 'vitest';
import { loadLocal, saveLocal } from './localPersist';

describe('localPersist', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a value keyed by user id', () => {
    saveLocal('likes', 'u1', ['550', '680']);
    expect(loadLocal<string[]>('likes', 'u1', [])).toEqual(['550', '680']);
  });

  it('isolates by user id', () => {
    saveLocal('likes', 'u1', ['1']);
    expect(loadLocal<string[]>('likes', 'u2', [])).toEqual([]);
  });

  it('returns the fallback when nothing is stored', () => {
    expect(loadLocal('watchlist', 'nobody', { empty: true })).toEqual({ empty: true });
  });

  it('falls back gracefully on malformed data', () => {
    localStorage.setItem('vk_likes_u1', '{not json');
    expect(loadLocal<string[]>('likes', 'u1', [])).toEqual([]);
  });
});
