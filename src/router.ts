import { useEffect, useState } from 'react';

export function useHashRoute(): string[] {
  const parse = () => (window.location.hash.replace(/^#\/?/, '') || 'aprender').split('/');
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (path: string) => {
  window.location.hash = '#/' + path;
};
