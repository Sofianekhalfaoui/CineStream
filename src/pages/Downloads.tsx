import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trash2, Play, Download, HardDrive, LayoutGrid, X, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useDownloads } from '../context/DownloadsContext';
import { cn } from '../lib/utils';

export default function Downloads() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { downloadedMovies, removeDownload } = useDownloads();

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex flex-col pb-20">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between backdrop-blur-md bg-black/40 border-b border-white/5">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-95 group"
        >
          <ArrowLeft className={cn("w-6 h-6 text-white group-hover:text-primary transition-colors", isRTL && "rotate-180")} />
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter">
          {isRTL ? 'التنزيلات' : 'Downloads'}
        </h1>
        <div className="w-12 h-12" />
      </nav>

      {/* Content */}
      <main className="flex-1 pt-32 px-6 max-w-4xl mx-auto w-full">
        <div className="space-y-8">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/70">
              {isRTL ? 'أفلامك المحملة' : 'Your Offline Content'}
            </h3>
            <span className="ml-auto text-[10px] font-black italic bg-white/5 px-2.5 py-1 rounded-lg text-gray-400">
              {downloadedMovies.length} {isRTL ? 'عنصر' : 'ITEMS'}
            </span>
          </div>

          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {downloadedMovies.length > 0 ? (
                downloadedMovies.map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "group relative flex flex-col md:flex-row gap-4 p-4 bg-white/5 rounded-[32px] border border-white/5 hover:border-white/10 transition-all overflow-hidden",
                      isRTL && "md:flex-row-reverse text-right"
                    )}
                  >
                    {/* Progress Background Overlay */}
                    {item.status === 'downloading' && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        className="absolute inset-0 bg-primary/5 z-0"
                      />
                    )}

                    {/* Movie Poster */}
                    <div 
                      onClick={() => item.status === 'completed' && navigate(`/watch/${item.media_type || 'movie'}/${item.id}`)}
                      className={cn(
                        "w-full md:w-24 aspect-[2/3] md:aspect-auto md:h-32 bg-gray-800 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative z-10 group/poster",
                        item.status === 'completed' && "cursor-pointer"
                      )}
                    >
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-110" 
                        alt="" 
                      />
                      {item.status === 'completed' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/poster:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-center gap-2 relative z-10">
                      <div className="space-y-1">
                        <div className={cn("flex flex-wrap items-baseline gap-2", isRTL && "flex-row-reverse")}>
                          <h4 className="text-xl font-black uppercase italic tracking-tighter text-white group-hover:text-primary transition-colors">
                            {item.title || item.name}
                          </h4>
                          {item.episode_number && (
                            <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded italic">
                              S{item.season_number}E{item.episode_number}
                            </span>
                          )}
                        </div>
                        {item.episode_name && (
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                            {item.episode_name}
                          </p>
                        )}
                        <div className={cn("flex flex-wrap gap-3", isRTL && "flex-row-reverse")}>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.quality}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">•</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.size}</span>
                        </div>
                      </div>

                      <div className={cn("mt-2 flex items-center gap-3", isRTL && "flex-row-reverse")}>
                        {item.status === 'downloading' ? (
                          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <span className="text-[10px] font-black italic text-primary uppercase tracking-widest">
                              {isRTL ? 'جاري التنزيل...' : 'Downloading...'} {Math.round(item.progress)}%
                            </span>
                          </div>
                        ) : (
                          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span className="text-[10px] font-black italic text-green-500 uppercase tracking-widest">
                              {isRTL ? 'جاهز للمشاهدة' : 'Ready to Watch'}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.status === 'downloading' && (
                        <div className="mt-2 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-3 relative z-10 mt-auto md:mt-0", isRTL && "md:flex-row-reverse")}>
                      {item.status === 'completed' && (
                        <button 
                          onClick={() => navigate(`/watch/${item.media_type || 'movie'}/${item.id}`)}
                          className="flex-1 md:flex-none px-6 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                          {isRTL ? 'شاهد الآن' : 'Watch Now'}
                        </button>
                      )}
                      <button 
                        onClick={() => removeDownload(item.id)}
                        className="p-3 bg-white/5 text-gray-400 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all group/btn"
                        title={isRTL ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center gap-6"
                >
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                    <Download className="w-10 h-10 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">
                      {isRTL ? 'لا توجد تنزيلات' : 'No Downloads Yet'}
                    </h4>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                      {isRTL ? 'ابدأ بتحميل أفلامك المفضلة للمشاهدة لاحقاً' : 'Start downloading your favorite movies to watch anytime.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/')}
                    className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all active:scale-95"
                  >
                    {isRTL ? 'اكتشف الأفلام' : 'Explore Content'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Storage Info Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-primary" />
              </div>
              <div className={cn("text-left", isRTL && "text-right")}>
                <h5 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{isRTL ? 'مساحة التخزين المستخدمة' : 'Used Storage Space'}</h5>
                <p className="text-lg font-black italic uppercase tracking-tighter text-white">
                  {downloadedMovies.reduce((acc, item) => {
                    const size = parseFloat(item.size.split(' ')[0]);
                    return acc + (isNaN(size) ? 0 : size);
                  }, 0).toFixed(1)} GB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="h-1.5 w-32 md:w-64 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-primary w-[15%]" />
               </div>
               <span className="text-[10px] font-black text-gray-500 uppercase italic">15% {isRTL ? 'ممتلئ' : 'FULL'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
