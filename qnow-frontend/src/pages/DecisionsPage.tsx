import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Search, X } from 'lucide-react';
import { useDecisions } from '../api/hooks';
import type { Decision } from '../api/types';
import { useActiveProject } from '../lib/activeProject';
import { formatDay, formatMonth, formatWeekday } from '../lib/dates';
import { Highlight } from '../components/Highlight';

/** Every decision in the project, newest first, grouped by month; filter by tag and free text. */
export function DecisionsPage() {
  const { project } = useActiveProject();
  const { data: decisions = [], isLoading, error } = useDecisions(project?.id);
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    decisions.forEach((d) => d.tags.forEach(({ tag }) => counts.set(tag.name, (counts.get(tag.name) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [decisions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return decisions.filter((d) => {
      const names = d.tags.map((t) => t.tag.name);
      if (!activeTags.every((t) => names.includes(t))) return false;
      if (!q) return true;
      return d.text.toLowerCase().includes(q) || d.event?.title.toLowerCase().includes(q);
    });
  }, [decisions, query, activeTags]);

  const groups = useMemo(() => {
    const byMonth = new Map<string, Decision[]>();
    filtered.forEach((d) => {
      const key = formatMonth(d.date);
      byMonth.set(key, [...(byMonth.get(key) ?? []), d]);
    });
    return [...byMonth.entries()];
  }, [filtered]);

  const toggleTag = (name: string) =>
    setActiveTags((tags) => (tags.includes(name) ? tags.filter((t) => t !== name) : [...tags, name]));
  const filtering = query.trim() !== '' || activeTags.length > 0;

  if (!project) return null;

  return (
    <div className="max-w-3xl pt-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
        <span className="tnum text-sm text-ink-faint">
          {filtering ? `${filtered.length} of ${decisions.length}` : decisions.length}
        </span>
      </div>

      {decisions.length > 0 && (
        <div className="mt-5 space-y-3">
          <label className="relative block">
            <span className="sr-only">Search decisions</span>
            <Search size={16} className="absolute top-1/2 left-0 -translate-y-1/2 text-ink-faint" />
            <input
              className="field pl-6"
              placeholder="Search what was decided, or the meeting it came from"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {tagCounts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter by tag">
              {tagCounts.map(([name, count]) => {
                const active = activeTags.includes(name);
                return (
                  <button
                    key={name}
                    aria-pressed={active}
                    onClick={() => toggleTag(name)}
                    className={`tnum rounded-full px-2.5 py-0.5 text-sm transition-colors ${
                      active ? 'bg-accent text-on-accent' : 'bg-[#e2e6eb] text-ink-soft hover:text-ink'
                    }`}
                  >
                    {name} <span className={active ? 'text-on-accent/75' : 'text-ink-faint'}>{count}</span>
                  </button>
                );
              })}
              {filtering && (
                <button
                  className="ml-1 inline-flex items-center gap-1 text-sm text-ink-faint hover:text-ink"
                  onClick={() => {
                    setQuery('');
                    setActiveTags([]);
                  }}
                >
                  <X size={13} /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        {isLoading && <p className="text-ink-faint">Loading decisions…</p>}
        {error && <p className="text-danger">Couldn't load decisions: {error.message}</p>}

        {!isLoading && decisions.length === 0 && (
          <p className="max-w-md text-ink-soft">
            No decisions yet. They're logged inside events: open a meeting you've held and add what
            was agreed.
          </p>
        )}

        {decisions.length > 0 && filtered.length === 0 && (
          <p className="text-ink-soft">No decisions match these filters.</p>
        )}

        {groups.map(([month, items]) => (
          <section key={month} aria-label={month} className="relative mb-8">
            <h2 className="mb-2 pl-[7rem] text-sm text-ink-soft">{month}</h2>
            <div aria-hidden className="absolute top-8 bottom-0 left-[calc(5.5rem+0.75rem)] w-px bg-rule" />
            <ol>
              {items.map((d) => (
                <li key={d.id} className="grid grid-cols-[5.5rem_1.5rem_1fr] py-3">
                  <div className="tnum pt-0.5 pr-3 text-right leading-tight">
                    <div className="font-semibold">{formatDay(d.date)}</div>
                    <div className="text-xs text-ink-faint">{formatWeekday(d.date)}</div>
                  </div>
                  <div className="relative flex justify-center pt-[0.5rem]">
                    {/* decisions get a square mark; events on the timeline are round */}
                    <span aria-hidden className="relative h-[9px] w-[9px] rotate-45 bg-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="whitespace-pre-line">
                      <Highlight text={d.text} query={query} />
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
                      {d.tags.map(({ tag }) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.name)}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            activeTags.includes(tag.name)
                              ? 'bg-accent text-on-accent'
                              : 'bg-[#e2e6eb] text-ink-soft hover:text-ink'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                      {d.event && (
                        <span className="text-ink-faint">
                          from{' '}
                          <Link to={`/events/${d.event.id}`} className="underline underline-offset-2 hover:text-ink">
                            <Highlight text={d.event.title} query={query} />
                          </Link>
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
