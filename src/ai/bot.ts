// Bots de mus: decisiones por heurística + probabilidad Monte Carlo condicionada a lo que saben.
import {
  effRank, handSum, juegoInfo, paresInfo, teamOf, type Action, type Card, type HandState, type LanceId,
  type Rules, type Seat, type SenaId, makeRng, describePares, describeJuego, LANCE_NAMES,
} from '../engine';
import { winProbability, type Knowledge } from './estimate';

export type Level = 'principiante' | 'normal' | 'experto';

export interface BotContext {
  level: Level;
  /** Señas que este jugador conoce (de su compañero y las pilladas a rivales). */
  senas: Partial<Record<Seat, SenaId[]>>;
  /** Marcador del juego en curso. */
  scores: [number, number];
  rng: () => number;
}

export interface Decision {
  action: Action;
  /** Explicación en castellano (para el tutor). */
  why: string;
  /** Probabilidad estimada de ganar el lance (si aplica). */
  p?: number;
}

const isRey = (c: Card, r: Rules) => effRank(c, r) === 12;
const isAs = (c: Card, r: Rules) => effRank(c, r) === 1;

// ---------------------------------------------------------------- mus

export function musDecision(h: Card[], st: HandState, seat: Seat, ctx: BotContext): Decision {
  const r = st.rules;
  const p = paresInfo(h, r);
  const j = juegoInfo(h, r);
  const reyes = h.filter((c) => isRey(c, r)).length;
  const ases = h.filter((c) => isAs(c, r)).length;
  const isMano = seat === st.mano;
  const reasons: string[] = [];
  let cut = false;
  if (p.kind === 'duples') { cut = true; reasons.push(`tienes ${describePares(p)}`); }
  else if (p.kind === 'medias' && (p.ranks[0] >= 10 || p.ranks[0] === 1)) { cut = true; reasons.push(`tienes ${describePares(p)}`); }
  if (j.hasJuego && j.sum === 31) { cut = true; reasons.push(isMano ? 'tienes la 31 y eres mano' : 'tienes la 31'); }
  if (!cut && j.hasJuego && (j.sum === 32 || j.sum === 40) && reyes >= 2) { cut = true; reasons.push(`tienes ${j.sum} y dos reyes`); }
  if (!cut && reyes >= 3) { cut = true; reasons.push('llevas tres reyes: muy buena grande'); }
  if (!cut && ases >= 3) { cut = true; reasons.push('llevas tres ases: chica casi segura'); }
  if (!cut && p.kind === 'pareja' && p.ranks[0] === 12 && j.hasJuego) { cut = true; reasons.push('pareja de reyes y juego'); }
  if (!cut && ases === 2 && h.every((c) => effRank(c, r) <= 5) ) { cut = true; reasons.push('dos ases y cartas bajas: buena chica con pares'); }
  if (ctx.level === 'principiante') {
    if (cut && ctx.rng() < 0.25) cut = false;
    else if (!cut && ctx.rng() < 0.15) cut = true;
  }
  if (ctx.level === 'experto' && !cut && isMano && p.kind === 'pareja' && p.ranks[0] >= 10 && j.hasJuego) {
    cut = true; reasons.push('siendo mano, pareja alta y juego te bastan');
  }
  // tras muchas rondas de mus, se corta
  if (st.musRound >= 4) { cut = true; reasons.push('ya se han dado muchos mus'); }
  if (cut) return { action: { type: 'noMus' }, why: `Corta el mus: ${reasons.join(', ')}.` };
  return { action: { type: 'mus' }, why: 'Pide mus: tu mano es floja y cambiar cartas no cuesta nada.' };
}

// ---------------------------------------------------------------- descartes

