import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Loader2, 
  Sparkles, 
  Filter, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Info, 
  Volume2, 
  VolumeX, 
  Star,
  Heart,
  Film
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { getRequests, getTmdbLanguage, getImageUrl, fetchMovieVideos, filterAdultContent } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import MovieRow from '../components/MovieRow';
import { useMovie } from '../context/MovieContext';
import { useFavorites } from '../context/FavoritesContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Movie } from '../types';
import { cn } from '../lib/utils';
import TrailerVideoPlayer from '../components/TrailerVideoPlayer';

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [moviesByGenre, setMoviesByGenre] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Dynamic slide states corresponding to Top 5 Movies of Today
  const [trendingToday, setTrendingToday] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [startTrailer, setStartTrailer] = useState(false);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  
  const activeGenre = searchParams.get('genre') || 'all';
  const activeTimeRange = searchParams.get('time') || 'all';

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const { t, isRTL, language } = useLanguage();
  const { settings } = useSettings();
  const { setSelectedMovie } = useMovie();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { openSubscription } = useSubscription();
  const navigate = useNavigate();

  const tmdbLang = getTmdbLanguage(language);
  const requests = getRequests(tmdbLang, settings.contentFilter);

  // Helper to translate genres on the fly for the hero badge
  const getGenreName = (id: number) => {
    const map: Record<number, { ar: string; en: string; fr: string }> = {
      28: { ar: 'أكشن', en: 'Action', fr: 'Action' },
      12: { ar: 'مغامرة', en: 'Adventure', fr: 'Aventure' },
      16: { ar: 'أنمي', en: 'Anime', fr: 'Animation' },
      35: { ar: 'كوميديا', en: 'Comedy', fr: 'Comédie' },
      80: { ar: 'جريمة', en: 'Crime', fr: 'Crime' },
      99: { ar: 'وثائقي', en: 'Documentary', fr: 'Documentaire' },
      18: { ar: 'دراما', en: 'Drama', fr: 'Drame' },
      10751: { ar: 'عائلي', en: 'Family', fr: 'Famille' },
      14: { ar: 'فانتازيا', en: 'Fantasy', fr: 'Fantaisie' },
      36: { ar: 'تاريخي', en: 'History', fr: 'Histoire' },
      27: { ar: 'رعب', en: 'Horror', fr: 'Horreur' },
      10402: { ar: 'موسيقي', en: 'Music', fr: 'Musique' },
      9648: { ar: 'غموض', en: 'Mystery', fr: 'Mystère' },
      10749: { ar: 'رومانسي', en: 'Romance', fr: 'Romance' },
      878: { ar: 'خيال علمي', en: 'Sci-Fi', fr: 'Science-Fiction' },
      10770: { ar: 'فيلم تلفزيوني', en: 'TV Movie', fr: 'Téléfilm' },
      53: { ar: 'إثارة', en: 'Thriller', fr: 'Thriller' },
      10752: { ar: 'حربي', en: 'War', fr: 'Guerre' },
      37: { ar: 'غرب أمريكي', en: 'Western', fr: 'Western' }
    };
    const genre = map[id];
    if (!genre) return isRTL ? 'مغامرة' : 'Adventure';
    return language === 'ar' ? genre.ar : language === 'fr' ? genre.fr : genre.en;
  };

  const getFetchUrl = (pageNum: number, genre: string, timeRange = activeTimeRange) => {
    let baseUrl = requests.fetchMovies;
    let params = `&page=${pageNum}`;
    
    // Apply filters matching requested options:
    // "الأحدث" (newest), "الأعلى تقيماً" (top_rated), "الأكثر مشاهدة" (most_watched), "الأكثر شعبية" (most_popular), "حسب السنة" (by_year)
    if (timeRange === 'newest') {
      params += `&sort_by=primary_release_date.desc&primary_release_date.lte=${new Date().toISOString().split('T')[0]}`;
    } else if (timeRange === 'top_rated') {
      params += `&sort_by=vote_average.desc&vote_count.gte=100`;
    } else if (timeRange === 'most_watched') {
      params += `&sort_by=vote_count.desc`;
    } else if (timeRange === 'most_popular') {
      params += `&sort_by=popularity.desc`;
    } else if (timeRange === 'by_year') {
      const currentYear = new Date().getFullYear();
      params += `&primary_release_year=${currentYear}&sort_by=popularity.desc`;
    } else if (genre !== 'all') {
      params += `&sort_by=popularity.desc`;
    }

    if (genre === 'turkish') {
      baseUrl = requests.fetchTurkishMovies;
    } else if (genre !== 'all') {
      baseUrl = `${requests.fetchMovies}&with_genres=${genre}`;
    }
    return `${baseUrl}${params}`;
  };

  // Fetch data specifically for single-category flat grids
  const fetchGenreGridMovies = async (pageNum: number, isInitial = false, genre = activeGenre, timeRange = activeTimeRange) => {
    setLoading(true);
    try {
       const startPage = isInitial ? 1 : (pageNum - 1) * 3 + 1;
       const promises = [];
       
       // Batch fetch multiple pages to keep the grid looking dense & full
       for (let i = startPage; i < startPage + 3; i++) {
         promises.push(axios.get(getFetchUrl(i, genre, timeRange)));
       }
       
       const results = await Promise.all(promises);
       const newMovies = results.flatMap(res => res.data?.results || []);
       
       // Apply adult content filter on the fetched grid movies list
       const filteredMovies = filterAdultContent(newMovies, settings.contentFilter);
       
       setMoviesByGenre(prev => isInitial ? filteredMovies : [...prev, ...filteredMovies]);
       if (isInitial) setInitialLoading(false);
    } catch (error) {
       console.error("Error fetching grid movies:", error);
    } finally {
       setLoading(false);
    }
  };

  // Fetch dynamic top 5 trending movies of today & configure startup
  useEffect(() => {
    async function loadTrendingToday() {
      try {
        const response = await axios.get(requests.fetchTrendingMoviesToday);
        if (response.data.results && response.data.results.length > 0) {
          const filtered = filterAdultContent(response.data.results, settings.contentFilter);
          const top5 = filtered.slice(0, 5);
          setTrendingToday(top5);
        }
      } catch (err) {
        console.error("Error setting custom menu hero top 5:", err);
      } finally {
        setInitialLoading(false);
      }
    }

    if (activeGenre === 'all') {
      loadTrendingToday();
    } else {
      fetchGenreGridMovies(1, true, activeGenre, activeTimeRange);
    }
  }, [activeGenre, activeTimeRange, language, settings.contentFilter]);

  // Load youtube video trail for current movie section slide after 5 seconds delay
  useEffect(() => {
    if (trendingToday.length === 0) return;
    const activeMovie = trendingToday[currentIndex];
    
    // Reset video player states for the newly active slide
    setTrailerKey(null);
    setShowVideo(false);
    setStartTrailer(false);
    setIsLoadingTrailer(true);

    const selectedLang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
    let isSubscribed = true;

    async function loadTrailer() {
      try {
        const videos = await fetchMovieVideos(activeMovie.id, 'movie', selectedLang);
        const ytTrailer = videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
                          videos.find((v: any) => v.site === 'YouTube' && v.type === 'Teaser') ||
                          videos.find((v: any) => v.site === 'YouTube');
        
        if (isSubscribed) {
          if (ytTrailer?.key) {
            setTrailerKey(ytTrailer.key);
          } else {
            // Fallback to English language trailer
            const fallbackVideos = await fetchMovieVideos(activeMovie.id, 'movie', 'en-US');
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
        console.error('Could not fetch movie section slide video:', e);
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
  }, [currentIndex, trendingToday, language]);

  // Auto-advance loop when no trailer is found or playing
  useEffect(() => {
    if (trendingToday.length === 0) return;

    let autoTimer: NodeJS.Timeout | null = null;

    if (!isLoadingTrailer && !trailerKey) {
      // Stay on the backdrop for 8 seconds, then slide to the next movie
      autoTimer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % trendingToday.length);
      }, 8000);
    }

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
    };
  }, [currentIndex, trendingToday, trailerKey, isLoadingTrailer]);

  const handlePanEnd = (_: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      // Swipe Right -> Previous
      setCurrentIndex((prev) => (prev - 1 + trendingToday.length) % trendingToday.length);
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe Left -> Next
      setCurrentIndex((prev) => (prev + 1) % trendingToday.length);
    }
  };

  const activeMovieSlide = trendingToday[currentIndex];

  const handleGenreChange = (genreId: string) => {
    if (genreId === activeGenre) return;
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set('genre', genreId);
    setSearchParams(newParams, { replace: true });
    
    setPage(1);
    setMoviesByGenre([]);
    
    if (genreId !== 'all') {
      fetchGenreGridMovies(1, true, genreId, activeTimeRange);
    }
  };

  const handleTimeRangeChange = (rangeId: string) => {
    if (rangeId === activeTimeRange) return;
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set('time', rangeId);
    setSearchParams(newParams, { replace: true });
    
    setPage(1);
    setMoviesByGenre([]);
    setIsFilterOpen(false);
    
    if (activeGenre !== 'all') {
      fetchGenreGridMovies(1, true, activeGenre, rangeId);
    }
  };

  const genres = [
    { id: 'all', name: isRTL ? 'الكل' : 'All' },
    { id: '28', name: isRTL ? 'أكشن' : 'Action' },
    { id: '27', name: isRTL ? 'رعب' : 'Horror' },
    { id: '18', name: isRTL ? 'دراما' : 'Drama' },
    { id: 'turkish', name: isRTL ? 'تركي' : 'Turkish' },
    { id: '35', name: isRTL ? 'كوميدي' : 'Comedy' },
    { id: '878', name: isRTL ? 'خيال علمي' : 'Sci-Fi' },
    { id: '12', name: isRTL ? 'مغامرة' : 'Adventure' },
    { id: '10749', name: isRTL ? 'رومانسية' : 'Romance' },
    { id: '16', name: isRTL ? 'أنمي' : 'Anime' },
  ];

  const timeRanges = [
    { id: 'all', name: isRTL ? 'الكل' : 'All' },
    { id: 'newest', name: isRTL ? 'الأحدث' : 'Newest' },
    { id: 'top_rated', name: isRTL ? 'الأعلى تقيماً' : 'Top Rated' },
    { id: 'most_watched', name: isRTL ? 'الأكثر مشاهدة' : 'Most Watched' },
    { id: 'most_popular', name: isRTL ? 'الأكثر شعبية' : 'Most Popular' },
    { id: 'by_year', name: isRTL ? 'حسب السنة' : 'By Year' },
  ];

  const renderFilterControls = () => {
    return (
      <div className="flex items-center gap-2 relative">
        {/* TIME FILTER BUTTON (تصفية) */}
        <div className="relative">
          <button
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all text-white backdrop-blur-md cursor-pointer text-[11px] font-black uppercase tracking-wider",
              activeTimeRange !== 'all' && "bg-primary/20 text-white border-primary/40"
            )}
            title={isRTL ? 'تصفية الزمن' : 'Time Filter'}
          >
            <Filter className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">
              {isRTL ? 'تصفية' : 'Filter'}
            </span>
            {activeTimeRange !== 'all' && (
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse ml-0.5" />
            )}
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsFilterOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn(
                    "absolute top-full mt-2 w-48 bg-[#0d1225]/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl p-2 space-y-1",
                    isRTL ? "left-0" : "right-0"
                  )}
                >
                  {timeRanges.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => {
                        handleTimeRangeChange(range.id);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        activeTimeRange === range.id
                          ? "bg-primary text-[#070b19] font-black"
                          : "text-gray-400 hover:bg-white/10 hover:text-white"
                      )}
                      style={{ textAlign: isRTL ? 'right' : 'left' }}
                    >
                      {range.name}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-primary font-black uppercase tracking-[0.3em] text-xs">
            {isRTL ? 'جاري تحميل واجهة السينما...' : 'Rendering Cinema Hub...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white overflow-x-hidden relative">
      
      {/* 1. DYNAMIC CINEMATIC HERO SLIDERS (Top 5 Movies of Today with Auto Video Ad timer) */}
      {activeGenre === 'all' && activeMovieSlide && (
        <motion.header 
          id="hero-header-banner"
          className="relative w-full h-[75vh] md:h-[88vh] overflow-hidden flex items-end touch-pan-y select-none"
          onPanEnd={handlePanEnd}
        >
          {/* Background Media Container with AnimatePresence Fades */}
          <div className="absolute inset-0 z-0 bg-black">
            {/* Render the trailer after 3 seconds (startTrailer is true) so it plays/buffers in the background */}
            {trailerKey && startTrailer && (
              <div id={`hero-trailer-wrapper-${activeMovieSlide.id}`} className="absolute inset-0 w-full h-full z-0">
                <TrailerVideoPlayer
                  videoKey={trailerKey}
                  isMuted={isMuted}
                  onEnded={() => {
                    setCurrentIndex((prev) => (prev + 1) % trendingToday.length);
                  }}
                />
              </div>
            )}

            {/* Backdrop Image - displayed on top (z-10), fades out when showVideo is true to expose the running trailer */}
            <AnimatePresence>
              {(!showVideo || !trailerKey) && (
                <motion.img
                  id={`hero-backdrop-img-${activeMovieSlide.id}`}
                  key={`img-${activeMovieSlide.id}`}
                  src={getImageUrl(activeMovieSlide.backdrop_path, 'original')}
                  alt={activeMovieSlide.title}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 1.0, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none z-10"
                />
              )}
            </AnimatePresence>

            {/* Premium Dark Sleek Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b19] via-[#070b19]/30 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b19]/60 via-transparent to-transparent z-20 pointer-events-none" />
          </div>

          {/* Top Navigation Frame Positioned Absolutely directly under the app logo */}
          <motion.button 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/')}
            className="absolute left-4 md:left-12 top-20 md:top-24 z-30 flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 bg-black/55 hover:bg-black/75 border border-white/10 rounded-xl transition-all backdrop-blur-md pointer-events-auto"
          >
            {isRTL ? <ArrowRight className="w-3.5 h-3.5 text-primary" /> : <ArrowLeft className="w-3.5 h-3.5 text-primary" />}
            <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest">
              {isRTL ? 'الرئيسية' : 'Back to Home'}
            </span>
          </motion.button>

          {/* Featured Content Details - Tightened spacing and pushed to the absolute bottom */}
          <div className="relative z-20 w-full max-w-4xl mx-auto px-4 pb-3 md:pb-4 flex flex-col items-center text-center space-y-1.5 pointer-events-none">
            
            {/* Display / Aesthetic Title Typography */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter italic uppercase leading-none max-w-3xl drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)]">
              {activeMovieSlide.title}
            </h1>

            {/* Beautiful Badges list *under* the Title */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs font-bold text-gray-300 pointer-events-auto">
              <span className="px-2 py-0.5 text-[9px] md:text-[10px] font-black tracking-widest text-primary border border-primary/40 bg-transparent rounded uppercase">
                {isRTL ? 'جودة عالية' : '4K HDR'}
              </span>
              <span className="px-2 py-0.5 text-[9px] md:text-[10px] font-black text-white border border-white/20 rounded uppercase">
                {isRTL ? 'فيلم' : 'MOVIE'}
              </span>
              <span className="text-[11px] md:text-xs">
                • {activeMovieSlide.genre_ids?.[0] ? getGenreName(activeMovieSlide.genre_ids[0]) : ''}
              </span>
              <span className="text-[11px] md:text-xs">
                • {activeMovieSlide.release_date?.split('-')[0]}
              </span>
              {activeMovieSlide.vote_average > 0 && (
                <span className="flex items-center gap-1 text-yellow-500 font-mono text-xs font-semibold ml-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  {activeMovieSlide.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            {/* Interactive Control Buttons */}
            {(() => {
              const favorited = isFavorite(activeMovieSlide.id);
              return (
                <>
                  <div className="flex items-center justify-center gap-3 md:gap-4 pointer-events-auto">
                    {/* Play button */}
                    <button 
                      onClick={() => setSelectedMovie(activeMovieSlide)}
                      className="flex items-center justify-center gap-2 px-7 py-2 md:py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full font-black text-sm transition-transform hover:scale-105 active:scale-95 shadow-2xl backdrop-blur-md border border-white/30 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white animate-pulse" />
                      {isRTL ? 'تشغيل' : 'Play'}
                    </button>

                    {/* Heart/Favorite button */}
                    <button 
                      onClick={() => toggleFavorite(activeMovieSlide)}
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
                        onClick={() => setIsMuted(!isMuted)}
                        className={cn(
                          "flex items-center justify-center p-2.5 md:p-3 rounded-full font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-xl border backdrop-blur-md cursor-pointer",
                          !isMuted ? "bg-emerald-500/40 text-emerald-100 border-emerald-500/50 hover:bg-emerald-500/60" : "bg-white/10 text-white border-white/20 hover:bg-white/20"
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

                  {/* Carousel Page Slides Custom Indicators */}
                  <div className="flex items-center justify-center gap-1.5 pointer-events-auto">
                    {trendingToday.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all duration-700 ${idx === currentIndex ? 'w-8 bg-primary shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'w-2 bg-white/20'} h-1 rounded-full`}
                      />
                    ))}
                  </div>
                </>
              );
            })()}

          </div>
        </motion.header>
      )}

      {/* Grid Header padding if hero is absent */}
      {activeGenre !== 'all' && (
        <div className="pt-28 md:pt-32 px-4 md:px-12 flex flex-col gap-4">
          <motion.button 
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => handleGenreChange('all')}
            className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all self-start"
          >
            {isRTL ? <ArrowRight className="w-4 h-4 text-primary" /> : <ArrowLeft className="w-4 h-4 text-primary" />}
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {isRTL ? 'الرجوع للمكتبة الكاملة' : 'Back to Universe'}
            </span>
          </motion.button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none italic">
                {genres.find(g => g.id === activeGenre)?.name} <span className="text-primary">Movies</span>
              </h1>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-black">
                {isRTL ? 'تصفية حسب التصنيف والوقت' : 'Filtered category library selection'}
              </p>
            </div>
            <div className="relative z-30 self-start sm:self-center">
              {renderFilterControls()}
            </div>
          </div>
        </div>
      )}

      {/* 3. MULTI-ROW CINEMATIC LANES (If activeGenre is 'all' - Matches screenshot) */}
      {activeGenre === 'all' ? (
        <div className="space-y-2 md:space-y-4 pb-20">
          
          {/* Lane 1: Today's Top 10 with large magnificent Rank numbers */}
          <MovieRow 
            title={isRTL ? "أفضل 10 أفلام اليوم" : "Top 10 Movies Today"} 
            fetchUrl={requests.fetchPopular} 
            isLargeRow 
            isTop10 
            headerRight={renderFilterControls()}
          />

          {/* Lane 2: Popular Movies Row */}
          <MovieRow 
            title={isRTL ? "أفلام شهيرة" : "Popular Movies"} 
            fetchUrl={requests.fetchPopular} 
          />

          {/* Lane 3: Top Rated Movies Row */}
          <MovieRow 
            title={isRTL ? "أفضل الأفلام تقييماً" : "Top Rated Movies"} 
            fetchUrl={requests.fetchTopRated} 
          />



          {/* Lane 5: Sci-Fi & Fantasy Category */}
          <MovieRow 
            title={t('sciFiFantasy')} 
            fetchUrl={requests.fetchSciFiFantasy} 
          />

          {/* Lane 6: Horror & Thriller Category */}
          <MovieRow 
            title={t('horrorThriller')} 
            fetchUrl={requests.fetchHorrorThriller} 
          />

          {/* Lane 7: Crime & Mystery Category */}
          <MovieRow 
            title={t('crimeMystery')} 
            fetchUrl={requests.fetchCrimeMystery} 
          />

        </div>
      ) : (
        /* 4. FLAT GRID LAYOUT FOR SELECTED CATEGORIES */
        <div id="movies-genre-grid-wrapper" className="max-w-7xl mx-auto px-4 md:px-12 pb-24 z-10 relative">
          
          {moviesByGenre.length === 0 && !loading && (
            <div className="py-24 text-center">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-sm">
                {isRTL ? 'لا تتوفر أفلام في هذه الفئة حالياً' : 'No movies found in this selection.'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mt-6">
            {moviesByGenre.map((movie, index) => (
              <MovieCard key={`${movie.id}-${index}`} movie={movie} />
            ))}
          </div>

          {/* Load More Option */}
          {moviesByGenre.length > 0 && (
            <div className="mt-20 text-center space-y-6">
              <div className="flex items-center justify-center gap-4 opacity-20">
                <div className="w-16 h-px bg-gradient-to-r from-transparent to-white" />
                <Sparkles className="w-4 h-4 text-primary" />
                <div className="w-16 h-px bg-gradient-to-l from-transparent to-white" />
              </div>
              
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchGenreGridMovies(nextPage);
                }}
                disabled={loading}
                className="group relative px-12 py-4 bg-white hover:bg-primary text-[#070b19] hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-40"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isRTL ? 'تحميل المزيد من الأفلام' : 'Load More Cinema'}</span>
                </span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
