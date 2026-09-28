import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Heart, 
  Bell, 
  BellOff, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Play, 
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { CATEGORIES, getTheme, getFontClass } from '../utils/themes';
import { audioManager } from '../utils/audio';

const DAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function AffirmationsList({
  affirmations,
  onSelectAffirmation,
  onToggleFavorite,
  onOpenScheduleModal,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteAffirmation
}) {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyScheduled, setOnlyScheduled] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const filteredAffirmations = useMemo(() => {
    return affirmations.filter((aff) => {
      // Category filter
      if (selectedCategory !== 'Все' && aff.category !== selectedCategory) {
        return false;
      }
      // Favorites filter
      if (onlyFavorites && !aff.isFavorite) {
        return false;
      }
      // Scheduled filter
      if (onlyScheduled && (!aff.schedule || !aff.schedule.enabled)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = aff.text.toLowerCase().includes(query);
        const catMatch = aff.category?.toLowerCase().includes(query);
        return textMatch || catMatch;
      }
      return true;
    });
  }, [affirmations, selectedCategory, searchQuery, onlyFavorites, onlyScheduled]);

  const handleDelete = (id) => {
    audioManager.triggerHaptic([20, 20]);
    onDeleteAffirmation(id);
    setDeleteConfirmId(null);
  };

  const formatScheduleText = (schedule) => {
    if (!schedule || !schedule.enabled) {
      return null;
    }
    const timesStr = schedule.times?.join(', ') || '—';
    let daysStr = 'Каждый день';
    if (schedule.days?.length === 5 && !schedule.days.includes(6) && !schedule.days.includes(7)) {
      daysStr = 'Пн-Пт';
    } else if (schedule.days?.length === 2 && schedule.days.includes(6) && schedule.days.includes(7)) {
      daysStr = 'Выходные';
    } else if (schedule.days?.length < 7) {
      daysStr = schedule.days.map(d => DAY_NAMES[d]).join(', ');
    }
    return `${timesStr} • ${daysStr}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-3 space-y-4 pb-24 text-slate-900 dark:text-zinc-100">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Библиотека</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EFEAFE] dark:bg-zinc-800 text-[#6A5BF5] dark:text-zinc-400 font-medium">
              {filteredAffirmations.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Фразы и персональный график доставки
          </p>
        </div>

        <button
          onClick={() => {
            audioManager.triggerHaptic([15]);
            onOpenCreateModal();
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#8B7CF6] to-[#6A5BF5] text-white shadow-md shadow-[#7C6CF0]/25 active:scale-90 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по аффирмациям..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-zinc-900/80 text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6CF0]/40 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-1.5"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Quick Toggles */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => {
            audioManager.triggerHaptic([10]);
            setOnlyFavorites(!onlyFavorites);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium flex-shrink-0 transition-all ${
            onlyFavorites
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
              : 'bg-white/80 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
          <span>Избранные</span>
        </button>

        <button
          onClick={() => {
            audioManager.triggerHaptic([10]);
            setOnlyScheduled(!onlyScheduled);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium flex-shrink-0 transition-all ${
            onlyScheduled
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
              : 'bg-white/80 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>С графиком</span>
        </button>
      </div>

      {/* Category Horizontal Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setSelectedCategory(cat);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#7C6CF0] text-white font-semibold shadow-md shadow-[#7C6CF0]/25'
                : 'bg-white/80 dark:bg-zinc-900/70 text-slate-500 dark:text-zinc-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Affirmation Cards Grid */}
      <div className="space-y-3 pt-1">
        {filteredAffirmations.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-white/70 dark:bg-zinc-900/30 backdrop-blur-sm">
            <Sparkles className="w-8 h-8 text-slate-400 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-slate-600 dark:text-zinc-400 text-sm font-medium">Ничего не найдено</p>
            <p className="text-slate-400 dark:text-zinc-600 text-xs mt-1">Попробуйте изменить параметры поиска или фильтров</p>
          </div>
        ) : (
          filteredAffirmations.map((aff) => {
            const theme = getTheme(aff.theme || 'ocean');
            const fontClass = getFontClass(aff.font || 'serif');
            const scheduleText = formatScheduleText(aff.schedule);

            return (
              <div
                key={aff.id}
                className="group relative rounded-2xl bg-white/80 dark:bg-zinc-900/70 p-4 pl-5 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between gap-3 overflow-hidden"
              >
                {/* Accent colored line on left */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.cardGradient}`} />

                {/* Top Row: Category & Schedule Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold flex-shrink-0 ${theme.badge}`}>
                      {aff.category || 'Гармония'}
                    </span>

                    {/* Schedule Indicator */}
                    {scheduleText ? (
                      <button
                        onClick={() => onOpenScheduleModal(aff)}
                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#EFEAFE] dark:bg-purple-500/10 text-[#6A5BF5] dark:text-[#C4B5FD] transition-colors flex-shrink-0"
                        title="Нажмите для настройки графика"
                      >
                        <Bell className="w-3 h-3" />
                        <span className="font-medium truncate max-w-[120px] sm:max-w-[180px]">{scheduleText}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenScheduleModal(aff)}
                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800/80 text-slate-400 dark:text-zinc-500 transition-colors flex-shrink-0"
                        title="Включить push-график"
                      >
                        <BellOff className="w-3 h-3" />
                        <span>Пуш выкл.</span>
                      </button>
                    )}
                  </div>

                  {/* Favorite quick toggle */}
                  <button
                    onClick={() => {
                      audioManager.playLikeSound();
                      audioManager.triggerHaptic([15]);
                      onToggleFavorite(aff.id);
                    }}
                    className={`p-2 rounded-full flex-shrink-0 transition-colors ${
                      aff.isFavorite ? 'text-rose-500 dark:text-rose-400' : 'text-slate-300 dark:text-zinc-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${aff.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Affirmation Text */}
                <p
                  onClick={() => onSelectAffirmation(aff)}
                  className={`text-sm sm:text-base text-slate-800 dark:text-zinc-200 leading-relaxed cursor-pointer active:text-[#6A5BF5] dark:active:text-white transition-colors ${fontClass}`}
                >
                  «{aff.text}»
                </p>

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-zinc-800/60 text-xs">
                  {/* Jump to Zen Card */}
                  <button
                    onClick={() => onSelectAffirmation(aff)}
                    className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 active:text-[#6A5BF5] dark:active:text-[#A78BFA] font-medium transition-colors py-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Открыть в Дзен</span>
                  </button>

                  <div className="flex items-center gap-0.5">
                    {/* Edit Button */}
                    <button
                      onClick={() => onOpenEditModal(aff)}
                      className="p-2.5 rounded-full text-slate-400 dark:text-zinc-400 active:text-[#7C6CF0] dark:active:text-[#A78BFA] transition-colors"
                      title="Редактировать"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Confirmation Button */}
                    {deleteConfirmId === aff.id ? (
                      <div className="flex items-center gap-1 animate-in fade-in">
                        <button
                          onClick={() => handleDelete(aff.id)}
                          className="px-2.5 py-1.5 rounded-full bg-rose-600 text-white text-[11px] font-semibold"
                        >
                          Удалить
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[11px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(aff.id)}
                        className="p-2.5 rounded-full text-slate-300 dark:text-zinc-500 active:text-rose-500 dark:active:text-rose-400 transition-colors"
                        title="Удалить аффирмацию"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
