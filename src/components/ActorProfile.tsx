import React, { useEffect, useState } from 'react';
import { X, Play, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { getImageUrl, getPersonDetails, getPersonCredits } from '../lib/tmdb';
import { useUIStore } from '../store/useUIStore';

export const ActorProfile = () => {
  const { selectedActorId, setSelectedActorId, setSelectedMedia } = useUIStore();
  const [details, setDetails] = useState<any>(null);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedActorId) return;

    const fetchActorData = async () => {
      setLoading(true);
      try {
        const [actorDetails, actorCredits] = await Promise.all([
          getPersonDetails(selectedActorId),
          getPersonCredits(selectedActorId)
        ]);
        setDetails(actorDetails);
        setCredits(actorCredits.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)));
      } catch (err) {
        console.error("Error fetching actor data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActorData();
  }, [selectedActorId]);

  if (!selectedActorId) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md"
      onClick={() => setSelectedActorId(null)}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-surface w-full max-w-6xl h-full max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={() => setSelectedActorId(null)}
          className="absolute top-6 right-6 z-50 p-3 bg-black/60 hover:bg-brand rounded-full text-white transition-all transform hover:rotate-90"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="pb-20">
              {/* Header section */}
              <div className="relative h-[400px]">
                <div className="absolute inset-0">
                  <img 
                    src={getImageUrl(details?.profile_path)} 
                    className="w-full h-full object-cover object-top"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
                </div>
                
                <div className="absolute bottom-0 left-0 p-12 w-full">
                  <motion.h2 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-6xl md:text-8xl font-display font-black tracking-tighter uppercase mb-4"
                  >
                    {details?.name}
                  </motion.h2>
                  <div className="flex items-center gap-6 text-sm font-black uppercase tracking-[0.2em] text-white/60">
                    <span>{details?.known_for_department}</span>
                    <span className="w-1 h-1 rounded-full bg-brand" />
                    <span>{details?.place_of_birth}</span>
                    <span className="w-1 h-1 rounded-full bg-brand" />
                    <span>{details?.birthday}</span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4">Biography</h3>
                    <p className="text-lg leading-relaxed text-white/70 font-medium">
                      {details?.biography || "No biography available for this artist."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-8 font-sans">Full Filmography ({credits.length} Titles)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {credits.slice(0, 20).map((work) => (
                        <motion.div 
                          key={work.id}
                          whileHover={{ y: -10 }}
                          className="group cursor-pointer"
                          onClick={() => {
                            setSelectedMedia(work);
                            setSelectedActorId(null);
                          }}
                        >
                          <div className="aspect-[2/3] rounded-xl overflow-hidden border border-white/5 group-hover:border-brand/50 transition-all mb-3 relative shadow-xl">
                            <img 
                              src={getImageUrl(work.poster_path, 'w342')} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              alt="" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-10 h-10 fill-current text-white" />
                            </div>
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black">
                               <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                               {work.vote_average?.toFixed(1)}
                            </div>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-tight line-clamp-1 group-hover:text-brand transition-colors">
                            {work.title || work.name}
                          </div>
                          <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1">
                            {work.character ? `as ${work.character}` : (work.release_date || work.first_air_date || '').split('-')[0]}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                   <div className="bento-card p-8 border-white/5 bg-white/[0.02]">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-6">Artist Metrics</h4>
                      <div className="space-y-6">
                         <div>
                            <div className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Global Popularity</div>
                            <div className="text-3xl font-black italic text-white">{Math.round(details?.popularity)}</div>
                         </div>
                         <div>
                            <div className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Known For</div>
                            <div className="text-lg font-black text-white/90">{details?.known_for_department}</div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">External Links</h4>
                      {details?.imdb_id && (
                        <a 
                          href={`https://www.imdb.com/name/${details.imdb_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white">IMDb Profile</span>
                          <span className="text-[10px] text-brand">↗</span>
                        </a>
                      )}
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
