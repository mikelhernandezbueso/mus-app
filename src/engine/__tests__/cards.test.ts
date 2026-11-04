import { describe, expect, it } from 'vitest';
import { effRank, fullDeck, juegoValue, parseHand, rankShort, shuffledDeck, handText } from '../cards';
import { makeRng } from '../rng';
import type { Rank } from '../types';

describe('baraja', () => {
  it('tiene 40 cartas distintas', () => {
    const d = fullDeck();
    expect(d).toHaveLength(40);
    expect(new Set(d.map((c) => c.rank + c.suit)).size).toBe(40);
  });
  it('no tiene ochos ni nueves', () => {
    expect(fullDeck().some((c) => (c.rank as number) === 8 || (c.rank as number) === 9)).toBe(false);
  });
  it('barajar con la misma semilla da el mismo orden', () => {
    expect(shuffledDeck(makeRng(42))).toEqual(shuffledDeck(makeRng(42)));
    expect(shuffledDeck(makeRng(42))).not.toEqual(shuffledDeck(makeRng(43)));
  });
});

const valores8: [Rank, number, number][] = [
  [1, 1, 1], [2, 1, 1], [3, 12, 10], [4, 4, 4], [5, 5, 5], [6, 6, 6], [7, 7, 7], [10, 10, 10], [11, 11, 10], [12, 12, 10],
];
const valores4: [Rank, number, number][] = [
  [1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4], [5, 5, 5], [6, 6, 6], [7, 7, 7], [10, 10, 10], [11, 11, 10], [12, 12, 10],
];

describe('valores a 8 reyes', () => {
  it.each(valores8)('carta %i → rango %i, juego %i', (rank, eff, jv) => {
    expect(effRank({ suit: 'oros', rank }, '8reyes')).toBe(eff);
    expect(juegoValue({ suit: 'oros', rank }, '8reyes')).toBe(jv);
  });
});
describe('valores a 4 reyes', () => {
  it.each(valores4)('carta %i → rango %i, juego %i', (rank, eff, jv) => {
    expect(effRank({ suit: 'copas', rank }, '4reyes')).toBe(eff);
    expect(juegoValue({ suit: 'copas', rank }, '4reyes')).toBe(jv);
  });
});

describe('parseHand', () => {
  it('lee figuras y números', () => {
    expect(parseHand('R C S A 7').map((c) => c.rank)).toEqual([12, 11, 10, 1, 7]);
  });
  it('lee palos explícitos', () => {
    expect(parseHand('12o 3c 11e 7b').map((c) => c.suit)).toEqual(['oros', 'copas', 'espadas', 'bastos']);
  });
  it('rechaza cartas inexistentes', () => {
    expect(() => parseHand('8')).toThrow();
  });
  it('texto corto', () => {
    expect(rankShort(12)).toBe('R');
    expect(handText(parseHand('R 3 A 2'))).toBe('R 3 A 2');
  });
});
