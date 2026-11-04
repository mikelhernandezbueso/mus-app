// Estimación Monte Carlo: probabilidad de que una pareja gane un lance,
// sabiendo solo lo que sabe el jugador (sus cartas, lo declarado y las señas vistas).
import {
  fullDeck, hasJuego, hasPares, lanceWinner, makeRng, sameSenas, senasForHand, teamOf,
  type Card, type LanceId, type Rules, type Seat, type SenaId,
} from '../engine';

export interface Knowledge {
  me: Seat;
  myHand: Card[];
  mano: Seat;
  rules: Rules;
  /** Declaraciones públicas de pares y juego (tras cortar el mus). */
  declared?: { pares: boolean[]; juego: boolean[] } | null;
  /** Señas conocidas de otros jugadores (las del compañero y las que se han pillado). */
  senas?: Partial<Record<Seat, SenaId[]>>;
  /** Cartas que sé que no están en otras manos (mis descartes). */
  excluded?: Card[];
}

const key = (c: Card) => c.rank * 10 + 'oceb'.indexOf(c.suit[0]);

export interface Sample {
  hands: Card[][];
}

/** Genera repartos de las cartas desconocidas compatibles con lo que se sabe. */
export function sampleDeals(k: Knowledge, n: number, seed: number): Sample[] {
  const rng = makeRng(seed);
  const mine = new Set(k.myHand.map(key));
  const excl = new Set((k.excluded ?? []).map(key));
  const unknown = fullDeck().filter((c) => !mine.has(key(c)) && !excl.has(key(c)));
  const pool = unknown.length >= 12 ? unknown : fullDeck().filter((c) => !mine.has(key(c)));
  const others = ([0, 1, 2, 3] as Seat[]).filter((s) => s !== k.me);
  const out: Sample[] = [];
  const fallback: Sample[] = [];
  const maxTries = n * 25;
  for (let t = 0; t < maxTries && out.length < n; t++) {
    // barajado parcial: solo necesitamos 12 cartas
    const a = pool.slice();
    for (let i = 0; i < 12; i++) {
      const j = i + Math.floor(rng() * (a.length - i));
      [a[i], a[j]] = [a[j], a[i]];
    }
    const hands: Card[][] = [[], [], [], []];
    hands[k.me] = k.myHand;
    others.forEach((s, idx) => (hands[s] = a.slice(idx * 4, idx * 4 + 4)));
    const s = { hands };
    if (fallback.length < n) fallback.push(s);
    if (consistent(hands, k, others)) out.push(s);
  }
  return out.length >= Math.min(20, n) ? out : out.concat(fallback).slice(0, n);
}

function consistent(hands: Card[][], k: Knowledge, others: Seat[]): boolean {
  for (const s of others) {
    if (k.declared) {
      if (hasPares(hands[s], k.rules) !== k.declared.pares[s]) return false;
      if (hasJuego(hands[s], k.rules) !== k.declared.juego[s]) return false;
    }
    const sn = k.senas?.[s];
    if (sn && !sameSenas(senasForHand(hands[s], k.rules), sn)) return false;
  }
  return true;
}

/** Probabilidad de que la pareja de `k.me` gane el lance (con la mano desempatando). */
export function winProbability(k: Knowledge, lance: LanceId, n = 160, seed = 1): number {
  const samples = sampleDeals(k, n, seed);
  let wins = 0;
  let counted = 0;
  const myTeam = teamOf(k.me);
  for (const { hands } of samples) {
    const seats = ([0, 1, 2, 3] as Seat[]).filter((s) =>
      lance === 'pares' ? hasPares(hands[s], k.rules) : lance === 'juego' ? hasJuego(hands[s], k.rules) : true,
    );
    if (seats.length === 0) continue;
    counted++;
    if (teamOf(lanceWinner(lance, hands, k.mano, k.rules, seats)) === myTeam) wins++;
  }
  return counted ? wins / counted : 0.5;
}

/** Probabilidad de ganar con mi mano sola contra los dos rivales (sin contar al compañero). */
export function soloWinProbability(k: Knowledge, lance: LanceId, n = 160, seed = 2): number {
  const samples = sampleDeals(k, n, seed);
  let wins = 0;
  let counted = 0;
  for (const { hands } of samples) {
    const seats = ([0, 1, 2, 3] as Seat[]).filter(
      (s) =>
        teamOf(s) !== teamOf(k.me) || s === k.me,
    ).filter((s) => (lance === 'pares' ? hasPares(hands[s], k.rules) : lance === 'juego' ? hasJuego(hands[s], k.rules) : true));
    if (!seats.includes(k.me)) continue;
    counted++;
    if (lanceWinner(lance, hands, k.mano, k.rules, seats) === k.me) wins++;
  }
  return counted ? wins / counted : 0;
}
