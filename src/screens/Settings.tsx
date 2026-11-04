import { useState } from 'react';
import { useStore } from '../state/store';
import { initialProgress, saveProgress, type Settings as S } from '../state/progress';
import { go } from '../router';

function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg2" role="radiogroup">
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={value === o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function Settings() {
  const { progress, update } = useStore();
  const s = progress.settings;
  const set = <K extends keyof S>(k: K, v: S[K]) => update((p) => ({ ...p, settings: { ...p.settings, [k]: v } }));
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="screen">
      <div className="topbar"><h1>Ajustes</h1></div>
      <div className="card-box">
        <h3 style={{ marginBottom: 4 }}>Reglas</h3>
        <div className="setting">
          <div className="lbl">Variante<small>A 8 reyes, treses = reyes y doses = ases. Cambia todo el motor, los ejercicios y los bots.</small></div>
          <Seg value={s.variant} options={[{ v: '8reyes', label: '8 R' }, { v: '4reyes', label: '4 R' }]} onChange={(v) => set('variant', v)} />
        </div>
        <div className="setting">
          <div className="lbl">31 real<small>Tres sietes y una figura ganan a cualquier 31.</small></div>
          <Switch on={s.real31} onChange={(v) => set('real31', v)} label="31 real" />
        </div>
        <div className="setting">
          <div className="lbl">Juego a…<small>Tantos para ganar un juego.</small></div>
          <Seg value={s.target} options={[{ v: 30, label: '30' }, { v: 40, label: '40' }]} onChange={(v) => set('target', v)} />
        </div>
        <div className="setting">
          <div className="lbl">Juegos para la vaca<small>1 = partida rápida.</small></div>
          <Seg value={s.juegosVaca} options={[{ v: 1, label: '1' }, { v: 2, label: '2' }, { v: 3, label: '3' }]} onChange={(v) => set('juegosVaca', v)} />
        </div>
      </div>
      <div className="card-box" style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 4 }}>App</h3>
        <div className="setting">
          <div className="lbl">Sonido</div>
          <Switch on={s.sound} onChange={(v) => set('sound', v)} label="Sonido" />
        </div>
        <div className="setting">
          <div className="lbl">Ayudas visuales<small>Etiqueta "=R" en los treses y "=A" en los doses.</small></div>
          <Switch on={s.hints} onChange={(v) => set('hints', v)} label="Ayudas visuales" />
        </div>
        <div className="setting">
          <div className="lbl">Tema</div>
          <Seg value={s.theme} options={[{ v: 'auto', label: 'Auto' }, { v: 'light', label: '☀️' }, { v: 'dark', label: '🌙' }]} onChange={(v) => set('theme', v)} />
        </div>
        <div className="setting">
          <div className="lbl">Nivel de los bots</div>
          <Seg value={s.botLevel} options={[{ v: 'principiante', label: 'Fácil' }, { v: 'normal', label: 'Normal' }, { v: 'experto', label: 'Experto' }]} onChange={(v) => set('botLevel', v)} />
        </div>
        <div className="setting">
          <div className="lbl">Modo tutor<small>Te sugiere la jugada y te explica por qué.</small></div>
          <Switch on={s.tutor} onChange={(v) => set('tutor', v)} label="Modo tutor" />
        </div>
      </div>
      <div className="card-box" style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 8 }}>Progreso</h3>
        <div className="stack">
          <button className="btn btn--ghost btn--block" onClick={() => go('logros')}>🏆 Ver logros y estadísticas</button>
          <button className="btn btn--ghost btn--block" onClick={() => update((p) => ({ ...p, onboarded: false }))}>👋 Ver la bienvenida otra vez</button>
          {!confirm ? (
            <button className="btn btn--red btn--block" onClick={() => setConfirm(true)}>Reiniciar progreso</button>
          ) : (
            <div className="stack">
              <p><b>¿Seguro?</b> Se borran XP, lecciones, racha, logros y repaso (los ajustes se mantienen).</p>
              <div className="row">
                <button className="btn btn--ghost grow" onClick={() => setConfirm(false)}>Cancelar</button>
                <button className="btn btn--red grow" onClick={() => { update((p) => { const n = { ...initialProgress(), onboarded: true, settings: p.settings }; saveProgress(n); return n; }); setConfirm(false); go('aprender'); }}>Sí, borrar</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="small muted center" style={{ marginTop: 16 }}>Mus Eskola · hecho con cariño para aprender a jugar en la cuadrilla.</p>
    </div>
  );
}
