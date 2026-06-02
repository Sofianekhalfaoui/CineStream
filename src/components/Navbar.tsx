import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, X, Film, Tv, Heart, Download, Settings, LogOut, ArrowLeft, ArrowRight, Sparkles, User as UserIcon, Mic, Users, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { searchMovies, searchOnlyMovies, searchTVShows, getImageUrl, getTmdbLanguage } from '../services/tmdb';
import { useMovie } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useWatchParty } from '../context/WatchPartyContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useSettings } from '../context/SettingsContext';
import { logout } from '../lib/firebase';
import { Movie } from '../types';
import AiAssistant from './AiAssistant';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cinestream_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing recent searches', e);
      }
    }
  }, []);

  const saveSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const updated = [
        trimmed,
        ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
      ].slice(0, 5);
      localStorage.setItem('cinestream_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };
  const { setSelectedMovie } = useMovie();
  const { t, isRTL, language } = useLanguage();
  const { settings } = useSettings();
  const { roomId, joinRoom } = useWatchParty();
  const [showPartyJoin, setShowPartyJoin] = useState(false);
  const [partyCode, setPartyCode] = useState('');
  const [partyError, setPartyError] = useState('');

  const handleJoinParty = async () => {
    if (!partyCode) return;
    try {
      await joinRoom(partyCode.toUpperCase());
      setShowPartyJoin(false);
      setPartyCode('');
      setPartyError('');
      // Navigate to watch page after joining if media info is in room state
    } catch (error) {
      setPartyError(isRTL ? 'الغرفة غير موجودة' : 'Room not found');
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isRTL ? 'متصفحك لا يدعم البحث الصوتي' : 'Your browser does not support voice search');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };

    recognition.start();
  };

  const { user } = useAuth();
  const { openSubscription } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = location.pathname === '/';

  interface MenuItem {
    icon: React.ElementType;
    label: string;
    path: string;
    dangerous?: boolean;
    onClick?: () => void;
  }

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim().length > 0) {
        let results;
        const tmdbLang = getTmdbLanguage(language);
        
        if (location.pathname === '/tv') {
          results = await searchTVShows(searchQuery, tmdbLang, settings.contentFilter);
        } else if (location.pathname === '/movies') {
          results = await searchOnlyMovies(searchQuery, tmdbLang, settings.contentFilter);
        } else {
          results = await searchMovies(searchQuery, tmdbLang, settings.contentFilter);
        }
        
        setSearchResults(results.filter((m: Movie) => (m.media_type as string) !== 'person' && (m.poster_path || m.backdrop_path)).slice(0, 15));
      } else {
        setSearchResults([]);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, location.pathname, language, settings.contentFilter]);

  // Lock scroll when search results or menu are open
  useEffect(() => {
    const isShowingResults = isSearchOpen && (
      (searchResults.length > 0 && searchQuery.trim().length > 0) ||
      (searchQuery.trim().length === 0 && recentSearches.length > 0)
    );
    if (isShowingResults || isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSearchOpen, searchResults, searchQuery, isMenuOpen, recentSearches]);

  const menuItems: MenuItem[] = [
    { icon: Film, label: t('movies'), path: '/movies' },
    { icon: Tv, label: t('tvShows'), path: '/tv' },
    { icon: Heart, label: t('myList'), path: '/favorites' },
    { icon: Download, label: isRTL ? 'التنزيلات' : 'Downloads', path: '/downloads' },
    { icon: Settings, label: t('settings'), path: '/settings' },
    { 
      icon: Users, 
      label: isRTL ? 'حفلة مشاهدة' : 'Watch Party', 
      path: '#', 
      onClick: () => { setIsMenuOpen(false); setShowPartyJoin(true); } 
    },
  ];

  return (
    <>
      <nav 
        dir="ltr"
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300 px-4 py-4 md:px-12 flex items-center justify-between",
          "bg-gradient-to-b from-black/60 to-transparent dark:from-black/60",
        )}
      >
        {/* Left Section: Logo, Back button (on subpages) and desktop links */}
        <div className="flex-1 flex items-center justify-start gap-4">
          {/* Beautiful Red Metallic Logo Symbol Only (C inside play-button triangle) at far left */}
          <Link to="/" className="group flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-11 h-11 md:w-14 md:h-14 transition-transform hover:scale-105 active:scale-95 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <defs>
                {/* 3D Shiny Metallic Red Gradient */}
                <linearGradient id="c_metallic" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4d4d" />
                  <stop offset="25%" stopColor="#cc1111" />
                  <stop offset="50%" stopColor="#ff0000" />
                  <stop offset="75%" stopColor="#990000" />
                  <stop offset="100%" stopColor="#ff4d4d" />
                </linearGradient>

                {/* Internal Gloss / Glass Arc Accent */}
                <linearGradient id="c_gloss" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#000000" stopOpacity="0.0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
                </linearGradient>

                {/* Ambient Red glow fill */}
                <radialGradient id="c_ambient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff1a1a" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ff1a1a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Reddish Background Aura */}
              <circle cx="50%" cy="50%" r="42%" fill="url(#c_ambient)" opacity="0.65" />

              {/* Highly Swept Glossy Metallic 'C' shape matching standard letter curves */}
              <path 
                d="M 72,25 
                   C 65,16 54,12 43,12 
                   C 20,12 9,28 9,50 
                   C 9,72 20,88 43,88 
                   C 54,88 65,84 72,75 
                   C 63,82 52,85 41,85 
                   C 22,85 14,70 14,50 
                   C 14,30 22,15 41,15 
                   C 52,15 63,18 72,25 Z"
                fill="url(#c_metallic)" 
              />

              {/* Gloss overlays for the 3D shiny effect */}
              <path 
                d="M 72,25 
                   C 65,16 54,12 43,12 
                   C 20,12 9,28 9,50 
                   C 9,72 20,88 43,88 
                   C 54,88 65,84 72,75 
                   C 63,82 52,85 41,85 
                   C 22,85 14,70 14,50 
                   C 14,30 22,15 41,15 
                   C 52,15 63,18 72,25 Z"
                fill="url(#c_gloss)" 
                style={{ mixBlendMode: 'overlay' }}
              />

              {/* Highlight Contour Edge Beveling */}
              <path 
                d="M 70,27 C 59,15 22,18 16,50 C 14,73 45,86 70,75" 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="1.2" 
                strokeLinecap="round" 
                opacity="0.45" 
              />

              {/* 3D play button triangle inside */}
              <polygon 
                points="43,34 71,50 43,66" 
                fill="url(#c_metallic)" 
                stroke="#ff3333"
                strokeWidth="0.5"
                className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
              />
              <polygon 
                points="43,34 71,50 43,66" 
                fill="url(#c_gloss)" 
                style={{ mixBlendMode: 'overlay' }}
              />
            </svg>
          </Link>

          {!isHome && !['/movies', '/tv'].includes(location.pathname) && (
            <button 
              onClick={() => navigate('/')}
              className="p-2 md:p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full transition-all active:scale-90"
            >
              {isRTL ? <ArrowRight className="w-6 h-6 text-gray-900 dark:text-white" /> : <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />}
            </button>
          )}

          {/* Desktop Links (Hidden on small screens) */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-black uppercase tracking-widest text-[10px] ml-4">
            <NavLink to="/movies" className={({ isActive }) => cn("cursor-pointer hover:text-white transition-colors", isActive ? "text-primary" : "text-gray-400")}>{t('movies')}</NavLink>
            <NavLink to="/tv" className={({ isActive }) => cn("cursor-pointer hover:text-white transition-colors", isActive ? "text-primary" : "text-gray-400")}>{t('tvShows')}</NavLink>
            <NavLink to="/downloads" className={({ isActive }) => cn("cursor-pointer hover:text-white transition-colors", isActive ? "text-primary" : "text-gray-400")}>{isRTL ? 'التنزيلات' : 'Downloads'}</NavLink>
          </div>
        </div>

        {/* Right Section: All controls with Hamburger Menu on the absolute far right */}
        <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* Search Box & Button */}
            {!['/favorites', '/settings', '/profile'].includes(location.pathname) && (
              <div ref={searchRef} className="relative flex items-center shrink-0">
                <AnimatePresence>
                  {isSearchOpen ? (
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: window.innerWidth < 768 ? 'calc(50vw + 60px)' : 500, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 flex flex-row items-center bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-full h-12 md:h-14 overflow-hidden z-[65] shadow-2xl backdrop-blur-3xl",
                        "right-0 origin-right"
                      )}
                    >
                      <div className="flex items-center w-full h-full">
                        <Search className="w-5 h-5 text-gray-400 shrink-0 mx-4" />
                        <input
                          autoFocus
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchQuery.trim()) {
                              saveSearch(searchQuery);
                            }
                          }}
                          placeholder={t('searchPlaceholder')}
                          className={cn(
                            "bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm md:text-base flex-1 placeholder:text-gray-500",
                            isRTL ? "text-right" : "text-left"
                          )}
                        />
                        <button 
                          onClick={handleVoiceSearch}
                          className={cn(
                            "p-2 hover:text-primary transition-colors shrink-0",
                            isListening && "text-primary animate-pulse",
                            isRTL ? "mr-1" : "ml-1"
                          )}
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} 
                          className="p-3 hover:text-primary transition-colors shrink-0"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button 
                      onClick={() => setIsSearchOpen(true)}
                      className="p-2 md:p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full transition-all active:scale-90"
                    >
                      <Search className="w-5 h-5 text-gray-900 dark:text-white" />
                    </button>
                  )}
                </AnimatePresence>

                {/* Search Results Dropdown remains looking relative to searchRef */}
                <AnimatePresence>
                  {isSearchOpen && (
                    (searchResults.length > 0 && searchQuery) ||
                    (!searchQuery.trim() && recentSearches.length > 0)
                  ) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={cn(
                        "absolute top-14 md:top-16 w-[320px] md:w-[500px] max-w-[95vw] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-[60] flex flex-col",
                        "right-0"
                      )}
                    >
                      {searchQuery.trim() !== '' ? (
                        <div className="p-2 space-y-1 max-h-[40vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide">
                          {searchResults.map((movie) => (
                            <button
                              key={movie.id}
                              onClick={() => {
                                saveSearch(searchQuery);
                                setSelectedMovie(movie);
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors",
                                isRTL ? "flex-row-reverse text-right" : "flex-row text-left"
                              )}
                            >
                              <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-white/5 bg-gray-900">
                                <img src={getImageUrl(movie.poster_path || movie.backdrop_path, 'w500')} className="w-full h-full object-cover" alt={movie.title || ''} />
                              </div>
                              <div className={cn("flex flex-col items-start gap-1 overflow-hidden", isRTL && "items-end")}>
                                <span className="text-white text-[11px] font-black uppercase tracking-tight line-clamp-1 italic">
                                  {movie.title || movie.name}
                                </span>
                                <div className={cn("flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase", isRTL && "flex-row-reverse")}>
                                  <span>{(movie.release_date || movie.first_air_date)?.split('-')[0]}</span>
                                  <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                  <span className="text-primary italic">TMDB {movie.vote_average?.toFixed(1) || '0.0'}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 flex flex-col gap-3">
                          <div className={cn("flex items-center justify-between border-b border-white/10 pb-2", isRTL && "flex-row-reverse")}>
                            <span className={cn("text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              {isRTL ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
                            </span>
                            <button 
                              onClick={() => {
                                setRecentSearches([]);
                                localStorage.removeItem('cinestream_recent_searches');
                              }}
                              className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline transition-all"
                            >
                              {isRTL ? 'مسح الكل' : 'Clear All'}
                            </button>
                          </div>
                          <div className="flex flex-col gap-1.5 max-h-[30vh] overflow-y-auto scrollbar-hide">
                            {recentSearches.map((query, index) => (
                              <div 
                                key={index}
                                className={cn(
                                  "flex items-center justify-between p-2 hover:bg-white/5 rounded-xl group/item transition-colors",
                                  isRTL ? "flex-row-reverse" : "flex-row"
                                )}
                              >
                                <button
                                  onClick={() => {
                                    setSearchQuery(query);
                                    saveSearch(query);
                                  }}
                                  className={cn(
                                    "flex-grow flex items-center gap-2.5 text-xs font-semibold text-white/95 hover:text-primary transition-colors",
                                    isRTL ? "flex-row-reverse text-right" : "flex-row text-left"
                                  )}
                                >
                                  <Search className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-primary transition-colors" />
                                  <span className="line-clamp-1">{query}</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = recentSearches.filter((_, i) => i !== index);
                                    setRecentSearches(updated);
                                    localStorage.setItem('cinestream_recent_searches', JSON.stringify(updated));
                                  }}
                                  className="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-primary transition-colors shrink-0"
                                  title={isRTL ? 'حذف' : 'Delete'}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
            )}
            
            {/* Notification Bell Center */}
            {isHome && <NotificationCenter />}

            {/* Hamburger Menu Button & dropdown content placed on the absolute far right */}
            <div ref={menuRef} className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 md:p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-full transition-all active:scale-90"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-gray-900 dark:text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
                )}
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={cn(
                      "absolute top-14 w-64 bg-white dark:bg-black/40 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[70] right-0 origin-top-right"
                    )}
                  >
                    <div className="p-3 space-y-1">
                      {menuItems.map((item, index) => (
                        <Link
                          key={index}
                          to={item.path}
                          onClick={item.onClick}
                          className={cn(
                            "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group",
                            isRTL ? "flex-row-reverse text-right" : "flex-row text-left",
                            item.dangerous ? "hover:bg-primary/10 text-primary" : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                          )}
                        >
                          <item.icon className={cn("w-5 h-5", item.dangerous ? "text-primary" : "text-gray-500 dark:text-gray-400 group-hover:text-primary")} />
                          <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                    {user ? (
                      <Link to="/profile" className={cn("bg-gray-50 dark:bg-white/5 p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors", isRTL && "flex-row-reverse")}>
                        <div className="w-8 h-8 rounded-full bg-primary overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                          <img 
                            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=e50914&color=fff`} 
                            alt={user.displayName || 'User'} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className={cn("flex flex-col overflow-hidden", isRTL ? "text-right" : "text-left")}>
                          <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                            {user.displayName}
                          </span>
                          <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('premium')} Member</span>
                        </div>
                      </Link>
                    ) : (
                      <Link to="/profile" className={cn("bg-gray-50 dark:bg-white/5 p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors", isRTL && "flex-row-reverse")}>
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-white/10 shrink-0">
                          <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                        </div>
                        <div className={cn("flex flex-col", isRTL ? "text-right" : "text-left")}>
                          <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight">
                            {isRTL ? 'تسجيل الدخول' : 'Guest User'}
                          </span>
                          <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">{isRTL ? 'انقر لتسجيل الدخول' : 'Click to Sign In'}</span>
                        </div>
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </nav>

      <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

      <AnimatePresence>
        {showPartyJoin && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPartyJoin(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-md p-8 relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowPartyJoin(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  {isRTL ? 'انضم لحفلة مشاهدة' : 'Join Watch Party'}
                </h2>
                <p className="text-gray-400 text-sm font-medium">
                  {isRTL ? 'أدخل رمز الغرفة لمشاهدة الأفلام مع أصدقائك في نفس الوقت' : 'Enter a room code to watch movies with friends in sync.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    value={partyCode}
                    onChange={(e) => setPartyCode(e.target.value.toUpperCase())}
                    placeholder={isRTL ? 'رمز الغرفة (مثال: ABCD12)' : 'Room Code (e.g., ABCD12)'}
                    className={cn(
                      "w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 text-white font-black text-center placeholder:text-gray-600 uppercase tracking-[0.3em] outline-none transition-all focus:border-primary",
                      partyError && "border-primary shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                    )}
                  />
                  {partyError && <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-2">{partyError}</p>}
                </div>
                
                <button 
                  onClick={handleJoinParty}
                  className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  {isRTL ? 'انضم الآن' : 'Join Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
