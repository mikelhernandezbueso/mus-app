import { useEffect, useMemo, useRef, useState } from 'react';
import {
  advanceGame, applyAction, currentActor, LANCE_TITLE, newGame, randomSeed, senasForHand, teamOf, describePares,
  describeJuego, handSum, amarracos, piedrasSueltas, makeRng, paresInfo, effRank,
  type Action, type GameState, type HandEvent, type LanceId, type Seat, type SenaId,
} from '../engine';
import { decide, type Level } from '../ai/bot';
import { reviewHand, suggest, actionLabel, type TutorRecord } from '../ai/tutor';
import { useStore } from '../state/store';
import { addXp, type Pace } from '../state/progress';
import { go } from '../router';
import { CardView } from '../ui/Card';
import { Face } from '../ui/Face';
import { SENAS, senaById } from '../content/senas';
import { sfx } from '../audio';
import { Confetti } from '../ui/Chrome';

const NAMES = ['Tú', 'Iker', 'Maite', 'Jon'];
const SAVE_KEY = 'mus-eskola-partida';

/** Tiempos (ms) de cada ritmo: lo que tarda un bot en hablar, la pausa tras cada lance y antes del recuento. */
const PACE: Record<Pace, { mus: number; desc: number; bet: number; lanceEnd: number; end: number }> = {
  paso: { mus: 0, desc: 0, bet: 0, lanceEnd: 0, end: 1500 },
  pausado: { mus: 1700, desc: 1500, bet: 2400, lanceEnd: 2200, end: 2200 },
  normal: { mus: 1000, desc: 900, bet: 1400, lanceEnd: 1200, end: 1300 },
  rapido: { mus: 450, desc: 400, bet: 650, lanceEnd: 500, end: 600 },
};
const PACE_LABEL: Record<Pace, string> = { paso: 'Paso a paso', pausado: 'Lento', normal: 'Normal', rapido: 'Rápido' };
const CATCH: Record<Level, number> = { principiante: 0.6, normal: 0.35, experto: 0.15 };
const BOT_CATCH: Record<Level, number> = { principiante: 0.1, normal: 0.25, experto: 0.4 };

interface SenaState {
  /** Señas de cada asiento en esta mano (las verdaderas). */
  made: Partial<Record<Seat, SenaId[]>>;
  /** Qué señas conoce cada asiento. */
  known: Record<Seat, Partial<Record<Seat, SenaId[]>>>;
  /** Señas de rivales que has pillado. */
  caught: Seat[];
  humanDone: boolean;
}

interface Saved {
  game: GameState;
  senas: SenaState;
  level: Level;
  tutor: boolean;
}

const emptySenas = (): SenaState => ({ made: {}, known: { 0: {}, 1: {}, 2: {}, 3: {} }, caught: [], humanDone: false });

function loadSaved(): Saved | null {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    return s ? (JSON.parse(s) as Saved) : null;
  } catch {
    return null;
  }
}

function bubbleFor(e: HandEvent): { text: string; cls?: string } | null {
  switch (e.kind) {
    case 'mus': return { text: 'Mus' };
    case 'noMus': return { text: '¡No hay mus!', cls: 'bubble--envido' };
    case 'discard': return { text: `Tira ${e.count}` };
    case 'declare': return { text: `${e.lance === 'pares' ? 'Pares' : 'Juego'}: ${e.has ? 'sí' : 'no'}` };
    case 'paso': return { text: 'Paso' };
    case 'envido': return { text: e.raise ? `${e.amount} más` : e.amount === 2 ? 'Envido' : `Envido ${e.amount}`, cls: 'bubble--envido' };
    case 'ordago': return { text: '¡Órdago!', cls: 'bubble--ordago' };
    case 'quiero': return { text: 'Quiero', cls: 'bubble--quiero' };
    case 'noQuiero': return { text: 'No quiero', cls: 'bubble--no' };
    default: return null;
  }
}

function outcomeText(e: Extract<HandEvent, { kind: 'lanceEnd' }>): string {
  const o = e.outcome;
  const L = LANCE_TITLE[e.lance];
  switch (o.kind) {
    case 'noSeJuega': return `${L}: nadie tiene, no se juega.`;
    case 'unaPareja': return `${L}: solo tienen ${o.team === 0 ? 'Tú y Maite' : 'Iker y Jon'}; cobran al final.`;
    case 'paso': return `${L}: en paso.`;
    case 'querido': return `${L}: ${o.amount} querido. Se verá al final.`;
    case 'noQuerido': return `${L}: no quiero. ${o.team === 0 ? 'Cobráis' : 'Cobran'} ${o.deje}.`;
    case 'ordago': return `¡Órdago a ${L.toLowerCase()} querido!`;
  }
}

