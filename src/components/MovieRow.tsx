import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types';
import MovieCard from './MovieCard';

interface ExtendedMovieRowProps {
  title: string;
  fetchUrl: string;
  isLargeRow?: boolean;
  isTop10?: boolean;
  headerRight?: React.ReactNode;
}

export default function MovieRow({ title, fetchUrl, isLargeRow, isTop10, headerRight }: ExtendedMovieRowProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const request = await axios.get(fetchUrl);
        setMovies(request.data.results);
      } catch (err) {
        console.error('Failed to fetch movies for row', title, err);
      }
    }
    fetchData();
  }, [fetchUrl, title]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col space-y-4 px-4 md:px-12 my-12 relative group/row">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-primary rounded-full" />
          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
            {title}
          </h2>
        </div>
        {headerRight && (
          <div className="flex items-center gap-2 relative z-30">
            {headerRight}
          </div>
        )}
      </div>
      
      <div className="relative flex items-center">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 z-30 h-[70%] p-2 bg-white/60 dark:bg-black/60 text-gray-900 dark:text-white rounded-r-lg opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex items-center backdrop-blur-sm border-y border-r border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div 
          ref={rowRef}
          className="flex items-center gap-2 md:gap-4 overflow-x-scroll no-scrollbar py-4"
        >
          {movies.slice(0, isTop10 ? 10 : 20).map((movie, index) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              isLarge={!!isLargeRow} 
              rank={isTop10 ? index : undefined}
            />
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 z-30 h-[70%] p-2 bg-white/60 dark:bg-black/60 text-gray-900 dark:text-white rounded-l-lg opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex items-center backdrop-blur-sm border-y border-l border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
