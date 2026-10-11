import { useState, type FormEvent } from 'react';
import { useCreateTask } from '../api/hooks';
import type { Priority } from '../api/types';
import { PriorityPicker } from './PriorityPicker';

export function TaskComposer({ projectId, eventId }: { projectId: string; eventId?: string }) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const create = useCreateTask();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await create.mutateAsync({ projectId, eventId, text: text.trim(), priority });
    setText('');
  };

  return (
    <form onSubmit={submit} className="rounded-lg bg-sheet px-3 pt-1.5 pb-2.5">
      <label>
        <span className="sr-only">New task</span>
        <input
          className="field border-transparent hover:border-transparent focus:border-rule"
          placeholder="Add a task and press Enter"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <div className="mt-2 flex items-center justify-between">
        <PriorityPicker value={priority} onChange={setPriority} />
        <button className="btn btn-quiet py-1 text-xs" disabled={!text.trim() || create.isPending}>
          Add task
        </button>
      </div>
      {create.error && <p className="mt-2 text-sm text-danger">{create.error.message}</p>}
    </form>
  );
}
