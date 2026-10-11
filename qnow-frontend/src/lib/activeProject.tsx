import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useProjects } from '../api/hooks';
import type { Project } from '../api/types';

const STORAGE_KEY = 'qnow.activeProjectId';

interface ActiveProjectValue {
  project: Project | undefined;
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  select: (id: string) => void;
}

const ActiveProjectContext = createContext<ActiveProjectValue | null>(null);

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Active project = the one the user picked, falling back to the most recently active
 * (the API returns projects ordered by last activity).
 */
export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const { data: projects = [], isLoading, error } = useProjects();
  const [selectedId, setSelectedId] = useState<string | null>(readStored);

  const project = projects.find((p) => p.id === selectedId) ?? projects[0];

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(STORAGE_KEY, selectedId);
    } catch {
      /* storage unavailable */
    }
  }, [selectedId]);

  return (
    <ActiveProjectContext.Provider value={{ project, projects, isLoading, error, select: setSelectedId }}>
      {children}
    </ActiveProjectContext.Provider>
  );
}

export function useActiveProject() {
  const ctx = useContext(ActiveProjectContext);
  if (!ctx) throw new Error('useActiveProject must be used inside ActiveProjectProvider');
  return ctx;
}
