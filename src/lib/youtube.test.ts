import { describe, it, expect, vi } from 'vitest';
import { buildTrailerEmbedUrl, sendYouTubeCommand } from './youtube';

describe('buildTrailerEmbedUrl', () => {
  it('enables the JS API and starts muted for autoplay', () => {
    const url = new URL(buildTrailerEmbedUrl('abc123'));
    expect(url.pathname).toBe('/embed/abc123');
    expect(url.searchParams.get('enablejsapi')).toBe('1');
    expect(url.searchParams.get('mute')).toBe('1');
    expect(url.searchParams.get('autoplay')).toBe('1');
    expect(url.searchParams.get('playlist')).toBe('abc123');
  });
});

describe('sendYouTubeCommand', () => {
  it('posts a JSON command to the iframe content window', () => {
    const postMessage = vi.fn();
    const iframe = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
    const ok = sendYouTubeCommand(iframe, 'unMute');
    expect(ok).toBe(true);
    const payload = JSON.parse(postMessage.mock.calls[0][0]);
    expect(payload).toMatchObject({ event: 'command', func: 'unMute' });
  });

  it('passes args (e.g. setVolume)', () => {
    const postMessage = vi.fn();
    const iframe = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
    sendYouTubeCommand(iframe, 'setVolume', [100]);
    const payload = JSON.parse(postMessage.mock.calls[0][0]);
    expect(payload.args).toEqual([100]);
  });

  it('returns false when there is no iframe/content window', () => {
    expect(sendYouTubeCommand(null, 'mute')).toBe(false);
    expect(sendYouTubeCommand({} as HTMLIFrameElement, 'mute')).toBe(false);
  });
});
