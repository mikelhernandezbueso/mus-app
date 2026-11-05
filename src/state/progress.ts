// Progreso del usuario, guardado en localStorage.
import { DEFAULT_RULES, type Rules } from '../engine';
import type { ExerciseSpec } from '../exercises/types';

export type BotLevel = 'principiante' | 'normal' | 'experto';
/** Ritmo de la partida: con qué calma juegan los bots. */
export type Pace = 'paso' | 'pausado' | 'normal' | 'rapido';

export interface Settings {
  variant: Rules['variant'];
  real31: boolean;
  target: Rules['target'];
  juegosVaca: Rules['juegosVaca'];
  sound: boolean;
  theme: 'auto' | 'light' | 'dark';
  botLevel: BotLevel;
  tutor: boolean;
  /** Mostrar etiquetas de equivalencia (3 = R, 2 = A). */
  hints: boolean;
  /** Objetivo diario de XP. */
  dailyGoal: 10 | 20 | 30 | 50;
  /** Ritmo de los bots en la mesa. */
  pace: Pace;
}

export interface ReviewItem {
  key: string;
  spec: ExerciseSpec;
  box: number; // 0..4 (Leitner)
  due: number; // timestamp
  topic: string;
}

export interface Progress {
  version: 1;
  onboarded: boolean;
  xp: number;
  lessons: Record<string, { stars: number; completedAt: number; plays: number }>;
  streak: { count: number; best: number; lastDay: string };
  daily: Record<string, number>;
  review: ReviewItem[];
  achievements: Record<string, number>;
  stats: {
    exercises: number;
    correct: number;
    perfectLessons: number;
    gamesPlayed: number;
    gamesWon: number;
    handsPlayed: number;
    ordagosWon: number;
    practiceRounds: number;
    reviewsDone: number;
    senasRead: number;
  };
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  variant: DEFAULT_RULES.variant,
  real31: DEFAULT_RULES.real31,
  target: DEFAULT_RULES.target,
  juegosVaca: DEFAULT_RULES.juegosVaca,
  sound: true,
  theme: 'auto',
  botLevel: 'normal',
  tutor: true,
  hints: true,
  dailyGoal: 20,
  pace: 'pausado',
};

export const initialProgress = (): Progress => ({
  version: 1,
  onboarded: false,
  xp: 0,
  lessons: {},
  streak: { count: 0, best: 0, lastDay: '' },
  daily: {},
  review: [],
  achievements: {},
  stats: {
    exercises: 0, correct: 0, perfectLessons: 0, gamesPlayed: 0, gamesWon: 0, handsPlayed: 0,
    ordagosWon: 0, practiceRounds: 0, reviewsDone: 0, senasRead: 0,
  },
  settings: { ...DEFAULT_SETTINGS },
});

const KEY = 'mus-eskola-v1';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialProgress();
    const p = JSON.parse(raw) as Progress;
    const base = initialProgress();
    return { ...base, ...p, stats: { ...base.stats, ...p.stats }, settings: { ...base.settings, ...p.settings }, streak: { ...base.streak, ...p.streak } };
  } catch {
    return initialProgress();
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* sin almacenamiento: seguimos en memoria */
  }
}

export const rulesFrom = (s: Settings): Rules => ({ variant: s.variant, real31: s.real31, target: s.target, juegosVaca: s.juegosVaca });

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T12:00:00');
  const db = new Date(b + 'T12:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/** Suma XP y actualiza la racha diaria. */
export function addXp(p: Progress, amount: number, now = new Date()): Progress {
  const today = dayKey(now);
  let { count, best, lastDay } = p.streak;
  if (lastDay !== today) {
    const gap = lastDay ? daysBetween(lastDay, today) : 99;
    count = gap === 1 ? count + 1 : 1;
    lastDay = today;
    best = Math.max(best, count);
  }
  const daily = { ...p.daily, [today]: (p.daily[today] ?? 0) + amount };
  // conservamos 60 días
  const keys = Object.keys(daily).sort();
  while (keys.length > 60) delete daily[keys.shift()!];
  return { ...p, xp: p.xp + amount, streak: { count, best, lastDay }, daily };
}

/** Racha vigente (si ayer o hoy hubo actividad). */
export function currentStreak(p: Progress, now = new Date()): number {
  if (!p.streak.lastDay) return 0;
  const gap = daysBetween(p.streak.lastDay, dayKey(now));
  return gap <= 1 ? p.streak.count : 0;
}

/** Nivel a partir de la XP: cada nivel cuesta un poco más. */
export function levelInfo(xp: number) {
  let level = 1;
  let need = 60;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level++;
    need = Math.round(need * 1.25);
  }
  return { level, into: rest, need, title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] };
}

export const LEVEL_TITLES = [
  'Mirón de barra', 'Aprendiz', 'Pide-mus', 'Contador de piedras', 'Cortador', 'Envidador',
  'Lector de señas', 'Postre astuto', 'Mano firme', 'Órdago andante', 'Txapeldun de sociedad', 'Leyenda del txoko',
];

// ---------- repaso espaciado (Leitner) ----------
const BOX_DAYS = [0, 1, 3, 7, 16];

export const specKey = (s: ExerciseSpec) => `${s.gen}|${s.seed}|${JSON.stringify(s.opts ?? {})}|${s.variant ?? ''}|${s.real31 ?? ''}`;

export function addReviewMiss(p: Progress, spec: ExerciseSpec, topic: string, now = Date.now()): Progress {
  const key = specKey(spec);
  const others = p.review.filter((r) => r.key !== key);
  const item: ReviewItem = { key, spec, box: 0, due: now, topic };
  return { ...p, review: [item, ...others].slice(0, 200) };
}

export function reviewAnswered(p: Progress, key: string, correct: boolean, now = Date.now()): Progress {
  const review = p.review
    .map((r) => {
      if (r.key !== key) return r;
      const box = correct ? r.box + 1 : 0;
      return { ...r, box, due: now + BOX_DAYS[Math.min(box, BOX_DAYS.length - 1)] * 86400000 };
    })
    .filter((r) => r.box < BOX_DAYS.length);
  return { ...p, review };
}

export const dueReviews = (p: Progress, now = Date.now()) => p.review.filter((r) => r.due <= now);

export const todayXp = (p: Progress, now = new Date()) => p.daily[dayKey(now)] ?? 0;