export function discardDecision(h: Card[], st: HandState, _seat: Seat, ctx: BotContext): Decision {
  const r = st.rules;
  const p = paresInfo(h, r);
  const reyes = h.filter((c) => isRey(c, r)).length;
  const ases = h.filter((c) => isAs(c, r)).length;
  let keep: boolean[];
  let why: string;
  if (p.kind !== 'none' && (p.ranks[0] >= 10 || p.kind !== 'pareja' || p.ranks[0] === 1)) {
    keep = h.map((c) => p.ranks.includes(effRank(c, r)) || isRey(c, r));
    why = `Guarda ${describePares(p)}${reyes && !p.ranks.includes(12) ? ' y los reyes' : ''}; pide el resto.`;
  } else if (reyes >= ases && reyes > 0) {
    keep = h.map((c) => isRey(c, r));
    why = 'Vas a reyes: te quedas los reyes y tiras lo demás.';
  } else if (ases > 0) {
    keep = h.map((c) => isAs(c, r) || (ases >= 2 && effRank(c, r) === 4));
    why = 'Vas a la chica: guardas los ases (y algún cuatro) y tiras lo demás.';
  } else if (p.kind === 'pareja') {
    keep = h.map((c) => p.ranks.includes(effRank(c, r)));
    why = `Guardas ${describePares(p)} y pides tres.`;
  } else {
    // sin nada: guarda la carta más alta si es figura
    const best = h.reduce((b, c, i) => (effRank(c, r) > effRank(h[b], r) ? i : b), 0);
    keep = h.map((_, i) => i === best && effRank(h[best], r) >= 10);
    why = 'No llevas nada: pide casi todo para buscar reyes.';
  }
  let idx = h.map((_, i) => i).filter((i) => !keep[i]);
  if (idx.length === 0) {
    // hay que tirar al menos una: la menos útil (la más baja que no forma pares)
    const nonPair = h.map((c, i) => ({ c, i })).filter(({ c }) => !p.ranks.includes(effRank(c, r)));
    const pool = nonPair.length ? nonPair : h.map((c, i) => ({ c, i }));
    pool.sort((a, b) => effRank(a.c, r) - effRank(b.c, r));
    idx = [pool[0].i];
    why += ' Hay que tirar al menos una: la que menos sirve.';
  }
  if (ctx.level === 'principiante' && ctx.rng() < 0.3 && idx.length < 4) {
    const extra = h.map((_, i) => i).filter((i) => !idx.includes(i));
    idx = [...idx, extra[Math.floor(ctx.rng() * extra.length)]];
  }
  return { action: { type: 'discard', indices: idx.sort() }, why };
}

// ---------------------------------------------------------------- envites

export function knowledgeFor(st: HandState, seat: Seat, ctx: BotContext): Knowledge {
  return { me: seat, myHand: st.hands[seat], mano: st.mano, rules: st.rules, declared: st.declared, senas: ctx.senas };
}

const SAMPLES: Record<Level, number> = { principiante: 60, normal: 140, experto: 260 };

function lanceValueText(lance: LanceId, h: Card[], r: Rules): string {
  if (lance === 'pares') return describePares(paresInfo(h, r));
  if (lance === 'juego') return describeJuego(h, r);
  if (lance === 'punto') return `${handSum(h, r)} de punto`;
  return '';
}

