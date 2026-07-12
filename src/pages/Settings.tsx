import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings as SettingsIcon, 
  PlayCircle, 
  Globe, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Smartphone, 
  Subtitles, 
  Bell, 
  Moon, 
  Lock, 
  Download,
  Info,
  CreditCard,
  Key,
  X,
  Edit2,
  Check,
  AlertCircle,
  Zap,
  CircleDollarSign,
  Wallet,
  CheckCircle2,
  Play,
  RotateCcw,
  Palette,
  RefreshCw,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useDownloads } from '../context/DownloadsContext';
import { DEFAULT_ACCENT_COLOR } from '../context/SettingsContext';
import { updateProfile, updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential, linkWithCredential, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, logout, googleProvider } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface SettingSectionProps {
  title: string;
  icon: any;
  description: string;
  children: React.ReactNode;
}

const SettingSection = ({ title, icon: Icon, description, children }: SettingSectionProps) => {
  const { isRTL } = useLanguage();
  return (
    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden mb-6 shadow-sm dark:shadow-none">
      <div className={cn("p-6 border-b border-gray-100 dark:border-white/5 flex items-start gap-4", !isRTL && "flex-row")}>
        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{title}</h3>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
};

interface SettingItemProps {
  label: string;
  value?: string;
  icon?: any;
  onClick?: () => void;
  type?: 'toggle' | 'select' | 'button';
  active?: boolean;
}

const SettingItem = ({ label, value, icon: Icon, onClick, type = 'button', active }: SettingItemProps) => {
  const { isRTL } = useLanguage();
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between group py-2 transition-transform",
        isRTL ? "hover:translate-x-[-4px]" : "hover:translate-x-1"
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{value}</span>}
        {type === 'toggle' ? (
          <div className={cn(
            "w-8 h-4 rounded-full relative transition-colors",
            active ? "bg-primary" : "bg-gray-200 dark:bg-white/10"
          )}>
            <div className={cn(
              "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
              active ? (isRTL ? "left-1" : "right-1") : (isRTL ? "left-5" : "right-5")
            )} />
          </div>
        ) : (
          <ChevronRight className={cn("w-4 h-4 text-gray-400 group-hover:text-primary transition-colors", isRTL && "rotate-180")} />
        )}
      </div>
    </button>
  );
};

// Convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Convert Hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();
  const { user } = useAuth();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showParentalModal, setShowParentalModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Custom Color States
  const [showCustomColorModal, setShowCustomColorModal] = useState(false);
  const [selectedCustomColor, setSelectedCustomColor] = useState('#E50914');
  const [customH, setCustomH] = useState(0);
  const [customS, setCustomS] = useState(100);
  const [customL, setCustomL] = useState(50);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Sync color representation when selected color changes or when modal opens
  useEffect(() => {
    const hsl = hexToHsl(selectedCustomColor);
    if (hsl) {
      setCustomH(hsl.h);
      setCustomS(hsl.s);
      setCustomL(hsl.l);
    }
  }, [selectedCustomColor]);

  const handleColorSelect = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angleDeg < 0) angleDeg += 360;
    
    const hue = Math.round((angleDeg + 90) % 360);
    setCustomH(hue);
    
    const hex = hslToHex(hue, customS, customL);
    setSelectedCustomColor(hex);
  };

  const handleLightnessChange = (newLightness: number) => {
    setCustomL(newLightness);
    const hex = hslToHex(customH, customS, newLightness);
    setSelectedCustomColor(hex);
  };

  const handleHexInputChange = (val: string) => {
    let hexVal = val.toUpperCase();
    if (!hexVal.startsWith('#') && hexVal.length > 0) {
      hexVal = '#' + hexVal;
    }
    if (hexVal.length <= 7) {
      setSelectedCustomColor(hexVal);
      const hsl = hexToHsl(hexVal);
      if (hsl) {
        setCustomH(hsl.h);
        setCustomS(hsl.s);
        setCustomL(hsl.l);
      }
    }
  };
  const { openSubscription } = useSubscription();
  const { downloadedMovies, removeDownload } = useDownloads();
  const [showSubscriptionDropdown, setShowSubscriptionDropdown] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [requiresRecentLogin, setRequiresRecentLogin] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { language, setLanguage, t, isRTL } = useLanguage();

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      if (!displayName.trim()) {
        throw new Error(isRTL ? 'الرجاء إدخال اسم صحيح' : 'Please enter a valid name');
      }
      await updateProfile(user, { displayName });
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { displayName });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.UPDATE, `users/${user.uid}`);
      }

      setUpdateSuccess(isRTL ? 'تم تحديث الاسم بنجاح' : 'Name updated successfully');
      setTimeout(() => setShowProfileModal(false), 2000);
    } catch (error: any) {
      console.error("Update error:", error);
      if (error.code === 'auth/requires-recent-login') {
        setRequiresRecentLogin(true);
        setUpdateError(isRTL ? 'يتطلب هذا الإجراء تسجيل دخول حديث. يرجى تأكيد هويتك.' : 'This action requires a recent login. Please confirm your identity.');
      } else {
        setUpdateError(error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const isGoogleOnly = user.providerData.length > 0 && 
                           user.providerData.every(p => p.providerId === 'google.com') && 
                           !user.email?.endsWith('.internal');
      if (user.email && !isGoogleOnly) {
        if (!currentPassword) {
          throw new Error(isRTL ? 'الرجاء إدخال كلمة المرور الحالية لتأكيد هويتك' : 'Please enter your current password to confirm your identity');
        }
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      if (!newPassword) {
        throw new Error(isRTL ? 'الرجاء إدخال كلمة مرور جديدة' : 'Please enter a new password');
      }
      if (newPassword !== confirmPassword) {
        throw new Error(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      }
      if (newPassword.length < 6) {
        throw new Error(isRTL ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      }
      await updatePassword(user, newPassword);

      setUpdateSuccess(isRTL ? 'تم تحديث كلمة المرور بنجاح' : 'Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setRequiresRecentLogin(false);
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (error: any) {
      console.error("Update error:", error);
      if (error.code === 'auth/requires-recent-login') {
        setRequiresRecentLogin(true);
        setUpdateError(isRTL ? 'يتطلب هذا الإجراء تسجيل دخول حديث. يرجى تأكيد هويتك.' : 'This action requires a recent login. Please confirm your identity.');
      } else {
        setUpdateError(error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReauthenticate = async () => {
    if (!user) return;
    setIsUpdating(true);
    setUpdateError('');
    try {
      const isGoogleOnly = user.providerData.length > 0 && 
                           user.providerData.every(p => p.providerId === 'google.com') && 
                           !user.email?.endsWith('.internal');
      if (isGoogleOnly) {
        await reauthenticateWithPopup(user, googleProvider);
      } else {
        if (!currentPassword) {
          throw new Error(isRTL ? 'الرجاء إدخال كلمة المرور الحالية لتأكيد هويتك' : 'Please enter your current password to confirm your identity');
        }
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      setRequiresRecentLogin(false);
      setUpdateSuccess(isRTL ? 'تم تأكيد الهوية. يمكنك الآن حفظ التغييرات.' : 'Identity confirmed. You can now save changes.');
    } catch (error: any) {
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const languages = [
    { name: 'العربية', code: 'ar', flag: '🇸🇦' },
    { name: 'English', code: 'en', flag: '🇺🇸' },
    { name: 'Français', code: 'fr', flag: '🇫🇷' },
    { name: 'Español', code: 'es', flag: '🇪🇸' },
    { name: 'Deutsch', code: 'de', flag: '🇩🇪' },
    { name: 'Türkçe', code: 'tr', flag: '🇹🇷' },
    { name: 'Русский', code: 'ru', flag: '🇷🇺' },
    { name: 'Italiano', code: 'it', flag: '🇮🇹' },
    { name: 'Português', code: 'pt', flag: '🇵🇹' },
    { name: '中文', code: 'zh', flag: '🇨🇳' },
    { name: '日本語', code: 'ja', flag: '🇯🇵' },
    { name: '한국어', code: 'ko', flag: '🇰🇷' },
  ];

  const currentLangObj = languages.find(l => l.code === language) || languages[0];

  return (
    <div className={cn("max-w-4xl mx-auto px-4 md:px-0 pt-24 pb-20 relative", isRTL ? "text-right" : "text-left")}>
      {/* Profile Name Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white italic uppercase">{isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}</h3>
                <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateDisplayName} className="p-6 space-y-4">
                {updateError && (
                  <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-xl flex flex-col gap-2 text-red-500 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{updateError}</span>
                    </div>
                    {requiresRecentLogin && (
                      <button
                        type="button"
                        onClick={handleReauthenticate}
                        className="mt-2 w-full py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-colors"
                      >
                        {isRTL ? 'تأكيد الهوية الآن' : 'Confirm Identity Now'}
                      </button>
                    )}
                  </div>
                )}
                {updateSuccess && (
                  <div className="p-3 bg-green-600/10 border border-green-600/20 rounded-xl flex items-center gap-2 text-green-500 text-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{updateSuccess}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{isRTL ? 'الاسم المعروض' : 'Display Name'}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-600 transition-colors"
                      placeholder="Your Name"
                    />
                    <Edit2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 mt-6"
                >
                  {isUpdating ? (isRTL ? 'جاري التحديث...' : 'Updating...') : (isRTL ? 'حفظ اسم الحساب' : 'Save Name')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white italic uppercase">{isRTL ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
                {updateError && (
                  <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-xl flex flex-col gap-2 text-red-500 text-sm">
                    <div className="flex items-center gap-2">
                       <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{updateError}</span>
                    </div>
                    {requiresRecentLogin && (
                      <div className="mt-2 space-y-2">
                        <button
                          type="button"
                          onClick={handleReauthenticate}
                          className="w-full py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition-colors"
                        >
                          {isRTL ? 'تأكيد الهوية الآن' : 'Confirm Identity Now'}
                        </button>
                        {typeof window !== 'undefined' && window.self !== window.top && (
                          <a
                            href={window.location.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center py-2 border border-white/10 hover:bg-white/5 text-white rounded-lg font-bold text-[11px] transition-colors"
                          >
                            {isRTL ? 'افتح في علامة تبويب جديدة لتأكيد الهوية' : 'Open in New Tab to Confirm Identity'}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {updateSuccess && (
                  <div className="p-3 bg-green-600/10 border border-green-600/20 rounded-xl flex items-center gap-2 text-green-500 text-sm">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{updateSuccess}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {user?.email && !(user.providerData.length > 0 && user.providerData.every(p => p.providerId === 'google.com') && !user.email.endsWith('.internal')) && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">{isRTL ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                      <div className="relative">
                        <input 
                          type={showCurrentPassword ? "text" : "password"} 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className={cn(
                            "w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-600 transition-colors",
                            isRTL ? "pl-12 pr-3" : "pr-12 pl-3"
                          )}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none",
                            isRTL ? "left-4" : "right-4"
                          )}
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">{isRTL ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={cn(
                          "w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-600 transition-colors",
                          isRTL ? "pl-12 pr-3" : "pr-12 pl-3"
                        )}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none",
                          isRTL ? "left-4" : "right-4"
                        )}
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={cn(
                          "w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-600 transition-colors",
                          isRTL ? "pl-12 pr-3" : "pr-12 pl-3"
                        )}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none",
                          isRTL ? "left-4" : "right-4"
                        )}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 mt-6"
                >
                  {isUpdating ? (isRTL ? 'جاري التحديث...' : 'Updating...') : (isRTL ? 'تغيير كلمة المرور' : 'Update Password')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      <AnimatePresence>
        {showLanguageModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLanguageModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white italic uppercase">{t('language')}</h3>
                <button onClick={() => setShowLanguageModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as any);
                      setShowLanguageModal(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all",
                      language === lang.code ? "bg-red-600 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-bold">{lang.name}</span>
                    </div>
                    {language === lang.code && <div className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Color Modal */}
      <AnimatePresence>
        {showCustomColorModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomColorModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden relative z-10 p-6 flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <h3 className="text-lg font-black text-white italic uppercase flex items-center gap-2">
                  <Palette className="w-5 h-5" style={{ color: selectedCustomColor }} />
                  {isRTL ? 'تخصيص لون مظهر' : 'Custom Color Wheel'}
                </h3>
                <button onClick={() => setShowCustomColorModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Dynamic Cone-gradient color wheel donut */}
              <div className="relative mb-6 flex items-center justify-center select-none">
                <div 
                  ref={wheelRef}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    handleColorSelect(e.clientX, e.clientY);
                  }}
                  onPointerMove={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                      handleColorSelect(e.clientX, e.clientY);
                    }
                  }}
                  onPointerUp={(e) => {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }}
                  className="w-56 h-56 rounded-full cursor-crosshair relative bg-[conic-gradient(from_0deg,hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))] flex items-center justify-center shadow-lg shadow-black/50"
                >
                  {/* Center preview hole (donut) */}
                  <div 
                    className="w-28 h-28 rounded-full border-[6px] border-neutral-900 shadow-inner flex flex-col items-center justify-center transition-all duration-150"
                    style={{ backgroundColor: selectedCustomColor }}
                  >
                    <span className="text-xs font-black font-mono text-white bg-black/60 px-2 py-1 rounded shadow backdrop-blur-sm border border-white/10">
                      {selectedCustomColor}
                    </span>
                  </div>

                  {/* Drag Handle Indicator */}
                  {(() => {
                    const angleDeg = (customH - 90 + 360) % 360;
                    const rad = angleDeg * (Math.PI / 180);
                    const handleX = Math.round(Math.cos(rad) * 85);
                    const handleY = Math.round(Math.sin(rad) * 85);
                    return (
                      <div 
                        className="absolute w-6 h-6 rounded-full border-4 border-white shadow-2xl pointer-events-none animate-pulse"
                        style={{ 
                          transform: `translate(${handleX}px, ${handleY}px)`,
                          backgroundColor: selectedCustomColor,
                          boxShadow: '0 0 10px rgba(255,255,255,0.7)'
                        }}
                      />
                    );
                  })()}
                </div>
              </div>

              {/* Lightness / Saturation controls */}
              <div className="w-full space-y-4 mb-6">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400 font-bold">
                    <span>{isRTL ? 'السطوع' : 'Brightness'}</span>
                    <span>{customL}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="85" 
                    value={customL} 
                    onChange={(e) => handleLightnessChange(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-lg bg-white/10 appearance-none focus:outline-none cursor-pointer"
                    style={{ accentColor: selectedCustomColor }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">{isRTL ? 'رمز اللون (HEX)' : 'Color Code (HEX)'}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={selectedCustomColor}
                      onChange={(e) => handleHexInputChange(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-white/30 text-center font-mono text-sm font-bold tracking-widest"
                      maxLength={7}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: selectedCustomColor }} />
                  </div>
                </div>
              </div>

              {/* Confirm / Cancel Actions */}
              <div className="w-full grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomColorModal(false)}
                  className="w-full bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all border border-white/10 text-sm"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSetting('accentColor', selectedCustomColor);
                    setShowCustomColorModal(false);
                  }}
                  className="w-full text-white font-black py-3 rounded-xl transition-all hover:brightness-110 active:scale-95 text-sm"
                  style={{ backgroundColor: selectedCustomColor }}
                >
                  {isRTL ? 'تأكيد' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Parental Controls Modal */}
      <AnimatePresence>
        {showParentalModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowParentalModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white italic uppercase">{t('parentalControls')}</h3>
                <button onClick={() => setShowParentalModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-center text-gray-400 text-sm">
                  {isRTL ? 'أدخل رمز PIN المكون من 4 أرقام للوصول إلى الرقابة الأبوية' : 'Enter 4-digit PIN to access parental controls'}
                </p>
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                      •
                    </div>
                  ))}
                </div>
                <button className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 transition-all">
                  {isRTL ? 'تأكيد الرمز' : 'Verify PIN'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white italic uppercase">{t('contentFilter')}</h3>
                <button onClick={() => setShowFilterModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div 
                  onClick={() => updateSetting('contentFilter', !settings.contentFilter)}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{isRTL ? 'تصفية المحتوى (+18)' : 'Content Filtering (+18)'}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                      {isRTL 
                        ? (settings.contentFilter ? 'سيتم إخفاء الأفلام والمسلسلات الإباحية' : 'سيتم عرض جميع المحتويات')
                        : (settings.contentFilter ? 'Adult content will be hidden' : 'All content will be shown')}
                    </span>
                  </div>
                  <div className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    settings.contentFilter ? "bg-red-600" : "bg-white/10"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                      settings.contentFilter ? (isRTL ? "left-1" : "right-1") : (isRTL ? "left-6" : "right-6")
                    )} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mb-12 relative z-10">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase mb-2">
          {t('settings')}
        </h1>
      </div>

      {/* Unified Settings Card */}
      <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm dark:shadow-none p-6 md:p-8 relative z-10 divide-y divide-gray-200/50 dark:divide-white/5 space-y-6 md:space-y-8">
        
        {/* 1/ Account Settings */}
        <div className="space-y-4">
          <div className={cn("flex items-start gap-3", !isRTL && "flex-row")}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{t('accountSettings')}</h3>
              <p className="text-gray-500 text-xs">{t('accountSettingsDesc')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <SettingItem 
              label={t('profile')} 
              value={user?.displayName || 'Guest'} 
              icon={User} 
              onClick={() => {
                setDisplayName(user?.displayName || '');
                setUpdateError('');
                setUpdateSuccess('');
                setRequiresRecentLogin(false);
                setShowProfileModal(true);
              }}
            />
            <SettingItem 
              label={t('changePassword')} 
              icon={Key} 
              onClick={() => {
                setNewPassword('');
                setConfirmPassword('');
                setUpdateError('');
                setUpdateSuccess('');
                setRequiresRecentLogin(false);
                setShowPasswordModal(true);
              }}
            />
          </div>
        </div>

        {/* 2/ Playback Settings */}
        <div className="pt-6 md:pt-8 first:pt-0 space-y-4">
          <div className={cn("flex items-start gap-3", !isRTL && "flex-row")}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <PlayCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{t('playbackSettings')}</h3>
              <p className="text-gray-500 text-xs">{t('playbackSettingsDesc')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <SettingItem 
              label={t('autoplay')} 
              type="toggle" 
              active={settings.autoplay} 
              onClick={() => updateSetting('autoplay', !settings.autoplay)} 
              icon={PlayCircle}
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 px-7 leading-relaxed">
              {isRTL 
                ? (settings.autoplay ? 'يتم تشغيل الحلقة التالية تلقائياً عند انتهاء الحلقة الحالية.' : 'سيتم اقتراح الحلقة التالية عند انتهاء الحلقة الحالية.')
                : (settings.autoplay ? 'Next episode will play automatically.' : 'Suggest next episode after current one ends.')}
            </p>
          </div>
        </div>

        {/* 3/ General Preferences */}
        <div className="pt-6 md:pt-8 first:pt-0 space-y-4">
          <div className={cn("flex items-start gap-3", !isRTL && "flex-row")}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{t('preferences')}</h3>
              <p className="text-gray-500 text-xs">{t('preferencesDesc')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <SettingItem 
              label={t('language')} 
              value={`${currentLangObj.flag} ${currentLangObj.name}`} 
              icon={Globe} 
              onClick={() => setShowLanguageModal(true)}
            />
          </div>
        </div>

        {/* 4/ Custom Theme */}
        <div className="pt-6 md:pt-8 first:pt-0 space-y-4">
          <div className={cn("flex items-start gap-3", !isRTL && "flex-row")}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{isRTL ? 'تخصيص المظهر' : 'Custom Theme'}</h3>
              <p className="text-gray-500 text-xs">{isRTL ? 'اختر لون التطبيق المفضل لديك' : 'Personalize your interface with a custom accent color'}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {[
                { id: 'red', name: isRTL ? 'أحمر كلاسيكي' : 'Classic Red', color: '#E50914' },
                { id: 'blue', name: isRTL ? 'أزرق كهربائي' : 'Electric Blue', color: '#3B82F6' },
                { id: 'purple', name: isRTL ? 'أرجواني نابض' : 'Vibrant Purple', color: '#8B5CF6' },
                { id: 'emerald', name: isRTL ? 'أخضر زمردي' : 'Emerald Green', color: '#10B981' },
                { id: 'orange', name: isRTL ? 'برتقالي غروب' : 'Sunset Orange', color: '#F59E0B' },
                { id: 'pink', name: isRTL ? 'وردي نيون' : 'Neon Pink', color: '#EC4899' },
                { id: 'cyan', name: isRTL ? 'سماوي' : 'Cyan Sky', color: '#06B6D4' },
                { id: 'gold', name: isRTL ? 'ذهبي' : 'Pure Gold', color: '#D4AF37' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateSetting('accentColor', theme.color)}
                  className={cn(
                    "aspect-square rounded-full border-2 transition-all flex items-center justify-center relative overflow-hidden group",
                    settings.accentColor === theme.color 
                      ? "border-white scale-110 shadow-lg shadow-white/20" 
                      : "border-transparent hover:border-white/20 hover:scale-105"
                  )}
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                >
                  <AnimatePresence>
                    {settings.accentColor === theme.color && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="bg-black/20 w-full h-full flex items-center justify-center backdrop-blur-[2px]"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}

              {/* Custom Color Button */}
              {(() => {
                const PRESET_COLORS = ['#E50914', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#D4AF37'];
                const isCustomColorActive = !PRESET_COLORS.includes(settings.accentColor);
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomColor(isCustomColorActive ? settings.accentColor : '#E50914');
                      setShowCustomColorModal(true);
                    }}
                    className={cn(
                      "aspect-square rounded-full border-2 transition-all flex items-center justify-center relative overflow-hidden group",
                      isCustomColorActive
                        ? "border-white scale-110 shadow-lg shadow-white/20"
                        : "border-transparent hover:border-white/20 hover:scale-105"
                    )}
                    style={isCustomColorActive ? { backgroundColor: settings.accentColor } : {}}
                    title={isRTL ? 'لون مخصص' : 'Custom Color'}
                  >
                    {!isCustomColorActive ? (
                      <div className="absolute inset-0 bg-[conic-gradient(from_0deg,red,yellow,lime,aqua,blue,magenta,red)] flex items-center justify-center">
                        <div className="bg-black/40 rounded-full p-1 border border-white/20 backdrop-blur-[1px]">
                          <Plus className="w-5 h-5 text-white stroke-[3px]" />
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/20 w-full h-full flex items-center justify-center backdrop-blur-[2px]"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </button>
                );
              })()}
            </div>

            <div className={cn("flex justify-center", isRTL && "flex-row-reverse")}>
              <button
                onClick={() => updateSetting('accentColor', DEFAULT_ACCENT_COLOR)}
                disabled={settings.accentColor === DEFAULT_ACCENT_COLOR}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                  settings.accentColor === DEFAULT_ACCENT_COLOR
                    ? "bg-white/5 text-gray-500 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20 active:scale-95"
                )}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isRTL ? 'استعادة اللون الأصلي' : 'Restore Original'}
              </button>
            </div>
          </div>
        </div>

        {/* 5/ Content Settings */}
        <div className="pt-6 md:pt-8 first:pt-0 space-y-4">
          <div className={cn("flex items-start gap-3", !isRTL && "flex-row")}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{t('contentSettings')}</h3>
              <p className="text-gray-500 text-xs">{t('contentSettingsDesc')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <SettingItem 
              label={t('contentFilter')} 
              value={settings.contentFilter ? t('enabled') : t('disabled')} 
              icon={Shield} 
              onClick={() => setShowFilterModal(true)}
            />
          </div>
        </div>

        {/* 6/ Support & Privacy */}
        <div className="pt-6 md:pt-8 first:pt-0 space-y-4">
          <div className={cn("flex items-start gap-3", !isRTL && "flex-row")}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{t('supportPrivacy')}</h3>
              <p className="text-gray-500 text-xs">{t('supportPrivacyDesc')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <SettingItem label={t('privacyPolicy')} icon={Shield} />
            <SettingItem label={t('about')} value="v2.4.0" icon={Info} />
          </div>
        </div>

      </div>


    </div>
  );
}
