import { Search, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';

export const TopHeader = () => {
  const { profile, user } = useAuthStore();
  const { toggleAssistant, searchQuery, setSearchQuery, setIsAuthOpen } = useUIStore();
  const { trackInteraction } = usePlayerStore();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (user && query.length > 3) {
      trackInteraction(user.uid, 'search', undefined, { query });
    }
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
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-white/30 group-focus-within:text-brand transition-colors pointer-events-none" aria-hidden="true" />
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

        {profile ? (
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="text-right hidden sm:block">
              <div className="text-[9px] text-white/30 uppercase font-black tracking-widest leading-none mb-1">Authenticated</div>
              <div className="text-xs font-black tracking-tight">{profile.displayName || 'Discovery User'}</div>
            </div>
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 overflow-hidden group-hover:border-brand/50 transition-all shadow-lg flex items-center justify-center">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xs font-black">{profile.displayName?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
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
