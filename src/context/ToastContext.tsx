import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from './LanguageContext';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { isRTL } = useLanguage();

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={cn(
        "fixed bottom-24 z-[200] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none",
        isRTL ? "left-0" : "right-0"
      )}>
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: isRTL ? -50 : 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-2xl shadow-2xl overflow-hidden relative",
                toast.type === 'success' && "bg-green-500/10 border-green-500/20 text-green-500",
                toast.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-500",
                toast.type === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-500"
              )}
            >
              {/* Progress Bar Decoration */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className={cn(
                  "absolute bottom-0 left-0 h-0.5 bg-current opacity-30",
                  isRTL && "right-0 left-auto"
                )}
              />

              <div className="shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {toast.type === 'info' && <Info className="w-5 h-5" />}
              </div>
              
              <div className={cn("flex-1 text-xs font-black uppercase italic tracking-wider", isRTL && "text-right")}>
                {toast.message}
              </div>

              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
