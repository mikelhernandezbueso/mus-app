// Máquina de estados de una mano de mus: mus → descartes → lances con envites → recuento.
import { fullDeck, shuffledDeck } from './cards';
import { canPlayLance, hasJuego, hasPares, lanceWinner } from './evaluate';
import { makeRng } from './rng';
import { computeRecuento, type RecuentoItem } from './scoring';
import type { Card, LanceId, Rules, Seat, Team } from './types';
import { orderFrom, teamOf } from './types';

export type Action =
  | { type: 'mus' }
  | { type: 'noMus' }
  | { type: 'discard'; indices: number[] }
  | { type: 'paso' }
  /** Envidar (si no hay envite) o envidar más (si lo hay). `amount` = tantos que se añaden. */
  | { type: 'envido'; amount: number }
  | { type: 'ordago' }
  | { type: 'quiero' }
  | { type: 'noQuiero' };

export type ActionType = Action['type'];

export type LanceOutcome =
  | { kind: 'noSeJuega' }
  | { kind: 'unaPareja'; team: Team }
  | { kind: 'paso' }
  | { kind: 'querido'; amount: number }
  | { kind: 'noQuerido'; team: Team; deje: number }
  | { kind: 'ordago'; winner: Seat };

export interface LanceResult {
  lance: LanceId;
  outcome: LanceOutcome;
  /** Asientos que tenían voz en el lance. */
  participants: Seat[];
}

export interface BetRound {
  lance: LanceId;
  participants: Seat[];
  stage: 'abrir' | 'responder';
  openIdx: number;
  /** Total envidado en este momento (0 si nadie ha envidado). */
  total: number;
  /** Lo que había envidado antes del último envite (base del deje). */
  previous: number;
  ordago: boolean;
  bettor: Seat | null;
  /** Cola de jugadores que deben responder al último envite. */
  responders: Seat[];
}

export type HandEvent =
  | { kind: 'mus'; seat: Seat }
  | { kind: 'noMus'; seat: Seat }
  | { kind: 'discard'; seat: Seat; count: number }
  | { kind: 'reparto'; round: number }
  | { kind: 'reshuffle' }
  | { kind: 'lanceStart'; lance: LanceId }
  | { kind: 'declare'; lance: 'pares' | 'juego'; seat: Seat; has: boolean }
  | { kind: 'paso'; seat: Seat; lance: LanceId }
  | { kind: 'envido'; seat: Seat; lance: LanceId; amount: number; total: number; raise: boolean }
  | { kind: 'ordago'; seat: Seat; lance: LanceId }
  | { kind: 'quiero'; seat: Seat; lance: LanceId }
  | { kind: 'noQuiero'; seat: Seat; lance: LanceId }
  | { kind: 'lanceEnd'; lance: LanceId; outcome: LanceOutcome }
  | { kind: 'deje'; team: Team; points: number; lance: LanceId }
  | { kind: 'fin'; winner: Team | null };

export type Phase = 'mus' | 'descarte' | 'apuestas' | 'terminada';

export interface HandState {
  rules: Rules;
  mano: Seat;
  seed: number;
  hands: Card[][];
  deck: Card[];
  discardPile: Card[];
  roundDiscards: Card[];
  phase: Phase;
  musRound: number;
  musTurn: number;
  discardTurn: number;
  /** Descartes elegidos en la ronda actual (índices), para repartir al final de la ronda. */
  pendingDiscards: (number[] | null)[];
  lanceQueue: LanceId[];
  bet: BetRound | null;
  results: LanceResult[];
  /** ¿Quién declaró pares / juego? (información pública tras cortar el mus). */
  declared: { pares: boolean[]; juego: boolean[] } | null;
  startScores: [number, number];
  /** Marcador en vivo (incluye los dejes, que se cobran en el momento). */
  scores: [number, number];
  /** Pareja que ha ganado el juego durante la mano (por deje, órdago o recuento). */
  winner: Team | null;
  recuento: RecuentoItem[] | null;
  log: HandEvent[];
  reshuffles: number;
}

