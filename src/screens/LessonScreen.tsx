import { useMemo, useState } from 'react';
import { ALL_LESSONS, lessonById } from '../content/units';
import { go } from '../router';
import { useStore } from '../state/store';
import { addReviewMiss, addXp } from '../state/progress';
import { Session, stepsToItems, type SessionResult } from './Session';
import { Confetti } from '../ui/Chrome';
import { sfx } from '../audio';
import { isUnlocked } from './Learn';

export function starsFor(r: SessionResult) {
  const miss = r.total - r.correctFirst;
  return miss === 0 ? 3 : miss <= 2 ? 2 : 1;
}

export function LessonScreen({ id }: { id: string }) {
  const { progress, update } = useStore();
  const found = lessonById(id);
  const items = useMemo(() => (found ? stepsToItems(found.lesson.steps) : []), [found]);
  const [done, setDone] = useState<{ r: SessionResult; xp: number; stars: number } | null>(null);
  if (!found) return <div className="screen">Lección no encontrada.</div>;
  if (!isUnlocked(progress.lessons, found.index) && !progress.lessons[id]) {
    return (
      <div className="screen center">
        <p>Esta lección aún está bloqueada.</p>
        <button className="btn" onClick={() => go('aprender')}>Volver</button>
      </div>
    );
  }
  const finish = (r: SessionResult) => {
    const stars = starsFor(r);
    const xp = 10 + r.correctFirst * 2 + (stars === 3 ? 5 : 0);
    update((p) => {
      let n = addXp(p, xp);
      const prev = n.lessons[id];
      n = {
        ...n,
        lessons: { ...n.lessons, [id]: { stars: Math.max(stars, prev?.stars ?? 0), completedAt: Date.now(), plays: (prev?.plays ?? 0) + 1 } },
        stats: {
          ...n.stats,
          exercises: n.stats.exercises + r.total,
          correct: n.stats.correct + r.correctFirst,
          perfectLessons: n.stats.perfectLessons + (stars === 3 ? 1 : 0),
        },
      };
      for (const m of r.misses) n = addReviewMiss(n, m, found.lesson.title);
      return n;
    });
    sfx.lessonDone();
    setDone({ r, xp, stars });
  };

  if (done) {
    const nextL = ALL_LESSONS[found.index + 1];
    return (
      <div className="lesson">
        {done.stars === 3 && <Confetti />}
        <div className="done-screen">
          <div className="big" aria-hidden>{done.stars === 3 ? '🏆' : done.stars === 2 ? '🎉' : '👍'}</div>
          <h1>¡Lección completada!</h1>
          <div style={{ fontSize: '2.2rem' }} aria-label={`${done.stars} estrellas`}>{'⭐'.repeat(done.stars)}{'☆'.repeat(3 - done.stars)}</div>
          <div className="stat-grid">
            <div className="stat"><b>+{done.xp}</b><span>XP</span></div>
            <div className="stat"><b>{done.r.correctFirst}/{done.r.total}</b><span>Aciertos</span></div>
            <div className="stat"><b>{done.r.misses.length}</b><span>Al repaso</span></div>
          </div>
          <p className="muted">{done.stars === 3 ? '¡Perfecto! Ni un fallo. Así se juega en el txoko.' : done.r.misses.length ? 'Los ejercicios fallados van a tu repaso para que los practiques.' : '¡Muy bien!'}</p>
        </div>
        <div className="stack">
          {nextL && <button className="btn btn--block" onClick={() => go(`leccion/${nextL.lesson.id}`)}>Siguiente: {nextL.lesson.title}</button>}
          <button className="btn btn--ghost btn--block" onClick={() => go('aprender')}>Volver al camino</button>
        </div>
      </div>
    );
  }
  return <Session items={items} onExit={() => go('aprender')} onFinish={finish} />;
}
