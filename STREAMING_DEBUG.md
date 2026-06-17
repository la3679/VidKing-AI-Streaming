# VidKing Streaming — Integration & Troubleshooting

This document records how VidKing playback is integrated, what was verified, and
how to diagnose problems.

## How it works

Playback is an `<iframe>` pointing at VidKing's embed endpoint. The integration
lives in:

- [`src/lib/vidking.ts`](src/lib/vidking.ts) — pure, typed helpers: `buildEmbedUrl`,
  `parseVidkingEvent`, `isTrustedVidkingOrigin`.
- [`src/components/Player.tsx`](src/components/Player.tsx) — the player UI, secure
  event handling, resume, throttled progress saving, error UI, and the dev debug panel.

### URL format (verified against the docs)

| Type  | URL |
| ----- | --- |
| Movie | `https://www.vidking.net/embed/movie/{tmdbId}` |
| TV    | `https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}` |

Query parameters:

| Param             | Meaning                                         |
| ----------------- | ----------------------------------------------- |
| `color`           | Brand color, **hex without `#`** (e.g. `e50914`) |
| `autoPlay`        | `true` / `false`                                |
| `nextEpisode`     | TV only — show "next episode" button            |
| `episodeSelector` | TV only — enable the episode menu               |
| `progress`        | **Resume position in seconds** (start time)     |

> ⚠️ Note the naming asymmetry: the `progress` **query param** is a start time in
> seconds, while the `progress` **field in player events** is a percentage (0–100).
> We resume using the saved `currentTime` (seconds), not the percentage.

### Player events (the bug that was fixed)

VidKing posts messages to the parent window with a **nested** shape:

```json
{
  "type": "PLAYER_EVENT",
  "data": {
    "event": "timeupdate",      // play | pause | timeupdate | ended | seeked
    "currentTime": 120.5,        // seconds
    "duration": 7200,            // seconds
    "progress": 1.6,             // percent
    "id": "550",
    "mediaType": "movie",
    "season": 1,
    "episode": 8,
    "timestamp": 1640995200000
  }
}
```

The previous implementation read `data.progress` / `data.currentTime` from the
**top level**, so every saved value was `0`/undefined. We now read `data.data.*`
via `parseVidkingEvent`, validate `event.origin` against
`VITE_VIDKING_ORIGIN` (default `https://www.vidking.net`), and ignore any message
that isn't a well-formed PLAYER_EVENT.

### Progress saving & resume

- Saves to Firestore at `users/{uid}/progress/{tmdbId}` **only when signed in**.
- `timeupdate` writes are **throttled to one per 10s**; `pause`, `seeked`, and
  `ended` flush immediately.
- On reopen, `getProgress` loads the saved `currentTime` and passes it as
  `startSeconds` → `progress` query param, unless the title is ≥95% complete.

### iframe attributes

```
allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
allowFullScreen
referrerPolicy="origin"
```

## What was verified (2026-06-17)

Endpoint reachability and embeddability were checked directly:

```
$ curl -s -o /dev/null -w "%{http_code} %{content_type}" \
    "https://www.vidking.net/embed/movie/550?color=e50914&autoPlay=true"
200 text/html

$ curl -s -o /dev/null -w "%{http_code} %{content_type}" \
    "https://www.vidking.net/embed/tv/1396/1/1?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true"
200 text/html

$ curl -sD - -o /dev/null "https://www.vidking.net/embed/movie/550" \
    | grep -iE "x-frame-options|content-security-policy"
(none)
```

**Conclusion:** the embed URLs are valid and reachable, and VidKing sends **no
`X-Frame-Options` or CSP `frame-ancestors`** restrictions, so the player can be
embedded in an iframe. Unit tests cover URL building and event parsing
([`src/lib/vidking.test.ts`](src/lib/vidking.test.ts), 12 tests passing).

### Tested example IDs

| Title           | Type  | TMDB ID | Embed |
| --------------- | ----- | ------- | ----- |
| Fight Club      | movie | 550     | `/embed/movie/550` |
| Breaking Bad    | tv    | 1396    | `/embed/tv/1396/1/1` |
| Game of Thrones | tv    | 1399    | `/embed/tv/1399/1/1` |

## Manual verification procedure

1. `npm run dev` (set `VITE_TMDB_API_KEY` so the catalog loads).
2. Set `VITE_ENABLE_PLAYER_DEBUG=true` to show the diagnostics panel.
3. Open a movie → Play. Confirm the iframe loads and the spinner clears.
4. Open the debug panel (bug icon). As playback proceeds you should see
   `timeupdate` events with increasing time and percentage.
5. Sign in, watch ~30s, close, reopen the same title → header shows
   "Resuming m:ss" and the diagnostics panel shows a non-zero resume value.
6. Confirm a Firestore doc exists at `users/{uid}/progress/{tmdbId}` with a
   non-zero `timestamp` (seconds) and `progress` (percent).

## Troubleshooting

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| "Unable to load stream", spinner never clears | Ad blocker / privacy extension blocking the embed or its scripts | Disable the blocker for the site, or test in a clean profile |
| Black frame, no events | Title genuinely unavailable on VidKing's sources | Try another title; VidKing aggregates third-party sources |
| Progress not saving | Not signed in, or Firebase not configured | Sign in; configure `VITE_FIREBASE_*` |
| Events logged but ignored | `event.origin` ≠ `VITE_VIDKING_ORIGIN` | Ensure `VITE_VIDKING_ORIGIN=https://www.vidking.net` |
| Mixed-content warning | App served over HTTP | Serve the app over HTTPS (Vercel does this by default) |

## Known limitations

- VidKing aggregates third-party streams; availability and quality vary by title
  and region and are outside this app's control.
- The embed does not expose a documented programmatic play/pause API, so the
  player chrome relies on VidKing's own in-iframe controls.
