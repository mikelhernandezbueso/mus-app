import type { Card, Rank, Rules, Suit, Variant } from './types';
import { shuffle, type Rng } from './rng';

export const SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

export function fullDeck(): Card[] {
  const d: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) d.push({ suit, rank });
  return d;
}

export const shuffledDeck = (rng: Rng): Card[] => shuffle(fullDeck(), rng);

type V = Variant | Rules;
const variantOf = (v: V): Variant => (typeof v === 'string' ? v : v.variant);

/**
 * Rango efectivo para comparar (grande, chica y pares).
 * A 8 reyes: el 3 es rey (12) y el 2 es as (1).
 */
export function effRank(card: Card, v: V): number {
  if (variantOf(v) === '8reyes') {
    if (card.rank === 3) return 12;
    if (card.rank === 2) return 1;
  }
  return card.rank;
}

/** Valor de la carta para el juego y el punto. */
export function juegoValue(card: Card, v: V): number {
  const r = effRank(card, v);
  return r >= 10 ? 10 : r;
}

export const sameCard = (a: Card, b: Card) => a.suit === b.suit && a.rank === b.rank;
export const cardId = (c: Card) => `${c.rank}${c.suit[0]}`;

const RANK_NAMES: Record<number, string> = {
  1: 'as', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 10: 'sota', 11: 'caballo', 12: 'rey',
};
const RANK_PLURAL: Record<number, string> = {
  1: 'ases', 2: 'doses', 3: 'treses', 4: 'cuatros', 5: 'cincos', 6: 'seises', 7: 'sietes', 10: 'sotas', 11: 'caballos', 12: 'reyes',
};
export const SUIT_NAMES: Record<Suit, string> = { oros: 'oros', copas: 'copas', espadas: 'espadas', bastos: 'bastos' };

export const rankName = (r: number) => RANK_NAMES[r];
/** Nombre en plural de un rango efectivo (12 → "reyes", 1 → "ases"). */
export const rankPlural = (r: number) => RANK_PLURAL[r];
export const cardName = (c: Card) => `${RANK_NAMES[c.rank]} de ${c.suit}`;
/** Etiqueta corta para la esquina de la carta. */
export const rankShort = (r: Rank): string => (r === 10 ? 'S' : r === 11 ? 'C' : r === 12 ? 'R' : r === 1 ? 'A' : String(r));
/** Texto compacto de una mano: "R R C 7". */
export const handText = (h: Card[]) => h.map((c) => rankShort(c.rank)).join(' ');

/** Crea cartas desde texto compacto, p. ej. "R R C 7" o "12o 3c 11e 7b". Útil en tests y contenido. */
export function parseHand(s: string): Card[] {
  const suits: Suit[] = ['oros', 'copas', 'espadas', 'bastos'];
  return s
    .trim()
    .split(/\s+/)
    .map((tok, i) => {
      const m = tok.match(/^(R|C|S|A|\d{1,2})([oceb])?$/i);
      if (!m) throw new Error('Carta inválida: ' + tok);
      const t = m[1].toUpperCase();
      const rank = (t === 'R' ? 12 : t === 'C' ? 11 : t === 'S' ? 10 : t === 'A' ? 1 : Number(t)) as Rank;
      if (!RANKS.includes(rank)) throw new Error('Rango inválido: ' + tok);
      const suit = m[2] ? suits['oceb'.indexOf(m[2].toLowerCase())] : suits[i % 4];
      return { suit, rank };
    });
}
