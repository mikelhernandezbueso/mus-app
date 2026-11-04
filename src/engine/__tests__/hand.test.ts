import { describe, expect, it } from 'vitest';
import {
  applyAction, currentActor, handFromCards, legalActions, newHand, runUntil, type Action, type HandState,
} from '../hand';
import type { Seat } from '../types';
import { H, R8, R4 } from './helpers';

const act = (st: HandState, ...actions: Action[]) => actions.reduce((s, a) => applyAction(s, a), st);
const P: Action = { type: 'paso' };
const Q: Action = { type: 'quiero' };
const NQ: Action = { type: 'noQuiero' };
const E = (amount = 2): Action => ({ type: 'envido', amount });
const O: Action = { type: 'ordago' };

// Manos de referencia (mano = 0). Equipo 0: asientos 0 y 2. Equipo 1: 1 y 3.
const base = () => [H('R R C 7'), H('A A 4 5'), H('R S S 6'), H('C C 7 4')];
// 0: grande buena, pareja R, 37 · 1: chica, pareja A, 11 · 2: pareja S, 36 · 3: pareja C, 31

describe('reparto y fase de mus', () => {
  it('reparte 4 cartas a cada uno y deja 24 en el mazo', () => {
    const st = newHand(R8, 0, [0, 0], 123);
    expect(st.hands.every((h) => h.length === 4)).toBe(true);
    expect(st.deck).toHaveLength(24);
    const all = [...st.hands.flat(), ...st.deck].map((c) => c.rank + c.suit);
    expect(new Set(all).size).toBe(40);
  });
  it('habla primero la mano', () => {
    expect(currentActor(newHand(R8, 2, [0, 0], 5))).toBe(2);
    expect(currentActor(newHand(R8, 3, [0, 0], 5))).toBe(3);
  });
  it('si alguien corta, empiezan los lances por la grande', () => {
    let st = newHand(R8, 0, [0, 0], 1);
    st = act(st, { type: 'mus' }, { type: 'noMus' });
    expect(st.phase).toBe('apuestas');
    expect(st.bet!.lance).toBe('grande');
    expect(currentActor(st)).toBe(0);
  });
  it('si los cuatro piden mus, todos descartan y se reparte', () => {
    let st = newHand(R8, 1, [0, 0], 9);
    st = act(st, { type: 'mus' }, { type: 'mus' }, { type: 'mus' }, { type: 'mus' });
    expect(st.phase).toBe('descarte');
    expect(currentActor(st)).toBe(1);
    const kept = st.hands[1].slice(2);
    st = act(
      st,
      { type: 'discard', indices: [0, 1] },
      { type: 'discard', indices: [0] },
      { type: 'discard', indices: [0, 1, 2, 3] },
      { type: 'discard', indices: [3] },
    );
    expect(st.phase).toBe('mus');
    expect(st.musRound).toBe(1);
    expect(st.hands.every((h) => h.length === 4)).toBe(true);
    expect(st.hands[1].slice(0, 2)).toEqual(kept);
    expect(st.deck).toHaveLength(24 - 8);
    expect(st.roundDiscards).toHaveLength(8);
  });
  it('hay que descartar al menos una carta y como mucho cuatro', () => {
    let st = newHand(R8, 0, [0, 0], 3);
    st = act(st, { type: 'mus' }, { type: 'mus' }, { type: 'mus' }, { type: 'mus' });
    expect(() => applyAction(st, { type: 'discard', indices: [] })).toThrow();
    expect(() => applyAction(st, { type: 'discard', indices: [0, 0] })).toThrow();
    expect(() => applyAction(st, { type: 'discard', indices: [4] })).toThrow();
  });
  it('si se acaba el mazo se barajan los descartes y no se pierden cartas', () => {
    let st = newHand(R8, 0, [0, 0], 77);
    for (let r = 0; r < 6; r++) {
      st = act(st, { type: 'mus' }, { type: 'mus' }, { type: 'mus' }, { type: 'mus' });
      st = act(st, ...[0, 1, 2, 3].map(() => ({ type: 'discard', indices: [0, 1, 2, 3] }) as Action));
      const all = [...st.hands.flat(), ...st.deck, ...st.discardPile, ...st.roundDiscards].map((c) => c.rank + c.suit);
      expect(all).toHaveLength(40);
      expect(new Set(all).size).toBe(40);
    }
    expect(st.log.some((e) => e.kind === 'reshuffle')).toBe(true);
  });
  it('no se puede envidar durante el mus', () => {
    const st = newHand(R8, 0, [0, 0], 3);
    expect(legalActions(st)).toEqual(['mus', 'noMus']);
    expect(() => applyAction(st, E())).toThrow();
  });
});

