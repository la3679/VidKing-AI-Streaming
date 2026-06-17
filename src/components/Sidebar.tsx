import { Home, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';
import { useUIStore } from '../store/useUIStore';
import { BrandLogo } from './BrandLogo';

export const Sidebar = () => {
  const { toggleAssistant, setSelectedMedia, isWatchlistOpen, setIsWatchlistOpen } = useUIStore();
  return (
    <nav className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-12 bg-black shrink-0 h-full z-50">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] cursor-pointer"
        aria-label="VidKing home"
      >
        <BrandLogo size={48} />
      </motion.div>
      
      <div className="flex flex-col gap-10 mt-4">
        <button
          type="button"
          onClick={() => {
            setSelectedMedia(null);
            setIsWatchlistOpen(false);
          }}
          aria-label="Home"
          className="group relative flex items-center justify-center cursor-pointer"
        >
          <Home className={isWatchlistOpen ? 'sidebar-icon' : 'sidebar-icon-active'} aria-hidden="true" />
          <span className="absolute left-16 bg-brand text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase font-black z-50">Home</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedMedia(null);
            setIsWatchlistOpen(!isWatchlistOpen);
          }}
          aria-label="My list"
          aria-pressed={isWatchlistOpen}
          className="group relative flex items-center justify-center cursor-pointer"
        >
          <Bookmark className={isWatchlistOpen ? 'sidebar-icon-active' : 'sidebar-icon'} aria-hidden="true" />
          <span className="absolute left-16 bg-white/10 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase font-black whitespace-nowrap z-50">My List</span>
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-8">
        <button
          type="button"
          onClick={toggleAssistant}
          aria-label="Open AI copilot"
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-purple-600 p-0.5 cursor-pointer hover:scale-110 transition-transform shadow-[0_0_20px_rgba(220,38,38,0.2)]"
        >
          <span className="w-full h-full bg-black rounded-[10px] overflow-hidden flex items-center justify-center text-[10px] font-black italic">AI</span>
        </button>
      </div>
    </nav>
  );
};
