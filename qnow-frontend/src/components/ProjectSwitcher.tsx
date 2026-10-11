import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCreateProject } from '../api/hooks';
import { useActiveProject } from '../lib/activeProject';

export function ProjectSwitcher() {
  const { project, projects, select } = useActiveProject();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const create = useCreateProject();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const choose = (id: string) => {
    select(id);
    setOpen(false);
    navigate('/');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const created = await create.mutateAsync({ name: name.trim() });
    setName('');
    setCreating(false);
    choose(created.id);
  };

  return (
    <div ref={ref} className="relative">
      <button
        className="btn btn-quiet -ml-2 text-base font-semibold text-ink"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {project?.name}
        <ChevronDown size={16} className="text-ink-faint" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 z-20 mt-1 w-72 rounded-lg border border-rule bg-sheet p-1.5 shadow-[0_8px_24px_-12px_rgba(28,36,51,0.35)]"
        >
          <p className="px-2.5 pt-1.5 pb-1 text-xs text-ink-faint">Most recent activity first</p>
          {projects.map((p) => (
            <button
              key={p.id}
              role="menuitem"
              onClick={() => choose(p.id)}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left hover:bg-paper"
            >
              <span className={p.status === 'active' ? '' : 'text-ink-faint'}>
                {p.name}
                {p.status !== 'active' && <span className="ml-2 text-xs">{p.status}</span>}
              </span>
              {p.id === project?.id && <Check size={15} />}
            </button>
          ))}
          <div className="my-1 h-px bg-rule" />
          {creating ? (
            <form onSubmit={submit} className="flex items-center gap-2 px-2.5 py-1.5">
              <input
                autoFocus
                className="field"
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button className="btn btn-primary" disabled={!name.trim() || create.isPending}>
                Create
              </button>
            </form>
          ) : (
            <button
              role="menuitem"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-ink-soft hover:bg-paper hover:text-ink"
            >
              <Plus size={15} /> New project
            </button>
          )}
        </div>
      )}
    </div>
  );
}