describe('envites', () => {
  it('todos pasan en grande → grande en paso', () => {
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), P, P, P, P);
    expect(st.results[0]).toMatchObject({ lance: 'grande', outcome: { kind: 'paso' } });
    expect(st.bet!.lance).toBe('chica');
  });
  it('envido y no quiero de los dos rivales → deje de 1 en el momento', () => {
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), E(), NQ, NQ);
    expect(st.results[0].outcome).toEqual({ kind: 'noQuerido', team: 0, deje: 1 });
    expect(st.scores).toEqual([1, 0]);
  });
  it('tras el primer no quiero responde el compañero', () => {
    let st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), E());
    expect(currentActor(st)).toBe(1);
    st = act(st, NQ);
    expect(currentActor(st)).toBe(3);
    expect(st.phase).toBe('apuestas');
  });
  it('basta con que uno de la pareja quiera', () => {
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), E(), NQ, Q);
    expect(st.results[0].outcome).toEqual({ kind: 'querido', amount: 2 });
  });
  it('responde primero el rival que va a continuación del que envida', () => {
    // 0 pasa, 1 pasa, 2 envida → responde 3 y luego 1
    let st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), P, P, E());
    expect(currentActor(st)).toBe(3);
    st = act(st, NQ);
    expect(currentActor(st)).toBe(1);
  });
  it('envidar más y no quiero → se cobra lo envidado antes', () => {
    // 0 envida 2, 1 sube 5 (total 7), 0 no quiere, 2 no quiere → equipo 1 cobra 2
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), E(2), E(5), NQ, NQ);
    expect(st.results[0].outcome).toEqual({ kind: 'noQuerido', team: 1, deje: 2 });
    expect(st.scores).toEqual([0, 2]);
  });
  it('re-reenvite rechazado cobra el total anterior', () => {
    // 0: 2; 1: +5 (7); 2: +3 (10); 3 y 1 no quieren → equipo 0 cobra 7
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), E(2), E(5), E(3), NQ, NQ);
    expect(st.results[0].outcome).toEqual({ kind: 'noQuerido', team: 0, deje: 7 });
  });
  it('subida querida → al final cobra el total quien gana el lance', () => {
    let st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), E(2), E(5), Q);
    expect(st.results[0].outcome).toEqual({ kind: 'querido', amount: 7 });
    st = runUntil(st, () => P);
    const g = st.recuento!.find((i) => i.lance === 'grande')!;
    expect(g.team).toBe(0);
    expect(g.points).toBe(7);
  });
  it('envite mínimo de 2', () => {
    const st = handFromCards(R8, 0, base(), [0, 0], { cutMus: true });
    expect(() => applyAction(st, E(1))).toThrow();
  });
  it('tras un órdago solo se puede querer o no querer', () => {
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), O);
    expect(legalActions(st)).toEqual(['quiero', 'noQuiero']);
  });
  it('quien envida no responde a su propio envite', () => {
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), E());
    expect(st.bet!.responders).toEqual([1, 3]);
  });
});

