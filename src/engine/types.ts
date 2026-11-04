// Tipos básicos del motor del mus. Sin dependencias de UI.

export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos';
/** Rango impreso en la carta: 1-7, 10 (sota), 11 (caballo), 12 (rey). */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export interface Card {
  suit: Suit;
  rank: Rank;
}

/** Asiento en la mesa. El juego va 0 → 1 → 2 → 3 (hacia la derecha). Parejas: 0-2 y 1-3. */
export type Seat = 0 | 1 | 2 | 3;
/** Pareja: 0 = asientos 0 y 2 ("nosotros"), 1 = asientos 1 y 3 ("ellos"). */
export type Team = 0 | 1;

export type Variant = '8reyes' | '4reyes';

export interface Rules {
  variant: Variant;
  /** ¿Vale la 31 real (tres sietes y una figura), que gana a cualquier otra 31? */
  real31: boolean;
  /** Tantos para ganar un juego (30 o 40). */
  target: 30 | 40;
  /** Juegos necesarios para ganar la vaca (1 = partida rápida). */
  juegosVaca: 1 | 2 | 3;
}

export const DEFAULT_RULES: Rules = { variant: '8reyes', real31: false, target: 40, juegosVaca: 1 };

export type LanceId = 'grande' | 'chica' | 'pares' | 'juego' | 'punto';

export type ParesKind = 'none' | 'pareja' | 'medias' | 'duples';

export interface ParesInfo {
  kind: ParesKind;
  /** Rangos efectivos de las parejas, el más alto primero (pareja/medias: 1 elemento, duples: 2). */
  ranks: number[];
  /** Tantos que vale la jugada (0, 1, 2 o 3). */
  value: number;
}

export interface JuegoInfo {
  sum: number;
  hasJuego: boolean;
  isReal: boolean;
  /** Tantos que vale el juego (0, 2 o 3). */
  value: number;
}

export const teamOf = (s: Seat): Team => (s % 2) as Team;
export const partnerOf = (s: Seat): Seat => ((s + 2) % 4) as Seat;
export const nextSeat = (s: Seat): Seat => ((s + 1) % 4) as Seat;
export const SEATS: Seat[] = [0, 1, 2, 3];
/** Orden de habla empezando por la mano. */
export const orderFrom = (mano: Seat): Seat[] => [0, 1, 2, 3].map((i) => ((mano + i) % 4) as Seat);
