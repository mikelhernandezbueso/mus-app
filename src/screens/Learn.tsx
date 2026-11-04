import { ALL_LESSONS, UNITS } from '../content/units';
import { go } from '../router';
import { useStore } from '../state/store';
import { currentStreak, dueReviews, levelInfo, todayXp } from '../state/progress';
import { StatChips } from '../ui/Chrome';

export function isUnlocked(lessonsDone: Record<string, unknown>, index: number) {
  return index === 0 || !!lessonsDone[ALL_LESSONS[index - 1].lesson.id];
}

export function Learn() {
  const { progress } = useStore();
  const lv = levelInfo(progress.xp);
  const firstOpen = ALL_LESSONS.find((x) => !progress.lessons[x.lesson.id]);
  const due = dueReviews(progress).length;
  const doneCount = Object.keys(progress.lessons).length;
  const today = todayXp(progress);
  const goal = progress.settings.dailyGoal;
  return (
    <div className="screen">
      <div className="topbar">
        <h1>Aprender</h1>
        <StatChips />
      </div>
      <div className="hero">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="small" style={{ opacity: 0.85, fontWeight: 800 }}>Nivel {lv.level}</div>
            <h2>{lv.title}</h2>
          </div>
          <div style={{ fontSize: '2.4rem' }} aria-hidden>{currentStreak(progress) > 0 ? '🔥' : '🃏'}</div>
        </div>
        <div className="xpbar" aria-label="Progreso de nivel">
          <div style={{ width: `${(lv.into / lv.need) * 100}%` }} />
        </div>
        <div className="small" style={{ marginTop: 6, opacity: 0.9 }}>
          {lv.into}/{lv.need} XP para el siguiente nivel · {doneCount}/{ALL_LESSONS.length} lecciones
        </div>
        <div className="goal" aria-label={`Objetivo de hoy: ${today} de ${goal} XP`}>
          <span aria-hidden>{today >= goal ? '✅' : '🎯'}</span>
          <div className="grow">
            <div className="small" style={{ fontWeight: 800 }}>
              {today >= goal ? '¡Objetivo de hoy cumplido!' : `Objetivo de hoy: ${today}/${goal} XP`}
            </div>
            <div className="xpbar xpbar--goal"><div style={{ width: `${Math.min(100, (today / goal) * 100)}%` }} /></div>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          {firstOpen && (
            <button className="btn btn--gold grow" onClick={() => go(`leccion/${firstOpen.lesson.id}`)}>
              ▶ {doneCount === 0 ? 'Empezar' : 'Continuar'}
            </button>
          )}
          {due > 0 && (
            <button className="btn btn--red" onClick={() => go('practicar/repaso')}>🔁 Repaso ({due})</button>
          )}
          <button className="btn btn--ghost" aria-label="Logros" onClick={() => go('logros')}>🏆</button>
        </div>
      </div>

      {UNITS.map((u) => {
        const firstIdx = ALL_LESSONS.findIndex((x) => x.unit.id === u.id);
        const unitLocked = !isUnlocked(progress.lessons, firstIdx);
        const done = u.lessons.filter((l) => progress.lessons[l.id]).length;
        return (
          <section className="unit" key={u.id} aria-label={`Unidad ${u.n}`}>
            <div className={`unit-head ${unitLocked ? 'unit-head--locked' : ''}`}>
              <div className="unit-icon" aria-hidden>{u.icon}</div>
              <div className="grow">
                <small>Unidad {u.n}{u.eu ? ` · ${u.eu}` : ''}</small>
                <h3>{u.title}</h3>
                <small>{u.desc}</small>
              </div>
              <div className="pill" style={{ background: 'rgba(255,255,255,.18)', color: '#fff', border: 0 }}>{done}/{u.lessons.length}</div>
            </div>
            <div className="path">
              {u.lessons.map((l, i) => {
                const idx = firstIdx + i;
                const res = progress.lessons[l.id];
                const unlocked = isUnlocked(progress.lessons, idx);
                const current = firstOpen?.lesson.id === l.id;
                const offset = [0, 46, 0, -46][i % 4];
                return (
                  <div className="node-wrap" key={l.id} style={{ transform: `translateX(${offset}px)` }}>
                    {current && <div className="start-bubble">{doneCount === 0 ? '¡Empieza aquí!' : 'Siguiente'}</div>}
                    <button
                      className={`node ${res ? 'node--done' : unlocked ? '' : 'node--locked'} ${current ? 'node--current' : ''}`}
                      disabled={!unlocked}
                      aria-label={`${l.title}${res ? `, completada con ${res.stars} estrellas` : unlocked ? '' : ', bloqueada'}`}
                      onClick={() => go(`leccion/${l.id}`)}
                    >
                      {res ? '★' : unlocked ? '▶' : '🔒'}
                    </button>
                    <div className="node-label">{l.title}</div>
                    {res && <div className="stars" aria-hidden>{'⭐'.repeat(res.stars)}{'☆'.repeat(3 - res.stars)}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="center small muted" style={{ marginTop: 24 }}>Eskerrik asko por aprender mus 💚</p>
    </div>
  );
}
