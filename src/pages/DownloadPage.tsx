import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Download, CheckCircle2, Monitor, ShieldCheck, Zap, HardDrive, LayoutGrid, ChevronDown, ListMusic, PlayCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDownloads } from '../context/DownloadsContext';
import { useMovie } from '../context/MovieContext';
import { getImageUrl, fetchMovieDetails, fetchSeasonDetails } from '../services/tmdb';
import { cn } from '../lib/utils';
import { Season, Episode } from '../types';

const qualities = [
  { id: '720p', label: '720p (HD)', size: '850 MB', icon: LayoutGrid, desc: 'High Definition - Balanced' },
  { id: '1080p', label: '1080p (FHD)', size: '1.8 GB', icon: Monitor, desc: 'Full HD - Best for Mobile' },
  { id: '4k', label: 'Ultra HD (4K)', size: '4.2 GB', icon: Zap, desc: 'Highest Quality - Best for iPads/TV' },
];

export default function DownloadPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isRTL, language } = useLanguage();
  const { startDownload, isDownloaded, getDownloadStatus } = useDownloads();
  const { setSelectedMovie } = useMovie();
  const initialMovie = location.state?.movie;
  
  const [movie, setMovie] = useState(initialMovie);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [isStarting, setIsStarting] = useState<string | null>(null);
  
  // TV specific state
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);

  useEffect(() => {
    if (!initialMovie) {
      navigate('/');
      return;
    }

    const determinedMediaType = initialMovie.media_type || ((initialMovie.name || initialMovie.first_air_date) ? 'tv' : 'movie');

    if (determinedMediaType === 'tv') {
      const getShowDetails = async () => {
        const details = await fetchMovieDetails(initialMovie.id, 'tv', language === 'ar' ? 'ar-SA' : 'en-US');
        if (details && details.seasons) {
          setMovie({ ...details, media_type: 'tv' });
          setSeasons(details.seasons.filter((s: Season) => s.season_number > 0));
        }
      };
      getShowDetails();
    }
  }, [initialMovie, navigate, language]);

  const handleBack = () => {
    if (movie) {
      setSelectedMovie(movie);
    }
    navigate(-1);
  };

  if (!movie) return null;

  const isTV = movie.media_type === 'tv' || ((movie.name || movie.first_air_date) ? true : false);

  useEffect(() => {
    if (isTV) {
      const getEpisodes = async () => {
        setIsLoadingEpisodes(true);
        const details = await fetchSeasonDetails(movie.id, selectedSeason, language === 'ar' ? 'ar-SA' : 'en-US');
        if (details && details.episodes) {
          setEpisodes(details.episodes);
        }
        setIsLoadingEpisodes(false);
      };
      getEpisodes();
    }
  }, [movie.id, isTV, selectedSeason, language]);

  const handleStartDownload = (episode?: Episode) => {
    const id = episode 
      ? `tv_${movie.id}_s${selectedSeason}_e${episode.episode_number}`
      : movie.id;

    if (isDownloaded(id)) return;
    
    const quality = qualities.find(q => q.id === selectedQuality);
    if (!quality) return;
    
    const startId = episode ? episode.id.toString() : 'movie';
    setIsStarting(startId);
    
    setTimeout(() => {
      if (episode) {
        startDownload(movie, quality.label, quality.size, {
          season: selectedSeason,
          episode: episode.episode_number,
          name: episode.name
        });
      } else {
        startDownload(movie, quality.label, quality.size);
      }
      setIsStarting(null);
    }, 800);
  };

  const handleDownloadSeason = () => {
    const quality = qualities.find(q => q.id === selectedQuality);
    if (!quality) return;

    episodes.forEach((episode, index) => {
      const id = `tv_${movie.id}_s${selectedSeason}_e${episode.episode_number}`;
      if (!isDownloaded(id)) {
        setTimeout(() => {
          startDownload(movie, quality.label, quality.size, {
            season: selectedSeason,
            episode: episode.episode_number,
            name: episode.name
          });
        }, index * 500); // Stagger downloads
      }
    });
  };

  const renderQualitySelector = () => (
    <div className={cn("space-y-4", isRTL && "text-right")}>
      <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
        <div className="w-1.5 h-6 bg-primary rounded-full" />
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/70">
          {isRTL ? 'اختر الجودة' : 'Select Download Quality'}
        </h3>
      </div>

      <div className="grid gap-3">
        {qualities.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelectedQuality(q.id)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-[20px] border transition-all group relative overflow-hidden",
              selectedQuality === q.id 
                ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(220,38,38,0.1)]" 
                : "bg-white/5 border-white/5 hover:border-white/10",
              isRTL && "flex-row-reverse"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              selectedQuality === q.id ? "bg-primary text-white" : "bg-white/5 text-gray-500 group-hover:text-white"
            )}>
              <q.icon className="w-5 h-5" />
            </div>
            <div className={cn("flex-1 text-left", isRTL && "text-right")}>
              <h4 className="text-sm font-black italic uppercase tracking-tighter">{q.label}</h4>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">{q.size}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderMovieDownload = () => {
    const status = getDownloadStatus(movie.id);
    const isCurrentlyDownloading = status?.status === 'downloading';
    const isComplete = status?.status === 'completed';

    return (
      <div className="space-y-6">
        {renderQualitySelector()}
        
        <div className="pt-4 space-y-4">
          {isCurrentlyDownloading && (
            <div className="space-y-2">
              <div className={cn("flex justify-between text-[10px] font-black uppercase tracking-widest text-primary", isRTL && "flex-row-reverse")}>
                <span>{isRTL ? 'جاري التنزيل...' : 'Downloading...'}</span>
                <span>{Math.round(status.progress)}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${status.progress}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          )}

          <button 
            onClick={() => handleStartDownload()}
            disabled={isStarting === 'movie' || isDownloaded(movie.id)}
            className={cn(
              "w-full py-6 rounded-[28px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl",
              isComplete
                ? "bg-green-600/20 text-green-500 border border-green-500/30"
                : isCurrentlyDownloading
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-primary hover:bg-primary-dark text-white shadow-primary/20"
            )}
          >
            {isStarting === 'movie' ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isComplete ? (
              <>
                <CheckCircle2 className="w-6 h-6" />
                {isRTL ? 'موجود في التنزيلات' : 'Already Downloaded'}
              </>
            ) : isCurrentlyDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                {isRTL ? 'تنزيل نشط' : 'Active Download'}
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                {isRTL ? 'بدء التنزيل الآن' : 'Start Download Now'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderTvDownload = () => {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            {renderQualitySelector()}
            
            <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/5">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                {isRTL ? 'تحميل الموسم بالكامل' : 'Download Full Season'}
              </h4>
              <button 
                onClick={handleDownloadSeason}
                className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95 border border-white/5"
              >
                <ListMusic className="w-4 h-4 text-primary" />
                {isRTL ? 'تحميل الكل' : 'Download All'}
              </button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* Season Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                className={cn(
                  "w-full p-5 bg-white/5 rounded-2xl flex items-center justify-between border border-white/10 hover:border-white/20 transition-all",
                  isRTL && "flex-row-reverse"
                )}
              >
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-lg font-black uppercase tracking-tight italic">
                    {isRTL ? 'الموسم' : 'Season'} {selectedSeason}
                  </span>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform", isSeasonDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isSeasonDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-60 overflow-y-auto"
                  >
                    {seasons.map(season => (
                      <button
                        key={season.id}
                        onClick={() => {
                          setSelectedSeason(season.season_number);
                          setIsSeasonDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full p-4 text-left font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors border-b border-white/5",
                          isRTL && "text-right",
                          selectedSeason === season.season_number ? "text-primary bg-primary/5" : "text-gray-400"
                        )}
                      >
                        {isRTL ? 'الموسم' : 'Season'} {season.season_number}
                        {season.episode_count && <span className="ml-2 text-[10px] opacity-40">({season.episode_count} {isRTL ? 'حلقة' : 'Episodes'})</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Episode List */}
            <div className="space-y-3">
              {isLoadingEpisodes ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{t('aiSearching')}</p>
                </div>
              ) : (
                episodes.map(episode => {
                  const id = `tv_${movie.id}_s${selectedSeason}_e${episode.episode_number}`;
                  const status = getDownloadStatus(id);
                  const isCurrentlyDownloading = status?.status === 'downloading';
                  const isComplete = status?.status === 'completed';

                  return (
                    <div 
                      key={episode.id}
                      className={cn(
                        "group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-4",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      <div className="w-24 aspect-video rounded-lg overflow-hidden shrink-0 relative">
                        <img 
                          src={getImageUrl(episode.still_path || movie.backdrop_path, 'w500')} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="w-8 h-8 text-white fill-white/20" />
                        </div>
                        <div className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">
                          E{episode.episode_number}
                        </div>
                      </div>

                      <div className={cn("flex-1 min-w-0 text-left", isRTL && "text-right")}>
                        <h5 className="text-sm font-black text-white uppercase tracking-tight truncate mb-1">
                          {episode.episode_number}. {episode.name}
                        </h5>
                        <div className="flex items-center gap-2">
                          {isCurrentlyDownloading ? (
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-[8px] font-bold text-primary uppercase">
                                <span>{Math.round(status.progress)}%</span>
                                <span>{isRTL ? 'جاري التحميل' : 'Downloading'}</span>
                              </div>
                              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${status.progress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-500 font-medium line-clamp-1 opacity-60">
                              {episode.overview || (isRTL ? 'لا يوجد وصف متاح لهذه الحلقة.' : 'No description available for this episode.')}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartDownload(episode)}
                        disabled={isStarting === episode.id.toString() || isComplete}
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-90",
                          isComplete 
                            ? "bg-green-600/20 text-green-500" 
                            : isCurrentlyDownloading
                              ? "bg-primary/20 text-primary animate-pulse"
                              : "bg-white/5 text-gray-400 hover:bg-primary hover:text-white"
                        )}
                      >
                        {isStarting === episode.id.toString() ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : isComplete ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isCurrentlyDownloading ? (
                           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                            <Zap className="w-5 h-5 fill-current" />
                           </motion.div>
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex flex-col">
      {/* Background Poster Blur */}
      <div className="fixed inset-0 z-0">
        <img 
          src={getImageUrl(movie.backdrop_path, 'original')} 
          className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between backdrop-blur-md bg-black/20 border-b border-white/5">
        <button 
          onClick={handleBack} 
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-95 group overflow-hidden"
        >
          <ArrowLeft className={cn("w-6 h-6 text-white group-hover:text-primary transition-colors", isRTL && "rotate-180")} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter shadow-sm">
          {isRTL ? 'مركز التحميل' : 'Download Center'}
        </h1>
        <div className="w-12 h-12" />
      </nav>

      <main className="flex-1 z-10 pt-28 pb-12 px-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-10">
          {/* Movie Header Info */}
          <div className={cn("flex flex-col md:flex-row gap-8 items-center md:items-start", isRTL && "md:flex-row-reverse")}>
            <div className="w-48 shrink-0">
               <div className="aspect-[2/3] rounded-[32px] overflow-hidden border-2 border-white/10 shadow-2xl shadow-primary/10 transition-transform hover:scale-[1.02]">
                <img src={getImageUrl(movie.poster_path, 'w500')} className="w-full h-full object-cover" alt="" />
              </div>
            </div>
            <div className={cn("flex-1 space-y-4 text-center md:text-left", isRTL && "md:text-right")}>
               <div className={cn("flex flex-wrap gap-2 items-center justify-center md:justify-start", isRTL && "flex-row-reverse")}>
                <span className="text-[10px] bg-primary px-2.5 py-1 rounded-lg font-black italic tracking-wider">{movie.media_type === 'tv' ? 'SERIES' : 'MOVIE'}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}</span>
                {movie.media_type === 'tv' && movie.number_of_seasons && (
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">• {movie.number_of_seasons} {isRTL ? 'مواسم' : 'Seasons'}</span>
                )}
              </div>
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">{movie.title || movie.name}</h2>
              <p className="text-gray-400 text-sm max-w-2xl leading-relaxed line-clamp-2">{movie.overview}</p>
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/5" />

          {isTV ? renderTvDownload() : renderMovieDownload()}
          
          <div className="mt-6 flex items-start gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 max-w-2xl mx-auto md:mx-0">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
              {isRTL 
                ? 'سيتم تشفير التنزيل وحفظه بأمان للمشاهدة في وضع عدم الاتصال بالإنترنت داخل تطبيق CineStream فقط. يتم تخزين البيانات محلياً على جهازك ولا تستهلك باقة البيانات عند المشاهدة.' 
                : 'Download will be encrypted and saved securely for offline viewing within CineStream app only. Data is stored locally on your device and does not consume data when watching.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
