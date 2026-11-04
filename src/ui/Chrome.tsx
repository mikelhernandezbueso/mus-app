import { useEffect } from 'react';
import { go } from '../router';
import { useStore } from '../state/store';
import { currentStreak, levelInfo } from '../state/progress';

const TABS = [
  { id: 'aprender', icon: '🎓', label: 'Aprender' },
  { id: 'practicar', icon: '🏋️', label: 'Practicar' },
  { id: 'jugar', icon: '🃏', label: 'Jugar' },
  { id: 'consultar', icon: '📖', label: 'Consultar' },
  { id: 'ajustes', icon: '⚙️', label: 'Ajustes' },
];

export function TabBar({ active }: { active: string }) {
  return (
    <nav className="tabbar" aria-label="Secciones">
      {TABS.map((t) => (
        <button key={t.id} className={`tab ${active === t.id ? 'tab--on' : ''}`} onClick={() => go(t.id)} aria-current={active === t.id ? 'page' : undefined}>
          <span aria-hidden>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function StatChips() {
  const { progress } = useStore();
  const streak = currentStreak(progress);
  return (
    <div className="row" style={{ gap: 6 }}>
      <span className="chip chip--fire" title="Racha diaria">🔥 {streak}</span>
      <span className="chip chip--xp" title="Experiencia">⭐ {progress.xp}</span>
      <span className="chip" title="Nivel">🏅 {levelInfo(progress.xp).level}</span>
    </div>
  );
}

export function AchievementToast() {
  const { toast, clearToast } = useStore();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);
  if (!toast) return null;
  return (
    <div className="toast" role="status" onClick={clearToast}>
      <span className="ico">{toast.icon}</span>
      <div>
        <div className="small muted" style={{ fontWeight: 800 }}>¡Logro desbloqueado!</div>
        <b>{toast.title}</b>
        <div className="small">{toast.desc}</div>
      </div>
    </div>
  );
}

export function Confetti({ n = 40 }: { n?: number }) {
  const colors = ['#c8102e', '#e0a92c', '#1d5c3a', '#2f63a8', '#fffaf0'];
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 10) * 0.08}s`, animationDuration: `${1.4 + (i % 5) * 0.2}s` }} />
      ))}
    </div>
  );
}
