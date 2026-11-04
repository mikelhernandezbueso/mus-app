import type { SenaId } from '../engine';

export interface FaceSpec {
  mouth: 'neutral' | 'biteCenter' | 'biteSide' | 'tongueCenter' | 'tongueSide' | 'twist' | 'kiss';
  eyes: 'open' | 'wink' | 'closed';
  brows: 'normal' | 'raised';
}

export interface SenaInfo {
  id: SenaId;
  name: string;
  /** Qué significa (jugada). */
  meaning: string;
  /** Cómo se hace. */
  gesture: string;
  face: FaceSpec;
  note?: string;
}

const F = (mouth: FaceSpec['mouth'], eyes: FaceSpec['eyes'] = 'open', brows: FaceSpec['brows'] = 'normal'): FaceSpec => ({ mouth, eyes, brows });

export const SENAS: SenaInfo[] = [
  { id: 'dosReyes', name: 'Dos reyes', meaning: 'Pareja de reyes (a 8 reyes, rey o tres)', gesture: 'Morderse el labio inferior por el centro', face: F('biteCenter') },
  { id: 'tresReyes', name: 'Tres reyes', meaning: 'Medias de reyes', gesture: 'Morderse el labio inferior por un lado', face: F('biteSide') },
  { id: 'dosAses', name: 'Dos ases (pitos)', meaning: 'Pareja de ases (a 8 reyes, as o dos)', gesture: 'Sacar la punta de la lengua de frente', face: F('tongueCenter'), note: 'En algunas mesas: arrugar la nariz.' },
  { id: 'tresAses', name: 'Tres ases', meaning: 'Medias de ases', gesture: 'Sacar la punta de la lengua por un lado', face: F('tongueSide') },
  { id: 'medias', name: 'Medias', meaning: 'Medias que no son de reyes ni de ases', gesture: 'Torcer la boca cerrada hacia un lado', face: F('twist') },
  { id: 'duples', name: 'Duples', meaning: 'Duples (dos parejas o cuatro iguales)', gesture: 'Levantar las cejas', face: F('neutral', 'open', 'raised'), note: 'En Navarra también: mover los labios cerrados a los dos lados.' },
  { id: 'treintaYUna', name: '31', meaning: 'Tengo la 31, el mejor juego', gesture: 'Guiñar un ojo', face: F('neutral', 'wink') },
  { id: 'ciego', name: 'Ciego', meaning: 'No llevo nada: ni pares ni juego', gesture: 'Cerrar los dos ojos a la vez', face: F('neutral', 'closed') },
  { id: 'solomillo', name: 'Solomillo', meaning: 'Tres reyes y un as: medias de reyes y la 31', gesture: 'Lanzar un beso sin ruido', face: F('kiss'), note: 'Seña doble: en muchos torneos no se usa.' },
];

export const senaById = (id: SenaId) => SENAS.find((s) => s.id === id)!;
