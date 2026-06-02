import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertTriangle, Home, Film, Tv, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { isRTL, language } = useLanguage();

  const isAr = language === 'ar';
  const isFr = language === 'fr';

  // Localized texts
  const title = isAr ? '٤٠٤' : '404';
  const heading = isAr 
    ? 'عذراً، الصفحة غير موجودة' 
    : isFr 
      ? 'Page non trouvée' 
      : 'Page Not Found';

  const description = isAr
    ? 'قد يكون الرابط معطلاً، أو تم نقل هذه الصفحة إلى عنوان آخر. دعنا نساعدك في العثور على طريق العودة.'
    : isFr
      ? 'Le lien est peut-être rompu ou la page a été déplacée. Laissez-nous vous aider à retrouver votre chemin.'
      : 'The link might be broken, or the page has been moved. Let us help you find your way back.';

  const goHomeBtn = isAr ? 'العودة للرئيسية' : isFr ? 'Retour à l\'accueil' : 'Go to Homepage';
  const moviesBtn = isAr ? 'تصفح الأفلام' : isFr ? 'Parcourir les films' : 'Browse Movies';
  const tvBtn = isAr ? 'تصفح المسلسلات' : isFr ? 'Parcourir les séries' : 'Browse TV Shows';

  const quickLinksTitle = isAr ? 'روابط سريعة:' : isFr ? 'Liens rapides :' : 'Quick Links:';

  return (
    <div id="not-found-container" className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12 text-center relative overflow-hidden">
      {/* Background ambient spot glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[100px] pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10 flex flex-col items-center gap-6"
      >
        {/* Warning Icon with red pulse border */}
        <div id="not-found-icon-wrapper" className="w-20 h-20 bg-primary/10 rounded-3xl border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 mb-2 relative">
          <AlertTriangle className="w-10 h-10 text-primary animate-pulse" />
          <span className="absolute -inset-1 rounded-3xl border border-primary/20 animate-ping opacity-25 pointer-events-none" />
        </div>

        {/* Huge 404 display text */}
        <h1 id="not-found-code" className="text-8xl md:text-9xl font-black tracking-widest text-primary italic font-sans selection:bg-primary selection:text-white leading-none">
          {title}
        </h1>

        <div className="space-y-3">
          <h2 id="not-found-heading" className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {heading}
          </h2>
          <p id="not-found-desc" className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Main Action Call */}
        <button
          id="not-found-home-btn"
          onClick={() => navigate('/')}
          className="mt-4 px-8 py-3.5 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          {goHomeBtn}
        </button>

        {/* Quick Links Footer Block */}
        <div id="not-found-quick-links" className="w-full border-t border-gray-100 dark:border-white/5 mt-8 pt-8 space-y-4">
          <span className="block text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-[0.2em]">
            {quickLinksTitle}
          </span>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              id="not-found-link-movies"
              onClick={() => navigate('/movies')}
              className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Film className="w-3.5 h-3.5" />
              {moviesBtn}
              {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            <button
              id="not-found-link-tv"
              onClick={() => navigate('/tv')}
              className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Tv className="w-3.5 h-3.5" />
              {tvBtn}
              {isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
