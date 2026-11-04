import { describe, expect, it } from 'vitest';
import { advanceGame, amarracos, newGame, piedrasSueltas } from '../game';
import { applyAction, runUntil, type Action } from '../hand';
import { senasForHand } from '../senas';
import { H, R8, R4 } from './helpers';

const P: Action = { type: 'paso' };
const cutAndPass = (s: any): Action =>
  s.phase === 'mus' ? { type: 'noMus' } : s.bet?.stage === 'responder' ? { type: 'quiero' } : P;

describe('partida', () => {
  it('la mano pasa a la derecha en cada mano', () => {
    let g = newGame(R8, 11, 0);
    const manos = [g.mano];
    for (let i = 0; i < 5; i++) {
      g = { ...g, hand: runUntil(g.hand, cutAndPass) };
      g = advanceGame(g);
      manos.push(g.mano);
    }
    expect(manos).toEqual([0, 1, 2, 3, 0, 1]);
  });
  it('los tantos se acumulan entre manos', () => {
    let g = newGame(R8, 5, 0);
    g = { ...g, hand: runUntil(g.hand, cutAndPass) };
    const after = g.hand.scores;
    g = advanceGame(g);
    expect(g.scores).toEqual(after);
    expect(g.hand.startScores).toEqual(after);
  });
  it('al ganar un juego se suma a la vaca y el marcador vuelve a cero', () => {
    let g = newGame({ ...R8, juegosVaca: 2 }, 3, 0);
    g = { ...g, hand: { ...g.hand, startScores: [38, 0], scores: [38, 0] } };
    let h = applyAction(g.hand, { type: 'noMus' });
    h = runUntil(h, (s) => (s.bet?.stage === 'abrir' && s.bet.participants[s.bet.openIdx] % 2 === 0 ? { type: 'ordago' } : { type: 'quiero' }));
    g = advanceGame({ ...g, hand: h });
    expect(g.juegos[0] + g.juegos[1]).toBe(1);
    expect(g.scores).toEqual([0, 0]);
    expect(g.vacaWinner).toBeNull();
  });
  it('la vaca termina al llegar a los juegos necesarios', () => {
    let g = newGame(R8, 3, 0);
    let h = applyAction(g.hand, { type: 'noMus' });
    h = applyAction(h, { type: 'ordago' });
    h = runUntil(h, () => ({ type: 'quiero' }));
    g = advanceGame({ ...g, hand: h });
    expect(g.vacaWinner).not.toBeNull();
  });
  it('amarracos y piedras', () => {
    expect(amarracos(17)).toBe(3);
    expect(piedrasSueltas(17)).toBe(2);
    expect(amarracos(40)).toBe(8);
  });
  it('una partida entera con todos pasando termina', () => {
    let g = newGame(R8, 99, 2);
    let n = 0;
    while (g.vacaWinner === null && n < 200) {
      g = { ...g, hand: runUntil(g.hand, cutAndPass) };
      g = advanceGame(g);
      n++;
    }
    expect(g.vacaWinner).not.toBeNull();
    expect(n).toBeGreaterThan(3);
  });
});

describe('señas', () => {
  it.each([
    ['R R 4 6', ['dosReyes']],
    ['R 3 4 6', ['dosReyes']],
    ['R R R 5', ['tresReyes']],
    ['A A 5 6', ['dosAses']],
    ['A 2 2 6', ['tresAses']],
    ['S S S 6', ['medias']],
    ['R R A A', ['duples']],
    ['4 4 4 4', ['duples']],
    ['R C 7 4', ['treintaYUna']],
    ['R R 7 4', ['dosReyes', 'treintaYUna']],
    ['R R R A', ['solomillo']],
    ['A 4 5 6', ['ciego']],
    ['S S 4 5', []],
    ['R C S 5', []],
  ])('%s → %j', (h, exp) => {
    expect(senasForHand(H(h), R8)).toEqual(exp);
  });
  it('a 4 reyes el tres no es rey', () => {
    expect(senasForHand(H('R 3 5 6'), R4)).toEqual(['ciego']);
  });
});
