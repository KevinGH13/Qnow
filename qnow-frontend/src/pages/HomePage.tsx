import { useEvents, useTasks } from '../api/hooks';
import { Timeline } from '../components/Timeline';
import { TaskPanel } from '../components/TaskPanel';
import { useActiveProject } from '../lib/activeProject';

export function HomePage() {
  const { project } = useActiveProject();
  const events = useEvents(project?.id);
  const tasks = useTasks(project?.id);

  if (!project) return null;

  return (
    <div className="grid gap-12 pt-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <div className="min-w-0">
        {events.isLoading ? (
          <p className="text-ink-faint">Loading timeline…</p>
        ) : events.error ? (
          <p className="text-danger">Couldn't load events: {events.error.message}</p>
        ) : (
          <Timeline projectId={project.id} events={events.data ?? []} />
        )}
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        {tasks.error ? (
          <p className="text-danger">Couldn't load tasks: {tasks.error.message}</p>
        ) : (
          <TaskPanel projectId={project.id} tasks={tasks.data ?? []} />
        )}
      </aside>
    </div>
  );
}