/** Reparte una mano nueva. */
export function newHand(rules: Rules, mano: Seat, scores: [number, number], seed: number): HandState {
  const rng = makeRng(seed);
  const deck = shuffledDeck(rng);
  const hands: Card[][] = [[], [], [], []];
  const order = orderFrom(mano);
  for (let round = 0; round < 4; round++) for (const s of order) hands[s].push(deck.pop()!);
  return {
    rules,
    mano,
    seed,
    hands,
    deck,
    discardPile: [],
    roundDiscards: [],
    phase: 'mus',
    musRound: 0,
    musTurn: 0,
    discardTurn: 0,
    pendingDiscards: [null, null, null, null],
    lanceQueue: [],
    bet: null,
    results: [],
    declared: null,
    startScores: [...scores] as [number, number],
    scores: [...scores] as [number, number],
    winner: null,
    recuento: null,
    log: [],
    reshuffles: 0,
  };
}

/** Crea una mano con cartas fijas (tests y ejercicios). */
export function handFromCards(
  rules: Rules,
  mano: Seat,
  hands: Card[][],
  scores: [number, number] = [0, 0],
  opts: { cutMus?: boolean } = {},
): HandState {
  const st = newHand(rules, mano, scores, 1);
  st.hands = hands.map((h) => h.slice());
  // El mazo: las cartas que no están en las manos.
  const used = new Set(hands.flat().map((c) => c.rank + c.suit));
  st.deck = shuffleWith(fullDeck().filter((c) => !used.has(c.rank + c.suit)), makeRng(99));
  if (opts.cutMus) startLances(st);
  return st;
}

export function currentActor(st: HandState): Seat | null {
  const order = orderFrom(st.mano);
  switch (st.phase) {
    case 'mus':
      return order[st.musTurn];
    case 'descarte':
      return order[st.discardTurn];
    case 'apuestas': {
      const b = st.bet!;
      return b.stage === 'abrir' ? b.participants[b.openIdx] : b.responders[0];
    }
    default:
      return null;
  }
}

export function currentLance(st: HandState): LanceId | null {
  return st.phase === 'apuestas' ? st.bet!.lance : null;
}

/** Tipos de acción legales para el jugador que tiene la palabra. */
export function legalActions(st: HandState): ActionType[] {
  switch (st.phase) {
    case 'mus':
      return ['mus', 'noMus'];
    case 'descarte':
      return ['discard'];
    case 'apuestas': {
      const b = st.bet!;
      if (b.stage === 'abrir') return ['paso', 'envido', 'ordago'];
      if (b.ordago) return ['quiero', 'noQuiero'];
      return ['quiero', 'noQuiero', 'envido', 'ordago'];
    }
    default:
      return [];
  }
}

export function isLegal(st: HandState, a: Action): boolean {
  if (!legalActions(st).includes(a.type)) return false;
  if (a.type === 'envido') return Number.isInteger(a.amount) && a.amount >= 2;
  if (a.type === 'discard') {
    const u = new Set(a.indices);
    return u.size === a.indices.length && u.size >= 1 && u.size <= 4 && a.indices.every((i) => i >= 0 && i < 4);
  }
  return true;
}

const clone = (st: HandState): HandState => structuredClone(st);

