import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Share2, Heart, ChevronLeft, ChevronRight, Film, Users, X, Users2, Smile, ExternalLink, Calendar, MapPin, Play, Pause, HardDrive, Zap, Crown, FolderOpen, Flame, Server, Layers, Video, ChevronDown, Monitor, Maximize, Minimize, Settings, RotateCcw, RotateCw, Clock, FileText } from 'lucide-react';
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
import { Sparkles, Tv } from 'lucide-react';
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
  const [serversOpen, setServersOpen] = useState(false);
  const [topServersDropdownOpen, setTopServersDropdownOpen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);

  // States for the ultra-premium custom control layer
  const [isPlaying, setIsPlaying] = useState(true);
  const [playerTime, setPlayerTime] = useState(0);


  const availableReactions = ['❤️', '🔥', '😂', '😮', '😢', '🎬', '👏', '👻'];

  const formatPlayerTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!movieData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.min(1, Math.max(0, clickX / rect.width));
    const totalDuration = (movieData.runtime || 120) * 60;
    const newTime = Math.floor(percentage * totalDuration);
    setPlayerTime(newTime);
    iframeTimeRef.current = newTime;
  };

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

  // Synchronise selected server for the watcher
  useEffect(() => {
    if (roomState && user && roomState.hostId !== user.uid && roomState.currentServerIndex !== undefined) {
      if (roomState.currentServerIndex !== currentServer) {
        setCurrentServer(roomState.currentServerIndex);
        setPlayerLoading(true);
      }
    }
  }, [roomState?.currentServerIndex, roomState?.hostId, user, currentServer]);

  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
    showToast(
      isRTL 
        ? (isTheaterMode ? "تم إيقاف وضع السينما" : "تم تفعيل وضع السينما") 
        : (isTheaterMode ? "Theater mode disabled" : "Theater mode enabled"),
      'info'
    );
  };

  const togglePlayerFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen()
        .then(() => setIsPlayerFullscreen(true))
        .catch(err => {
          console.warn("Native fullscreen failed, fallback to viewport:", err);
          setIsPlayerFullscreen(true);
        });
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsPlayerFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPlayerFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      // Delay check slightly to wait for browser activeElement transition
      setTimeout(() => {
        if (document.activeElement instanceof HTMLIFrameElement) {
          setControlsVisible(true);
        }
      }, 150);
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

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
      id: 'vidfast',
      name: 'Source 1',
      nameAr: 'سيرفر Source 1',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true`
        : `https://vidfast.pro/movie/${id}?autoPlay=true`
    },
    {
      id: 'vidlink',
      name: 'Source 2',
      nameAr: 'سيرفر Source 2',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vidlink.pro/tv/${id}/${s}/${e}`
        : `https://vidlink.pro/movie/${id}`
    },
    {
      id: 'nontongo',
      name: 'Source 3',
      nameAr: 'سيرفر Source 3',
      badges: ['MULTI', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://www.NontonGo.win/embed/tv/${imdbId || id}/${s}/${e}`
        : `https://www.NontonGo.win/embed/movie/${imdbId || id}`
    },
    {
      id: 'vixsrc',
      name: 'Source 4',
      nameAr: 'سيرفر Source 4',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vixsrc.to/tv/${id}/${s}/${e}`
        : `https://vixsrc.to/movie/${id}`
    },
    {
      id: 'vidcore',
      name: 'source 5',
      nameAr: 'سيرفر source 5',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vidcore.net/tv/${id}/${s}/${e}?autoPlay=true`
        : `https://vidcore.net/movie/${id}?autoPlay=true`
    },
    {
      id: 'vidnest',
      name: 'source 6',
      nameAr: 'سيرفر source 6',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vidnest.fun/tv/${id}/${s}/${e}`
        : `https://vidnest.fun/movie/${id}`
    },
    {
      id: 'peachify',
      name: 'source 7',
      nameAr: 'سيرفر source 7',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://peachify.top/embed/tv/${id}/${s}/${e}`
        : `https://peachify.top/embed/movie/${id}`
    },
    {
      id: 'vidsrcwiki',
      name: 'source 8',
      nameAr: 'سيرفر source 8',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vidsrc.wiki/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.wiki/embed/movie/${id}`
    },
    {
      id: 'apiplayer',
      name: 'source 9',
      nameAr: 'سيرفر source 9',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://apiplayer.ru/embed/tv/${id}/${s}/${e}`
        : `https://apiplayer.ru/embed/movie/${imdbId || id}`
    },
    {
      id: 'cinezo',
      name: 'source 10',
      nameAr: 'سيرفر source 10',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://player.cinezo.live/embed/tv/${id}/${s}/${e}`
        : `https://player.cinezo.live/embed/movie/${id}`
    },
    {
      id: 'ezvidapi',
      name: 'source 11',
      nameAr: 'سيرفر source 11',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://ezvidapi.com/embed/tv/${id}/${s}/${e}?provider=popr`
        : `https://ezvidapi.com/embed/movie/${id}?provider=popr`
    },
    {
      id: 'superembed',
      name: 'source 12',
      nameAr: 'سيرفر source 12',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://www.superembed.stream/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`
        : `https://www.superembed.stream/embed/movie?tmdb=${id}`
    },
    {
      id: 'vidup',
      name: 'source',
      nameAr: 'سيرفر source',
      badges: ['FAST', '1080p'],
      filename: (title: string, s?: number, e?: number, epTitle?: string, year?: string) => s ? `${title} Season ${s} Episode ${e}` : title,
      url: (id: string, s?: number, e?: number, imdbId?: string) => s 
        ? `https://vidup.to/tv/${id}/${s}/${e}?autoPlay=true`
        : `https://vidup.to/movie/${id}?autoPlay=true`
    },
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
        setPlayerTime(savedProgress.currentTime);
      } else {
        iframeTimeRef.current = 0;
        setPlayerTime(0);
      }
    } else {
      iframeTimeRef.current = 0;
      setPlayerTime(0);
    }
  }, [id, season, episode, isTrailer, getProgress]);

  // Smoothly increment playerTime every second to keep live progression accurate
  useEffect(() => {
    if (isTrailer || loading || !movieData || playerLoading || !isPlaying) return;
    
    const interval = setInterval(() => {
      setPlayerTime(prev => {
        const next = prev + 1;
        const totalDuration = (movieData.runtime || 120) * 60;
        if (next >= totalDuration) {
          clearInterval(interval);
          return totalDuration;
        }
        iframeTimeRef.current = next;
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [movieData, isTrailer, loading, playerLoading, isPlaying]);

  // Save progression every 10 seconds back to watch history storage
  useEffect(() => {
    if (isTrailer || loading || !movieData || playerLoading) return;

    const interval = setInterval(() => {
      const totalDuration = (movieData.runtime || 120) * 60;
      updateProgress(movieData, iframeTimeRef.current, totalDuration, season, episode);
    }, 10000);

    return () => clearInterval(interval);
  }, [movieData, isTrailer, loading, playerLoading, season, episode, updateProgress]);



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
    if (controlsVisible && !playerLoading && !loading) {
      timeout = setTimeout(() => setControlsVisible(false), 4500);
    }
    return () => clearTimeout(timeout);
  }, [controlsVisible, playerLoading, loading]);

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
      {!isPlayerFullscreen && (
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
      )}

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
        {!isTrailer && !isPlayerFullscreen && (
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
          {!isTrailer && availableServers.length > 1 && !(roomState && user && roomState.hostId !== user.uid) && (
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 relative z-[250]">
              <div className="relative inline-block">
                <button
                  onClick={() => setServersOpen(!serversOpen)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-xl cursor-pointer select-none outline-none border",
                    serversOpen
                      ? "bg-[#5B4EFF] border-transparent text-white shadow-[#5B4EFF]/40"
                      : "bg-[#5B4EFF]/90 hover:bg-[#5B4EFF] border-transparent text-white hover:shadow-[#5B4EFF]/50"
                  )}
                >
                  <Server className="w-4 h-4 shrink-0" />
                  <span>{isRTL ? 'السيرفرات' : 'SERVERS'}</span>
                  <span className="text-[10px] font-bold leading-none ml-1">{serversOpen ? '▲' : '▼'}</span>
                </button>

                <AnimatePresence>
                  {serversOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "absolute mt-3 z-[300] w-[260px] md:w-[300px]",
                        isRTL ? "right-0" : "left-0"
                      )}
                    >
                      <div className="w-full bg-[#0d091e]/50 backdrop-blur-xl border border-purple-500/30 rounded-[2rem] p-2 flex flex-col shadow-[0_0_35px_rgba(139,92,246,0.25)] overflow-hidden">
                        {availableServers.map((server, index) => {
                          const isSelected = currentServer === index;
                          return (
                            <button
                              key={server.id}
                              onClick={() => {
                                setCurrentServer(index);
                                setPlayerLoading(true);
                                if (roomId && roomState && roomState.hostId === user?.uid) {
                                  updateRoomState({ currentServerIndex: index });
                                }
                              }}
                              className={cn(
                                "w-full py-4 px-6 text-left transition-all relative font-medium cursor-pointer outline-none select-none flex items-center justify-between group rounded-3xl",
                                isRTL ? "text-right flex-row-reverse" : "text-left flex-row",
                                isSelected 
                                  ? "text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] font-bold bg-white/[0.03]" 
                                  : "text-white/80 hover:text-white hover:bg-white/[0.05]"
                              )}
                            >
                              <span className="text-base md:text-lg tracking-wide font-medium">
                                {isRTL ? `سيرفر ${index + 1}` : `Server ${index + 1}`}
                              </span>
                              
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,1)] shrink-0" />
                              )}

                              {index < availableServers.length - 1 && (
                                <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-white/[0.08]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}



          {/* Player Container */}
          <div 
            ref={playerContainerRef}
            onClick={() => setControlsVisible(prev => !prev)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setControlsVisible(false)}
            className={cn(
              "relative transition-all duration-300 bg-black flex items-center justify-center overflow-hidden cursor-pointer",
              isPlayerFullscreen 
                ? "fixed inset-0 w-screen h-screen max-w-none z-[9999] rounded-none border-0 ring-0" 
                : "w-full max-w-3xl mx-auto aspect-video rounded-[2.5rem] border border-white/10 ring-1 ring-white/5 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.8)]"
            )}
          >
            {/* Elegant Floating Exit Button (shown on hover/controls visible) */}
            <AnimatePresence>
              {controlsVisible && !isTrailer && (
                <motion.button
                  key="floating-close-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBack();
                  }}
                  className="absolute top-4 right-4 z-40 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 border border-white/10 flex items-center justify-center text-white/90 hover:text-white shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                  title={isRTL ? 'خروج' : 'Exit'}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

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
