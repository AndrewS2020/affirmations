import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Library,
  Bell,
  Wind,
  Plus,
  Heart,
  Smartphone,
  Sun,
  Moon,
  RefreshCw
} from 'lucide-react';
import ZenView from './components/ZenView';
import AffirmationsList from './components/AffirmationsList';
import ScheduleHub from './components/ScheduleHub';
import BreatheMeditation from './components/BreatheMeditation';
import ScheduleModal from './components/ScheduleModal';
import CreateEditModal from './components/CreateEditModal';
import PushNotificationBanner from './components/PushNotificationBanner';
import { registerServiceWorker } from './utils/webPush';
import { audioManager } from './utils/audio';

const FALLBACK_AFFIRMATIONS = [
  {
    id: "aff-1",
    text: "Я полон спокойствия, уверенности и внутренней силы. Я доверяю своему жизненному пути.",
    category: "Спокойствие",
    theme: "ocean",
    font: "serif",
    isFavorite: true,
    schedule: {
      enabled: true,
      times: ["08:30", "21:30"],
      days: [1, 2, 3, 4, 5, 6, 7],
      mode: "specific",
      vibrate: true,
      sound: true
    }
  },
  {
    id: "aff-2",
    text: "Каждый день приносит мне новые возможности для финансового изобилия и творческого роста.",
    category: "Успех и богатство",
    theme: "gold",
    font: "sans",
    isFavorite: true,
    schedule: {
      enabled: true,
      times: ["10:00", "15:00"],
      days: [1, 2, 3, 4, 5],
      mode: "specific",
      vibrate: true,
      sound: true
    }
  },
  {
    id: "aff-3",
    text: "Я люблю и принимаю себя целиком. Моё тело наполнено здоровьем, а мысли — ясностью.",
    category: "Любовь к себе",
    theme: "rose",
    font: "quote",
    isFavorite: false,
    schedule: {
      enabled: false,
      times: ["09:00"],
      days: [1, 2, 3, 4, 5, 6, 7],
      mode: "specific",
      vibrate: true,
      sound: false
    }
  },
  {
    id: "aff-4",
    text: "Я легко отпускаю то, что не могу контролировать, и направляю энергию на созидание прекрасного.",
    category: "Спокойствие",
    theme: "lavender",
    font: "serif",
    isFavorite: true,
    schedule: {
      enabled: true,
      times: ["19:00"],
      days: [1, 2, 3, 4, 5, 6, 7],
      mode: "specific",
      vibrate: true,
      sound: true
    }
  },
  {
    id: "aff-5",
    text: "Мои отношения гармоничны, теплы и наполнены искренней поддержкой и взаимным уважением.",
    category: "Отношения",
    theme: "sunset",
    font: "serif",
    isFavorite: false,
    schedule: {
      enabled: false,
      times: ["12:00", "20:00"],
      days: [1, 2, 3, 4, 5, 6, 7],
      mode: "specific",
      vibrate: true,
      sound: true
    }
  },
  {
    id: "aff-6",
    text: "Моя энергия безгранична, иммунитет силен, а каждая клеточка тела обновляется с каждым вздохом.",
    category: "Здоровье",
    theme: "emerald",
    font: "sans",
    isFavorite: false,
    schedule: {
      enabled: true,
      times: ["07:30"],
      days: [1, 2, 3, 4, 5, 6, 7],
      mode: "specific",
      vibrate: true,
      sound: true
    }
  },
  {
    id: "aff-7",
    text: "Я открываюсь великому потоку вдохновения. Все мои замыслы воплощаются легко и с радостью.",
    category: "Мотивация",
    theme: "cosmic",
    font: "quote",
    isFavorite: true,
    schedule: {
      enabled: false,
      times: ["11:00", "17:00"],
      days: [1, 2, 3, 4, 5],
      mode: "specific",
      vibrate: true,
      sound: true
    }
  }
];

const BASE_URL = import.meta.env.BASE_URL || '/';
const API_BASE = BASE_URL.endsWith('/') ? `${BASE_URL}api` : `${BASE_URL}/api`;

