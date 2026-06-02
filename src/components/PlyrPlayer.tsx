import React, { useState, useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

interface PlyrPlayerProps {
  title?: string;
  poster?: string;
  defaultVideoUrl?: string;
  onEnded?: () => void;
  onLoaded?: () => void;
}

export default function PlyrPlayer({ title, poster, defaultVideoUrl, onEnded, onLoaded }: PlyrPlayerProps) {
  const { isRTL, language } = useLanguage();
  const isAr = language === 'ar';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const plyrInstanceRef = useRef<Plyr | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Initialize Plyr player once on mount. Let Plyr manage the DOM without React interrupting it.
  useEffect(() => {
    if (!videoRef.current) return;

    const player = new Plyr(videoRef.current, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      settings: ['loop', 'speed'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
      keyboard: { global: true, focused: true },
      tooltips: { controls: true, seek: true },
      i18n: isAr ? {
        restart: 'إعادة التشغيل',
        rewind: 'إرجاع {seektime} ثوانٍ',
        play: 'تشغيل',
        pause: 'إيقاف مؤقت',
        fastForward: 'تقديم {seektime} ثوانٍ',
        seek: 'بحث',
        seekLabel: '{currentTime} من {duration}',
        played: 'تم تشغيله',
        buffered: 'المخزن مؤقتاً',
        currentTime: 'الوقت الحالي',
        duration: 'المدة الكلية',
        volume: 'مستوى الصوت',
        mute: 'كتم الصوت',
        unmute: 'إلغاء كتم الصوت',
        enterFullscreen: 'شاشة كاملة',
        exitFullscreen: 'إلغاء الشاشة الكاملة',
        frameTitle: 'مشغل لـ {title}',
        settings: 'الإعدادات',
        pip: 'صورة داخل صورة',
        speed: 'السرعة',
        normal: 'طبيعي',
        quality: 'الجودة',
        loop: 'تكرار',
      } : undefined
    });

    plyrInstanceRef.current = player;

    player.on('ready', () => {
      if (onLoaded) {
        onLoaded();
      }
    });

    player.on('ended', () => {
      if (onEnded) {
        onEnded();
      }
    });

    // Handle showing metadata card in sync with controls
    player.on('controlsshown', () => setControlsVisible(true));
    player.on('controlshidden', () => setControlsVisible(false));

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [isAr]); // Only recreate if language changes to localized i18n safely.

  // Use the native Plyr API to update the source instead of recreating Plyr or touching the video DOM,
  // preventing React virtual DOM reconciliation conflicts completely!
  useEffect(() => {
    const player = plyrInstanceRef.current;
    if (player && defaultVideoUrl) {
      player.source = {
        type: 'video',
        title: title || '',
        sources: [
          {
            src: defaultVideoUrl,
            type: 'video/mp4'
          }
        ],
        poster: poster || undefined
      };
      
      // Auto-play the new stream
      player.play().catch(() => {});
    }
  }, [defaultVideoUrl, title, poster]);

  return (
    <div id="plyr-player-container-wrapper" className="w-full h-full relative bg-black rounded-[2.5rem] overflow-hidden">
      {/* Absolute Overrides of Plyr classes to match bespoke cinema aesthetics */}
      <style>{`
        .plyr {
          width: 100% !important;
          height: 100% !important;
          border-radius: 2.5rem !important;
        }
        .plyr--video {
          background: #000 !important;
        }
        :root {
          --plyr-color-main: #0070e3 !important;
          --plyr-control-radius: 12px;
          --plyr-font-family: inherit;
        }
        .plyr__controls {
          background: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.88)) !important;
          padding: 20px 24px !important;
        }
        .plyr__control--overlaid {
          background: rgba(0, 112, 227, 0.95) !important;
          box-shadow: 0 10px 35px rgba(0, 112, 227, 0.5) !important;
          width: 72px;
          height: 72px;
        }
        .plyr__control--overlaid svg {
          width: 30px;
          height: 30px;
          fill: white !important;
        }
        .plyr__control:hover {
          background: rgba(255, 255, 255, 0.15) !important;
        }
        .plyr__control.plyr__tab-focus {
          box-shadow: 0 0 0 5px rgba(0, 112, 227, 0.35) !important;
        }
        .plyr__menu__container [role="menu"] {
          background: rgba(13, 18, 37, 0.96) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: white;
        }
      `}</style>

      {/* Floating high-definition HUD Title Info Header */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={cn(
              "absolute top-5 left-6 right-6 z-20 pointer-events-none flex flex-col md:flex-row md:items-center justify-between gap-1.5",
              isRTL && "md:flex-row-reverse text-right"
            )}
          >
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0070e3]/20 border border-[#0070e3]/30 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-wider mb-1.5 backdrop-blur-md">
                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                <span>{isAr ? 'مشغّل PLYR الذكي' : 'PLYR SMART PLAYER'}</span>
              </span>
              <h2 className="text-sm md:text-base font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-none italic uppercase tracking-wide">
                {title}
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real Single Plain HTML5 Video Element wrapper strictly untouched by React updates after mount */}
      <video
        ref={videoRef}
        src={defaultVideoUrl}
        playsInline
        autoPlay
        controls
        className="w-full h-full object-contain bg-black"
        poster={poster}
      />
    </div>
  );
}
