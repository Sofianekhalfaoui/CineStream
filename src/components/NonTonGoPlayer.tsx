import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ExternalLink } from 'lucide-react';

interface NonTonGoPlayerProps {
  id: string | number;
  imdbId?: string;
  mediaType: 'movie' | 'tv' | string;
  season?: number;
  episode?: number;
  onLoad?: () => void;
}

export default function NonTonGoPlayer({ id, imdbId, mediaType, season, episode, onLoad }: NonTonGoPlayerProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const baseAddress = '194.233.78.22';
  const [isLoading, setIsLoading] = useState(true);
  const [showDirectLink, setShowDirectLink] = useState(false);

  // We should try HTTPS protocol inside the secure environment's iframe
  const embedUrl = mediaType === 'tv' && season && episode
    ? `https://${baseAddress}/embed/tv/${id}/${season}/${episode}`
    : `https://${baseAddress}/embed/movie/${id}`;

  // Direct HTTP link bypasses secure frames or mixed-content problems completely
  const directHttpUrl = mediaType === 'tv' && season && episode
    ? `http://${baseAddress}/embed/tv/${id}/${season}/${episode}`
    : `http://${baseAddress}/embed/movie/${id}`;

  useEffect(() => {
    // Show a premium bypass button if iframe is blocked or takes more than 3.5 seconds
    const timer = setTimeout(() => {
      setShowDirectLink(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [id, season, episode]);

  const handleOnLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  return (
    <div id="nontongo-player-container" className="relative w-full h-full flex flex-col bg-black">
      <div id="nontongo-iframe-wrapper" className="relative w-full h-full flex-grow aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/5">
        
        {/* Iframe element */}
        <iframe
          id="nontongo-iframe-element"
          src={embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={handleOnLoad}
        />

        {/* Loading Overlay with modern UI fallback button */}
        {isLoading && (
          <div id="nontongo-player-loading-overlay" className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 z-30 p-6 text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-lg" />
            
            <div className="flex flex-col items-center gap-2 max-w-sm">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {isAr ? 'جاري تشغيل سيرفر NonTon Go...' : 'Loading NonTon Go Server...'}
              </span>
              
              <p className="text-[10px] text-white/50 leading-relaxed">
                {isAr 
                  ? 'يتم جلب محتوى بروتوكول الإنترنت بشكل آمن.' 
                  : 'Fetching the internet protocol streaming node...'}
              </p>

              {showDirectLink && (
                <div className="mt-2 flex flex-col gap-2 items-center animate-pulse">
                  <a
                    href={directHttpUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      setIsLoading(false);
                      if (onLoad) onLoad();
                    }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-black text-[10px] py-2.5 px-5 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer uppercase tracking-wider border border-white/10"
                  >
                    <span>{isAr ? 'فتح المشغل مباشرة (صفحة كاملة)' : 'Open Player Directly'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-[9px] text-white/40 max-w-xs mt-1">
                    {isAr 
                      ? 'بسبب حماية متصفحك، قد تحتاج للضغط على الزر أعلاه لتشغيل الفيلم دون قيود.' 
                      : 'Due to browser security policy, click above if the media is restricted inside frames.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Active Pulse badge */}
        <div 
          id="nontongo-floating-badge"
          className="absolute bottom-4 left-4 z-25 flex items-center gap-2 bg-slate-950/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-full shadow-lg select-none scale-90 md:scale-100"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-black text-white/95 uppercase tracking-wider">
            NONTON GO IP
          </span>
        </div>
      </div>
    </div>
  );
}
