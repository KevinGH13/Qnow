import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { X } from 'lucide-react';
import {
  useAddTeamMember,
  useDeletePerson,
  usePerson,
  useRemoveTeamMember,
  useTeams,
  useUpdatePerson,
} from '../api/hooks';
import type { PersonProfile } from '../api/types';
import { useActiveProject } from '../lib/activeProject';
import { formatDay } from '../lib/dates';
import { usePersonPanel } from '../lib/personLink';
import { Initials } from './Initials';
import { personErrorMessage } from './NewPersonForm';

/** Side panel to view and edit a person, opened with `?person=<id>` from any page. */
export function PersonPanel() {
  const { personId, close } = usePersonPanel();
  const { project } = useActiveProject();
  const { data: person, error } = usePerson(personId, project?.id);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;

  // Only re-run when a different person opens, so typing in the form never loses focus.
  useEffect(() => {
    if (!personId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [personId]);

  if (!personId) return null;

  return (
    <div className="fixed inset-0 z-30">
      <div aria-hidden className="absolute inset-0 bg-ink/25" onClick={close} />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={person ? person.name : 'Person'}
        className="absolute top-0 right-0 flex h-dvh w-full flex-col overflow-y-auto bg-paper shadow-[-12px_0_32px_-16px_rgba(28,36,51,0.4)] focus:outline-none sm:w-[30rem]"
      >
        <div className="flex justify-end px-5 pt-4">
          <button aria-label="Close" onClick={close} className="rounded-md p-1.5 text-ink-faint hover:bg-[#e2e6eb] hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {error ? (
          <p className="px-6 text-danger">This person couldn't be loaded: {error.message}</p>
        ) : !person || !project ? (
          <p className="px-6 text-ink-faint">Loading…</p>
        ) : (
          <PersonBody key={person.id} person={person} projectId={project.id} projectName={project.name} onDeleted={close} />
        )}
      </aside>
    </div>
  );
}

