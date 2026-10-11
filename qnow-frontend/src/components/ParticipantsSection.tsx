import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useAddParticipant, usePeople, useRemoveParticipant } from '../api/hooks';
import { usePersonPanel } from '../lib/personLink';
import { Initials } from './Initials';
import { NewPersonForm } from './NewPersonForm';
import type { Person } from '../api/types';

export function ParticipantsSection({ eventId, participants }: { eventId: string; participants: Person[] }) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const { data: people = [] } = usePeople();
  const add = useAddParticipant();
  const remove = useRemoveParticipant();
  const panel = usePersonPanel();

  const taken = new Set(participants.map((p) => p.id));
  const q = query.trim().toLowerCase();
  const matches = q
    ? people
        .filter((p) => !taken.has(p.id))
        .filter((p) => p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q))
        .slice(0, 5)
    : [];

  const pick = (personId: string) => {
    add.mutate({ eventId, personId });
    setQuery('');
  };

  return (
    <section aria-label="Participants">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Participants</h2>
        <span className="tnum text-sm text-ink-faint">{participants.length}</span>
      </div>

      {participants.length > 0 && (
        <ul className="mb-3 space-y-1">
          {participants.map((p) => (
            <li key={p.id} className="group flex items-center gap-3 py-1">
              <Initials name={p.name} />
              <div className="min-w-0 flex-1 leading-tight">
                <button
                  onClick={() => panel.open(p.id)}
                  className="block max-w-full truncate text-left font-medium underline-offset-4 hover:underline"
                  title="View and edit"
                >
                  {p.name}
                </button>
                {(p.role || p.email) && <p className="truncate text-xs text-ink-faint">{p.role ?? p.email}</p>}
              </div>
              <button
                aria-label={`Remove ${p.name}`}
                onClick={() => remove.mutate({ eventId, personId: p.id })}
                className="rounded-md p-1 text-ink-faint opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-paper hover:text-ink"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <NewPersonForm
          initialName={query}
          onCancel={() => setCreating(false)}
          onCreated={(person) => {
            pick(person.id);
            setCreating(false);
          }}
        />
      ) : (
        <div>
          <label>
            <span className="sr-only">Add a participant</span>
            <input
              className="field text-sm"
              placeholder="Add someone by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matches[0]) pick(matches[0].id);
              }}
            />
          </label>
          {q && (
            <ul className="mt-1">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => pick(p.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-sheet"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="truncate text-ink-faint">{p.email}</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink-soft hover:bg-sheet hover:text-ink"
                >
                  <UserPlus size={14} /> Add “{query.trim()}” as a new person
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
