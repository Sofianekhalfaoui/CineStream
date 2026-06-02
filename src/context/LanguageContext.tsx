import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en' | 'fr';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

export const translations: Translations = {
  home: { ar: 'الرئيسية', en: 'Home', fr: 'Accueil' },
  movies: { ar: 'الأفلام', en: 'Movies', fr: 'Films' },
  tvShows: { ar: 'المسلسلات', en: 'TV Shows', fr: 'Séries' },
  myList: { ar: 'قائمتي', en: 'My List', fr: 'Ma Liste' },
  newPopular: { ar: 'جديد وشائع', en: 'New & Popular', fr: 'Nouveau' },
  settings: { ar: 'الإعدادات', en: 'Settings', fr: 'Paramètres' },
  logout: { ar: 'تسجيل الخروج', en: 'Logout', fr: 'Déconnexion' },
  searchPlaceholder: { ar: 'ابحث عن أفلام، مسلسلات...', en: 'Search movies, shows...', fr: 'Rechercher...' },
  accountSettings: { ar: 'إعدادات الحساب', en: 'Account Settings', fr: 'Compte' },
  playbackSettings: { ar: 'إعدادات المشاهدة', en: 'Playback Settings', fr: 'Lecture' },
  preferences: { ar: 'التفضيلات والمظهر', en: 'Preferences & Appearance', fr: 'Préférences' },
  contentSettings: { ar: 'إعدادات المحتوى', en: 'Content Settings', fr: 'Contenu' },
  supportPrivacy: { ar: 'الدعم والخصوصية', en: 'Support & Privacy', fr: 'Aide et Confidentialité' },
  appSettingsTitle: { ar: 'إعدادات التطبيق', en: 'App Settings', fr: 'Paramètres' },
  controlExperience: { ar: 'تحكم في تجربتك في CINESTREAM', en: 'Control your experience', fr: 'Contrôlez votre expérience' },
  videoQuality: { ar: 'جودة الفيديو', en: 'Video Quality', fr: 'Qualité Vidéo' },
  dataSaver: { ar: 'توفير البيانات', en: 'Data Saver', fr: 'Économiseur de données' },
  autoplay: { ar: 'التشغيل التلقائي', en: 'Autoplay', fr: 'Lecture auto' },
  language: { ar: 'اللغة', en: 'Language', fr: 'Langue' },
  darkMode: { ar: 'الوضع الداكن', en: 'Dark Mode', fr: 'Mode Sombre' },
  notifications: { ar: 'الإشعارات', en: 'Notifications', fr: 'Notifications' },
  trending: { ar: 'الأكثر تداولاً الآن', en: 'Trending Now', fr: 'Tendances' },
  topRated: { ar: 'الأعلى تقييماً', en: 'Top Rated', fr: 'Les mieux notés' },
  popular: { ar: 'الشائع', en: 'Popular', fr: 'Populaire' },
  anime: { ar: 'أنمي', en: 'Anime', fr: 'Animé' },
  horrorThriller: { ar: 'رعب وإثارة', en: 'Horror & Thriller', fr: 'Horreur & Thriller' },
  sciFiFantasy: { ar: 'خيال علمي وفانتازيا', en: 'Sci-Fi & Fantasy', fr: 'Science-fiction & Fantaisie' },
  crimeMystery: { ar: 'جريمة وغموض', en: 'Crime & Mystery', fr: 'Crime & Mystère' },
  actionMovies: { ar: 'أفلام الأكشن', en: 'Action Movies', fr: 'Action' },
  comedyMovies: { ar: 'أفلام الكوميديا', en: 'Comedy Movies', fr: 'Comédie' },
  newReleases: { ar: 'أفلام جديدة', en: 'New Releases', fr: 'Nouveautés' },
  horrorMovies: { ar: 'أفلام الرعب', en: 'Horror Movies', fr: 'Horreur' },
  romanceMovies: { ar: 'أفلام الرومانسية', en: 'Romance Movies', fr: 'Romance' },
  documentaries: { ar: 'الأفلام الوثائقية', en: 'Documentaries', fr: 'Documentaires' },
  originalTitle: { ar: 'إنتاجات سيني ستريم', en: 'CineStream Originals', fr: 'Originaux CineStream' },
  aiAssistant: { ar: 'المساعد الذكي', en: 'AI Assistant', fr: 'Assistant IA' },
  aiAssistantPlaceholder: { ar: 'كيف تشعر اليوم؟ سأقترح عليك فيلماً...', en: 'How are you feeling? I will suggest a movie...', fr: 'Comment vous sentez-vous ? Je vais vous suggérer un film...' },
  aiSearching: { ar: 'جاري البحث بالذكاء الاصطناعي...', en: 'Searching with AI...', fr: 'Recherche avec l\'IA...' },
  aiNoResults: { ar: 'لم أجد اقتراحات تناسب هذا الطلب. حاول مجدداً!', en: 'No suggestions found. Try again!', fr: 'Pas de suggestions. Réessayez !' },
  play: { ar: 'تشغيل', en: 'Play', fr: 'Lecture' },
  moreInfo: { ar: 'المزيد من المعلومات', en: 'More Info', fr: 'Plus d\'infos' },
  watchTrailer: { ar: 'مشاهدة الإعلان', en: 'Watch Trailer', fr: 'Bande-annonce' },
  back: { ar: 'رجوع', en: 'Back', fr: 'Retour' },
  myListAdd: { ar: 'إضافة لقائمتي', en: 'Add to List', fr: 'Ajouter' },
  myListRemove: { ar: 'إزالة من قائمتي', en: 'Remove from List', fr: 'Supprimer' },
  releaseDate: { ar: 'تاريخ الإصدار', en: 'Release Date', fr: 'Date de sortie' },
  rating: { ar: 'التقييم', en: 'Rating', fr: 'Note' },
  episodes: { ar: 'الحلقات', en: 'Episodes', fr: 'Épisodes' },
  seasons: { ar: 'المواسم', en: 'Seasons', fr: 'Saisons' },
  profile: { ar: 'الملف الشخصي', en: 'Profile', fr: 'Profil' },
  changePassword: { ar: 'تغيير كلمة المرور', en: 'Change Password', fr: 'Changer le mot de passe' },
  subscriptionPlan: { ar: 'إدارة الاشتراك', en: 'Subscription Plan', fr: 'Abonnement' },
  premium: { ar: 'بريميوم', en: 'Premium', fr: 'Premium' },
  videoQuality4k: { ar: '4K (أقصى جودة)', en: '4K (Max Quality)', fr: '4K (Qualité Max)' },
  arabic: { ar: 'العربية', en: 'Arabic', fr: 'Arabe' },
  english: { ar: 'الإنجليزية', en: 'English', fr: 'Anglais' },
  french: { ar: 'الفرنسية', en: 'French', fr: 'Français' },
  parentalControls: { ar: 'الرقابة الأبوية', en: 'Parental Controls', fr: 'Contrôle Parental' },
  contentFilter: { ar: 'تصفية المحتوى', en: 'Content Filter', fr: 'Filtre de contenu' },
  manageDownloads: { ar: 'إدارة التنزيلات', en: 'Manage Downloads', fr: 'Gérer les téléchargements' },
  helpCenter: { ar: 'مركز المساعدة', en: 'Help Center', fr: 'Centre d\'aide' },
  privacyPolicy: { ar: 'سياسة الخصوصية والشروط', en: 'Privacy Policy', fr: 'Confidentialité' },
  about: { ar: 'حول التطبيق', en: 'About App', fr: 'À propos' },
  accountSettingsDesc: { ar: 'إدارة ملفك الشخصي واشتراكك وأمان الحساب', en: 'Manage your profile and security', fr: 'Gérez votre profil' },
  playbackSettingsDesc: { ar: 'تخصيص تجربة الفيديو والترجمة', en: 'Customize video and subtitles', fr: 'Personnalisez la lecture' },
  preferencesDesc: { ar: 'تغيير اللغة والمظهر والاشعارات', en: 'Change language, appearance and alerts', fr: 'Changez la langue' },
  contentSettingsDesc: { ar: 'الرقابة الأبوية وإدارة التنزيلات', en: 'Parental controls and downloads', fr: 'Contrôle parental' },
  supportPrivacyDesc: { ar: 'المساعدة والجوانب القانونية ومعلومات التطبيق', en: 'Help, legal and version info', fr: 'Aide et infos' },
  pinLocked: { ar: 'مقفل برمز PIN', en: 'PIN Locked', fr: 'Verrouillé par PIN' },
  enabled: { ar: 'مفعل', en: 'Enabled', fr: 'Activé' },
  usedSpace: { ar: 'مساحة مستخدمة', en: 'used', fr: 'utilisé' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
