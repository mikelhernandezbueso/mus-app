// Cartas de la baraja española dibujadas en SVG con diseño propio.
import type { Card as CardT, Suit, Variant } from '../engine';

export const SUIT_COLOR: Record<Suit, string> = {
  oros: '#a36a0b',
  copas: '#b3261e',
  espadas: '#1f4e8c',
  bastos: '#2f6b33',
};

/** Símbolo de palo centrado en (0,0), ~24 unidades de alto. */
export function SuitPip({ suit, scale = 1 }: { suit: Suit; scale?: number }) {
  const s = `scale(${scale})`;
  switch (suit) {
    case 'oros':
      return (
        <g transform={s}>
          <circle r="10" fill="#e8b23a" stroke="#8a5a12" strokeWidth="1.6" />
          <circle r="6.3" fill="none" stroke="#8a5a12" strokeWidth="1.2" />
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1="0" y1="-3.6" x2="0" y2="-5.4" stroke="#8a5a12" strokeWidth="1" transform={`rotate(${i * 45})`} />
          ))}
          <circle r="2.2" fill="#8a5a12" />
        </g>
      );
    case 'copas':
      return (
        <g transform={s}>
          <path d="M-9,-10 h18 c0,8 -3.5,11.5 -7,12.6 v3.2 h4.6 v2.6 h-13.2 v-2.6 h4.6 v-3.2 c-3.5,-1.1 -7,-4.6 -7,-12.6z" fill="#c8392f" stroke="#6e1712" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M-9,-10 h18 v2.6 h-18z" fill="#e8b23a" stroke="#6e1712" strokeWidth="1" />
          <circle cx="0" cy="-2" r="1.8" fill="#e8b23a" />
        </g>
      );
    case 'espadas':
      return (
        <g transform={`${s} rotate(-12)`}>
          <path d="M0,-15 L2.4,-11 L2.4,5 L-2.4,5 L-2.4,-11 Z" fill="#c9d6e8" stroke="#1f3f6e" strokeWidth="1.2" strokeLinejoin="round" />
          <line x1="0" y1="-11" x2="0" y2="4" stroke="#1f3f6e" strokeWidth=".6" />
          <rect x="-8" y="5" width="16" height="2.8" rx="1.4" fill="#2f63a8" stroke="#1f3f6e" strokeWidth="1" />
          <rect x="-1.7" y="7.8" width="3.4" height="5.4" fill="#7a4a22" stroke="#3e240f" strokeWidth=".8" />
          <circle cy="14.6" r="2.2" fill="#2f63a8" stroke="#1f3f6e" strokeWidth=".8" />
        </g>
      );
    case 'bastos':
      return (
        <g transform={`${s} rotate(14)`}>
          <path d="M-2.8,14 L-1.8,-8 C-2.6,-14 5.4,-14 4.6,-8 L2.8,14 Z" fill="#5f9a3e" stroke="#2e4f1c" strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="-2.4" cy="-1" r="1.5" fill="#2e4f1c" />
          <circle cx="3.6" cy="4" r="1.4" fill="#2e4f1c" />
          <circle cx="-1.6" cy="8" r="1.2" fill="#2e4f1c" />
          <path d="M-2.4,14 L2.4,14 L2,16 L-2,16Z" fill="#7a4a22" />
        </g>
      );
  }
}

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[0, -22], [0, 22]],
  3: [[0, -26], [0, 0], [0, 26]],
  4: [[-14, -22], [14, -22], [-14, 22], [14, 22]],
  5: [[-14, -24], [14, -24], [0, 0], [-14, 24], [14, 24]],
  6: [[-14, -26], [14, -26], [-14, 0], [14, 0], [-14, 26], [14, 26]],
  7: [[-14, -28], [14, -28], [0, -14], [-14, 2], [14, 2], [-14, 28], [14, 28]],
};

function Figure({ rank, suit }: { rank: 10 | 11 | 12; suit: Suit }) {
  const col = SUIT_COLOR[suit];
  return (
    <g>
      <rect x="-24" y="-38" width="48" height="76" rx="6" fill="#fff6e2" stroke={col} strokeWidth="1.6" />
      {rank === 12 && (
        <g transform="translate(0,-14)">
          <path d="M-15,8 L-15,-5 L-7.5,1.5 L0,-10 L7.5,1.5 L15,-5 L15,8 Z" fill="#e8b23a" stroke="#8a5a12" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="-15" y="8" width="30" height="4" fill="#c8392f" stroke="#8a5a12" strokeWidth="1" />
          <circle cx="0" cy="-10" r="2.2" fill="#c8392f" />
          <circle cx="-15" cy="-5" r="1.8" fill="#c8392f" />
          <circle cx="15" cy="-5" r="1.8" fill="#c8392f" />
        </g>
      )}
      {rank === 11 && (
        <g transform="translate(0,-14)">
          <path d="M-9,14 L-7,4 C-12,0 -11,-7 -5,-10 L-2,-16 L0.5,-11 C7,-11 12,-5 12,-1 L11.5,2 L6,1 L3.5,0 L3,5 L5,14 Z" fill="#9b6233" stroke="#4a2b12" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M-2,-16 L0.5,-11 L-3,-6 C-6,-3 -6,2 -7,4" fill="none" stroke="#3a2210" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="4" cy="-6" r="1.4" fill="#2a1a0c" />
        </g>
      )}
      {rank === 10 && (
        <g transform="translate(0,-14)">
          <path d="M-16,4 C-17,-8 17,-8 16,4 C10,7.5 -10,7.5 -16,4 Z" fill="#c8102e" stroke="#6e0d1a" strokeWidth="1.4" />
          <path d="M0,-6 L0,-10" stroke="#6e0d1a" strokeWidth="2" strokeLinecap="round" />
          <path d="M-12,5 C-6,8.5 6,8.5 12,5" fill="none" stroke="#6e0d1a" strokeWidth="1" />
        </g>
      )}
      <g transform="translate(0,18)">
        <SuitPip suit={suit} scale={1.15} />
      </g>
    </g>
  );
}

