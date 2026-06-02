import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Movie } from '../types';

interface WatchProgress {
  movie: Movie;
  currentTime: number;
  duration: number;
  lastUpdated: number;
  season?: number;
  episode?: number;
}

interface WatchHistoryContextType {
  history: WatchProgress[];
  updateProgress: (movie: Movie, currentTime: number, duration: number, season?: number, episode?: number) => void;
  removeFromHistory: (movieId: number) => void;
  getProgress: (movieId: number, season?: number, episode?: number) => WatchProgress | undefined;
}

const WatchHistoryContext = createContext<WatchHistoryContextType | undefined>(undefined);

export function WatchHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<WatchProgress[]>(() => {
    const saved = localStorage.getItem('watch_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('watch_history', JSON.stringify(history));
  }, [history]);

  const updateProgress = React.useCallback((movie: Movie, currentTime: number, duration: number, season?: number, episode?: number) => {
    if (duration === 0) return;
    
    setHistory(prev => {
      const filtered = prev.filter(item => 
        item.movie.id !== movie.id || 
        (item.season !== season || item.episode !== episode)
      );
      
      const newEntry: WatchProgress = {
        movie,
        currentTime,
        duration,
        lastUpdated: Date.now(),
        season,
        episode
      };
      
      // Keep only most recent 20 items
      return [newEntry, ...filtered].slice(0, 20);
    });
  }, []);

  const removeFromHistory = React.useCallback((movieId: number) => {
    setHistory(prev => prev.filter(item => item.movie.id !== movieId));
  }, []);

  const getProgress = React.useCallback((movieId: number, season?: number, episode?: number) => {
    return history.find(item => 
      item.movie.id === movieId && 
      (!season || item.season === season) && 
      (!episode || item.episode === episode)
    );
  }, [history]);

  return (
    <WatchHistoryContext.Provider value={{ history, updateProgress, removeFromHistory, getProgress }}>
      {children}
    </WatchHistoryContext.Provider>
  );
}

export function useWatchHistory() {
  const context = useContext(WatchHistoryContext);
  if (context === undefined) {
    throw new Error('useWatchHistory must be used within a WatchHistoryProvider');
  }
  return context;
}
