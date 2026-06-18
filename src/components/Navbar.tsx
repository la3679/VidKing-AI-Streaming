import { useState } from 'react';
import { Sparkles, LogOut, Bookmark } from 'lucide-react';
import { SearchIcon } from './icons';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { toast } from '../store/useToastStore';

/** Two-letter initials from a name or email, for the avatar fallback. */
function initialsFrom(name?: string | null, email?: string | null): string {
  const src = (name || email || 'U').trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export const TopHeader = () => {
  const { profile, user, loading, logout } = useAuthStore();
  const { toggleAssistant, searchQuery, setSearchQuery, setIsAuthOpen, setIsWatchlistOpen } =
    useUIStore();
  const { trackInteraction } = usePlayerStore();
  const { reset: resetWatchlist } = useWatchlistStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Always render from auth (`user`); enrich with the Firestore `profile` when
  // present. This is what fixes "Sign In persists after login / no avatar".
  const account = user
    ? {
        displayName: profile?.displayName || user.displayName || '',
        email: profile?.email || user.email || '',
        photoURL: profile?.photoURL || user.photoURL || '',
      }
    : null;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (user && query.length > 3) {
      trackInteraction(user.uid, 'search', undefined, { query });
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    resetWatchlist();
    toast.success('Signed out');
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-3xl shrink-0 z-50">
      <div className="flex items-center gap-12">
        <div className="relative group max-w-xl">
          <label htmlFor="global-search" className="sr-only">Search movies and TV shows</label>
          <input
            id="global-search"
            type="search"
            placeholder="Search movies, TV shows, or genres..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full py-2.5 px-12 w-[220px] sm:w-[320px] lg:w-[540px] text-sm focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-white/20 font-medium"
          />
          <SearchIcon className="w-4 h-4 absolute left-4 top-3.5 text-white/30 group-focus-within:text-brand transition-colors pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={toggleAssistant}
          aria-label="Open AI copilot"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs font-black uppercase tracking-widest group"
        >
          <Sparkles className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="hidden lg:inline text-white/60 group-hover:text-white">Gen-AI Copilot</span>
        </button>

        <div className="h-6 w-[1px] bg-white/10 mx-2 hidden sm:block"></div>

        {loading ? (
          // Auth still initializing — show a placeholder, not "Sign In" (no flash).
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 animate-pulse" aria-hidden="true" />
        ) : account ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-4 group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <div className="text-[9px] text-white/30 uppercase font-black tracking-widest leading-none mb-1">Signed in</div>
                <div className="text-xs font-black tracking-tight max-w-[140px] truncate">{account.displayName || account.email || 'Member'}</div>
              </div>
              <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 overflow-hidden group-hover:border-brand/50 transition-all shadow-lg flex items-center justify-center">
                {account.photoURL ? (
                  <img src={account.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xs font-black">{initialsFrom(account.displayName, account.email)}</span>
                )}
              </div>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-64 glass-card bg-black/80 border-white/10 p-2 z-50 shadow-2xl"
                >
                  <div className="px-3 py-2.5 mb-1 border-b border-white/5">
                    <div className="text-sm font-black tracking-tight truncate">{account.displayName || 'Member'}</div>
                    {account.email && (
                      <div className="text-[11px] text-white/40 truncate">{account.email}</div>
                    )}
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsWatchlistOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Bookmark className="w-4 h-4" aria-hidden="true" /> My Library
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="btn-primary py-2 px-6 text-xs uppercase tracking-[0.2em]"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
