import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Trash2, CheckCircle2, Clock, Info, Shield, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { cn } from '../lib/utils';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'info' | 'success' | 'security' | 'reminder';
}

export default function NotificationCenter() {
  const { isRTL, t } = useLanguage();
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifications = () => {
      const saved = localStorage.getItem('app_notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        // Initial welcome notifications
        const initial = [
          {
            id: 1,
            title: isRTL ? 'مرحباً بك في بريميوم!' : 'Welcome to Premium!',
            message: isRTL ? 'استمتع بمشاهدة أحدث الأفلام والمسلسلات بجودة عالية.' : 'Enjoy watching the latest movies and series in high quality.',
            time: new Date().toISOString(),
            unread: true,
            type: 'info'
          },
          {
            id: 2,
            title: isRTL ? 'تم تفعيل تصفية المحتوى' : 'Content Filtering Active',
            message: isRTL ? 'تم تفعيل وضع حماية العائلة تلقائياً.' : 'Family protection mode has been automatically activated.',
            time: new Date().toISOString(),
            unread: false,
            type: 'security'
          }
        ];
        setNotifications(initial);
        localStorage.setItem('app_notifications', JSON.stringify(initial));
      }
    };

    loadNotifications();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app_notifications') {
        setNotifications(JSON.parse(e.newValue || '[]'));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Interval to check for new notifications if updated within the same window
    const interval = setInterval(loadNotifications, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isRTL]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem('app_notifications', JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem('app_notifications', JSON.stringify([]));
  };

  const deleteOne = (id: number) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('app_notifications', JSON.stringify(updated));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  if (!settings.notifications) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 md:p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all active:scale-90 relative"
      >
        <Bell className="w-5 h-5 text-gray-900 dark:text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a0a0a]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn(
              "absolute top-14 w-80 md:w-96 bg-white dark:bg-black/80 backdrop-blur-3xl border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100]",
              "right-0 origin-top-right"
            )}
          >
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{isRTL ? 'الإشعارات' : 'Notifications'}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={markAllRead}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {isRTL ? 'قراءة الكل' : 'Read All'}
                </button>
                <button 
                  onClick={clearAll}
                  className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                  <Bell className="w-10 h-10 mb-4 text-gray-300" />
                  <p className="text-sm font-bold">{isRTL ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {notifications.map((n, index) => (
                    <div 
                      key={`${n.id}-${index}`}
                      className={cn(
                        "p-4 flex gap-3 group transition-colors relative",
                        n.unread ? "bg-primary/5" : "hover:bg-gray-50 dark:hover:bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center",
                        n.type === 'info' ? "bg-blue-500/10 text-blue-500" :
                        n.type === 'success' ? "bg-green-500/10 text-green-500" :
                        n.type === 'security' ? "bg-red-500/10 text-red-500" :
                        "bg-yellow-500/10 text-yellow-500"
                      )}>
                        {n.type === 'info' && <Info className="w-5 h-5" />}
                        {n.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {n.type === 'security' && <Shield className="w-5 h-5" />}
                        {n.type === 'reminder' && <Clock className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "text-xs font-black uppercase tracking-tight truncate flex-1",
                            n.unread ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                          )}>
                            {n.title}
                          </h4>
                          <span className="text-[8px] font-bold text-gray-400 shrink-0 mt-1">
                            {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                      <button 
                        onClick={() => deleteOne(n.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
