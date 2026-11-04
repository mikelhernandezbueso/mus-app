import { useEffect, useMemo, useState } from 'react';
import { LANCE_TITLE, makeRng, shuffle, teamOf } from '../engine';
import type { ChoiceExercise, Exercise, MatchExercise, OrderExercise, ShownHand, TapExercise } from '../exercises/types';
import { sfx } from '../audio';
import { CardRow, CardView } from './Card';
import { Face } from './Face';
import { inline } from './Rich';
import { useStore } from '../state/store';

export function HandsView({ hands, hint, variant }: { hands: ShownHand[]; hint?: boolean; variant: '8reyes' | '4reyes' }) {
  const many = hands.length > 2;
  return (
    <div className="hands">
      {hands.map((h) => (
        <div key={h.seat} className={`hand-line team-${teamOf(h.seat)}`}>
          <div className="who">
            {h.name}
            {h.mano && <div><span className="mano-badge">MANO</span></div>}
            {h.note && <small>{h.note}</small>}
          </div>
          <CardRow cards={h.cards} width={many ? 50 : 56} hint={hint} variant={variant} />
        </div>
      ))}
    </div>
  );
}

function Context({ ex }: { ex: Exercise }) {
  const { progress } = useStore();
  const hint = ex.hint && progress.settings.hints;
  return (
    <>
      {ex.lance && <span className={`lance-tag lance-tag--${ex.lance}`}>{LANCE_TITLE[ex.lance]}</span>}
      <div className="prompt">{inline(ex.prompt)}</div>
      {ex.face && (
        <div className="center">
          <Face sena={ex.face} size={150} />
        </div>
      )}
      {ex.hands && <HandsView hands={ex.hands} hint={hint} variant={ex.rules.variant} />}
      {ex.cards && ex.kind !== 'tap' && <CardRow cards={ex.cards} width={ex.cards.length === 1 ? 110 : 74} hint={hint} variant={ex.rules.variant} />}
    </>
  );
}

export interface ExerciseProps {
  ex: Exercise;
  onResult: (correct: boolean) => void;
  onContinue: () => void;
}

function Feedback({ ok, explain, onContinue, answerText }: { ok: boolean; explain: string; onContinue: () => void; answerText?: string }) {
  useEffect(() => {
    (ok ? sfx.correct : sfx.wrong)();
    if (!ok) {
      try {
        navigator.vibrate?.(60);
      } catch {
        /* sin vibración */
      }
    }
  }, [ok]);
  return (
    <>
    <div className="feedback-spacer" aria-hidden />
    <div className={`feedback ${ok ? 'feedback--ok' : 'feedback--bad'}`} role="alert">
      <h3>{ok ? '✅ ¡Bien!' : '❌ No era eso'}</h3>
      {!ok && answerText && (
        <p>
          <b>Respuesta: </b>
          {answerText}
        </p>
      )}
      <p>{inline(explain)}</p>
      <button className={`btn btn--block ${ok ? '' : 'btn--red'}`} onClick={onContinue} autoFocus>
        Continuar
      </button>
    </div>
    </>
  );
}

function CheckBar({ disabled, onCheck, label = 'Comprobar' }: { disabled: boolean; onCheck: () => void; label?: string }) {
  return (
    <div className="lesson-bottom">
      <button className="btn btn--block" disabled={disabled} onClick={onCheck}>
        {label}
      </button>
    </div>
  );
}

