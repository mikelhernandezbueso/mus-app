import { describe, expect, it } from 'vitest';
import {
  compareChica, compareGrande, compareJuego, comparePares, comparePunto, grandeKey, handSum,
  isReal31, juegoInfo, juegoStrength, lanceWinner, paresCardIndices, paresInfo,
} from '../evaluate';
import type { Seat } from '../types';
import { H, R4, R8, R8real } from './helpers';

const sign = (n: number) => Math.sign(n);

describe('grande a 8 reyes', () => {
  it.each([
    ['R R C 5', 'R R S 7', 1],
    ['R 4 4 4', 'C C C C', 1],
    ['3 4 5 6', 'R 4 5 6', 0], // el tres es rey
    ['R R R R', 'R R R C', 1],
    ['C S 7 6', 'C S 7 7', -1],
    ['A A A A', '2 2 A A', 0], // el dos es as
    ['7 6 5 4', 'S A A A', -1],
    ['R C S 7', 'R C S 7', 0],
    ['3 3 2 2', 'R R A A', 0],
    ['4 4 4 A', '4 4 4 2', 0],
  ])('%s vs %s → %i', (a, b, exp) => {
    expect(sign(compareGrande(H(a), H(b), R8))).toBe(exp);
  });
  it('la clave ordena de mayor a menor', () => {
    expect(grandeKey(H('5 3 A C'), R8)).toEqual([12, 11, 5, 1]);
  });
});

describe('grande a 4 reyes', () => {
  it.each([
    ['3 4 5 6', 'R 4 5 6', -1], // el tres ya no es rey
    ['3 A A A', '2 A A A', 1],
    ['R 3 3 3', 'R 2 2 2', 1],
    ['4 A A A', '3 3 3 3', 1],
  ])('%s vs %s → %i', (a, b, exp) => {
    expect(sign(compareGrande(H(a), H(b), R4))).toBe(exp);
  });
});

describe('chica a 8 reyes', () => {
  it.each([
    ['A A 4 7', 'A A 5 6', 1],
    ['A 2 4 5', 'A A 4 5', 0], // el dos es as
    ['A A A A', 'A A A 4', 1],
    ['4 5 6 7', 'A R R R', -1],
    ['A R R R', 'A C C C', -1],
    ['3 4 5 6', 'R 4 5 6', 0],
    ['A 4 5 S', 'A 4 6 6', 1],
    ['7 7 7 7', '6 R R R', -1],
  ])('%s vs %s → %i', (a, b, exp) => {
    expect(sign(compareChica(H(a), H(b), R8))).toBe(exp);
  });
});

describe('chica a 4 reyes', () => {
  it.each([
    ['A 2 4 5', 'A A 4 5', -1],
    ['A 2 3 4', 'A 2 4 4', 1],
    ['3 3 3 3', '4 4 4 4', 1],
    ['2 2 2 2', 'A R R R', -1],
  ])('%s vs %s → %i', (a, b, exp) => {
    expect(sign(compareChica(H(a), H(b), R4))).toBe(exp);
  });
});

describe('pares: tipo de jugada', () => {
  it.each([
    ['R C S 7', 'R8', 'none', [], 0],
    ['R R S 7', 'R8', 'pareja', [12], 1],
    ['R 3 S 7', 'R8', 'pareja', [12], 1],
    ['R 3 S 7', 'R4', 'none', [], 0],
    ['A 2 S 7', 'R8', 'pareja', [1], 1],
    ['S S S 7', 'R8', 'medias', [10], 2],
    ['R 3 3 7', 'R8', 'medias', [12], 2],
    ['R R A A', 'R8', 'duples', [12, 1], 3],
    ['3 R 2 A', 'R8', 'duples', [12, 1], 3],
    ['R R R R', 'R8', 'duples', [12, 12], 3],
    ['3 3 R R', 'R8', 'duples', [12, 12], 3],
    ['3 3 R R', 'R4', 'duples', [12, 3], 3],
    ['5 5 4 4', 'R8', 'duples', [5, 4], 3],
    ['C C C C', 'R4', 'duples', [11, 11], 3],
    ['2 2 2 A', 'R4', 'medias', [2], 2],
    ['2 2 2 A', 'R8', 'duples', [1, 1], 3],
  ])('%s (%s) → %s', (h, v, kind, ranks, value) => {
    const info = paresInfo(H(h), v === 'R8' ? R8 : R4);
    expect(info.kind).toBe(kind);
    expect(info.ranks).toEqual(ranks);
    expect(info.value).toBe(value);
  });
});

