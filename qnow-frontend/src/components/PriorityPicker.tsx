import type { Priority } from '../api/types';
import { PRIORITIES, priorityLabel } from '../lib/priority';

/** Three-way segmented control. */
export function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Priority" className="inline-flex rounded-md bg-paper p-0.5">
      {PRIORITIES.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          onClick={() => onChange(p)}
          className={`rounded-[5px] px-2 py-0.5 text-xs font-medium transition-colors ${
            value === p
              ? p === 'high'
                ? 'bg-accent text-on-accent'
                : 'bg-sheet text-ink shadow-[0_1px_2px_rgba(28,36,51,0.15)]'
              : 'text-ink-faint hover:text-ink'
          }`}
        >
          {priorityLabel[p]}
        </button>
      ))}
    </div>
  );
}
