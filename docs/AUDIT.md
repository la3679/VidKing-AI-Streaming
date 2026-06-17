# Project Audit — VidKing AI Streaming

_Baseline audit captured at the start of the production-readiness overhaul._

## Stack

Vite 6 · React 19 · TypeScript 5.8 · Tailwind CSS v4 (CSS-first) · Zustand 5 ·
Firebase (Auth + Firestore) · TMDB API · Google Gemini (`@google/genai`) ·
VidKing iframe embeds · Motion (Framer Motion). Originated as a Google AI
Studio applet (`firebase-applet-config.json`).

## Baseline state (before changes)

- `tsc --noEmit`: passes.
- `vite build`: succeeds; single JS chunk ~1.30 MB (gzip ~339 kB) — large-bundle
  warning, no code splitting.
- Tests: none. CI: none. ESLint: none (the `lint` script aliased `tsc`).

## Findings

### Streaming (highest priority)
- **Broken progress events.** VidKing emits `{ type: "PLAYER_EVENT", data: { event,
  currentTime, duration, progress, ... } }` (nested). `Player.tsx` read
  `data.progress` / `data.currentTime` off the top level, so saved progress was
  always `0`/undefined.
- **No `event.origin` validation** on the `message` listener (security gap).
- **No resume.** VidKing supports a `progress` (start-seconds) query param; unused.
- Embed URLs themselves are correct (`/embed/movie/{id}`, `/embed/tv/{id}/{s}/{e}`).
- Decorative, non-functional controls bar overlaid on the iframe.

### Security
- Gemini key bundled into the client via `vite.config.ts` `define`
  (`process.env.GEMINI_API_KEY`) — exposed to anyone.
- AI calls made directly from the browser.

### Architecture / quality
- No router (modal-based SPA via `useUIStore`); no deep links.
- No error boundary — a render error blanked the page.
- App crashed paths when Firebase/TMDB env vars were missing.
- Dead code: unused `searchContent` (tmdb), unused `generateAIPick` (gemini).
- Placeholder/fake UI: random progress bar (`Math.random() > 0.7`), hardcoded
  "PREMIUM"/"4K Ultra HD" badges, Netflix network id used for "VidKing Originals".
- `console.*` used directly throughout (no dev/prod gating).
- Suspect Gemini model IDs (`gemini-3-flash-preview`, etc.) — to verify.
- Accessibility minimal: no aria-labels on icon buttons, no modal focus trap.

### Auth
- Google sign-in works; GitHub and email/password buttons are unwired (dead UI).

## Remediation plan

Tracked across nine feature branches (see the project plan). This branch
(`feature/project-audit-and-foundation`) establishes:

- Typed, validated env config (`src/lib/env.ts`) + graceful missing-config banner.
- Shared utilities: `logger`, `errors`, `format`, `validation`.
- App-level `ErrorBoundary`.
- Resilient Firebase init (env-driven, never crashes on missing config).
- Dead-code removal and honest metadata (package name, page title).
- Real ESLint flat config; split `lint` (eslint) and `typecheck` (tsc) scripts.