/** Aplica la acción del jugador con la palabra y devuelve un estado nuevo. */
export function applyAction(prev: HandState, a: Action): HandState {
  if (!isLegal(prev, a)) throw new Error(`Acción ilegal ${JSON.stringify(a)} en fase ${prev.phase}`);
  const st = clone(prev);
  const seat = currentActor(st)!;
  const order = orderFrom(st.mano);

  if (st.phase === 'mus') {
    if (a.type === 'mus') {
      st.log.push({ kind: 'mus', seat });
      st.musTurn++;
      if (st.musTurn === 4) {
        st.phase = 'descarte';
        st.discardTurn = 0;
        st.pendingDiscards = [null, null, null, null];
        st.discardPile.push(...st.roundDiscards);
        st.roundDiscards = [];
      }
    } else {
      st.log.push({ kind: 'noMus', seat });
      startLances(st);
    }
    return st;
  }

  if (st.phase === 'descarte' && a.type === 'discard') {
    st.pendingDiscards[seat] = [...a.indices].sort((x, y) => x - y);
    st.log.push({ kind: 'discard', seat, count: a.indices.length });
    st.discardTurn++;
    if (st.discardTurn === 4) dealReplacements(st, order);
    return st;
  }

  if (st.phase === 'apuestas') {
    betAction(st, seat, a);
    return st;
  }
  throw new Error('Acción no aplicable');
}

function drawCard(st: HandState): Card {
  if (st.deck.length === 0) {
    // Se barajan los descartes anteriores; los de esta ronda solo si no queda otra.
    let pool = st.discardPile;
    st.discardPile = [];
    if (pool.length === 0) {
      pool = st.roundDiscards;
      st.roundDiscards = [];
    }
    const rng = makeRng(st.seed + 7919 * (++st.reshuffles));
    st.deck = shuffleWith(pool, rng);
    st.log.push({ kind: 'reshuffle' });
  }
  return st.deck.pop()!;
}