export default function App() {
  const [activeTab, setActiveTab] = useState('zen'); // 'zen' | 'library' | 'schedule' | 'meditation'
  const [affirmations, setAffirmations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('affirmations_theme');
    return saved !== null ? saved === 'dark' : false;
  });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  // Sync theme with HTML class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('affirmations_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('affirmations_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    audioManager.triggerHaptic([15]);
    setIsDarkMode(prev => !prev);
  };

  // Modals state
  const [scheduleModalAffirmation, setScheduleModalAffirmation] = useState(null);
  const [createEditModalData, setCreateEditModalData] = useState({ isOpen: false, affirmation: null });

  // Load affirmations and register service worker on start
  useEffect(() => {
    fetchAffirmations();

    // Service Worker registration with update detection
    let refreshTimer = null;
    let registrationRef = null;
    let refreshing = false;

    const handleUpdate = (worker) => {
      setWaitingWorker(worker);
      setUpdateAvailable(true);
    };

    const attachUpdateListeners = (reg) => {
      if (!reg) return;
      if (reg.waiting) {
        handleUpdate(reg.waiting);
      }
      reg.addEventListener('updatefound', () => {
        const newSw = reg.installing;
        if (!newSw) return;
        newSw.addEventListener('statechange', () => {
          if (newSw.state === 'installed' && navigator.serviceWorker.controller) {
            handleUpdate(newSw);
          }
        });
      });
    };

    const initServiceWorker = async () => {
      try {
        const reg = await registerServiceWorker();
        if (!reg) return;
        registrationRef = reg;
        attachUpdateListeners(reg);

        // Periodically check for SW updates (every 30 min)
        refreshTimer = setInterval(() => {
          if (registrationRef) registrationRef.update().catch(() => {});
        }, 30 * 60 * 1000);

        // Also re-check on visibility change (when user returns to the app)
        const onVisibility = () => {
          if (document.visibilityState === 'visible' && registrationRef) {
            registrationRef.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', onVisibility);
      } catch (e) {
        console.warn('[App] SW init error:', e);
      }
    };

    // When the new SW takes over (after SKIP_WAITING), reload to load fresh bundle
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_OPENED' && event.data.affirmationId) {
          handleSelectAffirmationById(event.data.affirmationId);
        }
      });
    }

    initServiceWorker();

    // Check URL parameters for shortcut routing
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['zen', 'library', 'schedule', 'meditation'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const affIdParam = params.get('affirmationId');
    if (affIdParam) {
      handleSelectAffirmationById(affIdParam);
    }

    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, []);

  const fetchAffirmations = async () => {
    try {
      const res = await fetch(`${API_BASE}/affirmations`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAffirmations(data);
          localStorage.setItem('affirmations_cache', JSON.stringify(data));
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend not reached, checking local cache:', e);
    }

    // Fallback to localStorage or default seed
    const cached = localStorage.getItem('affirmations_cache');
    if (cached) {
      try {
        setAffirmations(JSON.parse(cached));
      } catch (err) {
        setAffirmations(FALLBACK_AFFIRMATIONS);
      }
    } else {
      setAffirmations(FALLBACK_AFFIRMATIONS);
    }
    setLoading(false);
  };

  const handleSelectAffirmationById = (id) => {
    setAffirmations((prev) => {
      const idx = prev.findIndex(a => a.id === id);
      if (idx !== -1) {
        setCurrentIndex(idx);
        setActiveTab('zen');
      }
      return prev;
    });
  };

  // Create or Update Affirmation
  const handleSaveAffirmation = async (affData) => {
    try {
      if (affData.id) {
        // Update
        const res = await fetch(`${API_BASE}/affirmations/${affData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(affData)
        });
        const updated = res.ok ? await res.json() : affData;
        setAffirmations(prev => {
          const next = prev.map(a => a.id === updated.id ? updated : a);
          localStorage.setItem('affirmations_cache', JSON.stringify(next));
          return next;
        });
      } else {
        // Create
        const res = await fetch(`${API_BASE}/affirmations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(affData)
        });
        const created = res.ok ? await res.json() : { ...affData, id: `aff-${Date.now()}` };
        setAffirmations(prev => {
          const next = [created, ...prev];
          localStorage.setItem('affirmations_cache', JSON.stringify(next));
          return next;
        });
        setCurrentIndex(0);
      }
    } catch (e) {
      console.error('Save error:', e);
      // Local fallback save
      setAffirmations(prev => {
        let next;
        if (affData.id) {
          next = prev.map(a => a.id === affData.id ? affData : a);
        } else {
          next = [{ ...affData, id: `aff-${Date.now()}` }, ...prev];
        }
        localStorage.setItem('affirmations_cache', JSON.stringify(next));
        return next;
      });
    }
  };

  // Delete Affirmation
  const handleDeleteAffirmation = async (id) => {
    try {
      await fetch(`${API_BASE}/affirmations/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete backend warning:', e);
    }
    setAffirmations(prev => {
      const next = prev.filter(a => a.id !== id);
      localStorage.setItem('affirmations_cache', JSON.stringify(next));
      return next;
    });
    if (currentIndex >= affirmations.length - 1) {
      setCurrentIndex(Math.max(0, affirmations.length - 2));
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id) => {
    const aff = affirmations.find(a => a.id === id);
    if (!aff) return;

    const updated = { ...aff, isFavorite: !aff.isFavorite };
    handleSaveAffirmation(updated);
  };

  const handleSelectAffirmation = (aff) => {
    const idx = affirmations.findIndex(a => a.id === aff.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setActiveTab('zen');
    }
  };

  // Apply pending service worker update: tell the waiting worker to activate,
  // then reload once controllerchange fires (see useEffect above).
  const applyServiceWorkerUpdate = () => {
    if (!waitingWorker) return;
    audioManager.triggerHaptic([20]);
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <div className="h-[100dvh] text-slate-900 dark:text-zinc-100 flex flex-col selection:bg-[#8B7CF6] selection:text-white transition-colors duration-300">
      {/* Top Mobile Bar */}
      <header className="safe-top px-4 pt-3 pb-2.5 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#8B7CF6] via-[#C084FC] to-[#4FD8C0] flex items-center justify-center shadow-md shadow-[#7C6CF0]/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-800 dark:text-zinc-100">
            Аффирмации
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white/70 dark:bg-zinc-900/60 active:scale-90 text-slate-600 dark:text-zinc-300 transition-all shadow-sm"
            title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#7C6CF0]" />
            )}
          </button>

          {/* Quick Add Affirmation Button */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([15]);
              setCreateEditModalData({ isOpen: true, affirmation: null });
            }}
            className="p-2.5 rounded-full bg-gradient-to-r from-[#8B7CF6] to-[#6A5BF5] active:scale-90 text-white transition-all shadow-md shadow-[#7C6CF0]/25"
            title="Создать аффирмацию"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Push Notification Banner */}
      <PushNotificationBanner />

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#7C6CF0]/20 border-t-[#7C6CF0] animate-spin" />
            <p className="text-xs text-slate-500 dark:text-zinc-500">Загрузка вдохновения...</p>
          </div>
        ) : (
          <>
            {activeTab === 'zen' && (
              <ZenView
                affirmations={affirmations}
                currentIndex={currentIndex}
                onIndexChange={setCurrentIndex}
                onToggleFavorite={handleToggleFavorite}
                onOpenScheduleModal={(aff) => setScheduleModalAffirmation(aff)}
                onOpenEditModal={(aff) => setCreateEditModalData({ isOpen: true, affirmation: aff })}
                isDarkMode={isDarkMode}
              />
            )}

            {activeTab === 'library' && (
              <AffirmationsList
                affirmations={affirmations}
                onSelectAffirmation={handleSelectAffirmation}
                onToggleFavorite={handleToggleFavorite}
                onOpenScheduleModal={(aff) => setScheduleModalAffirmation(aff)}
                onOpenCreateModal={() => setCreateEditModalData({ isOpen: true, affirmation: null })}
                onOpenEditModal={(aff) => setCreateEditModalData({ isOpen: true, affirmation: aff })}
                onDeleteAffirmation={handleDeleteAffirmation}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleHub
                affirmations={affirmations}
                onOpenScheduleModal={(aff) => setScheduleModalAffirmation(aff)}
                onUpdateAffirmation={handleSaveAffirmation}
              />
            )}

            {activeTab === 'meditation' && (
              <BreatheMeditation affirmations={affirmations} isDarkMode={isDarkMode} />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <ScheduleModal
        affirmation={scheduleModalAffirmation}
        isOpen={!!scheduleModalAffirmation}
        onClose={() => setScheduleModalAffirmation(null)}
        onSave={handleSaveAffirmation}
      />

      <CreateEditModal
        isOpen={createEditModalData.isOpen}
        initialAffirmation={createEditModalData.affirmation}
        onClose={() => setCreateEditModalData({ isOpen: false, affirmation: null })}
        onSave={handleSaveAffirmation}
      />

      {/* Bottom Floating Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 nav-bottom-safe pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto rounded-[28px] bg-white/75 dark:bg-zinc-950/80 backdrop-blur-2xl shadow-xl shadow-black/[0.06] dark:shadow-black/40 border border-white/60 dark:border-white/5 px-2 py-2 flex items-center justify-around mb-3">
          {/* Zen View Tab */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setActiveTab('zen');
            }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-2xl transition-all ${
              activeTab === 'zen'
                ? 'text-[#6A5BF5] dark:text-[#A78BFA] font-semibold bg-[#EFEAFE] dark:bg-white/10'
                : 'text-slate-400 dark:text-zinc-500'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">Дзен</span>
          </button>

          {/* Library Tab */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setActiveTab('library');
            }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-2xl transition-all ${
              activeTab === 'library'
                ? 'text-[#6A5BF5] dark:text-[#A78BFA] font-semibold bg-[#EFEAFE] dark:bg-white/10'
                : 'text-slate-400 dark:text-zinc-500'
            }`}
          >
            <Library className="w-5 h-5" />
            <span className="text-[10px]">Библиотека</span>
          </button>

          {/* Schedule Hub Tab */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setActiveTab('schedule');
            }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-2xl transition-all ${
              activeTab === 'schedule'
                ? 'text-[#6A5BF5] dark:text-[#A78BFA] font-semibold bg-[#EFEAFE] dark:bg-white/10'
                : 'text-slate-400 dark:text-zinc-500'
            }`}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {affirmations.some(a => a.schedule?.enabled) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-950" />
              )}
            </div>
            <span className="text-[10px]">График</span>
          </button>

          {/* Meditation Tab */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setActiveTab('meditation');
            }}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-2xl transition-all ${
              activeTab === 'meditation'
                ? 'text-[#6A5BF5] dark:text-[#A78BFA] font-semibold bg-[#EFEAFE] dark:bg-white/10'
                : 'text-slate-400 dark:text-zinc-500'
            }`}
          >
            <Wind className="w-5 h-5" />
            <span className="text-[10px]">Дыхание</span>
          </button>
        </div>
      </nav>

      {/* Update Available Toast — shown when a new SW has finished installing */}
      {updateAvailable && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}>
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 shadow-xl shadow-black/20 backdrop-blur-xl max-w-sm">
            <RefreshCw className="w-4 h-4 shrink-0" />
            <div className="flex-1 text-xs font-medium leading-tight">
              Доступна новая версия
            </div>
            <button
              onClick={applyServiceWorkerUpdate}
              className="px-3 py-1.5 rounded-full bg-[#7C6CF0] hover:bg-[#6A5BF5] active:scale-95 text-white text-xs font-semibold transition-all"
            >
              Обновить
            </button>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="px-2 py-1.5 rounded-full text-white/70 dark:text-zinc-700/70 hover:text-white dark:hover:text-zinc-900 text-xs transition-all"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
