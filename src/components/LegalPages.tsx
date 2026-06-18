import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { LegalPage } from '../store/useUIStore';

interface LegalPagesProps {
  page: LegalPage;
  onBack: () => void;
}

const TITLES: Record<LegalPage, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Use',
  help: 'Help & FAQ',
};

/** Small presentational helpers (kept local to this view). */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-display font-black tracking-tight text-ink">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed text-muted">{children}</div>
  </section>
);

const Faq = ({ q, children }: { q: string; children: React.ReactNode }) => (
  <div className="bento-card p-5">
    <h3 className="font-bold text-ink mb-1.5">{q}</h3>
    <div className="text-sm leading-relaxed text-muted space-y-2">{children}</div>
  </div>
);

/**
 * Real Privacy, Terms, and Help content rendered as a full in-app view.
 * Informational (not legal advice); includes the required TMDB attribution and
 * explains the third-party services the app relies on.
 */
export const LegalPages = ({ page, onBack }: LegalPagesProps) => {
  // Reflect the section in the document title (light SEO/UX touch).
  useEffect(() => {
    const prev = document.title;
    document.title = `${TITLES[page]} — VidKing`;
    return () => {
      document.title = prev;
    };
  }, [page]);

  return (
    <div className="pt-8 pb-16 max-w-3xl mx-auto">
      <button onClick={onBack} className="btn-secondary py-2 px-5 mb-8 gap-2">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Home
      </button>

      <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tighter uppercase mb-2">
        {TITLES[page]}
      </h1>
      <p className="text-xs text-muted uppercase tracking-[0.2em] font-black mb-10">
        Informational · Last reviewed 2026
      </p>

      {page === 'privacy' && <Privacy />}
      {page === 'terms' && <Terms />}
      {page === 'help' && <Help />}

      <div className="mt-12 pt-6 border-t border-line text-xs text-muted leading-relaxed">
        This product uses the TMDB API but is not endorsed or certified by TMDB. Movie and TV
        metadata and images are provided by{' '}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline underline-offset-2"
        >
          TMDB
        </a>
        .
      </div>
    </div>
  );
};

const Privacy = () => (
  <div className="space-y-8">
    <Section title="What VidKing is">
      <p>
        VidKing is an informational, demo/portfolio movie & TV discovery interface. It surfaces
        catalog data from third-party APIs and embeds playback from a third-party provider. It is
        not a content host and stores no media itself.
      </p>
    </Section>
    <Section title="Data that may be used">
      <ul className="list-disc pl-5 space-y-1">
        <li>Account/profile info (name, email, avatar) from Firebase sign-in, if you sign in.</li>
        <li>Your watchlist, likes, and playback progress, if you use those features.</li>
        <li>Search queries and AI copilot prompts you submit, to return results.</li>
        <li>Local/session storage for UI preferences (theme), the intro, and offline fallbacks.</li>
      </ul>
    </Section>
    <Section title="Third-party services">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Firebase</strong> (Google) — authentication and saved watchlist/progress.</li>
        <li><strong>TMDB</strong> — movie/TV metadata and images.</li>
        <li><strong>Google Gemini</strong> (via our backend) — the AI copilot, if enabled.</li>
        <li><strong>VidKing</strong> — the third-party video embed provider.</li>
      </ul>
      <p>
        TMDB data/images are provided by TMDB; this product is not endorsed or certified by TMDB.
      </p>
    </Section>
    <Section title="Cookies & local storage">
      <p>
        VidKing uses your browser's local and session storage for preferences (such as the theme),
        a once-per-session intro flag, and a resilient fallback for likes/watchlist. Firebase may
        set storage to keep you signed in.
      </p>
    </Section>
    <Section title="Your control">
      <ul className="list-disc pl-5 space-y-1">
        <li>Sign out any time from the account menu.</li>
        <li>Clear your browser's local/session storage to remove local preferences and fallbacks.</li>
        <li>For questions, contact the project maintainer through the GitHub repository.</li>
      </ul>
    </Section>
    <Section title="A note">
      <p>This page is informational and is not formal legal advice.</p>
    </Section>
  </div>
);

