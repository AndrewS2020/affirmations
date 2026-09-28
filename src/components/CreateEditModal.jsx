import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Palette, 
  Type, 
  Bell, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2,
  FolderHeart
} from 'lucide-react';
import { THEMES, FONTS, CATEGORIES, getTheme } from '../utils/themes';
import { audioManager } from '../utils/audio';

const TEMPLATES = [
  "Я достоин всего самого лучшего и с благодарностью принимаю изобилие Вселенной.",
  "В моём сердце царят мир, гармония и глубокая любовь.",
  "Я уверен в себе, своих талантах и с лёгкостью преодолеваю любые препятствия.",
  "Моё тело здорово, полно сил и восстанавливается с каждым мгновением.",
  "Каждый новый день открывает передо мной радостные перспективы."
];

export default function CreateEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialAffirmation = null 
}) {
  if (!isOpen) return null;

  const isEditing = !!initialAffirmation;

  const [text, setText] = useState('');
  const [category, setCategory] = useState('Спокойствие');
  const [themeId, setThemeId] = useState('ocean');
  const [fontId, setFontId] = useState('serif');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [times, setTimes] = useState(['09:00']);
  const [days, setDays] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [newTime, setNewTime] = useState('18:00');

  useEffect(() => {
    if (initialAffirmation) {
      setText(initialAffirmation.text || '');
      setCategory(initialAffirmation.category || 'Спокойствие');
      setThemeId(initialAffirmation.theme || 'ocean');
      setFontId(initialAffirmation.font || 'serif');
      setScheduleEnabled(initialAffirmation.schedule?.enabled ?? false);
      setTimes(initialAffirmation.schedule?.times?.length ? initialAffirmation.schedule.times : ['09:00']);
      setDays(initialAffirmation.schedule?.days?.length ? initialAffirmation.schedule.days : [1, 2, 3, 4, 5, 6, 7]);
    } else {
      setText('');
      setCategory('Спокойствие');
      setThemeId('ocean');
      setFontId('serif');
      setScheduleEnabled(false);
      setTimes(['09:00']);
      setDays([1, 2, 3, 4, 5, 6, 7]);
    }
  }, [initialAffirmation, isOpen]);

  const handleAddTime = () => {
    if (newTime && !times.includes(newTime)) {
      setTimes([...times, newTime].sort());
    }
  };

  const handleRemoveTime = (t) => {
    if (times.length > 1) {
      setTimes(times.filter(item => item !== t));
    }
  };

  const handleUseTemplate = (tmpl) => {
    audioManager.triggerHaptic([10]);
    setText(tmpl);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    audioManager.triggerHaptic([20]);
    onSave({
      id: initialAffirmation?.id,
      text: text.trim(),
      category,
      theme: themeId,
      font: fontId,
      isFavorite: initialAffirmation?.isFavorite ?? false,
      schedule: {
        enabled: scheduleEnabled,
        times,
        days,
        mode: 'specific',
        vibrate: true,
        sound: true
      }
    });
    onClose();
  };

  const activeTheme = getTheme(themeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white/95 dark:bg-zinc-900 backdrop-blur-xl border border-[#DDD6F9] dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-[#7C6CF0]/10 flex flex-col max-h-[90vh] text-slate-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#DDD6F9]/80 dark:border-zinc-800 flex items-center justify-between bg-[#F7F5FE]/90 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#EFEAFE] dark:bg-purple-500/10 text-[#6A5BF5] dark:text-[#A78BFA] border border-[#C9BDF8] dark:border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-base">
                {isEditing ? 'Редактировать аффирмацию' : 'Новая аффирмация'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Создайте вашу личную вдохновляющую фразу
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto custom-scroll">
          {/* Affirmation Text Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Текст аффирмации
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Например: Я полон энергии, любви и спокойствия..."
              rows={3}
              required
              className="w-full p-4 bg-white/80 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700/80 rounded-2xl text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#7C6CF0] text-sm sm:text-base leading-relaxed resize-none shadow-sm"
            />
          </div>

          {/* Quick Inspirations / Templates */}
          {!isEditing && (
            <div className="space-y-2">
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block">
                Или выберите готовую идею:
              </span>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {TEMPLATES.map((tmpl, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleUseTemplate(tmpl)}
                    className="text-left text-xs p-2.5 rounded-xl bg-white/85 dark:bg-zinc-800/60 hover:bg-[#EFEAFE] dark:hover:bg-zinc-800 border border-[#DDD6F9] dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 min-w-[200px] max-w-[240px] flex-shrink-0 transition-colors line-clamp-2"
                  >
                    «{tmpl}»
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Mini Preview */}
          {text.trim() && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Предпросмотр карточки
              </span>
              <div className={`p-5 rounded-2xl border transition-all ${activeTheme.cardGradient} ${activeTheme.border} ${activeTheme.glow}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${activeTheme.badge}`}>
                    {category}
                  </span>
                </div>
                <p className={`text-base font-serif italic text-center text-white`}>
                  «{text}»
                </p>
              </div>
            </div>
          )}

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <FolderHeart className="w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA]" />
              Категория
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter(c => c !== 'Все').map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    audioManager.triggerHaptic([10]);
                    setCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    category === cat
                      ? 'bg-[#7C6CF0] text-white shadow-md shadow-[#7C6CF0]/25 border border-[#8B7CF6]/60'
                      : 'bg-white/85 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border border-[#DDD6F9] dark:border-zinc-700/60 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Theme Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA]" />
              Тема оформления
            </label>
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    audioManager.triggerHaptic([10]);
                    setThemeId(t.id);
                  }}
                  className={`flex flex-col items-center p-2 rounded-xl border text-[11px] font-medium transition-all ${
                    themeId === t.id
                      ? 'border-[#7C6CF0] bg-[#EFEAFE] dark:bg-zinc-100 text-[#6A5BF5] dark:text-zinc-950 shadow-md shadow-[#7C6CF0]/20 scale-102 font-bold'
                      : 'border-[#DDD6F9] dark:border-zinc-800 bg-white/85 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${t.cardGradient} border ${t.border} mb-1`} />
                  <span className="truncate w-full text-center">{t.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA]" />
              Шрифт
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FONTS.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => {
                    audioManager.triggerHaptic([10]);
                    setFontId(f.id);
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${
                    fontId === f.id
                      ? 'border-[#7C6CF0] bg-[#EFEAFE] dark:bg-zinc-100 text-[#6A5BF5] dark:text-zinc-950 shadow-md shadow-[#7C6CF0]/20 font-bold'
                      : 'border-[#DDD6F9] dark:border-zinc-800 bg-white/85 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {f.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Schedule Switch inside creation modal */}
          <div className="p-4 rounded-2xl bg-white/85 dark:bg-zinc-950/60 border border-[#DDD6F9] dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#7C6CF0] dark:text-[#A78BFA]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Напоминания по графику
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={scheduleEnabled} 
                  onChange={(e) => setScheduleEnabled(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7C6CF0]"></div>
              </label>
            </div>

            {scheduleEnabled && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-zinc-800/80 animate-in fade-in">
                <div className="flex flex-wrap gap-1.5">
                  {times.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFEAFE] dark:bg-zinc-800 border border-[#C9BDF8] dark:border-zinc-700 text-xs text-[#6A5BF5] dark:text-zinc-200"
                    >
                      {t}
                      {times.length > 1 && (
                        <button type="button" onClick={() => handleRemoveTime(t)} className="hover:text-rose-500 dark:hover:text-rose-400">
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-[#DDD6F9] dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-[#7C6CF0]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="px-3 py-1.5 bg-[#EFEAFE] dark:bg-zinc-800 hover:bg-[#E6DEFD] dark:hover:bg-zinc-700 rounded-xl text-xs text-[#6A5BF5] dark:text-zinc-200 border border-[#C9BDF8] dark:border-zinc-700"
                  >
                    + Добавить время
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 flex items-center gap-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-sm font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#8B7CF6] to-[#6A5BF5] hover:opacity-95 text-white text-sm font-semibold shadow-[0_10px_24px_rgba(124,108,240,0.38)] transition-all active:scale-98"
            >
              {isEditing ? 'Сохранить изменения' : 'Добавить аффирмацию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
