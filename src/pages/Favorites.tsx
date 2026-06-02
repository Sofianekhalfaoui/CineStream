import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import MovieCard from '../components/MovieCard';
import { Heart } from 'lucide-react';

export default function Favorites() {
  const { favorites } = useFavorites();

  return (
    <div className="pt-32 px-4 md:px-12 min-h-screen">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-1.5 h-10 bg-primary rounded-full" />
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary fill-current" />
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic uppercase">
            Favorites <span className="text-gray-600">List</span>
          </h2>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-20 h-20 text-white/10 mb-6" />
          <p className="text-gray-500 text-xl font-medium max-w-sm">
            Your favorites list is empty. Start adding some movies and TV shows!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
          {favorites.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
