import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Send, 
  Check, 
  AlertCircle, 
  Sparkles, 
  X,
  Volume2,
  Vibrate
} from 'lucide-react';
import { sendTestPush } from '../utils/webPush';
import { audioManager } from '../utils/audio';

const DAY_LABELS = [
  { id: 1, label: 'Пн', name: 'Понедельник' },
  { id: 2, label: 'Вт', name: 'Вторник' },
  { id: 3, label: 'Ср', name: 'Среда' },
  { id: 4, label: 'Чт', name: 'Четверг' },
  { id: 5, label: 'Пт', name: 'Пятница' },
  { id: 6, label: 'Сб', name: 'Суббота' },
  { id: 7, label: 'Вс', name: 'Воскресенье' }
];

const TIME_PRESETS = [
  { label: '🌅 Утро', time: '08:00' },
  { label: '☀️ Полдень', time: '13:00' },
  { label: '🌇 Вечер', time: '19:30' },
  { label: '🌙 Ночь', time: '22:00' }
];

export default function ScheduleModal({ affirmation, isOpen, onClose, onSave }) {
  if (!isOpen || !affirmation) return null;

  const currentSchedule = affirmation.schedule || {};
  
  const [enabled, setEnabled] = useState(currentSchedule.enabled ?? false);
  const [times, setTimes] = useState(currentSchedule.times?.length ? [...currentSchedule.times] : ['09:00']);
  const [days, setDays] = useState(currentSchedule.days?.length ? [...currentSchedule.days] : [1, 2, 3, 4, 5, 6, 7]);
  const [vibrate, setVibrate] = useState(currentSchedule.vibrate ?? true);
  const [sound, setSound] = useState(currentSchedule.sound ?? true);
  const [newTimeInput, setNewTimeInput] = useState('12:00');
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleToggleDay = (dayId) => {
    audioManager.triggerHaptic([10]);
    if (days.includes(dayId)) {
      if (days.length > 1) {
        setDays(days.filter(d => d !== dayId));
      }
    } else {
      setDays([...days, dayId].sort((a, b) => a - b));
    }
  };

  const handleSetPresetDays = (type) => {
    audioManager.triggerHaptic([15]);
    if (type === 'all') setDays([1, 2, 3, 4, 5, 6, 7]);
    if (type === 'weekdays') setDays([1, 2, 3, 4, 5]);
    if (type === 'weekends') setDays([6, 7]);
  };

  const handleAddTime = (timeToAdd) => {
    const t = timeToAdd || newTimeInput;
    if (!t) return;
    if (!times.includes(t)) {
      audioManager.triggerHaptic([10]);
      setTimes([...times, t].sort());
    }
  };

  const handleRemoveTime = (timeToRemove) => {
    audioManager.triggerHaptic([10]);
    if (times.length > 1) {
      setTimes(times.filter(t => t !== timeToRemove));
    }
  };

  const handleSave = () => {
    audioManager.triggerHaptic([20]);
    onSave({
      ...affirmation,
      schedule: {
        enabled,
        times,
        days,
        vibrate,
        sound,
        mode: 'specific'
      }
    });
    onClose();
  };

  const handleTestNotification = async () => {
    audioManager.triggerHaptic([25]);
    setIsTestingPush(true);
    setTestResult(null);

    try {
      const res = await sendTestPush(affirmation);
      setTestResult({ success: true, message: res.message || 'Пуш-уведомление отправлено на ваше устройство!' });
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Не удалось отправить уведомление' });
    } finally {
      setIsTestingPush(false);
      setTimeout(() => setTestResult(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white/95 dark:bg-zinc-900 backdrop-blur-xl rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-black/10 flex flex-col max-h-[92vh] text-slate-900 dark:text-zinc-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between bg-[#F7F5FE]/80 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-[#EFEAFE] dark:bg-purple-500/10 text-[#6A5BF5] dark:text-[#A78BFA] flex-shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-base">График уведомлений</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                {affirmation.text}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full active:bg-slate-100 dark:active:bg-zinc-800 text-slate-400 dark:text-zinc-400 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto custom-scroll">
          {/* Enable Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 dark:bg-zinc-800/40">
            <div>
              <span className="text-sm font-medium text-slate-800 dark:text-zinc-200 block">Включить пуш-напоминания</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 block mt-0.5">
                Получать эту аффирмацию по расписанию
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => {
                  audioManager.triggerHaptic([15]);
                  setEnabled(e.target.checked);
                }} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C6CF0]"></div>
            </label>
          </div>

          {enabled && (
            <>
              {/* Times Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA]" />
                    Время доставки ({times.length})
                  </label>
                </div>

                {/* Times Chips */}
                <div className="flex flex-wrap gap-2">
                  {times.map((time) => (
                    <div
                      key={time}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFEAFE] dark:bg-zinc-800 border border-[#C9BDF8] dark:border-zinc-700 text-sm font-semibold text-[#6A5BF5] dark:text-zinc-200 shadow-sm shadow-[#7C6CF0]/10"
                    >
                      <span>{time}</span>
                      {times.length > 1 && (
                        <button
                          onClick={() => handleRemoveTime(time)}
                          className="text-slate-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Time Controls */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="time"
                    value={newTimeInput}
                    onChange={(e) => setNewTimeInput(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-200 text-sm focus:outline-none focus:border-[#7C6CF0]"
                  />
                  <button
                    onClick={() => handleAddTime(newTimeInput)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#EFEAFE] dark:bg-zinc-800 hover:bg-[#E6DEFD] dark:hover:bg-zinc-700 border border-[#C9BDF8] dark:border-zinc-700 text-xs font-medium text-[#6A5BF5] dark:text-zinc-200 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-[#7C6CF0] dark:text-[#A78BFA]" />
                    Добавить
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {TIME_PRESETS.map((p) => (
                    <button
                      key={p.time}
                      onClick={() => handleAddTime(p.time)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/85 dark:bg-zinc-800/60 hover:bg-[#EFEAFE] dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-[#6A5BF5] dark:hover:text-zinc-200 transition-colors"
                    >
                      + {p.label} ({p.time})
                    </button>
                  ))}
                </div>
              </div>

              {/* Days of Week Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA]" />
                  Дни недели
                </label>

                {/* Day selector circles */}
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_LABELS.map((d) => {
                    const isSelected = days.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => handleToggleDay(d.id)}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[#7C6CF0] text-white shadow-md shadow-[#7C6CF0]/30 border border-[#8B7CF6]/60 scale-105'
                            : 'bg-white/85 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                {/* Day Presets */}
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => handleSetPresetDays('all')}
                    className="px-2.5 py-1 rounded-lg bg-white/85 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:text-[#6A5BF5] dark:hover:text-zinc-200"
                  >
                    Каждый день
                  </button>
                  <button
                    onClick={() => handleSetPresetDays('weekdays')}
                    className="px-2.5 py-1 rounded-lg bg-white/85 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:text-[#6A5BF5] dark:hover:text-zinc-200"
                  >
                    Будни (Пн-Пт)
                  </button>
                  <button
                    onClick={() => handleSetPresetDays('weekends')}
                    className="px-2.5 py-1 rounded-lg bg-white/85 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:text-[#6A5BF5] dark:hover:text-zinc-200"
                  >
                    Выходные
                  </button>
                </div>
              </div>

              {/* Vibration & Sound Settings */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVibrate(!vibrate)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    vibrate 
                      ? 'bg-[#EFEAFE] dark:bg-zinc-800 border-[#C9BDF8] dark:border-zinc-600 text-[#6A5BF5] dark:text-[#C4B5FD]' 
                      : 'bg-white/85 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500'
                  }`}
                >
                  <Vibrate className="w-4 h-4" />
                  <span>Вибрация: {vibrate ? 'Вкл' : 'Выкл'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSound(!sound)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    sound 
                      ? 'bg-[#EFEAFE] dark:bg-zinc-800 border-[#C9BDF8] dark:border-zinc-600 text-[#6A5BF5] dark:text-[#C4B5FD]' 
                      : 'bg-white/85 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Звук: {sound ? 'Вкл' : 'Выкл'}</span>
                </button>
              </div>

              {/* Instant Test Push Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={isTestingPush}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white/85 dark:bg-zinc-800/80 hover:bg-[#EFEAFE] dark:hover:bg-zinc-700/80 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-all active:scale-98 shadow-sm"
                >
                  <Send className={`w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA] ${isTestingPush ? 'animate-bounce' : ''}`} />
                  <span>{isTestingPush ? 'Отправка...' : 'Отправить тестовый пуш сейчас'}</span>
                </button>

                {testResult && (
                  <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                    testResult.success 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
                  }`}>
                    {testResult.success ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#F7F5FE]/90 dark:bg-zinc-950/60 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-sm font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#8B7CF6] to-[#6A5BF5] hover:opacity-95 text-white text-sm font-semibold shadow-[0_10px_24px_rgba(124,108,240,0.38)] transition-all active:scale-98"
          >
            Сохранить график
          </button>
        </div>
      </div>
    </div>
  );
}
