import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, compareLance, lanceWinner } from '../../engine';
import { UNITS } from '../../content/units';
import { QUIZ } from '../../content/quiz';
import { GENERATORS, generate } from '../generators';
import type { Exercise } from '../types';

function checkExercise(e: Exercise) {
  expect(e.prompt.length).toBeGreaterThan(3);
  if (e.kind === 'choice') {
    const ids = e.options.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(e.answer);
    expect(e.explain.length).toBeGreaterThan(3);
  } else if (e.kind === 'tap') {
    expect(e.answer.every((i) => i >= 0 && i < e.cards.length)).toBe(true);
  } else if (e.kind === 'order') {
    expect([...e.answer].sort()).toEqual(e.items.map((i) => i.id).sort());
  } else if (e.kind === 'match') {
    expect(e.pairs.length).toBeGreaterThanOrEqual(3);
    expect(new Set(e.pairs.map((p) => p.left)).size).toBe(e.pairs.length);
  } else if (e.kind === 'multi') {
    e.parts.forEach(checkExercise);
  }
}

describe('todos los pasos del temario generan ejercicios válidos', () => {
  for (const u of UNITS)
    for (const l of u.lessons)
      it(`${l.id} ${l.title}`, () => {
        for (const step of l.steps) {
          if (step.t !== 'ex') continue;
          for (let seed = 1; seed <= 6; seed++) {
            const e = generate({ gen: step.gen, seed: seed * 7919, opts: step.opts, variant: step.variant, real31: step.real31 }, DEFAULT_RULES);
            checkExercise(e);
          }
        }
      });
});

describe('cada generador funciona con muchas semillas', () => {
  for (const gen of Object.keys(GENERATORS))
    it(gen, () => {
      for (let seed = 1; seed <= 25; seed++) checkExercise(generate({ gen, seed }, DEFAULT_RULES));
      for (let seed = 1; seed <= 5; seed++) checkExercise(generate({ gen, seed, variant: '4reyes' }, DEFAULT_RULES));
    });
});

describe('las respuestas coinciden con el motor', () => {
  it('quién gana a la grande', () => {
    for (let seed = 1; seed < 40; seed++) {
      const e = generate({ gen: 'grandeWinner', seed, opts: { n: 4 } }, DEFAULT_RULES);
      if (e.kind !== 'choice') throw new Error();
      const hands = e.hands!.map((h) => h.cards);
      const mano = e.hands!.find((h) => h.mano)!.seat;
      expect(String(lanceWinner('grande', hands, mano, DEFAULT_RULES))).toBe(e.answer);
    }
  });
  it('ordenar manos respeta la comparación', () => {
    for (let seed = 1; seed < 30; seed++) {
      const e = generate({ gen: 'orderHands', seed, opts: { lance: 'chica' } }, DEFAULT_RULES);
      if (e.kind !== 'order') throw new Error();
      const byId = Object.fromEntries(e.items.map((i) => [i.id, i.cards!]));
      for (let k = 0; k < 2; k++) expect(compareLance('chica', byId[e.answer[k]], byId[e.answer[k + 1]], DEFAULT_RULES)).toBeGreaterThan(0);
    }
  });
  it('mismas semillas → mismo ejercicio (repaso reproducible)', () => {
    const a = generate({ gen: 'examHand', seed: 42 }, DEFAULT_RULES);
    const b = generate({ gen: 'examHand', seed: 42 }, DEFAULT_RULES);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('el banco de teoría no tiene ids repetidos', () => {
    expect(new Set(QUIZ.map((q) => q.id)).size).toBe(QUIZ.length);
  });
  it('los pasos de teoría apuntan a preguntas existentes', () => {
    for (const u of UNITS) for (const l of u.lessons) for (const s of l.steps)
      if (s.t === 'ex' && s.gen === 'quiz') expect(QUIZ.some((q) => q.id === s.opts!.id)).toBe(true);
  });
});
