import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { useCreateDecision, useDeleteDecision } from '../api/hooks';
import type { Decision } from '../api/types';
import { formatDay } from '../lib/dates';
import { TagInput } from './TagInput';
import { IconButton } from './TaskRow';

export function DecisionsSection({
  eventId,
  eventDate,
  decisions,
}: {
  eventId: string;
  eventDate: string;
  decisions: Decision[];
}) {
  const remove = useDeleteDecision();

  return (
    <section aria-label="Decisions">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Decisions</h2>
        <span className="tnum text-sm text-ink-faint">{decisions.length}</span>
      </div>

      {decisions.length > 0 && (
        <ol className="mb-4 space-y-3">
          {decisions.map((d) => (
            <li key={d.id} className="group flex gap-3 border-l-2 border-ink pl-4">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line">{d.text}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
                  <span className="tnum">{formatDay(d.date)}</span>
                  {d.tags.map(({ tag }) => (
                    <span key={tag.id} className="rounded-full bg-[#e2e6eb] px-2 py-0.5 text-ink-soft">
                      {tag.name}
                    </span>
                  ))}
                </p>
              </div>
              <div className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                <IconButton label="Delete decision" onClick={() => remove.mutate(d.id)} danger>
                  <Trash2 size={14} />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}

      <DecisionComposer eventId={eventId} eventDate={eventDate} />
    </section>
  );
}

/** New decisions take the event's date: they were made in that meeting, whenever you log them. */
function DecisionComposer({ eventId, eventDate }: { eventId: string; eventDate: string }) {
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const create = useCreateDecision();

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    await create.mutateAsync({ eventId, text: text.trim(), tags, date: eventDate });
    setText('');
    setTags([]);
  };

  return (
    <form onSubmit={submit} className="rounded-lg bg-sheet px-3 pt-2 pb-2.5">
      <label>
        <span className="sr-only">New decision</span>
        <textarea
          rows={2}
          className="field resize-none border-transparent hover:border-transparent focus:border-rule"
          placeholder="What was decided, and why?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
        />
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <TagInput value={tags} onChange={setTags} />
        </div>
        <button className="btn btn-quiet self-end py-1 text-xs" disabled={!text.trim() || create.isPending}>
          Add decision
        </button>
      </div>
      {create.error && <p className="mt-2 text-sm text-danger">{create.error.message}</p>}
    </form>
  );
}
