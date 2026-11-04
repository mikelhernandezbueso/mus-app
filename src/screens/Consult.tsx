import { useMemo, useState } from 'react';
import { RULES } from '../content/rules';
import { GLOSSARY } from '../content/glossary';
import { SENAS } from '../content/senas';
import { Face } from '../ui/Face';
import { CardRow } from '../ui/Card';
import { Rich } from '../ui/Rich';
import { parseHand } from '../engine';
import { useStore } from '../state/store';

const TABS = [
  { id: 'reglas', label: 'Reglamento' },
  { id: 'tablas', label: 'Tabla rápida' },
  { id: 'juegos', label: 'Juegos' },
  { id: 'senas', label: 'Señas' },
  { id: 'glosario', label: 'Glosario' },
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function Consult({ sub }: { sub?: string }) {
  const [tab, setTab] = useState(sub && TABS.some((t) => t.id === sub) ? sub : 'reglas');
  const [qs, setQs] = useState('');
  const { progress } = useStore();
  const v = progress.settings.variant;
  const gl = useMemo(() => {
    const q = norm(qs.trim());
    return GLOSSARY.filter((g) => !q || norm(`${g.term} ${g.eu ?? ''} ${g.def} ${g.origin ?? ''}`).includes(q)).sort((a, b) => a.term.localeCompare(b.term, 'es'));
  }, [qs]);
  return (
    <div className="screen">
      <div className="topbar"><h1>Consultar</h1></div>
      <div className="segmented" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'reglas' && (
        <div>
          {RULES.map((r, i) => (
            <details key={r.id} className="rule-sec" open={i === 0}>
              <summary>{r.title}</summary>
              <div className="content">
                <Rich text={r.body} />
                {r.house && <div className="house">🏠 {r.house}</div>}
              </div>
            </details>
          ))}
          <p className="small muted">Reglamento completo con fuentes: docs/REGLAMENTO.md del proyecto.</p>
        </div>
      )}

      {tab === 'tablas' && (
        <div className="stack">
          <div className="card-box">
            <h3>Valor de las cartas ({v === '8reyes' ? '8 reyes' : '4 reyes'})</h3>
            <table className="t">
              <thead><tr><th>Carta</th><th>Grande/chica/pares</th><th>Juego</th></tr></thead>
              <tbody>
                <tr><td>Rey (12)</td><td>Rey</td><td>10</td></tr>
                <tr><td>Caballo (11)</td><td>Caballo</td><td>10</td></tr>
                <tr><td>Sota (10)</td><td>Sota</td><td>10</td></tr>
                <tr><td>7, 6, 5, 4</td><td>Su número</td><td>Su número</td></tr>
                <tr><td><b>Tres</b></td><td>{v === '8reyes' ? <b>Rey</b> : 'Tres'}</td><td>{v === '8reyes' ? <b>10</b> : '3'}</td></tr>
                <tr><td><b>Dos</b></td><td>{v === '8reyes' ? <b>As</b> : 'Dos'}</td><td>{v === '8reyes' ? <b>1</b> : '2'}</td></tr>
                <tr><td>As (1)</td><td>As</td><td>1</td></tr>
              </tbody>
            </table>
          </div>
          <div className="card-box">
            <h3>Lances y premios</h3>
            <table className="t">
              <thead><tr><th>Lance</th><th>Gana</th><th>En paso</th></tr></thead>
              <tbody>
                <tr><td>Grande</td><td>Cartas más altas</td><td>1</td></tr>
                <tr><td>Chica</td><td>Cartas más bajas</td><td>1</td></tr>
                <tr><td>Pares</td><td>Duples › medias › pareja</td><td>1 / 2 / 3 por jugada</td></tr>
                <tr><td>Juego</td><td>31, 32, 40, 37…33</td><td>31: 3 · otros: 2</td></tr>
                <tr><td>Punto</td><td>Suma más alta</td><td>1</td></tr>
              </tbody>
            </table>
          </div>
          <div className="card-box">
            <h3>Envites</h3>
            <table className="t">
              <tbody>
                <tr><td>Envido</td><td>2 tantos</td></tr>
                <tr><td>No quiero (1.er envite)</td><td>1 tanto al momento</td></tr>
                <tr><td>No quiero (subida)</td><td>Lo envidado antes</td></tr>
                <tr><td>Quiero</td><td>Se cobra al final</td></tr>
                <tr><td>Órdago querido</td><td>Gana el juego quien gane el lance</td></tr>
                <tr><td>Amarraco</td><td>5 tantos</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'juegos' && (
        <div className="card-box">
          <h3 style={{ marginBottom: 8 }}>Orden de los juegos</h3>
          {[
            ['31', 'R C 7 4', 'La mejor. Vale 3.'],
            ['32', 'R S 7 5', 'Vale 2.'],
            ['40', 'R C S R', 'Vale 2.'],
            ['37', 'R C S 7', ''],
            ['36', 'R C S 6', ''],
            ['35', 'R C S 5', ''],
            ['34', 'R C S 4', ''],
            ['33', 'R C 7 6', 'El peor juego.'],
          ].map(([n, h, t], i) => (
            <div key={n} className="row" style={{ padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
              <b style={{ width: 28 }}>{i + 1}º</b>
              <b style={{ fontFamily: 'var(--display)', fontSize: '1.4rem', width: 40 }}>{n}</b>
              <CardRow cards={parseHand(h)} width={34} />
              <span className="small muted">{t}</span>
            </div>
          ))}
          <p className="small muted" style={{ marginTop: 8 }}>38 y 39 no existen con 4 cartas. Empate → gana la mano. {progress.settings.real31 ? 'La 31 real (7-7-7 + figura) gana a todas.' : 'La 31 real está desactivada en tus ajustes.'}</p>
        </div>
      )}

      {tab === 'senas' && (
        <div>
          {SENAS.map((s) => (
            <div key={s.id} className="sena-card">
              <Face sena={s.id} size={84} />
              <div>
                <b>{s.name}</b>
                <div className="small">{s.gesture}</div>
                <div className="small muted">{s.meaning}</div>
                {s.note && <div className="small muted"><i>{s.note}</i></div>}
              </div>
            </div>
          ))}
          <div className="house">🏠 Solo tras cortar el mus · nunca falsas ni parciales · el rival puede verlas.</div>
        </div>
      )}

      {tab === 'glosario' && (
        <div>
          <input className="search" type="search" placeholder="Buscar: órdago, txikia, deje…" value={qs} onChange={(e) => setQs(e.target.value)} aria-label="Buscar en el glosario" />
          {gl.map((g) => (
            <div key={g.term} className="gl-item">
              <b>{g.term}</b> {g.eu && <span className="gl-eu">· {g.eu}</span>}
              <div>{g.def}</div>
              {g.origin && <div className="small muted">📜 {g.origin}</div>}
            </div>
          ))}
          {gl.length === 0 && <p className="muted">Nada con "{qs}".</p>}
        </div>
      )}
    </div>
  );
}
