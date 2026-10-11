import { Link } from 'react-router';
import { useProjects } from '../api/hooks';

/** Full-area states: loading, API unreachable, missing route. */
export function ApiState({ kind }: { kind: 'loading' | 'error' | 'notFound' }) {
  const { error, refetch, isFetching } = useProjects();

  if (kind === 'error') {
    return (
      <div className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-xl font-semibold">Can't reach the qnow API</h1>
        <p className="mt-2 text-ink-soft">
          Start the backend with <code className="rounded bg-sheet px-1.5 py-0.5">npm run start:dev</code> in{' '}
          <code className="rounded bg-sheet px-1.5 py-0.5">qnow-backend</code>, then try again.
        </p>
        <p className="mt-1 text-sm text-ink-faint">{error?.message}</p>
        <button className="btn btn-primary mt-6" disabled={isFetching} onClick={() => refetch()}>
          {isFetching ? 'Trying…' : 'Try again'}
        </button>
      </div>
    );
  }

  if (kind === 'notFound') {
    return (
      <div className="py-24">
        <h1 className="text-xl font-semibold">This page doesn't exist</h1>
        <Link to="/" className="mt-4 inline-block underline underline-offset-4">
          Back to the timeline
        </Link>
      </div>
    );
  }

  return <div className="px-6 py-24 text-ink-faint" aria-busy="true">Loading…</div>;
}
