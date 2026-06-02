import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  Upload, 
  Link2,
  Settings, 
  Tv, 
  Maximize2,
  Volume1,
  FileVideo,
  Sparkles,
  Info,
  Clock,
  PlayCircle,
  FolderOpen,
  Languages,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

interface CustomVideoPlayerProps {
  title?: string;
  poster?: string;
  onEnded?: () => void;
  onLoaded?: () => void;
  defaultVideoUrl?: string;
}

interface SubtitleTrack {
  name: string;
  url: string;
}

const SAMPLE_VIDEOS = [
  {
    name: 'Big Buck Bunny (Sintel/Cinematic)',
    nameAr: 'العرض السينمائي (سفاري وطبيعة)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    name: 'Tears of Steel (Sci-Fi CGI)',
    nameAr: 'عرض دموع من فولاذ (خيال علمي)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    name: 'Sintel (Fantasy CGI)',
    nameAr: 'العرض الخيالي - سينتيل',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  }
];

// Client-side SRT to WebVTT parsed file converter
function srtToVtt(srtText: string): string {
  if (srtText.trim().startsWith('WEBVTT')) {
    return srtText;
  }
  
  let vtt = 'WEBVTT\n\n';
  // Normalize windows newlines
  const blocks = srtText.replace(/\r\n/g, '\n').split('\n\n');
  
  for (let block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      let startIndex = 0;
      // Skip numeric cue identifier if present
      if (!isNaN(parseInt(lines[0], 10))) {
        startIndex = 1;
      }
      
      const timeLine = lines[startIndex];
      if (timeLine && timeLine.includes('-->')) {
        // WebVTT requires '.' instead of ',' for millisecond divider
        const vttTimeLine = timeLine.replace(/,/g, '.');
        const subtitleText = lines.slice(startIndex + 1).join('\n');
        
        vtt += `${vttTimeLine}\n${subtitleText}\n\n`;
      }
    }
  }
  return vtt;
}