function ChoiceView({ ex, onResult, onContinue }: { ex: ChoiceExercise } & Omit<ExerciseProps, 'ex'>) {
  const [sel, setSel] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const ok = sel === ex.answer;
  const short = ex.options.every((o) => o.label.length <= 14 && !o.face) && ex.options.length <= 4;
  const answerLabel = ex.options.find((o) => o.id === ex.answer)?.label;
  return (
    <>
      <div className="lesson-body">
        <Context ex={ex} />
        <div className={`options ${short ? 'options--2' : ''}`} role="radiogroup">
          {ex.options.map((o, i) => {
            const state = checked ? (o.id === ex.answer ? 'opt--ok' : o.id === sel ? 'opt--bad' : '') : sel === o.id ? 'opt--sel' : '';
            return (
              <button key={o.id} role="radio" aria-checked={sel === o.id} className={`opt ${state}`} disabled={checked} onClick={() => { sfx.tap(); setSel(o.id); }}>
                {!short && <span className="key">{i + 1}</span>}
                {o.face && <Face sena={o.face} size={48} animate={false} />}
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {!checked && <CheckBar disabled={sel === null} onCheck={() => { setChecked(true); onResult(ok); }} />}
      {checked && <Feedback ok={ok} explain={ex.explain} answerText={answerLabel} onContinue={onContinue} />}
    </>
  );
}

function TapView({ ex, onResult, onContinue }: { ex: TapExercise } & Omit<ExerciseProps, 'ex'>) {
  const { progress } = useStore();
  const [sel, setSel] = useState<number[]>([]);
  const [none, setNone] = useState(false);
  const [checked, setChecked] = useState(false);
  const want = [...ex.answer].sort().join(',');
  const ok = none ? ex.answer.length === 0 : [...sel].sort().join(',') === want && sel.length > 0;
  const toggle = (i: number) => {
    sfx.card();
    setNone(false);
    setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  };
  return (
    <>
      <div className="lesson-body">
        <Context ex={ex} />
        <div className="my-cards" style={{ paddingTop: 20 }}>
          {ex.cards.map((c, i) => (
            <CardView
              key={i}
              card={c}
              width={78}
              hint={ex.hint && progress.settings.hints}
              variant={ex.rules.variant}
              selected={checked ? ex.answer.includes(i) : sel.includes(i)}
              dim={checked && !ex.answer.includes(i)}
              onClick={checked ? undefined : () => toggle(i)}
            />
          ))}
        </div>
        {ex.allowNone && (
          <button className={`opt ${none ? 'opt--sel' : ''}`} style={{ justifyContent: 'center' }} disabled={checked} onClick={() => { setNone(!none); setSel([]); }}>
            {ex.noneLabel ?? 'Ninguna'}
          </button>
        )}
        <p className="small muted center">{checked ? 'Resaltadas: las correctas.' : 'Toca para seleccionar. Vuelve a tocar para quitar.'}</p>
      </div>
      {!checked && <CheckBar disabled={sel.length === 0 && !none} onCheck={() => { setChecked(true); onResult(ok); }} />}
      {checked && <Feedback ok={ok} explain={ex.explain} onContinue={onContinue} />}
    </>
  );
}

function OrderView({ ex, onResult, onContinue }: { ex: OrderExercise } & Omit<ExerciseProps, 'ex'>) {
  const { progress } = useStore();
  const [order, setOrder] = useState(ex.items.map((i) => i.id));
  const [checked, setChecked] = useState(false);
  const ok = order.join() === ex.answer.join();
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    sfx.tap();
    const o = order.slice();
    [o[i], o[j]] = [o[j], o[i]];
    setOrder(o);
  };
  const byId = Object.fromEntries(ex.items.map((i) => [i.id, i]));
  return (
    <>
      <div className="lesson-body">
        <Context ex={ex} />
        <div className="order-list">
          {order.map((id, i) => (
            <div key={id} className={`order-item ${checked ? (ex.answer[i] === id ? 'opt--ok' : 'opt--bad') : ''}`}>
              <span className="rank">{i + 1}º</span>
              <CardRow cards={byId[id].cards!} width={46} hint={ex.hint && progress.settings.hints} variant={ex.rules.variant} />
              {!checked && (
                <div className="ctrls">
                  <button className="btn btn--ghost btn--sm" aria-label="Subir" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
                  <button className="btn btn--ghost btn--sm" aria-label="Bajar" onClick={() => move(i, 1)} disabled={i === order.length - 1}>▼</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="small muted center">Arriba la mejor. Usa las flechas para mover.</p>
      </div>
      {!checked && <CheckBar disabled={false} onCheck={() => { setChecked(true); onResult(ok); }} />}
      {checked && <Feedback ok={ok} explain={ex.explain} onContinue={onContinue} />}
    </>
  );
}

function MatchView({ ex, onResult, onContinue }: { ex: MatchExercise } & Omit<ExerciseProps, 'ex'>) {
  const rights = useMemo(() => {
    const r = ex.pairs.map((p, i) => ({ i, text: p.right }));
    // barajado con semilla y sin dejar ninguna en su sitio
    const rng = makeRng(ex.spec.seed ^ 0x5bd1e995);
    let out = shuffle(r, rng);
    for (let k = 0; k < 10 && out.some((x, j) => x.i === j); k++) out = shuffle(r, rng);
    return out;
  }, [ex]);
  const [left, setLeft] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const finished = done.length === ex.pairs.length;
  useEffect(() => {
    if (finished) onResult(mistakes === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);
  const pickRight = (i: number) => {
    if (left === null || done.includes(i)) return;
    if (i === left) {
      sfx.correct();
      setDone((d) => [...d, i]);
      setLeft(null);
    } else {
      sfx.wrong();
      setMistakes((m) => m + 1);
      setWrong(i);
      setTimeout(() => setWrong(null), 500);
    }
  };
  return (
    <>
      <div className="lesson-body">
        <Context ex={ex} />
        <div className="match">
          <div className="stack" style={{ gap: 8 }}>
            {ex.pairs.map((p, i) => (
              <button key={i} className={`opt ${done.includes(i) ? 'opt--done' : left === i ? 'opt--sel' : ''}`} disabled={done.includes(i)} onClick={() => { sfx.tap(); setLeft(i); }}>
                {p.left}
              </button>
            ))}
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {rights.map((r) => (
              <button key={r.i} className={`opt ${done.includes(r.i) ? 'opt--done' : wrong === r.i ? 'opt--bad' : ''}`} disabled={done.includes(r.i)} onClick={() => pickRight(r.i)}>
                {r.text}
              </button>
            ))}
          </div>
        </div>
        <p className="small muted center">Toca un término de la izquierda y luego su pareja.</p>
      </div>
      {finished && <Feedback ok={mistakes === 0} explain={mistakes === 0 ? '¡Todas a la primera!' : `Has tenido ${mistakes} fallo${mistakes > 1 ? 's' : ''}. ${ex.explain}`} onContinue={onContinue} />}
    </>
  );
}

export function ExerciseView({ ex, onResult, onContinue }: ExerciseProps) {
  const [part, setPart] = useState(0);
  const [allOk, setAllOk] = useState(true);
  if (ex.kind === 'multi') {
    const p = ex.parts[part];
    const last = part === ex.parts.length - 1;
    return (
      <div key={part} style={{ display: 'contents' }}>
        <div className="small muted" style={{ fontWeight: 800 }}>
          Mano de examen · pregunta {part + 1} de {ex.parts.length}
        </div>
        <ChoiceView
          ex={p}
          onResult={(ok) => {
            const all = allOk && ok;
            setAllOk(all);
            if (last) onResult(all);
          }}
          onContinue={() => (last ? onContinue() : setPart(part + 1))}
        />
      </div>
    );
  }
  switch (ex.kind) {
    case 'choice':
      return <ChoiceView ex={ex} onResult={onResult} onContinue={onContinue} />;
    case 'tap':
      return <TapView ex={ex} onResult={onResult} onContinue={onContinue} />;
    case 'order':
      return <OrderView ex={ex} onResult={onResult} onContinue={onContinue} />;
    case 'match':
      return <MatchView ex={ex} onResult={onResult} onContinue={onContinue} />;
  }
}
