export const THEMES = [
  {
    id: 'ocean',
    name: 'Океан & Аврора',
    cardGradient: 'bg-gradient-to-br from-cyan-50 via-sky-100 to-indigo-100 dark:from-indigo-900/60 dark:via-slate-900/80 dark:to-cyan-950/60',
    border: 'border-cyan-200/80 dark:border-cyan-500/30',
    glow: 'shadow-[0_15px_35px_-5px_rgba(6,182,212,0.15)] dark:shadow-[0_0_50px_-10px_rgba(6,182,212,0.35)]',
    accentText: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-100/90 text-cyan-900 border-cyan-300/70 dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-500/30',
    orbColors: ['bg-cyan-400/25 dark:bg-cyan-500/20', 'bg-indigo-400/20 dark:bg-indigo-600/20', 'bg-teal-300/25 dark:bg-teal-400/20'],
    textColor: 'text-slate-900 dark:text-slate-100',
    quoteColor: 'text-cyan-400/40 dark:text-cyan-100/20'
  },
  {
    id: 'sunset',
    name: 'Закат & Тепло',
    cardGradient: 'bg-gradient-to-br from-rose-50 via-orange-50 to-amber-100 dark:from-rose-900/60 dark:via-stone-900/80 dark:to-amber-950/60',
    border: 'border-rose-200/80 dark:border-rose-500/30',
    glow: 'shadow-[0_15px_35px_-5px_rgba(244,63,94,0.15)] dark:shadow-[0_0_50px_-10px_rgba(244,63,94,0.35)]',
    accentText: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-100/90 text-rose-900 border-rose-300/70 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-500/30',
    orbColors: ['bg-rose-400/25 dark:bg-rose-500/20', 'bg-amber-400/20 dark:bg-amber-600/20', 'bg-orange-300/25 dark:bg-orange-400/20'],
    textColor: 'text-slate-900 dark:text-rose-50',
    quoteColor: 'text-rose-400/40 dark:text-rose-100/20'
  },
  {
    id: 'gold',
    name: 'Золото & Изобилие',
    cardGradient: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100 dark:from-amber-900/50 dark:via-neutral-900/80 dark:to-yellow-950/50',
    border: 'border-amber-200/80 dark:border-amber-500/30',
    glow: 'shadow-[0_15px_35px_-5px_rgba(245,158,11,0.15)] dark:shadow-[0_0_50px_-10px_rgba(245,158,11,0.35)]',
    accentText: 'text-amber-800 dark:text-amber-300',
    badge: 'bg-amber-100/90 text-amber-900 border-amber-300/70 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/30',
    orbColors: ['bg-amber-400/25 dark:bg-amber-500/20', 'bg-yellow-400/20 dark:bg-yellow-600/20', 'bg-orange-300/25 dark:bg-orange-500/20'],
    textColor: 'text-slate-900 dark:text-amber-50',
    quoteColor: 'text-amber-400/40 dark:text-amber-100/20'
  },
  {
    id: 'emerald',
    name: 'Изумруд & Гармония',
    cardGradient: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 dark:from-emerald-900/50 dark:via-slate-900/80 dark:to-teal-950/50',
    border: 'border-emerald-200/80 dark:border-emerald-500/30',
    glow: 'shadow-[0_15px_35px_-5px_rgba(16,185,129,0.15)] dark:shadow-[0_0_50px_-10px_rgba(16,185,129,0.35)]',
    accentText: 'text-emerald-800 dark:text-emerald-300',
    badge: 'bg-emerald-100/90 text-emerald-900 border-emerald-300/70 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/30',
    orbColors: ['bg-emerald-400/25 dark:bg-emerald-500/20', 'bg-teal-400/20 dark:bg-teal-600/20', 'bg-green-300/25 dark:bg-green-400/20'],
    textColor: 'text-slate-900 dark:text-emerald-50',
    quoteColor: 'text-emerald-400/40 dark:text-emerald-100/20'
  },
  {
    id: 'lavender',
    name: 'Лаванда & Баланс',
    cardGradient: 'bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-100 dark:from-purple-900/60 dark:via-slate-900/80 dark:to-violet-950/60',
    border: 'border-purple-200/80 dark:border-purple-500/30',
    glow: 'shadow-[0_15px_35px_-5px_rgba(168,85,247,0.15)] dark:shadow-[0_0_50px_-10px_rgba(168,85,247,0.35)]',
    accentText: 'text-purple-800 dark:text-purple-300',
    badge: 'bg-purple-100/90 text-purple-900 border-purple-300/70 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-500/30',
    orbColors: ['bg-purple-400/25 dark:bg-purple-500/20', 'bg-violet-400/20 dark:bg-violet-600/20', 'bg-fuchsia-300/25 dark:bg-fuchsia-400/20'],
    textColor: 'text-slate-900 dark:text-purple-50',
    quoteColor: 'text-purple-400/40 dark:text-purple-100/20'
  },
  {
    id: 'cosmic',
    name: 'Космос & Мечты',
    cardGradient: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 dark:from-indigo-950/70 dark:via-neutral-950/80 dark:to-fuchsia-950/70',
    border: 'border-fuchsia-200/80 dark:border-fuchsia-500/30',
    glow: 'shadow-[0_15px_35px_-5px_rgba(217,70,239,0.15)] dark:shadow-[0_0_50px_-10px_rgba(217,70,239,0.35)]',
    accentText: 'text-fuchsia-800 dark:text-fuchsia-300',
    badge: 'bg-fuchsia-100/90 text-fuchsia-900 border-fuchsia-300/70 dark:bg-fuchsia-500/20 dark:text-fuchsia-200 dark:border-fuchsia-500/30',
    orbColors: ['bg-fuchsia-400/25 dark:bg-fuchsia-500/20', 'bg-blue-400/20 dark:bg-blue-600/20', 'bg-indigo-300/25 dark:bg-indigo-400/20'],
    textColor: 'text-slate-900 dark:text-pink-50',
    quoteColor: 'text-fuchsia-400/40 dark:text-fuchsia-100/20'
  },
  {
    id: 'rose',
    name: 'Нежная Роза',
    cardGradient: 'bg-gradient-to-br from-rose-50 via-pink-50 to-red-100 dark:from-rose-900/50 dark:via-stone-900/80 dark:to-pink-950/50',
    border: 'border-pink-200/80 dark:border-pink-500/30',
    glow: 'shadow-[0_15px_35px_-5px_rgba(236,72,153,0.15)] dark:shadow-[0_0_50px_-10px_rgba(236,72,153,0.35)]',
    accentText: 'text-pink-800 dark:text-pink-300',
    badge: 'bg-pink-100/90 text-pink-900 border-pink-300/70 dark:bg-pink-500/20 dark:text-pink-200 dark:border-pink-500/30',
    orbColors: ['bg-pink-400/25 dark:bg-pink-500/20', 'bg-rose-400/20 dark:bg-rose-500/20', 'bg-red-300/25 dark:bg-red-400/20'],
    textColor: 'text-slate-900 dark:text-pink-50',
    quoteColor: 'text-pink-400/40 dark:text-pink-100/20'
  },
  {
    id: 'minimal',
    name: 'Минимал Графит',
    cardGradient: 'bg-gradient-to-br from-slate-50 via-zinc-100 to-stone-100 dark:from-zinc-900/70 dark:via-neutral-900/80 dark:to-stone-900/70',
    border: 'border-slate-300/80 dark:border-white/20',
    glow: 'shadow-[0_15px_35px_-5px_rgba(0,0,0,0.08)] dark:shadow-[0_0_50px_-10px_rgba(255,255,255,0.15)]',
    accentText: 'text-slate-800 dark:text-zinc-300',
    badge: 'bg-slate-200/80 text-slate-800 border-slate-300 dark:bg-white/10 dark:text-white dark:border-white/20',
    orbColors: ['bg-slate-300/25 dark:bg-white/10', 'bg-zinc-400/20 dark:bg-zinc-600/20', 'bg-stone-300/25 dark:bg-stone-500/20'],
    textColor: 'text-slate-900 dark:text-white',
    quoteColor: 'text-slate-400/40 dark:text-zinc-200/20'
  }
];

export const CATEGORIES = [
  'Все',
  'Спокойствие',
  'Любовь к себе',
  'Успех и богатство',
  'Здоровье',
  'Отношения',
  'Мотивация',
  'Личное'
];

export const FONTS = [
  { id: 'serif', name: 'Элегантный (Serif)', className: 'font-serif tracking-wide italic' },
  { id: 'sans', name: 'Современный (Sans)', className: 'font-sans font-medium' },
  { id: 'quote', name: 'Рукописный (Cursive)', className: 'font-quote text-2xl md:text-3xl' }
];

export function getTheme(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

export function getFontClass(fontId) {
  const font = FONTS.find(f => f.id === fontId);
  return font ? font.className : 'font-serif';
}
