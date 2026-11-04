import { describe, expect, it } from 'vitest';
import { advanceGame, applyAction, currentActor, DEFAULT_RULES, handFromCards, isLegal, makeRng, newGame, parseHand, senasForHand, teamOf, type GameState, type Seat } from '../../engine';
import { decide, discardDecision, musDecision, type Level } from '../bot';
import { winProbability } from '../estimate';
import { reviewHand, suggest } from '../tutor';

function playGame(levels: [Level, Level], seed: number, rules = DEFAULT_RULES): GameState {
  const rng = makeRng(seed);
  let g = newGame(rules, seed, (seed % 4) as Seat);
  for (let hands = 0; hands < 80 && g.vacaWinner === null; hands++) {
    let h = g.hand;
    for (let k = 0; k < 400 && h.phase !== 'terminada'; k++) {
      const s = currentActor(h)!;
      const senas = h.declared ? { [(s + 2) % 4]: senasForHand(h.hands[(s + 2) % 4], rules) } : {};
      const d = decide(h, s, { level: levels[teamOf(s)], senas, scores: h.scores, rng });
      expect(isLegal(h, d.action)).toBe(true);
      expect(d.why.length).toBeGreaterThan(5);
      h = applyAction(h, d.action);
    }
    expect(h.phase).toBe('terminada');
    g = advanceGame({ ...g, hand: h });
  }
  return g;
}

describe('bots', () => {
  it.each([1, 2, 3])('partida completa normal vs normal (semilla %i) termina', (seed) => {
    const g = playGame(['normal', 'normal'], seed);
    expect(g.vacaWinner).not.toBeNull();
  });
  it('partida a 4 reyes y a 30 termina', () => {
    const g = playGame(['experto', 'principiante'], 9, { ...DEFAULT_RULES, variant: '4reyes', target: 30 });
    expect(g.vacaWinner).not.toBeNull();
  });
  it('el experto gana más que el principiante', { timeout: 60000 }, () => {
    let wins = 0;
    const N = 12;
    for (let i = 0; i < N; i++) if (playGame(['experto', 'principiante'], 100 + i).vacaWinner === 0) wins++;
    expect(wins).toBeGreaterThanOrEqual(7);
  });
  it('corta el mus con duples, medias de reyes o la 31', () => {
    const rng = makeRng(1);
    const st = handFromCards(DEFAULT_RULES, 0, [parseHand('R R A A'), parseHand('4 5 6 7'), parseHand('4 5 6 7'), parseHand('4 5 6 7')]);
    expect(musDecision(parseHand('R R A A'), st, 0, { level: 'normal', senas: {}, scores: [0, 0], rng }).action.type).toBe('noMus');
    expect(musDecision(parseHand('R R R 5'), st, 0, { level: 'normal', senas: {}, scores: [0, 0], rng }).action.type).toBe('noMus');
    expect(musDecision(parseHand('R C 7 4'), st, 0, { level: 'normal', senas: {}, scores: [0, 0], rng }).action.type).toBe('noMus');
    expect(musDecision(parseHand('C 5 6 4'), st, 0, { level: 'normal', senas: {}, scores: [0, 0], rng }).action.type).toBe('mus');
  });
  it('se descarta al menos de una carta y guarda los reyes', () => {
    const rng = makeRng(2);
    const st = handFromCards(DEFAULT_RULES, 0, [parseHand('R 3 5 6'), parseHand('4 5 6 7'), parseHand('4 5 6 7'), parseHand('4 5 6 7')]);
    const d = discardDecision(parseHand('R 3 5 6'), st, 0, { level: 'normal', senas: {}, scores: [0, 0], rng });
    expect(d.action).toEqual({ type: 'discard', indices: [2, 3] });
    const d2 = discardDecision(parseHand('R R R R'), st, 0, { level: 'normal', senas: {}, scores: [0, 0], rng });
    expect(d2.action.type === 'discard' && d2.action.indices.length).toBe(1);
  });
  it('la probabilidad sube con la seña del compañero', () => {
    const base = { me: 0 as Seat, myHand: parseHand('R C 5 4'), mano: 1 as Seat, rules: DEFAULT_RULES };
    const p0 = winProbability(base, 'grande', 300, 3);
    const p1 = winProbability({ ...base, senas: { 2: ['tresReyes'] } }, 'grande', 300, 3);
    expect(p1).toBeGreaterThan(p0 + 0.15);
  });
  it('con cuatro reyes de mano la grande es segura', () => {
    expect(winProbability({ me: 0, myHand: parseHand('R R 3 3'), mano: 0, rules: DEFAULT_RULES }, 'grande', 200, 1)).toBe(1);
  });
  it('el tutor sugiere jugadas legales y revisa la mano', () => {
    let st = handFromCards(DEFAULT_RULES, 0, [parseHand('R R R C'), parseHand('4 5 6 7'), parseHand('A 5 6 7'), parseHand('S 4 6 7')], [0, 0]);
    const s1 = suggest(st, {}, [0, 0]);
    expect(s1.action.type).toBe('noMus');
    st = applyAction(st, s1.action);
    const s2 = suggest(st, {}, [0, 0]);
    expect(isLegal(st, s2.action)).toBe(true);
    expect(['envido', 'ordago']).toContain(s2.action.type);
    const r = reviewHand([{ phase: 'mus', suggested: s1, taken: { type: 'mus' } }]);
    expect(r.bad).toHaveLength(1);
  });
});
