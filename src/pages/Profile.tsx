import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { logout, signInWithGoogle } from '../lib/firebase';
import { LogOut, User as UserIcon, Mail, Calendar, Shield, ExternalLink, Lock, UserPlus, LogIn, ChevronRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const Profile: React.FC = () => {
  const { user, userData, signIn, signUp } = useAuth();
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form stats
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isRegistering) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error(isRTL ? 'كلمات السر غير متطابقة' : 'Passwords do not match');
        }
        if (formData.username.length < 3) {
          throw new Error(isRTL ? 'اسم المستخدم قصير جداً' : 'Username is too short');
        }
        await signUp(formData.fullName, formData.username, formData.email || null, formData.password);
        showToast(isRTL ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully', 'success');
      } else {
        await signIn(formData.username, formData.password);
        showToast(isRTL ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully', 'success');
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-32 px-4 md:px-12 min-h-screen bg-[#070b19] relative flex flex-col items-center justify-center">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10 rotate-3 transform group-hover:rotate-0 transition-transform">
              {isRegistering ? <UserPlus className="w-10 h-10 text-primary" /> : <Shield className="w-10 h-10 text-primary" />}
            </div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
              {isRegistering 
                ? (isRTL ? 'إنشاء حساب جديد' : 'Create Account') 
                : (isRTL ? 'مرحباً بعودتك' : 'Welcome Back')}
            </h1>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
              {isRegistering 
                ? (isRTL ? 'انضم إلى مجتمع فلك بلاي' : 'Join the FalakPlay community') 
                : (isRTL ? 'سجل دخولك لمتابعة المشاهدة' : 'Sign in to continue watching')}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-4 bg-white/5 p-6 rounded-[32px] border border-white/10 shadow-2xl backdrop-blur-xl">
              {isRegistering && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">
                    {isRTL ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                      className="w-full bg-white/5 border border-white/5 focus:border-primary/50 text-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-gray-700 font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">
                  {isRTL ? 'اسم المستخدم' : 'Username'}
                </label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                    placeholder={isRTL ? 'اسم_المستخدم' : 'username'}
                    className="w-full bg-white/5 border border-white/5 focus:border-primary/50 text-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-gray-700 font-bold"
                  />
                </div>
              </div>

              {isRegistering && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">
                    {isRTL ? 'الايميل (اختياري)' : 'Email (Optional)'}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="example@email.com"
                      className="w-full bg-white/5 border border-white/5 focus:border-primary/50 text-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-gray-700 font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">
                  {isRTL ? 'كلمة السر' : 'Password'}
                </label>
                <div className="relative group">
                  <Lock className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors",
                    isRTL ? "right-4" : "left-4"
                  )} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className={cn(
                      "w-full bg-white/5 border border-white/5 focus:border-primary/50 text-white rounded-2xl py-4 outline-none transition-all placeholder:text-gray-700 font-bold",
                      isRTL ? "pr-12 pl-12 text-right" : "pl-12 pr-12 text-left"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors",
                      isRTL ? "left-4" : "right-4"
                    )}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">
                    {isRTL ? 'تأكيد كلمة السر' : 'Confirm Password'}
                  </label>
                  <div className="relative group">
                    <Lock className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors",
                      isRTL ? "right-4" : "left-4"
                    )} />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="••••••••"
                      className={cn(
                        "w-full bg-white/5 border border-white/5 focus:border-primary/50 text-white rounded-2xl py-4 outline-none transition-all placeholder:text-gray-700 font-bold",
                        isRTL ? "pr-12 pl-12 text-right" : "pl-12 pr-12 text-left",
                        formData.confirmPassword && formData.password !== formData.confirmPassword && "border-primary/50"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors",
                        isRTL ? "left-4" : "right-4"
                      )}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className={cn(
                      "text-[10px] text-primary font-black uppercase tracking-widest mt-1 flex items-center gap-1",
                      isRTL ? "mr-2" : "ml-2"
                    )}>
                      <AlertCircle className="w-3 h-3" />
                      {isRTL ? 'كلمة السر غير متطابقة' : 'Passwords do not match'}
                    </p>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                    {isRegistering 
                      ? (isRTL ? 'إنشاء حساب' : 'Create Account') 
                      : (isRTL ? 'تسجيل الدخول' : 'Sign In')}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 group"
            >
              {isRegistering 
                ? (isRTL ? 'لديك حساب بالفعل؟ سجل دخولك' : 'Already have an account? Sign In')
                : (isRTL ? 'ليس لديك حساب؟ انضم إلينا' : "Don't have an account? Join Us")}
              <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", isRTL && "rotate-180 group-hover:-translate-x-1")} />
            </button>

            <div className="flex items-center gap-4 w-full max-w-[200px]">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{isRTL ? 'أو' : 'OR'}</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            <button
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (error: any) {
                  if (error.code !== 'auth/popup-closed-by-user') {
                    showToast(error.message, 'error');
                  }
                }
              }}
              className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-95 border border-white/5"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 grayscale opacity-50" />
              <span className="text-xs uppercase tracking-widest">{isRTL ? 'تسجيل جوجل' : 'Google Auth'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 px-4 md:px-12 pb-20 relative min-h-screen bg-[#070b19] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-primary-dark rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=0D8ABC&color=fff`} 
              alt={user.displayName || 'User'} 
              className="w-32 h-32 rounded-full border-4 border-white/10 relative z-10"
            />
          </div>
          <div className="text-center md:text-right flex-1">
            <h1 className="text-4xl font-black text-white italic mb-2 tracking-tighter">
              {userData?.displayName || user.displayName}
            </h1>
            <div className="flex flex-col md:items-end gap-1">
              <p className="text-primary font-black uppercase tracking-[0.2em] text-xs">
                @{userData?.username || user.email?.split('@')[0] || 'user'}
              </p>
              {user.email && !user.email.endsWith('@cinestream.internal') && (
                <p className="text-gray-500 flex items-center justify-center md:justify-end gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold rounded-xl flex items-center gap-2 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            {isRTL ? 'تسجيل الخروج' : 'Log Out'}
          </button>
        </div>

        <div className="flex justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-white/5 border border-white/10 rounded-3xl w-full max-w-xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-black text-white italic">
                {isRTL ? 'معلومات الحساب' : 'Account Info'}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-gray-500">{isRTL ? 'رقم الحساب' : 'Account ID'}</span>
                <span className="text-gray-300 font-mono text-sm">{userData?.accountNumber || '...'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-gray-500">{isRTL ? 'تاريخ الانضمام' : 'Joined'}</span>
                <span className="text-gray-300">{new Date(user.metadata.creationTime || '').toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-gray-500">{isRTL ? 'الحالة' : 'Status'}</span>
                <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-black uppercase tracking-widest rounded-full">
                  {isRTL ? 'نشط' : 'Active'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
