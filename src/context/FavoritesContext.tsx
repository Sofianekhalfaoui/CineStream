import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface FavoritesContextType {
  favorites: Movie[];
  toggleFavorite: (movie: Movie) => void;
  isFavorite: (movieId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isRTL } = useLanguage();
  const [favorites, setFavorites] = useState<Movie[]>([]);

  // Load from local storage or Firestore
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
        setFavorites([]);
      }
      return;
    }

    // Load from Firestore if user is authenticated
    const favsRef = collection(db, 'users', user.uid, 'favorites');
    const q = query(favsRef, orderBy('addedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteFavs = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as Movie[];
      setFavorites(remoteFavs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/favorites`);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync to local storage for guests
  useEffect(() => {
    if (!user) {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites, user]);

  const toggleFavorite = async (movie: Movie) => {
    if (!user) {
      const exists = favorites.find(m => m.id === movie.id);
      if (exists) {
        setFavorites(prev => prev.filter(m => m.id !== movie.id));
        showToast(
          isRTL ? `تمت الإزالة من المفضلة: ${movie.title || movie.name}` : `Removed from My List: ${movie.title || movie.name}`,
          'info'
        );
      } else {
        setFavorites(prev => [movie, ...prev]);
        showToast(
          isRTL ? `تمت الإضافة إلى المفضلة: ${movie.title || movie.name}` : `Added to My List: ${movie.title || movie.name}`,
          'success'
        );
      }
      return;
    }

    // Firestore sync
    const favRef = doc(db, 'users', user.uid, 'favorites', movie.id.toString());
    const exists = favorites.find(m => m.id === movie.id);

    try {
      if (exists) {
        await deleteDoc(favRef);
        showToast(
          isRTL ? `تمت الإزالة من المفضلة: ${movie.title || movie.name}` : `Removed from My List: ${movie.title || movie.name}`,
          'info'
        );
      } else {
        await setDoc(favRef, {
          ...movie,
          addedAt: new Date().toISOString()
        });
        showToast(
          isRTL ? `تمت الإضافة إلى المفضلة: ${movie.title || movie.name}` : `Added to My List: ${movie.title || movie.name}`,
          'success'
        );
      }
    } catch (error) {
      handleFirestoreError(error, exists ? OperationType.DELETE : OperationType.WRITE, `users/${user.uid}/favorites/${movie.id}`);
    }
  };

  const isFavorite = (movieId: number) => {
    return favorites.some(m => m.id === movieId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
