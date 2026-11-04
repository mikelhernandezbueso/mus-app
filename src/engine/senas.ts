// Qué señas corresponden a una mano (según la lista de docs/REGLAMENTO.md §10).
import { juegoInfo, paresInfo } from './evaluate';
import type { Card, Rules } from './types';

export type SenaId =
  | 'dosReyes'
  | 'tresReyes'
  | 'dosAses'
  | 'tresAses'
  | 'medias'
  | 'duples'
  | 'treintaYUna'
  | 'ciego'
  | 'solomillo';

/**
 * Señas que hay que hacer con esta mano. Sin señas parciales: se indica la jugada de pares
 * y, además, la 31. Tres reyes + 31 es el "solomillo". Sin pares ni juego: "ciego".
 * Si la mano tiene algo sin seña (p. ej. pareja de sotas), la lista queda vacía.
 */
export function senasForHand(h: Card[], rules: Rules): SenaId[] {
  const p = paresInfo(h, rules);
  const j = juegoInfo(h, rules);
  const out: SenaId[] = [];
  if (p.kind === 'duples') out.push('duples');
  else if (p.kind === 'medias') out.push(p.ranks[0] === 12 ? 'tresReyes' : p.ranks[0] === 1 ? 'tresAses' : 'medias');
  else if (p.kind === 'pareja') {
    if (p.ranks[0] === 12) out.push('dosReyes');
    else if (p.ranks[0] === 1) out.push('dosAses');
  }
  if (j.hasJuego && j.sum === 31) out.push('treintaYUna');
  if (out.length === 2 && out[0] === 'tresReyes' && out[1] === 'treintaYUna') return ['solomillo'];
  if (p.kind === 'none' && !j.hasJuego) return ['ciego'];
  return out;
}

export const sameSenas = (a: SenaId[], b: SenaId[]) => a.length === b.length && a.every((x, i) => x === b[i]);
