import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Wind, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  EyeOff,
  BellRing
} from 'lucide-react';
import { audioManager } from '../utils/audio';

const BREATH_MODES = {
  relax: {
    name: '4-7-8 Релакс',
    desc: 'Снятие тревоги, стресса и подготовка ко сну',
    steps: [
      { name: 'Вдох', duration: 4, action: 'inhale', hint: 'Медленный глубокий вдох через нос (звук расширения)' },
      { name: 'Задержка', duration: 7, action: 'hold', hint: 'Удерживайте воздух в спокойствии (звук колокольчика)' },
      { name: 'Выдох', duration: 8, action: 'exhale', hint: 'Плавный полный выдох через рот (звук расслабления)' }
    ]
  },
  box: {
    name: 'Квадрат (4-4-4-4)',
    desc: 'Концентрация, ясность ума и баланс нервной системы',
    steps: [
      { name: 'Вдох', duration: 4, action: 'inhale', hint: 'Вдох на 4 счета' },
      { name: 'Задержка', duration: 4, action: 'hold', hint: 'Задержка на 4 счета' },
      { name: 'Выдох', duration: 4, action: 'exhale', hint: 'Выдох на 4 счета' },
      { name: 'Пауза', duration: 4, action: 'pause', hint: 'Пауза без воздуха на 4 счета' }
    ]
  }
};

