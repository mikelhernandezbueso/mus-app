import { ACHIEVEMENTS } from '../content/achievements';
import { useStore } from '../state/store';
import { go } from '../router';
import { currentStreak, levelInfo } from '../state/progress';

export function Achievements() {
  const { progress } = useStore();
  const s = progress.stats;
  const lv = levelInfo(progress.xp);
  const acc = s.exercises ? Math.round((s.correct / s.exercises) * 100) : 0;
  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" aria-label="Volver" onClick={() => history.back()}>←</button>
        <h1>Logros</h1>
      </div>
      <div className="stat-grid" style={{ marginBottom: 14 }}>
        <div className="stat"><b>{lv.level}</b><span>Nivel</span></div>
        <div className="stat"><b>{progress.xp}</b><span>XP</span></div>
        <div className="stat"><b>{currentStreak(progress)}</b><span>Racha</span></div>
        <div className="stat"><b>{progress.streak.best}</b><span>Mejor racha</span></div>
        <div className="stat"><b>{acc}%</b><span>Acierto</span></div>
        <div className="stat"><b>{s.gamesWon}/{s.gamesPlayed}</b><span>Partidas</span></div>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {ACHIEVEMENTS.map((a) => {
          const got = !!progress.achievements[a.id];
          return (
            <div key={a.id} className="sena-card" style={{ opacity: got ? 1 : 0.5 }}>
              <span style={{ fontSize: '2rem', filter: got ? 'none' : 'grayscale(1)' }} aria-hidden>{a.icon}</span>
              <div className="grow">
                <b>{a.title}</b>
                <div className="small muted">{a.desc}</div>
              </div>
              {got && <span aria-label="conseguido">✅</span>}
            </div>
          );
        })}
      </div>
      <button className="btn btn--ghost btn--block" style={{ marginTop: 14 }} onClick={() => go('aprender')}>Volver al camino</button>
    </div>
  );
}
