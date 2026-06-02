import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Heart, Share2, Plus, Film, Star, X, ChevronDown, ChevronRight, ChevronLeft, SkipForward, Calendar, MapPin, Download, Check, Users } from 'lucide-react';
import { Movie, MovieDetailsData, CastMember, Episode, Season, PersonDetails } from '../types';
import { fetchMovieDetails, fetchMovieCredits, getImageUrl, fetchMovieVideos, fetchSeasonDetails, getTmdbLanguage, fetchPersonDetails, fetchSimilar, fetchMovieImages } from '../services/tmdb';
import { useFavorites } from '../context/FavoritesContext';

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
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useWatchHistory } from '../context/WatchHistoryContext';
import { useDownloads } from '../context/DownloadsContext';
import { useWatchParty } from '../context/WatchPartyContext';
import { cn } from '../lib/utils';
import { FastAverageColor } from 'fast-average-color';
import MovieCard from './MovieCard';

interface MovieDetailsProps {
  movie: Movie;
  onClose: () => void;
}

export default function MovieDetails({ movie, onClose }: MovieDetailsProps) {
  const [details, setDetails] = useState<MovieDetailsData | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#000000');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const backdropRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fac = useRef<FastAverageColor | null>(null);

  useEffect(() => {
    fac.current = new FastAverageColor();
    return () => {
      if (fac.current) {
        fac.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (movie.backdrop_path && fac.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImageUrl(movie.backdrop_path, 'w500');
      img.onload = () => {
        if (fac.current) {
          fac.current.getColorAsync(img)
            .then(color => setBgColor(color.hex))
            .catch(() => setBgColor('#000000'));
        }
      };
      img.onerror = () => setBgColor('#000000');
    }
  }, [movie.backdrop_path]);

  const { toggleFavorite, isFavorite } = useFavorites();
  const { t, isRTL, language } = useLanguage();

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonDetails | null>(null);
  const [personLoading, setPersonLoading] = useState(false);

  const determinedMediaType = movie.media_type || ((movie.name || movie.first_air_date) ? 'tv' : 'movie');
  const isTV = determinedMediaType === 'tv';

  const favorited = isFavorite(movie.id);
  const { settings } = useSettings();
  const { updateProgress } = useWatchHistory();
  const { startDownload, isDownloaded, downloadedMovies } = useDownloads();
  const { createRoom, roomId: activeRoomId } = useWatchParty();
  const [partyLoading, setPartyLoading] = useState(false);

  const hasDownloads = isTV 
    ? downloadedMovies.some(d => d.movieId === movie.id)
    : isDownloaded(movie.id);

  const handleDownload = () => {
    onClose();
    navigate('/download', { state: { movie } });
  };

  const handleStartParty = async () => {
    setPartyLoading(true);
    try {
      const type = isTV ? 'tv' : 'movie';
      await createRoom(movie.id.toString(), type);
      // Room created, the context will handle showing the code/syncing
    } catch (error) {
      console.error('Error starting party:', error);
    } finally {
      setPartyLoading(false);
    }
  };

  const handlePersonClick = async (personId: number) => {
    setPersonLoading(true);
    const tmdbLang = getTmdbLanguage(language);
    const data = await fetchPersonDetails(personId, tmdbLang);
    setSelectedPerson(data);
    setPersonLoading(false);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      let mediaType = movie.media_type;
      if (!mediaType) {
        mediaType = (movie.name || movie.first_air_date) ? 'tv' : 'movie';
      }

      const tmdbLang = getTmdbLanguage(language);

      const [detailsData, creditsData, videosData, similarData, imagesData] = await Promise.all([
        fetchMovieDetails(movie.id, mediaType, tmdbLang),
        fetchMovieCredits(movie.id, mediaType, tmdbLang),
        fetchMovieVideos(movie.id, mediaType, tmdbLang),
        fetchSimilar(movie.id, mediaType, tmdbLang),
        fetchMovieImages(movie.id, mediaType)
      ]);
      
      setDetails(detailsData);
      if (creditsData) {
        setCast(creditsData.cast.slice(0, 10));
      }
      
      if (similarData) {
        setSimilar(similarData.slice(0, 10));
      }
      
      if (videosData) {
        const trailer = videosData.find((vid: any) => vid.type === 'Trailer' && vid.site === 'YouTube');
        setTrailerKey(trailer?.key || videosData[0]?.key || null);
      }

      if (imagesData && imagesData.logos && imagesData.logos.length > 0) {
        const bestLogo = imagesData.logos.find((l: any) => l.iso_639_1 === language) ||
                         imagesData.logos.find((l: any) => l.iso_639_1 === 'en') ||
                         imagesData.logos.find((l: any) => l.iso_639_1 === 'ar') ||
                         imagesData.logos[0];
        if (bestLogo) {
          setLogoUrl(bestLogo.file_path);
        } else {
          setLogoUrl(null);
        }
      } else {
        setLogoUrl(null);
      }

      setLoading(false);
    }
    loadData();
    
    if (containerRef.current) {
      containerRef.current.scrollTo(0, 0);
    }
    
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [movie, language]);

  useEffect(() => {
    if (isTV && details) {
      async function loadSeason() {
        const tmdbLang = getTmdbLanguage(language);
        const seasonData = await fetchSeasonDetails(movie.id, selectedSeason, tmdbLang);
        if (seasonData) setEpisodes(seasonData.episodes || []);
      }
      loadSeason();
    }
  }, [selectedSeason, movie.id, isTV, details, language]);

  const year = movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0];
  const duration = details?.runtime 
    ? `${details.runtime} MIN` 
    : details?.number_of_seasons 
      ? `${details.number_of_seasons} ${details.number_of_seasons === 1 ? t('seasons').slice(0, -1) : t('seasons')}`
      : 'N/A';

  const seasons = details?.seasons?.filter(s => s.season_number > 0) || [];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className={cn("fixed inset-0 z-[100] overflow-y-auto scrollbar-hide transition-colors duration-1000", isRTL ? "text-right" : "text-left")}
      style={{ 
        backgroundColor: bgColor,
        backgroundImage: `linear-gradient(to bottom, transparent, #000000 80%), radial-gradient(circle at top, ${bgColor}33, transparent 70%)`
      }}
    >
      <div className="relative w-full min-h-screen pb-20">
        <div className={cn("fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 pointer-events-none", isRTL && "flex-row-reverse")}>
          <button 
            onClick={onClose}
            className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-all active:scale-90 pointer-events-auto"
          >
            <ArrowLeft className={cn("w-6 h-6 text-white", isRTL && "rotate-180")} />
          </button>

          <div className="flex gap-4 pointer-events-auto">
            <button 
              onClick={() => toggleFavorite(movie)}
              className={cn(
                "p-3 rounded-full backdrop-blur-md transition-all active:scale-90",
                favorited ? "bg-primary text-white shadow-[0_0_20px_rgba(229,9,20,0.4)]" : "bg-black/40 hover:bg-black/60 text-white"
              )}
            >
              <Heart className={cn("w-6 h-6", favorited && "fill-current")} />
            </button>
            <button className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-all active:scale-90">
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="relative h-[55vh] w-full">
          <img 
            src={getImageUrl(movie.backdrop_path)} 
            className="w-full h-full object-cover"
            alt="Backdrop"
          />
          <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${bgColor}22, #000000)` }} />
          
          <div className="absolute inset-0 flex flex-col justify-end items-center pb-12 px-6 text-center">
            {logoUrl ? (
              <motion.div 
                id={`details-movie-logo-box-${movie.id}`}
                className="mb-6 h-20 sm:h-28 md:h-36 w-full max-w-[280px] sm:max-w-[420px] flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <img
                  id={`details-movie-logo-${movie.id}`}
                  src={getImageUrl(logoUrl, 'original')}
                  alt={movie.title || movie.name}
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                />
              </motion.div>
            ) : (
              <motion.h1 
                id="details-movie-title"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={cn("text-3xl sm:text-5xl md:text-6xl text-center leading-none tracking-tight mb-6 font-serif", getFallbackTitleStyle(movie).className)}
                style={getFallbackTitleStyle(movie).style}
              >
                {movie.title || movie.name}
              </motion.h1>
            )}

            <div className="flex items-center gap-5 text-[11px] font-black text-gray-400 tracking-wider">
              <span>{year}</span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded font-black">
                <Star className="w-3.5 h-3.5 fill-current" />
                {movie.vote_average.toFixed(1)}
              </div>
              <span className="uppercase">{duration}</span>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-20 max-w-5xl mx-auto space-y-12 -mt-6 relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {(details?.genres || []).map(genre => (
              <span key={genre.id} className="px-5 py-1.5 bg-white/10 border border-white/5 rounded-lg text-[9px] font-black text-white/50 uppercase tracking-widest">
                {genre.name}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => {
                const type = isTV ? 'tv' : 'movie';
                navigate(`/watch/${type}/${movie.id}${isTV ? '?s=1&e=1' : ''}`);
              }}
              className="w-full flex items-center justify-center gap-3 py-5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-2xl font-black text-base uppercase tracking-tighter transition-all transform hover:scale-[1.01] active:scale-[0.98] shadow-2xl"
            >
              <Play className="w-6 h-6 fill-current" />
              {t('play')}
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => toggleFavorite(movie)}
                className={cn(
                  "flex items-center justify-center p-5 border rounded-2xl font-black transition-all active:scale-95 backdrop-blur-md",
                  favorited 
                    ? "bg-primary/40 border-primary/50 text-white hover:bg-primary/60" 
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                )}
              >
                <Heart className={cn("w-6 h-6", favorited && "fill-current")} />
              </button>
              <button 
                onClick={() => {
                  const type = isTV ? 'tv' : 'movie';
                  navigate(`/watch/${type}/${movie.id}?trailer=true`);
                }}
                className="flex items-center justify-center gap-3 py-4.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all active:scale-95"
              >
                <Film className="w-5 h-5" />
                {t('watchTrailer')}
              </button>
              <button 
                onClick={handleDownload}
                className={cn(
                  "flex items-center justify-center gap-3 py-4.5 border rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all active:scale-95 backdrop-blur-md",
                  hasDownloads
                    ? "bg-green-600/20 border-green-500/30 text-green-500"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                )}
              >
                {hasDownloads ? (
                  <>
                    <Check className="w-5 h-5" />
                    {isRTL ? 'إدارة التنزيلات' : 'Manage Downloads'}
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    {isRTL ? 'تنزيل' : 'Download'}
                  </>
                )}
              </button>
              <button 
                onClick={handleStartParty}
                className={cn(
                  "flex items-center justify-center gap-3 py-4.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all active:scale-95 px-6",
                  activeRoomId && "bg-primary text-white border-none shadow-lg shadow-primary/20"
                )}
              >
                <Users className="w-5 h-5 shrink-0" />
                {activeRoomId ? (
                  <span className="font-mono tracking-wider">{activeRoomId}</span>
                ) : (
                  <span>{isRTL ? 'حفلة مشاهدة' : 'Party'}</span>
                )}
              </button>
            </div>
          </div>

          {isTV && seasons.length > 0 && (
            <div className="space-y-8">
              <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-6", isRTL && "md:flex-row-reverse")}>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{t('episodes')}</h3>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setIsSeasonOpen(!isSeasonOpen)}
                    className="flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest group"
                  >
                    {t('seasons').slice(0, -1)} {selectedSeason}
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isSeasonOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {isSeasonOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={cn("absolute top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[110]", isRTL ? "left-0" : "right-0")}
                      >
                        {seasons.map(s => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedSeason(s.season_number);
                              setIsSeasonOpen(false);
                            }}
                            className={cn(
                              "w-full px-6 py-4 text-left text-xs font-black uppercase tracking-widest transition-colors",
                              isRTL && "text-right",
                              selectedSeason === s.season_number ? "bg-primary text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {t('seasons').slice(0, -1)} {s.season_number}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

          <div className="space-y-4">
            {episodes.map((episode) => (
              <motion.div 
                key={episode.id}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => {
                  navigate(`/watch/tv/${movie.id}?s=${selectedSeason}&e=${episode.episode_number}`);
                }}
                className={cn("group relative flex flex-col md:flex-row gap-6 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer", isRTL && "md:flex-row-reverse")}
              >
                    <div className="relative w-full md:w-56 aspect-video shrink-0 rounded-xl overflow-hidden bg-gray-900 shadow-xl">
                      <img 
                        src={getImageUrl(episode.still_path, 'w500')} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={episode.name}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-8 h-8 text-white fill-current" />
                      </div>
                      <div className={cn("absolute bottom-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-black text-white", isRTL ? "right-2" : "left-2")}>
                        E{episode.episode_number}
                      </div>
                    </div>

                    <div className={cn("flex-1 space-y-2", isRTL && "text-right")}>
                      <h4 className="text-sm font-black text-white uppercase tracking-tighter group-hover:text-primary transition-colors">
                        {episode.episode_number}. {episode.name}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                        {episode.overview || t('aiNoResults')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-1.5 h-5 bg-primary rounded-full" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic">{t('about')}</h3>
            </div>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed opacity-90 font-medium whitespace-pre-line">
              {movie.overview || t('aiNoResults')}
            </p>
          </div>

          {cast.length > 0 && (
            <div className="space-y-8">
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="w-1.5 h-5 bg-primary rounded-full" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">{t('profile')}</h3>
              </div>
              
              <div className={cn("flex gap-6 overflow-x-auto pb-4 scrollbar-hide", isRTL && "flex-row-reverse")}>
                {cast.map(person => (
                  <button 
                    key={person.id} 
                    onClick={() => handlePersonClick(person.id)}
                    className="min-w-[90px] flex flex-col items-center gap-3 group"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl transition-all group-hover:border-primary">
                      <img 
                        src={getImageUrl(person.profile_path, 'w500')} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={person.name}
                      />
                    </div>
                    <span className="text-[10px] font-black text-gray-100 text-center line-clamp-2 w-full uppercase tracking-tighter leading-tight opacity-70 group-hover:opacity-100 transition-opacity">
                      {person.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {similar.length > 0 && (
            <div className="space-y-8">
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="w-1.5 h-5 bg-primary rounded-full" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">
                  {isRTL ? 'قد يعجبك أيضاً' : 'You Might Also Like'}
                </h3>
              </div>
              
              <div className={cn("flex gap-6 overflow-x-auto pb-8 scrollbar-hide", isRTL && "flex-row-reverse")}>
                {similar.map(m => (
                  <div key={m.id} className="min-w-[140px] md:min-w-[190px]">
                    <MovieCard movie={m} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actor Details Modal */}
      <AnimatePresence>
        {selectedPerson && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-3xl max-h-[85vh] overflow-hidden relative z-10 flex flex-col md:flex-row shadow-2xl"
            >
              <button 
                onClick={() => setSelectedPerson(null)}
                className="absolute top-4 right-4 z-30 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Actor Profile Section */}
              <div className="w-full md:w-80 relative shrink-0">
                <div className="aspect-[4/5] md:h-full relative overflow-hidden">
                  <img 
                    src={getImageUrl(selectedPerson.profile_path, 'w500')} 
                    className="w-full h-full object-cover object-top"
                    alt={selectedPerson.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  
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
              <div className="flex-1 p-6 md:p-10 overflow-y-auto scrollbar-hide space-y-8">
                <div className={cn("hidden md:space-y-4 md:block", isRTL ? "text-right" : "text-left")}>
                  <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                    {selectedPerson.name}
                  </h2>
                  
                  <div className={cn("flex flex-wrap gap-4", isRTL && "justify-end")}>
                    {selectedPerson.birthday && (
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 py-1.5 px-3 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
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
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 py-1.5 px-3 rounded-lg">
                      <Calendar className="w-3 h-3" />
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
                    "text-gray-400 text-sm md:text-base leading-relaxed font-medium opacity-80",
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
                      {selectedPerson.combined_credits.cast.slice(0, 6).map(work => (
                        <div 
                          key={work.id} 
                          onClick={() => {
                            setSelectedPerson(null);
                            onClose();
                            const mediaType = work.media_type || (work.title ? 'movie' : 'tv');
                            navigate(`/watch/${mediaType}/${work.id}${mediaType === 'tv' ? '?s=1&e=1' : ''}`);
                          }}
                          className="space-y-2 group cursor-pointer transition-all active:scale-95"
                        >
                          <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 border border-white/5 group-hover:border-primary transition-colors shadow-xl">
                            <img src={getImageUrl(work.poster_path, 'w500')} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" alt={work.title || work.name} />
                          </div>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter line-clamp-1 text-center opacity-60 group-hover:opacity-100 italic transition-opacity">
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