describe('órdago', () => {
  it('órdago querido: se ven las cartas y el ganador del lance gana el juego', () => {
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), O, Q);
    expect(st.phase).toBe('terminada');
    expect(st.winner).toBe(0); // R R C 7 gana la grande
    expect(st.results[0].outcome).toEqual({ kind: 'ordago', winner: 0 });
  });
  it('órdago a la chica querido lo gana la mejor chica', () => {
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), P, P, P, P, O, Q);
    expect(st.winner).toBe(1); // A A 4 5
  });
  it('órdago no querido como primer envite → deje de 1', () => {
    const st = act(handFromCards(R8, 0, base(), [10, 10], { cutMus: true }), O, NQ, NQ);
    expect(st.phase).toBe('apuestas');
    expect(st.scores).toEqual([11, 10]);
  });
  it('órdago sobre un envite, no querido → se cobra el envite', () => {
    const st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), E(4), O, NQ, NQ);
    expect(st.results[0].outcome).toEqual({ kind: 'noQuerido', team: 1, deje: 4 });
  });
  it('el órdago gana aunque el rival vaya por delante en el marcador', () => {
    const st = act(handFromCards(R8, 0, base(), [3, 39], { cutMus: true }), O, Q);
    expect(st.winner).toBe(0);
  });
  it('órdago a pares lo decide la mejor jugada de pares, con la mano en el empate', () => {
    const hands = [H('A 4 5 S'), H('R R 4 5'), H('A 6 7 C'), H('R R 6 7')];
    // solo 1 y 3 tienen pares → no se juega; probamos con 0 con pares iguales
    hands[0] = H('R R 6 7');
    let st = handFromCards(R8, 1, hands, [0, 0], { cutMus: true });
    st = act(st, P, P, P, P); // grande
    st = act(st, P, P, P, P); // chica
    expect(st.bet!.lance).toBe('pares');
    expect(st.bet!.participants).toEqual([1, 3, 0]);
    st = act(st, O, Q);
    expect(st.winner).toBe(1); // reyes contra reyes: gana el más cercano a la mano (1)
  });
});

describe('pares y juego: quién habla', () => {
  it('si nadie tiene pares, el lance no se juega', () => {
    const hands = [H('R C 7 4'), H('A 4 5 6'), H('S C 7 6'), H('R S 5 4')];
    const st = act(handFromCards(R8, 0, hands, [0, 0], { cutMus: true }), P, P, P, P, P, P, P, P);
    expect(st.results[2]).toMatchObject({ lance: 'pares', outcome: { kind: 'noSeJuega' } });
  });
  it('si solo una pareja tiene pares, no hay envites y cobra sus jugadas', () => {
    const hands = [H('R R 7 4'), H('A 4 5 6'), H('S S S 6'), H('R C 5 4')];
    const st = runUntil(handFromCards(R8, 0, hands, [0, 0], { cutMus: true }), () => P);
    expect(st.results[2].outcome).toEqual({ kind: 'unaPareja', team: 0 });
    const it = st.recuento!.find((i) => i.lance === 'pares')!;
    expect(it.team).toBe(0);
    expect(it.points).toBe(3); // pareja (1) + medias (2)
  });
  it('en pares solo hablan los que tienen pares', () => {
    const hands = [H('R C 7 4'), H('A A 5 6'), H('S S C 6'), H('R C 5 4')];
    let st = act(handFromCards(R8, 0, hands, [0, 0], { cutMus: true }), P, P, P, P, P, P, P, P);
    expect(st.bet!.lance).toBe('pares');
    expect(st.bet!.participants).toEqual([1, 2]);
    expect(currentActor(st)).toBe(1);
    st = act(st, E());
    expect(st.bet!.responders).toEqual([2]);
  });
  it('si nadie tiene juego se juega al punto', () => {
    const hands = [H('R C 5 4'), H('A A 5 6'), H('S S 4 6'), H('R 5 5 4')];
    const st = act(handFromCards(R8, 0, hands, [0, 0], { cutMus: true }), P, P, P, P, P, P, P, P);
    // pares: 1 (ases), 2 (sotas), 3 (cincos) → se juegan
    const st2 = act(st, P, P, P);
    expect(st2.bet!.lance).toBe('punto');
    expect(st2.bet!.participants).toEqual([0, 1, 2, 3]);
  });
  it('si alguien tiene juego se juega al juego (no al punto)', () => {
    const st = handFromCards(R8, 0, base(), [0, 0], { cutMus: true });
    expect(st.lanceQueue).toEqual(['chica', 'pares', 'juego']);
  });
  it('declaraciones públicas de pares y juego', () => {
    const st = handFromCards(R8, 0, base(), [0, 0], { cutMus: true });
    expect(st.declared!.pares).toEqual([true, true, true, true]);
    expect(st.declared!.juego).toEqual([true, false, true, true]);
  });
  it('en juego solo hablan los que tienen juego', () => {
    let st = act(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), P, P, P, P, P, P, P, P, P, P, P, P);
    expect(st.bet!.lance).toBe('juego');
    expect(st.bet!.participants).toEqual([0, 2, 3]);
  });
  it('a 4 reyes cambia quién tiene juego', () => {
    const hands = [H('3 3 C A'), H('R R C A'), H('A A 4 5'), H('A 4 5 6')];
    expect(handFromCards(R8, 0, hands, [0, 0], { cutMus: true }).lanceQueue.at(-1)).toBe('juego');
    expect(handFromCards(R4, 0, hands, [0, 0], { cutMus: true }).declared!.juego).toEqual([false, true, false, false]);
  });
});

