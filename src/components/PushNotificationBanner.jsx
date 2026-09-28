import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, X, Download, Share } from 'lucide-react';
import { subscribeToPushNotifications, getPushSubscription } from '../utils/webPush';
import { audioManager } from '../utils/audio';

export default function PushNotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isStandaloneMode);

    const ua = window.navigator.userAgent;
    const isIosDevice = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
    setIsIos(isIosDevice);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    checkPushStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const checkPushStatus = async () => {
    const dismissed = sessionStorage.getItem('push_banner_dismissed');
    if (dismissed) return;

    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        setIsVisible(true);
        return;
      }
    }

    const sub = await getPushSubscription();
    if (!sub && Notification?.permission !== 'denied') {
      setIsVisible(true);
    }
  };

  const handleEnablePush = async () => {
    audioManager.triggerHaptic([20]);
    setIsSubscribing(true);
    try {
      await subscribeToPushNotifications();
      setIsVisible(false);
    } catch (e) {
      console.warn('Banner subscribe error:', e);
      setIsVisible(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      audioManager.triggerHaptic([15]);
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('push_banner_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible && !installPrompt) return null;

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-2">
      {/* PWA install prompt button if available */}
      {installPrompt && (
        <div className="mb-2 p-3 rounded-2xl bg-[#EFEAFE]/85 dark:bg-gradient-to-r dark:from-purple-950/50 dark:to-indigo-950/40 border border-[#C9BDF8] dark:border-purple-500/30 backdrop-blur-md flex items-center justify-between shadow-lg shadow-[#7C6CF0]/10">
          <div className="flex items-center gap-2 text-xs text-[#6A5BF5] dark:text-purple-200">
            <Download className="w-4 h-4 text-[#7C6CF0] dark:text-[#A78BFA]" />
            <span>Установите приложение на телефон для лучшего опыта</span>
          </div>
          <button
            onClick={handleInstallApp}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8B7CF6] to-[#6A5BF5] hover:opacity-95 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,108,240,0.35)] active:scale-95 transition-all"
          >
            Установить
          </button>
        </div>
      )}

      {/* Push notification enable banner */}
      {isVisible && (
        <div className="p-3.5 rounded-2xl bg-white/85 dark:bg-zinc-900/95 backdrop-blur-xl border border-[#C9BDF8]/70 dark:border-zinc-700/60 shadow-xl shadow-[#7C6CF0]/10 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#EFEAFE] dark:bg-purple-500/10 text-[#6A5BF5] dark:text-[#A78BFA] border border-[#C9BDF8] dark:border-purple-500/20 flex-shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                Получайте аффирмации вовремя
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                Включите пуши для работы персонального графика
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleEnablePush}
              disabled={isSubscribing}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8B7CF6] to-[#6A5BF5] text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,108,240,0.35)] active:scale-95 transition-all"
            >
              {isSubscribing ? '...' : 'Включить'}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
