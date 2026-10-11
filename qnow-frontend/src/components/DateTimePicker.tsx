import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEvents } from '../api/hooks';
import { useActiveProject } from '../lib/activeProject';

const LOCALE = 'en-US';
const triggerFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', month: 'short', day: 'numeric' });
const yearFmt = new Intl.DateTimeFormat(LOCALE, { year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' });
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const dayLabelFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const SLOT_MINUTES = 15;

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const withTime = (day: Date, minutes: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60);
const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Six Monday-first weeks covering `month`. */
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function quickPicks(now: Date) {
  const tomorrow9 = withTime(addDays(now, 1), 9 * 60);
  const daysToMonday = ((8 - now.getDay()) % 7) || 7;
  const nextMonday9 = withTime(addDays(now, daysToMonday), 9 * 60);
  return [
    { label: 'Now', date: now },
    { label: 'Tomorrow 9 AM', date: tomorrow9 },
    { label: 'Next Monday 9 AM', date: nextMonday9 },
  ];
}

export function formatPickerValue(d: Date) {
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return `${triggerFmt.format(d)}${sameYear ? '' : `, ${yearFmt.format(d)}`} at ${timeFmt.format(d)}`;
}

/**
 * Date + time picker in the app's style: a month grid (days with meetings in the active project
 * get a dot), a 15-minute time column and a few quick picks. Changes apply as you pick;
 * `onClose` fires when the popover closes so callers can save once.
 */
export function DateTimePicker({
  value,
  onChange,
  onClose,
  variant = 'paper',
  label = 'Date and time',
  className = '',
}: {
  value: Date;
  onChange: (d: Date) => void;
  onClose?: () => void;
  variant?: 'paper' | 'accent' | 'plain';
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const [focusDay, setFocusDay] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLUListElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { project } = useActiveProject();
  const { data: events = [] } = useEvents(project?.id);
  const eventDays = useMemo(() => new Set(events.map((e) => dayKey(new Date(e.date)))), [events]);

  const close = (returnFocus = true) => {
    setOpen(false);
    onCloseRef.current?.();
    if (returnFocus) triggerRef.current?.focus();
  };

  // Outside click closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        onCloseRef.current?.();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // On open: show the selected month, focus the selected day, scroll the time list to it.
  useEffect(() => {
    if (!open) return;
    setMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    setFocusDay(value);
    requestAnimationFrame(() => {
      timesRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'center' });
      gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep keyboard focus on the focused day as it moves.
  useEffect(() => {
    if (open) gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [focusDay, open]);

  const selectedMinutes = minutesOf(value);
  const slots = useMemo(() => {
    const base = Array.from({ length: (24 * 60) / SLOT_MINUTES }, (_, i) => i * SLOT_MINUTES);
    return base.includes(selectedMinutes) ? base : [...base, selectedMinutes].sort((a, b) => a - b);
  }, [selectedMinutes]);

  const pickDay = (day: Date) => {
    onChange(withTime(day, selectedMinutes));
    setFocusDay(day);
    if (day.getMonth() !== month.getMonth()) setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  };

  const moveFocus = (day: Date) => {
    setFocusDay(day);
    if (day.getMonth() !== month.getMonth() || day.getFullYear() !== month.getFullYear())
      setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  };

  const onGridKey = (e: KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in moves) {
      e.preventDefault();
      moveFocus(addDays(focusDay, moves[e.key]));
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      const d = new Date(focusDay);
      d.setMonth(d.getMonth() + (e.key === 'PageUp' ? -1 : 1));
      moveFocus(d);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pickDay(focusDay);
    }
  };

  const triggerStyles = {
    paper: 'border-b border-rule hover:border-ink-faint text-ink',
    accent: 'border-b border-on-accent/40 hover:border-on-accent/70 text-on-accent',
    plain: 'rounded-md px-1.5 -ml-1.5 text-ink-soft hover:bg-sheet hover:text-ink',
  }[variant];

  const now = new Date();
  const today = now;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${formatPickerValue(value)}`}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={`inline-flex items-center gap-2 py-1 text-left whitespace-nowrap transition-colors ${triggerStyles}`}
      >
        {variant !== 'plain' && <CalendarDays size={15} className="opacity-70" />}
        {formatPickerValue(value)}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={label}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              close();
            }
          }}
          className="absolute top-full left-0 z-40 mt-2 w-[min(33rem,calc(100vw-2rem))] rounded-xl border border-rule bg-sheet p-4 text-ink shadow-[0_16px_40px_-20px_rgba(28,36,51,0.45)]"
        >
          <div className="mb-3 flex flex-wrap gap-1.5">
            {quickPicks(now).map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => {
                  onChange(q.date);
                  setFocusDay(q.date);
                  setMonth(new Date(q.date.getFullYear(), q.date.getMonth(), 1));
                }}
                className="rounded-full bg-paper px-3 py-1 text-sm text-ink-soft hover:bg-accent-soft hover:text-ink"
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            {/* calendar */}
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{monthFmt.format(month)}</span>
                <div className="flex">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    className="rounded-md p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    className="rounded-md p-1.5 text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div role="grid" aria-label={monthFmt.format(month)} ref={gridRef} onKeyDown={onGridKey}>
                <div role="row" className="grid grid-cols-7 text-center text-xs text-ink-faint">
                  {WEEKDAYS.map((w) => (
                    <span key={w} role="columnheader" className="py-1">
                      {w}
                    </span>
                  ))}
                </div>
                {Array.from({ length: 6 }, (_, week) => (
                  <div role="row" key={week} className="grid grid-cols-7">
                    {monthGrid(month)
                      .slice(week * 7, week * 7 + 7)
                      .map((day) => {
                        const selected = sameDay(day, value);
                        const isToday = sameDay(day, today);
                        const outside = day.getMonth() !== month.getMonth();
                        const hasEvents = eventDays.has(dayKey(day));
                        return (
                          <div role="gridcell" key={dayKey(day)} className="flex justify-center py-0.5">
                            <button
                              type="button"
                              tabIndex={sameDay(day, focusDay) ? 0 : -1}
                              aria-selected={selected}
                              aria-label={`${dayLabelFmt.format(day)}${hasEvents ? ', has meetings' : ''}`}
                              aria-current={isToday ? 'date' : undefined}
                              onClick={() => pickDay(day)}
                              className={`tnum relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                                selected
                                  ? 'bg-accent font-semibold text-on-accent'
                                  : isToday
                                    ? 'font-semibold text-accent ring-1 ring-accent ring-inset hover:bg-accent-soft'
                                    : outside
                                      ? 'text-ink-faint/70 hover:bg-paper'
                                      : 'hover:bg-paper'
                              }`}
                            >
                              {day.getDate()}
                              {hasEvents && (
                                <span
                                  aria-hidden
                                  className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? 'bg-on-accent' : 'bg-ink-soft'}`}
                                />
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>

            {/* time */}
            <div className="sm:w-28">
              <div className="mb-2 flex h-[30px] items-center text-sm text-ink-soft">Time</div>
              <ul
                ref={timesRef}
                role="listbox"
                aria-label="Time"
                className="h-40 overflow-y-auto overscroll-contain pr-1 sm:h-[16.5rem]"
              >
                {slots.map((m) => {
                  const selected = m === selectedMinutes;
                  return (
                    <li key={m}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => onChange(withTime(value, m))}
                        className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                          selected ? 'bg-accent font-semibold text-on-accent' : 'hover:bg-paper'
                        }`}
                      >
                        {timeFmt.format(withTime(value, m))}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-rule pt-3">
            <span className="text-sm text-ink-soft">{formatPickerValue(value)}</span>
            <button type="button" className="btn btn-primary" onClick={() => close()}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
