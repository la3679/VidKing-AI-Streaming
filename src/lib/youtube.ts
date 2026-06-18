/**
 * Minimal helper to control an embedded YouTube IFrame via the postMessage API
 * (https://developers.google.com/youtube/iframe_api_reference). Using commands
 * instead of changing the `src` lets us mute/unmute *without reloading* the
 * iframe — which is what makes unmute actually work within the user's click
 * gesture (a reload would be re-muted by the browser's autoplay policy).
 *
 * The embed URL must include `enablejsapi=1`.
 */
type YouTubeFunc = 'mute' | 'unMute' | 'playVideo' | 'pauseVideo' | 'setVolume';

export function sendYouTubeCommand(
  iframe: HTMLIFrameElement | null,
  func: YouTubeFunc,
  args: Array<number | string> = [],
): boolean {
  const win = iframe?.contentWindow;
  if (!win) return false;
  try {
    win.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
    return true;
  } catch {
    return false;
  }
}

/**
 * Registers the parent as a listener so the player starts emitting events
 * (including `onReady`). Commands sent before the player is ready are ignored,
 * so we wait for the first message before applying mute/unmute.
 */
export function registerYouTubeListener(iframe: HTMLIFrameElement | null): void {
  const win = iframe?.contentWindow;
  if (!win) return;
  try {
    win.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
  } catch {
    /* ignore */
  }
}

/** True for messages originating from the YouTube embed. */
export function isYouTubeOrigin(origin: string): boolean {
  return origin === 'https://www.youtube.com' || origin === 'https://www.youtube-nocookie.com';
}

/** Builds a muted-autoplay background-trailer embed URL with the JS API enabled. */
export function buildTrailerEmbedUrl(videoKey: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1', // required for autoplay; we unmute via the API on user action
    controls: '0',
    loop: '1',
    playlist: videoKey,
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    enablejsapi: '1',
    playsinline: '1',
  });
  if (origin) params.set('origin', origin);
  return `https://www.youtube.com/embed/${videoKey}?${params.toString()}`;
}
