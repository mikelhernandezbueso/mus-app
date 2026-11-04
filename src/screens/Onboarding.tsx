import { useState } from 'react';
import { useStore } from '../state/store';
import { CardView } from '../ui/Card';
import { Face } from '../ui/Face';
import { parseHand } from '../engine';

const SLIDES = [
  {
    title: 'Kaixo! Aprende mus desde cero',
    text: 'Lecciones de 3-5 minutos que van de la baraja a las señas y la estrategia. Sin prisa y sin vergüenza: aquí nadie te mira mal por preguntar qué es la chica.',
    art: 'cards',
  },
  {
    title: 'Estudia, practica y juega',
    text: 'Cada lección mezcla explicación y ejercicios con manos reales. Luego practica sin fin y juega partidas 2 contra 2 contra bots, con un tutor que te explica cada jugada.',
    art: 'face',
  },
  {
    title: 'Racha, estrellas y logros',
    text: 'Gana XP, mantén tu racha diaria y repasa lo que falles. Las reglas son las de Euskadi: mus a 8 reyes, juego a 40. ¡Hor dago!',
    art: 'fire',
  },
];

export function Onboarding() {
  const { update } = useStore();
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;
  const done = () => update((p) => ({ ...p, onboarded: true }));
  return (
    <div className="onb">
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {!last && <button className="btn btn--sm" style={{ background: 'rgba(0,0,0,.2)', boxShadow: 'none' }} onClick={done}>Saltar</button>}
      </div>
      <div className="art" key={i}>
        {s.art === 'cards' && (
          <div style={{ position: 'relative', width: 240, height: 200 }}>
            {parseHand('12o 3c 1e 7b').map((c, k) => (
              <CardView key={k} card={c} width={96} hint className="deal-in" style={{ position: 'absolute', left: 20 + k * 40, top: 20 + Math.abs(k - 1.5) * 10, transform: `rotate(${(k - 1.5) * 9}deg)`, animationDelay: `${k * 0.12}s` }} />
            ))}
          </div>
        )}
        {s.art === 'face' && <Face sena="treintaYUna" size={190} />}
        {s.art === 'fire' && <div style={{ fontSize: '7rem', animation: 'bob 1.6s infinite' }} aria-hidden>🔥</div>}
      </div>
      <h1>{s.title}</h1>
      <p>{s.text}</p>
      <div className="dots" aria-hidden>
        {SLIDES.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}
      </div>
      <button className="btn btn--gold btn--block" onClick={() => (last ? done() : setI(i + 1))}>
        {last ? '¡Vamos a jugar!' : 'Siguiente'}
      </button>
    </div>
  );
}
