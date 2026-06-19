/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MovieDetails from './components/MovieDetails';
import { hasApiKey } from './services/tmdb';
import { MovieProvider, useMovie } from './context/MovieContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { LanguageProvider } from './context/LanguageContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { WatchHistoryProvider } from './context/WatchHistoryContext';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { DownloadsProvider } from './context/DownloadsContext';
import { WatchPartyProvider } from './context/WatchPartyContext';
import { ToastProvider } from './context/ToastContext';
import SubscriptionModal from './components/SubscriptionModal';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Watch from './pages/Watch';
import DownloadPage from './pages/DownloadPage';
import Downloads from './pages/Downloads';
import NotFound from './pages/NotFound';
import { initSpatialNavigation } from './lib/spatialNavigation';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const { selectedMovie, setSelectedMovie } = useMovie();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    (window as any).customNavigate = (path: string) => {
      navigate(path);
    };
  }, [navigate]);

  React.useEffect(() => {
    if (!location.pathname.startsWith('/watch')) {
      sessionStorage.setItem('lastCatalogPath', location.pathname + location.search);
    }
  }, [location]);

  React.useEffect(() => {
    const cleanup = initSpatialNavigation();
    return cleanup;
  }, []);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', settings.accentColor);
    document.documentElement.style.setProperty('--primary-color-dark', settings.accentColor + 'dd');
  }, [settings.accentColor]);

  React.useEffect(() => {
    // Force dark mode on document element for absolute consistency
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-[#070b19] text-white transition-colors duration-300">
      {!hasApiKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter">الوصول مطلوب لمفتاح الـ API</h2>
            <p className="text-gray-400 text-lg">
              لجلب بيانات الأفلام الحقيقية، يجب عليك إضافة مفتاح الـ API الخاص بـ TMDB.
            </p>
            <div className="bg-white/5 p-4 rounded-lg text-left text-sm space-y-3 font-mono">
              <p className="text-gray-500">كيفية الإصلاح:</p>
              <ol className="list-decimal list-inside text-gray-300 space-y-2">
                <li>اذهب إلى <span className="text-red-400">Settings &gt; Secrets</span></li>
                <li>أضف سراً جديداً: <code className="bg-white/10 px-1 rounded text-red-400 font-bold">VITE_TMDB_API_KEY</code></li>
                <li>انسخ مفتاحك من موقع <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">TMDB</a></li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <Navbar />
      <SubscriptionModal />
      
      <main className="pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv" element={<TVShows />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/watch/:mediaType/:id" element={<Watch />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedMovie && (
          <MovieDetails 
            movie={selectedMovie} 
            onClose={() => setSelectedMovie(null)} 
          />
        )}
      </AnimatePresence>

      <footer className="px-4 md:px-12 py-10 border-t border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-500 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="flex flex-col gap-2">
            <span className="hover:text-primary cursor-pointer transition-colors">Audio Description</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Help Centre</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Gift Cards</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Media Centre</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="hover:text-primary cursor-pointer transition-colors">Investor Relations</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Jobs</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Terms of Use</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="hover:text-primary cursor-pointer transition-colors">Legal Notices</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Cookie Preferences</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Corporate Information</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Contact Us</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>&copy; 1997-2026 FalakPlay, Inc.</span>
          <span className="text-red-600 font-bold">ALGERIA / MIDDLE EAST</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <SettingsProvider>
              <SubscriptionProvider>
                <WatchHistoryProvider>
                  <MovieProvider>
                    <FavoritesProvider>
                      <DownloadsProvider>
                        <WatchPartyProvider>
                          <AppContent />
                        </WatchPartyProvider>
                      </DownloadsProvider>
                    </FavoritesProvider>
                  </MovieProvider>
                </WatchHistoryProvider>
              </SubscriptionProvider>
            </SettingsProvider>
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
