import { describe, it, expect } from 'vitest';
import {
  buildEmbedUrl,
  parseVidkingEvent,
  isTrustedVidkingOrigin,
  VidkingError,
  VIDKING_ORIGIN,
} from './vidking';

describe('buildEmbedUrl', () => {
  it('builds a movie embed URL with defaults', () => {
    const url = new URL(buildEmbedUrl({ type: 'movie', tmdbId: 550 }));
    expect(url.origin + url.pathname).toBe('https://www.vidking.net/embed/movie/550');
    expect(url.searchParams.get('color')).toBe('e50914');
    expect(url.searchParams.get('autoPlay')).toBe('true');
    expect(url.searchParams.has('progress')).toBe(false);
  });

  it('builds a TV embed URL with season/episode and TV-only params', () => {
    const url = new URL(
      buildEmbedUrl({ type: 'tv', tmdbId: '1399', season: 2, episode: 5 }),
    );
    expect(url.pathname).toBe('/embed/tv/1399/2/5');
    expect(url.searchParams.get('nextEpisode')).toBe('true');
    expect(url.searchParams.get('episodeSelector')).toBe('true');
  });

  it('maps startSeconds to a floored progress param', () => {
    const url = new URL(buildEmbedUrl({ type: 'movie', tmdbId: 550, startSeconds: 123.9 }));
    expect(url.searchParams.get('progress')).toBe('123');
  });

  it('normalizes a hex color with a leading #', () => {
    const url = new URL(buildEmbedUrl({ type: 'movie', tmdbId: 1, color: '#00FF99' }));
    expect(url.searchParams.get('color')).toBe('00ff99');
  });

  it('throws on an invalid TMDB id', () => {
    expect(() => buildEmbedUrl({ type: 'movie', tmdbId: 'abc' })).toThrow(VidkingError);
  });

  it('throws when TV season/episode are missing', () => {
    expect(() => buildEmbedUrl({ type: 'tv', tmdbId: 1399 })).toThrow(VidkingError);
  });
});

describe('parseVidkingEvent', () => {
  const valid = {
    type: 'PLAYER_EVENT',
    data: {
      event: 'timeupdate',
      currentTime: 120.5,
      duration: 7200,
      progress: 1.6,
      id: '299534',
      mediaType: 'movie',
      timestamp: 1640995200000,
    },
  };

  it('parses a well-formed nested PLAYER_EVENT object', () => {
    const e = parseVidkingEvent(valid);
    expect(e).not.toBeNull();
    expect(e?.event).toBe('timeupdate');
    expect(e?.currentTime).toBe(120.5);
    expect(e?.duration).toBe(7200);
    expect(e?.mediaType).toBe('movie');
  });

  it('parses a JSON string payload', () => {
    expect(parseVidkingEvent(JSON.stringify(valid))?.event).toBe('timeupdate');
  });

  it('reads nested fields, not top-level (regression for the original bug)', () => {
    // The original code read data.progress off the top level -> always undefined.
    const e = parseVidkingEvent(valid);
    expect(e?.progress).toBe(1.6);
  });

  it('returns null for non-player messages', () => {
    expect(parseVidkingEvent({ type: 'OTHER', data: {} })).toBeNull();
    expect(parseVidkingEvent('not json')).toBeNull();
    expect(parseVidkingEvent(null)).toBeNull();
    expect(parseVidkingEvent(42)).toBeNull();
  });

  it('returns null for unknown event names or media types', () => {
    expect(
      parseVidkingEvent({ type: 'PLAYER_EVENT', data: { ...valid.data, event: 'explode' } }),
    ).toBeNull();
    expect(
      parseVidkingEvent({ type: 'PLAYER_EVENT', data: { ...valid.data, mediaType: 'song' } }),
    ).toBeNull();
  });
});

describe('isTrustedVidkingOrigin', () => {
  it('accepts the configured VidKing origin and rejects others', () => {
    expect(isTrustedVidkingOrigin(VIDKING_ORIGIN)).toBe(true);
    expect(isTrustedVidkingOrigin('https://evil.example.com')).toBe(false);
  });
});
