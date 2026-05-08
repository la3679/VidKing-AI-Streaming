import React, { useEffect, useRef } from 'react';
import { X, Maximize, Settings, RotateCcw, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';

interface PlayerProps {
  tmdbId: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  onClose: () => void;
}

export const Player = ({ tmdbId, type, season = 1, episode = 1, onClose }: PlayerProps) => {
  const { saveProgress } = usePlayerStore();
  const { user } = useAuthStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embedUrl = type === 'movie' 
    ? `https://www.vidking.net/embed/movie/${tmdbId}?color=e50914&autoPlay=true`
    : `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true`;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check for the message source if possible, 
      // but VidKing documentation says to listen for PLAYER_EVENT
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === "PLAYER_EVENT" && user) {
          console.log("VidKing Player Event:", data);
          // Save progress to Firebase
          saveProgress(user.uid, {
            tmdbId,
            type,
            season,
            episode,
            progress: data.progress || 0,
            duration: data.duration || 0,
            timestamp: data.currentTime || 0
          });
        }
      } catch (e) {
        // Not all messages are from the player or valid JSON
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [user, tmdbId, type, season, episode, saveProgress]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      {/* Player Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
          <span className="font-bold">Back</span>
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-tight">Now Playing</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest">{type} {type === 'tv' && `• S${season} E${episode}`}</p>
        </div>

        <button 
          onClick={onClose}
          className="p-3 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Frame Container */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
        />
        
        {/* Overlay to catch clicks if needed, though VidKing handles it */}
        <div className="absolute inset-0 pointer-events-none border-[12px] border-black/50" />
      </div>

      {/* Modern Controls Bar (Optional overlay if VidKing allows customization) */}
      <div className="bg-black/90 p-4 border-t border-white/5 flex items-center justify-center gap-8">
        <div className="flex items-center gap-6 text-white/40">
          <Volume2 className="w-5 h-5" />
          <Settings className="w-5 h-5" />
          <Maximize className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};
