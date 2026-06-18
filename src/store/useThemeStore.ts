import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'vk_theme';

function readStored(): Theme {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t === 'light' || t === 'dark') return t;
  } catch {
    /* storage unavailable */
  }
  return 'light'; // bright by default
}

function apply(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = readStored();
  apply(initial);
  return {
    theme: initial,
    setTheme: (t) => {
      apply(t);
      try {
        localStorage.setItem(STORAGE_KEY, t);
      } catch {
        /* ignore */
      }
      set({ theme: t });
    },
    toggle: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
  };
});
