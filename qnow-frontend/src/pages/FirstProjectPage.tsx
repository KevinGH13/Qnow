import { useState, type FormEvent } from 'react';
import { useCreateProject } from '../api/hooks';

export function FirstProjectPage() {
  const [name, setName] = useState('');
  const create = useCreateProject();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) create.mutate({ name: name.trim() });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <Wordmark />
      <h1 className="mt-10 text-3xl leading-tight font-semibold tracking-tight">
        What are you working on?
      </h1>
      <p className="mt-3 text-ink-soft">
        Everything in qnow lives inside a project: its meetings, the decisions made in them and the
        tasks that come out of them. Start with the one you're on now.
      </p>
      <form onSubmit={submit} className="mt-8 flex items-end gap-3">
        <label className="flex-1">
          <span className="text-sm text-ink-soft">Project name</span>
          <input
            autoFocus
            className="field text-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Invoicing platform"
          />
        </label>
        <button className="btn btn-primary" disabled={!name.trim() || create.isPending}>
          Create project
        </button>
      </form>
      {create.error && <p className="mt-3 text-sm text-danger">{create.error.message}</p>}
    </div>
  );
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
      <span aria-hidden className="relative inline-block h-5 w-5 rounded-[5px] bg-accent">
        <span className="absolute inset-x-1 top-[9px] h-[3px] bg-on-accent" />
      </span>
      qnow
    </span>
  );
}
