/// <reference types="vite/client" />
import axios from 'axios';
import { Movie } from '../types';

const api_key = import.meta.env.VITE_TMDB_API_KEY;
const isV4Token = api_key && api_key.length > 50;

export const hasApiKey = !!api_key && api_key !== 'undefined' && api_key !== '';

const BASE_URL = '/api/tmdb';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    accept: 'application/json',
    ...(isV4Token ? { Authorization: `Bearer ${api_key}` } : {})
  }
});

const getAuthParam = () => (isV4Token ? '' : `api_key=${api_key}`);

export const getTmdbLanguage = (lang: string) => {
  switch (lang) {
    case 'ar': return 'ar-SA';
    case 'fr': return 'fr-FR';
    case 'es': return 'es-ES';
    case 'de': return 'de-DE';
    case 'tr': return 'tr-TR';
    case 'ru': return 'ru-RU';
    case 'it': return 'it-IT';
    case 'pt': return 'pt-PT';
    case 'zh': return 'zh-CN';
    case 'ja': return 'ja-JP';
    case 'ko': return 'ko-KR';
    default: return 'en-US';
  }
};

export const getRequests = (lang: string = 'ar-SA', contentFilter: boolean = true) => {
  const includeAdult = !contentFilter;
  const commonParams = `${getAuthParam()}&language=${lang}&include_adult=${includeAdult}`;
  
  return {
    fetchTrendingMoviesToday: `${BASE_URL}/trending/movie/day?${commonParams}`,
    fetchTrending: `${BASE_URL}/trending/all/week?${commonParams}`,
    fetchNetflixOriginals: `${BASE_URL}/discover/tv?${commonParams}&with_networks=213`,
    fetchTopRated: `${BASE_URL}/movie/top_rated?${commonParams}`,
    fetchPopular: `${BASE_URL}/movie/popular?${commonParams}`,
    fetchAnime: `${BASE_URL}/discover/tv?${commonParams}&with_genres=16&with_original_language=ja`,
    fetchActionMovies: `${BASE_URL}/discover/movie?${commonParams}&with_genres=28`,
    fetchComedyMovies: `${BASE_URL}/discover/movie?${commonParams}&with_genres=35&sort_by=primary_release_date.desc&primary_release_date.lte=${new Date().toISOString().split('T')[0]}`,
    fetchHorrorMovies: `${BASE_URL}/discover/movie?${commonParams}&with_genres=27`,
    fetchHorrorThriller: `${BASE_URL}/discover/movie?${commonParams}&with_genres=27%7C53`,
    fetchSciFiFantasy: `${BASE_URL}/discover/movie?${commonParams}&with_genres=878%7C14`,
    fetchCrimeMystery: `${BASE_URL}/discover/movie?${commonParams}&with_genres=80%7C9648`,
    fetchRomanceMovies: `${BASE_URL}/discover/movie?${commonParams}&with_genres=10749`,
    fetchDramaMovies: `${BASE_URL}/discover/movie?${commonParams}&with_genres=18`,
    fetchBollywoodMovies: `${BASE_URL}/discover/movie?${commonParams}&with_original_language=hi`,
    fetchDocumentaries: `${BASE_URL}/discover/movie?${commonParams}&with_genres=99`,
    fetchMovies: `${BASE_URL}/discover/movie?${commonParams}`,
    fetchTVShows: `${BASE_URL}/discover/tv?${commonParams}`,
    fetchTurkishMovies: `${BASE_URL}/discover/movie?${commonParams}&with_origin_country=TR`,
    fetchTurkishTV: `${BASE_URL}/discover/tv?${commonParams}&with_origin_country=TR`,
    fetchUpcoming: `${BASE_URL}/movie/upcoming?${commonParams}`,
    fetchNewReleases: `${BASE_URL}/discover/movie?${commonParams}&sort_by=primary_release_date.desc&primary_release_date.lte=${new Date().toISOString().split('T')[0]}`,
  };
};

