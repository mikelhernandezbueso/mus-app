// Recuento al final de la mano: se cuenta en el orden de los lances y gana
// el juego la primera pareja que llega al objetivo.
import { juegoInfo, lanceWinner, paresInfo } from './evaluate';
import type { HandState, LanceResult } from './hand';
import type { Card, LanceId, Rules, Seat, Team } from './types';
import { teamOf } from './types';

export interface RecuentoPart {
  label: string;
  points: number;
}

export interface RecuentoItem {
  lance: LanceId;
  team: Team;
  /** Jugador que gana el lance (si se ha comparado). */
  winnerSeat: Seat | null;
  points: number;
  parts: RecuentoPart[];
  /** Tantos que ya se apuntaron durante la mano (deje). Informativo, no se vuelven a sumar. */
  alreadyCounted?: number;
}

const PARES_LABEL = { pareja: 'pareja', medias: 'medias', duples: 'duples' } as const;

/** Tantos de las jugadas (pares o juego) de los dos jugadores de una pareja. */
export function jugadasParts(lance: 'pares' | 'juego', hands: Card[][], team: Team, rules: Rules): RecuentoPart[] {
  const parts: RecuentoPart[] = [];
  for (const s of [team, team + 2] as Seat[]) {
    if (lance === 'pares') {
      const p = paresInfo(hands[s], rules);
      if (p.kind !== 'none') parts.push({ label: PARES_LABEL[p.kind], points: p.value });
    } else {
      const j = juegoInfo(hands[s], rules);
      if (j.hasJuego) parts.push({ label: j.isReal ? '31 real' : j.sum === 31 ? 'la 31' : `juego (${j.sum})`, points: j.value });
    }
  }
  return parts;
}

export function lanceItem(res: LanceResult, hands: Card[][], mano: Seat, rules: Rules): RecuentoItem | null {
  const { lance, outcome } = res;
  const isJugada = lance === 'pares' || lance === 'juego';
  const parts: RecuentoPart[] = [];
  let team: Team;
  let winnerSeat: Seat | null = null;
  let alreadyCounted: number | undefined;

  switch (outcome.kind) {
    case 'noSeJuega':
      return null;
    case 'ordago':
      return null; // el órdago decide el juego entero
    case 'unaPareja':
      team = outcome.team;
      break;
    case 'paso':
    case 'querido': {
      winnerSeat = lanceWinner(lance, hands, mano, rules, res.participants);
      team = teamOf(winnerSeat);
      if (outcome.kind === 'querido') parts.push({ label: 'envite querido', points: outcome.amount });
      else if (!isJugada) parts.push({ label: 'en paso', points: 1 });
      break;
    }
    case 'noQuerido':
      team = outcome.team;
      alreadyCounted = outcome.deje;
      break;
  }

  if (isJugada) parts.push(...jugadasParts(lance, hands, team, rules));
  if (lance === 'punto' && outcome.kind !== 'paso') parts.push({ label: 'el punto', points: 1 });

  const points = parts.reduce((s, p) => s + p.points, 0);
  if (points === 0 && alreadyCounted === undefined) return null;
  return { lance, team, winnerSeat, points, parts, alreadyCounted };
}

export function computeRecuento(st: HandState): {
  items: RecuentoItem[];
  scores: [number, number];
  winner: Team | null;
} {
  const scores: [number, number] = [...st.scores] as [number, number];
  const items: RecuentoItem[] = [];
  let winner: Team | null = st.winner;
  for (const res of st.results) {
    const item = lanceItem(res, st.hands, st.mano, st.rules);
    if (!item) continue;
    items.push(item);
    if (winner !== null) continue; // ya ganado: se muestra pero no cambia el resultado
    scores[item.team] += item.points;
    if (scores[item.team] >= st.rules.target) winner = item.team;
  }
  return { items, scores, winner };
}

/** Tantos totales que cada pareja gana en la mano (incluye dejes). */
export function handPoints(st: HandState): [number, number] {
  return [st.scores[0] - st.startScores[0], st.scores[1] - st.startScores[1]];
}
