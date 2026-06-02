import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Share2, Heart, ChevronLeft, ChevronRight, Film, Users, X, Users2, Smile, ExternalLink, Calendar, MapPin, Play, HardDrive, Zap, FolderOpen, Flame, Server, Layers, Video, ChevronDown, Monitor } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';
import { useWatchHistory } from '../context/WatchHistoryContext';
import { useWatchParty } from '../context/WatchPartyContext';
import { useAuth } from '../context/AuthContext';
import { useDownloads } from '../context/DownloadsContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { cn } from '../lib/utils';
import { getTmdbLanguage, fetchPersonDetails, getImageUrl } from '../services/tmdb';
import { Sparkles } from 'lucide-react';
import CustomVideoPlayer from '../components/CustomVideoPlayer';

import { FastAverageColor } from 'fast-average-color';

const BASE_TMDB_URL = '/api/tmdb';

const SAMPLE_VIDEOS = [
  {
    name: 'Oceans (Vjs CDN)',
    nameAr: 'المحيطات والبحار الطبيعية',
    url: 'https://vjs.zencdn.net/v/oceans.mp4'
  },
  {
    name: 'Sintel (Fantasy CGI)',
    nameAr: 'العرض الخيالي - سينتيل',
    url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4'
  }
];

const FloatingEmoji: React.FC<{ emoji: string, id: number }> = ({ emoji, id }) => {
  const [randomX] = React.useState(() => Math.random() * 80 - 40);
  const [randomDelay] = React.useState(() => Math.random() * 0.2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x: randomX, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], y: -400, x: randomX + (Math.random() * 40 - 20), scale: [0.5, 1.5, 1.2, 1] }}
      transition={{ duration: 3, delay: randomDelay, ease: "easeOut" }}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 text-4xl pointer-events-none z-[600]"
    >
      {emoji}
    </motion.div>
  );
};

