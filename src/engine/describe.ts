// Textos en castellano que describen manos y jugadas (para explicaciones y tutor).
import { rankName, rankPlural } from './cards';
import { chicaKey, grandeKey, handSum, juegoInfo, paresInfo } from './evaluate';
import type { Card, LanceId, ParesInfo, Rules } from './types';

export const LANCE_NAMES: Record<LanceId, string> = {
  grande: 'la grande',
  chica: 'la chica',
  pares: 'los pares',
  juego: 'el juego',
  punto: 'el punto',
};
export const LANCE_TITLE: Record<LanceId, string> = {
  grande: 'Grande',
  chica: 'Chica',
  pares: 'Pares',
  juego: 'Juego',
  punto: 'Punto',
};
export const LANCE_EUSKERA: Record<LanceId, string> = {
  grande: 'handia',
  chica: 'txikia',
  pares: 'pareak',
  juego: 'jokoa',
  punto: 'puntua',
};

/** Nombre de un rango efectivo en singular ("rey", "as"…). */
export const effName = (r: number) => rankName(r);

export function describePares(p: ParesInfo): string {
  switch (p.kind) {
    case 'none':
      return 'sin pares';
    case 'pareja':
      return `pareja de ${rankPlural(p.ranks[0])}`;
    case 'medias':
      return `medias de ${rankPlural(p.ranks[0])}`;
    case 'duples':
      return p.ranks[0] === p.ranks[1]
        ? `duples de ${rankPlural(p.ranks[0])} (cuatro iguales)`
        : `duples de ${rankPlural(p.ranks[0])} y ${rankPlural(p.ranks[1])}`;
  }
}

export const describeParesHand = (h: Card[], r: Rules) => describePares(paresInfo(h, r));

export function describeJuego(h: Card[], r: Rules): string {
  const j = juegoInfo(h, r);
  if (!j.hasJuego) return `sin juego (${j.sum} de punto)`;
  if (j.isReal) return 'la 31 real';
  return j.sum === 31 ? 'la 31' : `juego de ${j.sum}`;
}

const art = (r: number) => (r === 1 ? 'un as' : r === 10 ? 'una sota' : `un ${rankName(r)}`);

/** Explica por qué `a` gana a `b` en grande o chica (primera carta que difiere). */
export function explainHighLow(lance: 'grande' | 'chica', a: Card[], b: Card[], r: Rules): string {
  const ka = lance === 'grande' ? grandeKey(a, r) : chicaKey(a, r);
  const kb = lance === 'grande' ? grandeKey(b, r) : chicaKey(b, r);
  const ord = ['primera', 'segunda', 'tercera', 'cuarta'];
  for (let i = 0; i < 4; i++) {
    if (ka[i] !== kb[i]) {
      const prefix = i === 0 ? `Su carta más ${lance === 'grande' ? 'alta' : 'baja'}` : `Empatan hasta la ${ord[i]} carta, y ahí`;
      return i === 0 ? `${prefix} es ${art(ka[i])}, contra ${art(kb[i])}.` : `${prefix} tiene ${art(ka[i])} contra ${art(kb[i])}.`;
    }
  }
  return 'Tienen exactamente lo mismo: el empate lo gana quien esté más cerca de la mano.';
}

export const sumText = (h: Card[], r: Rules) => `${handSum(h, r)}`;
