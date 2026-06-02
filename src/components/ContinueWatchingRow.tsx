import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { Movie } from '../types';
import { useMovie } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { useWatchHistory } from '../context/WatchHistoryContext';
import { getImageUrl } from '../services/tmdb';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface WatchProgress {
  movie: Movie;
  currentTime: number;
  duration: number;
  lastUpdated: number;
  season?: number;
  episode?: number;
}

interface ContinueWatchingRowProps {
  history: WatchProgress[];
}

export default function ContinueWatchingRow({ history }: ContinueWatchingRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { setSelectedMovie } = useMovie();
  const { isRTL } = useLanguage();
  const { removeFromHistory } = useWatchHistory();
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (history.length === 0) return null;

  return (
    <div className="flex flex-col space-y-4 px-4 md:px-12 my-8 relative group/row">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-primary rounded-full" />
        <div className="flex flex-col">
          <span className="text-primary font-black text-[10px] uppercase tracking-[0.4em] leading-none mb-1">
            {isRTL ? 'استئناف المشاهدة' : 'Jump Back In'}
          </span>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
            {isRTL ? 'واصل المشاهدة' : 'Continue'} <span className="text-primary">Watching</span>
          </h2>
        </div>
      </div>
      
      {/* Section Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none opacity-50 blur-3xl -z-10" />

      <div className="relative flex items-center">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 z-30 h-[80%] p-2 bg-white/60 dark:bg-black/60 text-gray-900 dark:text-white rounded-r-lg opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex items-center backdrop-blur-md border-y border-r border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div 
          ref={rowRef}
          className="flex items-center gap-4 overflow-x-scroll no-scrollbar py-4"
        >
          {history.map((item, index) => {
            const progress = (item.currentTime / item.duration) * 100;
            const isTV = (item.movie.name || item.movie.first_air_date);
            
            return (
              <motion.div
                key={`${item.movie.id}-${index}`}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="relative min-w-[220px] md:min-w-[340px] aspect-video rounded-xl overflow-hidden cursor-pointer group/card border border-white/10 shadow-2xl"
                onClick={() => {
                  const mediaType = isTV ? 'tv' : 'movie';
                  let url = `/watch/${mediaType}/${item.movie.id}`;
                  if (item.season && item.episode) {
                    url += `?s=${item.season}&e=${item.episode}`;
                  }
                  navigate(url);
                }}
              >
                {/* Backdrop Image */}
                <img
                  src={getImageUrl(item.movie.backdrop_path || item.movie.poster_path, 'w500')}
                  alt={item.movie.title || item.movie.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                {/* Play Button Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/30">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent">
                  <h4 className="text-white text-sm md:text-lg font-black uppercase tracking-tight line-clamp-1 mb-0.5 group-hover/card:text-primary transition-colors">
                    {item.movie.title || item.movie.name}
                  </h4>
                  {item.season ? (
                    <div className="text-[10px] md:text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <span>S{item.season} E{item.episode}</span>
                      <span className="w-1 h-1 bg-white/30 rounded-full" />
                      <span className="text-white/60 font-medium">{Math.round(progress)}% {isRTL ? 'مكتمل' : 'Complete'}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] md:text-sm font-black text-white/60 uppercase tracking-widest uppercase">
                      {Math.round(progress)}% {isRTL ? 'مكتمل' : 'Complete'}
                    </div>
                  )}
                </div>

                {/* Progress Bar with Blur Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1 md:h-1.5 bg-white/10 backdrop-blur-md overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-primary shadow-[0_0_15px_rgba(229,9,20,1)] relative"
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/30 to-transparent" />
                  </motion.div>
                </div>

                {/* Resume Status Badge */}
                <div className={cn(
                  "absolute top-3 px-2 py-1 bg-primary rounded text-[9px] font-black text-white uppercase tracking-widest shadow-lg opacity-0 group-hover/card:opacity-100 transition-all duration-300",
                  isRTL ? "right-3" : "left-3"
                )}>
                  {isRTL ? 'متابعة' : 'Resume'}
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(item.movie.id);
                  }}
                  className={cn(
                    "absolute top-3 p-1.5 bg-black/60 hover:bg-primary rounded-lg text-white shadow-lg z-20 transition-all duration-300 backdrop-blur-md border border-white/10",
                    "opacity-100 md:opacity-0 md:group-hover/card:opacity-100",
                    isRTL ? "left-3" : "right-3"
                  )}
                  title={isRTL ? 'إزالة' : 'Remove'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                
                {/* Time Indicator on Hover */}
                {/* <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                   <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                     {Math.floor(item.currentTime / 60)}:{(Math.floor(item.currentTime % 60)).toString().padStart(2, '0')}
                   </span>
                </div> */}
              </motion.div>
            );
          })}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 z-30 h-[80%] p-2 bg-white/60 dark:bg-black/60 text-gray-900 dark:text-white rounded-l-lg opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex items-center backdrop-blur-md border-y border-l border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
