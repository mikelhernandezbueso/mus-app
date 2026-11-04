import { useEffect, useState } from 'react';

// En la vista previa de claude.ai (modo artifact) el hash con rutas no está permitido:
// se usa un router en memoria. En la PWA, rutas por hash (#/aprender…).
const MEMORY = import.meta.env.MODE === 'artifact';
let memPath = 'aprender';
const listeners = new Set<() => void>();

const current = () => (MEMORY ? memPath : window.location.hash.replace(/^#\/?/, '') || 'aprender');

export function useHashRoute(): string[] {
  const [route, setRoute] = useState(() => current().split('/'));
  useEffect(() => {
    const on = () => {
      setRoute(current().split('/'));
      window.scrollTo(0, 0);
    };
    if (MEMORY) {
      listeners.add(on);
      return () => void listeners.delete(on);
    }
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (path: string) => {
  if (MEMORY) {
    memPath = path;
    listeners.forEach((l) => l());
  } else window.location.hash = '#/' + path;
};
