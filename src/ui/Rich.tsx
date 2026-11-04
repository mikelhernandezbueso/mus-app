import { Fragment, type ReactNode } from 'react';

/** Texto con **negritas**, *cursivas*, saltos de línea y listas con "• " o "1. ". */
export function Rich({ text }: { text: string }) {
  const paras = text.split(/\n\n+/);
  return (
    <>
      {paras.map((p, i) => {
        const lines = p.split('\n');
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

export function inline(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push(m[1] ? <b key={k++}>{m[1]}</b> : <i key={k++}>{m[2]}</i>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}
