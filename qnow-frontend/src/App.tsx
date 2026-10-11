import { Route, Routes } from 'react-router';
import { AppHeader } from './components/AppHeader';
import { HomePage } from './pages/HomePage';
import { EventPage } from './pages/EventPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { PeoplePage } from './pages/PeoplePage';
import { PersonPanel } from './components/PersonPanel';
import { FirstProjectPage } from './pages/FirstProjectPage';
import { useActiveProject } from './lib/activeProject';
import { ApiState } from './components/ApiState';

export function App() {
  const { projects, isLoading, error } = useActiveProject();

  // Error first: otherwise the tree flips between screens and each mount refetches.
  if (error && projects.length === 0) return <ApiState kind="error" />;
  if (isLoading) return <ApiState kind="loading" />;
  if (projects.length === 0) return <FirstProjectPage />;

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/decisions" element={<DecisionsPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="*" element={<ApiState kind="notFound" />} />
        </Routes>
      </main>
      <PersonPanel />
    </div>
  );
}
