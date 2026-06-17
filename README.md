# VidKing — AI Streaming

A production-style movie & TV streaming front end with an AI copilot, built on
**Vite + React 19 + TypeScript**. It pairs the [TMDB](https://www.themoviedb.org/)
catalog with [VidKing](https://www.vidking.net/) embed playback, Firebase auth &
Firestore for watchlist/progress, and a small **Express** backend that proxies
Google Gemini so no AI key is ever shipped to the browser.

> This is a portfolio/demo project. VidKing aggregates third-party streams;
> availability is outside this app's control. See [Limitations](#limitations).

## Features

- **Browse & discover** — Trending, Top Rated, and genre rows (Action, Comedy,
  Sci-Fi, Horror, Drama) plus popular TV, powered by a typed, cached TMDB client.
- **Search** — debounced, request-cancelling multi-search across movies & TV.
- **Title details** — backdrop/trailer, rating, year, runtime, genres, cast, and
  recommendations, with Play and Watchlist actions.
- **VidKing player** — origin-validated `postMessage` handling, throttled progress
  saving, **resume from last position**, error UI with retry, and a dev diagnostics
  panel. See [STREAMING_DEBUG.md](STREAMING_DEBUG.md).
- **AI copilot** — streaming recommendations and plot help via a backend Gemini
  proxy, with thinking/success/error/unavailable states, quick actions, safe
  markdown rendering, and per-user history.
- **Accounts** — Google, GitHub, and email/password auth (Firebase).
- **Watchlist & Continue Watching** — optimistic updates, toasts, and a
  resume-friendly row sourced from saved progress.
- **Resilient UX** — skeleton loaders, empty/error states with retry, an app-level
  error boundary, a missing-config banner, accessible controls, and reduced-motion
  support.

## Tech stack

| Area      | Choice |
| --------- | ------ |
| Build/UI  | Vite 6, React 19, TypeScript 5.8 |
| Styling   | Tailwind CSS v4, Motion (Framer Motion) |
| State     | Zustand |
| Data      | TMDB API, Firebase Auth + Firestore |
| AI        | Google Gemini via Express proxy (`@google/genai`) |
| Streaming | VidKing iframe embeds |
| Testing   | Vitest, React Testing Library, Playwright (e2e) |
| CI/Deploy | GitHub Actions, Vercel |

## Architecture

```
Browser (React SPA)
  ├── lib/tmdb.ts        typed TMDB client (cache, abort, genre enum)
  ├── lib/vidking.ts     embed URL builder + postMessage parser/guards
  ├── lib/api.ts         typed client for the backend
  ├── lib/env.ts         validated, typed env access
  ├── store/*            Zustand stores (auth, ui, watchlist, player, toast)
  └── components/*        UI, states/, skeletons, player, assistant
        │
        │  /api/*  (Vite proxy in dev, same-origin on Vercel)
        ▼
Express backend (server/, deployed as a Vercel function via api/index.ts)
  ├── routes/ai.ts       /api/ai/chat, /api/ai/rank  (zod-validated)
  ├── routes/health.ts   /api/health, /api/diagnostics (dev)
  ├── lib/gemini.ts      server-only Gemini client (holds GEMINI_API_KEY)
  └── middleware/        CORS, rate limit, JSON error envelope
```

The Gemini key lives **only** on the server. Firebase reads/writes happen
client-side under Firestore security rules ([firestore.rules](firestore.rules)).

## Prerequisites

- Node.js 20+
- A [TMDB API key](https://www.themoviedb.org/settings/api)
- A Firebase project (Auth + Firestore) — optional; the app runs without it but
  sign-in, watchlist, and progress are disabled with a clear banner
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) — optional;
  the AI copilot degrades gracefully when absent

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill in values.

| Variable | Scope | Required | Purpose |
| -------- | ----- | -------- | ------- |
| `VITE_TMDB_API_KEY` | client | yes | TMDB catalog & search (v3 key) |
| `TMDB_READ_ACCESS_TOKEN` | server | no | TMDB v4 token, reserved for an optional backend proxy |
| `VITE_API_BASE_URL` | client | no | Backend base URL (empty = same-origin `/api`) |
| `VITE_VIDKING_ORIGIN` | client | no | Trusted player origin (default `https://www.vidking.net`) |
| `VITE_ENABLE_PLAYER_DEBUG` | client | no | Show the dev player diagnostics panel |
| `VITE_FIREBASE_API_KEY` | client | no* | Firebase **Web API key** — must start with `AIza...` (not the App ID) |
| `VITE_FIREBASE_AUTH_DOMAIN` / `_PROJECT_ID` / `_APP_ID` | client | no* | Firebase web config |
| `VITE_FIREBASE_STORAGE_BUCKET` / `_MESSAGING_SENDER_ID` / `_MEASUREMENT_ID` | client | no | Firebase web config (analytics uses measurementId) |
| `GEMINI_API_KEY` | **server** | no | Gemini key for the AI proxy — never exposed to the client |
| `GEMINI_CHAT_MODEL` / `GEMINI_EMBED_MODEL` | server | no | Model overrides |
| `ALLOWED_ORIGINS` | server | no | Comma-separated CORS allow-list |
| `PORT` | server | no | Express dev port (default `8787`) |

\* Without valid Firebase config the app still runs; auth/watchlist/progress are
disabled and a banner explains what's missing. `VITE_FIREBASE_API_KEY` is
validated to look like a real key (`AIza...`) — pasting the App ID by mistake is
detected and degrades gracefully instead of crashing.

### Deploying Firestore security rules

Rules live in [`firestore.rules`](firestore.rules) (default-deny, strictly
user-scoped). Deploy them with the Firebase CLI:

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project <your-project-id>
```

## Local development

```bash
npm install
# Frontend + backend together (recommended):
npm run dev:all      # web on :3000, API on :8787 (proxied at /api)
# Or run just the frontend:
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Vite dev server |
| `npm run dev:all` | Frontend + Express backend together |
| `npm run server:dev` | Backend only (watch mode) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript checks (client + server) |
| `npm run lint` | ESLint |
| `npm run test` | Unit + component tests (Vitest) |
| `npm run test:e2e` | Playwright e2e (`npx playwright install` first) |

## Deployment (Vercel)

The app deploys as a static SPA plus one serverless function:

1. Import the repo into Vercel.
2. Set env vars in the Vercel dashboard (`VITE_TMDB_API_KEY`, `VITE_FIREBASE_*`,
   and server-side `GEMINI_API_KEY`, `ALLOWED_ORIGINS`).
3. Deploy. [`vercel.json`](vercel.json) routes `/api/*` to
   [`api/index.ts`](api/index.ts) (the Express app) and serves the SPA for
   everything else.

## VidKing streaming

The integration and a full troubleshooting guide live in
[STREAMING_DEBUG.md](STREAMING_DEBUG.md), including verified embed URLs, the
`postMessage` event shape, resume behavior, and ad-blocker/availability notes.

## Testing

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

42 unit/component tests cover the VidKing URL builder & event parser, the API
client, TMDB helpers, format/validation utilities, the toast store, and the
EmptyState/ErrorState/AIAssistant components. CI runs the same gates on every
push/PR (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Security

- The Gemini key is server-only; the client bundle contains no AI SDK or key.
- VidKing `postMessage` events are validated by origin **and** shape.
- Backend inputs are validated with zod; rate limiting and a CORS allow-list
  protect the AI endpoints; errors return a JSON envelope (no stack traces in prod).
- AI markdown is rendered without raw HTML; the system prompt resists injection.
- `.env*` is gitignored; only `.env.example` (placeholders) is committed.

## Limitations

- VidKing aggregates third-party sources; specific titles may be unavailable or
  region-restricted, and ad blockers can interfere with the embed.
- The AI copilot recommends from model knowledge; it does not assert live
  streaming availability.
- Continue Watching fetches title art on demand (no server-side denormalization).

## Roadmap

- Route-based navigation & deep links (`react-router-dom`).
- TMDB-grounded AI recommendations (tool calling) and server-side rec caching.
- Richer search filters (year/rating/genre facets) and a dedicated genre view.
- Expanded Playwright coverage in CI.

## License

For demonstration/portfolio use.
