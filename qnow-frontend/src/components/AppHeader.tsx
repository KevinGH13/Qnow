import { Link, NavLink } from 'react-router';
import { Wordmark } from '../pages/FirstProjectPage';
import { ProjectSwitcher } from './ProjectSwitcher';
import { UserMenu } from './UserMenu';

const TABS = [
  { to: '/', label: 'Timeline', end: true },
  { to: '/decisions', label: 'Decisions', end: false },
  { to: '/people', label: 'People', end: false },
];

export function AppHeader() {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-5 pb-3 sm:px-8">
      <Link to="/" aria-label="qnow home" className="rounded">
        <Wordmark />
      </Link>
      <span aria-hidden className="h-5 w-px bg-rule" />
      <ProjectSwitcher />

      <div className="ml-auto sm:order-last sm:ml-0">
        <UserMenu />
      </div>
      <nav aria-label="Sections" className="order-last -mx-1 flex w-full gap-1 sm:order-none sm:ml-auto sm:w-auto">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-ink after:absolute after:inset-x-3 after:-bottom-[3px] after:h-[2px] after:rounded-full after:bg-accent'
                  : 'text-ink-soft hover:bg-[#e2e6eb] hover:text-ink'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
