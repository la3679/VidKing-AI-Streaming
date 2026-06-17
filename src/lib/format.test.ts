import { describe, it, expect } from 'vitest';
import {
  formatYear,
  formatRuntime,
  formatRating,
  votePercent,
  formatTime,
  clampPercent,
  truncate,
} from './format';

describe('format utilities', () => {
  it('formatYear extracts a 4-digit year', () => {
    expect(formatYear('1999-03-31')).toBe('1999');
    expect(formatYear('')).toBe('');
    expect(formatYear(undefined)).toBe('');
  });

  it('formatRuntime renders hours and minutes', () => {
    expect(formatRuntime(136)).toBe('2h 16m');
    expect(formatRuntime(47)).toBe('47m');
    expect(formatRuntime(120)).toBe('2h');
    expect(formatRuntime(0)).toBe('');
  });

  it('formatRating fixes to one decimal', () => {
    expect(formatRating(8.42)).toBe('8.4');
    expect(formatRating(undefined)).toBe('');
  });

  it('votePercent clamps 0-100', () => {
    expect(votePercent(8.4)).toBe(84);
    expect(votePercent(0)).toBe(0);
    expect(votePercent(11)).toBe(100);
    expect(votePercent(-1)).toBe(0);
  });

  it('formatTime renders mm:ss and h:mm:ss', () => {
    expect(formatTime(272)).toBe('4:32');
    expect(formatTime(3909)).toBe('1:05:09');
    expect(formatTime(0)).toBe('0:00');
  });

  it('clampPercent bounds and rounds', () => {
    expect(clampPercent(42.6)).toBe(43);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(-5)).toBe(0);
  });

  it('truncate cuts on a word boundary with an ellipsis', () => {
    expect(truncate('hello world foo', 8)).toBe('hello…');
    expect(truncate('short', 50)).toBe('short');
  });
});
