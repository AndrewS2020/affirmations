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
  Moon
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
    registerServiceWorker();
    fetchAffirmations();

    // Listen for Service Worker notification click messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_OPENED' && event.data.affirmationId) {
          handleSelectAffirmationById(event.data.affirmationId);
        }
      });
    }

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

  return (
    <div className="min-h-screen text-slate-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-[#8B7CF6] selection:text-white transition-colors duration-300">
      {/* Top Mobile Bar */}
      <header className="safe-top px-4 pt-3 pb-2 flex items-center justify-between border-b border-[#C9BDF8]/40 dark:border-zinc-900/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8B7CF6] via-[#C084FC] to-[#4FD8C0] p-[1.5px] flex items-center justify-center shadow-lg shadow-[#7C6CF0]/25">
            <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-full flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA]" />
            </div>
          </div>
          <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-[#23203A] via-[#6A5BF5] to-[#3BAF99] dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            Аффирмации
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 border border-[#C9BDF8]/60 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 active:scale-95 transition-all shadow-sm"
            title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-[#7C6CF0] animate-in spin-in-180 duration-300" />
            )}
          </button>

          {/* Quick Add Affirmation Button */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([15]);
              setCreateEditModalData({ isOpen: true, affirmation: null });
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 border border-[#C9BDF8]/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#7C6CF0] dark:text-[#A78BFA]" />
            <span>Создать</span>
          </button>
        </div>
      </header>

      {/* Push Notification Banner */}
      <PushNotificationBanner />

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 flex flex-col justify-center">
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
              <BreatheMeditation affirmations={affirmations} />
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

      {/* Bottom Sticky Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav nav-bottom-safe">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
          {/* Zen View Tab */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setActiveTab('zen');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'zen'
                ? 'text-[#7C6CF0] dark:text-[#A78BFA] font-semibold bg-[#EFEAFE]/80 dark:bg-white/5'
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${activeTab === 'zen' ? 'scale-110 drop-shadow-[0_0_8px_rgba(124,108,240,0.45)]' : ''}`} />
            <span className="text-[10px]">Дзен</span>
          </button>

          {/* Library Tab */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setActiveTab('library');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'library'
                ? 'text-[#7C6CF0] dark:text-[#A78BFA] font-semibold bg-[#EFEAFE]/80 dark:bg-white/5'
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            <Library className={`w-5 h-5 ${activeTab === 'library' ? 'scale-110 drop-shadow-[0_0_8px_rgba(124,108,240,0.45)]' : ''}`} />
            <span className="text-[10px]">Библиотека</span>
          </button>

          {/* Schedule Hub Tab */}
          <button
            onClick={() => {
              audioManager.triggerHaptic([10]);
              setActiveTab('schedule');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'schedule'
                ? 'text-[#7C6CF0] dark:text-[#A78BFA] font-semibold bg-[#EFEAFE]/80 dark:bg-white/5'
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            <div className="relative">
              <Bell className={`w-5 h-5 ${activeTab === 'schedule' ? 'scale-110 drop-shadow-[0_0_8px_rgba(124,108,240,0.45)]' : ''}`} />
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
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'meditation'
                ? 'text-[#7C6CF0] dark:text-[#A78BFA] font-semibold bg-[#EFEAFE]/80 dark:bg-white/5'
                : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            <Wind className={`w-5 h-5 ${activeTab === 'meditation' ? 'scale-110 drop-shadow-[0_0_8px_rgba(124,108,240,0.45)]' : ''}`} />
            <span className="text-[10px]">Дыхание</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
