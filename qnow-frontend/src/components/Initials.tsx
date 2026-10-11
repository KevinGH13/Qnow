export function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const dims = { sm: 'h-6 w-6 text-[0.65rem]', md: 'h-8 w-8 text-xs', lg: 'h-12 w-12 text-base' }[size];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-sheet ${dims}`}
    >
      {initials}
    </span>
  );
}
