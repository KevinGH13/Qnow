import { useState } from 'react';
import type { Task } from '../api/types';
import { PRIORITIES, priorityLabel } from '../lib/priority';
import { TaskComposer } from './TaskComposer';
import { TaskRow } from './TaskRow';

/** Open tasks grouped by priority (the API already orders them), done tasks folded away. */
export function TaskPanel({
  projectId,
  eventId,
  tasks,
  showOrigin = true,
  title = 'Tasks',
}: {
  projectId: string;
  eventId?: string;
  tasks: Task[];
  showOrigin?: boolean;
  title?: string;
}) {
  const [showDone, setShowDone] = useState(false);
  const open = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="tnum text-sm text-ink-faint">{open.length} open</span>
      </div>

      <TaskComposer projectId={projectId} eventId={eventId} />

      {open.length === 0 && (
        <p className="mt-4 text-sm text-ink-soft">
          {tasks.length === 0 ? 'No tasks yet.' : 'Everything is done.'}
        </p>
      )}

      {PRIORITIES.map((p) => {
        const group = open.filter((t) => t.priority === p);
        if (group.length === 0) return null;
        return (
          <div
            key={p}
            className={`mt-5 ${p === 'high' ? 'border-l-[3px] border-accent pl-3' : 'pl-[15px]'}`}
          >
            <h3 className="tnum text-sm text-ink-soft">
              {priorityLabel[p]} <span className="text-ink-faint">{group.length}</span>
            </h3>
            <ul className="mt-1">
              {group.map((t) => (
                <TaskRow key={t.id} task={t} showOrigin={showOrigin} />
              ))}
            </ul>
          </div>
        );
      })}

      {done.length > 0 && (
        <div className="mt-5 pl-[15px]">
          <button
            className="text-sm text-ink-faint hover:text-ink"
            aria-expanded={showDone}
            onClick={() => setShowDone((s) => !s)}
          >
            {showDone ? 'Hide' : 'Show'} {done.length} done
          </button>
          {showDone && (
            <ul className="mt-1">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} showOrigin={showOrigin} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