describe('recuento', () => {
  it('mano completa en paso: grande 1, chica 1, pares y juego por jugadas', () => {
    const st = runUntil(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), () => P);
    expect(st.phase).toBe('terminada');
    const by = Object.fromEntries(st.recuento!.map((i) => [i.lance, i]));
    expect(by.grande).toMatchObject({ team: 0, points: 1, winnerSeat: 0 });
    expect(by.chica).toMatchObject({ team: 1, points: 1, winnerSeat: 1 });
    expect(by.pares).toMatchObject({ team: 0, points: 2, winnerSeat: 0 }); // pareja R + pareja S
    expect(by.juego).toMatchObject({ team: 1, points: 3, winnerSeat: 3 }); // la 31 del 3
    expect(st.scores).toEqual([3, 4]);
  });
  it('pares queridos: envite + jugadas de los dos', () => {
    let st = handFromCards(R8, 0, base(), [0, 0], { cutMus: true });
    st = act(st, P, P, P, P, P, P, P, P);
    st = act(st, E(2), Q);
    st = runUntil(st, () => P);
    const p = st.recuento!.find((i) => i.lance === 'pares')!;
    expect(p.points).toBe(4);
    expect(p.team).toBe(0);
  });
  it('pares no queridos: cobra el deje y sus jugadas aunque el rival tenga mejores', () => {
    const hands = [H('4 4 6 7'), H('R R R 5'), H('A 5 6 7'), H('C S 6 7')];
    let st = handFromCards(R8, 0, hands, [0, 0], { cutMus: true });
    st = act(st, P, P, P, P, P, P, P, P); // grande y chica
    expect(st.bet!.participants).toEqual([0, 1]);
    st = act(st, E(2), NQ);
    expect(st.log).toContainEqual({ kind: 'deje', team: 0, points: 1, lance: 'pares' });
    // en juego solo tiene juego la pareja 1 (35 y 33): no se envida y la mano termina
    expect(st.phase).toBe('terminada');
    const p = st.recuento!.find((i) => i.lance === 'pares')!;
    expect(p.team).toBe(0);
    expect(p.points).toBe(1); // su pareja de cuatros
    expect(p.alreadyCounted).toBe(1);
  });
  it('juego querido: envite + valor de los juegos de la pareja ganadora', () => {
    let st = handFromCards(R8, 0, base(), [0, 0], { cutMus: true });
    st = act(st, P, P, P, P, P, P, P, P, P, P, P, P);
    st = act(st, E(2), Q);
    const j = st.recuento!.find((i) => i.lance === 'juego')!;
    expect(j.team).toBe(1);
    expect(j.points).toBe(5); // 2 + la 31 (3)
  });
  it('punto en paso vale 1; querido, lo envidado + 1', () => {
    const hands = [H('R C 5 4'), H('A A 5 6'), H('S S 4 6'), H('R 5 5 4')];
    let st = handFromCards(R8, 0, hands, [0, 0], { cutMus: true });
    let paso = runUntil(st, () => P);
    expect(paso.recuento!.find((i) => i.lance === 'punto')).toMatchObject({ team: 0, points: 1 });
    st = runUntil(st, (s) => (s.bet?.lance === 'punto' && s.bet.stage === 'abrir' ? E(3) : s.bet?.stage === 'responder' ? Q : P));
    expect(st.recuento!.find((i) => i.lance === 'punto')).toMatchObject({ team: 0, points: 4 });
    paso = st;
  });
  it('el deje que llega a 40 gana el juego al instante', () => {
    const st = act(handFromCards(R8, 0, base(), [39, 0], { cutMus: true }), E(), NQ, NQ);
    expect(st.phase).toBe('terminada');
    expect(st.winner).toBe(0);
  });
  it('si las dos parejas llegan a 40, gana la que llega antes en el orden de los lances', () => {
    // equipo 1 gana chica (1) y juego (3); equipo 0 gana grande (1) y pares (2)
    const st = runUntil(handFromCards(R8, 0, base(), [38, 39], { cutMus: true }), () => P);
    // grande → 39; chica → equipo 1 llega a 40 antes que nadie
    expect(st.winner).toBe(1);
  });
  it('la grande se cuenta primero', () => {
    const st = runUntil(handFromCards(R8, 0, base(), [39, 39], { cutMus: true }), () => P);
    expect(st.winner).toBe(0);
  });
  it('juego a 30', () => {
    const r30 = { ...R8, target: 30 as const };
    const st = act(handFromCards(r30, 0, base(), [29, 0], { cutMus: true }), E(), NQ, NQ);
    expect(st.winner).toBe(0);
  });
  it('sin ganador si nadie llega', () => {
    const st = runUntil(handFromCards(R8, 0, base(), [0, 0], { cutMus: true }), () => P);
    expect(st.winner).toBeNull();
  });
});

