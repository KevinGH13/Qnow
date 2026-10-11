// UI copy is English, so dates follow it instead of the browser locale.
const LOCALE = 'en-US';

const dayFmt = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const longFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export const formatDay = (iso: string) => dayFmt.format(new Date(iso));
export const formatWeekday = (iso: string) => weekdayFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatLong = (iso: string) => longFmt.format(new Date(iso));

/** "Today", "Tomorrow", "Yesterday", "In 3 days", "5 days ago" — or null beyond two weeks. */
export function relativeDay(iso: string, now = new Date()): string | null {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(new Date(iso)) - startOf(now)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff <= 14) return `In ${diff} days`;
  if (diff < -1 && diff >= -14) return `${-diff} days ago`;
  return null;
}


const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
export const formatMonth = (iso: string) => monthFmt.format(new Date(iso));
