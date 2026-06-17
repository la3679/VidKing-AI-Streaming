# Interaction QA — Buttons & Controls

A full inventory of interactive controls, how each was verified, and its status.
Verified in a real browser (Vite preview) by driving the DOM and inspecting
state/labels, plus automated tests where noted. "No fake controls" — every
listed control either works, prompts correctly, or was made non-interactive.

Legend: ✅ works · 🔒 auth-gated (prompts sign-in) · 🧪 unit/component test ·
👁 manually verified in preview

## Navigation / shell
| Control | Status | Notes |
| --- | --- | --- |
| Sidebar logo | ✅ 👁 | Decorative brand mark; `aria-label` |
| Sidebar Home | ✅ 👁 | Resets to home, clears watchlist view |
| Sidebar My List | ✅ 👁 | Toggles library; `aria-pressed` |
| Sidebar AI copilot | ✅ 👁 | Opens assistant |
| Nav search input | ✅ 👁 | Debounced, cancels stale requests; branded search icon, `label` |
| Nav AI copilot button | ✅ 👁 | Opens assistant; `aria-label` |
| Sign In (guest) | ✅ 👁 | Opens auth modal |
| Account menu → Sign out | ✅ 👁 | Signs out, clears watchlist, toast |

## Auth modal
| Control | Status | Notes |
| --- | --- | --- |
| Continue with Google | 🔒 ✅ | Requires Google provider enabled in Firebase console |
| Continue with GitHub | 🔒 ✅ | Requires GitHub provider enabled |
| Email/password sign in & sign up | ✅ | Validated; normalized error toasts |
| Mode toggle (sign in/up) | ✅ | |
| Close (Esc / backdrop) | ✅ 👁 | |

## Home rows & cards
| Control | Status | Notes |
| --- | --- | --- |
| Media card (open details) | ✅ 👁 | Now keyboard-accessible (role=button, Enter/Space) |
| Card watchlist toggle | ✅ 🔒 | Button + `aria-pressed`; branded Add icon; guests → auth |
| Row "VIEW ALL" | ✅ | Now a button; runs the category search |
| Continue Watching tile | ✅ 👁 | Opens details (auto-resumes on play) |
| AI Picks "Refresh picks" | ✅ | Re-runs ranking |

## Details modal
| Control | Status | Notes |
| --- | --- | --- |
| Close | ✅ 👁 | Branded close icon; Esc; `aria-label` |
| Play | ✅ 👁 | Opens the VidKing player (auth-gated to play) |
| Add to / Remove from My List | ✅ 🔒 | Branded Add icon, `aria-pressed`; guests → auth |
| Like / Unlike | ✅ 🔒 🧪 👁 | Persists to `preferences.likedIds`; loading + rollback; guests → auth (verified: label "Sign in to like" opens modal) |
| Trailer mute/unmute | ✅ 🧪 👁 | YouTube IFrame API (no reload); `aria-pressed`; verified label flip + no iframe reload |
| Cast names | ✅ | Now buttons (keyboard-accessible) → open actor profile |
| Recommendation tiles | ✅ | Previously dead — now buttons that open the title |

## Actor profile
| Control | Status | Notes |
| --- | --- | --- |
| Close | ✅ 👁 | `aria-label`, visible/focusable |
| Filmography tiles | ✅ | Open the title |
| IMDb link | ✅ | Opens IMDb (`rel="noopener"`) when `imdb_id` present |

## Player
| Control | Status | Notes |
| --- | --- | --- |
| Back / Close | ✅ | `aria-label`; Esc |
| Diagnostics toggle | ✅ | Dev-only (`VITE_ENABLE_PLAYER_DEBUG`) |
| Retry (error state) | ✅ | Reloads the embed |

## AI assistant
| Control | Status | Notes |
| --- | --- | --- |
| Send | ✅ 🧪 👁 | Disabled when empty; verified |
| Quick-action chips | ✅ 🧪 | Send immediately |
| Retry (on error) | ✅ 🧪 | Re-sends last message |
| Clear conversation | ✅ | |
| Close | ✅ | `aria-label` |

## Footer
| Control | Status | Notes |
| --- | --- | --- |
| Privacy / Terms / Help | n/a | Not yet linked → rendered as non-interactive text (no fake links) |
| TMDB attribution link | ✅ | Opens themoviedb.org (`rel="noopener"`) |

## Automated coverage
53 tests (`npm run test`): VidKing URL/event parsing, API client states, TMDB
helpers, format/validation, YouTube control helper, toast store, likes
(add/remove/rollback/guest), state components, AIAssistant (success/error/disabled),
ActorProfile (image/fallback/close).

## Known external dependencies (not app bugs)
- Google/GitHub sign-in require enabling those providers in the Firebase console.
- Trailer audio obeys browser autoplay policy: it starts muted and unmutes on the
  user's click (handled via the IFrame API so it works within the gesture).
- VidKing stream availability is third-party; the player shows a retry/error UI.
