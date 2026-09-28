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
  Type, 
  Radio, 
  Copy, 
  Check, 
  Maximize2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTheme, getFontClass, THEMES, FONTS } from '../utils/themes';
import { audioManager } from '../utils/audio';

export default function ZenView({ 
  affirmations, 
  currentIndex, 
  onIndexChange, 
  onToggleFavorite, 
  onOpenScheduleModal, 
  onOpenEditModal 
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAmbientOn, setIsAmbientOn] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [overrideTheme, setOverrideTheme] = useState(null);
  const [copied, setCopied] = useState(false);

  // Touch swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const cardRef = useRef(null);

  const currentAffirmation = affirmations[currentIndex] || affirmations[0];

  useEffect(() => {
    // Reset speech when changing card
    if (isSpeaking) {
      audioManager.stopSpeech();
      setIsSpeaking(false);
    }
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
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
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

  const handleAmbientToggle = () => {
    audioManager.triggerHaptic([15]);
    const newState = !isAmbientOn;
    setIsAmbientOn(newState);
    audioManager.toggleAmbient(newState);
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
        <p className="text-slate-500 dark:text-zinc-400 mb-4">Список аффирмаций пуст</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-between min-h-[calc(100vh-140px)] px-4 py-2">
      {/* Background Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute top-1/4 -left-12 w-64 h-64 rounded-full ${theme.orbColors[0]} blur-3xl opacity-40 animate-float`} />
        <div className={`absolute bottom-1/4 -right-12 w-72 h-72 rounded-full ${theme.orbColors[1]} blur-3xl opacity-30 animate-pulse-slow`} />
        <div className={`absolute top-1/2 left-1/3 w-48 h-48 rounded-full ${theme.orbColors[2]} blur-2xl opacity-20`} />
      </div>

      {/* Top Floating Controls */}
      <div className="w-full flex items-center justify-between pt-1 pb-3 z-10">
        <div className="flex items-center gap-1.5 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#DDD6F9] dark:border-zinc-800/80 shadow-md text-xs text-slate-700 dark:text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-[#8B7CF6] dark:text-[#A78BFA] animate-pulse" />
          <span className="font-medium tracking-wide">
            {currentIndex + 1} <span className="text-slate-400 dark:text-zinc-500">/</span> {affirmations.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Ambient Sound Toggle */}
          <button
            onClick={handleAmbientToggle}
            className={`p-2 rounded-full backdrop-blur-md border transition-all duration-200 ${
              isAmbientOn 
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-white/80 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 border-[#DDD6F9] dark:border-zinc-800 hover:text-slate-900 dark:hover:text-zinc-200 shadow-sm'
            }`}
            title="Фоновый звук океана"
          >
            <Radio className={`w-4 h-4 ${isAmbientOn ? 'animate-spin' : ''}`} />
          </button>

          {/* Theme customizer button */}
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="p-2 rounded-full bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-[#DDD6F9] dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-all duration-200 shadow-sm"
            title="Сменить тему оформления"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Theme Picker Dropdown Modal */}
      {showThemePicker && (
        <div className="w-full mb-3 p-3 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl border border-[#DDD6F9] dark:border-zinc-800 rounded-2xl shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-2 px-1 flex justify-between items-center">
            <span>Выберите стиль карты:</span>
            <button 
              onClick={() => setShowThemePicker(false)}
              className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setOverrideTheme(t.id);
                  audioManager.triggerHaptic([10]);
                }}
                className={`flex flex-col items-center p-2 rounded-xl border text-[11px] font-medium transition-all ${
                  activeThemeId === t.id
                    ? 'border-[#7C6CF0] dark:border-white bg-[#EFEAFE] dark:bg-white/10 text-[#6A5BF5] dark:text-white shadow-lg shadow-[#7C6CF0]/20 scale-105 font-bold'
                    : 'border-[#DDD6F9] dark:border-zinc-800 bg-white/85 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full ${t.cardGradient} border ${t.border} mb-1`} />
                <span className="truncate w-full text-center">{t.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Affirmation Card */}
      <div 
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full my-auto rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[380px] sm:min-h-[440px] border transition-all duration-500 transform ${theme.cardGradient} ${theme.border} ${theme.glow}`}
      >
        {/* Subtle Card Header */}
        <div className="flex items-center justify-between">
          <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold border ${theme.badge}`}>
            {currentAffirmation.category || 'Гармония'}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Notification Schedule Status Badge */}
            <button
              onClick={() => onOpenScheduleModal(currentAffirmation)}
              className={`p-2 rounded-full transition-all duration-200 border ${
                currentAffirmation.schedule?.enabled
                  ? 'bg-[#E9F9F2] text-[#0D9463] border-[#10B981]/40 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-white/80 text-slate-600 border-[#DDD6F9] hover:text-slate-900 dark:bg-black/20 dark:text-zinc-400 dark:border-white/10 dark:hover:text-zinc-200 shadow-sm'
              }`}
              title="Настроить график уведомлений"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Favorite Button */}
            <button
              onClick={handleHeartClick}
              className={`p-2 rounded-full transition-all duration-200 border ${
                currentAffirmation.isFavorite
                  ? 'bg-rose-500/15 text-rose-600 border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-105'
                  : 'bg-white/80 text-slate-600 border-[#DDD6F9] hover:text-slate-900 dark:bg-black/20 dark:text-zinc-400 dark:border-white/10 dark:hover:text-zinc-200 shadow-sm'
              }`}
              title="В избранное"
            >
              <Heart className={`w-4 h-4 ${currentAffirmation.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Affirmation Text & Quote Icon */}
        <div className="my-auto py-6 text-center">
          <div className={`text-3xl sm:text-4xl ${theme.quoteColor} font-serif mb-2 select-none`}>“</div>
          <p className={`text-xl sm:text-2xl leading-relaxed sm:leading-loose select-text font-medium ${theme.textColor} ${fontClass}`}>
            {currentAffirmation.text}
          </p>
          <div className={`text-3xl sm:text-4xl ${theme.quoteColor} font-serif mt-2 select-none`}>”</div>
        </div>

        {/* Interactive Bottom Actions inside card */}
        <div className="flex items-center justify-between pt-4 border-t border-[#DDD6F9]/80 dark:border-white/15">
          {/* Tibetan Bowl Bell sound */}
          <button
            onClick={handlePlayChime}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 border border-[#DDD6F9] dark:bg-black/30 dark:hover:bg-black/45 dark:text-white dark:border-white/15 text-xs transition-colors shadow-sm"
            title="Звук поющей чаши (432 Гц)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8B7CF6] dark:text-[#C4B5FD]" />
            <span>Чаша</span>
          </button>

          {/* Voice Narrator (Speech Synthesis) */}
          <button
            onClick={handleSpeechToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
              isSpeaking
                ? 'bg-[#7C6CF0] text-white border-[#7C6CF0] shadow-md shadow-[#7C6CF0]/30'
                : 'bg-white/80 hover:bg-white text-slate-800 border-[#DDD6F9] dark:bg-black/30 dark:hover:bg-black/45 dark:text-white dark:border-white/15 shadow-sm'
            }`}
            title="Прочитать аффирмацию вслух"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-white animate-pulse" /> : <Volume2 className="w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA]" />}
            <span>{isSpeaking ? 'Остановить' : 'Озвучить'}</span>
          </button>

          {/* Share / Copy */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 border border-[#DDD6F9] dark:bg-black/30 dark:hover:bg-black/45 dark:text-white dark:border-white/15 text-xs transition-colors shadow-sm"
            title="Поделиться"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA]" />}
            <span>{copied ? 'Скопировано' : 'Поделиться'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Swiper Navigation & Dot Indicators */}
      <div className="w-full flex items-center justify-between pt-4 pb-2 z-10">
        <button
          onClick={handlePrev}
          disabled={affirmations.length <= 1}
          className="p-3 rounded-full bg-white/80 dark:bg-zinc-900/70 border border-[#DDD6F9] dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-md"
          title="Предыдущая аффирмация"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Indicator dots */}
        <div className="flex items-center gap-1.5 max-w-[180px] overflow-x-auto no-scrollbar py-1">
          {affirmations.slice(0, 15).map((aff, idx) => (
            <button
              key={aff.id || idx}
              onClick={() => onIndexChange(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-6 bg-[#7C6CF0] dark:bg-white shadow-[0_0_8px_rgba(124,108,240,0.5)] dark:shadow-[0_0_8px_white]'
                  : 'w-2 bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400 dark:hover:bg-zinc-500'
              }`}
            />
          ))}
          {affirmations.length > 15 && (
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium">+{affirmations.length - 15}</span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={affirmations.length <= 1}
          className="p-3 rounded-full bg-white/80 dark:bg-zinc-900/70 border border-[#DDD6F9] dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-md"
          title="Следующая аффирмация"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
