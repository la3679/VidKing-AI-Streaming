# Contributing

Thanks for your interest in improving VidKing AI Streaming.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in at least VITE_TMDB_API_KEY
npm run dev:all              # frontend + backend
```

## Workflow

1. Branch from `main`: `git checkout -b feature/your-change`.
2. Keep commits focused; use [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
3. Before pushing, make the quality gates pass:
   ```bash
   npm run typecheck && npm run lint && npm run test && npm run build
   ```
4. Open a PR into `main`. CI runs typecheck, lint, tests, and the build.

## Conventions

- **TypeScript first.** Prefer precise types; avoid `any` in new code.
- **No raw `console.*`** in app code — use `src/lib/logger.ts` (dev-gated).
- **Secrets stay server-side.** Never reference private keys in client code or
  commit real `.env` files.
- **State** lives in Zustand stores under `src/store`; shared logic in `src/lib`.
- **Tests** sit next to source as `*.test.ts(x)`; component tests use the
  `*.dom.test.tsx` suffix (jsdom).
- Match the surrounding code's style, naming, and comment density.

## Reporting issues

Include reproduction steps, expected vs. actual behavior, and your environment.
For streaming problems, check [STREAMING_DEBUG.md](STREAMING_DEBUG.md) first.
