import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useDeleteEvent, useEvent, useUpdateEvent } from '../api/hooks';
import type { EventDetail } from '../api/types';
import { formatDay } from '../lib/dates';
import { DateTimePicker } from '../components/DateTimePicker';
import { DecisionsSection } from '../components/DecisionsSection';
import { ParticipantsSection } from '../components/ParticipantsSection';
import { TaskPanel } from '../components/TaskPanel';
import { useActiveProject } from '../lib/activeProject';

export function EventPage() {
  const { id = '' } = useParams();
  const { data: event, isLoading, error } = useEvent(id);
  const { project, select } = useActiveProject();

  // Opening an event from another project makes that project active.
  useEffect(() => {
    if (event && project && event.projectId !== project.id) select(event.projectId);
  }, [event, project, select]);

  if (isLoading) return <p className="pt-10 text-ink-faint">Loading event…</p>;
  if (error || !event)
    return (
      <div className="pt-10">
        <p>This event couldn't be loaded{error ? `: ${error.message}` : '.'}</p>
        <Link to="/" className="mt-3 inline-block underline underline-offset-4">
          Back to the timeline
        </Link>
      </div>
    );

  return <EventView key={event.id} event={event} />;
}

function EventView({ event }: { event: EventDetail }) {
  const update = useUpdateEvent();
  const held = event.status === 'completed';
  const isFuture = new Date(event.date).getTime() > Date.now();

  return (
    <article className="pt-4">
      <Link to="/" className="btn btn-quiet -ml-3 text-sm">
        <ArrowLeft size={15} /> Timeline
      </Link>

      <header className="mt-6 max-w-3xl">
        <DateField event={event} />
        <TitleField event={event} />
      </header>

      {!held && (
        <div className="mt-6 flex max-w-3xl flex-col gap-3 rounded-lg border-l-[3px] border-accent bg-sheet px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-soft">
            {isFuture
              ? 'This event is on your agenda. When it happens, mark it as held to log decisions and tasks.'
              : `This was on your agenda for ${formatDay(event.date)} and hasn't been logged yet.`}
          </p>
          <button
            className="btn btn-primary"
            disabled={update.isPending}
            onClick={() => update.mutate({ id: event.id, status: 'completed' })}
          >
            Mark as held
          </button>
        </div>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
        <div className="min-w-0 space-y-12">
          <NotesField event={event} />
          {held && (
            <>
              <DecisionsSection eventId={event.id} eventDate={event.date} decisions={event.decisions} />
              <TaskPanel
                projectId={event.projectId}
                eventId={event.id}
                tasks={event.tasks}
                showOrigin={false}
                title="Tasks from this event"
              />
            </>
          )}
        </div>
        <aside className="space-y-12">
          <ParticipantsSection eventId={event.id} participants={event.participants.map((p) => p.person)} />
          <DeleteEvent event={event} />
        </aside>
      </div>
    </article>
  );
}

function TitleField({ event }: { event: EventDetail }) {
  const [title, setTitle] = useState(event.title);
  const update = useUpdateEvent();

  const save = () => {
    const next = title.trim();
    if (!next) return setTitle(event.title);
    if (next !== event.title) update.mutate({ id: event.id, title: next });
  };

  return (
    <label className="mt-1 block">
      <span className="sr-only">Event title</span>
      <input
        className="w-full rounded-md bg-transparent py-1 text-3xl leading-tight font-semibold tracking-tight hover:bg-sheet focus:bg-sheet focus:outline-none"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}

function DateField({ event }: { event: EventDetail }) {
  const [value, setValue] = useState(() => new Date(event.date));
  const update = useUpdateEvent();

  // Picks apply live in the picker; save once when it closes.
  const save = () => {
    if (value.toISOString() !== new Date(event.date).toISOString()) {
      update.mutate({ id: event.id, date: value.toISOString() });
    }
  };

  return <DateTimePicker value={value} onChange={setValue} onClose={save} variant="plain" label="Event date" />;
}

function NotesField({ event }: { event: EventDetail }) {
  const [notes, setNotes] = useState(event.description ?? '');
  const update = useUpdateEvent();
  const dirty = notes !== (event.description ?? '');

  return (
    <section aria-label="Notes">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Notes</h2>
        <span className="text-xs text-ink-faint" aria-live="polite">
          {update.isPending ? 'Saving…' : dirty ? 'Unsaved' : ''}
        </span>
      </div>
      <textarea
        rows={Math.max(3, notes.split('\n').length + 1)}
        className="w-full resize-y rounded-lg bg-sheet px-4 py-3 leading-relaxed placeholder:text-ink-faint focus:outline-2 focus:outline-ink/40"
        placeholder="Context, agenda, anything worth remembering. Saved when you click away."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => dirty && update.mutate({ id: event.id, description: notes })}
      />
    </section>
  );
}

function DeleteEvent({ event }: { event: EventDetail }) {
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteEvent();
  const navigate = useNavigate();

  const counts = event.decisions.length + event.tasks.length;

  if (!confirming)
    return (
      <button className="text-sm text-ink-faint hover:text-danger" onClick={() => setConfirming(true)}>
        Delete event
      </button>
    );

  return (
    <div className="rounded-lg bg-sheet p-3 text-sm">
      <p>
        Delete “{event.title}”
        {counts > 0 && <> and its {event.decisions.length} decisions</>}? Its tasks stay in the project.
      </p>
      <div className="mt-2 flex justify-end gap-1">
        <button className="btn btn-quiet py-1 text-xs" onClick={() => setConfirming(false)}>
          Keep it
        </button>
        <button
          className="btn py-1 text-xs bg-danger text-white hover:bg-danger/90"
          onClick={async () => {
            await remove.mutateAsync(event.id);
            navigate('/');
          }}
        >
          Delete event
        </button>
      </div>
    </div>
  );
}
