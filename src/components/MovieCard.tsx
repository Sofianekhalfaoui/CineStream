import React from 'react';
import { motion } from 'motion/react';
import { getImageUrl } from '../services/tmdb';
import { Movie } from '../types';
import CircularRating from './CircularRating';
import { useMovie } from '../context/MovieContext';

interface MovieCardProps {
  movie: Movie;
  isLarge?: boolean;
  rank?: number;
  key?: React.Key;
}

export default function MovieCard({ movie, isLarge, rank }: MovieCardProps) {
  const { setSelectedMovie } = useMovie();

  return (
    <motion.div
      tabIndex={0}
      onClick={() => setSelectedMovie(movie)}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col gap-2 min-w-[140px] md:min-w-[190px] cursor-pointer group rounded-xl outline-none"
    >
      <div className="relative aspect-[2/3] w-full">
        {rank !== undefined && (
          <div className="absolute -left-6 bottom-0 z-0 select-none pointer-events-none">
            <span className="text-[160px] md:text-[220px] font-black leading-none text-black italic drop-shadow-[0_0_2px_rgba(255,255,255,0.4)] opacity-90" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.4)' }}>
              {rank + 1}
            </span>
          </div>
        )}
        
        <div className={`relative w-full h-full rounded-xl overflow-hidden shadow-2xl ${rank !== undefined ? 'ml-14 md:ml-20' : ''}`}>
          <img
            src={getImageUrl(movie.poster_path, 'w500')}
            alt={movie.title || movie.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute bottom-2 right-2 z-20">
            <CircularRating rating={movie.vote_average} />
          </div>
        </div>
      </div>

      <div className={`mt-1 flex flex-col items-center text-center ${rank !== undefined ? 'ml-14 md:ml-20' : ''}`}>
        <h4 className="text-gray-900 dark:text-white text-xs md:text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
          {movie.title || movie.name}
        </h4>
        <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-0.5">
          {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}
        </p>
      </div>
    </motion.div>
  );
}
