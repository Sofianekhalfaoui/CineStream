import React from 'react';
import HeroSection from '../components/HeroSection';
import MovieRow from '../components/MovieRow';
import { getRequests, getTmdbLanguage } from '../services/tmdb';
import { useLanguage } from '../context/LanguageContext';
import { useWatchHistory } from '../context/WatchHistoryContext';
import MovieCard from '../components/MovieCard';

import { useSettings } from '../context/SettingsContext';

import ContinueWatchingRow from '../components/ContinueWatchingRow';
import ReleaseCalendar from '../components/ReleaseCalendar';

export default function Home() {
  const { t, isRTL, language } = useLanguage();
  const { settings } = useSettings();
  const { history } = useWatchHistory();
  
  const tmdbLang = getTmdbLanguage(language);
  const requests = getRequests(tmdbLang, settings.contentFilter);

  return (
    <>
      <HeroSection fetchUrl={requests.fetchTrending} />
      <div className="-mt-16 md:-mt-32 relative z-10 space-y-12">
        <ContinueWatchingRow history={history} />

        <MovieRow 
          title={t('trending')} 
          fetchUrl={requests.fetchTrending} 
          isLargeRow 
          isTop10 
        />

        <ReleaseCalendar fetchUrl={requests.fetchUpcoming} />

        <MovieRow 
          title={t('popular')} 
          fetchUrl={requests.fetchPopular} 
        />

        <MovieRow 
          title={t('topRated')} 
          fetchUrl={requests.fetchTopRated} 
        />

        <MovieRow 
          title={t('anime')} 
          fetchUrl={requests.fetchAnime} 
        />

        <MovieRow 
          title={t('tvShows')} 
          fetchUrl={requests.fetchNetflixOriginals} 
        />

        <MovieRow 
          title={t('actionMovies')} 
          fetchUrl={requests.fetchActionMovies} 
        />

        <MovieRow 
          title={t('crimeMystery')} 
          fetchUrl={requests.fetchCrimeMystery} 
        />

        <MovieRow 
          title={t('sciFiFantasy')} 
          fetchUrl={requests.fetchSciFiFantasy} 
        />

        <MovieRow 
          title={t('horrorThriller')} 
          fetchUrl={requests.fetchHorrorThriller} 
        />
      </div>
    </>
  );
}
