import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Smartphone, 
  Sparkles, 
  ChevronRight, 
  Share, 
  HelpCircle,
  PlayCircle
} from 'lucide-react';
import { subscribeToPushNotifications, unsubscribeFromPush, sendTestPush, getPushSubscription } from '../utils/webPush';
import { audioManager } from '../utils/audio';

export default function ScheduleHub({ 
  affirmations, 
  onOpenScheduleModal, 
  onUpdateAffirmation 
}) {
  const [hasPushSub, setHasPushSub] = useState(false);
  const [permissionState, setPermissionState] = useState(Notification?.permission || 'default');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
    const sub = await getPushSubscription();
    setHasPushSub(!!sub);
  };

  const handleToggleSubscription = async () => {
    audioManager.triggerHaptic([20]);
    setIsSubscribing(true);
    setTestResult(null);

    try {
      if (hasPushSub) {
        await unsubscribeFromPush();
        setHasPushSub(false);
        setTestResult({ success: true, message: 'Уведомления отключены' });
      } else {
        await subscribeToPushNotifications();
        setHasPushSub(true);
        setPermissionState('granted');
        setTestResult({ success: true, message: '🎉 Web Push успешно подключены к вашему телефону!' });
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setTestResult({ success: false, message: err.message || 'Ошибка подключения уведомлений' });
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleQuickTest = async () => {
    audioManager.triggerHaptic([20]);
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendTestPush();
      setTestResult({ success: true, message: res.message || '✨ Тестовое уведомление доставлено!' });
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Ошибка отправки тестового уведомления' });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handleToggleSchedule = (aff) => {
    audioManager.triggerHaptic([15]);
    const updated = {
      ...aff,
      schedule: {
        ...aff.schedule,
        enabled: !aff.schedule?.enabled
      }
    };
    onUpdateAffirmation(updated);
  };

  const scheduledAffirmations = affirmations.filter(a => a.schedule && a.schedule.enabled);

  // Collect upcoming timeline slots for today
  const timelineSlots = [];
  affirmations.forEach(aff => {
    if (aff.schedule && aff.schedule.enabled && aff.schedule.times) {
      aff.schedule.times.forEach(time => {
        timelineSlots.push({
          time,
          affirmation: aff
        });
      });
    }
  });
  timelineSlots.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-3 space-y-5 pb-24 text-slate-900 dark:text-zinc-100">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#7C6CF0] dark:text-[#A78BFA]" />
          <span>Уведомления и график</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Настройте время и дни получения пушей на телефон
        </p>
      </div>

      {/* Push System Status Card */}
      <div className="p-5 rounded-[28px] bg-white/80 dark:bg-zinc-900/80 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              hasPushSub
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                  {hasPushSub ? 'Пуш-уведомления активны' : 'Уведомления на телефон'}
                </h3>
                {hasPushSub && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    В сети
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {hasPushSub
                  ? 'Устройство готово получать аффирмации по расписанию'
                  : 'Включите пуши, чтобы не пропускать важные напоминания'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons inside Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleToggleSubscription}
            disabled={isSubscribing}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-semibold transition-all active:scale-95 ${
              hasPushSub
                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                : 'bg-gradient-to-r from-[#8B7CF6] to-[#6A5BF5] text-white shadow-md shadow-[#7C6CF0]/25'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{isSubscribing ? 'Подключение...' : (hasPushSub ? 'Отключить пуши' : 'Включить пуш-уведомления')}</span>
          </button>

          <button
            onClick={handleQuickTest}
            disabled={isSendingTest}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/80 dark:bg-zinc-800/80 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-all active:scale-95 shadow-sm"
          >
            <Send className={`w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA] ${isSendingTest ? 'animate-bounce' : ''}`} />
            <span>{isSendingTest ? 'Отправка...' : 'Тестовый пуш'}</span>
          </button>
        </div>

        {/* Result Message banner */}
        {testResult && (
          <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
            testResult.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* iOS Notice & Help */}
        <button
          onClick={() => setShowIosGuide(!showIosGuide)}
          className="w-full flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 text-[11px] text-slate-500 dark:text-zinc-400 transition-colors text-left py-1"
        >
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            Инструкция для iPhone (iOS 16.4+) и Android
          </span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showIosGuide ? 'rotate-90' : ''}`} />
        </button>

        {showIosGuide && (
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-950/60 text-xs text-slate-700 dark:text-zinc-300 space-y-2 animate-in fade-in">
            <p className="font-semibold text-slate-800 dark:text-zinc-200">📱 Как получать уведомления на iPhone / iPad:</p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
              <li>В Safari нажмите кнопку <strong>«Поделиться»</strong> <Share className="w-3 h-3 inline" /> внизу экрана.</li>
              <li>Выберите пункт <strong>«На экран Домой»</strong> (Add to Home Screen).</li>
              <li>Откройте приложение с главного экрана и нажмите «Включить пуш-уведомления».</li>
            </ol>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
              🤖 На <strong>Android</strong> пуши работают сразу в Chrome, Edge и при установке приложения.
            </p>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#7C6CF0] dark:text-[#A78BFA]" />
            График доставок на сегодня ({timelineSlots.length})
          </h3>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            Активно: {scheduledAffirmations.length}
          </span>
        </div>

        {timelineSlots.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-zinc-900/40 text-center space-y-2">
            <BellOff className="w-8 h-8 text-slate-400 dark:text-zinc-600 mx-auto" />
            <p className="text-slate-600 dark:text-zinc-400 text-sm font-medium">Нет активных графиков</p>
            <p className="text-slate-400 dark:text-zinc-600 text-xs max-w-xs mx-auto">
              Включите график для любой аффирмации ниже, чтобы настроить индивидуальное расписание
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {timelineSlots.map((slot, idx) => (
              <div
                key={`${slot.affirmation.id}-${slot.time}-${idx}`}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/70 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="px-3 py-1.5 rounded-xl bg-[#EFEAFE] dark:bg-zinc-800 text-xs font-bold text-[#6A5BF5] dark:text-[#C4B5FD] flex-shrink-0">
                    {slot.time}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 uppercase font-semibold">
                      {slot.affirmation.category || 'Гармония'}
                    </span>
                    <p className="text-xs text-slate-800 dark:text-zinc-200 mt-1 line-clamp-1">
                      «{slot.affirmation.text}»
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenScheduleModal(slot.affirmation)}
                  className="p-2.5 rounded-full text-slate-400 dark:text-zinc-400 active:bg-slate-100 dark:active:bg-zinc-800 transition-colors flex-shrink-0"
                  title="Изменить график"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Affirmations Schedule Configuration List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#7C6CF0] dark:text-[#A78BFA]" />
          Индивидуальная настройка каждой аффирмации
        </h3>

        <div className="space-y-2">
          {affirmations.map((aff) => {
            const isEnabled = aff.schedule?.enabled;

            return (
              <div
                key={aff.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 transition-all shadow-sm"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                  {/* Quick Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={!!isEnabled}
                      onChange={() => handleToggleSchedule(aff)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7C6CF0] peer-checked:after:bg-white"></div>
                  </label>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-800 dark:text-zinc-200 line-clamp-1 font-medium">
                      «{aff.text}»
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500">
                        {aff.category}
                      </span>
                      {isEnabled && (
                        <span className="text-[10px] text-[#6A5BF5] dark:text-[#A78BFA] font-medium">
                          • {aff.schedule.times?.join(', ')} ({aff.schedule.days?.length === 7 ? 'Ежедневно' : `${aff.schedule.days?.length} дн.`})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Schedule Button */}
                <button
                  onClick={() => onOpenScheduleModal(aff)}
                  className="flex items-center justify-center p-2.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 transition-colors flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