const Terms = () => (
  <div className="space-y-8">
    <Section title="Acceptable use">
      <p>
        Use VidKing for personal, lawful discovery and viewing. Don't attempt to misuse, overload,
        scrape, or circumvent the service or its third-party providers.
      </p>
    </Section>
    <Section title="Content & availability">
      <ul className="list-disc pl-5 space-y-1">
        <li>Catalog metadata and images come from TMDB.</li>
        <li>
          Streaming/embed availability depends on the third-party provider (VidKing). Specific
          titles, seasons, or episodes may be unavailable or region-restricted.
        </li>
        <li>There is no guarantee of availability or uninterrupted playback.</li>
      </ul>
    </Section>
    <Section title="AI assistant">
      <p>
        The AI copilot is a convenience feature. It can be unavailable or imperfect and may produce
        inaccurate suggestions; it does not assert live streaming availability.
      </p>
    </Section>
    <Section title="Project status">
      <p>
        VidKing is a demo/portfolio project. These terms are informational and should be reviewed
        by a qualified professional before any production or commercial launch.
      </p>
    </Section>
  </div>
);

const Help = () => (
  <div className="space-y-4">
    <Faq q="How do I search?">
      <p>Use the search box in the header. Results update as you type and cover movies and TV shows.</p>
    </Faq>
    <Faq q="How do I play a movie?">
      <p>Open a movie, then press <strong>Play</strong>. You'll need to be signed in to start playback.</p>
    </Faq>
    <Faq q="How do I watch a TV episode?">
      <p>
        Open a TV show and scroll to <strong>Episodes</strong>. Pick a season from the tabs, then
        press <strong>Watch</strong> on the episode you want — the player opens that exact season
        and episode.
      </p>
    </Faq>
    <Faq q="How does season/episode selection work?">
      <p>
        Seasons are shown as tabs (Specials last). Selecting a season loads its episode list with
        titles, stills, runtime, and ratings. Your progress is saved per episode, so different
        episodes don't overwrite each other.
      </p>
    </Faq>
    <Faq q="Why might a stream fail?">
      <p>
        Playback is a third-party embed. A title may be temporarily unavailable, blocked by an ad
        blocker or privacy extension, or affected by your network. The player shows a clear error
        with a <strong>Retry</strong> option.
      </p>
    </Faq>
    <Faq q="How do I sign in?">
      <p>
        Press <strong>Sign In</strong> and choose Google, GitHub, or email/password. Sign-in requires
        the project's Firebase auth providers to be enabled and your domain authorized.
      </p>
    </Faq>
    <Faq q="How do watchlist & likes work?">
      <p>
        Use the + (My List) and heart (Like) controls. They save to your account when signed in, and
        fall back to local storage so they keep working and persist across reloads.
      </p>
    </Faq>
    <Faq q="The player won't load — ad blocker / player issues?">
      <p>
        Disable ad/privacy blockers for this site or try a clean browser profile, then press Retry.
        Make sure the page is served over HTTPS.
      </p>
    </Faq>
    <Faq q="Why is the AI assistant unavailable?">
      <p>
        The copilot needs a configured backend AI key. If it's not set, the assistant shows an
        "unavailable" message instead of failing silently.
      </p>
    </Faq>
    <Faq q="Troubleshooting (config & environment)">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Missing API config</strong> — a banner appears when TMDB/Firebase keys aren't set.</li>
        <li><strong>Stream unavailable</strong> — try another title/episode or Retry.</li>
        <li><strong>Auth domain not authorized</strong> — add your domain in the Firebase console.</li>
        <li><strong>Firebase disabled</strong> — browsing works; sign-in and cloud sync are off.</li>
        <li><strong>Network / ad blocker</strong> — disable blockers and check your connection.</li>
      </ul>
    </Faq>
    <Faq q="How do I report an issue?">
      <p>Open an issue or contact the project maintainer through the GitHub repository.</p>
    </Faq>
  </div>
);
