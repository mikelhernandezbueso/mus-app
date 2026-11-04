// Generadores de ejercicios. La respuesta SIEMPRE la calcula el motor, nunca está escrita a mano.
import {
  applyAction, compareLance, describeJuego, describePares, effRank, explainHighLow, fullDeck, handFromCards,
  handSum, hasJuego, hasPares, juegoInfo, juegoValue, lanceItem, lanceWinner, LANCE_NAMES, LANCE_TITLE,
  makeRng, paresCardIndices, paresInfo, pick, randInt, rankName, rankPlural, runUntil, senasForHand, shuffle,
  teamOf, type Action, type Card, type LanceId, type Rng, type Rules, type Seat,
} from '../engine';
import { winProbability } from '../ai/estimate';
import { GLOSSARY } from '../content/glossary';
import { SENAS, senaById } from '../content/senas';
import { QUIZ } from '../content/quiz';
import type { ChoiceExercise, Exercise, ExerciseSpec, Option, ShownHand } from './types';

export const SEAT_NAMES = ['Tú', 'Iker', 'Maite', 'Jon'] as const;
export const TEAM_NAMES = ['vosotros (Tú y Maite)', 'ellos (Iker y Jon)'] as const;

type Opts = Record<string, string | number | boolean>;
type Gen = (rng: Rng, rules: Rules, opts: Opts, spec: ExerciseSpec) => Exercise;

// ---------- utilidades ----------

const ck = (c: Card) => c.rank + c.suit;

function deal(rng: Rng, n: number): Card[][] {
  const d = shuffle(fullDeck(), rng);
  return Array.from({ length: n }, (_, i) => d.slice(i * 4, i * 4 + 4));
}

function dealWhere(rng: Rng, n: number, pred: (h: Card[][]) => boolean, tries = 4000): Card[][] {
  for (let i = 0; i < tries; i++) {
    const h = deal(rng, n);
    if (pred(h)) return h;
  }
  throw new Error('No se pudo generar el ejercicio');
}

function handWhere(rng: Rng, pred: (h: Card[]) => boolean): Card[] {
  return dealWhere(rng, 1, (hs) => pred(hs[0]))[0];
}

/** Ordena la mano para mostrarla (de mayor a menor según la grande). */
const sortHand = (h: Card[], r: Rules) => h.slice().sort((a, b) => effRank(b, r) - effRank(a, r) || b.rank - a.rank);

function numberOptions(rng: Rng, answer: number, pool: number[], n = 4): Option[] {
  const set = new Set<number>([answer]);
  const cand = shuffle(pool.filter((x) => x !== answer), rng);
  for (const c of cand) {
    if (set.size >= n) break;
    set.add(c);
  }
  return [...set].sort((a, b) => a - b).map((x) => ({ id: String(x), label: String(x) }));
}

const seatsFor = (n: number): Seat[] => (n === 2 ? [0, 1] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3]);

function shown(hands: Card[][], seats: Seat[], mano: Seat, rules: Rules, note?: (s: Seat) => string | undefined): ShownHand[] {
  return seats.map((s, i) => ({
    seat: s,
    name: SEAT_NAMES[s],
    cards: sortHand(hands[i], rules),
    mano: s === mano,
    note: note?.(s),
  }));
}

/** Coloca las manos en un array indexado por asiento (para el motor). */
function bySeat(hands: Card[][], seats: Seat[]): Card[][] {
  const out: Card[][] = [[], [], [], []];
  seats.forEach((s, i) => (out[s] = hands[i]));
  // Asientos vacíos: manos neutras imposibles de ganar no hacen falta porque filtramos por asientos.
  return out;
}

const nameOpts = (seats: Seat[]): Option[] => seats.map((s) => ({ id: String(s), label: SEAT_NAMES[s] }));

function manoText(mano: Seat, seats: Seat[]): string {
  return seats.includes(mano) ? `${SEAT_NAMES[mano]} es mano.` : '';
}


/** Mano con los mismos rangos efectivos pero otras cartas (para crear empates). */
function twinHand(rng: Rng, h: Card[], used: Card[], rules: Rules): Card[] | null {
  const taken = new Set(used.map(ck));
  const out: Card[] = [];
  for (const c of h) {
    const cands = shuffle(
      fullDeck().filter((d) => !taken.has(ck(d)) && effRank(d, rules) === effRank(c, rules)),
      rng,
    );
    if (!cands.length) return null;
    out.push(cands[0]);
    taken.add(ck(cands[0]));
  }
  return out;
}

const variantNote = (r: Rules) => (r.variant === '8reyes' ? 'a 8 reyes' : 'a 4 reyes');

// ---------- generadores ----------

