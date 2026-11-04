import type { Card, LanceId, Rules, Seat, SenaId } from '../engine';

/** Una mano mostrada en un ejercicio. */
export interface ShownHand {
  seat: Seat;
  name: string;
  cards: Card[];
  mano?: boolean;
  /** Texto pequeño debajo (p. ej. "pares: sí"). */
  note?: string;
}

export interface Option {
  id: string;
  label: string;
  /** Cartas a mostrar dentro de la opción (opcional). */
  cards?: Card[];
  face?: SenaId;
}

interface Base {
  /** Identificador para el repaso: generador + semilla. */
  spec: ExerciseSpec;
  prompt: string;
  /** Explicación corta de POR QUÉ (se muestra al corregir). */
  explain: string;
  hands?: ShownHand[];
  /** Cartas sueltas para ilustrar. */
  cards?: Card[];
  face?: SenaId;
  /** Lance en juego (para colorear la cabecera). */
  lance?: LanceId;
  rules: Rules;
  /** Mostrar ayuda visual de equivalencias (3 = R, 2 = A). */
  hint?: boolean;
}

export interface ChoiceExercise extends Base {
  kind: 'choice';
  options: Option[];
  answer: string;
}

export interface TapExercise extends Base {
  kind: 'tap';
  cards: Card[];
  /** Índices correctos (conjunto). */
  answer: number[];
  /** Permite responder "ninguna". */
  allowNone?: boolean;
  noneLabel?: string;
}

export interface OrderExercise extends Base {
  kind: 'order';
  items: Option[];
  /** Ids en el orden correcto (mejor → peor). */
  answer: string[];
}

export interface MatchExercise extends Base {
  kind: 'match';
  pairs: { left: string; right: string }[];
}

export interface MultiExercise extends Base {
  kind: 'multi';
  parts: ChoiceExercise[];
}

export type Exercise = ChoiceExercise | TapExercise | OrderExercise | MatchExercise | MultiExercise;

export interface ExerciseSpec {
  gen: string;
  seed: number;
  /** Opciones del generador (serializables). */
  opts?: Record<string, string | number | boolean>;
  variant?: Rules['variant'];
  real31?: boolean;
}
