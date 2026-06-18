# VidKing AI Streaming

[![CI](https://github.com/la3679/VidKing-AI-Streaming/actions/workflows/ci.yml/badge.svg)](https://github.com/la3679/VidKing-AI-Streaming/actions/workflows/ci.yml)

A modern, AI-enhanced **streaming discovery interface** built with **Vite + React 19 +
TypeScript**. It pairs the [TMDB](https://www.themoviedb.org/) catalog with
[VidKing](https://www.vidking.net/) embed playback, optional Firebase-backed auth /
watchlist / per-episode progress, an optional Google Gemini AI copilot (proxied through
a small backend so no AI key ships to the browser), and a vibrant, responsive UI with a
light/dark theme.

> **Project status:** portfolio / demo project. VidKing aggregates third-party streams,
> so title availability is outside this app's control. The app runs and degrades
> gracefully even when Firebase/AI keys are not configured.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Third-Party Setup](#third-party-setup)
  - [TMDB](#tmdb)
  - [Firebase](#firebase)
  - [Gemini (AI copilot)](#gemini-ai-copilot)
  - [VidKing streaming](#vidking-streaming)
- [TV Season & Episode Playback](#tv-season--episode-playback)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment (Vercel)](#deployment-vercel)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Attribution & Third-Party Services](#attribution--third-party-services)
- [Limitations](#limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

VidKing AI Streaming is a front end for discovering and watching movies and TV shows.
It's aimed at developers and recruiters who want to see a polished, production-style
React app, and at anyone who wants a clean discovery UI over public movie data.

What it does:

- **Movie & TV discovery** — trending, top-rated, and genre rows powered by TMDB.
- **Search** — debounced, request-cancelling multi-search across movies and TV.
- **Media detail views** — backdrop/trailer, rating, runtime, genres, cast, recommendations.
- **TV seasons & episodes** — a scrollable season selector and an episode picker that
  plays the exact selected season + episode.
- **AI copilot** — a streaming-focused assistant (when a Gemini key is configured).
- **Watchlist & progress** — saved to Firebase when signed in, with a localStorage fallback.
- **Vibrant, responsive UI** — light/dark themes, loading/empty/error states, accessible controls.

What makes it different from a typical clone: a deliberately **original, warm, vibrant
visual identity** (not a dark Netflix look), graceful degradation when third-party keys
are missing, a **secure backend AI proxy** (the model key never reaches the browser),
and a real **per-episode** progress model.

## Live Demo

Live demo: **not configured yet.** (No deployment URL is committed in this repo. See
[Deployment (Vercel)](#deployment-vercel) to host your own.)

## Screenshots

> **TODO:** screenshots are not included in the repository yet. Add images under an
> `assets/` (or `docs/screenshots/`) folder and link them here. No broken image links
> are committed intentionally.

## Features

Only features that are actually implemented are listed.

- ✅ **Movie & TV discovery** — Trending, Top Rated, Action, Comedy, Sci-Fi, Horror,
  Drama, and popular TV rows.
- ✅ **TMDB-powered metadata** — typed client with in-memory caching and a genre enum.
- ✅ **Search** — debounced + `AbortController`-cancelled multi-search.
- ✅ **Media detail modal** — trailer (YouTube IFrame API), rating, year, runtime,
  genres, cast (opens actor profile), recommendations.
- ✅ **Actor / person profile** — bio, framed portrait, filmography.
- ✅ **TV season selector** — scrollable strip (chevrons, fade edges, arrow-key nav)
  that keeps the selected season in view; works for shows with many seasons.
- ✅ **Episode list** — per-season episodes with still, number, title, runtime, air
  year, rating, overview, and a Watch action.
- ✅ **Exact episode playback** — VidKing embed for the precise show/season/episode.
- ✅ **VidKing embed player** — origin-validated `postMessage` handling, resume support,
  load-timeout + retry, and a dev diagnostics overlay.
- ✅ **Mute / unmute** of the detail-modal trailer via the YouTube IFrame API.
- ✅ **Firebase Auth** — Google, GitHub, and email/password (when configured).
- ✅ **Avatar & account menu** — keyed off the auth user; resilient to Firestore being unavailable.
- ✅ **Watchlist & likes** — Firestore-backed with a **localStorage fallback** that persists across reloads.
- ✅ **Per-episode progress** — progress keys include season + episode (S1E1 ≠ S1E2);
  Continue Watching row.
- ✅ **AI copilot** — Gemini-backed assistant with thinking/success/error/unavailable
  states and per-user history (when configured).
- ✅ **Privacy, Terms, and Help** — real in-app pages reachable from the footer.
- ✅ **Vibrant light/dark theme** — gradient canvas, theme toggle persisted to localStorage.
- ✅ **Cinematic brand intro** — original SVG logo reveal, once per session, reduced-motion aware.
- ✅ **Loading / empty / error states** — skeletons, retryable errors, app-level error boundary.
- ✅ **Accessibility** — semantic controls, ARIA labels, visible focus, reduced-motion support.

## Tech Stack

| Area | Technology |
| --- | --- |
| Build / UI | Vite 6, React 19, TypeScript 5.8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), Motion (Framer Motion), `tailwind-merge`, `clsx` |
| State | Zustand |
| Data | TMDB API (via `axios`) |
| Auth & persistence | Firebase Auth + Firestore (optional) |
| AI | Google Gemini via `@google/genai`, proxied by an Express backend (optional) |
| Backend | Express 4 (+ `cors`, `express-rate-limit`, `zod`) — runs standalone in dev and as a Vercel serverless function |
| Streaming | VidKing iframe embeds |
| Markdown | `react-markdown` (safe AI message rendering) |
| Testing | Vitest, Testing Library (`@testing-library/react`, `jest-dom`, `user-event`), jsdom, Playwright (e2e scaffold) |
| Tooling | ESLint (flat config), `tsx`, `concurrently` |
| Deploy / CI | Vercel config + GitHub Actions CI |

> Note: `react-router-dom` is installed but the current app uses **state-driven view
> switching** (Zustand) rather than URL routes. Treat it as available, not yet wired.

## Architecture

- **Frontend (SPA).** A single `App` shell (sidebar + header + content area) switches
  between views (home, search, watchlist/library, legal pages) via UI state in
  `useUIStore`. Modals (details, actor profile, player, auth) render as overlays.
- **Service layer (`src/lib`).** `tmdb.ts` (typed TMDB client + cache + genre enum +
  TV season/episode helpers), `vidking.ts` (embed URL builder + `postMessage`
  parser/guards), `api.ts` (typed client for the backend), `youtube.ts` (trailer
  controls), `env.ts` (validated env access), plus `errors`, `logger`, `format`,
  `validation`, `localPersist`, `ranking`.
- **State management (`src/store`).** Zustand stores: `useAuthStore`, `useUIStore`,
  `useWatchlistStore`, `usePlayerStore`, `useToastStore`, `useThemeStore`.
- **Auth & data persistence.** Firebase Auth + Firestore when configured. Likes and
  watchlist write to Firestore and **fall back to `localStorage`** (keyed by uid), so
  they keep working and persist across reloads even if Firestore is unavailable.
- **Player integration.** `Player.tsx` builds the VidKing embed URL, validates
  `postMessage` events by origin **and** shape, resumes from saved position, throttles
  progress saves, and shows a clear error + retry if the embed stalls.
- **AI assistant flow.** The client (`api.ts` / `AIAssistant.tsx`) calls the backend
  `/api/ai/*`; the Express server (`server/`) holds the Gemini key and calls
  `@google/genai`. The key is **never** bundled into the client.
- **TV season/episode flow.** `getTvSeasons` orders seasons (Specials last);
  `getTvSeasonDetails` loads episodes (cached, with stale-response protection);
  `TvEpisodes.tsx` renders the selector + list and routes the exact episode to the player.
- **Environment/config gating.** `src/lib/env.ts` validates client config (including the
  Firebase Web API key format) and surfaces a non-blocking banner when something is
  missing — the app never hard-crashes on absent config.
- **Graceful behavior.** Missing TMDB key → content shows a clear error/retry; missing
  Firebase → browsing works, auth/cloud-sync disabled; missing Gemini → the copilot
  reports "unavailable" instead of failing silently.

## Project Structure

```bash
.
├── api/
│   └── [...path].ts          # Vercel serverless entry → delegates to the Express app
├── server/                   # Express backend (AI proxy, health/diagnostics)
│   ├── app.ts                # app factory (CORS, rate limit, JSON error envelope)
│   ├── index.ts              # standalone dev server
│   ├── load-env.ts           # loads .env.local then .env (dev only)
│   ├── env.ts                # server-side env validation (holds GEMINI_API_KEY)
│   ├── lib/                  # gemini.ts, ranking.ts
│   ├── routes/               # ai.ts (/api/ai/chat, /api/ai/rank), health.ts
│   └── middleware/           # errors.ts
├── src/
│   ├── components/           # UI: Hero, MovieRow, MovieDetails, TvEpisodes, Player,
│   │   │                     #     AIAssistant, ActorProfile, Sidebar, Navbar, Toaster…
│   │   ├── icons/            # original SVG control icons
│   │   └── states/           # EmptyState, ErrorState, Skeleton
│   ├── hooks/                # useEscapeKey, usePrefersReducedMotion
│   ├── lib/                  # tmdb, vidking, api, youtube, env, errors, logger, …
│   ├── store/                # Zustand stores (auth, ui, watchlist, player, toast, theme)
│   ├── types/                # shared TypeScript types
│   ├── test/                 # Vitest setup
│   ├── App.tsx               # app shell + view switching
│   ├── main.tsx              # entry (ErrorBoundary, EnvBanner, BrandIntro)
│   └── index.css             # Tailwind v4 theme tokens (light/dark) + utilities
├── docs/                     # AUDIT, INTERACTION_QA, TV_EPISODE_QA, LEGAL_HELP_QA, …
├── e2e/                      # Playwright specs
├── .github/workflows/ci.yml  # CI: typecheck · lint · test · build
├── firestore.rules           # user-scoped Firestore security rules
├── firebase.json             # Firestore rules deploy config
├── vercel.json               # SPA + /api routing
├── vite.config.ts            # Vite + dev /api proxy
├── vitest.config.ts          # test config (jsdom for *.dom.test)
└── STREAMING_DEBUG.md         # VidKing integration & troubleshooting notes
```

## Getting Started

### Prerequisites

- **Node.js 20+** and npm.
- A **TMDB API key** (required for content). Firebase and Gemini are optional.

### Install & run

```bash
git clone https://github.com/la3679/VidKing-AI-Streaming.git
cd VidKing-AI-Streaming
npm install

cp .env.example .env.local   # then fill in at least VITE_TMDB_API_KEY

# Frontend + backend together (recommended):
npm run dev:all              # web on http://localhost:3000, API on http://localhost:8787

# Or frontend only:
npm run dev
```

Open <http://localhost:3000>. In dev, requests to `/api` are proxied to the Express server.

## Environment Variables

Copy [`.env.example`](.env.example) to `.env.local` (gitignored — **never commit it**)
and use real values. Use placeholders in any committed file.

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `VITE_TMDB_API_KEY` | client | **yes** | TMDB catalog & search (v3 key) |
| `TMDB_READ_ACCESS_TOKEN` | server | no | TMDB v4 token, reserved for an optional backend proxy |
| `VITE_API_BASE_URL` | client | no | Backend base URL (empty = same-origin `/api`) |
| `VITE_VIDKING_ORIGIN` | client | no | Trusted player origin (default `https://www.vidking.net`) |
| `VITE_ENABLE_PLAYER_DEBUG` | client | no | Show the dev player diagnostics panel |
| `VITE_FIREBASE_API_KEY` | client | no¹ | Firebase **Web API key** — must start with `AIza…` (not the App ID) |
| `VITE_FIREBASE_AUTH_DOMAIN` / `_PROJECT_ID` / `_APP_ID` | client | no¹ | Firebase web config |
| `VITE_FIREBASE_STORAGE_BUCKET` / `_MESSAGING_SENDER_ID` / `_MEASUREMENT_ID` | client | no | Firebase web config (analytics uses measurementId) |
| `GEMINI_API_KEY` | **server** | no | Gemini key for the AI proxy — never exposed to the client |
| `GEMINI_CHAT_MODEL` / `GEMINI_EMBED_MODEL` | server | no | Model overrides (defaults: `gemini-2.5-flash`, `gemini-embedding-001`) |
| `ALLOWED_ORIGINS` | server | no | Comma-separated CORS allow-list |
| `PORT` | server | no | Express dev port (default `8787`) |

¹ Without valid Firebase config the app still runs; sign-in, watchlist, and progress are
disabled and a banner explains what's missing.

## Third-Party Setup

### TMDB

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/) and request an
   API key (Settings → API).
2. Put the **v3 key** in `VITE_TMDB_API_KEY`.

### Firebase

Optional — enables sign-in, watchlist, and cloud progress.

1. Create a Firebase project and a **Web app**; copy the web config into `VITE_FIREBASE_*`
   (the `apiKey` starts with `AIza…` — don't paste the App ID).
2. **Authentication → Sign-in method:** enable **Google**, **GitHub**, and/or
   **Email/Password**.
3. **Authentication → Settings → Authorized domains:** add `localhost` and your deploy domain.
4. **Firestore:** create the database and deploy the rules:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules --project <your-project-id>
   ```
   Rules ([`firestore.rules`](firestore.rules)) are default-deny and strictly user-scoped.

### Gemini (AI copilot)

Optional — enables the assistant and AI ranking.

1. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Set `GEMINI_API_KEY` (**server-side only** — never `VITE_`-prefixed).
3. The client calls the backend `/api/ai/*`; the key stays on the server.

### VidKing streaming

Playback is an `<iframe>` to VidKing's embed endpoint — no key needed. Full integration
notes and troubleshooting are in [STREAMING_DEBUG.md](STREAMING_DEBUG.md).

- Movie: `https://www.vidking.net/embed/movie/{tmdbId}`
- TV: `https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}`
- Query params: `color` (hex, no `#`), `autoPlay`, `nextEpisode`, `episodeSelector` (TV),
  `progress` (resume seconds). `postMessage` events are validated by origin and shape.

## TV Season & Episode Playback

Opening a TV title shows an **Episodes** section:

1. **Seasons** render as a horizontally scrollable tab strip (chevron buttons + fade edges
   when it overflows, arrow-key navigation, Specials sorted last). The selected season is
   always kept in view.
2. Selecting a season loads that season's episodes from
   `GET /tv/{id}/season/{n}` (cached, with stale-response protection), each shown with its
   still, number, title, runtime, air year, rating, and overview.
3. **Watch** on an episode opens the VidKing player for that exact
   `tmdbId` / `season` / `episode`.
4. **Progress is saved per episode** — the Firestore doc id is `{tmdbId}_s{season}_e{episode}`,
   so different episodes never overwrite each other. Movies use the bare TMDB id.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server (port 3000) |
| `npm run dev:all` | Frontend + Express backend together |
| `npm run server:dev` | Backend only (watch mode) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | TypeScript checks (client + server) |
| `npm run lint` | ESLint |
| `npm run test` | Unit + component tests (Vitest) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Tests with V8 coverage |
| `npm run test:e2e` | Playwright e2e (`npx playwright install` first) |

## Testing

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Vitest + Testing Library + jsdom cover the VidKing URL builder & event parser, the API
client, TMDB helpers (incl. TV season ordering), the YouTube control helper, format /
validation utilities, the toast/auth/theme stores, per-episode progress keys, and
components (EmptyState/ErrorState, Navbar auth states, AIAssistant, ActorProfile,
TvEpisodes selection incl. the final-season case, LegalPages). A Playwright e2e scaffold
lives in `e2e/`. CI runs typecheck → lint → test → build on every push/PR to `main`
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Deployment (Vercel)

The app deploys as a static SPA plus one serverless function:

1. Import the repo into Vercel.
2. Add environment variables (Project → Settings → Environment Variables):
   `VITE_TMDB_API_KEY`, the `VITE_FIREBASE_*` set, and server-side `GEMINI_API_KEY` +
   `ALLOWED_ORIGINS` (your Vercel URL).
3. Deploy. [`vercel.json`](vercel.json) routes `/api/*` to
   [`api/[...path].ts`](api/%5B...path%5D.ts) (the Express app) and serves the SPA for
   everything else.

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| "Configuration incomplete" banner | Missing `VITE_TMDB_API_KEY` / `VITE_FIREBASE_*` — fill in `.env.local`. |
| Content rows fail to load | Invalid/absent TMDB key, or network. Retry; check the key. |
| Sign-in fails (`auth/configuration-not-found`) | Enable the provider in Firebase Auth and add your domain to Authorized domains. |
| Sign-in fails (`auth/invalid-api-key`) | `VITE_FIREBASE_API_KEY` must be the Web API key (`AIza…`), not the App ID. |
| AI copilot says "unavailable" | `GEMINI_API_KEY` not set on the server, or the backend isn't running (`npm run dev:all`). |
| "Unable to load stream" | Title unavailable on VidKing, an ad blocker, or a network block. Use Retry; see [STREAMING_DEBUG.md](STREAMING_DEBUG.md). |
| Watchlist/likes don't sync to cloud | Firebase not configured — they still work and persist via `localStorage`. |

## Security Notes

- The **Gemini key is server-only**; the client bundle contains no AI SDK or key.
- VidKing `postMessage` events are validated by **origin and shape**.
- Backend inputs are validated with **zod**; **rate limiting** and a **CORS allow-list**
  protect the AI endpoints; errors return a JSON envelope (no stack traces in production).
- AI markdown is rendered without raw HTML; the system prompt resists prompt injection.
- Firestore rules are default-deny and **user-scoped**.
- `.env*` is gitignored; only `.env.example` (placeholders) is committed. **Rotate any key
  that has ever been shared.**

## Attribution & Third-Party Services

- This product uses the **TMDB API but is not endorsed or certified by TMDB.** Movie and
  TV metadata and images are provided by [TMDB](https://www.themoviedb.org/).
- Streaming/embed playback is provided by the third-party **VidKing** service.
- Optional services: **Firebase** (auth + Firestore) and **Google Gemini** (AI copilot).

## Limitations

- VidKing aggregates third-party sources; specific titles/episodes may be unavailable or
  region-restricted, and ad blockers can interfere with the embed.
- The AI copilot recommends from model knowledge and does not assert live availability.
- Navigation is state-driven (no deep links / shareable URLs yet).
- The production bundle ships as a single large chunk (functional; flagged by Vite).
- Full signed-in playback/persistence requires Firebase to be fully set up.

## Roadmap

- URL-based routing & deep links (`react-router-dom`).
- Code-splitting the player/assistant to shrink the initial bundle.
- TMDB-grounded AI recommendations (tool calling) + server-side rec caching.
- Richer search filters (year / rating / genre facets).
- Expanded Playwright coverage in CI; screenshots in the README.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow.
In short: branch from `main`, use Conventional Commits, make the gates pass
(`npm run typecheck && npm run lint && npm run test && npm run build`), then open a PR.

## License

**No license specified yet.** Without a license, default copyright applies and others have
no explicit permission to use, modify, or distribute the code. Consider adding a
`LICENSE` file (e.g. MIT) if you intend this to be open source.
