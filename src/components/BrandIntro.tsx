import { useCallback, useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const SESSION_KEY = 'vk_intro_seen';
const FULL_DURATION = 1900; // cinematic run (ms), within the 1.2–2.2s budget
const REDUCED_DURATION = 650; // simple fade for reduced-motion users
const LEAVE_DURATION = 450; // overlay fade-out

/** Reads "already shown this session"; defaults to not-seen if storage is unavailable. */
function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* storage unavailable (private mode) — intro simply shows again next load */
  }
}

/**
 * Cinematic, once-per-session brand intro. Renders as an overlay ABOVE the app
 * (which mounts underneath), so it never blocks content or causes layout shift —
 * it simply fades out to reveal the ready app. Honors prefers-reduced-motion,
 * is click/key-skippable, and self-removes. Original mark — no third-party brand.
 */
export const BrandIntro = () => {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(() => !hasSeenIntro());
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    setLeaving((alreadyLeaving) => {
      if (alreadyLeaving) return alreadyLeaving;
      window.setTimeout(() => setVisible(false), LEAVE_DURATION);
      return true;
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    markSeen();
    const hold = window.setTimeout(finish, reduced ? REDUCED_DURATION : FULL_DURATION);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(hold);
      window.removeEventListener('keydown', onKey);
    };
  }, [visible, reduced, finish]);

  if (!visible) return null;

  return (
    <div
      className={`brand-intro${leaving ? ' is-leaving' : ''}${reduced ? ' is-reduced' : ''}`}
      role="presentation"
      onClick={finish}
      aria-hidden="true"
    >
      <div className="brand-intro__glow" />
      <div className="brand-intro__logo">
        <BrandLogo size={132} animated={!reduced} />
        <div className="brand-intro__wordmark">
          VIDKING<span>AI</span>
        </div>
        <div className="brand-intro__sweep" />
      </div>
      <p className="brand-intro__hint">Click or press any key to skip</p>
    </div>
  );
};
