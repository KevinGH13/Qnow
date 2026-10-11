import { useState } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import type { EventSummary } from '../api/types';
import { formatDay, formatLong, formatTime, formatWeekday, relativeDay } from '../lib/dates';
import { EventComposer } from './EventComposer';

const UPCOMING_VISIBLE = 4;
const PAST_PAGE = 12;

/**
 * One continuous timeline with "now" in the middle: upcoming events above it (nearest closest
 * to now), logged events below it (most recent first).
 */
export function Timeline({ projectId, events }: { projectId: string; events: EventSummary[] }) {
  const [composing, setComposing] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [pastLimit, setPastLimit] = useState(PAST_PAGE);

  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.date).getTime() > now)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const past = events
    .filter((e) => new Date(e.date).getTime() <= now)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const visibleUpcoming = (showAllUpcoming ? upcoming : upcoming.slice(0, UPCOMING_VISIBLE)).reverse();
  const hiddenUpcoming = upcoming.length - UPCOMING_VISIBLE;

  return (
    <section aria-label="Timeline" className="relative">
      {/* the spine */}
      <div aria-hidden className="absolute top-0 bottom-0 left-[calc(5.5rem+0.75rem)] w-px bg-rule" />

      {!showAllUpcoming && hiddenUpcoming > 0 && (
        <Row gutter="">
          <button className="btn btn-quiet -ml-3 text-sm" onClick={() => setShowAllUpcoming(true)}>
            Show {hiddenUpcoming} later {hiddenUpcoming === 1 ? 'event' : 'events'}
          </button>
        </Row>
      )}

      <ol>
        {visibleUpcoming.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </ol>

      {/* now */}
      <div className="relative my-4 grid grid-cols-[5.5rem_1.5rem_1fr] items-stretch">
        <div className="flex flex-col justify-center pr-3 text-right">
          <span className="font-semibold">Now</span>
        </div>
        <div aria-hidden className="relative">
          <span className="absolute top-1/2 left-0 h-[3px] w-full -translate-y-1/2 bg-accent" />
        </div>
        <div className="rounded-lg bg-accent px-4 py-3 text-on-accent">
          {composing ? (
            <EventComposer projectId={projectId} onDone={() => setComposing(false)} />
          ) : (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-on-accent/85">
                <span className="hidden sm:inline">{formatLong(new Date().toISOString())}</span>
                <span className="sm:hidden">
                  {formatWeekday(new Date().toISOString())} {formatDay(new Date().toISOString())}
                </span>
              </span>
              <button className="btn btn-on-accent" onClick={() => setComposing(true)}>
                <Plus size={16} /> Log event
              </button>
            </div>
          )}
        </div>
      </div>

      {events.length === 0 && (
        <Row gutter="">
          <p className="max-w-md py-4 text-ink-soft">
            Nothing logged yet. Log the meeting you just had, or pick a future date to put one on
            your agenda.
          </p>
        </Row>
      )}

      <ol>
        {past.slice(0, pastLimit).map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </ol>

      {past.length > pastLimit && (
        <Row gutter="">
          <button className="btn btn-quiet -ml-3 text-sm" onClick={() => setPastLimit((l) => l + PAST_PAGE)}>
            Show older events
          </button>
        </Row>
      )}
    </section>
  );
}

function Row({ gutter, children }: { gutter: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1.5rem_1fr]">
      <div className="pr-3 text-right">{gutter}</div>
      <div />
      <div>{children}</div>
    </div>
  );
}

function EventRow({ event }: { event: EventSummary }) {
  const isFuture = new Date(event.date).getTime() > Date.now();
  const notLogged = event.status === 'scheduled' && !isFuture;
  const relative = relativeDay(event.date);
  const people = event.participants.map((p) => p.person.name.split(' ')[0]);
  const counts = [
    event._count?.decisions ? plural(event._count.decisions, 'decision') : null,
    event._count?.tasks ? plural(event._count.tasks, 'task') : null,
  ].filter(Boolean);

  return (
    <li className="group grid grid-cols-[5.5rem_1.5rem_1fr] py-2.5">
      <div className="tnum pt-0.5 pr-3 text-right leading-tight">
        <div className="font-semibold">{formatDay(event.date)}</div>
        <div className="text-xs text-ink-faint">{formatWeekday(event.date)}</div>
      </div>
      <div className="relative flex justify-center pt-[0.45rem]">
        <span
          aria-hidden
          className={
            event.status === 'completed'
              ? 'relative h-[11px] w-[11px] rounded-full bg-ink'
              : 'relative h-[11px] w-[11px] rounded-full border-2 border-ink-soft bg-paper'
          }
        />
      </div>
      <div className="min-w-0">
        <Link
          to={`/events/${event.id}`}
          className="font-medium underline-offset-4 group-hover:underline"
        >
          {event.title}
        </Link>
        <p className="mt-0.5 text-sm text-ink-soft">
          {formatTime(event.date)}
          {isFuture && relative && <>, {relative.toLowerCase()}</>}
          {notLogged && <span className="ml-2 text-ink-faint italic">Not logged yet</span>}
          {counts.length > 0 && <span className="ml-3">{counts.join(', ')}</span>}
          {people.length > 0 && <span className="ml-3 text-ink-faint">with {listNames(people)}</span>}
        </p>
      </div>
    </li>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function listNames(names: string[]) {
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
}
