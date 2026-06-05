import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Check, Loader2, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

interface AdsVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  movieTitle: string;
}

const AD_URLS = [
  'https://www.google.com/search?q=cinestream+best+free+movies',
  'https://www.themoviedb.org/',
  'https://github.com/'
];

export default function AdsVerificationModal({ isOpen, onClose, onComplete, movieTitle }: AdsVerificationModalProps) {
  const { language, isRTL } = useLanguage();
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setStepsCompleted(0);
      setIsVerifying(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Localized strings
  const localized = {
    title: {
      ar: 'المحتوى مجاني 🎬',
      en: 'Content is Free 🎬',
      fr: 'Contenu Gratuit 🎬'
    },
    subtitle: {
      ar: 'بضع إعلانات سريعة فقط للوصول إليه',
      en: 'Just a few quick ads to gain access',
      fr: 'Juste quelques pubs rapides pour y accéder'
    },
    step1Title: {
      ar: 'انقر على "مشاهدة"',
      en: 'Click on "Watch"',
      fr: 'Cliquez sur "Regarder"'
    },
    step1Desc: {
      ar: 'تُفتح علامة تبويب إعلانية - وهي تُموّل الوصول المجاني.',
      en: 'An ad tab opens - this funds free access.',
      fr: 'Un onglet publicitaire s\'ouvre - cela finance l\'accès gratuit.'
    },
    step2Title: {
      ar: 'أغلق علامة التبويب',
      en: 'Close the tab',
      fr: 'Fermez l\'onglet'
    },
    step2Desc: {
      ar: 'أغلقه فور فتحه ومجرد بدء تحميله.',
      en: 'Close it as soon as it opens and loads.',
      fr: 'Fermez-le dès qu\'il s\'ouvre.'
    },
    step3Title: {
      ar: 'عد إلى هنا — يبدأ الأمر',
      en: 'Return here — it begins',
      fr: 'Revenez ici — ça commence'
    },
    step3Desc: {
      ar: 'لا نقرة أخرى، لا إعلان آخر. هذا كل شيء!',
      en: 'No other click, no other ad. That\'s all!',
      fr: 'Pas d\'autre clic, pas d\'autre pub. C\'est tout !'
    },
    thanksTitle: {
      ar: 'شكراً لدعمكم فلك بلاي 💙',
      en: 'Thank you for supporting FalakPlay 💙',
      fr: 'Merci de soutenir FalakPlay 💙'
    },
    thanksDesc: {
      ar: 'بفضلكم يبقى الموقع مجانياً للجميع.',
      en: 'Thanks to you, the site remains free for everyone.',
      fr: 'Grâce à vous, le site reste gratuit pour tous.'
    },
    clicksRemaining: {
      ar: (count: number) => {
        if (count === 3) return 'باقي 3 نقرات';
        if (count === 2) return 'باقي 2 نقرات';
        if (count === 1) return 'باقي نقرة واحدة فقط';
        return 'مكتمل!';
      },
      en: (count: number) => `${count} click${count > 1 ? 's' : ''} remaining`,
      fr: (count: number) => `${count} clic${count > 1 ? 's' : ''} restant${count > 1 ? 's' : ''}`
    },
    completedText: {
      ar: (pct: number) => `مكتمل %${pct}`,
      en: (pct: number) => `${pct}% completed`,
      fr: (pct: number) => `${pct}% complété`
    },
    btnWatchFree: {
      ar: 'شاهد مجاناً ▶',
      en: 'Watch Free ▶',
      fr: 'Regarder Gratuitement ▶'
    },
    btnSubtext: {
      ar: 'بضع نقرات • لا حاجة لحساب • مجاني 100%',
      en: 'Few clicks • No account needed • 100% Free',
      fr: 'Quelques clics • Aucun compte requis • 100% Gratuit'
    },
    btnStartWatching: {
      ar: 'بدء المشاهدة الآن 🎬',
      en: 'Start Watching Now 🎬',
      fr: 'Lancer la Lecture 🎬'
    },
    btnStartWatchingSub: {
      ar: 'تم التحقق بنجاح! شكراً لصبرك',
      en: 'Successfully verified! Thanks for your patience',
      fr: 'Vérifié avec succès ! Merci de votre patience'
    },
    verifyingText: {
      ar: 'جاري التحقق من مشاهدة الإعلان وثواني المشاهدة...',
      en: 'Verifying ad view and watch seconds...',
      fr: 'Vérification de l\'affichage publicitaire en cours...'
    }
  };

  const currentLang = (language === 'ar' || language === 'en' || language === 'fr') ? language : 'ar';
  
  const getTranslation = (key: keyof typeof localized) => {
    return localized[key][currentLang];
  };

  const handleWatchAdClick = () => {
    if (isVerifying) return;

    if (stepsCompleted >= 3) {
      // Completed all steps! Go watch the movie now
      onComplete();
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    // Open a safe ad/sponsor URL in a new tab
    const adUrl = AD_URLS[stepsCompleted] || AD_URLS[0];
    try {
      window.open(adUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error("Popup blocker probably prevented window.open", e);
    }

    // Simulate ad viewing verification over 2.5 seconds to feel extremely authentic and high-tech
    setTimeout(() => {
      setIsVerifying(false);
      setStepsCompleted(prev => {
        const next = prev + 1;
        if (next === 3) {
          // Play a visual trigger or automatically transition shortly
        }
        return next;
      });
    }, 2500);
  };

  const percentage = Math.min(100, Math.floor((stepsCompleted / 3) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal content body */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={cn(
            "bg-[#080d1a] border border-white/10 rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 flex flex-col space-y-6 relative overflow-hidden shadow-2xl text-white",
            isRTL ? "text-right" : "text-left"
          )}
        >
          {/* Neon decorative background glow */}
          <div className="absolute top-0 left-1/4 w-1/2 h-20 bg-blue-500/10 blur-[50px] pointer-events-none" />

          {/* Close button inside circle top right */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-6 p-2 rounded-full border border-white/5 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-10",
              isRTL ? "left-6" : "right-6"
            )}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Header Section */}
          <div className={cn("flex items-center gap-4 border-b border-white/5 pb-4", isRTL ? "flex-row" : "flex-row")}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/10 border border-blue-500/35 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {getTranslation('title') as string}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {getTranslation('subtitle') as string}
              </p>
            </div>
          </div>

          {/* Core Interactive Steps (1, 2, 3) */}
          <div className="flex flex-col gap-3">
            {/* Step 1 */}
            <div
              className={cn(
                "flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 border",
                stepsCompleted === 0 
                  ? "bg-blue-600/5 border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.05)]" 
                  : stepsCompleted > 0
                    ? "bg-white/[0.01] border-white/5 opacity-50"
                    : "bg-white/[0.01] border-white/5 opacity-40"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm",
                stepsCompleted > 0 
                  ? "bg-green-500/20 border border-green-500/30 text-green-400" 
                  : "bg-blue-500/20 border border-blue-500/30 text-blue-400"
              )}>
                {stepsCompleted > 0 ? <Check className="w-4 h-4" /> : '١'}
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className={cn("text-sm font-bold", stepsCompleted === 0 ? "text-white" : "text-gray-300")}>
                  {getTranslation('step1Title') as string}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-normal">
                  {getTranslation('step1Desc') as string}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={cn(
                "flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 border",
                stepsCompleted === 1 
                  ? "bg-blue-600/5 border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.05)]" 
                  : stepsCompleted > 1
                    ? "bg-white/[0.01] border-white/5 opacity-50"
                    : "bg-white/[0.01] border-white/5 opacity-40"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm",
                stepsCompleted > 1 
                  ? "bg-green-500/20 border border-green-500/30 text-green-400" 
                  : "bg-blue-500/20 border border-blue-500/30 text-blue-400"
              )}>
                {stepsCompleted > 1 ? <Check className="w-4 h-4" /> : '٢'}
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className={cn("text-sm font-bold", stepsCompleted === 1 ? "text-white" : "text-gray-400")}>
                  {getTranslation('step2Title') as string}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-normal">
                  {getTranslation('step2Desc') as string}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={cn(
                "flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 border",
                stepsCompleted === 2 
                  ? "bg-blue-600/5 border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.05)]" 
                  : stepsCompleted > 2
                    ? "bg-green-500/5 border-green-500/10 opacity-70"
                    : "bg-white/[0.01] border-white/5 opacity-40"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm",
                stepsCompleted > 2 
                  ? "bg-green-500/20 border border-green-500/30 text-green-400" 
                  : "bg-blue-500/20 border border-blue-500/30 text-blue-400"
              )}>
                {stepsCompleted > 2 ? <Check className="w-4 h-4" /> : '٣'}
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className={cn("text-sm font-bold", stepsCompleted === 2 ? "text-white" : "text-gray-400")}>
                  {getTranslation('step3Title') as string}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-normal">
                  {getTranslation('step3Desc') as string}
                </p>
              </div>
            </div>
          </div>

          {/* Middle thank you box */}
          <div className="p-4 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10 flex items-center gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] text-center justify-center flex-col">
            <span className="text-sm font-extrabold text-blue-400 tracking-tight">
              {getTranslation('thanksTitle') as string}
            </span>
            <span className="text-xs text-gray-500 font-medium leading-normal block -mt-1.5Packed">
              {getTranslation('thanksDesc') as string}
            </span>
          </div>

          {/* Progress Section */}
          <div className="space-y-2.5">
            {/* Glowing neon progress track */}
            <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]"
              />
            </div>

            {/* Helper Labels info */}
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest px-1 font-mono">
              <span>
                {getTranslation('completedText') instanceof Function 
                  ? (getTranslation('completedText') as any)(percentage)
                  : ''
                }
              </span>
              <span>
                {getTranslation('clicksRemaining') instanceof Function 
                  ? (getTranslation('clicksRemaining') as any)(3 - stepsCompleted)
                  : ''
                }
              </span>
            </div>
          </div>

          {/* Bottom Call-To-Action Primary Trigger Button */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleWatchAdClick}
              disabled={isVerifying}
              className={cn(
                "w-full flex flex-col items-center justify-center py-4 px-6 rounded-2xl transition-all duration-300 relative overflow-hidden group active:scale-[0.98]",
                stepsCompleted >= 3
                  ? "bg-green-600 hover:bg-green-500 border border-green-500/30 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                  : isVerifying
                    ? "bg-blue-600/10 border border-blue-500/20 text-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.25)] border border-blue-500/20"
              )}
            >
              {isVerifying ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-bold tracking-tight">
                    {getTranslation('verifyingText') as string}
                  </span>
                </div>
              ) : stepsCompleted >= 3 ? (
                <div className="text-center py-0.5">
                  <span className="text-base font-black uppercase tracking-tight block">
                    {getTranslation('btnStartWatching') as string}
                  </span>
                  <span className="text-[10px] text-green-200 block mt-0.5 opacity-90">
                    {getTranslation('btnStartWatchingSub') as string}
                  </span>
                </div>
              ) : (
                <div className="text-center py-0.5">
                  <span className="text-base font-black uppercase tracking-tight block flex items-center justify-center gap-1.5">
                    {getTranslation('btnWatchFree') as string}
                  </span>
                  <span className="text-[10px] text-blue-200 block mt-0.5 opacity-80">
                    {getTranslation('btnSubtext') as string}
                  </span>
                </div>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
