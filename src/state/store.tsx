import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { newAchievements, type Achievement } from '../content/achievements';
import { setSoundEnabled } from '../audio';
import { loadProgress, rulesFrom, saveProgress, type Progress } from './progress';

interface Store {
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  rules: ReturnType<typeof rulesFrom>;
  toast: Achievement | null;
  clearToast: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [queue, setQueue] = useState<Achievement[]>([]);
  const ref = useRef(progress);
  ref.current = progress;

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((prev) => {
      let next = fn(prev);
      const fresh = newAchievements(next);
      if (fresh.length) {
        const now = Date.now();
        next = { ...next, achievements: { ...next.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, now])) } };
        setTimeout(() => setQueue((q) => [...q, ...fresh]), 0);
      }
      saveProgress(next);
      return next;
    });
  }, []);

  useEffect(() => setSoundEnabled(progress.settings.sound), [progress.settings.sound]);

  useEffect(() => {
    const t = progress.settings.theme;
    const root = document.documentElement;
    if (t === 'auto') {
      if (root.dataset.musTheme) root.removeAttribute('data-theme');
      delete root.dataset.musTheme;
    } else {
      root.setAttribute('data-theme', t);
      root.dataset.musTheme = '1';
    }
  }, [progress.settings.theme]);

  const rules = useMemo(() => rulesFrom(progress.settings), [progress.settings]);
  const value = useMemo<Store>(
    () => ({ progress, update, rules, toast: queue[0] ?? null, clearToast: () => setQueue((q) => q.slice(1)) }),
    [progress, update, rules, queue],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}
