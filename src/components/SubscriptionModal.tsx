import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Zap, CircleDollarSign, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';
import { cn } from '../lib/utils';

export default function SubscriptionModal() {
  const { t, isRTL } = useLanguage();
  const { isSubscriptionOpen, closeSubscription } = useSubscription();

  return (
    <AnimatePresence>
      {isSubscriptionOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSubscription}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden relative z-10"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-black text-white italic uppercase">{t('subscriptionPlan')}</h3>
              <button onClick={closeSubscription} className="text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { id: 'visa', name: 'Visa Card', nameAr: 'بطاقة فيزا', icon: CreditCard, color: 'blue' },
                { id: 'binance', name: 'Binance Pay', nameAr: 'بينانس بلاي', icon: Zap, color: 'yellow' },
                { id: 'paypal', name: 'PayPal', nameAr: 'بايبال', icon: CircleDollarSign, color: 'blue' },
              ].map((method) => (
                <button
                  key={method.id}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group",
                    isRTL && "flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-lg",
                    method.id === 'visa' && "bg-blue-600/20 text-blue-500 group-hover:bg-blue-600 group-hover:text-white",
                    method.id === 'binance' && "bg-yellow-600/20 text-yellow-500 group-hover:bg-yellow-600 group-hover:text-black",
                    method.id === 'paypal' && "bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white"
                  )}>
                    <method.icon className="w-6 h-6" />
                  </div>
                  <div className={cn("flex-1", isRTL ? "text-right" : "text-left")}>
                    <span className="text-white font-black uppercase italic tracking-tight block">
                      {isRTL ? method.nameAr : method.name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                      {isRTL ? 'معلومات الدفع قريباً' : 'Payment info coming soon'}
                    </span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 text-gray-700 group-hover:text-white", isRTL && "rotate-180")} />
                </button>
              ))}
            </div>
            <div className="p-4 bg-primary/5 mt-2">
              <p className="text-[10px] text-gray-500 text-center uppercase font-bold tracking-widest">
                {isRTL ? 'إدارة اشتراكك والمدفوعات بأمان' : 'Manage your subscription and payments securely'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
