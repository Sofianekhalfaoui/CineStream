import React, { useState, useEffect } from 'react';
import { Play, Heart, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl, fetchMovieVideos, getTmdbLanguage, fetchMovieImages, filterAdultContent } from '../services/tmdb';
import { Movie } from '../types';
import { useMovie } from '../context/MovieContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useSettings } from '../context/SettingsContext';
import { cn } from '../lib/utils';
import TrailerVideoPlayer from './TrailerVideoPlayer';

interface HeroSectionProps {
  fetchUrl: string;
  type?: 'movie' | 'tv';
}

// Cinematic genre-specific dynamic typography stylings for fallbacks
const getFallbackTitleStyle = (movie: Movie) => {
  const genres = movie.genre_ids || [];
  
  // Sci-Fi / Fantasy (878, 14, 10765)
  if (genres.includes(878) || genres.includes(14) || genres.includes(10765)) {
    return {
      className: "font-mono font-black uppercase tracking-widest text-cyan-300",
      style: {
        textShadow: '0 0 10px rgba(34, 211, 238, 0.7), 0 0 25px rgba(34, 211, 238, 0.4)',
        letterSpacing: '0.15em'
      }
    };
  }
  
  // Horror / Mystery (27, 9648)
  if (genres.includes(27) || genres.includes(9648)) {
    return {
      className: "font-serif font-black tracking-normal text-rose-600",
      style: {
        textShadow: '2px 2px 0px #000, -1px -1px 0px #000, 0 0 20px rgba(225, 29, 72, 0.8)',
        fontFamily: "'Playfair Display', serif"
      }
    };
  }
  
  // Action / Adventure / War (28, 12, 10752, 10759)
  if (genres.includes(28) || genres.includes(12) || genres.includes(10752) || genres.includes(10759)) {
    return {
      className: "font-sans font-black italic tracking-tighter uppercase bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent transform skew-x-12",
      style: {
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.9))'
      }
    };
  }

  // Romance (10749) / Drama (18)
  if (genres.includes(10749) || genres.includes(18)) {
    return {
      className: "font-serif tracking-widest font-normal text-rose-100 italic",
      style: {
        fontFamily: "'Playfair Display', serif",
        textShadow: '0 2px 10px rgba(244, 114, 182, 0.5)'
      }
    };
  }

  // Comedy (35)
  if (genres.includes(35)) {
    return {
      className: "font-sans font-black tracking-wide text-yellow-400 capitalize",
      style: {
        textShadow: '0 4px 0px #0e0e0e, 0 8px 15px rgba(234, 179, 8, 0.5)',
      }
    };
  }

  // General default elegant cinematic title
  return {
    className: "font-sans font-black tracking-tight text-white uppercase italic drop-shadow-[0_8px_8px_rgba(0,0,0,0.7)]",
    style: {}
  };
};

