import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <img 
          src="/src/assets/images/splash_screen_cinematic_1778310046038.png" 
          alt="Splash Screen" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <span className="text-white/60 text-xs md:text-sm font-black uppercase tracking-[0.4em] mb-4 italic">
              Welcome
            </span>
            <img 
              src="/src/assets/images/cinestream_logo_1779918074152.png" 
              alt="FalakPlay Logo" 
              className="w-80 md:w-[480px] h-auto object-contain select-none mix-blend-screen filter drop-shadow-[0_15px_40px_rgba(239,68,68,0.2)]"
              referrerPolicy="no-referrer"
            />
            <div className="mt-8 flex items-center gap-4">
              <div className="h-[1px] w-12 bg-white/20" />
              <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                Premium Cinema Experience
              </div>
              <div className="h-[1px] w-12 bg-white/20" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
