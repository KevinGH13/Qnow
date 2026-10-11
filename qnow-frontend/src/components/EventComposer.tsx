import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useCreateEvent } from '../api/hooks';
import { DateTimePicker } from './DateTimePicker';

/**
 * Quick capture for an event. If the date is now or in the past the event is logged as held
 * and opens straight away so you can take notes; a future date just adds it to the agenda.
 */
export function EventComposer({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date());
  const create = useCreateEvent();
  const navigate = useNavigate();

  const isFuture = date.getTime() > Date.now() + 60_000;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const event = await create.mutateAsync({
      projectId,
      title: title.trim(),
      date: date.toISOString(),
      status: isFuture ? 'scheduled' : 'completed',
    });
    if (isFuture) onDone();
    else navigate(`/events/${event.id}`);
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === 'Escape' && onDone()}
      className="flex flex-col gap-3"
    >
      <label className="flex-1">
        <span className="sr-only">Event title</span>
        <input
          autoFocus
          className="field border-on-accent/40 text-lg font-medium text-on-accent placeholder:text-on-accent/60 hover:border-on-accent/70 focus:border-on-accent"
          placeholder="Sprint planning, 1:1 with Ana…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <DateTimePicker value={date} onChange={setDate} variant="accent" className="mr-auto" />
        <button type="button" className="btn text-on-accent/85 hover:bg-on-accent/10" onClick={onDone}>
          Cancel
        </button>
        <button className="btn btn-on-accent" disabled={!title.trim() || create.isPending}>
          {isFuture ? 'Add to agenda' : 'Start notes'}
        </button>
      </div>
      <p className="text-xs text-on-accent/75">
        {isFuture
          ? 'A future date puts it on your agenda.'
          : 'Happening now or already happened: it opens so you can take notes.'}
      </p>
      {create.error && <p className="text-sm font-medium text-on-accent">Couldn't save: {create.error.message}</p>}
    </form>
  );
}
