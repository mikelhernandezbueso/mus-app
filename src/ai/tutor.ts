// Modo tutor: sugiere la jugada del humano y analiza la mano al terminar.
import { LANCE_TITLE, type Action, type HandState, type LanceId, type Seat, type SenaId } from '../engine';
import { decide, type Decision } from './bot';

export interface TutorRecord {
  phase: 'mus' | 'descarte' | 'apuestas';
  lance?: LanceId;
  suggested: Decision;
  taken: Action;
}

export function suggest(st: HandState, senas: Partial<Record<Seat, SenaId[]>>, scores: [number, number]): Decision {
  // El tutor razona como un bot experto con lo que sabes tú (sin hacer trampas).
  let s = 12345 + st.log.length * 31;
  const rng = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return decide(st, 0, { level: 'experto', senas, scores, rng });
}

export const actionLabel = (a: Action): string => {
  switch (a.type) {
    case 'mus': return 'Mus';
    case 'noMus': return 'No hay mus';
    case 'discard': return `Descartar ${a.indices.length}`;
    case 'paso': return 'Paso';
    case 'envido': return `Envido ${a.amount}`;
    case 'ordago': return 'Órdago';
    case 'quiero': return 'Quiero';
    case 'noQuiero': return 'No quiero';
  }
};

function same(a: Action, b: Action): boolean {
  if (a.type !== b.type) {
    // envidar 2 o 5 cuenta como la misma idea
    return false;
  }
  if (a.type === 'discard' && b.type === 'discard') return a.indices.join() === b.indices.join();
  return true;
}

function close(a: Action, b: Action): boolean {
  if (same(a, b)) return true;
  const agg = (x: Action) => x.type === 'envido' || x.type === 'ordago';
  const passive = (x: Action) => x.type === 'paso' || x.type === 'noQuiero';
  return (agg(a) && agg(b) && a.type === b.type) || (passive(a) && passive(b));
}

export interface Review {
  good: string[];
  bad: string[];
}

export function reviewHand(records: TutorRecord[]): Review {
  const good: string[] = [];
  const bad: string[] = [];
  for (const r of records) {
    const where = r.phase === 'apuestas' ? LANCE_TITLE[r.lance!] : r.phase === 'mus' ? 'Mus' : 'Descarte';
    if (close(r.taken, r.suggested.action)) {
      good.push(`${where}: «${actionLabel(r.taken)}» — bien visto.`);
    } else if (r.phase === 'descarte') {
      bad.push(`${where}: tiraste ${r.taken.type === 'discard' ? r.taken.indices.length : 0} cartas. ${r.suggested.why}`);
    } else {
      bad.push(`${where}: hiciste «${actionLabel(r.taken)}»; mejor «${actionLabel(r.suggested.action)}». ${r.suggested.why}`);
    }
  }
  return { good, bad };
}
