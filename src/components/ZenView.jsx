import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Share2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Bell, 
  Palette, 
  Check,
  Layers,
  Minimize2,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTheme, getFontClass, THEMES } from '../utils/themes';
import { audioManager } from '../utils/audio';
import ThreeZenBackground from './ThreeZenBackground';

export default function ZenView({ 
  affirmations, 
  currentIndex, 
  onIndexChange, 
  onToggleFavorite, 
  onOpenScheduleModal,
  isDarkMode = true
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [overrideTheme, setOverrideTheme] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [is3DEnabled, setIs3DEnabled] = useState(true);
  const [visualMode, setVisualMode] = useState(() => localStorage.getItem('zen_visual_mode') || 'clump');
  const [isCardCollapsed, setIsCardCollapsed] = useState(() => localStorage.getItem('zen_card_collapsed') === 'true');
  const [pulseCount, setPulseCount] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);

  // Touch swipe handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const cardRef = useRef(null);

  const currentAffirmation = affirmations[currentIndex] || affirmations[0];

  useEffect(() => {
    localStorage.setItem('zen_card_collapsed', String(isCardCollapsed));
  }, [isCardCollapsed]);

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
    setSwipeCount(c => c + 1);
    onIndexChange((currentIndex + 1) % affirmations.length);
  };

  const handlePrev = () => {
    if (affirmations.length <= 1) return;
    audioManager.triggerHaptic([15]);
    setSwipeCount(c => c + 1);
    onIndexChange((currentIndex - 1 + affirmations.length) % affirmations.length);
  };

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, affirmations.length]);

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
    setPulseCount(c => c + 1); // Trigger 3D Supernova shockwave
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
    setPulseCount(c => c + 1);
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
      {/* Three.js Ethereal 3D WebGL Background */}
      {is3DEnabled && (
        <ThreeZenBackground 
          theme={theme} 
          isDarkMode={isDarkMode} 
          pulseTrigger={pulseCount} 
          swipeTrigger={swipeCount} 
          affirmationId={currentAffirmation?.id}
          visualMode={visualMode}
        />
      )}

      {/* Background Soft Orbs Fallback (Only active when 3D is disabled) */}
      {!is3DEnabled && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
          <div className={`absolute top-1/4 -left-16 w-72 h-72 rounded-full ${theme.orbColors[0]} blur-3xl opacity-30 animate-float transition-colors duration-700`} />
          <div className={`absolute bottom-1/4 -right-16 w-80 h-80 rounded-full ${theme.orbColors[1]} blur-3xl opacity-25 animate-pulse-slow transition-colors duration-700`} />
        </div>
      )}

      {/* Slim Floating Toolbar */}
      <div className="w-full flex items-center justify-between py-2.5 z-10">
        <div className="flex items-center gap-0.5 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl px-2 py-1 rounded-full border border-white/60 dark:border-white/5 shadow-sm text-xs text-slate-600 dark:text-zinc-300">
          <button 
            onClick={handlePrev}
            disabled={affirmations.length <= 1}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-25 active:scale-90"
            title="Предыдущая аффирмация"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-semibold tabular-nums px-1.5">
            {currentIndex + 1} <span className="text-slate-400 dark:text-zinc-500 font-normal">/ {affirmations.length}</span>
          </span>
          <button 
            onClick={handleNext}
            disabled={affirmations.length <= 1}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-25 active:scale-90"
            title="Следующая аффирмация"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 3D WebGL Toggle */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setIs3DEnabled(!is3DEnabled);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-xl border transition-all text-xs font-semibold ${
              is3DEnabled
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-400/30 shadow-sm'
                : 'bg-white/70 dark:bg-zinc-900/50 text-slate-400 border-white/60 dark:border-white/5'
            }`}
            title="Переключить 3D эффект"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D</span>
          </button>

          {/* 3D Visual Style Quick Switcher (Clump -> Jellyfish -> Lotus) */}
          {is3DEnabled && (
            <button
              onClick={() => {
                audioManager.triggerHaptic([10]);
                const modes = ['clump', 'jellyfish', 'lotus'];
                const nextIdx = (modes.indexOf(visualMode) + 1) % modes.length;
                const nextMode = modes[nextIdx];
                setVisualMode(nextMode);
                localStorage.setItem('zen_visual_mode', nextMode);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full backdrop-blur-xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/50 text-xs font-medium text-slate-700 dark:text-zinc-200 active:scale-90 transition-all shadow-sm"
              title="Сменить стиль 3D"
            >
              <span className="text-xs">
                {visualMode === 'clump' && '🌌 Сгусток'}
                {visualMode === 'jellyfish' && '🪼 Медуза'}
                {visualMode === 'lotus' && '🪷 Лотос'}
              </span>
            </button>
          )}

          {/* Card Collapse / Expand Toggle */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setIsCardCollapsed(!isCardCollapsed);
            }}
            className={`p-2.5 rounded-full backdrop-blur-xl border transition-all duration-200 active:scale-90 ${
              isCardCollapsed
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-400/40 shadow-sm ring-2 ring-amber-400/20'
                : 'bg-white/70 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 border-white/60 dark:border-white/5 shadow-sm'
            }`}
            title={isCardCollapsed ? "Развернуть карточку" : "Свернуть карточку"}
          >
            {isCardCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          {/* Theme customizer button */}
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

          {/* 3D Visual Style Chooser in Customizer */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/10">
            <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 mb-2 px-1">
              3D Стиль визуализации
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  setVisualMode('clump');
                  localStorage.setItem('zen_visual_mode', 'clump');
                  audioManager.triggerHaptic([10]);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-2xl border text-[11px] font-medium transition-all ${
                  visualMode === 'clump'
                    ? 'bg-[#7C6CF0]/15 text-[#6A5BF5] dark:text-[#A78BFA] border-[#7C6CF0]/40 font-semibold shadow-sm'
                    : 'bg-white/50 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border-white/40 dark:border-white/5'
                }`}
              >
                <span className="text-base">🌌</span>
                <span>Сгусток</span>
              </button>

              <button
                onClick={() => {
                  setVisualMode('jellyfish');
                  localStorage.setItem('zen_visual_mode', 'jellyfish');
                  audioManager.triggerHaptic([10]);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-2xl border text-[11px] font-medium transition-all ${
                  visualMode === 'jellyfish'
                    ? 'bg-[#7C6CF0]/15 text-[#6A5BF5] dark:text-[#A78BFA] border-[#7C6CF0]/40 font-semibold shadow-sm'
                    : 'bg-white/50 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border-white/40 dark:border-white/5'
                }`}
              >
                <span className="text-base">🪼</span>
                <span>Медуза</span>
              </button>

              <button
                onClick={() => {
                  setVisualMode('lotus');
                  localStorage.setItem('zen_visual_mode', 'lotus');
                  audioManager.triggerHaptic([10]);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-2xl border text-[11px] font-medium transition-all ${
                  visualMode === 'lotus'
                    ? 'bg-[#7C6CF0]/15 text-[#6A5BF5] dark:text-[#A78BFA] border-[#7C6CF0]/40 font-semibold shadow-sm'
                    : 'bg-white/50 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border-white/40 dark:border-white/5'
                }`}
              >
                <span className="text-base">🪷</span>
                <span>Лотос</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Affirmation Card (Frosted Glass revealing 3D scene beneath) */}
      <div className="relative w-full py-2 flex flex-col items-center justify-center z-10">
        <div
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={isCardCollapsed ? () => {
            audioManager.triggerHaptic([10]);
            setIsCardCollapsed(false);
          } : undefined}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 40}deg)`,
            opacity: 1 - Math.min(Math.abs(dragX) / 400, 0.4),
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease, padding 0.3s ease, min-height 0.35s ease'
          }}
          className={`relative w-full rounded-[28px] sm:rounded-[32px] border backdrop-blur-2xl shadow-2xl transition-all duration-300 ${theme.cardGradient} ${theme.border} ${theme.glow} ${
            isCardCollapsed 
              ? 'p-3.5 sm:p-4 min-h-0 cursor-pointer hover:border-white/30 group' 
              : 'p-6 sm:p-8 min-h-[360px] max-h-[480px] flex flex-col justify-between'
          }`}
        >
          {/* Card Header — ALWAYS visible! */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] px-3 py-1 rounded-full uppercase tracking-wider font-semibold border ${theme.badge}`}>
                {currentAffirmation.category || 'Гармония'}
              </span>
            </div>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onOpenScheduleModal(currentAffirmation)}
                className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 active:scale-90 ${
                  currentAffirmation.schedule?.enabled
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-black/[0.04] dark:bg-white/10 text-slate-500 dark:text-zinc-400'
                }`}
                title="Настроить график уведомлений"
              >
                <Bell className="w-4 h-4" />
              </button>

              <button
                onClick={handleHeartClick}
                className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 active:scale-90 ${
                  currentAffirmation.isFavorite
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 scale-105'
                    : 'bg-black/[0.04] dark:bg-white/10 text-slate-500 dark:text-zinc-400'
                }`}
                title="В избранное"
              >
                <Heart className={`w-4 h-4 ${currentAffirmation.isFavorite ? 'fill-current' : ''}`} />
              </button>

              {/* Card Header Collapse / Expand Toggle Chevron */}
              <button
                onClick={() => {
                  audioManager.triggerHaptic([10]);
                  setIsCardCollapsed(!isCardCollapsed);
                }}
                className="p-2 sm:p-2.5 rounded-full bg-black/[0.04] dark:bg-white/10 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 transition-all duration-200 active:scale-90"
                title={isCardCollapsed ? "Развернуть карточку" : "Свернуть карточку"}
              >
                {isCardCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Card Body (Affirmation text and bottom actions) */}
          {!isCardCollapsed && (
            <div className="flex flex-col justify-between flex-1 mt-2 animate-in fade-in duration-300">
              {/* Affirmation Text */}
              <div className="my-auto py-8 text-center select-none">
                <div className={`text-3xl sm:text-4xl ${theme.quoteColor} font-serif mb-1 select-none`}>“</div>
                <p className={`text-2xl sm:text-3xl leading-relaxed sm:leading-relaxed select-text font-medium drop-shadow-sm ${theme.textColor} ${fontClass}`}>
                  {currentAffirmation.text}
                </p>
                <div className={`text-3xl sm:text-4xl ${theme.quoteColor} font-serif mt-1 select-none`}>”</div>
              </div>

              {/* Bottom Actions — icon-only pill, roomy touch targets */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handlePlayChime}
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-white/70 dark:bg-black/30 backdrop-blur-md active:scale-90 text-slate-700 dark:text-white transition-all shadow-sm border border-white/50 dark:border-white/10"
                  title="Звук поющей чаши (432 Гц)"
                >
                  <Sparkles className="w-[18px] h-[18px] text-[#8B7CF6] dark:text-[#C4B5FD]" />
                </button>

                <button
                  onClick={handleSpeechToggle}
                  className={`flex items-center justify-center w-11 h-11 rounded-full active:scale-90 transition-all shadow-sm border border-white/50 dark:border-white/10 ${
                    isSpeaking
                      ? 'bg-[#7C6CF0] text-white shadow-md shadow-[#7C6CF0]/30'
                      : 'bg-white/70 dark:bg-black/30 backdrop-blur-md text-slate-700 dark:text-white'
                  }`}
                  title="Прочитать аффирмацию вслух"
                >
                  {isSpeaking ? <VolumeX className="w-[18px] h-[18px] animate-pulse" /> : <Volume2 className="w-[18px] h-[18px] text-[#7C6CF0] dark:text-[#A78BFA]" />}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-white/70 dark:bg-black/30 backdrop-blur-md active:scale-90 text-slate-700 dark:text-white transition-all shadow-sm border border-white/50 dark:border-white/10"
                  title="Поделиться"
                >
                  {copied ? <Check className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-[18px] h-[18px] text-[#7C6CF0] dark:text-[#A78BFA]" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded 3D Contemplation Touch Area when card is collapsed */}
      {isCardCollapsed && (
        <div 
          className="relative z-10 w-full min-h-[380px] flex-1 cursor-pointer select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            audioManager.triggerHaptic([10]);
            setIsCardCollapsed(false);
          }}
        />
      )}
    </div>
  );
}