export default function CustomVideoPlayer({ title, poster, onEnded, onLoaded, defaultVideoUrl }: CustomVideoPlayerProps) {
  const { isRTL, language } = useLanguage();
  const { showToast } = useToast();
  const isAr = language === 'ar';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [videoUrl, setVideoUrl] = useState<string>(defaultVideoUrl || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isHoveringControls, setIsHoveringControls] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<number>(-1);
  const [showSubtitleSelector, setShowSubtitleSelector] = useState(false);

  // Sync state when playing/pausing
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Autoplay/play failed:", err);
          showToast(isAr ? 'عذراً، فشل تشغيل الفيديو' : 'Error starting playback', 'error');
        });
    }
    triggerControlsVisibility();
  };

  // Programmatically handle text track showing/disabled values
  useEffect(() => {
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        if (i === activeSubtitle) {
          tracks[i].mode = 'showing';
        } else {
          tracks[i].mode = 'disabled';
        }
      }
    }
  }, [activeSubtitle, subtitles, videoUrl]);

  // Handle subtitle upload (with automatic client-side SRT to VTT parser conversion)
  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const vttText = srtToVtt(text);
          const blob = new Blob([vttText], { type: 'text/vtt' });
          const url = URL.createObjectURL(blob);
          const newTrack = {
            name: file.name.substring(0, 20) + (file.name.length > 20 ? '...' : ''),
            url: url
          };
          setSubtitles(prev => [...prev, newTrack]);
          setActiveSubtitle(subtitles.length); // auto-enable
          showToast(isAr ? `تفعيل الترجمة المضافة: ${file.name}` : `Activated loaded subtitle: ${file.name}`, 'success');
        } catch (error) {
          console.error(error);
          showToast(isAr ? 'عذراً، فشل تحميل ملف الترجمة' : 'Failed to compile subtitle track', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  // Skip forward/backward
  const skipTime = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + amount));
    setCurrentTime(videoRef.current.currentTime);
    triggerControlsVisibility();
  };

  // Format time (seconds to MM:SS or HH:MM:SS)
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    
    const formattedM = m < 10 ? `0${m}` : m;
    const formattedS = s < 10 ? `0${s}` : s;

    if (h > 0) {
      return `${h}:${formattedM}:${formattedS}`;
    }
    return `${formattedM}:${formattedS}`;
  };

  // Keyboard controls helper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcut if typing in URL input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          skipTime(-10);
          showToast(isAr ? 'تأخير 10 ثوانٍ' : 'Backward 10s', 'info');
          break;
        case 'arrowright':
          e.preventDefault();
          skipTime(10);
          showToast(isAr ? 'تقديم 10 ثوانٍ' : 'Forward 10s', 'info');
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, videoUrl]);

  // Sync mute with video ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Time progress update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
    if (onLoaded) onLoaded();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
  };

  // Custom Seek Slider change Handler
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Fullscreen Management
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => {
          showToast(isAr ? 'عذراً لا يمكن الدخول لوضع ملء الشاشة' : 'Could not enter fullscreen', 'error');
        });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Monitor screen layout changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls overlay auto-hide logic
  const triggerControlsVisibility = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    if (isPlaying && !isHoveringControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  };

  useEffect(() => {
    triggerControlsVisibility();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isHoveringControls]);

  // Handle choosing local files
  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setVideoUrl(localUrl);
      setIsPlaying(false);
      showToast(isAr ? `تم تحميل الملف: ${file.name}` : `Loaded file: ${file.name}`, 'success');
    }
  };

  // Drag and Drop local files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const localUrl = URL.createObjectURL(file);
      setVideoUrl(localUrl);
      setIsPlaying(false);
      showToast(isAr ? `تم سحب وتحميل: ${file.name}` : `Dropped & loaded: ${file.name}`, 'success');
    } else {
      showToast(isAr ? 'الرجاء سحب ملف فيديو صالح فقط' : 'Please drop a valid movie/video file only', 'error');
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setVideoUrl(inputUrl.trim());
      setIsPlaying(false);
      setShowUrlInput(false);
      showToast(isAr ? 'تم تحميل رابط البث المباشر' : 'Live stream link loaded successfully', 'success');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) {
      setVolume(0.5);
    }
  };

  return (
    <div 
      id="custom-player-wrapper"
      ref={containerRef}
      onMouseMove={triggerControlsVisibility}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative w-full aspect-video bg-black select-none overflow-hidden group transition-all duration-500 rounded-[2rem]",
        isFullscreen ? "rounded-none h-screen border-0" : "border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.9)]"
      )}
    >
      {/* 1. Unselected Empty state media loader */}
      {!videoUrl ? (
        <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1)_0%,transparent_75%)] opacity-80 pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-lg relative z-10"
          >
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-3xl border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse">
              <Tv className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white italic uppercase tracking-wider">
                {isAr ? 'مشغّل السينما المتقدّم' : 'Bespoke Media Engine'}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                {isAr 
                  ? 'مشغل مدمج فائق السرعة وخالٍ من الإعلانات! يمكنك تشغيل المقاطع التجريبية أو سحب ملف فيديو من جهازك أو لصق رابط مباشر للفيلم.'
                  : 'Bespoke, ad-free cinema stream player. Load high-quality open-source samples, drop a local MP4/MKV movie, or paste a direct stream URL.'}
              </p>
            </div>

            {/* Quick action grid buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-white hover:bg-primary text-slate-950 hover:text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest transition-all duration-300 transform hover:scale-[1.03] cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                {isAr ? 'تحميل ملف محلي' : 'Local File Upload'}
              </button>

              <button 
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-[1.25rem] border border-white/10 font-black text-xs uppercase tracking-widest transition-all duration-300 transform hover:scale-[1.03] cursor-pointer"
              >
                <Link2 className="w-4 h-4 text-primary" />
                {isAr ? 'لصق رابط مباشر' : 'Paste Direct URL'}
              </button>
            </div>

            {/* Form to submit direct URL */}
            <AnimatePresence>
              {showUrlInput && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleUrlSubmit}
                  className="pt-2 flex gap-2 w-full"
                >
                  <input
                    type="url"
                    placeholder={isAr ? 'أدخل رابط الفيديو (MP4, MKV)...' : 'Paste direct MP4/MKV stream link...'}
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder-white/30 tracking-wide focus:outline-none focus:border-primary/50 text-left"
                    required
                  />
                  <button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/95 text-white px-5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    {isAr ? 'بدء' : 'Play'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Selection divider */}
            <div className="flex items-center justify-center gap-4 opacity-15">
              <div className="w-16 h-px bg-white" />
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <div className="w-16 h-px bg-white" />
            </div>

            {/* Built-in Samples carousel */}
            <div className="space-y-2">
              <span className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                {isAr ? 'عروض سنمائية تجريبية سريعة' : 'Or Experience Instant Cinematic Demos'}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {SAMPLE_VIDEOS.map((vid, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setVideoUrl(vid.url);
                      setIsPlaying(true);
                      showToast(isAr ? `جاري تشغيل: ${vid.nameAr}` : `Playing demo: ${vid.name}`, 'info');
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-primary hover:text-white border border-white/10 rounded-xl text-[10px] font-bold text-white/80 transition-all hover:-translate-y-0.5"
                  >
                    {isAr ? vid.nameAr : vid.name}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLocalFileChange} 
            accept="video/*" 
            className="hidden" 
          />
        </div>
      ) : null}

      {/* Hidden file selector for switching when video is loaded */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLocalFileChange} 
        accept="video/*" 
        className="hidden" 
      />

      <input 
        type="file" 
        ref={subtitleInputRef} 
        onChange={handleSubtitleUpload} 
        accept=".srt,.vtt" 
        className="hidden" 
      />

      {/* Inject custom high contrast responsive subtitle CSS styles */}
      <style>{`
        #custom-video-ref::cue {
          background-color: rgba(0, 0, 0, 0.75) !important;
          color: #ffffff !important;
          font-family: inherit !important;
          font-size: 1.15rem !important;
          font-weight: 700 !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.9) !important;
        }
      `}</style>

      {/* 2. REAL HTML5 VIDEO COMPONENT */}
      {videoUrl && (
        <video
          id="custom-video-ref"
          ref={videoRef}
          src={videoUrl}
          poster={poster}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          playsInline
          autoPlay
          className="w-full h-full object-contain bg-black cursor-pointer"
        >
          {subtitles.map((sub, idx) => (
            <track
              key={idx}
              label={sub.name}
              src={sub.url}
              kind="subtitles"
              srcLang="ar"
              default={activeSubtitle === idx}
            />
          ))}
        </video>
      )}

      {/* 3. PREMIUM HUD INTERACTIVE CONTROLS */}
      {videoUrl && (
        <AnimatePresence>
          {controlsVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/60 z-10 flex flex-col justify-between p-4 md:p-6 transition-all"
            >
              
              {/* TOP STRIP - TITLE & DISMISS/UPLOADER */}
              <div className="flex items-center justify-between w-full" onMouseEnter={() => setIsHoveringControls(true)} onMouseLeave={() => setIsHoveringControls(false)}>
                <div className={cn("space-y-1 text-left", isRTL && "text-right")}>
                  {title && (
                    <h3 className="text-sm md:text-base font-black text-white uppercase tracking-widest leading-none drop-shadow-md">
                      {title}
                    </h3>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-mono font-black text-white/50 uppercase tracking-widest truncate max-w-xs">
                      {videoUrl.startsWith('blob:') ? (isAr ? 'مشغل مدمج آمن' : 'Secured Local Cinema Active') : (isAr ? 'رابط بث مباشر مدرج' : 'Live Stream Feed Connected')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* CAST / PROJECTION EMBED (matches the cast icon top-right in photo) */}
                  <button
                    onClick={() => showToast(isAr ? 'ميزة البث اللاسلكي قيد التهيئة...' : 'Wireless projection starting...', 'info')}
                    title={isAr ? 'بث الشاشة اللاسلكي' : 'Cast / Airplay'}
                    className="p-2.5 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full text-white/70 hover:text-blue-500 transition-all active:scale-95"
                  >
                    <Tv className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title={isAr ? 'تبديل ملف الفيديو' : 'Swap Media File'}
                    className="p-2.5 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full text-white/70 hover:text-blue-500 transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.pause();
                      setIsPlaying(false);
                      setVideoUrl('');
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(220,38,38,0.3)] active:scale-95"
                  >
                    {isAr ? 'إغلاق المشغل' : 'Close Player'}
                  </button>
                </div>
              </div>

              {/* CENTER SCREEN SPARK: Large Solid Blue play button surrounded by rewind & forward buttons matching the screenshot! */}
              <div className="flex items-center justify-center gap-6 md:gap-10 flex-grow pointer-events-none">
                {/* Rewind 10s */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    skipTime(-10);
                    showToast(isAr ? 'تراجع ١٠ ثوانٍ' : 'Rewound 10s', 'info');
                  }}
                  className="w-12 h-12 md:w-14 md:h-14 bg-black/50 hover:bg-black/70 border border-white/10 rounded-full flex items-center justify-center text-white cursor-pointer pointer-events-auto transition-all"
                  title={isAr ? 'إرجاع 10 ثوانٍ' : 'Rewind 10s'}
                >
                  <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>

                {/* Play / Pause (The Blue button) */}
                <motion.button 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="w-20 h-20 md:w-24 md:h-24 bg-[#0070e3] hover:bg-[#007bfa] text-white rounded-full flex items-center justify-center cursor-pointer pointer-events-auto shadow-[0_15px_45px_rgba(0,112,227,0.55)] transition-all border-none"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 md:w-10 md:h-10 fill-white stroke-none text-white" />
                  ) : (
                    <Play className="w-8 h-8 md:w-10 md:h-10 fill-white stroke-none text-white ml-1" />
                  )}
                </motion.button>

                {/* Forward 10s */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    skipTime(10);
                    showToast(isAr ? 'تقديم ١٠ ثوانٍ' : 'Skipped 10s', 'info');
                  }}
                  className="w-12 h-12 md:w-14 md:h-14 bg-black/50 hover:bg-black/70 border border-white/10 rounded-full flex items-center justify-center text-white cursor-pointer pointer-events-auto transition-all"
                  title={isAr ? 'تقديم 10 ثوانٍ' : 'Skip 10s'}
                >
                  <RotateCw className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>
              </div>

              {/* BOTTOM CONTROL STRIP: Rebuilt layout to match the provided layout structure perfectly! */}
              <div 
                className="space-y-3 w-full"
                onMouseEnter={() => setIsHoveringControls(true)}
                onMouseLeave={() => setIsHoveringControls(false)}
              >
                
                {/* 1. Main Info and Controls Row (Placed above seek/timeline) */}
                <div className="flex items-center justify-between w-full px-1">
                  
                  {/* Left Group: Elapsed / Total duration (strictly matching 0:00 / 48:03 in screenshot) */}
                  <div className="text-sm md:text-base font-medium font-sans text-white/95 tracking-wide flex items-center gap-1.5">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-white/40">/</span>
                    <span className="text-white/70">{formatTime(duration)}</span>
                  </div>

                  {/* Right Group: Action Buttons (Volume, Glow Subtitles, Speed Settings, Fullscreen) */}
                  <div className="flex items-center gap-3.5 relative">
                    
                    {/* Volume Speaker with hover slider */}
                    <div className="flex items-center gap-2 group/volume">
                      <button onClick={toggleMute} className="text-white/80 hover:text-white transition-all">
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4.5 h-4.5 text-red-500" />
                        ) : volume < 0.5 ? (
                          <Volume1 className="w-4.5 h-4.5" />
                        ) : (
                          <Volume2 className="w-4.5 h-4.5" />
                        )}
                      </button>
                      
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          setVolume(parseFloat(e.target.value));
                          setIsMuted(false);
                        }}
                        className="w-0 group-hover/volume:w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white transition-all overflow-hidden"
                      />
                    </div>

                    {/* Subtitle / Closed Caption switcher (represented in photo as a dedicated circular button) */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSubtitleSelector(!showSubtitleSelector)}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                          activeSubtitle >= 0 
                            ? "bg-[#0d2244] text-[#3b82f6] border border-[#2563eb]/50 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                            : "bg-white/5 hover:bg-white/10 text-white/70"
                        )}
                        title={isAr ? 'الترجمة واللغات' : 'Subtitles / Languages'}
                      >
                        <Languages className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {showSubtitleSelector && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowSubtitleSelector(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-full mb-2 right-0 bg-[#0d1225]/95 border border-white/10 p-2 rounded-xl flex flex-col gap-1.5 min-w-[180px] z-50 text-left"
                            >
                              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1 pb-1 border-b border-white/5">
                                {isAr ? 'خيارات الترجمة' : 'Subtitle Tracks'}
                              </div>

                              {/* Toggle option 'None/Off' */}
                              <button
                                onClick={() => {
                                  setActiveSubtitle(-1);
                                  setShowSubtitleSelector(false);
                                  showToast(isAr ? 'تم إيقاف الترجمة' : 'Subtitles deactivated', 'info');
                                }}
                                className={cn(
                                  "w-full px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-center transition-all",
                                  activeSubtitle === -1 
                                    ? "bg-white/10 text-white" 
                                    : "text-white/60 hover:bg-white/10 hover:text-white"
                                )}
                              >
                                {isAr ? 'إيقاف الترجمة ✕' : 'Disable Subtitles ✕'}
                              </button>

                              {/* Upload custom subtitle file button */}
                              <button
                                onClick={() => {
                                  subtitleInputRef.current?.click();
                                  setShowSubtitleSelector(false);
                                }}
                                className="w-full px-2.5 py-1.5 bg-primary/20 hover:bg-primary/35 border border-primary/30 rounded-lg text-[10px] text-white font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                              >
                                <Upload className="w-3 h-3 text-primary animate-pulse" />
                                <span>{isAr ? 'تحميل ملف (SRT/VTT)' : 'Upload SRT / VTT'}</span>
                              </button>

                              {/* Track Listing */}
                              {subtitles.length > 0 && (
                                <div className="space-y-1 pt-1 border-t border-white/5 max-h-[120px] overflow-y-auto">
                                  {subtitles.map((track, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setActiveSubtitle(idx);
                                        setShowSubtitleSelector(false);
                                        showToast(isAr ? `تفعيل: ${track.name}` : `Enabled: ${track.name}`, 'success');
                                      }}
                                      className={cn(
                                        "w-full px-2 py-1.5 rounded-md text-[10px] font-semibold text-left truncate flex items-center gap-1.5",
                                        activeSubtitle === idx 
                                          ? "bg-primary text-white font-bold" 
                                          : "text-white/60 hover:bg-white/5 hover:text-white"
                                      )}
                                    >
                                      <FileText className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{track.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Settings Cog representation for Playback Speed */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSpeedSelector(!showSpeedSelector)}
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
                        title={isAr ? 'سرعة التشغيل' : 'Playback Speed'}
                      >
                        <Settings className="w-4.5 h-4.5" />
                      </button>

                      <AnimatePresence>
                        {showSpeedSelector && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowSpeedSelector(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-full mb-2 right-0 bg-[#0d1225]/95 border border-white/10 p-1.5 rounded-xl flex flex-col gap-1 min-w-[75px] z-50 text-left"
                            >
                              {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => {
                                    setPlaybackRate(rate);
                                    setShowSpeedSelector(false);
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all text-center",
                                    playbackRate === rate 
                                      ? "bg-primary text-white" 
                                      : "text-white/60 hover:bg-white/10 hover:text-white"
                                  )}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Toggle fullscreen (re-added correctly matching screenshot style) */}
                    <button 
                      onClick={toggleFullscreen}
                      className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all active:scale-95"
                      title={isAr ? 'ملء الشاشة' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
                    </button>

                  </div> {/* end of right group */}

                </div> {/* end of Controls Row */}

                {/* 2. Progress bar seek slider: thin edge-to-edge sleek line (styled like Netflix/Youtube bottom-level bar) */}
                <div className="relative w-full flex items-center group/seekbar mt-2.5">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeekChange}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#0070e3] focus:outline-none transition-all group-hover/seekbar:h-1.5"
                    style={{
                      background: `linear-gradient(to right, #0070e3 0%, #0070e3 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>

              </div> {/* end of BOTTOM CONTROL STRIP */}

            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  );
}