export default function BreatheMeditation({ affirmations }) {
  const [modeKey, setModeKey] = useState('relax');
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  const [sessionCount, setSessionCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const mode = BREATH_MODES[modeKey];
  const currentStep = mode.steps[stepIndex];

  // Random soothing affirmation for focus
  const [activeAffirmation, setActiveAffirmation] = useState(
    affirmations[0]?.text || 'Я в полной безопасности, моё тело расслаблено.'
  );

  // Play sound cue when step changes while active
  const prevStepRef = useRef(null);
  useEffect(() => {
    if (isActive && soundEnabled) {
      // Play sound for current phase
      audioManager.playBreathSound(currentStep.action);
    }
    prevStepRef.current = stepIndex;
  }, [stepIndex, isActive, soundEnabled]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Move to next step
            const nextStepIndex = (stepIndex + 1) % mode.steps.length;
            if (nextStepIndex === 0) {
              setSessionCount(c => c + 1);
              // Pick new affirmation on full cycle completion
              if (affirmations.length > 0) {
                const randomAff = affirmations[Math.floor(Math.random() * affirmations.length)];
                setActiveAffirmation(randomAff.text);
              }
            }
            setStepIndex(nextStepIndex);
            audioManager.triggerHaptic([25]);
            return mode.steps[nextStepIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, stepIndex, modeKey, mode.steps, affirmations]);

  const handleTogglePlay = () => {
    audioManager.triggerHaptic([20]);
    if (!isActive) {
      audioManager.playBowlChime();
      if (soundEnabled) {
        // Start first breath sound after a short bowl introduction
        setTimeout(() => {
          audioManager.playBreathSound(mode.steps[stepIndex].action);
        }, 600);
      }
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    audioManager.triggerHaptic([15]);
    setIsActive(false);
    setStepIndex(0);
    setTimeLeft(mode.steps[0].duration);
    setSessionCount(0);
  };

  const handleSwitchMode = (key) => {
    audioManager.triggerHaptic([15]);
    setModeKey(key);
    setIsActive(false);
    setStepIndex(0);
    setTimeLeft(BREATH_MODES[key].steps[0].duration);
  };

  const handleToggleSound = () => {
    audioManager.triggerHaptic([15]);
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    if (newState) {
      audioManager.playBreathSound('inhale');
    }
  };

  const getCircleScale = () => {
    if (!isActive) return 'scale-90';
    if (currentStep.action === 'inhale') return 'scale-125';
    if (currentStep.action === 'hold') return 'scale-125';
    if (currentStep.action === 'exhale') return 'scale-85';
    return 'scale-85';
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-3 flex flex-col items-center justify-between min-h-[calc(100vh-140px)] pb-24 text-zinc-900 dark:text-zinc-100">
      {/* Top Header Controls */}
      <div className="w-full flex items-center justify-between gap-2">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5">
          {Object.entries(BREATH_MODES).map(([k, m]) => (
            <button
              key={k}
              onClick={() => handleSwitchMode(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                modeKey === k
                  ? 'bg-[#7C6CF0] text-white shadow-md shadow-[#7C6CF0]/30 scale-102'
                  : 'bg-white/85 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-[#DDD6F9] dark:border-zinc-800 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              {m.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Sound Cues Toggle for Eyes-Closed Practice */}
        <button
          onClick={handleToggleSound}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            soundEnabled
              ? 'bg-[#EFEAFE] dark:bg-purple-500/15 text-[#6A5BF5] dark:text-[#A78BFA] border-[#C9BDF8] dark:border-purple-400/30 shadow-[0_0_12px_rgba(124,108,240,0.2)]'
              : 'bg-white/85 dark:bg-zinc-900 text-slate-500 border-[#DDD6F9] dark:border-zinc-800'
          }`}
          title="Звук фаз дыхания для практики с закрытыми глазами"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{soundEnabled ? 'Звук фаз: Вкл' : 'Звук: Выкл'}</span>
        </button>
      </div>

      {/* Eyes Closed Practice Hint Banner */}
      <div className="w-full mt-2 px-3.5 py-2 rounded-2xl bg-[#EFEAFE]/80 dark:bg-purple-950/40 border border-[#C9BDF8]/70 dark:border-purple-500/20 flex items-center gap-2 text-[11px] text-[#6A5BF5] dark:text-purple-300">
        <EyeOff className="w-4 h-4 flex-shrink-0 text-[#7C6CF0] dark:text-[#A78BFA]" />
        <span className="leading-snug">
          <strong>Практика с закрытыми глазами:</strong> восходящий тон — вдох, колокольчик — задержка, нисходящий — выдох.
        </span>
      </div>

      {/* Main Breathing Circle */}
      <div className="relative flex items-center justify-center my-auto py-8">
        {/* Ambient Glows */}
        <div className={`absolute w-72 h-72 rounded-full bg-cyan-500/15 dark:bg-cyan-500/10 blur-3xl transition-all duration-1000 ${isActive ? 'opacity-80 scale-125' : 'opacity-20'}`} />
        <div className={`absolute w-64 h-64 rounded-full bg-purple-500/20 dark:bg-purple-500/15 blur-2xl transition-all duration-1000 ${isActive ? 'opacity-90 scale-110' : 'opacity-20'}`} />

        {/* Outer Ring */}
        <div className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-[#8B7CF6]/25 dark:border-white/15 backdrop-blur-xl flex flex-col items-center justify-center transition-transform duration-[4000ms] ease-in-out ${getCircleScale()} bg-gradient-to-br from-[#DCD3FF]/80 via-[#C9BDF8]/70 to-[#BFEEE3]/80 dark:from-indigo-950/70 dark:via-purple-950/50 dark:to-cyan-950/70 shadow-2xl shadow-[#7C6CF0]/15 dark:shadow-[0_0_60px_rgba(168,85,247,0.3)]`}>
          <Wind className={`w-8 h-8 text-cyan-600 dark:text-cyan-300 mb-2 transition-opacity duration-500 ${isActive ? 'opacity-90' : 'opacity-40'}`} />
          
          <span className="text-2xl sm:text-3xl font-bold tracking-wider uppercase text-zinc-800 dark:text-zinc-100">
            {isActive ? currentStep.name : 'Нажмите Старт'}
          </span>

          <span className="text-4xl sm:text-5xl font-mono font-extrabold text-[#6A5BF5] dark:text-cyan-300 my-1">
            {isActive ? timeLeft : '—'}
          </span>

          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Цикл: {sessionCount}
          </span>
        </div>
      </div>

      {/* Step Hint / Affirmation Guidance Card */}
      <div className="w-full p-4 rounded-2xl bg-white/85 dark:bg-zinc-900/70 border border-[#DDD6F9] dark:border-zinc-800/80 text-center space-y-1 mb-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-center gap-1.5 text-[#7C6CF0] dark:text-[#A78BFA] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isActive ? currentStep.hint : 'Фокус внимания:'}</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 font-serif italic leading-relaxed">
          «{activeAffirmation}»
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="p-3.5 rounded-full bg-white/85 dark:bg-zinc-900 border border-[#DDD6F9] dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 active:scale-95 transition-all shadow-sm"
          title="Сбросить"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handleTogglePlay}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold shadow-xl transition-all active:scale-95 ${
            isActive
              ? 'bg-white/85 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-[#DDD6F9] dark:border-zinc-700'
              : 'bg-gradient-to-r from-[#8B7CF6] via-[#7C6CF6] to-[#4FD8C0] text-white shadow-[0_10px_24px_rgba(124,108,240,0.38)] hover:opacity-95'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Пауза</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Начать практику</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
