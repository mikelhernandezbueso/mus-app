import { useMemo, useState } from 'react';
import { go } from '../router';
import { useStore } from '../state/store';
import { addReviewMiss, addXp, dueReviews, reviewAnswered, specKey } from '../state/progress';
import { Session, type SessionItem, type SessionResult } from './Session';
import { StatChips } from '../ui/Chrome';
import { pick, makeRng, randomSeed, type Variant } from '../engine';
import type { ExerciseSpec } from '../exercises/types';
import { sfx } from '../audio';

type Mix = { gen: string; opts?: Record<string, string | number | boolean>; variant?: Variant }[];

export const TOPICS: { id: string; icon: string; title: string; desc: string; mix: Mix }[] = [
  { id: 'cartas', icon: '🂠', title: 'Las cartas', desc: 'Valores y equivalencias', mix: [{ gen: 'cardValue' }, { gen: 'cardValue', opts: { tricky: true } }, { gen: 'cardEquiv' }] },
  { id: 'grande', icon: '👑', title: 'Grande', desc: '¿Quién tiene lo más alto?', mix: [{ gen: 'grandeWinner', opts: { n: 2 } }, { gen: 'grandeWinner', opts: { n: 4 } }, { gen: 'orderHands', opts: { lance: 'grande' } }] },
  { id: 'chica', icon: '🐜', title: 'Chica', desc: '¿Quién tiene lo más bajo?', mix: [{ gen: 'chicaWinner', opts: { n: 2 } }, { gen: 'chicaWinner', opts: { n: 4 } }, { gen: 'orderHands', opts: { lance: 'chica' } }] },
  { id: 'pares', icon: '👯', title: 'Pares', desc: 'Pareja, medias, duples', mix: [{ gen: 'paresKind' }, { gen: 'tapPares' }, { gen: 'paresWinner', opts: { n: 2 } }, { gen: 'paresWinner', opts: { n: 4 } }, { gen: 'paresValue' }, { gen: 'orderHands', opts: { lance: 'pares' } }] },
  { id: 'juego', icon: '🎯', title: 'Juego y punto', desc: 'Sumar y comparar', mix: [{ gen: 'juegoSum' }, { gen: 'hasJuego' }, { gen: 'juegoWinner', opts: { n: 2 } }, { gen: 'juegoWinner', opts: { n: 4 } }, { gen: 'juegoOrPunto' }, { gen: 'puntoWinner' }] },
  { id: 'empates', icon: '✋', title: 'Empates', desc: 'El poder de la mano', mix: [{ gen: 'tieMano' }, { gen: 'juegoWinner', opts: { n: 2, tie: true } }] },
  { id: 'descartes', icon: '🔄', title: 'Descartes', desc: 'Qué tirar en el mus', mix: [{ gen: 'discardReyes' }, { gen: 'discardChica' }, { gen: 'discardPares' }] },
  { id: 'envites', icon: '🪙', title: 'Envites', desc: 'Envidar, querer y cobrar', mix: [{ gen: 'betDecision' }, { gen: 'cobroDeje' }, { gen: 'cobroLance' }] },
  { id: 'tanteo', icon: '🪨', title: 'Tanteo', desc: 'Piedras, recuento, órdagos', mix: [{ gen: 'amarracos' }, { gen: 'recuentoPaso' }, { gen: 'quienLlega' }, { gen: 'ordagoWinner' }] },
  { id: 'senas', icon: '😉', title: 'Señas', desc: 'Leer y hacer señas', mix: [{ gen: 'senaMeaning' }, { gen: 'senaGesture' }, { gen: 'senaForHand' }] },
  { id: 'examen', icon: '🃏', title: 'Manos de examen', desc: 'Una mano entera, lance a lance', mix: [{ gen: 'examHand' }] },
  { id: '4reyes', icon: '4️⃣', title: 'A 4 reyes', desc: 'Practica la otra variante', mix: [{ gen: 'cardValue', opts: { tricky: true }, variant: '4reyes' }, { gen: 'paresKind', variant: '4reyes' }, { gen: 'grandeWinner', opts: { n: 2 }, variant: '4reyes' }, { gen: 'chicaWinner', opts: { n: 2 }, variant: '4reyes' }, { gen: 'juegoSum', variant: '4reyes' }] },
  { id: 'vocabulario', icon: '📖', title: 'Vocabulario', desc: 'Castellano y euskera', mix: [{ gen: 'matchTerms', opts: { set: 'basico' } }, { gen: 'matchTerms', opts: { set: 'euskera' } }, { gen: 'matchTerms', opts: { set: 'envites' } }] },
  { id: 'teoria', icon: '❓', title: 'Reglas', desc: 'Preguntas de teoría', mix: [{ gen: 'quiz' }] },
];

const MIX_ALL: Mix = TOPICS.filter((t) => t.id !== 'examen' && t.id !== '4reyes').flatMap((t) => t.mix);