function PersonBody({
  person,
  projectId,
  projectName,
  onDeleted,
}: {
  person: PersonProfile;
  projectId: string;
  projectName: string;
  onDeleted: () => void;
}) {
  const now = Date.now();
  const past = person.meetings.filter((m) => new Date(m.date).getTime() <= now);
  const upcoming = person.meetings.filter((m) => new Date(m.date).getTime() > now).reverse();

  return (
    <div className="space-y-10 px-6 pb-12">
      <header className="flex items-center gap-4">
        <Initials name={person.name} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight">{person.name}</h2>
          <p className="truncate text-sm text-ink-soft">{[person.role, person.email].filter(Boolean).join(', ') || 'No role or email yet'}</p>
        </div>
      </header>

      <DetailsForm person={person} />

      <TeamsChecklist person={person} projectId={projectId} projectName={projectName} />

      <section aria-label="Meetings">
        <h3 className="mb-2 font-semibold">
          Meetings in {projectName} <span className="tnum font-normal text-ink-faint">{person.meetings.length}</span>
        </h3>
        {person.meetings.length === 0 && <p className="text-sm text-ink-soft">Not in any meeting of this project yet.</p>}
        <ul className="space-y-1 text-sm">
          {upcoming.map((m) => (
            <MeetingRow key={m.id} meeting={m} upcoming />
          ))}
          {past.map((m) => (
            <MeetingRow key={m.id} meeting={m} />
          ))}
        </ul>
      </section>

      <section aria-label="Decisions from their meetings">
        <h3 className="mb-2 font-semibold">
          Decisions from their meetings <span className="tnum font-normal text-ink-faint">{person.decisions.length}</span>
        </h3>
        {person.decisions.length === 0 && <p className="text-sm text-ink-soft">None yet.</p>}
        <ul className="space-y-3">
          {person.decisions.map((d) => (
            <li key={d.id} className="border-l-2 border-accent pl-3 text-sm">
              <p>{d.text}</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                <span className="tnum">{formatDay(d.date)}</span>
                {d.event && (
                  <>
                    {', '}
                    <Link to={`/events/${d.event.id}`} className="underline underline-offset-2 hover:text-ink">
                      {d.event.title}
                    </Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <DeletePerson person={person} onDeleted={onDeleted} />
    </div>
  );
}

function MeetingRow({ meeting, upcoming }: { meeting: PersonProfile['meetings'][number]; upcoming?: boolean }) {
  return (
    <li className="flex gap-3">
      <span className="tnum w-14 shrink-0 text-ink-faint">{formatDay(meeting.date)}</span>
      <Link to={`/events/${meeting.id}`} className="min-w-0 truncate underline-offset-2 hover:underline">
        {meeting.title}
      </Link>
      {upcoming && <span className="shrink-0 text-xs text-accent">upcoming</span>}
    </li>
  );
}

function DetailsForm({ person }: { person: PersonProfile }) {
  const initial = {
    name: person.name,
    email: person.email ?? '',
    role: person.role ?? '',
    description: person.description ?? '',
  };
  const [form, setForm] = useState(initial);
  const update = useUpdatePerson();
  const dirty = (Object.keys(initial) as (keyof typeof initial)[]).some((k) => form[k] !== initial[k]);

  const set = (k: keyof typeof initial) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    update.mutate({
      id: person.id,
      name: form.name.trim(),
      email: form.email.trim() || null,
      role: form.role.trim() || null,
      description: form.description.trim() || null,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3" aria-label="Details">
      <Field label="Name">
        <input className="field" value={form.name} onChange={set('name')} />
      </Field>
      <Field label="Email">
        <input className="field" type="email" placeholder="Optional" value={form.email} onChange={set('email')} />
      </Field>
      <Field label="Role">
        <input className="field" placeholder="e.g. Product owner" value={form.role} onChange={set('role')} />
      </Field>
      <Field label="Notes">
        <textarea
          rows={2}
          className="field resize-none"
          placeholder="Anything worth remembering about them"
          value={form.description}
          onChange={set('description')}
        />
      </Field>
      <div className="flex items-center justify-end gap-3">
        {update.error && <span className="text-sm text-danger">{personErrorMessage(update.error)}</span>}
        {!dirty && update.isSuccess && <span className="text-sm text-ink-faint">Saved</span>}
        <button className="btn btn-primary" disabled={!dirty || !form.name.trim() || update.isPending}>
          Save changes
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[4.5rem_1fr] items-baseline gap-3">
      <span className="text-sm text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function TeamsChecklist({
  person,
  projectId,
  projectName,
}: {
  person: PersonProfile;
  projectId: string;
  projectName: string;
}) {
  const { data: teams = [] } = useTeams(projectId);
  const add = useAddTeamMember();
  const remove = useRemoveTeamMember();
  const memberOf = new Set(person.teams.map((t) => t.id));
  // Optimistic: reflect the click immediately, then let the refetch confirm it.
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const toggle = (teamId: string, checked: boolean) => {
    setPending((p) => ({ ...p, [teamId]: !checked }));
    (checked ? remove : add).mutate(
      { teamId, personId: person.id },
      { onSettled: () => setPending(({ [teamId]: _, ...rest }) => rest) },
    );
  };

  return (
    <section aria-label="Teams">
      <h3 className="mb-2 font-semibold">Teams in {projectName}</h3>
      {teams.length === 0 ? (
        <p className="text-sm text-ink-soft">
          This project has no teams yet.{' '}
          <Link to="/people" className="underline underline-offset-2">
            Create one on the People page
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-1">
          {teams.map((t) => {
            const checked = pending[t.id] ?? memberOf.has(t.id);
            return (
              <li key={t.id}>
                <label className="flex cursor-pointer items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-accent)]"
                    checked={checked}
                    onChange={() => toggle(t.id, checked)}
                  />
                  <span>{t.name}</span>
                  <span className="tnum text-xs text-ink-faint">{t.members.length} members</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function DeletePerson({ person, onDeleted }: { person: PersonProfile; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const remove = useDeletePerson();

  if (!confirming)
    return (
      <button className="text-sm text-ink-faint hover:text-danger" onClick={() => setConfirming(true)}>
        Delete person
      </button>
    );

  return (
    <div className="rounded-lg bg-sheet p-3 text-sm">
      <p>
        Delete {person.name}? They'll be removed from every project, team and meeting. Decisions and
        tasks stay.
      </p>
      <div className="mt-2 flex justify-end gap-1">
        <button className="btn btn-quiet py-1 text-xs" onClick={() => setConfirming(false)}>
          Keep them
        </button>
        <button
          className="btn bg-danger py-1 text-xs text-white hover:bg-danger/90"
          onClick={async () => {
            await remove.mutateAsync(person.id);
            onDeleted();
          }}
        >
          Delete person
        </button>
      </div>
    </div>
  );
}