export function betDecision(st: HandState, seat: Seat, ctx: BotContext): Decision {
  const b = st.bet!;
  const lance = b.lance;
  const r = st.rules;
  const my = teamOf(seat);
  const k = knowledgeFor(st, seat, ctx);
  let p = winProbability(k, lance, SAMPLES[ctx.level], Math.floor(ctx.rng() * 1e9));
  const pctTrue = Math.round(p * 100);
  const noise = ctx.level === 'principiante' ? 0.18 : ctx.level === 'normal' ? 0.06 : 0;
  if (noise) p = Math.min(1, Math.max(0, p + (ctx.rng() * 2 - 1) * noise));
  const ours = ctx.scores[my];
  const theirs = ctx.scores[1 - my];
  const target = r.target;
  const theyClose = theirs >= target - 6;
  const weClose = ours >= target - 6;
  const val = lanceValueText(lance, st.hands[seat], r);
  const base = `${val ? `Con ${val}, ` : ''}calculo que tu pareja gana ${LANCE_NAMES[lance]} un ${pctTrue}% de las veces`;
  const bluff = ctx.level === 'principiante' ? 0.04 : ctx.level === 'normal' ? 0.08 : 0.1;

  if (b.stage === 'abrir') {
    const othersPassed = b.openIdx > 0;
    const last = b.openIdx === b.participants.length - 1;
    // Órdago: con jugada casi segura y el rival cerca, o por desesperación
    if (p > 0.9 && (theyClose || ctx.level === 'experto' && p > 0.96 && ctx.rng() < 0.3)) {
      return { action: { type: 'ordago' }, why: `${base}. Es casi seguro y ${theyClose ? 'ellos están cerca de ganar' : 'merece la pena'}: ¡órdago!`, p: pctTrue / 100 };
    }
    if (theyClose && theirs - ours >= 15 && p > 0.6 && ctx.level !== 'principiante') {
      return { action: { type: 'ordago' }, why: `${base}. Vais muy por detrás y ellos casi ganan: es momento de órdago.`, p: pctTrue / 100 };
    }
    if (p >= 0.72) {
      const amount = ctx.level === 'experto' && p > 0.88 ? 5 : 2;
      return { action: { type: 'envido', amount }, why: `${base}. Es probable ganar: envida${amount > 2 ? ` ${amount}` : ''}.`, p: pctTrue / 100 };
    }
    if (p >= 0.58 && (seat === st.mano || lance === 'pares' || lance === 'juego')) {
      return { action: { type: 'envido', amount: 2 }, why: `${base}. Vas por delante${seat === st.mano ? ' y eres mano' : ''}: un envido pequeño.`, p: pctTrue / 100 };
    }
    if (othersPassed && last && (lance === 'grande' || lance === 'chica') && ctx.rng() < bluff * 2 && !weClose) {
      return { action: { type: 'envido', amount: 2 }, why: `${base}. Todos han pasado: un farol de postre puede llevarse el deje.`, p: pctTrue / 100 };
    }
    if (ctx.rng() < bluff * 0.5 && p > 0.3) {
      return { action: { type: 'envido', amount: 2 }, why: `${base}. Pequeño farol.`, p: pctTrue / 100 };
    }
    return { action: { type: 'paso' }, why: `${base}. No es suficiente: pasa.`, p: pctTrue / 100 };
  }

  // Respondiendo: un envite del rival indica fuerza; lo descontamos un poco.
  const caution = ctx.level === 'experto' ? 0.06 : 0.03;
  const pa = Math.max(0, p - caution);
  const total = b.total;
  const partnerCanAnswer = b.responders.length > 1;
  if (b.ordago) {
    let need = 0.62;
    if (theyClose) need -= 0.15; // si van a ganar igualmente, arriesga
    if (weClose && !theyClose) need += 0.12;
    if (ctx.level === 'principiante') need -= 0.1;
    if (pa >= need) return { action: { type: 'quiero' }, why: `${base}. Lo ganas a menudo${theyClose ? ' y ellos están a punto de ganar de todas formas' : ''}: quiere el órdago.`, p: pctTrue / 100 };
    return { action: { type: 'noQuiero' }, why: `${base}. Un órdago se pierde todo: no lo quieras.${partnerCanAnswer ? ' Tu compañero aún puede quererlo.' : ''}`, p: pctTrue / 100 };
  }
  if (pa >= 0.85 && ctx.level !== 'principiante') {
    if (ctx.level === 'experto' && pa > 0.93 && (theyClose || ctx.rng() < 0.25)) {
      return { action: { type: 'ordago' }, why: `${base}. Casi imposible perder: ¡órdago!`, p: pctTrue / 100 };
    }
    return { action: { type: 'envido', amount: total >= 5 ? 5 : 2 }, why: `${base}. Muy por delante: sube el envite.`, p: pctTrue / 100 };
  }
  const need = Math.min(0.62, 0.42 + Math.max(0, total - 2) * 0.025);
  if (pa >= need) return { action: { type: 'quiero' }, why: `${base}. Merece la pena: quiero.`, p: pctTrue / 100 };
  return {
    action: { type: 'noQuiero' },
    why: `${base}. Lo normal es perder: no quieras (solo cuesta ${b.previous > 0 ? b.previous : 1}).${partnerCanAnswer ? ' Tu compañero aún puede quererlo.' : ''}`,
    p: pctTrue / 100,
  };
}

export function decide(st: HandState, seat: Seat, ctx: BotContext): Decision {
  const h = st.hands[seat];
  if (st.phase === 'mus') return musDecision(h, st, seat, ctx);
  if (st.phase === 'descarte') return discardDecision(h, st, seat, ctx);
  return betDecision(st, seat, ctx);
}

export const botRng = (seed: number) => makeRng(seed);
