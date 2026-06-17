# UI Audit & Design Foundation

Scope: UI/UX, motion, responsiveness, accessibility, and performance polish for
the VidKing streaming app. **No content/data changes** — copy, titles, and
TMDB-driven data are preserved exactly.

## Current state (strengths)
- Cohesive dark cinematic theme (brand red, Outfit/Inter type) via Tailwind v4 `@theme`.
- Existing focus-visible rings, `prefers-reduced-motion` neutralization, skeletons,
  empty/error states, and an app-level error boundary.
- Motion via the `motion` library, already installed.

## Weaknesses addressed in this effort
- No shared **motion/elevation/radius tokens** — magic values scattered in classes.
- No first-load brand moment (cinematic intro).
- Section/card entrances are immediate (no staggered reveal); hover states uneven.
- A few responsive rough edges on small screens (assistant panel, modals, rows).

## Foundation added (this branch)
Design tokens in `src/index.css` `@theme`:
- Radius: `--radius-card`, `--radius-pill`
- Shadows: `--shadow-soft`, `--shadow-card`, `--shadow-brand`
- Motion: `--ease-out-soft`, `--ease-in-out-soft`, `--dur-fast|base|slow`
- Z-index scale: `--z-nav|overlay|modal|player|toast` (documents existing layering)

Reusable utilities:
- `.reveal` — compositor-only (opacity/transform) entrance animation
- `.lift` — gentle hover elevation for cards/tiles

All new motion respects reduced-motion via the existing global media query.