const cardValue: Gen = (rng, rules, opts, spec) => {
  const tricky = opts.tricky === true;
  const ranks = tricky ? [1, 2, 3, 3, 2, 10, 11, 12, 7] : [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const rank = pick(rng, ranks);
  const card = { suit: pick(rng, ['oros', 'copas', 'espadas', 'bastos'] as const), rank } as Card;
  const v = juegoValue(card, rules);
  let explain: string;
  if (rules.variant === '8reyes' && rank === 3) explain = 'A 8 reyes el tres es un rey, así que vale 10.';
  else if (rules.variant === '8reyes' && rank === 2) explain = 'A 8 reyes el dos es un as, así que vale 1.';
  else if (rank >= 10) explain = 'Las figuras (sota, caballo y rey) valen 10.';
  else if (rank === 1) explain = 'El as vale 1.';
  else explain = `El ${rankName(rank)} vale su número: ${rank}.`;
  return {
    kind: 'choice', spec, rules, cards: [card],
    prompt: `¿Cuánto vale esta carta para el juego (${variantNote(rules)})?`,
    options: numberOptions(rng, v, [1, 2, 3, 4, 5, 6, 7, 10]),
    answer: String(v), explain,
  };
};

const cardEquiv: Gen = (rng, rules, _opts, spec) => {
  const rank = pick(rng, [1, 2, 3, 3, 2, 10, 11, 12, 4, 7] as const);
  const card = { suit: pick(rng, ['oros', 'copas', 'espadas', 'bastos'] as const), rank } as Card;
  const e = effRank(card, rules);
  const cat = e === 12 ? 'rey' : e === 11 ? 'caballo' : e === 10 ? 'sota' : e === 1 ? 'as' : 'num';
  const options: Option[] = [
    { id: 'rey', label: 'Como un rey' },
    { id: 'caballo', label: 'Como un caballo' },
    { id: 'as', label: 'Como un as' },
    { id: 'num', label: 'Como su número' },
  ];
  if (cat === 'sota') options[1] = { id: 'sota', label: 'Como una sota' };
  let explain = '';
  if (rules.variant === '8reyes' && rank === 3) explain = 'A 8 reyes, los treses son reyes en todo: grande, chica, pares y juego.';
  else if (rules.variant === '8reyes' && rank === 2) explain = 'A 8 reyes, los doses son ases en todo.';
  else if (rank === 3 || rank === 2) explain = `A 4 reyes, el ${rankName(rank)} es solo un ${rankName(rank)}.`;
  else explain = cat === 'num' ? 'Es una carta normal: cuenta por su número.' : `Es ${cat === 'as' ? 'un as' : cat === 'sota' ? 'una sota' : 'un ' + cat}.`;
  return {
    kind: 'choice', spec, rules, cards: [card],
    prompt: `¿Cómo cuenta esta carta ${variantNote(rules)}?`,
    options, answer: cat, explain,
  };
};

function winnerGen(lance: 'grande' | 'chica'): Gen {
  return (rng, rules, opts, spec) => {
    const n = Number(opts.n ?? 2);
    const tie = opts.tie === true;
    const seats = seatsFor(n);
    let hands: Card[][];
    for (;;) {
      hands = deal(rng, n);
      if (tie) {
        const twin = twinHand(rng, hands[0], hands.flat(), rules);
        if (!twin) continue;
        hands[1] = twin;
        break;
      }
      // Sin empates entre el ganador y los demás (para que se vea la jugada).
      let ok = true;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (compareLance(lance, hands[i], hands[j], rules) === 0) ok = false;
      if (ok) break;
    }
    const mano: Seat = tie ? (pick(rng, [1, 0]) as Seat) : (pick(rng, seats) as Seat);
    const full = bySeat(hands, seats);
    const w = lanceWinner(lance, full, mano, rules, seats);
    // explicación: ganador contra el mejor de los demás
    const rest = seats.filter((s) => s !== w);
    const second = rest.reduce((b, s) => (compareLance(lance, full[s], full[b], rules) > 0 ? s : b), rest[0]);
    const cmp = compareLance(lance, full[w], full[second], rules);
    const explain =
      cmp === 0
        ? `Empate: ${SEAT_NAMES[w]} y ${SEAT_NAMES[second]} tienen lo mismo a ${lance}. Gana ${SEAT_NAMES[w]} por estar más cerca de la mano.`
        : `Gana ${SEAT_NAMES[w]}. ${explainHighLow(lance, full[w], full[second], rules)}`;
    return {
      kind: 'choice', spec, rules, lance, hint: true,
      hands: shown(hands, seats, mano, rules),
      prompt: `¿Quién gana ${LANCE_NAMES[lance]}? ${manoText(mano, seats)}`,
      options: nameOpts(seats), answer: String(w), explain,
    };
  };
}

const PARES_KIND_LABEL = { none: 'Sin pares', pareja: 'Pareja', medias: 'Medias', duples: 'Duples' } as const;

const paresKind: Gen = (rng, rules, _opts, spec) => {
  const target = pick(rng, ['none', 'pareja', 'pareja', 'medias', 'duples', 'duples'] as const);
  const h = handWhere(rng, (x) => paresInfo(x, rules).kind === target);
  const p = paresInfo(h, rules);
  const extra =
    p.kind === 'none' ? 'No hay dos cartas iguales.' :
    p.kind === 'pareja' ? 'Dos cartas iguales forman pareja.' :
    p.kind === 'medias' ? 'Tres cartas iguales son medias.' :
    'Dos parejas (o cuatro iguales) son duples.';
  const eq = rules.variant === '8reyes' && h.some((c) => c.rank === 3 || c.rank === 2) ? ' Recuerda: a 8 reyes el tres es rey y el dos es as.' : '';
  return {
    kind: 'choice', spec, rules, hint: true, lance: 'pares',
    cards: sortHand(h, rules),
    prompt: '¿Qué jugada de pares tiene esta mano?',
    options: (['none', 'pareja', 'medias', 'duples'] as const).map((k) => ({ id: k, label: PARES_KIND_LABEL[k] })),
    answer: p.kind,
    explain: `Es ${describePares(p)}. ${extra}${eq}`,
  };
};

const tapPares: Gen = (rng, rules, _opts, spec) => {
  const none = rng() < 0.18;
  const h = sortHand(handWhere(rng, (x) => hasPares(x, rules) !== none), rules);
  const shuffled = shuffle(h, rng);
  const ans = paresCardIndices(shuffled, rules);
  const p = paresInfo(shuffled, rules);
  return {
    kind: 'tap', spec, rules, hint: true, lance: 'pares',
    cards: shuffled, answer: ans, allowNone: true, noneLabel: 'No hay pares',
    prompt: 'Toca las cartas que forman los pares.',
    explain: p.kind === 'none' ? 'No hay dos cartas iguales: no tiene pares.' : `Tiene ${describePares(p)}.`,
  };
};

const paresValue: Gen = (rng, rules, _opts, spec) => {
  const h = handWhere(rng, (x) => hasPares(x, rules));
  const p = paresInfo(h, rules);
  return {
    kind: 'choice', spec, rules, hint: true, lance: 'pares', cards: sortHand(h, rules),
    prompt: '¿Cuántos tantos vale esta jugada en el recuento de pares?',
    options: [1, 2, 3].map((x) => ({ id: String(x), label: `${x} ${x === 1 ? 'tanto' : 'tantos'}` })),
    answer: String(p.value),
    explain: `Es ${describePares(p)}. Pareja vale 1, medias 2 y duples 3.`,
  };
};

const paresWinner: Gen = (rng, rules, opts, spec) => {
  const n = Number(opts.n ?? 2);
  const tie = opts.tie === true;
  const seats = seatsFor(n);
  let hands: Card[][];
  for (;;) {
    hands = dealWhere(rng, n, (hs) => hs.filter((h) => hasPares(h, rules)).length >= Math.min(2, n));
    if (tie) {
      if (!hasPares(hands[0], rules)) continue;
      const twin = twinHand(rng, hands[0], hands.flat(), rules);
      if (!twin) continue;
      hands[1] = twin;
      break;
    }
    const withP = hands.filter((h) => hasPares(h, rules));
    let ok = true;
    for (let i = 0; i < withP.length; i++) for (let j = i + 1; j < withP.length; j++) if (compareLance('pares', withP[i], withP[j], rules) === 0) ok = false;
    if (ok) break;
  }
  const mano: Seat = tie ? (pick(rng, [0, 1]) as Seat) : (pick(rng, seats) as Seat);
  const full = bySeat(hands, seats);
  const players = seats.filter((s) => hasPares(full[s], rules));
  const w = lanceWinner('pares', full, mano, rules, players);
  const lines = players.map((s) => `${SEAT_NAMES[s]}: ${describePares(paresInfo(full[s], rules))}`).join('; ');
  const tied = players.some((s) => s !== w && compareLance('pares', full[s], full[w], rules) === 0);
  return {
    kind: 'choice', spec, rules, hint: true, lance: 'pares',
    hands: shown(hands, seats, mano, rules),
    prompt: `¿Quién gana los pares? ${manoText(mano, seats)}`,
    options: nameOpts(seats), answer: String(w),
    explain: `${lines}. ${tied ? `Empatan: gana ${SEAT_NAMES[w]} por estar más cerca de la mano.` : `Gana ${SEAT_NAMES[w]}: duples > medias > pareja y, a igual jugada, la de cartas más altas.`}`,
  };
};

const juegoSum: Gen = (rng, rules, _opts, spec) => {
  const h = handWhere(rng, (x) => {
    const s = handSum(x, rules);
    return s >= 20 && s <= 40;
  });
  const s = handSum(h, rules);
  const parts = sortHand(h, rules).map((c) => juegoValue(c, rules)).join(' + ');
  return {
    kind: 'choice', spec, rules, hint: true, lance: 'juego', cards: sortHand(h, rules),
    prompt: `¿Cuánto suman estas cartas (${variantNote(rules)})?`,
    options: numberOptions(rng, s, [s - 3, s - 2, s - 1, s + 1, s + 2, s + 3, s + 9, s - 9].filter((x) => x > 3 && x <= 40)),
    answer: String(s),
    explain: `${parts} = ${s}. ${s >= 31 ? 'Tiene juego (31 o más).' : 'No llega a 31: no tiene juego.'}`,
  };
};

const hasJuegoGen: Gen = (rng, rules, _opts, spec) => {
  const h = handWhere(rng, (x) => {
    const s = handSum(x, rules);
    return s >= 26 && s <= 35;
  });
  const j = juegoInfo(h, rules);
  return {
    kind: 'choice', spec, rules, hint: true, lance: 'juego', cards: sortHand(h, rules),
    prompt: '¿Esta mano tiene juego?',
    options: [{ id: 'si', label: 'Sí, tiene juego' }, { id: 'no', label: 'No tiene juego' }],
    answer: j.hasJuego ? 'si' : 'no',
    explain: `Suma ${j.sum}. ${j.hasJuego ? 'Con 31 o más hay juego.' : 'Hace falta llegar a 31.'}`,
  };
};

const juegoWinner: Gen = (rng, rules, opts, spec) => {
  const n = Number(opts.n ?? 2);
  const seats = seatsFor(n);
  const hands = dealWhere(rng, n, (hs) => {
    const js = hs.filter((h) => hasJuego(h, rules));
    if (js.length < Math.min(2, n)) return false;
    if (opts.tie === true) return compareLance('juego', hs[0], hs[1], rules) === 0 && hasJuego(hs[0], rules);
    for (let i = 0; i < js.length; i++) for (let j = i + 1; j < js.length; j++) if (compareLance('juego', js[i], js[j], rules) === 0) return false;
    return true;
  }, 20000);
  const mano: Seat = pick(rng, seats) as Seat;
  const full = bySeat(hands, seats);
  const players = seats.filter((s) => hasJuego(full[s], rules));
  const w = lanceWinner('juego', full, mano, rules, players);
  const lines = seats.map((s) => `${SEAT_NAMES[s]}: ${describeJuego(full[s], rules)}`).join('; ');
  const tied = players.some((s) => s !== w && compareLance('juego', full[s], full[w], rules) === 0);
  return {
    kind: 'choice', spec, rules, hint: true, lance: 'juego',
    hands: shown(hands, seats, mano, rules, (s) => `suma ${handSum(full[s], rules)}`),
    prompt: `¿Quién gana el juego? ${manoText(mano, seats)}`,
    options: nameOpts(seats), answer: String(w),
    explain: `${lines}. ${tied ? `Empate: gana ${SEAT_NAMES[w]} por estar más cerca de la mano.` : 'Orden: 31, 32, 40, 37, 36, 35, 34, 33.'}${juegoInfo(full[w], rules).isReal ? ' ¡Es la 31 real!' : ''}`,
  };
};

const juegoOrPunto: Gen = (rng, rules, _opts, spec) => {
  const want = rng() < 0.5;
  const hands = dealWhere(rng, 4, (hs) => hs.some((h) => hasJuego(h, rules)) === want && (want ? hs.filter((h) => hasJuego(h, rules)).length === 1 : true));
  const seats = seatsFor(4);
  const mano = pick(rng, seats) as Seat;
  return {
    kind: 'choice', spec, rules, hint: true,
    hands: shown(hands, seats, mano, rules, (s) => `suma ${handSum(hands[s], rules)}`),
    prompt: '¿Qué se juega en el último lance?',
    options: [{ id: 'juego', label: 'Juego' }, { id: 'punto', label: 'Punto' }],
    answer: want ? 'juego' : 'punto',
    explain: want ? 'Basta con que UNO de los cuatro tenga juego (31 o más) para que se juegue el juego.' : 'Nadie llega a 31, así que se juega al punto: gana la suma más alta.',
  };
};

const puntoWinner: Gen = (rng, rules, opts, spec) => {
  const n = Number(opts.n ?? 4);
  const seats = seatsFor(n);
  const hands = dealWhere(rng, n, (hs) => hs.every((h) => !hasJuego(h, rules)) && new Set(hs.map((h) => handSum(h, rules))).size === (opts.tie ? n - 1 : n));
  const mano = pick(rng, seats) as Seat;
  const full = bySeat(hands, seats);
  const w = lanceWinner('punto', full, mano, rules, seats);
  const sums = seats.map((s) => `${SEAT_NAMES[s]} ${handSum(full[s], rules)}`).join(', ');
  return {
    kind: 'choice', spec, rules, hint: true, lance: 'punto',
    hands: shown(hands, seats, mano, rules),
    prompt: `Nadie tiene juego. ¿Quién gana el punto? ${manoText(mano, seats)}`,
    options: nameOpts(seats), answer: String(w),
    explain: `Sumas: ${sums}. Gana la más alta; si empatan, el más cercano a la mano.`,
  };
};

const orderHands: Gen = (rng, rules, opts, spec) => {
  const lance = (opts.lance ?? 'grande') as LanceId;
  const ok = (h: Card[]) => (lance === 'pares' ? hasPares(h, rules) : lance === 'juego' ? hasJuego(h, rules) : true);
  const hands = dealWhere(rng, 3, (hs) => hs.every(ok) && compareLance(lance, hs[0], hs[1], rules) !== 0 && compareLance(lance, hs[0], hs[2], rules) !== 0 && compareLance(lance, hs[1], hs[2], rules) !== 0, 40000);
  const items: Option[] = hands.map((h, i) => ({ id: String(i), label: ['A', 'B', 'C'][i], cards: sortHand(h, rules) }));
  const sorted = [0, 1, 2].sort((a, b) => compareLance(lance, hands[b], hands[a], rules));
  const describe = (i: number) =>
    lance === 'pares' ? describePares(paresInfo(hands[i], rules)) : lance === 'juego' ? describeJuego(hands[i], rules) : items[i].cards!.map((c) => rankName(effRank(c, rules))).join(', ');
  return {
    kind: 'order', spec, rules, lance, hint: true,
    prompt: `Ordena las manos de mejor a peor a ${LANCE_TITLE[lance].toLowerCase()}.`,
    items: shuffle(items, rng), answer: sorted.map(String),
    explain: sorted.map((i, k) => `${k + 1}º ${items[i].label} (${describe(i)})`).join(' · '),
  };
};

function discardGen(goal: 'reyes' | 'chica' | 'pares'): Gen {
  return (rng, rules, _opts, spec) => {
    const isR = (c: Card) => effRank(c, rules) === 12;
    const isA = (c: Card) => effRank(c, rules) === 1;
    let h: Card[];
    let keep: (c: Card, hand: Card[]) => boolean;
    let prompt: string;
    let why: string;
    if (goal === 'reyes') {
      h = handWhere(rng, (x) => {
        const n = x.filter(isR).length;
        return n >= 1 && n <= 2 && !hasPares(x, rules);
      });
      keep = isR;
      prompt = 'Has pedido mus y vas a por reyes (a la grande). Toca las cartas que tirarías.';
      why = 'Para ir a la grande te quedas solo con los reyes (y treses, a 8 reyes) y pides el resto.';
    } else if (goal === 'chica') {
      h = handWhere(rng, (x) => {
        const n = x.filter(isA).length;
        return n >= 1 && n <= 2 && !hasPares(x, rules);
      });
      keep = isA;
      prompt = 'Has pedido mus y vas a la chica. Toca las cartas que tirarías.';
      why = 'Para la chica te quedas con los ases (y doses, a 8 reyes) y tiras lo demás.';
    } else {
      h = handWhere(rng, (x) => {
        const p = paresInfo(x, rules);
        return (p.kind === 'pareja' || p.kind === 'medias') && p.ranks[0] !== 12 && !x.some(isR);
      });
      const p = paresInfo(h, rules);
      keep = (c) => effRank(c, rules) === p.ranks[0];
      prompt = `Tienes ${describePares(p)} y quieres conservarla. Toca las cartas que tirarías.`;
      why = 'Guardas las cartas de los pares y pides las demás para intentar mejorar.';
    }
    const cards = shuffle(h, rng);
    const answer = cards.map((c, i) => (keep(c, cards) ? -1 : i)).filter((i) => i >= 0);
    return { kind: 'tap', spec, rules, hint: true, cards, answer, prompt, explain: why };
  };
}

/** Decisión de envite, solo en situaciones claras según la probabilidad calculada. */
const betDecision: Gen = (rng, rules, opts, spec) => {
  const lance = (opts.lance ?? pick(rng, ['grande', 'chica', 'pares', 'juego'] as const)) as LanceId;
  const respond = opts.respond === true || (opts.respond === undefined && rng() < 0.5);
  for (let attempt = 0; attempt < 400; attempt++) {
    const hands = deal(rng, 4);
    const mano = pick(rng, [0, 1, 2, 3] as Seat[]);
    const declared = { pares: hands.map((h) => hasPares(h, rules)), juego: hands.map((h) => hasJuego(h, rules)) };
    if (lance === 'pares' || lance === 'juego') {
      const has = declared[lance];
      if (!has[0] || !(has[1] || has[3])) continue;
    }
    if (lance === 'juego' && !declared.juego.some(Boolean)) continue;
    const k = { me: 0 as Seat, myHand: hands[0], mano, rules, declared };
    // Criba rápida: solo se afina la probabilidad en manos que pintan claras.
    const quick = winProbability(k, lance, 50, randInt(rng, 1e6));
    if (quick > 0.3 && quick < 0.68) continue;
    const p = winProbability(k, lance, 220, randInt(rng, 1e6));
    let answer: string | null = null;
    if (!respond) answer = p >= 0.8 ? 'envido' : p <= 0.2 ? 'paso' : null;
    else answer = p >= 0.72 ? 'quiero' : p <= 0.22 ? 'noQuiero' : null;
    if (!answer) continue;
    const pct = Math.round(p * 100);
    const info = lance === 'pares' ? ` Tienes ${describePares(paresInfo(hands[0], rules))}.` : lance === 'juego' ? ` Tienes ${describeJuego(hands[0], rules)}.` : '';
    const decl =
      lance === 'pares' || lance === 'juego'
        ? ' ' + ([1, 2, 3] as Seat[]).map((s) => `${SEAT_NAMES[s]}: ${declared[lance][s] ? 'sí' : 'no'}`).join(', ') + '.'
        : '';
    const rivals = ([1, 3] as Seat[]).filter((x) => (lance === 'pares' || lance === 'juego' ? declared[lance][x] : true));
    const bettor = rivals[randInt(rng, rivals.length)];
    const situation = respond ? `${SEAT_NAMES[bettor]} envida 2 a ${LANCE_NAMES[lance]}.` : `Te toca hablar a ${LANCE_NAMES[lance]}.`;
    return {
      kind: 'choice', spec, rules, lance, hint: true,
      hands: [{ seat: 0, name: 'Tú', cards: sortHand(hands[0], rules), mano: mano === 0, note: mano === 0 ? 'eres mano' : `mano: ${SEAT_NAMES[mano]}` }],
      prompt: `${situation}${decl} ¿Qué haces?`,
      options: respond
        ? [{ id: 'quiero', label: 'Quiero' }, { id: 'noQuiero', label: 'No quiero' }]
        : [{ id: 'envido', label: 'Envido' }, { id: 'paso', label: 'Paso' }],
      answer,
      explain: `Con tus cartas, tu pareja gana ${LANCE_NAMES[lance]} más o menos el ${pct}% de las veces.${info} ${
        answer === 'envido' ? 'Es muy probable ganar: envida para cobrar más.' :
        answer === 'paso' ? 'Lo normal es perderlo: pasa y no regales tantos.' :
        answer === 'quiero' ? 'Vas muy por delante: quiere el envite.' :
        'Lo más probable es perder: no lo quieras (solo cuesta el deje).'
      }`,
    };
  }
  throw new Error('No se pudo generar betDecision');
};

const senaMeaning: Gen = (rng, rules, _opts, spec) => {
  const s = pick(rng, SENAS);
  const others = shuffle(SENAS.filter((x) => x.id !== s.id), rng).slice(0, 3);
  return {
    kind: 'choice', spec, rules, face: s.id,
    prompt: 'Tu compañero te hace esta seña. ¿Qué te está diciendo?',
    options: shuffle([s, ...others], rng).map((x) => ({ id: x.id, label: x.meaning })),
    answer: s.id,
    explain: `${s.gesture}: ${s.name.toLowerCase()} (${s.meaning.toLowerCase()}).`,
  };
};

const senaGesture: Gen = (rng, rules, _opts, spec) => {
  const s = pick(rng, SENAS);
  const others = shuffle(SENAS.filter((x) => x.id !== s.id), rng).slice(0, 3);
  return {
    kind: 'choice', spec, rules,
    prompt: `¿Cómo se hace la seña de «${s.name}»?`,
    options: shuffle([s, ...others], rng).map((x) => ({ id: x.id, label: x.gesture, face: x.id })),
    answer: s.id,
    explain: `${s.name}: ${s.gesture.toLowerCase()}.`,
  };
};

const senaForHandGen: Gen = (rng, rules, _opts, spec) => {
  const target = pick(rng, SENAS.filter((s) => s.id !== 'solomillo')).id;
  const h = handWhere(rng, (x) => {
    const s = senasForHand(x, rules);
    return s.length === 1 && s[0] === target;
  });
  const others = shuffle(SENAS.filter((x) => x.id !== target), rng).slice(0, 3);
  const s = senaById(target);
  return {
    kind: 'choice', spec, rules, hint: true, cards: sortHand(h, rules),
    prompt: '¿Qué seña le harías a tu compañero con estas cartas?',
    options: shuffle([s, ...others], rng).map((x) => ({ id: x.id, label: `${x.name}: ${x.gesture.toLowerCase()}`, face: x.id })),
    answer: target,
    explain: `Llevas ${target === 'ciego' ? 'nada (ni pares ni juego)' : s.meaning.toLowerCase()}: ${s.gesture.toLowerCase()}.`,
  };
};

const matchTerms: Gen = (rng, rules, opts, spec) => {
  const set = String(opts.set ?? 'basico');
  const pool = GLOSSARY.filter((g) => (set === 'euskera' ? g.eu && g.tags?.includes('euskera') : g.tags?.includes(set as never)));
  const chosen = shuffle(pool, rng).slice(0, 4);
  return {
    kind: 'match', spec, rules,
    prompt: 'Relaciona cada término con su significado.',
    pairs: chosen.map((g) => ({ left: set === 'euskera' ? g.eu! : g.term, right: set === 'euskera' ? `${g.term}` : g.def })),
    explain: chosen.map((g) => `${set === 'euskera' ? g.eu : g.term}: ${set === 'euskera' ? g.term : g.def}`).join(' · '),
  };
};

const BASE4 = () => [
  [{ suit: 'oros', rank: 12 }, { suit: 'copas', rank: 12 }, { suit: 'oros', rank: 11 }, { suit: 'oros', rank: 7 }],
  [{ suit: 'espadas', rank: 1 }, { suit: 'bastos', rank: 1 }, { suit: 'oros', rank: 4 }, { suit: 'oros', rank: 5 }],
  [{ suit: 'espadas', rank: 12 }, { suit: 'copas', rank: 10 }, { suit: 'oros', rank: 10 }, { suit: 'copas', rank: 6 }],
  [{ suit: 'copas', rank: 11 }, { suit: 'espadas', rank: 11 }, { suit: 'copas', rank: 7 }, { suit: 'copas', rank: 4 }],
] as Card[][];

const cobroDeje: Gen = (rng, rules, _opts, spec) => {
  const steps = 1 + randInt(rng, 3); // nº de envites (1 = envido rechazado)
  let st = handFromCards(rules, 0, BASE4(), [0, 0], { cutMus: true });
  const lines: string[] = [];
  for (let i = 0; i < steps; i++) {
    const seat = currentSeat(st);
    const amount = pick(rng, [2, 2, 3, 4, 5, 10]);
    st = applyAction(st, { type: 'envido', amount });
    lines.push(`${SEAT_NAMES[seat]}: ${i === 0 ? (amount === 2 ? 'envido' : `envido ${amount}`) : `${amount} más`}`);
  }
  // los dos rivales del último en envidar no quieren
  while (st.bet && st.bet.stage === 'responder') {
    const seat = currentSeat(st);
    st = applyAction(st, { type: 'noQuiero' });
    lines.push(`${SEAT_NAMES[seat]}: no quiero`);
  }
  const res = st.results[0].outcome;
  if (res.kind !== 'noQuerido') throw new Error('cobroDeje');
  const team = res.team;
  return {
    kind: 'choice', spec, rules, lance: 'grande',
    prompt: `A la grande: ${lines.join(' · ')}. ¿Cuántos tantos cobran ${TEAM_NAMES[team]} en el momento?`,
    options: numberOptions(rng, res.deje, [1, 2, 3, 4, 5, 6, 7, 9, 12]),
    answer: String(res.deje),
    explain: steps === 1 ? 'Si no se quiere el primer envite, se cobra 1 tanto (el deje).' : 'Si no se quiere una subida, se cobra lo que estaba envidado antes de esa subida.',
  };
};

function currentSeat(st: ReturnType<typeof handFromCards>): Seat {
  const b = st.bet!;
  return b.stage === 'abrir' ? b.participants[b.openIdx] : b.responders[0];
}

const cobroLance: Gen = (rng, rules, opts, spec) => {
  const lance = (opts.lance ?? pick(rng, ['pares', 'juego'] as const)) as 'pares' | 'juego';
  const has = lance === 'pares' ? hasPares : hasJuego;
  const hands = dealWhere(rng, 4, (hs) => (has(hs[0], rules) || has(hs[2], rules)) && (has(hs[1], rules) || has(hs[3], rules)), 20000);
  const mano = pick(rng, [0, 1, 2, 3] as Seat[]);
  const querido = rng() < 0.6;
  const amount = pick(rng, [2, 2, 3, 5]);
  const participants = ([0, 1, 2, 3] as Seat[]).filter((s) => has(hands[s], rules));
  const item = lanceItem(
    { lance, outcome: querido ? { kind: 'querido', amount } : { kind: 'paso' }, participants },
    hands, mano, rules,
  )!;
  return {
    kind: 'choice', spec, rules, lance, hint: true,
    hands: shown(hands, [0, 1, 2, 3], mano, rules, (s) => (lance === 'pares' ? describePares(paresInfo(hands[s], rules)) : describeJuego(hands[s], rules))),
    prompt: `${querido ? `Se envidan ${amount} a ${LANCE_NAMES[lance]} y se quieren.` : `${LANCE_TITLE[lance]}: todos pasan.`} ¿Cuántos tantos cobra la pareja ganadora en el recuento?`,
    options: numberOptions(rng, item.points, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
    answer: String(item.points),
    explain: `Gana ${SEAT_NAMES[item.winnerSeat!]}, así que cobran ${TEAM_NAMES[item.team]}: ${item.parts.map((p) => `${p.label} ${p.points}`).join(' + ')} = ${item.points}.`,
  };
};

const pasoPolicy = (s: ReturnType<typeof handFromCards>): Action => (s.phase === 'mus' ? { type: 'noMus' } : { type: 'paso' });

const recuentoPaso: Gen = (rng, rules, _opts, spec) => {
  const hands = deal(rng, 4);
  const mano = pick(rng, [0, 1, 2, 3] as Seat[]);
  const st = runUntil(handFromCards(rules, mano, hands, [0, 0], { cutMus: true }), pasoPolicy);
  const ours = st.scores[0];
  const detail = st.recuento!.map((i) => `${LANCE_TITLE[i.lance]}: ${i.team === 0 ? 'vosotros' : 'ellos'} ${i.points}`).join(' · ');
  return {
    kind: 'choice', spec, rules, hint: true,
    hands: shown(hands, [0, 1, 2, 3], mano, rules),
    prompt: 'Se pasa en todos los lances. ¿Cuántos tantos ganáis Tú y Maite en el recuento?',
    options: numberOptions(rng, ours, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    answer: String(ours),
    explain: detail || 'Nadie cobra nada.',
  };
};

const ordagoWinner: Gen = (rng, rules, opts, spec) => {
  const lance = (opts.lance ?? pick(rng, ['grande', 'chica'] as const)) as LanceId;
  const hands = deal(rng, 4);
  const mano = pick(rng, [0, 1, 2, 3] as Seat[]);
  const w = lanceWinner(lance, hands, mano, rules);
  return {
    kind: 'choice', spec, rules, lance, hint: true,
    hands: shown(hands, [0, 1, 2, 3], mano, rules),
    prompt: `Iker echa un órdago a ${LANCE_NAMES[lance]} y Maite lo quiere. ¿Quién gana la partida?`,
    options: [{ id: '0', label: 'Tú y Maite' }, { id: '1', label: 'Iker y Jon' }],
    answer: String(teamOf(w)),
    explain: `Órdago querido: se enseñan las cartas y la mejor a ${lance} es la de ${SEAT_NAMES[w]}. Su pareja gana el juego entero, vaya como vaya el marcador.`,
  };
};

const amarracosGen: Gen = (rng, rules, _opts, spec) => {
  const n = 6 + randInt(rng, 33);
  const a = Math.floor(n / 5);
  const p = n % 5;
  const label = (x: number, y: number) => `${x} amarraco${x === 1 ? '' : 's'} y ${y} piedra${y === 1 ? '' : 's'}`;
  const cands = [[a, p], [a - 1, p + 5], [a + 1, Math.max(0, p - 1)], [Math.floor(n / 10), n % 10], [a, (p + 2) % 5]].filter(([x, y]) => x >= 0 && y >= 0);
  const uniq = [...new Map(cands.map(([x, y]) => [label(x, y), [x, y]])).values()].slice(0, 4);
  return {
    kind: 'choice', spec, rules,
    prompt: `Lleváis ${n} tantos. ¿Cómo se cuentan con piedras y amarracos?`,
    options: shuffle(uniq.map(([x, y]) => ({ id: `${x}-${y}`, label: label(x, y) })), rng),
    answer: `${a}-${p}`,
    explain: `Un amarraco son 5 tantos: ${n} = ${a} × 5 + ${p}. Faltan ${rules.target - n} para ganar el juego a ${rules.target}.`,
  };
};

const quienLlega: Gen = (rng, rules, _opts, spec) => {
  for (let k = 0; k < 500; k++) {
    const hands = deal(rng, 4);
    const mano = pick(rng, [0, 1, 2, 3] as Seat[]);
    const t = rules.target;
    const s0 = t - 1 - randInt(rng, 4);
    const s1 = t - 1 - randInt(rng, 4);
    const st = runUntil(handFromCards(rules, mano, hands, [s0, s1], { cutMus: true }), pasoPolicy);
    if (st.winner === null) continue;
    const both = st.recuento!.reduce((acc, i) => { acc[i.team] += i.points; return acc; }, [s0, s1]);
    if (!(both[0] >= t && both[1] >= t)) continue; // queremos que lleguen las dos
    const detail = st.recuento!.map((i) => `${LANCE_TITLE[i.lance]} → ${i.team === 0 ? 'vosotros' : 'ellos'} +${i.points}`).join(', ');
    return {
      kind: 'choice', spec, rules,
      prompt: `Vais ${s0} a ${s1} (juego a ${t}). Se pasa en todo y en el recuento: ${detail}. ¿Quién gana el juego?`,
      options: [{ id: '0', label: 'Vosotros' }, { id: '1', label: 'Ellos' }],
      answer: String(st.winner),
      explain: 'Se cuenta en orden (grande, chica, pares, juego) y gana la primera pareja que llega, aunque la otra también llegara después.',
    };
  }
  throw new Error('quienLlega');
};

const examHand: Gen = (rng, rules, _opts, spec) => {
  const hands = deal(rng, 4);
  const mano = pick(rng, [0, 1, 2, 3] as Seat[]);
  const seats: Seat[] = [0, 1, 2, 3];
  const sh = shown(hands, seats, mano, rules);
  const base = { spec, rules, hands: sh, hint: true } as const;
  const parts: ChoiceExercise[] = [];
  for (const l of ['grande', 'chica'] as const) {
    const w = lanceWinner(l, hands, mano, rules);
    parts.push({ ...base, kind: 'choice', lance: l, prompt: `¿Quién gana ${LANCE_NAMES[l]}?`, options: nameOpts(seats), answer: String(w), explain: `Gana ${SEAT_NAMES[w]}.` });
  }
  const withP = seats.filter((s) => hasPares(hands[s], rules));
  const pOpts: Option[] = [...nameOpts(seats), { id: 'nadie', label: 'Nadie tiene pares' }];
  if (withP.length) {
    const w = lanceWinner('pares', hands, mano, rules, withP);
    parts.push({ ...base, kind: 'choice', lance: 'pares', prompt: '¿Quién gana los pares?', options: pOpts, answer: String(w), explain: withP.map((s) => `${SEAT_NAMES[s]}: ${describePares(paresInfo(hands[s], rules))}`).join('; ') + '.' });
  } else {
    parts.push({ ...base, kind: 'choice', lance: 'pares', prompt: '¿Quién gana los pares?', options: pOpts, answer: 'nadie', explain: 'Nadie tiene dos cartas iguales: el lance no se juega.' });
  }
  const withJ = seats.filter((s) => hasJuego(hands[s], rules));
  const l: LanceId = withJ.length ? 'juego' : 'punto';
  const w = lanceWinner(l, hands, mano, rules, withJ.length ? withJ : seats);
  const sums = seats.map((s) => `${SEAT_NAMES[s]} ${handSum(hands[s], rules)}`).join(', ');
  parts.push({
    ...base, kind: 'choice',
    prompt: '¿Qué se juega en el último lance?',
    options: [{ id: 'juego', label: 'Juego' }, { id: 'punto', label: 'Punto' }],
    answer: l,
    explain: `Sumas: ${sums}. ${withJ.length ? 'Alguien tiene 31 o más: se juega el juego.' : 'Nadie llega a 31: se juega al punto.'}`,
  });
  parts.push({
    ...base, kind: 'choice', lance: l,
    prompt: `¿Quién gana ${LANCE_NAMES[l]}?`,
    options: nameOpts(seats), answer: String(w),
    explain: `${l === 'juego' ? withJ.map((s) => `${SEAT_NAMES[s]}: ${describeJuego(hands[s], rules)}`).join('; ') + '. Orden: 31, 32, 40, 37…33.' : `Sumas: ${sums}.`} Gana ${SEAT_NAMES[w]}.`,
  });
  const st = runUntil(handFromCards(rules, mano, hands, [0, 0], { cutMus: true }), pasoPolicy);
  parts.push({
    ...base, kind: 'choice',
    prompt: 'Si se pasa en todo, ¿cuántos tantos ganáis Tú y Maite?',
    options: numberOptions(rng, st.scores[0], [0, 1, 2, 3, 4, 5, 6, 7, 8]),
    answer: String(st.scores[0]),
    explain: st.recuento!.map((i) => `${LANCE_TITLE[i.lance]}: ${i.team === 0 ? 'vosotros' : 'ellos'} ${i.points}`).join(' · ') || 'Nadie cobra.',
  });
  return { kind: 'multi', spec, rules, hands: sh, prompt: 'Mano de examen', explain: '', parts };
};


const musOrCut: Gen = (rng, rules, _opts, spec) => {
  const cut = rng() < 0.5;
  const isR = (c: Card) => effRank(c, rules) === 12;
  const isA = (c: Card) => effRank(c, rules) === 1;
  const h = handWhere(rng, (x) => {
    const p = paresInfo(x, rules);
    const j = juegoInfo(x, rules);
    if (cut) return p.kind === 'duples' || (p.kind === 'medias' && (p.ranks[0] >= 10 || p.ranks[0] === 1)) || j.sum === 31;
    return p.kind === 'none' && !j.hasJuego && x.filter(isR).length <= 1 && x.filter(isA).length <= 1;
  });
  const p = paresInfo(h, rules);
  const j = juegoInfo(h, rules);
  const why = cut
    ? `Tienes ${p.kind !== 'none' && (p.kind === 'duples' || p.kind === 'medias') ? describePares(p) : ''}${(p.kind === 'duples' || p.kind === 'medias') && j.sum === 31 ? ' y ' : ''}${j.sum === 31 ? 'la 31' : ''}: es una jugada muy buena que puedes estropear cambiando cartas. Se corta.`
    : 'Sin pares, sin juego y casi sin reyes ni ases: no tienes nada que proteger. Pide mus para mejorar.';
  return {
    kind: 'choice', spec, rules, hint: true, cards: sortHand(h, rules),
    prompt: 'Te toca hablar en el mus. ¿Qué dices?',
    options: [{ id: 'mus', label: 'Mus' }, { id: 'corte', label: 'No hay mus' }],
    answer: cut ? 'corte' : 'mus',
    explain: why,
  };
};

const quiz: Gen = (rng, rules, opts, spec) => {
  const q = QUIZ.find((x) => x.id === opts.id) ?? pick(rng, QUIZ);
  const options = q.options.map((label, i) => ({ id: String(i), label }));
  return {
    kind: 'choice', spec, rules, cards: q.cards ? q.cards : undefined, face: q.face,
    prompt: q.q, options: q.keepOrder ? options : shuffle(options, rng), answer: String(q.answer), explain: q.explain,
  };
};

const tieMano: Gen = (rng, rules, opts, spec) => {
  const lance = (opts.lance ?? pick(rng, ['grande', 'chica', 'pares'] as const)) as 'grande' | 'chica' | 'pares';
  if (lance === 'pares') return paresWinner(rng, rules, { n: 2, tie: true }, spec);
  return winnerGen(lance)(rng, rules, { n: 2, tie: true }, spec);
};

export const GENERATORS: Record<string, Gen> = {
  cardValue, cardEquiv,
  grandeWinner: winnerGen('grande'), chicaWinner: winnerGen('chica'),
  paresKind, tapPares, paresValue, paresWinner,
  juegoSum, hasJuego: hasJuegoGen, juegoWinner, juegoOrPunto, puntoWinner,
  orderHands, tieMano,
  musOrCut,
  discardReyes: discardGen('reyes'), discardChica: discardGen('chica'), discardPares: discardGen('pares'),
  betDecision, senaMeaning, senaGesture, senaForHand: senaForHandGen, matchTerms,
  cobroDeje, cobroLance, recuentoPaso, ordagoWinner, amarracos: amarracosGen, quienLlega, examHand, quiz,
};

export function generate(spec: ExerciseSpec, baseRules: Rules): Exercise {
  const rules: Rules = { ...baseRules, ...(spec.variant ? { variant: spec.variant } : {}), ...(spec.real31 !== undefined ? { real31: spec.real31 } : {}) };
  const gen = GENERATORS[spec.gen];
  if (!gen) throw new Error('Generador desconocido: ' + spec.gen);
  return gen(makeRng(spec.seed), rules, spec.opts ?? {}, spec);
}

export const rankPluralName = rankPlural;
