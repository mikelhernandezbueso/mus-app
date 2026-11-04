// Partida: sucesión de manos, juegos (a 30 o 40 tantos) y vaca.
import { newHand, type HandState } from './hand';
import type { Rules, Seat, Team } from './types';
import { nextSeat } from './types';

export interface GameState {
  rules: Rules;
  /** Tantos del juego en curso. */
  scores: [number, number];
  /** Juegos ganados en la vaca. */
  juegos: [number, number];
  mano: Seat;
  handNo: number;
  hand: HandState;
  seed: number;
  /** Ganador de la vaca (si ha terminado). */
  vacaWinner: Team | null;
  history: { handNo: number; points: [number, number]; juegoWinner: Team | null }[];
}

export function newGame(rules: Rules, seed: number, mano: Seat = 0): GameState {
  return {
    rules,
    scores: [0, 0],
    juegos: [0, 0],
    mano,
    handNo: 1,
    hand: newHand(rules, mano, [0, 0], seed),
    seed,
    vacaWinner: null,
    history: [],
  };
}

export const amarracos = (tantos: number) => Math.floor(tantos / 5);
export const piedrasSueltas = (tantos: number) => tantos % 5;

/**
 * Cierra la mano terminada y reparte la siguiente (la mano pasa a la derecha).
 * Si una pareja gana el juego, se suma a la vaca y se empieza un juego nuevo.
 */
export function advanceGame(g: GameState): GameState {
  const h = g.hand;
  if (h.phase !== 'terminada') throw new Error('La mano no ha terminado');
  if (g.vacaWinner !== null) return g;
  const points: [number, number] = [h.scores[0] - h.startScores[0], h.scores[1] - h.startScores[1]];
  const juegos: [number, number] = [...g.juegos] as [number, number];
  let scores: [number, number] = [...h.scores] as [number, number];
  let vacaWinner: Team | null = null;
  if (h.winner !== null) {
    juegos[h.winner]++;
    if (juegos[h.winner] >= g.rules.juegosVaca) vacaWinner = h.winner;
    scores = [0, 0];
  }
  const mano = nextSeat(g.mano);
  const handNo = g.handNo + 1;
  return {
    ...g,
    scores,
    juegos,
    mano,
    handNo,
    vacaWinner,
    hand: vacaWinner !== null ? h : newHand(g.rules, mano, scores, g.seed + handNo * 104729),
    history: [...g.history, { handNo: g.handNo, points, juegoWinner: h.winner }],
  };
}
