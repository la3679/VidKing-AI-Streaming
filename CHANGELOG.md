# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] — 2026-06-17

Production-readiness overhaul. Delivered across nine feature branches.

### Added
- Typed, validated environment config (`src/lib/env.ts`) and a non-blocking
  missing-config banner; app no longer crashes on missing Firebase/TMDB config.
- Shared utilities: `logger` (dev/prod gated), `errors` (normalized), `format`,
  `validation`; app-level `ErrorBoundary`.
- Reusable loading/empty/error states and skeleton loaders; focus rings and
  `prefers-reduced-motion` support; broad accessibility passes (aria, semantics).
- Typed VidKing service (`src/lib/vidking.ts`): validated movie/TV embed URLs and
  a safe `postMessage` parser; rebuilt player with origin validation, throttled
  progress saving, **resume**, error UI + retry, and a dev diagnostics panel.
- Express backend (`server/`, deployable as a Vercel function): `/api/ai/chat`,
  `/api/ai/rank`, `/api/health`, dev `/api/diagnostics`; zod validation, rate
  limiting, CORS allow-list, JSON error envelope, secret-free request logging.
- AI copilot upgrade: backend Gemini proxy, response states, quick actions,
  per-user history, safe markdown, prompt-injection-resistant system prompt.
- Email/password and GitHub auth (alongside Google); account menu with sign out.
- Optimistic watchlist with toasts; **Continue Watching** row from saved progress.
- Typed, cached TMDB client with abortable search and a genre enum; Top Rated,
  Sci-Fi, Drama, and TV rows.
- Testing: Vitest + React Testing Library setup with 42 unit/component tests,
  Playwright e2e scaffold, and a GitHub Actions CI workflow.
- Documentation: rewritten README, this changelog, CONTRIBUTING, and
  STREAMING_DEBUG.

### Changed
- Moved all Gemini calls server-side; the client bundle no longer contains the AI
  SDK or key. Removed the build-time key injection from `vite.config.ts`.
- Split `lint` (ESLint) from `typecheck` (tsc); added real ESLint flat config.

### Fixed
- **Streaming progress bug:** events were read from the wrong (top) level of the
  `PLAYER_EVENT` payload, so saved progress was always `0`; now read from
  `data.*` and validated by origin and shape.

### Removed
- Dead code (`searchContent`, `generateAIPick`) and fake/placeholder UI (random
  progress bars, hardcoded "PREMIUM"/"4K Ultra HD" badges, non-functional mic
  button).