export default function Watch() {
  const { mediaType, id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, isRTL, language } = useLanguage();
  const isAr = language === 'ar';
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const { updateProgress, getProgress } = useWatchHistory();
  const { roomId, roomState, updateRoomState, leaveRoom, sendReaction } = useWatchParty();
  const { user } = useAuth();
  const { getDownloadStatus } = useDownloads();
  const { showToast } = useToast();
  const { settings } = useSettings();
  
  const season = searchParams.get('s') ? parseInt(searchParams.get('s')!) : undefined;
  const episode = searchParams.get('e') ? parseInt(searchParams.get('e')!) : undefined;
  const isTrailer = searchParams.get('trailer') === 'true';
  
  const downloadStatus = id ? getDownloadStatus(parseInt(id)) : undefined;
  const isOfflineAvailable = downloadStatus?.status === 'completed';

  const [movieData, setMovieData] = useState<any>(null);
  const [currentServer, setCurrentServer] = useState(0);
  const [plyrVideoUrl, setPlyrVideoUrl] = useState(SAMPLE_VIDEOS[0].url);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [reactions, setReactions] = useState<{ id: number, emoji: string }[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [serversOpen, setServersOpen] = useState(true);

  const availableReactions = ['❤️', '🔥', '😂', '😮', '😢', '🎬', '👏', '👻'];

  useEffect(() => {
    if (roomState?.lastReaction) {
      const { emoji, timestamp } = roomState.lastReaction;
      // Only show if it's new (last 2 seconds)
      if (Date.now() - timestamp < 2000) {
        const reactionId = timestamp + Math.random();
        setReactions(prev => [...prev, { id: reactionId, emoji }]);
        // Cleanup after 3 seconds
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== reactionId));
        }, 3000);
      }
    }
  }, [roomState?.lastReaction]);

  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
    showToast(
      isRTL 
        ? (isTheaterMode ? "تم إيقاف وضع السينما" : "تم تفعيل وضع السينما") 
        : (isTheaterMode ? "Theater mode disabled" : "Theater mode enabled"),
      'info'
    );
  };

  const availableServers = [
    ...(isOfflineAvailable ? [{
      id: 'local',
      name: 'OFFLINE PLAYER',
      nameAr: 'مشاهدة محملة (مشغل مطور)',
      badges: ['OFFLINE', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => `${title}${s ? ` S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')}` : ''} [OFFLINE LOCAL CACHE]`,
      url: (id: string, s?: number, e?: number, imdbId?: string) => ''
    }] : []),
    {
      id: 'vipstream-a',
      name: 'vipstream-A',
      nameAr: 'سيرفر vipstream-A',
      badges: ['MULTI'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vidsrc.pm/embed/tv/${imdbId || id}/${s}/${e}`
        : `https://vidsrc.pm/embed/movie/${imdbId || id}`
    },
    {
      id: 'vipstream-s',
      name: 'vipstream-S',
      nameAr: 'سيرفر vipstream-S',
      badges: ['MULTI'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vidsrc.to/embed/tv/${imdbId || id}/${s}/${e}`
        : `https://vidsrc.to/embed/movie/${imdbId || id}`
    },
    {
      id: 'vipstream-b',
      name: 'vipstream-B',
      nameAr: 'سيرفر vipstream-B',
      badges: ['1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://embed.su/embed/tv/${imdbId || id}/${s}/${e}`
        : `https://embed.su/embed/movie/${imdbId || id}`
    },
    {
      id: 'gdrive',
      name: 'GDrive',
      nameAr: 'سيرفر GDrive السريع',
      badges: ['3 GB', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s
        ? `${title} S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')} ${epTitle || 'Step Into My Office'} 1080p AMZN WEB DL DDP5 1 Atmos H 264 FLUX EZTV`
        : `${title} 1080p AMZN WEB DL DDP5 1 Atmos H 264 FLUX EZTV`,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://databasegdriveplayer.co/player.php?series=${id}&s=${s}&e=${e}`
        : `https://databasegdriveplayer.co/player.php?tmdb=${id}`
    },
    {
      id: 'voe',
      name: 'voe',
      nameAr: 'سيرفر voe',
      badges: ['1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s
        ? `${title} S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')} ${epTitle || 'Step Into My Office'} 1080p AMZN WEB DL DDP5 1 Atmos H 264 FLUX mkv`
        : `${title} 1080p AMZN WEB DL DDP5 1 Atmos H 264 FLUX mkv`,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`
        : `https://embed.smashystream.com/playere.php?tmdb=${id}`
    },
    {
      id: 'savefiles',
      name: 'savefiles',
      nameAr: 'سيرفر savefiles',
      badges: ['1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s
        ? `${title} S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')} ${epTitle || 'Step Into My Office'} 1080p AMZN WEB DL DDP5 1 Atmos H 264 RUDR mkv`
        : `${title} 1080p AMZN WEB DL DDP5 1 Atmos H 264 RUDR mkv`,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`
        : `https://player.autoembed.cc/embed/movie/${id}`
    },
    {
      id: 'streamwish',
      name: 'streamwish',
      nameAr: 'سيرفر streamwish',
      badges: ['1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s
        ? `${title} S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')} ${epTitle || 'Step Into My Office'} 1080p AMZN WEB DL DDP5 1 Atmos H 264 RUDR mkv`
        : `${title} 1080p AMZN WEB DL DDP5 1 Atmos H 264 RUDR mkv`,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vidsrc.xyz/embed/tv/${imdbId || id}/${s}/${e}`
        : `https://vidsrc.xyz/embed/movie/${imdbId || id}`
    },
    {
      id: 'doodstream',
      name: 'doodstream',
      nameAr: 'سيرفر doodstream',
      badges: ['728.1 MB', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s
        ? `${title} S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')} ${epTitle || 'Step Into My Office'} 1080p AMZN WEB DL DDP5 1 Atmos H 264 RUDR mkv`
        : `${title} 1080p AMZN WEB DL DDP5 1 Atmos H 264 RUDR mkv`,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://www.2embed.cc/embedtv/${id}?s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${id}`
    },
    {
      id: 'mixdrop',
      name: 'mixdrop',
      nameAr: 'سيرفر mixdrop',
      badges: ['446.8 MB', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s
        ? `${title} S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')} ${epTitle || 'Step Into My Office'} 1080p AMZN WEB DL DDP5 1 Atmos H 264 RUDR mkv mp4`
        : `${title} 1080p AMZN WEB DL DDP5 1 Atmos H 264 RUDR mkv mp4`,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://moviesapi.club/tv/${id}-${s}-${e}`
        : `https://moviesapi.club/movie/${id}`
    },
    {
      id: 'vidmoly',
      name: 'vidmoly',
      nameAr: 'سيرفر vidmoly',
      badges: ['?'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s
        ? `${title} ${year || '2026'} Season ${s} Episode ${e} ${epTitle || 'Step Into My Office'}`
        : `${title} ${year || '2026'} Movie`,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://multiembed.to/?video_id=${imdbId || id}&s=${s}&e=${e}`
        : `https://multiembed.to/?video_id=${imdbId || id}`
    }
  ];
  const [seasonData, setSeasonData] = useState<any>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#000000');
  const fac = useRef<FastAverageColor | null>(null);
  const iframeTimeRef = useRef(0);
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [personLoading, setPersonLoading] = useState(false);

  const handlePersonClick = async (personId: number) => {
    setPersonLoading(true);
    const tmdbLang = getTmdbLanguage(language);
    const data = await fetchPersonDetails(personId, tmdbLang);
    setSelectedPerson(data);
    setPersonLoading(false);
  };

  useEffect(() => {
    fac.current = new FastAverageColor();
    return () => {
      if (fac.current) fac.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (movieData?.backdrop_path && fac.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `https://image.tmdb.org/t/p/w300${movieData.backdrop_path}`;
      img.onload = () => {
        if (fac.current) {
          fac.current.getColorAsync(img)
            .then(color => setBgColor(color.hex))
            .catch(() => setBgColor('#000000'));
        }
      };
      img.onerror = () => setBgColor('#000000');
    }
  }, [movieData?.backdrop_path]);

  // Set a safety timeout to hide loading spinner if player takes too long
  useEffect(() => {
    if (!loading) {
      const delay = isTrailer ? 800 : 5000;
      const timer = setTimeout(() => {
        setPlayerLoading(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [loading, currentServer, isTrailer]);

  useEffect(() => {
    if (id && !isTrailer) {
      const savedProgress = getProgress(parseInt(id), season, episode);
      if (savedProgress) {
        iframeTimeRef.current = savedProgress.currentTime;
      }
    }
  }, [id, season, episode, isTrailer, getProgress]);

  useEffect(() => {
    if (isTrailer || loading || !movieData) return;
    
    // Only track progress for non-trailer media
    const interval = setInterval(() => {
      iframeTimeRef.current += 10;
      const duration = (movieData.runtime || 120) * 60;
      updateProgress(movieData, iframeTimeRef.current, duration, season, episode);
    }, 10000);

    return () => clearInterval(interval);
  }, [movieData, isTrailer, loading, season, episode, updateProgress]);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setPlayerLoading(true);
      setError(null);
      setTrailerKey(null);
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY || '826d7088b7762696612143ad0bf99e28';
        
        const tmdbLang = getTmdbLanguage(language);
        
        // 1. Initial fetch with basic info, videos, and external_ids
        const response = await fetch(
          `/api/tmdb/${mediaType}/${id}?api_key=${apiKey}&append_to_response=images,content_ratings,release_dates,videos,external_ids,credits&language=${tmdbLang}`
        );
        
        if (!response.ok) {
          throw new Error('Movie not found');
        }

        const data = await response.json();
        setMovieData(data);

        if (isTrailer) {
          // Attempt to fetch from local API (server-side)
          try {
            const localRes = await fetch(`/api/trailer/${mediaType}/${id}`);
            if (localRes.ok) {
              const localData = await localRes.json();
              if (localData.key) {
                setTrailerKey(localData.key);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Local trailer API failed, falling back to TMDB direct', e);
          }

          let videos = data.videos?.results || [];
          
          // 2. If no videos found in initial fetch, try a dedicated videos call with the same language
          if (videos.length === 0) {
            const vidRes = await fetch(
              `/api/tmdb/${mediaType}/${id}/videos?api_key=${apiKey}&language=${tmdbLang}`
            );
            const vidData = await vidRes.json();
            videos = vidData.results || [];
          }

          // 3. Fallback: try fetching with multiple languages if still empty
          if (videos.length === 0) {
            const vidResLang = await fetch(
              `/api/tmdb/${mediaType}/${id}/videos?api_key=${apiKey}&include_video_language=${language},en,null`
            );
            const vidDataLang = await vidResLang.json();
            videos = vidDataLang.results || [];
          }

          // Priority Strategy: Trailer (YouTube) > Teaser (YouTube) > Clip (YouTube) > Any (YouTube)
          const trailer = videos.find((vid: any) => vid.type === 'Trailer' && vid.site === 'YouTube') ||
                          videos.find((vid: any) => vid.type === 'Teaser' && vid.site === 'YouTube') ||
                          videos.find((vid: any) => vid.type === 'Clip' && vid.site === 'YouTube') ||
                          videos.find((vid: any) => vid.site === 'YouTube');
          
          setTrailerKey(trailer?.key || null);
        }
      } catch (error) {
        console.error('Error fetching movie:', error);
        setError(isRTL ? 'حدث خطأ في تحميل البيانات' : 'Error loading media data');
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id, mediaType, isTrailer, language]);

  useEffect(() => {
    const fetchSeason = async () => {
      if (mediaType === 'tv' && season) {
        try {
          const apiKey = import.meta.env.VITE_TMDB_API_KEY || '826d7088b7762696612143ad0bf99e28';
          const tmdbLang = getTmdbLanguage(language);
          const res = await fetch(
            `/api/tmdb/tv/${id}/season/${season}?api_key=${apiKey}&language=${tmdbLang}`
          );
          if (res.ok) {
            const data = await res.json();
            setSeasonData(data);
          }
        } catch (e) {
          console.error("Error fetching season:", e);
        }
      }
    };
    fetchSeason();
  }, [id, mediaType, season, language]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (controlsVisible) {
      timeout = setTimeout(() => setControlsVisible(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [controlsVisible]);

  const handleMouseMove = () => {
    setControlsVisible(true);
  };

  const handleBack = () => {
    if (window.history.length <= 1) {
      if (mediaType === 'tv') {
        navigate('/tv');
      } else if (mediaType === 'movie') {
        navigate('/movies');
      } else {
        navigate('/');
      }
    } else {
      navigate(-1);
    }
  };

  const handleNextEpisode = React.useCallback(() => {
    if (seasonData && episode && episode < seasonData.episodes.length) {
      const params = new URLSearchParams(searchParams);
      params.set('e', (episode + 1).toString());
      navigate(`?${params.toString()}`, { replace: true });
      setPlayerLoading(true);
    }
  }, [seasonData, episode, searchParams, navigate]);

  const handlePrevEpisode = React.useCallback(() => {
    if (episode && episode > 1) {
      const params = new URLSearchParams(searchParams);
      params.set('e', (episode - 1).toString());
      navigate(`?${params.toString()}`, { replace: true });
      setPlayerLoading(true);
    }
  }, [episode, searchParams, navigate]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      // Handle events from various embed players (vidlink, vidsrc, etc)
      const isEnded = 
        data === 'vidlink_ended' || 
        data === 'vidlink_finished' || 
        data.type === 'MEDIA_ENDED' || 
        data.event === 'ended' ||
        (typeof data === 'string' && data.includes('ended'));

      if (isEnded && settings.autoplay && !isTrailer && mediaType === 'tv') {
        showToast(isRTL ? 'جاري تشغيل الحلقة التالية...' : 'Playing next episode...', 'info');
        handleNextEpisode();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [settings.autoplay, isTrailer, mediaType, handleNextEpisode, isRTL, showToast]);

  if (!id) return null;

  const favorited = movieData ? isFavorite(movieData.id) : false;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[500] flex flex-col overflow-hidden transition-colors duration-1000",
        isTheaterMode ? "bg-black" : ""
      )}
      style={{ 
        backgroundColor: isTheaterMode ? '#000000' : bgColor,
        backgroundImage: isTheaterMode ? 'none' : `linear-gradient(to bottom, transparent, #000000 80%), radial-gradient(circle at top, ${bgColor}33, transparent 70%)`
      }}
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence>
        {isTheaterMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[499]"
            style={{
              background: 'radial-gradient(circle at center, rgba(220, 38, 38, 0.1) 0%, transparent 80%)'
            }}
          />
        )}
      </AnimatePresence>
      {/* Persistent Back Button */}
      <div className={cn(
        "absolute top-5 z-[510] transition-all duration-300",
        isRTL ? "right-6" : "left-6",
        !controlsVisible && !isTrailer && "opacity-40 hover:opacity-100"
      )}>
        <button 
          onClick={handleBack}
          className="w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all text-white active:scale-95 flex items-center justify-center group border border-white/10"
        >
          <ArrowLeft className={cn("w-6 h-6 group-hover:-translate-x-1 transition-transform", isRTL && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence>
        {reactions.map(r => (
          <FloatingEmoji key={r.id} id={r.id} emoji={r.emoji} />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {roomId && (
          <motion.div 
            initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "fixed top-5 z-[510] flex flex-col gap-2",
              isRTL ? "left-24" : "right-6"
            )}
          >
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-4 rounded-[20px] shadow-2xl space-y-3 min-w-[200px]">
              <div className={cn("flex items-center justify-between gap-3", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className={cn("flex flex-col", isRTL && "items-end")}>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">{isRTL ? 'رمز الغرفة' : 'Party Code'}</span>
                    <span className="text-sm font-black text-white italic tracking-tighter uppercase">{roomId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowReactionPicker(!showReactionPicker)}
                    className={cn(
                      "p-1.5 hover:bg-white/5 rounded-full transition-all",
                      showReactionPicker ? "text-primary" : "text-gray-500"
                    )}
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => leaveRoom()}
                    className="p-1.5 hover:bg-white/5 rounded-full text-gray-500 hover:text-primary transition-all font-black text-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showReactionPicker && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-4 gap-2 py-2 border-t border-white/5">
                      {availableReactions.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            sendReaction(emoji);
                            setShowReactionPicker(false);
                          }}
                          className="text-2xl hover:scale-125 transition-transform active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className={cn("flex -space-x-2", isRTL && "flex-row-reverse space-x-reverse")}>
                  {roomState?.participants.slice(0, 3).map((p, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-[#0a0a0a] bg-gray-800 overflow-hidden shadow-xl">
                      <img src={`https://ui-avatars.com/api/?name=U&background=random`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  {roomState?.participants.length || 0} {isRTL ? 'مشاركين' : 'Online'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {controlsVisible && !isTrailer && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-[210] flex items-center justify-between px-6 py-5 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm"
          >
            {/* Spacer for persistent back button */}
            <div className="w-12 h-12" />
            
            <div className="flex-1 px-4 text-center">
              <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-wider italic drop-shadow-lg truncate">
                {movieData?.title || movieData?.name}
                {isTrailer ? ` - ${isRTL ? 'الإعلان' : 'Trailer'}` : (season && episode && ` - S${season}E${episode}`)}
              </h3>
            </div>

            {/* Empty element on the right to keep the title perfectly centered */}
            <div className="w-12 h-12" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "flex-1 relative transition-all duration-1000",
        "overflow-y-auto pt-24 pb-12 px-5"
      )}>
        <div className={cn(
          "max-w-4xl mx-auto flex flex-col gap-10"
        )}>
          {/* Always-visible Player Switcher Option Above Video Frame */}
          {!isTrailer && availableServers.length > 1 && (
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setServersOpen(!serversOpen)}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Server className="w-4 h-4" />
                  <span>{isRTL ? 'السيرفرات' : 'SERVERS'}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", serversOpen ? "rotate-180" : "rotate-0")} />
                </button>
              </div>

              <AnimatePresence>
                {serversOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="w-full bg-[#0a0a0c] border border-white/5 rounded-3xl p-3 flex flex-col gap-2 max-h-[480px] overflow-y-auto custom-scrollbar shadow-2xl">
                      {availableServers.map((server, index) => {
                        const activeTitle = movieData ? (movieData.title || movieData.name) : 'Spider-Noir';
                        const activeYear = String(movieData?.release_date ? new Date(movieData.release_date).getFullYear() : movieData?.first_air_date ? new Date(movieData.first_air_date).getFullYear() : '2026');
                        // Dynamically fetch the current episode's title if present, otherwise default
                        const epTitle = (seasonData?.episodes && episode) ? (seasonData.episodes[episode - 1]?.name || `Episode ${episode}`) : '';
                        // Generate filename string
                        const filenameStr = server.filename 
                          ? server.filename(activeTitle, season, episode, epTitle, activeYear)
                          : activeTitle;

                        // Map server names to logos & brand colors for the screenshot styling
                        let iconComp = <Play className="w-4 h-4 fill-white text-white" />;
                        let iconBg = "bg-blue-600/20 text-blue-400 border border-blue-500/20";
                        if (server.id === 'gdrive') {
                          iconComp = <HardDrive className="w-4 h-4 text-emerald-400" />;
                          iconBg = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20";
                        } else if (server.id === 'voe') {
                          iconComp = <Layers className="w-4 h-4 text-sky-400" />;
                          iconBg = "bg-sky-500/20 text-sky-400 border border-sky-500/20";
                        } else if (server.id === 'savefiles') {
                          iconComp = <FolderOpen className="w-4 h-4 text-indigo-400" />;
                          iconBg = "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20";
                        } else if (server.id === 'streamwish') {
                          iconComp = <Flame className="w-4 h-4 text-amber-500" />;
                          iconBg = "bg-amber-500/20 text-amber-400 border border-amber-500/20";
                        } else if (server.id === 'doodstream') {
                          iconComp = <Server className="w-4 h-4 text-yellow-500" />;
                          iconBg = "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20";
                        } else if (server.id === 'mixdrop') {
                          iconComp = <Zap className="w-4 h-4 text-cyan-400" />;
                          iconBg = "bg-cyan-500/20 text-cyan-400 border border-cyan-500/20";
                        } else if (server.id === 'vidmoly') {
                          iconComp = <Video className="w-4 h-4 text-rose-400" />;
                          iconBg = "bg-rose-500/20 text-rose-400 border border-rose-500/20";
                        } else if (server.id.startsWith('vipstream')) {
                          iconBg = "bg-blue-600/40 text-blue-100 border border-blue-500/30";
                        }

                        const isSelected = currentServer === index;

                        return (
                          <button
                            key={server.id}
                            onClick={() => {
                              setCurrentServer(index);
                              setPlayerLoading(true);
                            }}
                            className={cn(
                              "w-full p-3.5 rounded-2xl flex items-center justify-between gap-4 transition-all border text-left outline-none cursor-pointer",
                              isSelected 
                                ? "bg-indigo-600/10 border-indigo-500/40 shadow-inner" 
                                : "bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.03] hover:border-white/[0.08]"
                            )}
                          >
                            <div className={cn("flex flex-col gap-1 min-w-0 flex-1", isRTL ? "text-right items-end" : "text-left items-start")}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                                  {iconComp}
                                </div>
                                <span className="text-white text-xs font-black tracking-wide">
                                  {isRTL ? server.nameAr : server.name}
                                </span>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,1)]" />
                                )}
                              </div>
                              <span className={cn(
                                "text-[10px] truncate block leading-normal w-full",
                                isSelected ? "text-indigo-200/75" : "text-white/40",
                                isRTL ? "text-right" : "text-left"
                              )}>
                                {filenameStr}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {server.badges?.map((badge, bIdx) => {
                                // Determine badge style
                                let badgeStyle = "bg-indigo-600 text-white";
                                if (badge === 'MULTI') {
                                  badgeStyle = "bg-fuchsia-600 text-white";
                                } else if (badge.includes('GB') || badge.includes('MB')) {
                                  badgeStyle = "bg-indigo-600 font-bold text-white";
                                } else if (badge === '?') {
                                  badgeStyle = "bg-zinc-700 text-zinc-300";
                                } else if (badge === 'OFFLINE') {
                                  badgeStyle = "bg-teal-600 text-white";
                                }
                                
                                return (
                                  <span
                                    key={bIdx}
                                    className={cn(
                                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider leading-relaxed shrink-0",
                                      badgeStyle
                                    )}
                                  >
                                    {badge}
                                  </span>
                                );
                              })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}



          {/* Player Container */}
          <div className={cn(
            "relative transition-all duration-700",
            "w-full max-w-3xl mx-auto aspect-video rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-15px_rgba(0,0,0,0.8)] border border-white/10 ring-1 ring-white/5 bg-black"
          )}>
            <AnimatePresence>
              {(loading || playerLoading || error) && (
                <motion.div 
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black"
                >
                  <div className="flex flex-col items-center gap-4 max-w-xs text-center px-6">
                    {error ? (
                      <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                           <X className="w-8 h-8 text-red-500" />
                        </div>
                        <span className="text-sm font-medium text-white/80">{error}</span>
                        <button 
                          onClick={handleBack}
                          className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                          {isRTL ? 'الرجوع' : 'Go Back'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] animate-pulse">
                          {isRTL ? 'جاري تجهيز السيرفر...' : 'Preparing Server...'}
                        </span>
                        {!loading && playerLoading && (
                          <button 
                            onClick={() => setPlayerLoading(false)}
                            className="mt-4 text-[9px] font-bold text-white/20 hover:text-white/40 uppercase tracking-widest underline underline-offset-4"
                          >
                            {isRTL ? 'تجاهل والتشغيل الآن' : 'Skip and play now'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isTrailer ? (
              trailerKey ? (
                <iframe
                  key={trailerKey}
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0&vq=hd1080&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  onLoad={() => setPlayerLoading(false)}
                />
              ) : !loading && (
                <div className="flex flex-col items-center justify-center h-full text-white/50 text-center px-10 gap-6">
                  <Film className="w-16 h-16 text-white/10" />
                  <div className="text-sm font-black uppercase tracking-[0.2em]">
                    {isRTL ? 'الإعلان غير متوفر حالياً' : 'Trailer unavailable'}
                  </div>
                  <button 
                    onClick={handleBack}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 text-white"
                  >
                    {isRTL ? 'الرجوع' : 'Go Back'}
                  </button>
                </div>
              )
            ) : movieData && (
              availableServers[currentServer]?.id === 'local' ? (
                <CustomVideoPlayer 
                  title={`${movieData.title || movieData.name} ${season && episode ? `- S${season}E${episode}` : ''}`}
                  poster={`https://image.tmdb.org/t/p/original${movieData.backdrop_path}`}
                  onLoaded={() => setPlayerLoading(false)}
                />
              ) : (
                <iframe 
                  key={`${availableServers[currentServer]?.id}-${season || 'movie'}-${episode || ''}`}
                  src={availableServers[currentServer]?.url(id || '', season, episode, movieData?.external_ids?.imdb_id || movieData?.imdb_id)} 
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  onLoad={() => setPlayerLoading(false)}
                />
              )
            )}
          </div>



          {/* Episode Navigation for TV Shows */}
          {!isTrailer && mediaType === 'tv' && season && episode && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] shadow-2xl relative z-[220]"
            >
              <button 
                onClick={handlePrevEpisode}
                disabled={episode <= 1}
                className={cn(
                  "p-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2",
                  episode <= 1 ? "bg-white/5 text-white/20" : "bg-white/10 hover:bg-white/20 text-white"
                )}
              >
                <ChevronLeft className={cn("w-6 h-6", isRTL && "rotate-180")} />
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">
                  {isRTL ? 'الحلقة السابقة' : 'Prev Episode'}
                </span>
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">
                  {isRTL ? 'الموسم' : 'Season'} {season}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
                  <span className="text-sm md:text-lg font-black text-white uppercase italic tracking-tighter">
                    {isRTL ? 'الحلقة' : 'Episode'} {episode}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleNextEpisode}
                disabled={!seasonData || episode >= seasonData.episodes?.length}
                className={cn(
                  "p-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 border",
                  (!seasonData || episode >= seasonData.episodes?.length) 
                    ? "bg-white/1 border-white/5 text-white/20" 
                    : "bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md"
                )}
              >
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest text-left">
                  {isRTL ? 'الحلقة التالية' : 'Next Episode'}
                </span>
                <ChevronRight className={cn("w-6 h-6", isRTL && "rotate-180")} />
              </button>
            </motion.div>
          )}

          {/* Content View - Below Player */}
          {movieData && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-8 pb-20 px-2"
            >


              {isTrailer && (
                <div className="pt-8 space-y-6">
                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <div className="w-1 h-5 bg-primary rounded-full shadow-[0_0_10px_rgba(229,9,20,0.5)]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                      {isRTL ? 'إبدأ المشاهدة الآن' : 'Start Watching Now'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.delete('trailer');
                      navigate(`?${params.toString()}`, { replace: true });
                    }}
                    className="group relative w-full overflow-hidden py-6 bg-white hover:bg-white/95 text-black rounded-3xl font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Film className="w-6 h-6" />
                    {isRTL ? 'مشاهدة المحتوى بالكامل' : 'Watch Full Content'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {controlsVisible && !isTrailer && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent"
          >
            <div className="max-w-4xl mx-auto">
              {isOfflineAvailable && (
                <div className="flex justify-center mb-4">
                  <div className="bg-green-600/20 border border-green-500/30 px-3 py-1 rounded-lg flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                      {isRTL ? 'وضع المشاهدة بدون اتصال نشط' : 'Offline Mode Active'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actor Details Modal */}
      <AnimatePresence>
        {selectedPerson && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#070b19] border border-white/10 rounded-[32px] w-full max-w-3xl max-h-[85vh] overflow-hidden relative z-10 flex flex-col md:flex-row shadow-2xl"
            >
              <button 
                onClick={() => setSelectedPerson(null)}
                className="absolute top-4 right-4 z-30 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Actor Profile Section */}
              <div className="w-full md:w-80 relative shrink-0">
                <div className="aspect-[4/5] md:h-full relative overflow-hidden bg-[#0d1527]">
                  <img 
                    src={getImageUrl(selectedPerson.profile_path, 'w500')} 
                    className="w-full h-full object-cover object-top"
                    alt={selectedPerson.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b19] via-transparent to-transparent" />
                  
                  {/* Floating Info on Mobile Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:hidden">
                    <motion.h2 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={cn("text-4xl font-black text-white italic uppercase tracking-tighter", isRTL && "text-right")}
                    >
                      {selectedPerson.name}
                    </motion.h2>
                  </div>
                </div>
              </div>

              {/* Actor Info Section */}
              <div className="flex-1 p-6 md:p-10 overflow-y-auto scrollbar-hide space-y-8 text-white">
                <div className={cn("hidden md:space-y-4 md:block", isRTL ? "text-right" : "text-left")}>
                  <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                    {selectedPerson.name}
                  </h2>
                  
                  <div className={cn("flex flex-wrap gap-4", isRTL && "justify-end")}>
                    {selectedPerson.birthday && (
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-white/5 py-1.5 px-3 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {selectedPerson.birthday}
                      </div>
                    )}
                    {selectedPerson.place_of_birth && (
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 capitalize bg-white/5 py-1.5 px-3 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {selectedPerson.place_of_birth}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Info Badges */}
                <div className={cn("flex flex-wrap gap-3 md:hidden", isRTL && "justify-end")}>
                  {selectedPerson.birthday && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 py-1.5 px-3 rounded-lg">
                      <Calendar className="w-3 h-3 text-primary" />
                      {selectedPerson.birthday}
                    </div>
                  )}
                  {selectedPerson.place_of_birth && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 capitalize bg-white/5 py-1.5 px-3 rounded-lg">
                      <MapPin className="w-3 h-3 text-primary" />
                      {selectedPerson.place_of_birth}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                      {isRTL ? 'السيرة الذاتية' : 'Biography'}
                    </h4>
                  </div>
                  <p className={cn(
                    "text-gray-300 text-sm md:text-base leading-relaxed font-medium opacity-80",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    {selectedPerson.biography || (isRTL ? 'لا توجد سيرة ذاتية متاحة حالياً.' : 'No biography available at the moment.')}
                  </p>
                </div>

                {selectedPerson.combined_credits && (
                  <div className="space-y-6 pt-4 border-t border-white/5">
                    <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                        <div className="w-1.5 h-4 bg-primary rounded-full" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                          {isRTL ? 'أهم الأعمال' : 'Famous Works'}
                        </h4>
                      </div>
                    </div>
                    <div className={cn("grid grid-cols-3 gap-4", isRTL && "direction-rtl")}>
                      {selectedPerson.combined_credits.cast.slice(0, 6).map((work: any) => (
                        <div 
                          key={work.id} 
                          onClick={() => {
                            setSelectedPerson(null);
                            const mType = work.media_type || (work.title ? 'movie' : 'tv');
                            navigate(`/watch/${mType}/${work.id}${mType === 'tv' ? '?s=1&e=1' : ''}`);
                            setPlayerLoading(true);
                          }}
                          className="space-y-2 group cursor-pointer transition-all active:scale-95 text-center"
                        >
                          <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 border border-white/5 group-hover:border-primary transition-colors shadow-xl">
                            <img src={getImageUrl(work.poster_path, 'w500')} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" alt={work.title || work.name} />
                          </div>
                          <p className="text-[8px] font-black text-gray-400 group-hover:text-primary uppercase tracking-tighter line-clamp-1 text-center opacity-60 group-hover:opacity-100 italic transition-opacity">
                            {work.title || work.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {personLoading && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
