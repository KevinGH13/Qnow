import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { useAddTeamMember, useCreatePerson } from '../api/hooks';
import type { Person } from '../api/types';

export function personErrorMessage(error: Error) {
  return error instanceof ApiError && error.status === 409 ? 'Someone already uses that email.' : error.message;
}

/** Creates a person (only the name is required) and optionally puts them in a team. */
export function NewPersonForm({
  initialName = '',
  teams,
  onCancel,
  onCreated,
}: {
  initialName?: string;
  teams?: { id: string; name: string }[];
  onCancel: () => void;
  onCreated: (p: Person) => void;
}) {
  const looksLikeEmail = initialName.includes('@');
  const [name, setName] = useState(looksLikeEmail ? '' : initialName.trim());
  const [email, setEmail] = useState(looksLikeEmail ? initialName.trim() : '');
  const [role, setRole] = useState('');
  const [teamId, setTeamId] = useState('');
  const create = useCreatePerson();
  const addMember = useAddTeamMember();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const person = await create.mutateAsync({
      name: name.trim(),
      email: email.trim() || undefined,
      role: role.trim() || undefined,
    });
    if (teamId) await addMember.mutateAsync({ teamId, personId: person.id });
    onCreated(person);
  };

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg bg-sheet p-3 text-sm">
      <input autoFocus className="field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
      <input className="field" type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
      <input className="field" placeholder="Role (optional)" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role" />
      {teams && teams.length > 0 && (
        <label className="block">
          <span className="sr-only">Team</span>
          <select className="field cursor-pointer" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {create.error && <p className="text-danger">{personErrorMessage(create.error)}</p>}
      <div className="flex justify-end gap-1 pt-1">
        <button type="button" className="btn btn-quiet py-1 text-xs" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary py-1 text-xs" disabled={!name.trim() || create.isPending}>
          Add person
        </button>
      </div>
    </form>
  );
}
