// Revisión "experta": los ejemplos que aparecen en lecciones y reglamento coinciden con el motor.
import { describe, expect, it } from 'vitest';
import {
  compareChica, compareGrande, comparePares, compareJuego, handSum, juegoInfo, paresInfo, parseHand as H,
  DEFAULT_RULES as R8, handFromCards, runUntil, applyAction, type Action, senasForHand,
} from '../../engine';
import { SENAS } from '../senas';
import { GLOSSARY } from '../glossary';

const R4 = { ...R8, variant: '4reyes' as const };

describe('ejemplos de las lecciones', () => {
  it('u4: R R C 5 gana a R R S 7 a la grande', () => expect(compareGrande(H('R R C 5'), H('R R S 7'), R8)).toBeGreaterThan(0));
  it('u5: A A 4 7 gana a A A 5 6 a la chica', () => expect(compareChica(H('A A 4 7'), H('A A 5 6'), R8)).toBeGreaterThan(0));
  it('u6: R R R R gana a R R C C a los pares', () => expect(comparePares(H('R R R R'), H('R R C C'), R8)).toBeGreaterThan(0));
  it('u6: R 3 es pareja a 8 reyes y no a 4', () => {
    expect(paresInfo(H('R 3 S 7'), R8).kind).toBe('pareja');
    expect(paresInfo(H('R 3 S 7'), R4).kind).toBe('none');
  });
  it('u7: R + C + 7 + 4 = 31', () => expect(handSum(H('R C 7 4'), R8)).toBe(31));
  it('u7: 38 y 39 son imposibles con cuatro cartas', () => {
    const vals = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const;
    const sums = new Set<number>();
    for (const a of vals) for (const b of vals) for (const c of vals) for (const d of vals)
      sums.add(handSum(H([a, b, c, d].map(String).map((x) => (x === '10' ? 'S' : x === '11' ? 'C' : x === '12' ? 'R' : x === '1' ? 'A' : x)).join(' ')), R8));
    expect(sums.has(38)).toBe(false);
    expect(sums.has(39)).toBe(false);
    expect(Math.max(...sums)).toBe(40);
  });
  it('u7: valor del juego: 31 = 3, resto = 2', () => {
    expect(juegoInfo(H('R C 7 4'), R8).value).toBe(3);
    expect(juegoInfo(H('R R R R'), R8).value).toBe(2);
  });
  it('u16: a 4 reyes 4-A-A-A gana a 3-3-3-3 a la grande', () => expect(compareGrande(H('4 A A A'), H('3 3 3 3'), R4)).toBeGreaterThan(0));
  it('u16: a 4 reyes el as gana al dos a la chica', () => expect(compareChica(H('A 4 5 6'), H('2 4 5 6'), R4)).toBeGreaterThan(0));
  it('Consultar/juegos: los ejemplos de cada juego suman lo indicado y están ordenados', () => {
    const rows: [number, string][] = [[31, 'R C 7 4'], [32, 'R S 7 5'], [40, 'R C S R'], [37, 'R C S 7'], [36, 'R C S 6'], [35, 'R C S 5'], [34, 'R C S 4'], [33, 'R C 7 6']];
    rows.forEach(([n, h]) => expect(handSum(H(h), R8)).toBe(n));
    for (let i = 0; i < rows.length - 1; i++) expect(compareJuego(H(rows[i][1]), H(rows[i + 1][1]), R8)).toBeGreaterThan(0);
  });
});

describe('ejemplo de mano completa del REGLAMENTO §8', () => {
  it('reproduce los cobros descritos', () => {
    const hands = [H('R R C 7'), H('A A 4 5'), H('R S S 6'), H('C C 7 4')];
    const P: Action = { type: 'paso' };
    let st = handFromCards(R8, 0, hands);
    st = applyAction(st, { type: 'noMus' });
    st = [{ type: 'envido', amount: 2 }, { type: 'noQuiero' }, { type: 'noQuiero' }].reduce((s, a) => applyAction(s, a as Action), st);
    expect(st.scores).toEqual([1, 0]);
    st = [P, P, P, P].reduce((s, a) => applyAction(s, a), st); // chica en paso
    st = [{ type: 'envido', amount: 2 }, { type: 'quiero' }].reduce((s, a) => applyAction(s, a as Action), st);
    st = runUntil(st, () => P);
    const by = Object.fromEntries(st.recuento!.map((i) => [i.lance, i]));
    expect(by.chica).toMatchObject({ team: 1, points: 1 });
    expect(by.pares).toMatchObject({ team: 0, points: 4 });
    expect(by.juego).toMatchObject({ team: 1, points: 3 });
  });
});

describe('señas y glosario', () => {
  it('todas las señas del motor tienen ficha', () => {
    const ids = ['dosReyes', 'tresReyes', 'dosAses', 'tresAses', 'medias', 'duples', 'treintaYUna', 'ciego', 'solomillo'];
    expect(SENAS.map((s) => s.id).sort()).toEqual(ids.sort());
  });
  it('solomillo = tres reyes y un as (medias de reyes + 31)', () => {
    expect(senasForHand(H('R R 3 A'), R8)).toEqual(['solomillo']);
  });
  it('glosario sin términos repetidos', () => {
    expect(new Set(GLOSSARY.map((g) => g.term)).size).toBe(GLOSSARY.length);
  });
});
