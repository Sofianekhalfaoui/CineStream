import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Bell, BellOff, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';
import { Movie } from '../types';

interface ReleaseCalendarProps {
  fetchUrl: string;
}

export default function ReleaseCalendar({ fetchUrl }: ReleaseCalendarProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<number[]>(() => {
    const saved = localStorage.getItem('movie_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(fetchUrl);
        const data = await response.json();
        // Only show future releases
        const today = new Date();
        const futureMovies = data.results
          .filter((m: Movie) => m.release_date && new Date(m.release_date) > today)
          .sort((a: Movie, b: Movie) => new Date(a.release_date!).getTime() - new Date(b.release_date!).getTime());
        setMovies(futureMovies);
      } catch (error) {
        console.error('Error fetching upcoming:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [fetchUrl]);

  const toggleReminder = (movieId: number, title: string) => {
    const isReminded = reminders.includes(movieId);
    let newReminders;

    if (isReminded) {
      newReminders = reminders.filter(id => id !== movieId);
      showToast(
        isRTL ? `تم إزالة التذكير لـ ${title}` : `Reminder removed for ${title}`,
        'info'
      );
    } else {
      newReminders = [...reminders, movieId];
      showToast(
        isRTL ? `سنقوم بتذكيرك عند صدور ${title}` : `We'll remind you when ${title} is released`,
        'success'
      );
      
      // Add to notifications
      const notifications = JSON.parse(localStorage.getItem('app_notifications') || '[]');
      notifications.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: isRTL ? 'تم ضبط التذكير' : 'Reminder Set',
        message: isRTL ? `تم ضبط تذكير لفيلم: ${title}` : `Reminder set for movie: ${title}`,
        time: new Date().toISOString(),
        unread: true,
        type: 'reminder'
      });
      localStorage.setItem('app_notifications', JSON.stringify(notifications.slice(0, 50)));
    }

    setReminders(newReminders);
    localStorage.setItem('movie_reminders', JSON.stringify(newReminders));
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    const releaseDate = new Date(dateStr);
    const diffTime = Math.abs(releaseDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) return null;
  if (movies.length === 0) return null;

  return (
    <div className="flex flex-col space-y-6 px-4 md:px-12 my-12 relative group/calendar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
              {isRTL ? 'تقويم الإصدارات' : 'Release'} <span className="text-primary">{isRTL ? 'القادمة' : 'Calendar'}</span>
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              {isRTL ? 'كن أول من يشاهد الحصريات' : 'Be the first to watch new releases'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {movies.slice(0, 6).map((movie, index) => {
          const daysLeft = getDaysUntil(movie.release_date!);
          const hasReminder = reminders.includes(movie.id);

          return (
            <motion.div
              key={`${movie.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 group hover:border-primary/50 transition-all hover:shadow-xl dark:hover:shadow-none"
            >
              <div className="w-24 h-36 rounded-xl overflow-hidden shrink-0 shadow-lg">
                <img
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-md">
                      {daysLeft} {isRTL ? 'يوم متبقي' : 'Days to go'}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1 uppercase tracking-tight italic">
                    {movie.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">
                    {new Date(movie.release_date!).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{isRTL ? 'إثارة' : 'Coming Soon'}</span>
                    <span className="text-sm font-black text-primary italic lowercase tracking-tighter">exclusive</span>
                  </div>
                  <button
                    onClick={() => toggleReminder(movie.id, movie.title!)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all active:scale-90 border",
                      hasReminder
                        ? "bg-primary border-primary text-white"
                        : "bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-400 dark:text-white hover:text-primary"
                    )}
                  >
                    {hasReminder ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
