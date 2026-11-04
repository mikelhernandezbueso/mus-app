// Cara ilustrada para enseñar las señas (diseño propio en SVG).
import { useEffect, useState } from 'react';
import type { SenaId } from '../engine';
import { senaById, type FaceSpec } from '../content/senas';

const NEUTRAL: FaceSpec = { mouth: 'neutral', eyes: 'open', brows: 'normal' };

export function Face({ sena, spec, size = 120, animate = true, txapela = true }: { sena?: SenaId; spec?: FaceSpec; size?: number; animate?: boolean; txapela?: boolean }) {
  const target: FaceSpec = spec ?? (sena ? senaById(sena).face : NEUTRAL);
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => setOn((v) => !v), on ? 2200 : 700);
    return () => clearInterval(id);
  }, [animate, on]);
  const f: FaceSpec = animate && !on ? NEUTRAL : target;
  const browY = f.brows === 'raised' ? -6 : 0;
  const eye = (cx: number, closed: boolean) =>
    closed ? (
      <path d={`M${cx - 7},62 Q${cx},67 ${cx + 7},62`} stroke="#2a1d12" strokeWidth="3" fill="none" strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={cx} cy="61" rx="6.5" ry="7.5" fill="#fff" stroke="#2a1d12" strokeWidth="1.5" />
        <circle cx={cx + 1} cy="62" r="3.6" fill="#2a1d12" />
        <circle cx={cx + 2.2} cy="60.6" r="1.1" fill="#fff" />
      </g>
    );
  const leftClosed = f.eyes === 'closed';
  const rightClosed = f.eyes === 'closed' || f.eyes === 'wink';
  let mouth: React.ReactNode;
  switch (f.mouth) {
    case 'neutral':
      mouth = <path d="M48,96 Q60,101 72,96" stroke="#7a2b1f" strokeWidth="3.2" fill="none" strokeLinecap="round" />;
      break;
    case 'biteCenter':
      mouth = (
        <g>
          <path d="M45,93 Q60,90 75,93 Q60,104 45,93Z" fill="#a8473a" />
          <rect x="53" y="92" width="14" height="5" rx="1.5" fill="#fff" stroke="#bbb" strokeWidth=".6" />
          <line x1="60" y1="92" x2="60" y2="97" stroke="#ccc" strokeWidth=".7" />
        </g>
      );
      break;
    case 'biteSide':
      mouth = (
        <g>
          <path d="M45,93 Q60,90 75,93 Q60,104 45,93Z" fill="#a8473a" />
          <rect x="62" y="92" width="11" height="5" rx="1.5" fill="#fff" stroke="#bbb" strokeWidth=".6" />
          <line x1="67.5" y1="92" x2="67.5" y2="97" stroke="#ccc" strokeWidth=".7" />
        </g>
      );
      break;
    case 'tongueCenter':
      mouth = (
        <g>
          <path d="M48,94 Q60,98 72,94" stroke="#7a2b1f" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M54,95 Q54,106 60,106 Q66,106 66,95Z" fill="#e0707a" stroke="#a8473a" strokeWidth="1.4" />
          <line x1="60" y1="97" x2="60" y2="103" stroke="#a8473a" strokeWidth="1" />
        </g>
      );
      break;
    case 'tongueSide':
      mouth = (
        <g>
          <path d="M46,94 Q60,98 74,94" stroke="#7a2b1f" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M64,95 Q66,106 72,104 Q77,101 73,94Z" fill="#e0707a" stroke="#a8473a" strokeWidth="1.4" />
        </g>
      );
      break;
    case 'twist':
      mouth = <path d="M50,99 Q60,98 66,94 Q70,91 75,90" stroke="#7a2b1f" strokeWidth="3.4" fill="none" strokeLinecap="round" />;
      break;
    case 'kiss':
      mouth = (
        <g>
          <ellipse cx="60" cy="96" rx="6" ry="5" fill="#c4505a" stroke="#7a2b1f" strokeWidth="1.6" />
          <ellipse cx="60" cy="96" rx="2" ry="1.6" fill="#7a2b1f" />
          <path d="M84,82 c-3,-4 -9,0 -5,5 l5,5 l5,-5 c4,-5 -2,-9 -5,-5z" fill="#e0707a" className={animate ? 'face-heart' : ''} />
        </g>
      );
      break;
  }
  return (
    <svg viewBox="0 -2 120 132" width={size} height={(size * 130) / 120} className={`face ${animate ? 'face--anim' : ''}`} role="img" aria-label={sena ? senaById(sena).gesture : 'cara'}>
      <ellipse cx="60" cy="72" rx="38" ry="44" fill="#f0c9a0" stroke="#8b5a3c" strokeWidth="2" />
      <ellipse cx="22" cy="74" rx="6" ry="9" fill="#e8b88c" stroke="#8b5a3c" strokeWidth="1.6" />
      <ellipse cx="98" cy="74" rx="6" ry="9" fill="#e8b88c" stroke="#8b5a3c" strokeWidth="1.6" />
      {txapela && (
        <g>
          <path d="M20,33 C16,5 104,5 100,33 C84,39 36,39 20,33Z" fill="#1d2b4a" stroke="#0e1628" strokeWidth="2" />
          <path d="M60,10 L60,3" stroke="#0e1628" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      <g className="face-brows" style={{ transform: `translateY(${browY}px)` }}>
        <path d="M37,49 Q45,45 52,49" stroke="#4a2b12" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <path d="M68,49 Q75,45 83,49" stroke="#4a2b12" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      </g>
      {eye(45, leftClosed)}
      {eye(75, rightClosed)}
      <path d="M60,66 Q56,80 60,82 Q63,83 65,81" stroke="#8b5a3c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="38" cy="86" rx="6" ry="3.5" fill="#e89a86" opacity=".5" />
      <ellipse cx="82" cy="86" rx="6" ry="3.5" fill="#e89a86" opacity=".5" />
      <g className="face-mouth">{mouth}</g>
    </svg>
  );
}
