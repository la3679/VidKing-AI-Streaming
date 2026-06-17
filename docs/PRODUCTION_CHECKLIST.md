# Production Readiness Checklist

Status as of the 1.0.0 overhaul (2026-06-17).

## Quality gates (all green)

- [x] `npm run typecheck` — client + server, no errors
- [x] `npm run lint` — 0 errors (warnings only: a few unused vars / compiler hints)
- [x] `npm run test` — 42 unit & component tests passing
- [x] `npm run build` — production build succeeds
- [x] `npm run preview` — serves the SPA (HTTP 200, correct title/root)

## Security

- [x] No private API key in the client bundle (Gemini is server-only; verified the
      built bundle contains no `@google/genai`)
- [x] `.env*` gitignored; only `.env.example` (placeholders) committed
- [x] VidKing `postMessage` validated by origin and shape
- [x] Backend input validation (zod), rate limiting, CORS allow-list
- [x] No stack traces leaked to clients in production
- [x] AI markdown rendered without raw HTML; injection-resistant system prompt

## UX & resilience

- [x] App-level error boundary
- [x] Skeleton loaders, empty states, and retryable error states
- [x] Missing-config banner instead of a white screen
- [x] Accessible controls (aria labels, focus rings, semantic buttons)
- [x] Reduced-motion support
- [x] Responsive layout (mobile/tablet/desktop)

## Streaming

- [x] Correct movie/TV embed URLs (verified reachable, no frame restrictions)
- [x] Progress bug fixed (nested event fields); resume from last position
- [x] Player error UI with retry + dev diagnostics panel
- [x] See [STREAMING_DEBUG.md](../STREAMING_DEBUG.md)

## Required before going live

- [ ] Provide `VITE_TMDB_API_KEY`
- [ ] Provide Firebase web config (`VITE_FIREBASE_*`) + enable Google/GitHub/Email
      providers in the Firebase console
- [ ] Provide server `GEMINI_API_KEY` and set `ALLOWED_ORIGINS` to the prod origin
- [ ] (Optional) `npx playwright install` to run e2e locally