function shuffleWith(cards: Card[], rng: () => number): Card[] {
  const a = cards.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealReplacements(st: HandState, order: Seat[]) {
  // Primero todos se descartan…
  for (const s of order) {
    const idx = st.pendingDiscards[s]!;
    const kept = st.hands[s].filter((_, i) => !idx.includes(i));
    st.roundDiscards.push(...st.hands[s].filter((_, i) => idx.includes(i)));
    st.hands[s] = kept;
  }
  // …y después el postre reparte empezando por la mano.
  for (const s of order) {
    const n = st.pendingDiscards[s]!.length;
    for (let k = 0; k < n; k++) st.hands[s].push(drawCard(st));
  }
  st.musRound++;
  st.log.push({ kind: 'reparto', round: st.musRound });
  st.phase = 'mus';
  st.musTurn = 0;
}

export function startLances(st: HandState) {
  const r = st.rules;
  st.declared = {
    pares: st.hands.map((h) => hasPares(h, r)),
    juego: st.hands.map((h) => hasJuego(h, r)),
  };
  const anyJuego = st.declared.juego.some(Boolean);
  st.lanceQueue = ['grande', 'chica', 'pares', anyJuego ? 'juego' : 'punto'];
  st.phase = 'apuestas';
  nextLance(st);
}

function nextLance(st: HandState) {
  st.bet = null;
  while (st.lanceQueue.length > 0) {
    const lance = st.lanceQueue.shift()!;
    st.log.push({ kind: 'lanceStart', lance });
    if (lance === 'pares' || lance === 'juego') {
      for (const s of orderFrom(st.mano))
        st.log.push({ kind: 'declare', lance, seat: s, has: st.declared![lance][s] });
    }
    const participants = orderFrom(st.mano).filter((s) => canPlayLance(lance, st.hands[s], st.rules));
    if (participants.length === 0) {
      finishLance(st, { lance, outcome: { kind: 'noSeJuega' }, participants });
      continue;
    }
    const teams = new Set(participants.map(teamOf));
    if (teams.size === 1) {
      finishLance(st, { lance, outcome: { kind: 'unaPareja', team: teamOf(participants[0]) }, participants });
      continue;
    }
    st.bet = {
      lance,
      participants,
      stage: 'abrir',
      openIdx: 0,
      total: 0,
      previous: 0,
      ordago: false,
      bettor: null,
      responders: [],
    };
    return;
  }
  // No quedan lances: recuento.
  finishHand(st);
}

function finishLance(st: HandState, res: LanceResult) {
  st.results.push(res);
  st.log.push({ kind: 'lanceEnd', lance: res.lance, outcome: res.outcome });
}

/** Rivales de `seat` con voz en el lance, en orden de habla a partir de `seat`. */
function respondersAfter(b: BetRound, seat: Seat): Seat[] {
  const t = teamOf(seat);
  return orderFrom(seat).filter((s) => teamOf(s) !== t && b.participants.includes(s));
}

function betAction(st: HandState, seat: Seat, a: Action) {
  const b = st.bet!;
  const lance = b.lance;
  if (b.stage === 'abrir') {
    if (a.type === 'paso') {
      st.log.push({ kind: 'paso', seat, lance });
      b.openIdx++;
      if (b.openIdx >= b.participants.length) {
        finishLance(st, { lance, outcome: { kind: 'paso' }, participants: b.participants });
        nextLance(st);
      }
      return;
    }
    b.stage = 'responder';
    b.previous = 0;
    b.bettor = seat;
    if (a.type === 'envido') {
      b.total = a.amount;
      st.log.push({ kind: 'envido', seat, lance, amount: a.amount, total: b.total, raise: false });
    } else {
      b.ordago = true;
      st.log.push({ kind: 'ordago', seat, lance });
    }
    b.responders = respondersAfter(b, seat);
    return;
  }
  // Respondiendo a un envite.
  if (a.type === 'quiero') {
    st.log.push({ kind: 'quiero', seat, lance });
    if (b.ordago) {
      const winner = lanceWinner(lance, st.hands, st.mano, st.rules, b.participants);
      finishLance(st, { lance, outcome: { kind: 'ordago', winner }, participants: b.participants });
      st.winner = teamOf(winner);
      endHand(st);
      return;
    }
    finishLance(st, { lance, outcome: { kind: 'querido', amount: b.total }, participants: b.participants });
    nextLance(st);
    return;
  }
  if (a.type === 'noQuiero') {
    st.log.push({ kind: 'noQuiero', seat, lance });
    b.responders.shift();
    if (b.responders.length > 0) return; // le toca al compañero
    const team = teamOf(b.bettor!);
    const deje = b.previous > 0 ? b.previous : 1;
    finishLance(st, { lance, outcome: { kind: 'noQuerido', team, deje }, participants: b.participants });
    st.scores[team] += deje;
    st.log.push({ kind: 'deje', team, points: deje, lance });
    if (st.scores[team] >= st.rules.target) {
      st.winner = team;
      endHand(st);
      return;
    }
    nextLance(st);
    return;
  }
  // Envidar más u órdago.
  b.previous = b.total;
  b.bettor = seat;
  if (a.type === 'envido') {
    b.total += a.amount;
    st.log.push({ kind: 'envido', seat, lance, amount: a.amount, total: b.total, raise: true });
  } else {
    b.ordago = true;
    st.log.push({ kind: 'ordago', seat, lance });
  }
  b.responders = respondersAfter(b, seat);
}

function finishHand(st: HandState) {
  const { items, scores, winner } = computeRecuento(st);
  st.recuento = items;
  st.scores = scores;
  st.winner = winner;
  endHand(st);
}

function endHand(st: HandState) {
  st.phase = 'terminada';
  st.bet = null;
  st.log.push({ kind: 'fin', winner: st.winner });
}

/** Juega automáticamente con una política hasta que le toque a `stopAt` o termine. */
export function runUntil(
  st: HandState,
  policy: (st: HandState, seat: Seat) => Action,
  stopAt?: (st: HandState, seat: Seat) => boolean,
  maxSteps = 500,
): HandState {
  let s = st;
  for (let i = 0; i < maxSteps && s.phase !== 'terminada'; i++) {
    const seat = currentActor(s)!;
    if (stopAt && stopAt(s, seat)) return s;
    s = applyAction(s, policy(s, seat));
  }
  return s;
}
