import type { Progress } from '../state/progress';
import { ALL_LESSONS, UNITS } from './units';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  check: (p: Progress) => boolean;
}

const unitDone = (p: Progress, unitId: string) =>
  UNITS.find((u) => u.id === unitId)!.lessons.every((l) => p.lessons[l.id]);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primera', icon: '🌱', title: 'Primera baza', desc: 'Completa tu primera lección.', check: (p) => Object.keys(p.lessons).length >= 1 },
  { id: 'baraja', icon: '🂡', title: 'Conozco la baraja', desc: 'Termina la unidad 1.', check: (p) => unitDone(p, 'u1') },
  { id: 'lances', icon: '👑', title: 'Grande y chica', desc: 'Termina las unidades de grande y chica.', check: (p) => unitDone(p, 'u4') && unitDone(p, 'u5') },
  { id: 'pares', icon: '👯', title: 'Doble o nada', desc: 'Termina la unidad de pares.', check: (p) => unitDone(p, 'u6') },
  { id: 'juego31', icon: '🎯', title: 'La 31', desc: 'Termina la unidad de juego y punto.', check: (p) => unitDone(p, 'u7') },
  { id: 'hordago', icon: '💥', title: '¡Hor dago!', desc: 'Termina la unidad del órdago.', check: (p) => unitDone(p, 'u10') },
  { id: 'basico', icon: '🎓', title: 'Ya sé jugar', desc: 'Completa las 12 primeras unidades.', check: (p) => UNITS.slice(0, 12).every((u) => unitDone(p, u.id)) },
  { id: 'senas', icon: '😉', title: 'Lengua de signos', desc: 'Termina la unidad de señas.', check: (p) => unitDone(p, 'u13') },
  { id: 'todo', icon: '🏆', title: 'Txapeldun', desc: 'Completa todo el temario.', check: (p) => ALL_LESSONS.every((x) => p.lessons[x.lesson.id]) },
  { id: 'perfecta', icon: '⭐', title: 'Sin un fallo', desc: 'Termina una lección con 3 estrellas.', check: (p) => p.stats.perfectLessons >= 1 },
  { id: 'perfectas10', icon: '🌟', title: 'Fino filipino', desc: '10 lecciones con 3 estrellas.', check: (p) => p.stats.perfectLessons >= 10 },
  { id: 'racha3', icon: '🔥', title: 'Tres días seguidos', desc: 'Racha de 3 días.', check: (p) => p.streak.best >= 3 },
  { id: 'racha7', icon: '🔥', title: 'Una semana de mus', desc: 'Racha de 7 días.', check: (p) => p.streak.best >= 7 },
  { id: 'xp500', icon: '💎', title: '500 XP', desc: 'Consigue 500 puntos de experiencia.', check: (p) => p.xp >= 500 },
  { id: 'practica', icon: '🏋️', title: 'Entrenamiento', desc: 'Completa 5 rondas de práctica.', check: (p) => p.stats.practiceRounds >= 5 },
  { id: 'repaso', icon: '🔁', title: 'Lo que no mata…', desc: 'Repasa 20 ejercicios fallados.', check: (p) => p.stats.reviewsDone >= 20 },
  { id: 'partida', icon: '🃏', title: 'A la mesa', desc: 'Juega una partida completa contra los bots.', check: (p) => p.stats.gamesPlayed >= 1 },
  { id: 'victoria', icon: '🥇', title: 'Primera victoria', desc: 'Gana una partida contra los bots.', check: (p) => p.stats.gamesWon >= 1 },
  { id: 'ordagoGanado', icon: '⚡', title: 'Ahí está', desc: 'Gana un órdago en una partida.', check: (p) => p.stats.ordagosWon >= 1 },
  { id: 'manos50', icon: '🍷', title: 'Habitual del txoko', desc: 'Juega 50 manos.', check: (p) => p.stats.handsPlayed >= 50 },
];

export function newAchievements(p: Progress): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !p.achievements[a.id] && a.check(p));
}
