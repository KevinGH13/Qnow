import { useMemo, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { useTags } from '../api/hooks';

const normalize = (s: string) => s.trim().toLowerCase();

/** Chips input backed by the global tag catalog; unknown tags are created when the decision is saved. */
export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const { data: catalog = [] } = useTags();

  const suggestions = useMemo(() => {
    const q = normalize(draft);
    return catalog
      .filter((t) => !value.includes(t.name) && (!q || t.name.includes(q)))
      .sort((a, b) => (b._count?.decisions ?? 0) - (a._count?.decisions ?? 0))
      .slice(0, 6);
  }, [catalog, draft, value]);

  const add = (raw: string) => {
    const tag = normalize(raw);
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#e2e6eb] py-0.5 pr-1 pl-2.5 text-sm">
            {t}
            <button
              type="button"
              aria-label={`Remove tag ${t}`}
              onClick={() => onChange(value.filter((x) => x !== t))}
              className="rounded-full p-0.5 text-ink-faint hover:text-ink"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          className="min-w-32 flex-1 bg-transparent py-1 text-sm placeholder:text-ink-faint focus:outline-none"
          placeholder={value.length ? 'Add another tag' : 'Tags, separated by Enter'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Tags"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Suggested tags">
          {suggestions.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => add(t.name)}
              className="rounded-full border border-dashed border-rule px-2.5 py-0.5 text-xs text-ink-soft hover:border-ink-soft hover:text-ink"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
