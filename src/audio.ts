// Sonidos sintetizados con WebAudio (sin ficheros). Se silencian desde Ajustes.
let ctx: AudioContext | null = null;
let enabled = true;

export const setSoundEnabled = (v: boolean) => {
  enabled = v;
};

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(start: number, dur: number, gain = 0.08) {
  const c = ac();
  if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const src = c.createBufferSource();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 1800;
  src.buffer = buf;
  g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination);
  src.start(c.currentTime + start);
}

export const sfx = {
  correct: () => { tone(660, 0, 0.12, 'triangle'); tone(990, 0.09, 0.2, 'triangle'); },
  wrong: () => { tone(220, 0, 0.18, 'sawtooth', 0.06); tone(180, 0.12, 0.22, 'sawtooth', 0.05); },
  tap: () => tone(520, 0, 0.05, 'square', 0.03),
  card: () => noise(0, 0.07, 0.12),
  deal: () => { for (let i = 0; i < 4; i++) noise(i * 0.07, 0.05, 0.1); },
  coin: () => { tone(1320, 0, 0.08, 'square', 0.04); tone(1760, 0.06, 0.12, 'square', 0.03); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.1)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.15, 0.3, 'triangle', 0.08)),
  ordago: () => { tone(110, 0, 0.5, 'sawtooth', 0.08); tone(165, 0.05, 0.5, 'sawtooth', 0.06); },
  lessonDone: () => [523, 784, 659, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, 'triangle', 0.1)),
};
