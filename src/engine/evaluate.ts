// Evaluación y comparación de manos en cada lance.
import { effRank, juegoValue } from './cards';
import type { Card, JuegoInfo, LanceId, ParesInfo, ParesKind, Rules, Seat, Variant } from './types';
import { orderFrom } from './types';

type V = Variant | Rules;
const real31Of = (v: V, real31?: boolean): boolean =>
  real31 ?? (typeof v === 'string' ? false : v.real31);

/** Rangos efectivos ordenados de mayor a menor. */
export const grandeKey = (h: Card[], v: V): number[] => h.map((c) => effRank(c, v)).sort((a, b) => b - a);
/** Rangos efectivos ordenados de menor a mayor. */
export const chicaKey = (h: Card[], v: V): number[] => h.map((c) => effRank(c, v)).sort((a, b) => a - b);

function lexCompare(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** >0 si a gana a b a la grande (sin contar la mano). */
export const compareGrande = (a: Card[], b: Card[], v: V) => lexCompare(grandeKey(a, v), grandeKey(b, v));
/** >0 si a gana a b a la chica (cartas más bajas). */
export const compareChica = (a: Card[], b: Card[], v: V) => lexCompare(chicaKey(b, v), chicaKey(a, v));

export const PARES_VALUE: Record<ParesKind, number> = { none: 0, pareja: 1, medias: 2, duples: 3 };
const PARES_ORDER: Record<ParesKind, number> = { none: 0, pareja: 1, medias: 2, duples: 3 };

export function paresInfo(h: Card[], v: V): ParesInfo {
  const counts = new Map<number, number>();
  for (const c of h) {
    const r = effRank(c, v);
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  const groups = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[0] - a[0]);
  let kind: ParesKind = 'none';
  let ranks: number[] = [];
  if (groups.length === 2) {
    kind = 'duples';
    ranks = [groups[0][0], groups[1][0]];
  } else if (groups.length === 1) {
    const [r, n] = groups[0];
    if (n === 4) {
      kind = 'duples';
      ranks = [r, r];
    } else if (n === 3) {
      kind = 'medias';
      ranks = [r];
    } else {
      kind = 'pareja';
      ranks = [r];
    }
  }
  return { kind, ranks, value: PARES_VALUE[kind] };
}

/** Índices (en la mano) de las cartas que forman los pares. */
export function paresCardIndices(h: Card[], v: V): number[] {
  const info = paresInfo(h, v);
  if (info.kind === 'none') return [];
  return h.map((c, i) => (info.ranks.includes(effRank(c, v)) ? i : -1)).filter((i) => i >= 0);
}

export const hasPares = (h: Card[], v: V) => paresInfo(h, v).kind !== 'none';

export function compareParesInfo(a: ParesInfo, b: ParesInfo): number {
  const d = PARES_ORDER[a.kind] - PARES_ORDER[b.kind];
  if (d !== 0) return d;
  return lexCompare(a.ranks, b.ranks);
}
export const comparePares = (a: Card[], b: Card[], v: V) => compareParesInfo(paresInfo(a, v), paresInfo(b, v));

export const handSum = (h: Card[], v: V) => h.reduce((s, c) => s + juegoValue(c, v), 0);

/** ¿Es la 31 real? Tres sietes y una figura (con 8 reyes, el tres también es figura). */
export function isReal31(h: Card[], v: V): boolean {
  if (h.length !== 4) return false;
  const sevens = h.filter((c) => c.rank === 7).length;
  const figures = h.filter((c) => effRank(c, v) >= 10).length;
  return sevens === 3 && figures === 1;
}

export function juegoInfo(h: Card[], v: V, real31?: boolean): JuegoInfo {
  const sum = handSum(h, v);
  const hasJuego = sum >= 31;
  const isReal = hasJuego && real31Of(v, real31) && isReal31(h, v);
  return { sum, hasJuego, isReal, value: !hasJuego ? 0 : sum === 31 ? 3 : 2 };
}

export const hasJuego = (h: Card[], v: V) => handSum(h, v) >= 31;

/** Orden de los juegos: 31, 32, 40, 37, 36, 35, 34, 33. */
export const JUEGO_ORDER = [31, 32, 40, 37, 36, 35, 34, 33];

/** Fuerza del juego: mayor es mejor. 0 si no hay juego. La 31 real (si vale) es la mejor. */
export function juegoStrength(j: JuegoInfo): number {
  if (!j.hasJuego) return 0;
  if (j.isReal) return 100;
  const idx = JUEGO_ORDER.indexOf(j.sum);
  return idx < 0 ? 0 : JUEGO_ORDER.length - idx;
}

export function compareJuego(a: Card[], b: Card[], v: V, real31?: boolean): number {
  return juegoStrength(juegoInfo(a, v, real31)) - juegoStrength(juegoInfo(b, v, real31));
}

/** Punto: gana la suma más alta (solo se juega si nadie tiene juego). */
export const comparePunto = (a: Card[], b: Card[], v: V) => handSum(a, v) - handSum(b, v);

export function compareLance(lance: LanceId, a: Card[], b: Card[], rules: Rules): number {
  switch (lance) {
    case 'grande':
      return compareGrande(a, b, rules);
    case 'chica':
      return compareChica(a, b, rules);
    case 'pares':
      return comparePares(a, b, rules);
    case 'juego':
      return compareJuego(a, b, rules);
    case 'punto':
      return comparePunto(a, b, rules);
  }
}

/** ¿Este jugador participa en el lance? (pares/juego exigen tener la jugada). */
export function canPlayLance(lance: LanceId, h: Card[], rules: Rules): boolean {
  if (lance === 'pares') return hasPares(h, rules);
  if (lance === 'juego') return hasJuego(h, rules);
  return true;
}

/**
 * Ganador de un lance entre los asientos dados. Los empates los gana
 * el jugador más cercano a la mano.
 */
export function lanceWinner(
  lance: LanceId,
  hands: Card[][],
  mano: Seat,
  rules: Rules,
  seats?: Seat[],
): Seat {
  const order = orderFrom(mano).filter((s) => !seats || seats.includes(s));
  let best = order[0];
  for (const s of order.slice(1)) {
    if (compareLance(lance, hands[s], hands[best], rules) > 0) best = s;
  }
  return best;
}

/** Posición en la mesa respecto a la mano (0 = mano, 3 = postre). */
export const distanceFromMano = (s: Seat, mano: Seat) => (s - mano + 4) % 4;
