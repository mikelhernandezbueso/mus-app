import { lazy, Suspense } from 'react';
import { useHashRoute } from './router';
import { useStore } from './state/store';
import { AchievementToast, TabBar } from './ui/Chrome';
import { Learn } from './screens/Learn';
import { LessonScreen } from './screens/LessonScreen';
import { Practice } from './screens/Practice';
import { Consult } from './screens/Consult';
import { Settings } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { Achievements } from './screens/Achievements';

const Play = lazy(() => import('./screens/Play'));

export default function App() {
  const route = useHashRoute();
  const { progress } = useStore();
  if (!progress.onboarded) return <Onboarding />;
  const [section, sub] = route;
  const key = route.join('/');
  let screen: React.ReactNode;
  let tabs = true;
  switch (section) {
    case 'leccion':
      screen = <LessonScreen key={key} id={sub} />;
      tabs = false;
      break;
    case 'practicar':
      screen = <Practice key={key} sub={sub} />;
      tabs = !sub;
      break;
    case 'jugar':
      screen = (
        <Suspense fallback={<div className="screen">Barajando…</div>}>
          <Play key={key} />
        </Suspense>
      );
      tabs = false;
      break;
    case 'consultar':
      screen = <Consult key={key} sub={sub} />;
      break;
    case 'ajustes':
      screen = <Settings />;
      break;
    case 'logros':
      screen = <Achievements />;
      break;
    default:
      screen = <Learn />;
  }
  return (
    <>
      <AchievementToast />
      {screen}
      {tabs && <TabBar active={section === 'logros' ? 'aprender' : section || 'aprender'} />}
    </>
  );
}
