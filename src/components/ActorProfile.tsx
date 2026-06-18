import { useEffect, useState } from 'react';
import { X, Play, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { getImageUrl, getPersonDetails, getPersonCredits } from '../lib/tmdb';
import { useUIStore } from '../store/useUIStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { logger } from '../lib/logger';

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
        setCredits(
          actorCredits.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0)),
        );
      } catch (err) {
        logger.error('Error fetching actor data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActorData();
  }, [selectedActorId]);

  useEscapeKey(() => setSelectedActorId(null), Boolean(selectedActorId));

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
        role="dialog"
        aria-modal="true"
        aria-label="Actor profile"
      >
        <button
          onClick={() => setSelectedActorId(null)}
          aria-label="Close actor profile"
          className="absolute top-6 right-6 z-50 p-3 bg-black/60 hover:bg-brand rounded-full text-white transition-all transform hover:rotate-90"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="pb-20">
              {/* Header: portrait card over a blurred backdrop fill so the
                  full face is always visible (portrait images are no longer
                  cropped to the hairline by a wide cinematic band). */}
              <div className="relative">
                <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                  {details?.profile_path && (
                    <img
                      src={getImageUrl(details.profile_path, 'w780')}
                      alt=""
                      className="w-full h-full object-cover scale-110 blur-2xl opacity-25"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/85 to-surface/50" />
                </div>

                <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 px-6 sm:px-10 lg:px-12 pt-16 pb-8">
                  {/* Portrait card — face framed, never distorted */}
                  <div className="w-32 sm:w-44 lg:w-52 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border border-line shadow-2xl bg-panel flex items-center justify-center">
                    {details?.profile_path ? (
                      <img
                        src={getImageUrl(details.profile_path, 'w500')}
                        alt={details?.name || 'Portrait'}
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-4xl font-display font-black text-muted">
                        {(details?.name || '?')
                          .split(' ')
                          .map((w: string) => w[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                    )}
                  </div>

                  {/* Name + metadata */}
                  <div className="text-center sm:text-left min-w-0">
                    <motion.h2
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tighter uppercase mb-3 break-words"
                    >
                      {details?.name}
                    </motion.h2>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-muted">
                      {[details?.known_for_department, details?.place_of_birth, details?.birthday]
                        .filter(Boolean)
                        .map((item: string, i: number) => (
                          <span key={i} className="flex items-center gap-3">
                            {i > 0 && <span className="w-1 h-1 rounded-full bg-brand" />}
                            <span>{item}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="px-6 sm:px-10 lg:px-12 py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4">Biography</h3>
                    <p className="text-lg leading-relaxed text-muted font-medium">
                      {details?.biography || "No biography available for this artist."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted mb-8 font-sans">Full Filmography ({credits.length} Titles)</h3>
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
                          <div className="aspect-[2/3] rounded-xl overflow-hidden border border-line group-hover:border-brand/50 transition-all mb-3 relative shadow-xl">
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
                          <div className="text-[9px] text-muted uppercase tracking-widest mt-1">
                            {work.character ? `as ${work.character}` : (work.release_date || work.first_air_date || '').split('-')[0]}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                   <div className="bento-card p-8 border-line bg-panel">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-6">Artist Metrics</h4>
                      <div className="space-y-6">
                         <div>
                            <div className="text-[9px] text-muted uppercase font-black tracking-widest mb-1">Global Popularity</div>
                            <div className="text-3xl font-black italic text-white">{Math.round(details?.popularity)}</div>
                         </div>
                         <div>
                            <div className="text-[9px] text-muted uppercase font-black tracking-widest mb-1">Known For</div>
                            <div className="text-lg font-black text-white/90">{details?.known_for_department}</div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-4">External Links</h4>
                      {details?.imdb_id && (
                        <a 
                          href={`https://www.imdb.com/name/${details.imdb_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-panel rounded-xl border border-line hover:bg-panel transition-colors group"
                        >
                          <span className="text-xs font-black uppercase tracking-widest text-muted group-hover:text-white">IMDb Profile</span>
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