function buildItems(topicId: string, n = 10): SessionItem[] {
  const topic = TOPICS.find((t) => t.id === topicId);
  const mix = topic ? topic.mix : MIX_ALL;
  const rng = makeRng(randomSeed());
  const count = topicId === 'examen' ? 3 : n;
  return Array.from({ length: count }, () => {
    const m = pick(rng, mix);
    return { kind: 'ex', spec: { gen: m.gen, seed: randomSeed(), opts: m.opts, variant: m.variant } } as SessionItem;
  });
}

export function Practice({ sub }: { sub?: string }) {
  const { progress, update } = useStore();
  const due = dueReviews(progress);
  const [summary, setSummary] = useState<{ r: SessionResult; xp: number; review: boolean } | null>(null);
  const items = useMemo<SessionItem[]>(() => {
    if (!sub) return [];
    if (sub === 'repaso') return dueReviews(progress).slice(0, 12).map((r) => ({ kind: 'ex', spec: r.spec }));
    return buildItems(sub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub]);

  if (sub && !summary) {
    if (items.length === 0)
      return (
        <div className="screen center">
          <h2>¡Nada que repasar!</h2>
          <p className="muted">Cuando falles un ejercicio aparecerá aquí para que lo repitas más adelante.</p>
          <button className="btn" onClick={() => go('practicar')}>Volver</button>
        </div>
      );
    const isReview = sub === 'repaso';
    const finish = (r: SessionResult) => {
      const xp = 5 + r.correctFirst;
      update((p) => {
        let n = addXp(p, xp);
        n = { ...n, stats: { ...n.stats, exercises: n.stats.exercises + r.total, correct: n.stats.correct + r.correctFirst, practiceRounds: n.stats.practiceRounds + (isReview ? 0 : 1), reviewsDone: n.stats.reviewsDone + (isReview ? r.total : 0) } };
        if (isReview) {
          for (const s of r.hits) n = reviewAnswered(n, specKey(s), true);
          for (const s of r.misses) n = reviewAnswered(n, specKey(s), false);
        } else {
          const title = TOPICS.find((t) => t.id === sub)?.title ?? 'Práctica';
          for (const s of r.misses) n = addReviewMiss(n, s as ExerciseSpec, title);
        }
        return n;
      });
      sfx.lessonDone();
      setSummary({ r, xp, review: isReview });
    };
    return <Session items={items} onExit={() => go('practicar')} onFinish={finish} retryMisses={!isReview} />;
  }

  if (summary) {
    return (
      <div className="lesson">
        <div className="done-screen">
          <div className="big" aria-hidden>{summary.r.correctFirst === summary.r.total ? '🏆' : '💪'}</div>
          <h1>{summary.review ? 'Repaso hecho' : '¡Ronda terminada!'}</h1>
          <div className="stat-grid">
            <div className="stat"><b>+{summary.xp}</b><span>XP</span></div>
            <div className="stat"><b>{summary.r.correctFirst}/{summary.r.total}</b><span>Aciertos</span></div>
            <div className="stat"><b>{summary.r.misses.length}</b><span>Fallos</span></div>
          </div>
        </div>
        <div className="stack">
          {sub && sub !== 'repaso' && <button className="btn btn--block" onClick={() => { setSummary(null); go(`practicar/${sub}/${Date.now()}`); }}>Otra ronda</button>}
          <button className="btn btn--ghost btn--block" onClick={() => { setSummary(null); go('practicar'); }}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="topbar">
        <h1>Practicar</h1>
        <StatChips />
      </div>
      <p className="muted">Ejercicios infinitos: cada ronda reparte manos nuevas y el motor calcula la respuesta.</p>
      <div className="stack" style={{ marginBottom: 14 }}>
        <button className="btn btn--red btn--block" onClick={() => go('practicar/repaso')} disabled={due.length === 0}>
          🔁 Repaso de errores {due.length ? `(${due.length} pendientes)` : '(al día)'}
        </button>
        <button className="btn btn--gold btn--block" onClick={() => go('practicar/mezcla')}>🎲 Mezcla de todo</button>
      </div>
      <div className="topic-grid">
        {TOPICS.map((t) => (
          <button key={t.id} className="topic" onClick={() => go(`practicar/${t.id}`)}>
            <span className="ico" aria-hidden>{t.icon}</span>
            <b>{t.title}</b>
            <small>{t.desc}</small>
          </button>
        ))}
      </div>
      {progress.review.length > 0 && (
        <p className="small muted center" style={{ marginTop: 14 }}>
          En tu repaso hay {progress.review.length} ejercicio{progress.review.length > 1 ? 's' : ''}; vuelven cuando toca (repetición espaciada: 1, 3, 7 y 16 días).
        </p>
      )}
    </div>
  );
}
