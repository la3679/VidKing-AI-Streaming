# TV Season / Episode QA

Verified against real TMDB data and the live app (Vite preview), plus automated tests.

## Update — scrollable season selector (many-season shows)

**Issue:** the season strip was a single horizontal row with `overflow-x-auto` +
`scrollbar-hide` and no scroll affordance, so with many seasons later seasons were
clipped off-screen and unreachable (especially with a mouse — no visible scrollbar,
no buttons).

**Fix:** a dedicated `SeasonTabs` strip that scrolls so every season is reachable —
chevron scroll buttons + fade edges when it overflows, the selected tab is kept in
view (`scrollIntoView`), roving arrow-key navigation (Arrow/Home/End), and the
selected season is also shown as a label next to the "Episodes" heading. Horizontal
scroll only (never traps modal/page vertical scroll); reduced-motion respected.

**Tested live with The Simpsons (TMDB 456 — 38 season tabs, scrollWidth 4468 vs
clientWidth 390):**
- All 38 season tabs render; strip overflows and shows chevrons. ✅
- Final tab (Specials) selectable → scrolled into view, 85 episodes loaded. ✅
- Middle season (Season 18) selectable → episode list updated; selected label shown. ✅
- Season 1 (first) selectable. ✅
- No horizontal page overflow; no console errors. ✅
- Watch routes the exact selected season/episode (e.g. `Watch season 18 episode 1`). ✅

## Data layer (TMDB)
- Endpoints used: `GET /tv/{id}` (seasons), `GET /tv/{id}/season/{n}` (episodes),
  `GET /tv/{id}/season/{n}/episode/{m}` (optional). Verified live with `/tv/1396`
  (Breaking Bad): 6 seasons incl. `season_number: 0` "Specials"; season 1 = 7
  episodes with `episode_number, name, overview, still_path, air_date, runtime,
  vote_average`.
- `orderSeasons` keeps non-empty seasons, orders ascending, Specials last (unit tested).
- Season details are cached; switching seasons is instant and stale responses are
  ignored via a per-request id guard.

## Manual QA (live)
| Check | Result |
| --- | --- |
| Movie Play still works | ✅ (movie flow unchanged; `Play` opens player) |
| TV details list seasons | ✅ Breaking Bad → 6 tabs (Season 1–5, Specials) |
| Select Season 1 loads its episodes | ✅ 7 episodes, first "Pilot" |
| Selecting another season updates list | ✅ Season 2 → 13 episodes (S2E1 "Seven Thirty-Seven" … S2E13 "ABQ") |
| Episodes show correct number + name | ✅ verified vs TMDB |
| Each episode has a Watch action | ✅ `aria-label="Watch season N episode M: <title>"` |
| Watch routes exact show/season/episode | ✅ `onWatch(season, episode, title)` → player (auto-tested) |
| Player URL uses correct TV id/season/episode | ✅ `buildEmbedUrl` → `/embed/tv/{id}/{s}/{e}` (unit tested; embed HTTP 200) |
| Progress saved separately per episode | ✅ `progressDocId` = `{id}_s{season}_e{episode}` (unit tested; S1E1 ≠ S1E2) |
| Player header shows show / S·E / episode title | ✅ |
| Back / Close / Retry | ✅ |
| Mobile / tablet / desktop layout | ✅ episode rows stack on mobile, no overflow |
| Theme vibrant, readable | ✅ warm canvas, dark ink text |
| Console / TypeScript / build | ✅ clean |

## Notes / limits
- Full signed-in playback inside the player requires Google sign-in (OAuth popup),
  which can't be automated headlessly. The selection→URL→progress-key pipeline is
  verified via live UI interaction + unit tests; the embed endpoint is reachable.
- VidKing availability is third-party; an unavailable episode shows the player's
  error + Retry.

## Automated coverage
`orderSeasons` (ordering/Specials/empty), `getTvSeasonDetails` (via TvEpisodes test),
season switch updates the list, Watch passes exact season/episode, `progressDocId`
per-episode keys, `buildEmbedUrl` TV format.
