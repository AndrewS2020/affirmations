import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bell,
  Palette,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTheme, getFontClass, THEMES } from '../utils/themes';
import { audioManager } from '../utils/audio';

export default function ZenView({
  affirmations,
  currentIndex,
  onIndexChange,
  onToggleFavorite,
  onOpenScheduleModal
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [overrideTheme, setOverrideTheme] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Touch swipe handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const cardRef = useRef(null);

  const currentAffirmation = affirmations[currentIndex] || affirmations[0];

  useEffect(() => {
    if (isSpeaking) {
      audioManager.stopSpeech();
      setIsSpeaking(false);
    }
    setDragX(0);
  }, [currentIndex]);

  const activeThemeId = overrideTheme || currentAffirmation?.theme || 'ocean';
  const theme = getTheme(activeThemeId);
  const fontClass = getFontClass(currentAffirmation?.font || 'serif');

  const handleNext = () => {
    if (affirmations.length <= 1) return;
    audioManager.triggerHaptic([15]);
    onIndexChange((currentIndex + 1) % affirmations.length);
  };

  const handlePrev = () => {
    if (affirmations.length <= 1) return;
    audioManager.triggerHaptic([15]);
    onIndexChange((currentIndex - 1 + affirmations.length) % affirmations.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragX(diffX);
    }
  };

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 55) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else {
      setDragX(0);
    }
  };

  const handleHeartClick = (e) => {
    e.stopPropagation();
    audioManager.playLikeSound();
    audioManager.triggerHaptic([20, 50, 20]);
    onToggleFavorite(currentAffirmation.id);

    if (!currentAffirmation.isFavorite) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#f43f5e', '#a855f7', '#fbbf24']
      });
    }
  };

  const handleSpeechToggle = (e) => {
    e.stopPropagation();
    audioManager.triggerHaptic([15]);
    if (isSpeaking) {
      audioManager.stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      audioManager.speakAffirmation(currentAffirmation.text, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handlePlayChime = (e) => {
    e.stopPropagation();
    audioManager.playBowlChime();
    audioManager.triggerHaptic([30]);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    audioManager.triggerHaptic([15]);

    const shareData = {
      title: 'Аффирмация дня',
      text: `✨ «${currentAffirmation.text}»\n\n— Найдено в приложении «Аффирмации»`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed copying text:', err);
      }
    }
  };

  if (!currentAffirmation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-14 h-14 rounded-full bg-[#F1ECFE] dark:bg-zinc-900 flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-[#8B7CF6]" />
        </div>
        <p className="text-slate-500 dark:text-zinc-400 text-sm">Список аффирмаций пуст</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-stretch px-4 pt-1 pb-28">
      {/* Background Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute top-1/4 -left-16 w-72 h-72 rounded-full ${theme.orbColors[0]} blur-3xl opacity-40 animate-float transition-colors duration-700`} />
        <div className={`absolute bottom-1/4 -right-16 w-80 h-80 rounded-full ${theme.orbColors[1]} blur-3xl opacity-30 animate-pulse-slow transition-colors duration-700`} />
        <div className={`absolute top-1/2 left-1/3 w-52 h-52 rounded-full ${theme.orbColors[2]} blur-2xl opacity-20 transition-colors duration-700`} />
      </div>

      {/* Slim Floating Toolbar */}
      <div className="w-full flex items-center justify-between py-2.5 z-10">
        <div className="flex items-center gap-1.5 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/60 dark:border-white/5 shadow-sm text-xs text-slate-600 dark:text-zinc-300">
          <span className="font-semibold tabular-nums">
            {currentIndex + 1} <span className="text-slate-400 dark:text-zinc-500 font-normal">/ {affirmations.length}</span>
          </span>
        </div>

        <button
          onClick={() => setShowThemePicker(!showThemePicker)}
          className={`p-2.5 rounded-full backdrop-blur-xl border transition-all duration-200 active:scale-90 ${
            showThemePicker
              ? 'bg-[#7C6CF0] text-white border-[#7C6CF0] shadow-md shadow-[#7C6CF0]/30'
              : 'bg-white/70 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 border-white/60 dark:border-white/5 shadow-sm'
          }`}
          title="Сменить тему оформления"
        >
          <Palette className="w-4 h-4" />
        </button>
      </div>

      {/* Theme Picker Dropdown */}
      {showThemePicker && (
        <div className="w-full mb-2 p-3.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/60 dark:border-white/5 rounded-[28px] shadow-xl shadow-black/5 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-3 px-1">
            Стиль карточки
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setOverrideTheme(t.id);
                  audioManager.triggerHaptic([10]);
                }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`w-9 h-9 rounded-full ${t.cardGradient} border-2 transition-all ${
                  activeThemeId === t.id
                    ? 'border-[#7C6CF0] dark:border-white scale-110 shadow-md'
                    : 'border-white/80 dark:border-white/10 group-active:scale-95'
                }`} />
                <span className={`text-[10px] truncate w-full text-center transition-colors ${
                  activeThemeId === t.id ? 'text-[#6A5BF5] dark:text-white font-semibold' : 'text-slate-500 dark:text-zinc-500'
                }`}>{t.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Affirmation Card */}
      <div className="relative w-full py-3 flex items-center justify-center">
        <div
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 40}deg)`,
            opacity: 1 - Math.min(Math.abs(dragX) / 400, 0.4),
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease'
          }}
          className={`relative w-full rounded-[32px] p-6 sm:p-8 flex flex-col justify-between min-h-[360px] max-h-[480px] border ${theme.cardGradient} ${theme.border} ${theme.glow}`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] px-3 py-1 rounded-full uppercase tracking-wider font-semibold border ${theme.badge}`}>
              {currentAffirmation.category || 'Гармония'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenScheduleModal(currentAffirmation)}
                className={`p-2.5 rounded-full transition-all duration-200 active:scale-90 ${
                  currentAffirmation.schedule?.enabled
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-black/[0.04] dark:bg-white/10 text-slate-500 dark:text-zinc-400'
                }`}
                title="Настроить график уведомлений"
              >
                <Bell className="w-4 h-4" />
              </button>

              <button
                onClick={handleHeartClick}
                className={`p-2.5 rounded-full transition-all duration-200 active:scale-90 ${
                  currentAffirmation.isFavorite
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 scale-105'
                    : 'bg-black/[0.04] dark:bg-white/10 text-slate-500 dark:text-zinc-400'
                }`}
                title="В избранное"
              >
                <Heart className={`w-4 h-4 ${currentAffirmation.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Affirmation Text */}
          <div className="my-auto py-8 text-center select-none">
            <p className={`text-2xl sm:text-3xl leading-relaxed sm:leading-relaxed select-text font-medium ${theme.textColor} ${fontClass}`}>
              {currentAffirmation.text}
            </p>
          </div>

          {/* Bottom Actions — icon-only pill, roomy touch targets */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={handlePlayChime}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-white/70 dark:bg-black/25 active:scale-90 text-slate-700 dark:text-white transition-all shadow-sm"
              title="Звук поющей чаши (432 Гц)"
            >
              <Sparkles className="w-[18px] h-[18px] text-[#8B7CF6] dark:text-[#C4B5FD]" />
            </button>

            <button
              onClick={handleSpeechToggle}
              className={`flex items-center justify-center w-11 h-11 rounded-full active:scale-90 transition-all shadow-sm ${
                isSpeaking
                  ? 'bg-[#7C6CF0] text-white shadow-md shadow-[#7C6CF0]/30'
                  : 'bg-white/70 dark:bg-black/25 text-slate-700 dark:text-white'
              }`}
              title="Прочитать аффирмацию вслух"
            >
              {isSpeaking ? <VolumeX className="w-[18px] h-[18px] animate-pulse" /> : <Volume2 className="w-[18px] h-[18px] text-[#7C6CF0] dark:text-[#A78BFA]" />}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-white/70 dark:bg-black/25 active:scale-90 text-slate-700 dark:text-white transition-all shadow-sm"
              title="Поделиться"
            >
              {copied ? <Check className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-[18px] h-[18px] text-[#7C6CF0] dark:text-[#A78BFA]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Swiper Navigation & Dot Indicators */}
      <div className="w-full flex items-center justify-between pt-4 z-10">
        <button
          onClick={handlePrev}
          disabled={affirmations.length <= 1}
          className="p-3.5 rounded-full bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl text-slate-600 dark:text-zinc-300 disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all shadow-sm"
          title="Предыдущая аффирмация"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 max-w-[160px] overflow-x-auto no-scrollbar py-1">
          {affirmations.slice(0, 12).map((aff, idx) => (
            <button
              key={aff.id || idx}
              onClick={() => onIndexChange(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-5 bg-[#7C6CF0] dark:bg-white'
                  : 'w-1.5 bg-slate-300/70 dark:bg-zinc-700'
              }`}
            />
          ))}
          {affirmations.length > 12 && (
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium ml-0.5">+{affirmations.length - 12}</span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={affirmations.length <= 1}
          className="p-3.5 rounded-full bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl text-slate-600 dark:text-zinc-300 disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all shadow-sm"
          title="Следующая аффирмация"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
