import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Wordmark } from './FirstProjectPage';

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12">
      <Wordmark />
      <h1 className="mt-10 text-2xl leading-tight font-semibold tracking-tight">{title}</h1>
      <div className="mt-3 space-y-4 text-ink-soft">{children}</div>
    </div>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-sheet px-1.5 py-0.5 text-[0.85em] text-ink">{children}</code>
);

/** VITE_NEON_AUTH_URL is missing. */
export function AuthSetupPage() {
  return (
    <Shell title="Sign-in isn't set up yet">
      <p>
        Add your Neon Auth URL to <Code>qnow-frontend/.env</Code> and restart <Code>npm run dev</Code>:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-sheet p-3 text-sm text-ink">
        VITE_NEON_AUTH_URL=https://…neonauth…/neondb/auth
      </pre>
      <p className="text-sm">You'll find it in Neon Console, under Auth, in the Configuration tab (Base URL).</p>
    </Shell>
  );
}

/** Signed in with Neon, but the API doesn't allow this account. */
export function NotAllowedPage({ message, userId, email }: { message: string; userId?: string; email?: string | null }) {
  const { signOut } = useAuth();
  const [copied, setCopied] = useState(false);
  const unverified = message.toLowerCase().includes('verify');

  const copy = async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Shell title={unverified ? 'Your email isn’t verified yet' : 'This account can’t use qnow'}>
      <p>
        {email ? <>You're signed in as <span className="text-ink">{email}</span>. </> : null}
        {unverified
          ? 'Your email is on the allowed list, but Neon hasn’t marked it as verified, so the API won’t let it in.'
          : 'qnow only lets in the accounts listed in its backend.'}
      </p>
      {userId && (
        <>
          <p>
            If this is you, add your account id to <Code>ALLOWED_USER_IDS</Code> in <Code>qnow-backend/.env</Code> and
            restart the backend:
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-sheet p-3">
            <code className="min-w-0 flex-1 truncate text-sm text-ink">{userId}</code>
            <button className="btn btn-quiet py-1 text-xs" onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </>
      )}
      <div className="flex gap-2 pt-2">
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
        <button className="btn btn-quiet" onClick={signOut}>
          Sign out
        </button>
      </div>
    </Shell>
  );
}