describe('manos aleatorias: invariantes', () => {
  const seats: Seat[] = [0, 1, 2, 3];
  it.each(Array.from({ length: 12 }, (_, i) => i + 1))('semilla %i: la mano termina y los tantos cuadran', (seed) => {
    let st = newHand(seed % 2 ? R8 : R4, seats[seed % 4], [0, 0], seed * 31);
    const policy = (s: HandState): Action => {
      const legal = legalActions(s);
      const r = (seed * 7 + s.log.length * 13) % 10;
      if (legal.includes('mus')) return s.musRound < 2 && r < 7 ? { type: 'mus' } : { type: 'noMus' };
      if (legal.includes('discard')) return { type: 'discard', indices: [r % 4] };
      if (legal[0] === 'paso') return r < 4 ? E(2) : r < 5 ? O : P;
      return r < 4 ? Q : r < 6 ? E(2) : NQ;
    };
    st = runUntil(st, policy);
    expect(st.phase).toBe('terminada');
    const won = st.scores[0] + st.scores[1];
    expect(won).toBeGreaterThanOrEqual(0);
    if (st.winner === null) {
      const total = st.recuento!.reduce((s, i) => s + i.points + (i.alreadyCounted ?? 0), 0);
      expect(won).toBe(total);
    }
  });
});
