import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Initials } from './Initials';

export function UserMenu() {
  const { state, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (state.status !== 'signedIn') return null;
  const { user } = state;
  const label = user.name || user.email || 'You';

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={`Account: ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-full"
      >
        <Initials name={label} size="sm" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-2 w-64 rounded-lg border border-rule bg-sheet p-1.5 shadow-[0_8px_24px_-12px_rgba(28,36,51,0.35)]"
        >
          <div className="px-2.5 py-2">
            {user.name && <p className="truncate font-medium">{user.name}</p>}
            {user.email && <p className="truncate text-sm text-ink-soft">{user.email}</p>}
          </div>
          <div className="my-1 h-px bg-rule" />
          <button
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-ink-soft hover:bg-paper hover:text-ink"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