const label = (r: number) => (r === 1 ? 'A' : r === 10 ? 'S' : r === 11 ? 'C' : r === 12 ? 'R' : String(r));

export interface CardProps {
  card?: CardT;
  faceDown?: boolean;
  width?: number;
  selected?: boolean;
  dim?: boolean;
  /** Mostrar la equivalencia a 8 reyes (3 = R, 2 = A). */
  hint?: boolean;
  variant?: Variant;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

const RANK_FULL: Record<number, string> = { 1: 'As', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };

export function CardView({ card, faceDown, width = 72, selected, dim, hint, variant = '8reyes', onClick, className = '', style, ariaLabel }: CardProps) {
  const h = width * 1.5;
  const cls = `card ${selected ? 'card--sel' : ''} ${dim ? 'card--dim' : ''} ${onClick ? 'card--btn' : ''} ${className}`;
  const name = card ? `${RANK_FULL[card.rank]} de ${card.suit}` : 'Carta boca abajo';
  const Tag = onClick ? 'button' : 'div';
  if (faceDown || !card) {
    return (
      <Tag className={cls} style={{ width, height: h, ...style }} onClick={onClick} aria-label={ariaLabel ?? name}>
        <svg viewBox="0 0 100 150" width={width} height={h} aria-hidden>
          <defs>
            <pattern id="lat" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="10" height="10" fill="#1d5c3a" />
              <path d="M0,5 H10 M5,0 V10" stroke="#2f7a50" strokeWidth="2.2" />
            </pattern>
          </defs>
          <rect x="1.5" y="1.5" width="97" height="147" rx="9" fill="#f6eedb" stroke="#7a4a22" strokeWidth="3" />
          <rect x="7" y="7" width="86" height="136" rx="6" fill="url(#lat)" />
          <circle cx="50" cy="75" r="17" fill="#f6eedb" stroke="#7a4a22" strokeWidth="2" />
          <path d="M37,77 C36,67 64,67 63,77 C58,80 42,80 37,77 Z" fill="#c8102e" />
          <path d="M50,68 v-4" stroke="#c8102e" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </Tag>
    );
  }
  const col = SUIT_COLOR[card.suit];
  const gaps = { oros: 1, copas: 2, espadas: 3, bastos: 4 }[card.suit];
  const eq8 = variant === '8reyes' && (card.rank === 3 || card.rank === 2);
  return (
    <Tag className={cls} style={{ width, height: h, ...style }} onClick={onClick} aria-label={ariaLabel ?? name} aria-pressed={onClick ? !!selected : undefined}>
      <svg viewBox="0 0 100 150" width={width} height={h} aria-hidden>
        <rect x="1.5" y="1.5" width="97" height="147" rx="9" fill="#fffaf0" stroke="#8b6a45" strokeWidth="2.2" />
        {/* marco con "pintas": cortes según el palo */}
        <g stroke={col} strokeWidth="1.6" fill="none">
          <path d={`M8,8 H${92 - gaps * 7}`} />
          {Array.from({ length: gaps }, (_, i) => (
            <path key={i} d={`M${92 - (gaps - i) * 7 + 3},8 H${92 - (gaps - i - 1) * 7}`} />
          ))}
          <path d="M92,8 V142 H8 V8" />
        </g>
        <text x="9" y="35" fontFamily="Fraunces, Georgia, serif" fontWeight="800" fontSize="30" fill={col}>{label(card.rank)}</text>
        <g transform="translate(17,48) scale(.55)"><SuitPip suit={card.suit} /></g>
        <g transform="rotate(180 50 75)">
          <text x="9" y="35" fontFamily="Fraunces, Georgia, serif" fontWeight="800" fontSize="30" fill={col}>{label(card.rank)}</text>
        </g>
        <g transform="translate(56,80)">
          {card.rank >= 10 ? (
            <g transform="scale(.82)"><Figure rank={card.rank as 10 | 11 | 12} suit={card.suit} /></g>
          ) : (
            PIPS[card.rank].map(([x, y], i) => (
              <g key={i} transform={`translate(${x * 0.82},${y * 0.82})`}>
                <SuitPip suit={card.suit} scale={card.rank === 1 ? 1.9 : 0.72} />
              </g>
            ))
          )}
        </g>
        {hint && eq8 && (
          <g>
            <rect x="60" y="10" width="30" height="20" rx="10" fill={card.rank === 3 ? '#c8102e' : '#1d5c3a'} />
            <text x="75" y="24.5" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="13" fill="#fff">
              ={card.rank === 3 ? 'R' : 'A'}
            </text>
          </g>
        )}
      </svg>
    </Tag>
  );
}

/** Fila de cartas. */
export function CardRow({ cards, width = 64, hint, variant, overlap = false }: { cards: CardT[]; width?: number; hint?: boolean; variant?: Variant; overlap?: boolean }) {
  return (
    <div className={`card-row ${overlap ? 'card-row--overlap' : ''}`}>
      {cards.map((c, i) => (
        <CardView key={i + c.rank + c.suit} card={c} width={width} hint={hint} variant={variant} />
      ))}
    </div>
  );
}
