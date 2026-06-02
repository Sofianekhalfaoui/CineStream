import React, { useState } from 'react';
import { Sparkles, Send, X, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getAiRecommendations } from '../services/geminiService';
import { searchMovies, getImageUrl, getTmdbLanguage } from '../services/tmdb';
import { useLanguage } from '../context/LanguageContext';
import { useMovie } from '../context/MovieContext';
import { Movie } from '../types';

export default function AiAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const { t, language, isRTL } = useLanguage();
  const { setSelectedMovie } = useMovie();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setRecommendations([]);

    try {
      const titles = await getAiRecommendations(input, language);
      const tmdbLang = getTmdbLanguage(language);
      
      const movieResults: Movie[] = [];
      for (const title of titles) {
        const searchRes = await searchMovies(title, tmdbLang);
        if (searchRes && searchRes.length > 0) {
          movieResults.push(searchRes[0]);
        }
      }
      
      setRecommendations(movieResults);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#111] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden relative z-10 flex flex-col h-[70vh] md:h-[80vh] shadow-2xl"
          >
            <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-primary flex items-center justify-center animate-pulse">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tight leading-none">{t('aiAssistant')}</h3>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Powered by Gemini</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scrollbar-hide">
              {!recommendations.length && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <Sparkles className="w-16 h-16 text-gray-700 relative z-10" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <p className="text-white font-black italic uppercase tracking-tighter text-xl">
                      {isRTL ? 'كيف تشعر اليوم؟' : 'How are you feeling?'}
                    </p>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">
                      {isRTL ? 'أخبرني بمزاجك وسأقترح عليك فيلماً مناسباً' : 'Tell me your mood and I will suggest the perfect movie'}
                    </p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-black text-gray-500 uppercase tracking-widest animate-pulse">{t('aiSearching')}</p>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {recommendations.map((movie, idx) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => {
                        setSelectedMovie(movie);
                        onClose();
                      }}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-[2/3] rounded-2xl overflow-hidden relative border border-white/5 bg-gray-900 mb-2">
                        <img 
                          src={getImageUrl(movie.poster_path)} 
                          alt={movie.title || movie.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-4 h-4 fill-white text-white ml-1" />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {movie.title || movie.name}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {new Date(movie.release_date || movie.first_air_date || '').getFullYear()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 bg-white/[0.02] border-t border-white/5">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isRTL ? 'مثال: فيلم رعب في الغابة...' : 'e.g. A scary movie in the woods...'}
                  className={cn(
                    "w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 md:py-4 px-5 md:px-6 text-white text-sm outline-none focus:border-primary/50 transition-colors pr-14",
                    isRTL ? "text-right" : "text-left"
                  )}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary-dark transition-colors active:scale-95 disabled:opacity-50",
                    isRTL ? "left-2" : "right-2"
                  )}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Send className={cn("w-4 h-4 md:w-5 md:h-5", isRTL && "rotate-180")} />}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
