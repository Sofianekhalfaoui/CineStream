import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie } from '../types';
import { db, DownloadItem } from '../lib/db';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';

interface DownloadsContextType {
  downloadedMovies: DownloadItem[];
  startDownload: (movie: any, quality: string, size: string, episodeInfo?: { season: number, episode: number, name: string }) => Promise<void>;
  removeDownload: (id: string | number) => Promise<void>;
  isDownloaded: (id: string | number) => boolean;
  getDownloadStatus: (id: string | number) => DownloadItem | undefined;
}

const DownloadsContext = createContext<DownloadsContextType | undefined>(undefined);

export const DownloadsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [downloadedMovies, setDownloadedMovies] = useState<DownloadItem[]>([]);
  const { showToast } = useToast();
  const { isRTL } = useLanguage();

  // Load from DB on mount
  useEffect(() => {
    const loadDownloads = async () => {
      const items = await db.downloads.toArray();
      setDownloadedMovies(items);
    };
    loadDownloads();
  }, []);

  // Sync state with DB changes
  useEffect(() => {
    const interval = setInterval(async () => {
      const activeDownloads = downloadedMovies.filter(m => m.status === 'downloading');
      if (activeDownloads.length === 0) return;

      const updatedItems = await Promise.all(downloadedMovies.map(async m => {
        if (m.status === 'downloading' && m.progress < 100) {
          const nextProgress = Math.min(100, m.progress + Math.random() * 5);
          const updated = {
            ...m,
            progress: nextProgress,
            status: (nextProgress === 100 ? 'completed' : 'downloading') as 'pending' | 'downloading' | 'completed'
          };
          
          if (nextProgress === 100) {
             const title = m.episode_name 
               ? `${m.title || m.name} - S${m.season_number}E${m.episode_number}`
               : (m.title || m.name);
             showToast(
               isRTL ? `اكتمل تحميل: ${title}` : `Download Complete: ${title}`,
               'success'
             );
          }
          
          await db.downloads.put(updated as any);
          return updated as DownloadItem;
        }
        return m;
      }));

      setDownloadedMovies(updatedItems);
    }, 2000);

    return () => clearInterval(interval);
  }, [downloadedMovies, showToast, isRTL]);

  const startDownload = async (movie: any, quality: string, size: string, episodeInfo?: { season: number, episode: number, name: string }) => {
    const id = episodeInfo 
      ? `tv_${movie.id}_s${episodeInfo.season}_e${episodeInfo.episode}`
      : movie.id;

    if (!isDownloaded(id)) {
      const newItem: DownloadItem = { 
        ...movie,
        id,
        movieId: movie.id,
        season_number: episodeInfo?.season,
        episode_number: episodeInfo?.episode,
        episode_name: episodeInfo?.name,
        status: 'downloading',
        progress: 0,
        quality,
        size,
        downloadDate: new Date().toISOString() 
      };
      await db.downloads.add(newItem as any);
      setDownloadedMovies(prev => [...prev, newItem]);
      
      const title = episodeInfo 
        ? `${movie.title || movie.name} - S${episodeInfo.season}E${episodeInfo.episode}`
        : (movie.title || movie.name);

      showToast(
        isRTL ? `بدأ تحميل: ${title}` : `Download Started: ${title}`,
        'info'
      );
    }
  };

  const removeDownload = async (id: string | number) => {
    const movie = downloadedMovies.find(m => m.id === id);
    await db.downloads.delete(id as any);
    setDownloadedMovies(prev => prev.filter(m => m.id !== id));
    if (movie) {
      const title = movie.episode_number 
        ? `${movie.title || movie.name} - S${movie.season_number}E${movie.episode_number}`
        : (movie.title || movie.name);
      showToast(
        isRTL ? `تم حذف: ${title}` : `Removed: ${title}`,
        'info'
      );
    }
  };

  const isDownloaded = (id: string | number) => {
    return downloadedMovies.some(m => m.id === id);
  };

  const getDownloadStatus = (id: string | number) => {
    return downloadedMovies.find(m => m.id === id);
  };

  return (
    <DownloadsContext.Provider value={{ downloadedMovies, startDownload, removeDownload, isDownloaded, getDownloadStatus }}>
      {children}
    </DownloadsContext.Provider>
  );
};

export const useDownloads = () => {
  const context = useContext(DownloadsContext);
  if (context === undefined) {
    throw new Error('useDownloads must be used within a DownloadsProvider');
  }
  return context;
};