function Score({ label, tantos, juegos, us }: { label: string; tantos: number; juegos: number; us: boolean }) {
  const a = amarracos(tantos);
  const p = piedrasSueltas(tantos);
  return (
    <div className={`score-team ${us ? 'score-team--us' : 'score-team--them'}`} aria-label={`${label}: ${tantos} tantos`}>
      <small>{label}{juegos ? ` · ${juegos}J` : ''}</small>
      <b>{tantos}</b>
      <div className="amarracos" aria-hidden>
        {Array.from({ length: a }, (_, i) => <i key={`a${i}`} />)}
        {Array.from({ length: p }, (_, i) => <i key={`p${i}`} className="p" />)}
      </div>
    </div>
  );
}

export default function Play() {
  const { progress, update, rules } = useStore();
  const [saved] = useState(loadSaved);
  const [level, setLevel] = useState<Level>(saved?.level ?? progress.settings.botLevel);
  const [tutor, setTutor] = useState(saved?.tutor ?? progress.settings.tutor);
  const [game, setGame] = useState<GameState | null>(null);
  const [senas, setSenas] = useState<SenaState>(emptySenas());
  const [sel, setSel] = useState<number[]>([]);
  const [records, setRecords] = useState<TutorRecord[]>([]);
  const [senaSheet, setSenaSheet] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [senaMsg, setSenaMsg] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [revealMeaning, setRevealMeaning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [endShown, setEndShown] = useState(false);
  const pace: Pace = progress.settings.pace ?? 'pausado';
  const setPace = (v: Pace) => update((p) => ({ ...p, settings: { ...p.settings, pace: v } }));
  const lanceEndsRef = useRef(0);
  const rngRef = useRef(makeRng(randomSeed()));

  const hand = game?.hand;
  const actor = hand ? currentActor(hand) : null;

  // Guardar partida en curso
  useEffect(() => {
    if (!game) return;
    try {
      if (game.vacaWinner !== null) localStorage.removeItem(SAVE_KEY);
      else localStorage.setItem(SAVE_KEY, JSON.stringify({ game, senas, level, tutor } satisfies Saved));
    } catch { /* */ }
  }, [game, senas, level, tutor]);

  const start = (resume: boolean) => {
    if (resume && saved) {
      setGame(saved.game);
      setSenas(saved.senas);
    } else {
      setGame(newGame(rules, randomSeed(), Math.floor(Math.random() * 4) as Seat));
      setSenas(emptySenas());
    }
    setRecords([]);
    sfx.deal();
  };

  // Señas al cortar el mus
  const cutDone = !!hand && hand.phase !== 'mus' && hand.phase !== 'descarte' && !!hand.declared;
  useEffect(() => {
    if (!hand || !cutDone || senas.made[1] !== undefined) return;
    const made: SenaState['made'] = {};
    for (const s of [1, 2, 3] as Seat[]) made[s] = senasForHand(hand.hands[s], hand.rules);
    const known: SenaState['known'] = { 0: { 2: made[2] }, 1: { 3: made[3] }, 2: {}, 3: { 1: made[1] } };
    const caught: Seat[] = [];
    for (const s of [1, 3] as Seat[]) if (rngRef.current() < CATCH[level]) { caught.push(s); known[0][s] = made[s]; }
    // los rivales también pueden pillar la seña de Maite
    for (const s of [1, 3] as Seat[]) if (rngRef.current() < BOT_CATCH[level]) known[s][2] = made[2];
    setSenas({ made, known, caught, humanDone: false });
    setShowPartner(true);
    setRevealMeaning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cutDone, hand?.seed]);
  // La cara de la seña se ve unos segundos (más si el ritmo es lento) y se puede volver a abrir.
  useEffect(() => {
    if (!showPartner) return;
    const t = setTimeout(() => setShowPartner(false), pace === 'rapido' ? 3500 : 6000);
    return () => clearTimeout(t);
  }, [showPartner, pace]);

  // Turno de los bots: con calma, para que se pueda seguir la mano.
  const botStep = () => {
    if (!game || !hand || hand.phase === 'terminada' || actor === null || actor === 0) return;
    const d = decide(hand, actor, { level, senas: senas.known[actor], scores: hand.scores, rng: rngRef.current });
    act(d.action);
  };
  useEffect(() => {
    if (!game || !hand) return;
    const ends = hand.log.filter((e) => e.kind === 'lanceEnd').length;
    const justEnded = ends > lanceEndsRef.current;
    lanceEndsRef.current = ends;
    if (hand.phase === 'terminada' || actor === null || actor === 0 || paused || pace === 'paso') return;
    const t0 = PACE[pace];
    const delay = (hand.phase === 'mus' ? t0.mus : hand.phase === 'descarte' ? t0.desc : t0.bet) + (justEnded ? t0.lanceEnd : 0);
    const t = setTimeout(botStep, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, actor, paused, pace]);

  // El recuento sale tras una pausa, para ver la última jugada.
  useEffect(() => {
    if (!hand || hand.phase !== 'terminada') { setEndShown(false); return; }
    const t = setTimeout(() => setEndShown(true), PACE[pace].end);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand?.phase, game?.handNo]);

  const suggestion = useMemo(() => {
    if (!tutor || !hand || actor !== 0 || hand.phase === 'terminada') return null;
    return suggest(hand, senas.known[0], hand.scores);
  }, [tutor, hand, actor, senas.known]);

  const act = (a: Action) => {
    if (!game) return;
    const h = game.hand;
    const seat = currentActor(h);
    if (seat === 0 && tutor) {
      const sug = suggestion ?? suggest(h, senas.known[0], h.scores);
      setRecords((r) => [...r, { phase: h.phase as TutorRecord['phase'], lance: h.bet?.lance, suggested: sug, taken: a }]);
    }
    const next = applyAction(h, a);
    if (a.type === 'ordago') sfx.ordago();
    else if (a.type === 'envido') sfx.coin();
    else if (a.type === 'discard') sfx.card();
    else sfx.tap();
    if (next.phase === 'terminada') {
      const won = next.winner;
      if (won !== null) (won === 0 ? sfx.win : sfx.lose)();
    }
    if (h.phase === 'descarte' && next.phase === 'mus') sfx.deal();
    setGame({ ...game, hand: next });
    setSel([]);
  };

  // Fin de mano: estadísticas
  const handEndedRef = useRef<number>(-1);
  useEffect(() => {
    if (!game || game.hand.phase !== 'terminada' || handEndedRef.current === game.handNo) return;
    handEndedRef.current = game.handNo;
    const ord = game.hand.results.find((r) => r.outcome.kind === 'ordago');
    const ordWon = ord && ord.outcome.kind === 'ordago' && teamOf(ord.outcome.winner) === 0;
    update((p) => addXp({ ...p, stats: { ...p.stats, handsPlayed: p.stats.handsPlayed + 1, ordagosWon: p.stats.ordagosWon + (ordWon ? 1 : 0) } }, 2));
  }, [game, update]);

  const nextHand = () => {
    if (!game) return;
    const g = advanceGame(game);
    if (g.vacaWinner !== null) {
      const won = g.vacaWinner === 0;
      update((p) => addXp({ ...p, stats: { ...p.stats, gamesPlayed: p.stats.gamesPlayed + 1, gamesWon: p.stats.gamesWon + (won ? 1 : 0) } }, won ? 25 : 10));
    } else sfx.deal();
    setGame(g);
    setSenas(emptySenas());
    setRecords([]);
  };

  // ------------------------------------------------------------ pantalla inicial
  if (!game) {
    return (
      <div className="screen screen--full">
        <div className="topbar">
          <button className="icon-btn" aria-label="Volver" onClick={() => go('aprender')}>←</button>
          <h1>Jugar</h1>
        </div>
        <div className="hero" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }} aria-hidden>🃏</div>
          <h2>Partida 2 contra 2</h2>
          <p style={{ opacity: 0.9 }}>Tú y Maite contra Iker y Jon. {rules.variant === '8reyes' ? '8 reyes' : '4 reyes'}, a {rules.target} tantos{rules.juegosVaca > 1 ? `, vaca a ${rules.juegosVaca} juegos` : ''}{rules.real31 ? ', con 31 real' : ''}.</p>
        </div>
        <div className="card-box stack" style={{ marginTop: 14 }}>
          <div>
            <b>Nivel de los bots</b>
            <div className="seg2" style={{ marginTop: 8, width: '100%' }}>
              {(['principiante', 'normal', 'experto'] as Level[]).map((l) => (
                <button key={l} className={level === l ? 'on' : ''} style={{ flex: 1 }} onClick={() => setLevel(l)}>
                  {l === 'principiante' ? 'Fácil' : l === 'normal' ? 'Normal' : 'Experto'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <b>Ritmo de la partida</b>
            <div className="small muted">En «Paso a paso» los rivales esperan a que toques «Siguiente jugada».</div>
            <div className="seg2" style={{ marginTop: 8, width: '100%' }}>
              {(['paso', 'pausado', 'normal', 'rapido'] as Pace[]).map((v) => (
                <button key={v} className={pace === v ? 'on' : ''} style={{ flex: 1, padding: '8px 4px' }} onClick={() => setPace(v)}>
                  {PACE_LABEL[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><b>Modo tutor</b><div className="small muted">Te sugiere cada jugada y te explica por qué.</div></div>
            <button className={`switch ${tutor ? 'on' : ''}`} role="switch" aria-checked={tutor} aria-label="Modo tutor" onClick={() => setTutor(!tutor)} />
          </div>
        </div>
        <div className="stack" style={{ marginTop: 16 }}>
          {saved && saved.game.vacaWinner === null && (
            <button className="btn btn--gold btn--block" onClick={() => start(true)}>▶ Continuar partida ({saved.game.scores[0]}-{saved.game.scores[1]})</button>
          )}
          <button className="btn btn--block" onClick={() => start(false)}>Nueva partida</button>
          {Object.keys(progress.lessons).length < 30 && (
            <div className="house">💡 Aún estás aprendiendo: deja el <b>modo tutor</b> activado y el nivel <b>Fácil</b>. El tutor te dirá qué haría un experto en cada jugada y por qué.</div>
          )}
          <p className="small muted center">Las reglas y variantes se cambian en Ajustes.</p>
        </div>
      </div>
    );
  }

  const h = game.hand;
  // ------------------------------------------------------------ fin de la vaca
  if (game.vacaWinner !== null) {
    const won = game.vacaWinner === 0;
    return (
      <div className="lesson">
        {won && <Confetti />}
        <div className="done-screen">
          <div className="big" aria-hidden>{won ? '🏆' : '🍷'}</div>
          <h1>{won ? '¡Habéis ganado!' : 'Han ganado Iker y Jon'}</h1>
          <p className="muted">{won ? 'Zorionak! Maite está encantada contigo.' : 'Ánimo: revisa el tutor y la revancha será vuestra.'}</p>
          <div className="stat-grid">
            <div className="stat"><b>{game.juegos[0]}-{game.juegos[1]}</b><span>Juegos</span></div>
            <div className="stat"><b>{game.history.length}</b><span>Manos</span></div>
            <div className="stat"><b>+{won ? 25 : 10}</b><span>XP</span></div>
          </div>
        </div>
        <div className="stack">
          <button className="btn btn--block" onClick={() => { setGame(null); try { localStorage.removeItem(SAVE_KEY); } catch { /* */ } }}>Otra partida</button>
          <button className="btn btn--ghost btn--block" onClick={() => go('aprender')}>Salir</button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ mesa
  const lastEvents: Partial<Record<Seat, HandEvent>> = {};
  let status = '';
  let result = '';
  let recent: string[] = [];
  {
    // eventos desde el último inicio de lance o de ronda de mus
    let start = 0;
    for (let i = h.log.length - 1; i >= 0; i--) {
      const e = h.log[i];
      if (e.kind === 'lanceStart' || e.kind === 'reparto') { start = i; break; }
    }
    for (let i = start; i < h.log.length; i++) {
      const e = h.log[i];
      if ('seat' in e && e.seat !== undefined) lastEvents[e.seat as Seat] = e;
    }
    const since = h.log.slice(start);
    const betSpoken = since.some((e) => ['paso', 'envido', 'ordago', 'quiero', 'noQuiero'].includes(e.kind));
    let prevEnd: Extract<HandEvent, { kind: 'lanceEnd' }> | undefined;
    for (let i = start - 1; i >= 0; i--) {
      const e = h.log[i];
      if (e.kind === 'lanceEnd') { prevEnd = e; break; }
      if (e.kind === 'lanceStart' && i < start - 1) break;
    }
    const skipped = h.log.slice(0, start).filter((e) => e.kind === 'lanceEnd' && (e.outcome.kind === 'noSeJuega' || e.outcome.kind === 'unaPareja'));
    if (h.phase === 'mus') status = h.musRound ? `Ronda de mus ${h.musRound + 1}` : '¿Mus o no hay mus?';
    else if (h.phase === 'descarte') status = 'Descartes: elige qué tirar';
    else if (h.bet) {
      const who = `Hablan ${h.bet.participants.map((x) => NAMES[x]).join(', ')}`;
      if (h.bet.total || h.bet.ordago) status = `${h.bet.ordago ? '¡Órdago' : `${h.bet.total} envidados`} a ${LANCE_TITLE[h.bet.lance].toLowerCase()}${h.bet.ordago ? '!' : ''}`;
      else if (!betSpoken && h.bet.lance === 'grande') status = `Se corta el mus. Grande. ${who}.`;
      else status = `${LANCE_TITLE[h.bet.lance]}. ${who}.`;
      if (!betSpoken && prevEnd) {
        const extra = skipped.length && skipped.at(-1) !== prevEnd ? ` ${outcomeText(skipped.at(-1) as Extract<HandEvent, { kind: 'lanceEnd' }>)}` : '';
        result = `${outcomeText(prevEnd)}${extra}`;
      }
    } else if (h.phase === 'terminada') {
      const lastEnd = [...h.log].reverse().find((e) => e.kind === 'lanceEnd') as Extract<HandEvent, { kind: 'lanceEnd' }> | undefined;
      status = 'Fin de la mano: se levantan las cartas…';
      if (lastEnd) result = outcomeText(lastEnd);
    }
    recent = since.filter((e) => e.kind !== 'lanceStart').map(logLine).filter((x): x is string => !!x).slice(-3);
  }
  const lastSpoken = [...h.log].reverse().find((e) => ['mus', 'noMus', 'discard', 'paso', 'envido', 'ordago', 'quiero', 'noQuiero'].includes(e.kind));
  const reading = tutor && lastSpoken && 'seat' in lastSpoken && lastSpoken.seat !== 0 ? readingFor(lastSpoken) : null;
  const waitingBot = h.phase !== 'terminada' && actor !== null && actor !== 0;
  const currentLance: LanceId | null = h.bet?.lance ?? null;
  const lancesList: LanceId[] = ['grande', 'chica', 'pares', h.declared && !h.declared.juego.some(Boolean) ? 'punto' : 'juego'];
  const doneLances = new Set(h.results.map((r) => r.lance));
  const myTurn = actor === 0 && h.phase !== 'terminada';
  const partnerSena = senas.made[2];

  const seatView = (s: Seat, pos: 'top' | 'left' | 'right') => {
    const ev = lastEvents[s];
    const b = ev ? bubbleFor(ev) : null;
    const caughtSena = s !== 2 && senas.caught.includes(s) ? senas.made[s] : undefined;
    return (
      <div className={`seat seat--${pos} ${actor === s ? 'seat--turn' : ''}`}>
        <div className="seat-name">
          {NAMES[s]} {h.mano === s && <span className="mano-badge">MANO</span>}
        </div>
        <div className="mini-cards" aria-label={`Cartas de ${NAMES[s]}`}>
          {h.hands[s].map((_, i) => <CardView key={i} faceDown width={pos === 'top' ? 38 : 40} />)}
        </div>
        {b && <div className={`bubble ${b.cls ?? ''}`}>{b.text}</div>}
        {s === 2 && partnerSena && (
          <button className="pill" style={{ marginTop: 2, cursor: 'pointer' }} onClick={() => setShowPartner(true)} aria-label="Ver la seña de Maite">😉 seña</button>
        )}
        {caughtSena && caughtSena.length > 0 && (
          <button className="pill" style={{ cursor: 'pointer', background: '#fbe1e1', color: '#9e0c24' }} onClick={() => setSenaMsg(`¡Has pillado a ${NAMES[s]}! Su seña: ${caughtSena.map((x) => senaById(x).name).join(' + ')} (${caughtSena.map((x) => senaById(x).meaning.toLowerCase()).join('; ')}).`)}>
            👀 pillada
          </button>
        )}
      </div>
    );
  };

  const humanSenaOptions = senasForHand(h.hands[0], h.rules);
  const makeSena = (id: SenaId | null) => {
    setSenaSheet(false);
    if (id === null) return;
    const correct = humanSenaOptions.includes(id);
    if (!correct) {
      setSenaMsg(`Esa seña no corresponde a tus cartas (${senaById(id).name}). En el mus las señas no pueden ser falsas. ${humanSenaOptions.length ? `La tuya sería: ${humanSenaOptions.map((x) => senaById(x).name).join(' + ')}.` : 'Con tu mano no hay seña que hacer.'}`);
      return;
    }
    setSenas((st) => {
      const known = { ...st.known, 2: { ...st.known[2], 0: humanSenaOptions } };
      const caughtBy: Seat[] = [];
      for (const s of [1, 3] as Seat[]) if (rngRef.current() < BOT_CATCH[level]) { known[s] = { ...known[s], 0: humanSenaOptions }; caughtBy.push(s); }
      setSenaMsg(`Maite ha visto tu seña: ${humanSenaOptions.map((x) => senaById(x).name).join(' + ')}.${caughtBy.length ? ` ¡Ojo! ${caughtBy.map((s) => NAMES[s]).join(' y ')} también te ha${caughtBy.length > 1 ? 'n' : ''} pillado.` : ''}`);
      return { ...st, known, humanDone: true };
    });
    update((p) => ({ ...p, stats: { ...p.stats, senasRead: p.stats.senasRead + 1 } }));
  };

  const legal = myTurn ? (h.phase === 'mus' ? 'mus' : h.phase === 'descarte' ? 'descarte' : h.bet!.stage) : null;
  const sugText = suggestion ? actionLabel(suggestion.action) : '';
  const review = h.phase === 'terminada' && tutor ? reviewHand(records) : null;

  return (
    <div className="table-screen">
      <div className="table-top">
        <button className="icon-btn" aria-label="Salir de la partida" onClick={() => go('aprender')} style={{ color: '#fff', minWidth: 36, padding: 4 }}>✕</button>
        <button className="icon-btn" aria-label="Historial de la mano" onClick={() => setShowLog(true)} style={{ color: '#fff', fontSize: '1.1rem', minWidth: 36, padding: 4 }}>📜</button>
        <div className="score">
          <Score label="Nosotros" tantos={h.scores[0]} juegos={game.juegos[0]} us />
          <Score label="Ellos" tantos={h.scores[1]} juegos={game.juegos[1]} us={false} />
        </div>
        {h.phase === 'apuestas' && !senas.humanDone ? (
          <button className="btn btn--gold btn--sm" style={{ minWidth: 46, padding: '4px 6px', flexDirection: 'column', gap: 0, lineHeight: 1 }} aria-label="Hacer seña a Maite" onClick={() => setSenaSheet(true)}>😉<span style={{ fontSize: '0.62rem' }}>seña</span></button>
        ) : (
          <div className="small" style={{ fontWeight: 900, width: 46, textAlign: 'center' }}>a {h.rules.target}</div>
        )}
      </div>

      <div className="felt">
        {seatView(2, 'top')}
        {seatView(3, 'left')}
        <div className="center-area">
          <div className="lances">
            {lancesList.map((l) => (
              <span key={l} className={`lance-chip ${currentLance === l ? 'lance-chip--on' : doneLances.has(l) ? 'lance-chip--done' : ''}`}>{LANCE_TITLE[l]}</span>
            ))}
          </div>
          {h.bet && h.bet.total > 0 && (
            <div className="pot"><span className="coin" /> {h.bet.ordago ? 'ÓRDAGO' : `${h.bet.total}`}</div>
          )}
          {result && <div className="lance-result" role="status">{result}</div>}
          <div className="status-text" role="status">{status}</div>
          {recent.length > 0 && h.phase === 'apuestas' && (
            <div className="ticker" aria-label="Últimas jugadas">
              {recent.map((l, i) => <div key={`${h.log.length}-${i}`} className={i === recent.length - 1 ? 'last' : ''}>{l}</div>)}
            </div>
          )}
          {showPartner && partnerSena && (
            <div className="sena-face-bubble sena-face-bubble--float" onClick={() => (revealMeaning || tutor ? setShowPartner(false) : setRevealMeaning(true))}>
              <Face sena={partnerSena[0]} size={76} />
              <small>Maite te hace una seña</small>
              {(tutor || revealMeaning) ? (
                <small style={{ color: '#1d5c3a' }}>{partnerSena.map((x) => senaById(x).name).join(' + ')}</small>
              ) : (
                <small style={{ color: '#7a6650' }}>¿Qué significa? Toca</small>
              )}
            </div>
          )}
        </div>
        {seatView(1, 'right')}
        <div className={`me ${actor === 0 ? 'seat--turn' : ''}`}>
          <div className="seat-name">Tú {h.mano === 0 && <span className="mano-badge">MANO</span>}</div>
          <div className="my-cards" style={{ paddingTop: 8 }}>
            {h.hands[0]
              .map((c, i) => ({ c, i }))
              .sort((a, b) => effRank(b.c, h.rules) - effRank(a.c, h.rules) || b.c.rank - a.c.rank)
              .map(({ c, i }, pos) => (
                <CardView
                  key={`${game.handNo}-${c.rank}${c.suit}`}
                  card={c}
                  width={74}
                  hint={progress.settings.hints}
                  variant={h.rules.variant}
                  className="deal-in"
                  style={{ animationDelay: `${pos * 0.06}s` }}
                  selected={sel.includes(i)}
                  onClick={legal === 'descarte' ? () => { sfx.card(); setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i])); } : undefined}
                />
              ))}
          </div>
          {lastEvents[0] && bubbleFor(lastEvents[0]) && <div className="bubble" style={{ position: 'static' }}>{bubbleFor(lastEvents[0])!.text}</div>}
        </div>
      </div>

      <div className="actions">
        {suggestion && myTurn && (
          <div className="tutor" role="note">
            <span className="owl" aria-hidden>🦉</span>
            <div><b>Tutor: {sugText}.</b> {suggestion.why}</div>
          </div>
        )}
        {reading && !myTurn && (
          <div className="tutor" role="note">
            <span className="owl" aria-hidden>🦉</span>
            <div><b>Lectura:</b> {reading}</div>
          </div>
        )}
        {waitingBot && (
          <div className="wait-row">
            <div className="small grow" style={{ fontWeight: 800 }}>
              {pace === 'paso' || paused ? `Le toca a ${NAMES[actor!]}` : <>Pensando: {NAMES[actor!]}<span className="think-dots" aria-hidden><i>.</i><i>.</i><i>.</i></span></>}
            </div>
            {pace !== 'paso' && (
              <button className="btn btn--ghost btn--sm" onClick={() => setPaused(!paused)} aria-label={paused ? 'Seguir' : 'Pausar'}>{paused ? '▶ Seguir' : '❚❚ Pausar'}</button>
            )}
            {(pace === 'paso' || paused) && (
              <button className="btn btn--gold btn--sm" onClick={botStep}>Siguiente jugada ›</button>
            )}
          </div>
        )}
        {h.phase === 'terminada' && !endShown && (
          <button className="btn btn--block" onClick={() => setEndShown(true)}>Ver el recuento</button>
        )}
        {legal === 'mus' && (
          <div className="grid">
            <button className="btn" onClick={() => act({ type: 'mus' })}>Mus</button>
            <button className="btn btn--red" onClick={() => act({ type: 'noMus' })}>No hay mus</button>
          </div>
        )}
        {legal === 'descarte' && (
          <div className="grid">
            <button className="btn" disabled={sel.length === 0} onClick={() => act({ type: 'discard', indices: [...sel].sort() })}>Descartar {sel.length || ''}</button>
            {suggestion?.action.type === 'discard' && (
              <button className="btn btn--ghost" onClick={() => setSel((suggestion.action as { indices: number[] }).indices)}>Marcar sugeridas</button>
            )}
          </div>
        )}
        {legal === 'abrir' && (
          <div className="grid">
            <button className="btn btn--ghost" onClick={() => act({ type: 'paso' })}>Paso</button>
            <button className="btn btn--gold" onClick={() => act({ type: 'envido', amount: 2 })}>Envido</button>
            <button className="btn btn--gold" onClick={() => act({ type: 'envido', amount: 5 })}>Envido 5</button>
            <button className="btn btn--red" onClick={() => act({ type: 'ordago' })}>Órdago</button>
          </div>
        )}
        {legal === 'responder' && (
          <div className="grid">
            <button className="btn" onClick={() => act({ type: 'quiero' })}>Quiero</button>
            <button className="btn btn--ghost" onClick={() => act({ type: 'noQuiero' })}>No quiero</button>
            {!h.bet!.ordago && <button className="btn btn--gold" onClick={() => act({ type: 'envido', amount: 2 })}>2 más</button>}
            {!h.bet!.ordago && <button className="btn btn--red" onClick={() => act({ type: 'ordago' })}>Órdago</button>}
          </div>
        )}
      </div>

      {showLog && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowLog(false)} />
          <div className="sheet" role="dialog" aria-label="Historial de la mano">
            <h2>Lo que ha pasado</h2>
            <HandLog log={h.log} />
            <button className="btn btn--block" style={{ marginTop: 12 }} onClick={() => setShowLog(false)}>Volver a la mesa</button>
          </div>
        </>
      )}

      {senaMsg && (
        <>
          <div className="sheet-backdrop" onClick={() => setSenaMsg(null)} />
          <div className="sheet" role="dialog">
            <p style={{ fontSize: '1.05rem' }}>{senaMsg}</p>
            <button className="btn btn--block" onClick={() => setSenaMsg(null)}>Vale</button>
          </div>
        </>
      )}

      {senaSheet && (
        <>
          <div className="sheet-backdrop" onClick={() => setSenaSheet(false)} />
          <div className="sheet" role="dialog" aria-label="Elegir seña">
            <h2>¿Qué seña haces?</h2>
            <p className="small muted">Solo puedes hacer la seña que corresponde a tus cartas (sin mentir ni señas parciales). Ojo: los rivales pueden pillarte.</p>
            <div className="stack" style={{ gap: 8 }}>
              {SENAS.map((s) => (
                <button key={s.id} className="opt" onClick={() => makeSena(s.id)}>
                  <Face sena={s.id} size={44} animate={false} />
                  <span><b>{s.name}</b><br /><span className="small muted">{s.gesture}</span></span>
                </button>
              ))}
              <button className="btn btn--ghost btn--block" onClick={() => makeSena(null)}>Mejor no hago seña</button>
            </div>
          </div>
        </>
      )}

      {h.phase === 'terminada' && endShown && (
        <>
          <div className="sheet-backdrop" />
          <div className="sheet" role="dialog" aria-label="Recuento">
            {(() => {
              const ord = h.results.find((r) => r.outcome.kind === 'ordago');
              const delta: [number, number] = [h.scores[0] - h.startScores[0], h.scores[1] - h.startScores[1]];
              return (
                <>
                  <h2>{ord && ord.outcome.kind === 'ordago' ? `¡Órdago a ${LANCE_TITLE[ord.lance].toLowerCase()}! Gana ${NAMES[ord.outcome.winner]}` : h.winner !== null ? (h.winner === 0 ? '¡Ganáis el juego!' : 'Ellos ganan el juego') : 'Recuento'}</h2>
                  <div className="reveal" style={{ marginBottom: 10 }}>
                    {([0, 1, 2, 3] as Seat[]).map((s) => (
                      <div key={s}>
                        <div className="nm">{NAMES[s]}{h.mano === s ? ' · mano' : ''}</div>
                        <div className="row" style={{ gap: 2 }}>
                          {h.hands[s].map((c, i) => <CardView key={i} card={c} width={34} variant={h.rules.variant} />)}
                        </div>
                        <div className="small" style={{ opacity: 0.85, marginTop: 2 }}>{describePares({ ...pinfo(h, s) })} · {describeJuego(h.hands[s], h.rules).replace(/ \(.*\)/, '')}{!h.declared?.juego.some(Boolean) ? ` · ${handSum(h.hands[s], h.rules)}` : ''}</div>
                      </div>
                    ))}
                  </div>
                  {!h.recuento && h.log.filter((e) => e.kind === 'deje').map((e, i) => e.kind === 'deje' && (
                    <div key={`d${i}`} className="recuento-line">
                      <span>{LANCE_TITLE[e.lance]} · no querido (deje)</span>
                      <b style={{ color: e.team === 0 ? 'var(--ok)' : 'var(--bad)' }}>{e.team === 0 ? 'Nosotros' : 'Ellos'} +{e.points}</b>
                    </div>
                  ))}
                  {(h.recuento ?? []).map((it, i) => (
                    <div key={i} className="recuento-line">
                      <span>
                        {LANCE_TITLE[it.lance]}{it.winnerSeat !== null ? ` · ${NAMES[it.winnerSeat]}` : ''}
                        <br />
                        <span className="small muted">
                          {[...(it.alreadyCounted ? [`deje ${it.alreadyCounted} (ya cobrado)`] : []), ...it.parts.map((p) => `${p.label} ${p.points}`)].join(' + ')}
                        </span>
                      </span>
                      <b style={{ color: it.team === 0 ? 'var(--ok)' : 'var(--bad)' }}>{it.team === 0 ? 'Nosotros' : 'Ellos'} +{it.points + (it.alreadyCounted ?? 0)}</b>
                    </div>
                  ))}
                  <div className="recuento-line"><span><b>Esta mano</b></span><b>{delta[0]} – {delta[1]}</b></div>
                  {review && (review.good.length > 0 || review.bad.length > 0) && (
                    <div className="tutor" style={{ marginTop: 12, flexDirection: 'column' }}>
                      <b>🦉 El tutor revisa tu mano</b>
                      {review.good.map((g, i) => <div key={`g${i}`}>✅ {g}</div>)}
                      {review.bad.map((g, i) => <div key={`b${i}`}>⚠️ {g}</div>)}
                      {review.bad.length === 0 && <div>¡Has jugado como un veterano del txoko!</div>}
                    </div>
                  )}
                  <button className="btn btn--block" style={{ marginTop: 14 }} onClick={nextHand}>
                    {h.winner !== null ? (game.juegos[h.winner] + 1 >= h.rules.juegosVaca ? 'Ver resultado' : 'Siguiente juego') : 'Siguiente mano'}
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}

/** Qué suele significar cada jugada de otro jugador (para aprender a leer la mesa). */
function readingFor(e: HandEvent): string | null {
  const who = 'seat' in e ? (e.seat === 2 ? 'Maite (tu compañera)' : NAMES[e.seat]) : '';
  const L = 'lance' in e ? e.lance : null;
  switch (e.kind) {
    case 'mus': return `${who} pide mus: su mano no le convence y quiere cambiar.`;
    case 'noMus': return `${who} corta el mus: quien corta suele llevar algo bueno (pares, juego o reyes).`;
    case 'discard': return `${who} se descarta de ${e.count}: ${e.count >= 3 ? 'iba casi sin nada.' : e.count === 1 ? 'tenía la mano casi hecha.' : 'guarda algo y busca mejorar.'}`;
    case 'paso':
      return `${who} pasa a ${L === 'grande' ? 'la grande: no presume de reyes' : L === 'chica' ? 'la chica: no tiene muchos ases' : L === 'pares' ? 'pares: sus pares no son de los altos' : L === 'juego' ? 'juego: su juego no es de los mejores' : 'punto: su punto no es alto'} (o se lo guarda para luego).`;
    case 'envido':
      if (e.raise) return `${who} sube a ${e.total}: se ve muy fuerte… o va de farol.`;
      return `${who} envida a ${L === 'grande' ? 'la grande: suele llevar reyes' : L === 'chica' ? 'la chica: suele llevar ases o cartas bajas' : L === 'pares' ? 'pares: buenos pares (medias, duples o pareja alta)' : L === 'juego' ? 'juego: buen juego, quizá la 31' : 'punto: un punto alto, cerca de 30'}.`;
    case 'ordago': return `¡${who} echa órdago! O tiene una jugada casi segura o el marcador le obliga a arriesgar.`;
    case 'quiero': return `${who} quiere: cree que su pareja gana este lance. Se verá en el recuento.`;
    case 'noQuiero': return `${who} no quiere: ve más fuerte al rival y prefiere pagar solo el deje.`;
    default: return null;
  }
}

function logLine(e: HandEvent): string | null {
  const who = 'seat' in e ? NAMES[e.seat] : '';
  switch (e.kind) {
    case 'mus': return `${who}: mus`;
    case 'noMus': return `${who}: ¡no hay mus!`;
    case 'discard': return `${who} se descarta de ${e.count}`;
    case 'reparto': return `— Se reparten los descartes (ronda ${e.round + 1}) —`;
    case 'reshuffle': return '— Se acaba el mazo: se barajan los descartes —';
    case 'lanceStart': return `▸ ${LANCE_TITLE[e.lance].toUpperCase()}`;
    case 'declare': return `${who}: ${e.lance} ${e.has ? 'sí' : 'no'}`;
    case 'paso': return `${who}: paso`;
    case 'envido': return `${who}: ${e.raise ? `${e.amount} más (total ${e.total})` : `envido ${e.amount}`}`;
    case 'ordago': return `${who}: ¡ÓRDAGO!`;
    case 'quiero': return `${who}: quiero`;
    case 'noQuiero': return `${who}: no quiero`;
    case 'lanceEnd': return outcomeText(e);
    case 'deje': return `${e.team === 0 ? 'Vosotros' : 'Ellos'} cobráis ${e.points} de deje`.replace('Ellos cobráis', 'Ellos cobran');
    default: return null;
  }
}

function HandLog({ log }: { log: HandEvent[] }) {
  const lines = log.map(logLine).filter((x): x is string => !!x);
  return (
    <div className="hand-log">
      {lines.map((l, i) => (
        <div key={i} className={l.startsWith('▸') ? 'hl-head' : l.startsWith('—') ? 'muted small' : ''}>{l}</div>
      ))}
    </div>
  );
}

function pinfo(h: GameState['hand'], s: Seat) {
  return paresInfo(h.hands[s], h.rules);
}