describe('pares: comparación', () => {
  it.each([
    ['A A 4 4', 'R R R 7', 1], // duples ganan a medias
    ['4 4 4 7', 'R R C S', 1], // medias ganan a pareja
    ['R R 4 5', 'C C 4 5', 1],
    ['R R A A', 'C C S S', 1], // duples: primero la pareja más alta
    ['R R A A', 'R R 4 4', -1], // empate en la alta, decide la segunda
    ['R R R R', 'R R C C', 1], // cuatro reyes = duples de reyes-reyes
    ['S S S 4', 'C C C A', -1],
    ['A A 5 7', '2 A 6 7', 0], // a 8 reyes, empate (lo decide la mano)
    ['7 7 S R', '6 6 C R', 1],
    ['R R 4 7', 'R R 5 6', 0],
  ])('%s vs %s → %i', (a, b, exp) => {
    expect(sign(comparePares(H(a), H(b), R8))).toBe(exp);
  });
  it('índices de las cartas de los pares', () => {
    expect(paresCardIndices(H('R 5 3 7'), R8)).toEqual([0, 2]);
    expect(paresCardIndices(H('R 5 3 7'), R4)).toEqual([]);
    expect(paresCardIndices(H('4 4 6 6'), R8)).toEqual([0, 1, 2, 3]);
  });
});

describe('juego y punto', () => {
  it.each([
    ['R R C A', 'R8', 31, true, 3],
    ['R C S 2', 'R8', 31, true, 3],
    ['R C S 2', 'R4', 32, true, 2],
    ['R R R R', 'R8', 40, true, 2],
    ['3 3 3 3', 'R8', 40, true, 2],
    ['3 3 3 3', 'R4', 12, false, 0],
    ['R R 7 4', 'R8', 31, true, 3],
    ['R R 5 5', 'R8', 30, false, 0],
    ['7 7 7 S', 'R8', 31, true, 3],
    ['R C 6 6', 'R8', 32, true, 2],
    ['A A A A', 'R8', 4, false, 0],
    ['R 3 7 A', 'R4', 21, false, 0],
    ['R 3 7 A', 'R8', 28, false, 0],
  ])('%s (%s) suma %i', (h, v, sum, has, value) => {
    const j = juegoInfo(H(h), v === 'R8' ? R8 : R4);
    expect(j.sum).toBe(sum);
    expect(j.hasJuego).toBe(has);
    expect(j.value).toBe(value);
  });

  it('el orden de los juegos es 31, 32, 40, 37, 36, 35, 34, 33', () => {
    const bySum: Record<number, string> = {
      31: 'R C 7 4', 32: 'R S 7 5', 40: 'R R C S', 37: 'R C 7 S', 36: 'R C S 6', 35: 'R C S 5', 34: 'R C S 4', 33: 'R C 7 6',
    };
    const order = [31, 32, 40, 37, 36, 35, 34, 33];
    for (const [sum, h] of Object.entries(bySum)) expect(handSum(H(h), R8)).toBe(Number(sum));
    for (let i = 0; i < order.length - 1; i++) {
      expect(compareJuego(H(bySum[order[i]]), H(bySum[order[i + 1]]), R8)).toBeGreaterThan(0);
    }
  });

  it.each([
    ['R R C A', 'R R R R', 1], // 31 gana a 40
    ['R R R R', 'R R 7 6', 1], // 40 gana a 33
    ['R R C 2', 'R R 7 4', 0], // dos 31: empate (decide la mano)
    ['R R 5 5', 'R R 7 4', -1], // sin juego pierde
    ['R C 7 6', 'R C S 4', -1], // 33 pierde con 34
  ])('juego %s vs %s → %i', (a, b, exp) => {
    expect(sign(compareJuego(H(a), H(b), R8))).toBe(exp);
  });

  it.each([
    ['R R 5 5', 'R R 7 2', 1], // 30 > 28
    ['A A A A', 'A A A 4', -1],
    ['R S 7 A', 'C C 6 2', 1], // 28 vs 27
    ['R 4 4 4', 'S 7 5 A', -1], // 22 < 23
  ])('punto %s vs %s', (a, b, exp) => {
    expect(sign(comparePunto(H(a), H(b), R8))).toBe(exp);
  });
});

