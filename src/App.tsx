import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { CLabHome } from './pages/CLabHome';
import { Dashboard } from './pages/Dashboard';
import { ExercisePage } from './pages/ExercisePage';
import { LessonPage } from './pages/LessonPage';
import { NotFound } from './pages/NotFound';
import { ProgressPage } from './pages/ProgressPage';
import { TrainerHome } from './pages/TrainerHome';
import { TranslatorPage } from './pages/TranslatorPage';
import { UpcomingModule } from './pages/UpcomingModule';
import { ProgressProvider } from './state/progress';
import { useRoute } from './state/router';

function Routes({ route }: { route: string[] }) {
  const [a, b, c] = route;
  if (!a) return <Dashboard />;
  if (a === 'c-lab') {
    if (!b) return <CLabHome />;
    if (b === 'licao' && c) return <LessonPage id={c} />;
    if (b === 'translator') return <TranslatorPage id={c} />;
    if (b === 'trainer') return c ? <ExercisePage id={c} /> : <TrainerHome />;
  }
  if (a === 'modulo' && b) return <UpcomingModule id={b} />;
  if (a === 'progresso') return <ProgressPage />;
  return <NotFound />;
}

export function App() {
  const route = useRoute();
  useEffect(() => {
    const titles: Record<string, string> = { 'c-lab': 'C Programming Lab', modulo: 'Módulo', progresso: 'Progresso' };
    document.title = route[0] ? `${titles[route[0]] ?? 'ALGOLAB'} · ALGOLAB` : 'ALGOLAB · Algoritmi 1';
  }, [route]);
  return (
    <ProgressProvider>
      <Layout route={route}>
        <Routes route={route} />
      </Layout>
    </ProgressProvider>
  );
}
