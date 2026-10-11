import { Check, Minus, Pause, Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { useDeleteTask, useUpdateTask } from '../api/hooks';
import type { Priority, Task } from '../api/types';
import { PRIORITIES, priorityLabel } from '../lib/priority';

export function TaskRow({ task, showOrigin = true }: { task: Task; showOrigin?: boolean }) {
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const done = task.status === 'done';
  const inProgress = task.status === 'in_progress';

  const toggleDone = () => update.mutate({ id: task.id, status: done ? 'pending' : 'done' });
  const toggleProgress = () =>
    update.mutate({ id: task.id, status: inProgress ? 'pending' : 'in_progress' });

  return (
    <li className="group flex items-start gap-3 py-1.5">
      <button
        role="checkbox"
        aria-checked={done ? 'true' : inProgress ? 'mixed' : 'false'}
        aria-label={done ? `Mark "${task.text}" as not done` : `Mark "${task.text}" as done`}
        onClick={toggleDone}
        className={`mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors ${
          done ? 'border-ink bg-ink text-sheet' : 'border-ink-soft hover:border-ink'
        }`}
      >
        {done && <Check size={11} strokeWidth={3} />}
        {inProgress && <Minus size={11} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={done ? 'text-ink-faint line-through' : ''}>{task.text}</p>
        {(inProgress || (showOrigin && task.event)) && (
          <p className="text-xs text-ink-faint">
            {inProgress && <span className="mr-2 font-medium text-ink-soft">In progress</span>}
            {showOrigin && task.event && (
              <>
                from{' '}
                <Link to={`/events/${task.event.id}`} className="underline underline-offset-2 hover:text-ink">
                  {task.event.title}
                </Link>
              </>
            )}
          </p>
        )}
      </div>

      {/* actions: always reachable by keyboard, visible on hover */}
      <div className="flex w-0 items-center gap-0.5 overflow-hidden group-focus-within:w-auto group-hover:w-auto">
        {!done && (
          <IconButton label={inProgress ? 'Pause' : 'Start'} onClick={toggleProgress}>
            {inProgress ? <Pause size={14} /> : <Play size={14} />}
          </IconButton>
        )}
        <label className="sr-only" htmlFor={`prio-${task.id}`}>
          Priority
        </label>
        <select
          id={`prio-${task.id}`}
          value={task.priority}
          onChange={(e) => update.mutate({ id: task.id, priority: e.target.value as Priority })}
          className="cursor-pointer rounded-md bg-transparent px-1 py-1 text-xs text-ink-soft hover:bg-paper"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {priorityLabel[p]}
            </option>
          ))}
        </select>
        <IconButton label="Delete task" onClick={() => remove.mutate(task.id)} danger>
          <Trash2 size={14} />
        </IconButton>
      </div>
    </li>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  danger,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-md p-1.5 text-ink-faint hover:bg-paper ${danger ? 'hover:text-danger' : 'hover:text-ink'}`}
    >
      {children}
    </button>
  );
}
