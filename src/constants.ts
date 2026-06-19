const isCapacitor = 
  (typeof window !== 'undefined' && (
    window.hasOwnProperty('Capacitor') || 
    (window as any).Capacitor || 
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !window.location.port)
  ));

export const LOCAL_API = isCapacitor 
  ? 'https://ais-pre-gjxlpljjwvmccgozz4ahwx-432954430405.europe-west1.run.app' 
  : '';

export const TMDB_BASE_URL = `${LOCAL_API}/api/tmdb`;
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

