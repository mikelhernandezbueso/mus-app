import { useMemo, useState } from 'react';
import { generate } from '../exercises/generators';
import type { Exercise, ExerciseSpec } from '../exercises/types';
import type { Step } from '../content/units';
import { CardRow } from '../ui/Card';
import { Face } from '../ui/Face';
import { Rich } from '../ui/Rich';
import { ExerciseView } from '../ui/ExerciseView';
import { parseHand, randomSeed } from '../engine';
import { useStore } from '../state/store';
import { sfx } from '../audio';

export type SessionItem = { kind: 'teach'; step: Extract<Step, { t: 'teach' }> } | { kind: 'ex'; spec: ExerciseSpec; retry?: boolean };

export interface SessionResult {
  total: number;
  correctFirst: number;
  misses: ExerciseSpec[];
  hits: ExerciseSpec[];
}

export function stepsToItems(steps: Step[]): SessionItem[] {
  const out: SessionItem[] = [];
  for (const s of steps) {
    if (s.t === 'teach') out.push({ kind: 'teach', step: s });
    else for (let k = 0; k < (s.n ?? 1); k++) out.push({ kind: 'ex', spec: { gen: s.gen, seed: randomSeed(), opts: s.opts, variant: s.variant, real31: s.real31 } });
  }
  return out;
}

function TeachCard({ step, onNext }: { step: Extract<Step, { t: 'teach' }>; onNext: () => void }) {
  const { progress } = useStore();
  return (
    <>
      <div className="lesson-body teach">
        <div className="card-box">
          <h2>{step.title}</h2>
          <div className="body">
            <Rich text={step.body} />
          </div>
        </div>
        {step.cards && (
          <CardRow cards={parseHand(step.cards)} width={parseHand(step.cards).length > 4 ? 56 : 74} hint={step.hint && progress.settings.hints} variant={step.variant ?? '8reyes'} />
        )}
        {step.face && (
          <div className="center">
            <Face sena={step.face} size={170} />
          </div>
        )}
      </div>
      <div className="lesson-bottom">
        <button className="btn btn--block" onClick={() => { sfx.tap(); onNext(); }}>
          Entendido
        </button>
      </div>
    </>
  );
}

export function Session({ items: initial, onExit, onFinish, retryMisses = true }: { items: SessionItem[]; onExit: () => void; onFinish: (r: SessionResult) => void; retryMisses?: boolean }) {
  const { rules } = useStore();
  const [items, setItems] = useState(initial);
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<SessionResult>({ total: 0, correctFirst: 0, misses: [], hits: [] });
  const item = items[idx];
  const exercise: Exercise | null = useMemo(() => {
    if (!item || item.kind !== 'ex') return null;
    try {
      return generate(item.spec, rules);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [item, rules]);

  const next = () => {
    if (idx + 1 >= items.length) onFinish(result);
    else setIdx(idx + 1);
  };

  const record = (ok: boolean) => {
    if (!item || item.kind !== 'ex') return;
    if (item.retry) return; // los reintentos no cuentan para la nota
    setResult((r) => ({
      total: r.total + 1,
      correctFirst: r.correctFirst + (ok ? 1 : 0),
      misses: ok ? r.misses : [...r.misses, item.spec],
      hits: ok ? [...r.hits, item.spec] : r.hits,
    }));
    if (!ok && retryMisses) setItems((its) => [...its, { kind: 'ex', spec: { ...item.spec }, retry: true }]);
  };

  const pct = (idx / items.length) * 100;
  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="icon-btn" aria-label="Salir" onClick={onExit}>✕</button>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)}>
          <div style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
      </div>
      {item?.kind === 'ex' && item.retry && <div className="small muted" style={{ fontWeight: 800, marginTop: 8 }}>🔁 Otra vez, que esta se te resistió</div>}
      {item?.kind === 'teach' && <TeachCard key={idx} step={item.step} onNext={next} />}
      {item?.kind === 'ex' && exercise && <ExerciseView key={idx} ex={exercise} onResult={record} onContinue={next} />}
      {item?.kind === 'ex' && !exercise && (
        <div className="lesson-body">
          <p>No he podido generar este ejercicio.</p>
          <button className="btn" onClick={next}>Saltar</button>
        </div>
      )}
    </div>
  );
}