export const getImageUrl = (path: string | null, size: 'original' | 'w500' = 'original') => {
  if (!path) return 'https://via.placeholder.com/1920x1080?text=No+Image';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const filterAdultContent = (movies: Movie[], contentFilter: boolean): Movie[] => {
  if (!contentFilter || !movies) return movies || [];
  
  const sensitiveKeywords = [
    'sexy', 'porn', 'erotic', 'erotica', 'nsfw', 'xxx', 'sexo', 'sexual', 'sensual', 'escort', 'orgasm', 'nude', 'adult',
    'إباحي', 'إباحية', 'جنسي', 'جنسية', 'خليع', 'خليعة', 'سهرة حمراء', 'للكبار فقط', 'بورنو', 'بورن', 'سهرات جنسية',
    'érotique', 'porno', 'libertin'
  ];

  return movies.filter(movie => {
    if (!movie) return false;
    if (movie.adult === true) return false;
    
    const titleStr = `${movie.title || ''} ${movie.name || ''} ${movie.overview || ''}`.toLowerCase();
    
    const hasSensitiveKeyword = sensitiveKeywords.some(keyword => 
      titleStr.includes(keyword)
    );
    
    return !hasSensitiveKeyword;
  });
};

export const fetchMovieDetails = async (id: number, type: 'movie' | 'tv', lang: string = 'ar-SA') => {
  try {
    const response = await api.get(`/${type}/${id}?${getAuthParam()}&language=${lang}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching details:', error);
    return null;
  }
};

export const fetchMovieImages = async (id: number, type: 'movie' | 'tv') => {
  try {
    // We request images without a rigid language constraint to get all available logos
    const response = await api.get(`/${type}/${id}/images?${getAuthParam()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching images:', error);
    return null;
  }
};

export const fetchMovieCredits = async (id: number, type: 'movie' | 'tv', lang: string = 'ar-SA') => {
  try {
    const response = await api.get(`/${type}/${id}/credits?${getAuthParam()}&language=${lang}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching credits:', error);
    return null;
  }
};

export const fetchMovieVideos = async (movieId: number, mediaType: 'movie' | 'tv' = 'movie', lang: string = 'ar-SA') => {
  try {
    const response = await api.get(`/${mediaType}/${movieId}/videos?${getAuthParam()}&language=${lang}`);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

export const searchMovies = async (query: string, lang: string = 'ar-SA', _contentFilter: boolean = true) => {
  try {
    const includeAdult = true;
    const response = await api.get(`/search/multi?${getAuthParam()}&query=${encodeURIComponent(query)}&language=${lang}&include_adult=${includeAdult}`);
    return response.data.results;
  } catch (error) {
    console.error('Error searching:', error);
    return [];
  }
};

export const searchOnlyMovies = async (query: string, lang: string = 'ar-SA', _contentFilter: boolean = true) => {
  try {
    const includeAdult = true;
    const response = await api.get(`/search/movie?${getAuthParam()}&query=${encodeURIComponent(query)}&language=${lang}&include_adult=${includeAdult}`);
    return response.data.results.map((item: any) => ({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
};

export const searchTVShows = async (query: string, lang: string = 'ar-SA', _contentFilter: boolean = true) => {
  try {
    const includeAdult = true;
    const response = await api.get(`/search/tv?${getAuthParam()}&query=${encodeURIComponent(query)}&language=${lang}&include_adult=${includeAdult}`);
    return response.data.results.map((item: any) => ({ ...item, media_type: 'tv' }));
  } catch (error) {
    console.error('Error searching TV shows:', error);
    return [];
  }
};

export const fetchSimilar = async (id: number, type: 'movie' | 'tv', lang: string = 'ar-SA') => {
  try {
    const response = await api.get(`/${type}/${id}/similar?${getAuthParam()}&language=${lang}`);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching similar:', error);
    return [];
  }
};

export const fetchTrendingToday = async (type: 'movie' | 'tv' | 'all' = 'movie', lang: string = 'ar-SA') => {
  try {
    const response = await api.get(`/trending/${type}/day?${getAuthParam()}&language=${lang}`);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching trending today:', error);
    return [];
  }
};

export const fetchSeasonDetails = async (tvId: number, seasonNumber: number, lang: string = 'ar-SA') => {
  try {
    const response = await api.get(`/tv/${tvId}/season/${seasonNumber}?${getAuthParam()}&language=${lang}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching season details:', error);
    return null;
  }
};

export const fetchPersonDetails = async (personId: number, lang: string = 'ar-SA') => {
  try {
    const response = await api.get(`/person/${personId}?${getAuthParam()}&language=${lang}&append_to_response=combined_credits`);
    return response.data;
  } catch (error) {
    console.error('Error fetching person details:', error);
    return null;
  }
};

export default api;
