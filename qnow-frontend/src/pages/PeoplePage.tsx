import { useState, type FormEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  useAddTeamMember,
  useCreateTeam,
  useDeleteTeam,
  useProjectPeople,
  useRemoveTeamMember,
  useTeams,
  useUpdateTeam,
} from '../api/hooks';
import type { PersonInProject, Team } from '../api/types';
import { useActiveProject } from '../lib/activeProject';
import { formatDay } from '../lib/dates';
import { usePersonPanel } from '../lib/personLink';
import { Initials } from '../components/Initials';
import { NewPersonForm } from '../components/NewPersonForm';
import { IconButton } from '../components/TaskRow';

export function PeoplePage() {
  const { project } = useActiveProject();
  const { data: people = [], isLoading } = useProjectPeople(project?.id);
  const { data: teams = [] } = useTeams(project?.id);
  const [adding, setAdding] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const panel = usePersonPanel();

  if (!project) return null;

  const inProject = people
    .filter((p) => p.project)
    .sort((a, b) => (b.project!.lastMeetingAt ?? '').localeCompare(a.project!.lastMeetingAt ?? '') || a.name.localeCompare(b.name));
  const others = people.filter((p) => !p.project);

  return (
    <div className="grid gap-12 pt-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <section aria-label="People in this project" className="min-w-0">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <button className="btn btn-quiet -mr-2" onClick={() => setAdding(true)}>
            <Plus size={15} /> Add person
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          Everyone in a team of {project.name} or in one of its meetings, most recently seen first.
        </p>

        {adding && (
          <div className="mt-4 max-w-md">
            <NewPersonForm
              teams={teams}
              onCancel={() => setAdding(false)}
              onCreated={(p) => {
                setAdding(false);
                panel.open(p.id);
              }}
            />
          </div>
        )}

        {isLoading && <p className="mt-6 text-ink-faint">Loading people…</p>}
        {!isLoading && inProject.length === 0 && (
          <p className="mt-6 max-w-md text-ink-soft">
            Nobody here yet. People show up when you add them as participants of a meeting or put them
            in one of the project's teams.
          </p>
        )}

        <ul className="mt-4 divide-y divide-rule">
          {inProject.map((p) => (
            <PersonRow key={p.id} person={p} onOpen={() => panel.open(p.id)} />
          ))}
        </ul>

        {others.length > 0 && (
          <div className="mt-8">
            <button
              className="text-sm text-ink-faint hover:text-ink"
              aria-expanded={showOthers}
              onClick={() => setShowOthers((s) => !s)}
            >
              {showOthers ? 'Hide' : 'Show'} {others.length} {others.length === 1 ? 'person' : 'people'} not in this
              project
            </button>
            {showOthers && (
              <ul className="mt-2 divide-y divide-rule">
                {others.map((p) => (
                  <PersonRow key={p.id} person={p} onOpen={() => panel.open(p.id)} />
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <aside aria-label="Teams" className="lg:sticky lg:top-6 lg:self-start">
        <TeamsPanel projectId={project.id} teams={teams} people={people} />
      </aside>
    </div>
  );
}

function PersonRow({ person, onOpen }: { person: PersonInProject; onOpen: () => void }) {
  const info = person.project;
  const stats = info
    ? [
        info.meetingCount ? `${info.meetingCount} ${info.meetingCount === 1 ? 'meeting' : 'meetings'}` : 'No meetings yet',
        info.lastMeetingAt && `last ${formatDay(info.lastMeetingAt)}`,
        info.nextMeetingAt && `next ${formatDay(info.nextMeetingAt)}`,
      ].filter(Boolean)
    : [];

  return (
    <li>
      <button onClick={onOpen} className="group flex w-full items-center gap-3 py-3 text-left">
        <Initials name={person.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium underline-offset-4 group-hover:underline">{person.name}</p>
          <p className="truncate text-sm text-ink-soft">
            {[person.role, info?.teams.map((t) => t.name).join(', ')].filter(Boolean).join(' in ') ||
              person.email ||
              ' '}
          </p>
        </div>
        {stats.length > 0 && <p className="hidden shrink-0 text-right text-sm text-ink-faint sm:block">{stats.join(', ')}</p>}
      </button>
    </li>
  );
}

function TeamsPanel({ projectId, teams, people }: { projectId: string; teams: Team[]; people: PersonInProject[] }) {
  const [name, setName] = useState('');
  const create = useCreateTeam();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await create.mutateAsync({ projectId, name: name.trim() });
    setName('');
  };

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Teams</h2>
        <span className="tnum text-sm text-ink-faint">{teams.length}</span>
      </div>

      {teams.length === 0 && (
        <p className="mb-4 text-sm text-ink-soft">
          Group the people you work with: backend, finance, the client's team…
        </p>
      )}

      <div className="space-y-4">
        {teams.map((t) => (
          <TeamBlock key={t.id} team={t} people={people} />
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 flex items-end gap-2">
        <label className="flex-1">
          <span className="sr-only">New team name</span>
          <input className="field text-sm" placeholder="New team name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button className="btn btn-quiet py-1 text-xs" disabled={!name.trim() || create.isPending}>
          Create team
        </button>
      </form>
    </div>
  );
}

function TeamBlock({ team, people }: { team: Team; people: PersonInProject[] }) {
  const [title, setTitle] = useState(team.name);
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const update = useUpdateTeam();
  const remove = useDeleteTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const panel = usePersonPanel();

  const memberIds = new Set(team.members.map((m) => m.person.id));
  const candidates = people.filter((p) => !memberIds.has(p.id));

  const saveTitle = () => {
    const next = title.trim();
    if (!next) return setTitle(team.name);
    if (next !== team.name) update.mutate({ id: team.id, name: next });
  };

  return (
    <div className="group/team rounded-lg bg-sheet p-3">
      <div className="flex items-center gap-1">
        <label className="flex-1">
          <span className="sr-only">Team name</span>
          <input
            className="w-full rounded bg-transparent font-semibold hover:bg-paper focus:bg-paper focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        </label>
        <span className="tnum text-xs text-ink-faint">{team.members.length}</span>
        <div className="opacity-0 group-focus-within/team:opacity-100 group-hover/team:opacity-100">
          <IconButton label={`Delete team ${team.name}`} onClick={() => setConfirming(true)} danger>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      {confirming && (
        <div className="mt-2 rounded-md bg-paper p-2 text-sm">
          <p>Delete {team.name}? The people stay; only the group goes.</p>
          <div className="mt-1 flex justify-end gap-1">
            <button className="btn btn-quiet py-0.5 text-xs" onClick={() => setConfirming(false)}>
              Keep it
            </button>
            <button className="btn bg-danger py-0.5 text-xs text-white hover:bg-danger/90" onClick={() => remove.mutate(team.id)}>
              Delete team
            </button>
          </div>
        </div>
      )}

      <ul className="mt-2 space-y-0.5">
        {team.members.map(({ person }) => (
          <li key={person.id} className="group flex items-center gap-2 py-0.5">
            <Initials name={person.name} size="sm" />
            <button onClick={() => panel.open(person.id)} className="min-w-0 flex-1 truncate text-left text-sm hover:underline">
              {person.name}
            </button>
            <button
              aria-label={`Remove ${person.name} from ${team.name}`}
              onClick={() => removeMember.mutate({ teamId: team.id, personId: person.id })}
              className="rounded p-0.5 text-ink-faint opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:text-ink"
            >
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>

      {picking ? (
        <label className="mt-2 block">
          <span className="sr-only">Add member</span>
          <select
            autoFocus
            className="field cursor-pointer text-sm"
            defaultValue=""
            onBlur={() => setPicking(false)}
            onChange={(e) => {
              if (e.target.value) addMember.mutate({ teamId: team.id, personId: e.target.value });
              setPicking(false);
            }}
          >
            <option value="" disabled>
              Choose someone…
            </option>
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.role ? ` (${p.role})` : ''}
              </option>
            ))}
          </select>
        </label>
      ) : (
        candidates.length > 0 && (
          <button onClick={() => setPicking(true)} className="mt-2 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
            <Plus size={13} /> Add member
          </button>
        )
      )}
    </div>
  );
}