describe('31 real', () => {
  it('se reconoce tres sietes y una figura', () => {
    expect(isReal31(H('7 7 7 S'), R8)).toBe(true);
    expect(isReal31(H('7 7 7 R'), R8)).toBe(true);
    expect(isReal31(H('7 7 7 3'), R8)).toBe(true);
    expect(isReal31(H('7 7 7 3'), R4)).toBe(false);
    expect(isReal31(H('R C A 7'), R8)).toBe(false);
  });
  it('desactivada: la real es una 31 normal y empata con otra 31', () => {
    expect(juegoInfo(H('7 7 7 S'), R8).isReal).toBe(false);
    expect(compareJuego(H('7 7 7 S'), H('R R C A'), R8)).toBe(0);
  });
  it('activada: la real gana a cualquier 31', () => {
    expect(juegoInfo(H('7 7 7 S'), R8real).isReal).toBe(true);
    expect(compareJuego(H('7 7 7 S'), H('R R C A'), R8real)).toBeGreaterThan(0);
    expect(juegoStrength(juegoInfo(H('7 7 7 C'), R8real))).toBe(100);
  });
  it('activada: la real gana incluso a la 31 de mano', () => {
    const hands = [H('R R C A'), H('7 7 7 S'), H('A A 4 4'), H('A 5 5 4')];
    expect(lanceWinner('juego', hands, 0, R8real, [0, 1])).toBe(1);
    expect(lanceWinner('juego', hands, 0, R8, [0, 1])).toBe(0);
  });
  it('vale 3 tantos como cualquier 31', () => {
    expect(juegoInfo(H('7 7 7 S'), R8real).value).toBe(3);
  });
});

describe('empates: gana el más cercano a la mano', () => {
  const same = [H('R C 7 4'), H('R C 7 4'), H('R C 7 4'), H('R C 7 4')];
  it.each([0, 1, 2, 3] as Seat[])('con mano %i gana la mano en todos los lances', (mano) => {
    for (const l of ['grande', 'chica', 'pares', 'juego', 'punto'] as const) {
      expect(lanceWinner(l, same, mano, R8)).toBe(mano);
    }
  });
  it('si la mano no participa, gana el siguiente a su derecha', () => {
    const hands = [H('A 4 5 6'), H('R R 4 5'), H('R R 6 7'), H('R R 5 6')];
    // pares de reyes en 1, 2 y 3; mano 0 sin pares → gana 1
    expect(lanceWinner('pares', hands, 0, R8, [1, 2, 3])).toBe(1);
    // con mano 2: orden 2,3,0,1 → gana 2
    expect(lanceWinner('pares', hands, 2, R8, [2, 3, 1])).toBe(2);
    // con mano 3: orden 3,0,1,2 → gana 3
    expect(lanceWinner('pares', hands, 3, R8, [3, 1, 2])).toBe(3);
  });
  it('la mejor jugada gana aunque no sea mano', () => {
    const hands = [H('R C 7 4'), H('R R R 4'), H('A 4 5 6'), H('S 4 5 6')];
    expect(lanceWinner('grande', hands, 0, R8)).toBe(1);
    expect(lanceWinner('chica', hands, 0, R8)).toBe(2);
  });
  it('empate de chica a 8 reyes entre as y dos: gana la mano', () => {
    const hands = [H('2 4 5 6'), H('A 4 5 6'), H('R R R R'), H('R R R R')];
    expect(lanceWinner('chica', hands, 1, R8)).toBe(1);
    expect(lanceWinner('chica', hands, 0, R8)).toBe(0);
    // a 4 reyes el as es mejor que el dos
    expect(lanceWinner('chica', hands, 0, R4)).toBe(1);
  });
});