export default function HeroSection({ fetchUrl, type }: HeroSectionProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { selectedMovie, setSelectedMovie } = useMovie();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { t, language } = useLanguage();
  const { isSubscriptionOpen, openSubscription } = useSubscription();
  const { settings } = useSettings();
  const location = useLocation();

  // Dynamic trailer playback state
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [startTrailer, setStartTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);

  // Monitor if active on target home route and no modals/details overlay are open
  const shouldPlayTrailer = location.pathname === '/' && selectedMovie === null && !isSubscriptionOpen;

  // Map of movie IDs to actual branding logo image paths
  const [movieLogos, setMovieLogos] = useState<Record<number, string | null>>({});

  // 1. Fetch 10 trending items
  useEffect(() => {
    async function fetchData() {
      try {
        const request = await axios.get(fetchUrl);
        const rawResults = request.data?.results || [];
        const filteredResults = filterAdultContent(rawResults, settings.contentFilter);
        const results = filteredResults.slice(0, 10);
        setMovies(results);
      } catch (err) {
        console.error('Error fetching hero section movies:', err);
      }
    }
    fetchData();
  }, [fetchUrl, settings.contentFilter]);

  // Parallel background fetching for all movie/series vector branding logos
  useEffect(() => {
    if (movies.length === 0) return;

    let isSubscribed = true;

    async function loadAllLogos() {
      const logosMap: Record<number, string | null> = {};
      
      try {
        await Promise.all(
          movies.map(async (movie) => {
            const activeType = type || movie.media_type || (movie.name ? 'tv' : 'movie');
            const data = await fetchMovieImages(movie.id, activeType);
            
            if (data && data.logos && data.logos.length > 0) {
              // Priority select matching current language, then English, then Arabic, or any first logo
              const bestLogo = data.logos.find((l: any) => l.iso_639_1 === language) ||
                               data.logos.find((l: any) => l.iso_639_1 === 'en') ||
                               data.logos.find((l: any) => l.iso_639_1 === 'ar') ||
                               data.logos[0];
              if (bestLogo) {
                logosMap[movie.id] = bestLogo.file_path;
              }
            }
          })
        );
      } catch (err) {
        console.error('Error batch loading title logos:', err);
      }

      if (isSubscribed) {
        setMovieLogos(prev => ({ ...prev, ...logosMap }));
      }
    }

    loadAllLogos();

    return () => {
      isSubscribed = false;
    };
  }, [movies, type, language]);

  // 2. Load trailer video when current movie changes and manage 4-second display timing
  useEffect(() => {
    if (movies.length === 0) return;
    const activeMovie = movies[currentIndex];
    
    // Reset states for the new active item
    setTrailerKey(null);
    setShowVideo(false);
    setStartTrailer(false);
    setIsLoadingTrailer(true);

    const activeType = type || activeMovie.media_type || (activeMovie.name ? 'tv' : 'movie');
    const selectedLang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';

    let isSubscribed = true;

    async function loadTrailer() {
      try {
        const videos = await fetchMovieVideos(activeMovie.id, activeType, selectedLang);
        
        // Find best match: prefers YT Trailers, fallback to Teaser or Clips
        const ytTrailer = videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
                          videos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser') ||
                          videos.find((v: any) => v.site === 'YouTube');
        
        if (isSubscribed) {
          if (ytTrailer?.key) {
            setTrailerKey(ytTrailer.key);
          } else {
            // Attempt an English language fallback
            const fallbackVideos = await fetchMovieVideos(activeMovie.id, activeType, 'en-US');
            const fallbackYt = fallbackVideos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
                               fallbackVideos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser') ||
                               fallbackVideos.find((v: any) => v.site === 'YouTube');
            if (isSubscribed && fallbackYt?.key) {
              setTrailerKey(fallbackYt.key);
            }
          }
          setIsLoadingTrailer(false);
        }
      } catch (e) {
        console.error('Could not fetch video trailer:', e);
        if (isSubscribed) setIsLoadingTrailer(false);
      }
    }

    loadTrailer();

    // Start video advertisement/trailer in background after 3 seconds (3000ms)
    const startTrailerTimer = setTimeout(() => {
      if (isSubscribed) {
        setStartTrailer(true);
      }
    }, 3000);

    // Fade out poster image with smooth motion style after 5 seconds (5000ms) to reveal video already in play
    const fadePosterTimer = setTimeout(() => {
      if (isSubscribed) {
        setShowVideo(true);
      }
    }, 5000);

    return () => {
      isSubscribed = false;
      clearTimeout(startTrailerTimer);
      clearTimeout(fadePosterTimer);
    };
  }, [currentIndex, movies, type, language]);

  // 3. Auto-advance selector fallback if there is no trailer available
  useEffect(() => {
    if (movies.length === 0) return;

    let fallbackTimer: NodeJS.Timeout | null = null;

    if (!isLoadingTrailer && !trailerKey) {
      // Stay on the backdrop for a clean period (7 seconds in total including the 3s initial duration)
      fallbackTimer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
      }, 7000);
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [currentIndex, movies, trailerKey, isLoadingTrailer]);

  const activeMovie = movies[currentIndex];

  const handlePanEnd = (_: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      // Swipe Right -> Previous
      setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe Left -> Next
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }
  };

  if (!activeMovie) return <div className="h-screen bg-black animate-pulse" />;

  const isActuallyTV = type === 'tv' || activeMovie.media_type === 'tv' || (activeMovie.name || activeMovie.first_air_date) ? true : false;
  const favorited = isFavorite(activeMovie.id);

  const fallbackStyle = getFallbackTitleStyle(activeMovie);

  return (
    <motion.header 
      id="hero-header-banner"
      className="relative h-[72vh] w-full overflow-hidden bg-white dark:bg-[#070b19] touch-pan-y select-none"
      onPanEnd={handlePanEnd}
    >
      {/* Background Media Container */}
      <div id="hero-background-media" className="absolute inset-0 z-0 bg-white dark:bg-[#070b19]">
        {/* Render the trailer after 3 seconds (startTrailer is true) so it plays/buffers in the background */}
        {trailerKey && shouldPlayTrailer && startTrailer && (
          <div id={`hero-trailer-wrapper-${activeMovie.id}`} className="absolute inset-0 w-full h-full z-0">
            <TrailerVideoPlayer
              videoKey={trailerKey}
              isMuted={isMuted}
              onEnded={() => {
                // Advance to the next video as requested once trailer ends
                setCurrentIndex((prev) => (prev + 1) % movies.length);
              }}
            />
          </div>
        )}
        
        {/* Backdrop Image - displayed on top (z-10), fades out when showVideo is true to expose the running trailer */}
        <AnimatePresence>
          {(!showVideo || !trailerKey || !shouldPlayTrailer) && (
            <motion.img
              id={`hero-backdrop-img-${activeMovie.id}`}
              key={`img-${activeMovie.id}`}
              src={getImageUrl(activeMovie.backdrop_path)}
              alt="Backdrop"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />
          )}
        </AnimatePresence>

        {/* Overlays */}
        <div id="hero-overlay-gradient" className="absolute inset-0 hero-gradient z-20 pointer-events-none" />
      </div>

      {/* Content Center Aligned */}
      <div id="hero-content-scroller" className="absolute inset-0 flex flex-col justify-end items-center pb-6 md:pb-16 px-4 md:px-12 z-20 pointer-events-none">
        <motion.div
          key={`content-${activeMovie.id}`}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          className="w-full max-w-4xl text-center"
        >
          <div className="flex flex-col items-center">
            {/* Elegant visual branding logo or styled title display */}
            <div id="hero-brand-title-box" className="mb-3 md:mb-6 h-14 sm:h-28 md:h-36 w-full max-w-[280px] sm:max-w-[420px] flex items-center justify-center pointer-events-none">
              {movieLogos[activeMovie.id] ? (
                <motion.img
                  id={`hero-movie-logo-${activeMovie.id}`}
                  key={`logo-${activeMovie.id}`}
                  src={getImageUrl(movieLogos[activeMovie.id], 'original')}
                  alt={activeMovie.title || activeMovie.name}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              ) : (
                <motion.h1
                  id="hero-movie-title"
                  className={cn("text-3xl sm:text-5xl md:text-6xl text-center leading-none tracking-tight font-serif", fallbackStyle.className)}
                  style={fallbackStyle.style}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {activeMovie.title || activeMovie.name}
                </motion.h1>
              )}
            </div>

            <div id="hero-badges-info" className="flex items-center gap-2.5 mb-4 md:mb-8 text-[10px] md:text-xs font-bold text-gray-400">
              <span className="px-2 py-0.5 border border-gray-600 rounded text-gray-300">4K HDR</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
              <span>{isActuallyTV ? t('tvShows') : t('movies')}</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
              <span className="text-gray-300 italic uppercase tracking-widest">{t('trending')}</span>
            </div>

            <div id="hero-interactive-buttons" className="flex items-center gap-3 md:gap-4 mb-4 md:mb-10 pointer-events-auto">
              {/* Play button */}
              <button 
                id="hero-play-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMovie(activeMovie);
                }}
                className="flex items-center justify-center gap-2 px-7 py-2 md:py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full font-black text-sm transition-transform hover:scale-105 active:scale-95 shadow-2xl backdrop-blur-md border border-white/30 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                {t('play')}
              </button>

              {/* Heart/Favorite button */}
              <button 
                id="hero-favorite-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(activeMovie);
                }}
                className={cn(
                  "flex items-center justify-center p-2.5 md:p-3 rounded-full font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl border backdrop-blur-md cursor-pointer",
                  favorited ? "bg-primary/40 text-white border-primary/50 hover:bg-primary/60" : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                )}
              >
                <Heart className={cn("w-5 h-5", favorited && "fill-current")} />
              </button>

              {/* Audio Control Icon right next to the Heart button */}
              {trailerKey && showVideo && (
                <button
                  id="hero-audio-mute-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className={cn(
                    "flex items-center justify-center p-2.5 md:p-3 rounded-full font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl border backdrop-blur-md cursor-pointer",
                    !isMuted ? "bg-emerald-500/40 text-emerald-100 border-emerald-500/50 hover:bg-emerald-500/60 animate-pulse" : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  )}
                  title={isMuted ? (language === 'ar' ? 'تشغيل الصوت' : 'Unmute audio') : (language === 'ar' ? 'كتم الصوت' : 'Mute audio')}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-emerald-300" />
                  )}
                </button>
              )}
            </div>

            {/* Slider Dots Centered */}
            <div className="flex items-center gap-1.5 mb-2 md:mb-4 pointer-events-auto">
              {movies.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`transition-all duration-700 ${idx === currentIndex ? 'w-8 bg-primary shadow-[0_0_8px_var(--primary-color)]' : 'w-2 bg-white/20'} h-1 rounded-full`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
