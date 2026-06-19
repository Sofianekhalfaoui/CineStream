import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en' | 'fr' | 'es' | 'de' | 'tr' | 'ru' | 'it' | 'pt' | 'zh' | 'ja' | 'ko';

interface Translations {
  [key: string]: {
    [key in Language]?: string;
  } & {
    ar: string;
    en: string;
  };
}

export const translations: Translations = {
  home: {
    ar: 'الرئيسية', en: 'Home', fr: 'Accueil',
    es: 'Inicio', de: 'Startseite', tr: 'Ana Sayfa', ru: 'Главная',
    it: 'Home', pt: 'Início', zh: '首页', ja: 'ホーム', ko: '홈'
  },
  movies: {
    ar: 'الأفلام', en: 'Movies', fr: 'Films',
    es: 'Películas', de: 'Filme', tr: 'Filmler', ru: 'Фильмы',
    it: 'Film', pt: 'Filmes', zh: '电影', ja: '映画', ko: '영화'
  },
  tvShows: {
    ar: 'المسلسلات', en: 'TV Shows', fr: 'Séries',
    es: 'Series', de: 'Serien', tr: 'Diziler', ru: 'Сериалы',
    it: 'Serie TV', pt: 'Séries', zh: '电视剧', ja: '番組', ko: '시리즈'
  },
  myList: {
    ar: 'قائمتي', en: 'My List', fr: 'Ma Liste',
    es: 'Mi Lista', de: 'Meine Liste', tr: 'Listem', ru: 'Мой список',
    it: 'La mia lista', pt: 'Minha Lista', zh: '我的列表', ja: 'マイリスト', ko: '내가 찜한 콘텐츠'
  },
  newPopular: {
    ar: 'جديد وشائع', en: 'New & Popular', fr: 'Nouveau',
    es: 'Nuevo y Popular', de: 'Neu & Beliebt', tr: 'Yeni ve Popüler', ru: 'Новое и популярное',
    it: 'Nuovi e popolari', pt: 'Novidades', zh: '最新热闹', ja: '最新作', ko: '신규 & 대세'
  },
  settings: {
    ar: 'الإعدادات', en: 'Settings', fr: 'Paramètres',
    es: 'Ajustes', de: 'Einstellungen', tr: 'Ayarlar', ru: 'Настройки',
    it: 'Impostazioni', pt: 'Configurações', zh: '设置', ja: '設定', ko: '설정'
  },
  logout: {
    ar: 'تسجيل الخروج', en: 'Logout', fr: 'Déconnexion',
    es: 'Cerrar sesión', de: 'Abmelden', tr: 'Çıkış Yap', ru: 'Выйти',
    it: 'Esci', pt: 'Sair', zh: '退出登录', ja: 'ログアウト', ko: '로그아웃'
  },
  searchPlaceholder: {
    ar: 'ابحث عن أفلام، مسلسلات...', en: 'Search movies, shows...', fr: 'Rechercher...',
    es: 'Buscar películas, series...', de: 'Suchen...', tr: 'Ara...', ru: 'Поиск...',
    it: 'Cerca...', pt: 'Buscar...', zh: '搜索...', ja: '検索...', ko: '검색...'
  },
  accountSettings: {
    ar: 'إعدادات الحساب', en: 'Account Settings', fr: 'Compte',
    es: 'Ajustes de cuenta', de: 'Kontoeinstellungen', tr: 'Hesap Ayarları', ru: 'Настройки аккаунта',
    it: 'Account', pt: 'Conta', zh: '账户设置', ja: 'アカウント設定', ko: '계정 설정'
  },
  playbackSettings: {
    ar: 'إعدادات المشاهدة', en: 'Playback Settings', fr: 'Lecture',
    es: 'Ajustes de reproducción', de: 'Wiedergabe-Einstellungen', tr: 'Oynatma Ayarları', ru: 'Настройки воспроизведения',
    it: 'Riproduzione', pt: 'Reprodução', zh: '播放设置', ja: '再生設定', ko: '재생 설정'
  },
  preferences: {
    ar: 'التفضيلات والمظهر', en: 'Preferences & Appearance', fr: 'Préférences',
    es: 'Preferencias y Apariencia', de: 'Einstellungen & Design', tr: 'Tercihler ve Görünüm', ru: 'Предпочтения и внешний вид',
    it: 'Preferenze', pt: 'Preferências', zh: '首选项与外观', ja: '環境設定と外観', ko: '환경 설정 및 디자인'
  },
  contentSettings: {
    ar: 'إعدادات المحتوى', en: 'Content Settings', fr: 'Contenu',
    es: 'Ajustes de contenido', de: 'Inhaltseinstellungen', tr: 'İçerik Ayarları', ru: 'Настройки контента',
    it: 'Contenuto', pt: 'Conteúdo', zh: '内容设置', ja: 'コンテンツ設定', ko: '콘텐츠 설정'
  },
  supportPrivacy: {
    ar: 'الدعم والخصوصية', en: 'Support & Privacy', fr: 'Aide et Confidentialité',
    es: 'Soporte y Privacidad', de: 'Support & Datenschutz', tr: 'Destek ve Gizlilik', ru: 'Поддержка и конфиденциальность',
    it: 'Supporto e Privacy', pt: 'Suporte e Privacidade', zh: '支持与隐私', ja: 'サポートとプライバシー', ko: '지원 및 개인정보'
  },
  appSettingsTitle: {
    ar: 'إعدادات التطبيق', en: 'App Settings', fr: 'Paramètres',
    es: 'Ajustes de aplicación', de: 'App-Einstellungen', tr: 'Uygulama Ayarları', ru: 'Настройки приложения',
    it: 'Impostazioni App', pt: 'Ajustes do Aplicativo', zh: '应用设置', ja: 'アプリ設定', ko: '앱 설정'
  },
  controlExperience: {
    ar: 'تحكم في تجربتك في CINESTREAM', en: 'Control your experience', fr: 'Contrôlez votre expérience',
    es: 'Controla tu experiencia', de: 'Steuere dein Erlebnis', tr: 'Deneyiminizi kontrol edin', ru: 'Управляйте своим опытом',
    it: 'Controlla la tua esperienza', pt: 'Controle sua experiência', zh: '控制您的体验', ja: '視聴体験を管理する', ko: '사용자 경험 관리'
  },
  videoQuality: {
    ar: 'جودة الفيديو', en: 'Video Quality', fr: 'Qualité Vidéo',
    es: 'Calidad de video', de: 'Videoqualität', tr: 'Video Kalitesi', ru: 'Качество видео',
    it: 'Qualità video', pt: 'Qualidade de Vídeo', zh: '视频画质', ja: '画質', ko: '화질'
  },
  dataSaver: {
    ar: 'توفير البيانات', en: 'Data Saver', fr: 'Économiseur de données',
    es: 'Ahorro de datos', de: 'Datensparmodus', tr: 'Veri Tasarrufu', ru: 'Экономия данных',
    it: 'Risparmio dati', pt: 'Economia de Dados', zh: '节省流量', ja: 'データセーバー', ko: '데이터 절약'
  },
  autoplay: {
    ar: 'التشغيل التلقائي', en: 'Autoplay', fr: 'Lecture auto',
    es: 'Reproducción automática', de: 'Autoplay', tr: 'Otomatik Oynat', ru: 'Автовоспроизведение',
    it: 'Riproduzione automatica', pt: 'Reprodução Automática', zh: '自动播放', ja: '自動再生', ko: '자동 재생'
  },
  language: {
    ar: 'اللغة', en: 'Language', fr: 'Langue',
    es: 'Idioma', de: 'Sprache', tr: 'Dil', ru: 'Язык',
    it: 'Lingua', pt: 'Idioma', zh: '语言', ja: '言語', ko: '언어'
  },
  darkMode: {
    ar: 'الوضع الداكن', en: 'Dark Mode', fr: 'Mode Sombre',
    es: 'Modo oscuro', de: 'Dunkelmodus', tr: 'Karanlık Mod', ru: 'Темный режим',
    it: 'Modalità scura', pt: 'Modo Escuro', zh: '深色模式', ja: 'ダークモード', ko: '다크 모드'
  },
  notifications: {
    ar: 'الإشعارات', en: 'Notifications', fr: 'Notifications',
    es: 'Notificaciones', de: 'Benachrichtigungen', tr: 'Bildirimler', ru: 'Уведомления',
    it: 'Notifiche', pt: 'Notificações', zh: '通知', ja: '通知', ko: '알림'
  },
  trending: {
    ar: 'الأكثر تداولاً الآن', en: 'Trending Now', fr: 'Tendances',
    es: 'Tendencias ahora', de: 'Angesagt', tr: 'Şu Anda Trend', ru: 'В тренде',
    it: 'Di tendenza ora', pt: 'Mais assistidos', zh: '今日趋势', ja: 'トレンド', ko: '지금 인기 있는 콘텐츠'
  },
  top10Today: {
    ar: 'أفضل الأفلام', en: 'Top Movies', fr: 'Top Films',
    es: 'Mejores películas', de: 'Top-Filme', tr: 'En İyi Filmler', ru: 'Лучшие фильмы',
    it: 'Migliori film', pt: 'Melhores Filmes', zh: '热门电影', ja: '映画トップ', ko: '인기 영화'
  },
  topRated: {
    ar: 'الأعلى تقييماً', en: 'Top Rated', fr: 'Les mieux notés',
    es: 'Más valoradas', de: 'Bestbewertet', tr: 'En Çok Oy Alanlar', ru: 'Высокий рейтинг',
    it: 'Più votati', pt: 'Mais Votados', zh: '高分精选', ja: '高評価の作品', ko: '높은 평점'
  },
  popular: {
    ar: 'الشائع', en: 'Popular', fr: 'Populaire',
    es: 'Popular', de: 'Beliebt', tr: 'Popüler', ru: 'Популярно',
    it: 'Popolari', pt: 'Popular', zh: '流行热门', ja: '人気の作品', ko: '대세 콘텐츠'
  },
  anime: {
    ar: 'أنمي', en: 'Anime', fr: 'Animé',
    es: 'Anime', de: 'Anime', tr: 'Anime', ru: 'Аниме',
    it: 'Anime', pt: 'Animes', zh: '动漫', ja: 'アニメ', ko: '애니메이션'
  },
  horrorThriller: {
    ar: 'رعب وإثارة', en: 'Horror & Thriller', fr: 'Horreur & Thriller',
    es: 'Terror y Suspenso', de: 'Horror & Thriller', tr: 'Korku ve Gerilim', ru: 'Ужасы и триллеры',
    it: 'Horror e Thriller', pt: 'Terror e Suspense', zh: '恐怖与惊悚', ja: 'ホラー・スリラー', ko: '공포 및 스릴러'
  },
  sciFiFantasy: {
    ar: 'خيال علمي وفانتازيا', en: 'Sci-Fi & Fantasy', fr: 'Science-fiction & Fantaisie',
    es: 'Ciencia ficción y Fantasía', de: 'Sci-Fi & Fantasy', tr: 'Bilim Kurgu ve Fantastik', ru: 'Фантастика',
    it: 'Fantascienza e Fantasy', pt: 'Ficção Científica e Fantasia', zh: '科幻与奇幻', ja: 'SF・ファンタジー', ko: 'SF 및 판타지'
  },
  crimeMystery: {
    ar: 'جريمة وغموض', en: 'Crime & Mystery', fr: 'Crime & Mystère',
    es: 'Crimen y Misterio', de: 'Krimi & Mystery', tr: 'Suç ve Gizem', ru: 'Криминал и детективы',
    it: 'Crime e Mistero', pt: 'Policial e Mistério', zh: '犯罪与悬疑', ja: 'サスペンス・ミステリー', ko: '범죄 및 미스터리'
  },
  actionMovies: {
    ar: 'أفلام الأكشن', en: 'Action Movies', fr: 'Action',
    es: 'Acción', de: 'Actionfilme', tr: 'Aksiyon', ru: 'Боевики',
    it: 'Azione', pt: 'Ação', zh: '动作电影', ja: 'アクション映画', ko: '액션 영화'
  },
  comedyMovies: {
    ar: 'أفلام الكوميديا', en: 'Comedy Movies', fr: 'Comédie',
    es: 'Comedia', de: 'Komödien', tr: 'Komedi', ru: 'Комедии',
    it: 'Commedia', pt: 'Comédia', zh: '喜剧电影', ja: 'コメディ映画', ko: '코미디 영화'
  },
  newReleases: {
    ar: 'أفلام جديدة', en: 'New Releases', fr: 'Nouveautés',
    es: 'Novedades', de: 'Neuerscheinungen', tr: 'Yeni Çıkanlar', ru: 'Новинки',
    it: 'Nuove Uscite', pt: 'Novos Lançamentos', zh: '最新上映', ja: '新着作品', ko: '신작 영화'
  },
  horrorMovies: {
    ar: 'أفلام الرعب', en: 'Horror Movies', fr: 'Horreur',
    es: 'Línea de Terror', de: 'Horrorfilme', tr: 'Korku', ru: 'Ужасы',
    it: 'Film Horror', pt: 'Filmes de Terror', zh: '恐怖电影', ja: 'ホラー映画', ko: '공포 영화'
  },
  romanceMovies: {
    ar: 'أفلام الرومانسية', en: 'Romance Movies', fr: 'Romance',
    es: 'Romance', de: 'Romantische Filme', tr: 'Romantik', ru: 'Мелодрамы',
    it: 'Sentimentali', pt: 'Romances', zh: '爱情电影', ja: 'ラブロマンス映画', ko: '로맨스 영화'
  },
  dramaMovies: {
    ar: 'أفلام الدراما', en: 'Drama Movies', fr: 'Drame',
    es: 'Drama', de: 'Dramen', tr: 'Dram', ru: 'Драмы',
    it: 'Drammatici', pt: 'Dramas', zh: '剧情电影', ja: 'ドラマ映画', ko: '드라마 영화'
  },
  bollywoodMovies: {
    ar: 'أفلام هوليود (هندي)', en: 'Hollywood (Indian)', fr: 'Hollywood (Indien)',
    es: 'Cine de la India', de: 'Bollywood', tr: 'Hint Sineması', ru: 'Индийское кино',
    it: 'Cinema Indiano', pt: 'Bollywood', zh: '印度电影', ja: 'インド映画', ko: '인도 영화'
  },
  documentaries: {
    ar: 'الأفلام الوثائقية', en: 'Documentaries', fr: 'Documentaires',
    es: 'Documentales', de: 'Dokumentationen', tr: 'Belgeseller', ru: 'Документальные',
    it: 'Documentari', pt: 'Documentários', zh: '纪录片', ja: 'ドキュメンタリー', ko: '다큐멘タリー'
  },
  originalTitle: {
    ar: 'إنتاجات فلك بلاي', en: 'FalakPlay Originals', fr: 'Originaux FalakPlay',
    es: 'Originales de FalakPlay', de: 'FalakPlay Originale', tr: 'FalakPlay Orijinalleri', ru: 'Оригиналы FalakPlay',
    it: 'Originali FalakPlay', pt: 'Originais FalakPlay', zh: 'FalakPlay独家', ja: 'FalakPlayオリジナル', ko: 'FalakPlay 오리지널'
  },
  aiAssistant: {
    ar: 'المساعد الذكي', en: 'AI Assistant', fr: 'Assistant IA',
    es: 'Asistente IA', de: 'KI-Assistent', tr: 'Yapay Zeka', ru: 'ИИ Помощник',
    it: 'Assistente IA', pt: 'Assistente IA', zh: 'AI 助手', ja: 'AI アシスタント', ko: 'AI 어시스턴트'
  },
  aiAssistantPlaceholder: {
    ar: 'كيف تشعر اليوم؟ سأقترح عليك فيلماً...', en: 'How are you feeling? I will suggest a movie...', fr: 'Comment vous sentez-vous ? Je vais vous suggérer un film...',
    es: '¿Cómo te sientes hoy? Te sugeriré una película...', de: 'Wie fühlst du dich heute? Ich schlage einen Film vor...', tr: 'Bugün nasıl hissediyorsun? Sana film önereceğim...', ru: 'Как дела сегодня? Посоветую отличный фильм...',
    it: 'Come ti senti? Ti consiglierò un film...', pt: 'Como se sente hoje? Vou sugerir um filme...', zh: '今天感觉如何？我来给您推荐部电影...', ja: '今日の気分は？おすすめの映画を提案します...', ko: '오늘 기분이 어떠신가요? 취향에 맞는 영화를 추천해 드릴게요...'
  },
  aiSearching: {
    ar: 'جاري البحث بالذكاء الاصطناعي...', en: 'Searching with AI...', fr: 'Recherche avec l\'IA...',
    es: 'Buscando con IA...', de: 'Suche mit KI läuft...', tr: 'Yapay Zeka ile Aranıyor...', ru: 'Ищем с помощью ИИ...',
    it: 'Ricerca con IA...', pt: 'Pesquisando com IA...', zh: 'AI正在智能搜寻中...', ja: 'AIが検索中...', ko: 'AI 제안 검색 중...'
  },
  aiNoResults: {
    ar: 'لم أجد اقتراحات تناسب هذا الطلب. حاول مجدداً!', en: 'No suggestions found. Try again!', fr: 'Pas de suggestions. Réessayez !',
    es: '¡No hay sugerencias para esta búsqueda! Intenta de nuevo.', de: 'Keine Vorschläge gefunden. Versuche es noch einmal!', tr: 'Arama kriterine uygun sonuç bulunamadı. Tekrar deniyin!', ru: 'Ничего не найдено. Попробуйте еще раз!',
    it: 'Nessun consiglio trovato. Riprova!', pt: 'Nenhum resultado. Tente novamente!', zh: '无可推荐，换个问题试试吧！', ja: '良い作品が見つかりませんでした。違う条件で試してください。', ko: '추천 결과를 찾지 못했습니다. 다른 단어로 검색해 보세요!'
  },
  play: {
    ar: 'تشغيل', en: 'Play', fr: 'Lecture',
    es: 'Reproducir', de: 'Abspielen', tr: 'Oynat', ru: 'Смотреть',
    it: 'Fai Partire', pt: 'Reproduzir', zh: '播放', ja: '再生', ko: '재생'
  },
  moreInfo: {
    ar: 'المزيد من المعلومات', en: 'More Info', fr: 'Plus d\'infos',
    es: 'Más información', de: 'Mehr Infos', tr: 'Daha Fazla Bilgi', ru: 'Подробнее',
    it: 'Info', pt: 'Mais Informações', zh: '更多详情', ja: '詳細情報', ko: '상세 정보'
  },
  watchTrailer: {
    ar: 'مشاهدة الإعلان', en: 'Watch Trailer', fr: 'Bande-annonce',
    es: 'Ver tráiler', de: 'Trailer ansehen', tr: 'Fragman İzle', ru: 'Трейлер',
    it: 'Guarda Trailer', pt: 'Ver Trailer', zh: '观赏预告', ja: '予告編を観る', ko: '예고편 보기'
  },
  back: {
    ar: 'رجوع', en: 'Back', fr: 'Retour',
    es: 'Volver', de: 'Zurück', tr: 'Geri', ru: 'Назад',
    it: 'Indietro', pt: 'Voltar', zh: '返回', ja: '戻る', ko: '뒤로가기'
  },
  myListAdd: {
    ar: 'إضافة لقائمتي', en: 'Add to List', fr: 'Ajouter',
    es: 'Añadir a mi lista', de: 'Zur Liste hinzufügen', tr: 'Listeye Ekle', ru: 'В список',
    it: 'Aggiungi a Lista', pt: 'Guardar na Lista', zh: '加入列表', ja: 'リストに追加', ko: '내가 찜한 콘텐츠에 저장'
  },
  myListRemove: {
    ar: 'إزالة من قائمتي', en: 'Remove from List', fr: 'Supprimer',
    es: 'Quitar de mi lista', de: 'Aus Liste entfernen', tr: 'Listeden Çıkar', ru: 'Убрать из списка',
    it: 'Rimuovi da Lista', pt: 'Remover da Lista', zh: '从列表移除', ja: 'リストから削除', ko: '찜 목록에서 삭제'
  },
  releaseDate: {
    ar: 'تاريخ الإصدار', en: 'Release Date', fr: 'Date de sortie',
    es: 'Fecha de estreno', de: 'Veröffentlichungsdatum', tr: 'Yayın Tarihi', ru: 'Дата выхода',
    it: 'Data di uscita', pt: 'Data de Lançamento', zh: '上映年份', ja: 'リリース日', ko: '공개일'
  },
  rating: {
    ar: 'التقييم', en: 'Rating', fr: 'Note',
    es: 'Clasificación', de: 'Bewertung', tr: 'Derecelendirme', ru: 'Рейтинг',
    it: 'Voto', pt: 'Avaliação', zh: '评分', ja: '評価', ko: '평점'
  },
  episodes: {
    ar: 'الحلقات', en: 'Episodes', fr: 'Épisodes',
    es: 'Episodios', de: 'Folgen', tr: 'Bölümler', ru: 'Серии',
    it: 'Episodi', pt: 'Episódios', zh: '集数', ja: 'エピソード', ko: '에피소드'
  },
  seasons: {
    ar: 'المواسم', en: 'Seasons', fr: 'Saisons',
    es: 'Temporadas', de: 'Staffeln', tr: 'Sezonlar', ru: 'Сезоны',
    it: 'Stagioni', pt: 'Temporadas', zh: '季', ja: 'シーズン', ko: '시즌'
  },
  profile: {
    ar: 'الملف الشخصي', en: 'Profile', fr: 'Profil',
    es: 'Perfil', de: 'Profil', tr: 'Profil', ru: 'Профиль',
    it: 'Profilo', pt: 'Perfil', zh: '个人资料', ja: 'プロフィール', ko: '프로필'
  },
  changePassword: {
    ar: 'تغيير كلمة المرور', en: 'Change Password', fr: 'Changer le mot de passe',
    es: 'Cambiar contraseña', de: 'Passwort ändern', tr: 'Şifre Değiştir', ru: 'Сменить пароль',
    it: 'Cambia Password', pt: 'Alterar Senha', zh: '修改密码', ja: 'パスワード変更', ko: '비밀번호 변경'
  },
  subscriptionPlan: {
    ar: 'إدارة الاشتراك', en: 'Subscription Plan', fr: 'Abonnement',
    es: 'Suscripción', de: 'Abonnement', tr: 'Abonelik', ru: 'Подписка',
    it: 'Abbonamento', pt: 'Plano de Assinatura', zh: '订阅方案管理', ja: 'メンバーシップ設定', ko: '멤버십 관리'
  },
  premium: {
    ar: 'بريميوم', en: 'Premium', fr: 'Premium',
    es: 'Premium', de: 'Premium', tr: 'Premium', ru: 'Премиум',
    it: 'Premium', pt: 'Premium', zh: '高级会员', ja: 'プレミアム', ko: '프리미엄'
  },
  videoQuality4k: {
    ar: '4K (أقصى جودة)', en: '4K (Max Quality)', fr: '4K (Qualité Max)',
    es: '4K (Calidad máxima)', de: '4K (Max. Qualität)', tr: '4K (Maks. Kalite)', ru: '4K (Макс. качество)',
    it: '4K (Qualità massima)', pt: '4K (Qualidade Máx.)', zh: '4K超清画质', ja: '4K画質', ko: '4K (최고 화질)'
  },
  arabic: {
    ar: 'العربية', en: 'Arabic', fr: 'Arabe',
    es: 'Árabe', de: 'Arabisch', tr: 'Arapça', ru: 'Арабский',
    it: 'Arabo', pt: 'Árabe', zh: '阿拉伯语', ja: 'アラビア語', ko: '아랍어'
  },
  english: {
    ar: 'الإنجليزية', en: 'English', fr: 'Anglais',
    es: 'Inglés', de: 'Englisch', tr: 'İngilizce', ru: 'Английский',
    it: 'Inglese', pt: 'Inglês', zh: '英语', ja: '英語', ko: '영어'
  },
  french: {
    ar: 'الفرنسية', en: 'French', fr: 'Français',
    es: 'Francés', de: 'Französisch', tr: 'Fransızca', ru: 'Французский',
    it: 'Francese', pt: 'Francês', zh: '法语', ja: 'フランス語', ko: '프랑스어'
  },
  parentalControls: {
    ar: 'الرقابة الأبوية', en: 'Parental Controls', fr: 'Contrôle Parental',
    es: 'Control parental', de: 'Kindersicherung', tr: 'Ebeveyn Kontrolleri', ru: 'Родительский контроль',
    it: 'Filtro famiglia', pt: 'Controle dos Pais', zh: '家长控制', ja: 'ペアレンタルコントロール', ko: '자녀 보호 설정'
  },
  contentFilter: {
    ar: 'تصفية المحتوى', en: 'Content Filter', fr: 'Filtre de contenu',
    es: 'Filtro de contenido', de: 'Jugendschutz-Filter', tr: 'İçerik Filtresi', ru: 'Фильтрация контента',
    it: 'Filtro Contenuti', pt: 'Filtro de Conteúdo', zh: '内容过滤', ja: 'コンテンツ制限', ko: '콘텐츠 필터링'
  },
  manageDownloads: {
    ar: 'إدارة التنزيلات', en: 'Manage Downloads', fr: 'Gérer les téléchargements',
    es: 'Descargas', de: 'Downloads verwalten', tr: 'İndirmeleri Yönet', ru: 'Управление загрузками',
    it: 'Download', pt: 'Gerenciar Downloads', zh: '下载管理', ja: 'ダウンロード管理', ko: '다운로드 관리'
  },
  helpCenter: {
    ar: 'مركز المساعدة', en: 'Help Center', fr: 'Centre d\'aide',
    es: 'Centro de ayuda', de: 'Hilfebereich', tr: 'Yardım Merkezi', ru: 'Справка',
    it: 'Centro Assistenza', pt: 'Central de Ajuda', zh: '帮助中心', ja: 'ヘルプセンター', ko: '고객 센터'
  },
  privacyPolicy: {
    ar: 'سياسة الخصوصية والشروط', en: 'Privacy Policy', fr: 'Confidentialité',
    es: 'Política de privacidad', de: 'Datenschutzerklärung', tr: 'Gizlilik Sözleşmesi', ru: 'Конфиденциальность',
    it: 'Privacy Policy', pt: 'Política de Privacidade', zh: '隐私政策条款', ja: 'プライバシーポリシー', ko: '개인정보 처리방침'
  },
  about: {
    ar: 'حول التطبيق', en: 'About App', fr: 'À propos',
    es: 'Acerca de', de: 'Über die App', tr: 'Hakkında', ru: 'О приложении',
    it: 'Info app', pt: 'Sobre', zh: '关于应用', ja: 'アプリについて', ko: '정보'
  },
  accountSettingsDesc: {
    ar: 'إدارة ملفك الشخصي واشتراكك وأمان الحساب', en: 'Manage your profile and security', fr: 'Gérez votre profil',
    es: 'Edita tu perfil y datos de seguridad', de: 'Verwalte dein Profil und Sicherheit', tr: 'Profilini ve güvenliği yönet', ru: 'Управляйте профилем и безопасностью',
    it: 'Gestisci il profilo e la sicurezza', pt: 'Gerencie seu perfil e segurança', zh: '管理您的个人信息和安全', ja: 'プロファイルとセキュリティ設定を編集', ko: '프로필 및 보안 관리'
  },
  playbackSettingsDesc: {
    ar: 'تخصيص تجربة الفيديو والترجمة', en: 'Customize video and subtitles', fr: 'Personnalisez la lecture',
    es: 'Ajustes del reproductor y subtítulos', de: 'Video und Untertitel anpassen', tr: 'Video ve altyazıları ayarla', ru: 'Качество видео и субтитры',
    it: 'Opzioni del player e sottotitoli', pt: 'Configure vídeo e legendas', zh: '自定义视频画质和字幕', ja: '画質と字幕のカスタマイズ', ko: '동영상 및 자막 옵션 설정'
  },
  preferencesDesc: {
    ar: 'تغيير اللغة والمظهر والاشعارات', en: 'Change language, appearance and alerts', fr: 'Changez la langue',
    es: 'Cambiar idioma, tema y alertas', de: 'Sprache, Design & Benachrichtigungen', tr: 'Dil, kaplama ve uyarılar', ru: 'Язык, дизайн и уведомления',
    it: 'Cambia lingua, aspetto e notifiche', pt: 'Idiomas, tema e notificações', zh: '语言、外观和通知设置', ja: '言語、外観と通知の設定', ko: '언어, 다크 모드 및 알림 설정'
  },
  contentSettingsDesc: {
    ar: 'الرقابة الأبوية وإدارة التنزيلات', en: 'Parental controls and downloads', fr: 'Contrôle parental',
    es: 'Opciones de menores y descargas', de: 'Kontrolloptionen und Dateispeicherung', tr: 'Çocuk kilidi ve çevrimdışı seçenekler', ru: 'Возрастной ценз и загрузки',
    it: 'Filtro minori e gestione download', pt: 'Modo infantil e downloads', zh: '家长控制和下载存储管理', ja: '視聴制限とダウンロード領域', ko: '자녀 보호 기능 및 다운로드 관리'
  },
  supportPrivacyDesc: {
    ar: 'المساعدة والجوانب القانونية ومعلومات التطبيق', en: 'Help, legal and version info', fr: 'Aide et infos',
    es: 'Ayuda, legal e información de software', de: 'Hilfe, Rechtliches & App-Version', tr: 'Destek, yasal ve sürüm bilgisi', ru: 'Помощь, правила и информация о версии',
    it: 'Aiuto, note legali e specifiche', pt: 'Ajuda, jurídico e versão do app', zh: '获取帮助、服务协议和版本信息', ja: 'ヘルプ、法的通知とバージョン情報', ko: '도움말, 이용약관 및 애플리케이션 정보'
  },
  pinLocked: {
    ar: 'مقفل برمز PIN', en: 'PIN Locked', fr: 'Verrouillé par PIN',
    es: 'Bloqueado por PIN', de: 'Mit PIN gesichert', tr: 'PIN Korumalı', ru: 'Заблокировано PIN',
    it: 'Blocco con PIN', pt: 'Bloqueado por PIN', zh: 'PIN 锁已启用', ja: 'PINロック中', ko: 'PIN 잠금 설정됨'
  },
  enabled: {
    ar: 'مفعل', en: 'Enabled', fr: 'Activé',
    es: 'Activado', de: 'Aktiviert', tr: 'Etkin', ru: 'Включено',
    it: 'Attivo', pt: 'Ativado', zh: '已启用', ja: '有効', ko: '사용 중'
  },
  disabled: {
    ar: 'معطل', en: 'Disabled', fr: 'Désactivé',
    es: 'Desactivado', de: 'Deaktiviert', tr: 'Devre Dışı', ru: 'Выключено',
    it: 'Disattivo', pt: 'Desativado', zh: '已禁用', ja: '無効', ko: '사용 안 함'
  },
  usedSpace: {
    ar: 'مساحة مستخدمة', en: 'used', fr: 'utilisé',
    es: 'usado', de: 'belegt', tr: 'kullanılan', ru: 'использовано',
    it: 'usato', pt: 'usado', zh: '已用空间', ja: '使用済み', ko: '사용됨'
  },
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
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation['en'] || translation['ar'] || key;
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
