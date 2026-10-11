import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { Wordmark } from './FirstProjectPage';

/** Sign in (or create the account the first time) with email and password. */
export function SignInPage({ notice }: { notice?: string }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const creating = mode === 'signUp';
  const valid = email.trim() && password.length >= (creating ? 8 : 1) && (!creating || name.trim());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setPending(true);
    setError(null);
    try {
      if (creating) await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <Wordmark />
      <h1 className="mt-10 text-3xl leading-tight font-semibold tracking-tight">
        {creating ? 'Create your account' : 'Sign in to your logbook'}
      </h1>
      <p className="mt-2 text-ink-soft">
        {creating
          ? 'qnow only lets in the accounts allowed in its backend.'
          : 'Your meetings, decisions and tasks are waiting.'}
      </p>

      {notice && !error && (
        <p className="mt-6 rounded-lg border-l-[3px] border-accent bg-sheet px-3 py-2 text-sm">{notice}</p>
      )}

      <form onSubmit={submit} className="mt-8 space-y-5">
        {creating && (
          <label className="block">
            <span className="text-sm text-ink-soft">Name</span>
            <input className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
        )}
        <label className="block">
          <span className="text-sm text-ink-soft">Email</span>
          <input
            className="field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus={!creating}
          />
        </label>
        <label className="block">
          <span className="text-sm text-ink-soft">Password</span>
          <input
            className="field"
            type="password"
            autoComplete={creating ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {creating && <span className="mt-1 block text-xs text-ink-faint">At least 8 characters.</span>}
        </label>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button className="btn btn-primary w-full justify-center py-2.5" disabled={!valid || pending}>
          {pending ? (creating ? 'Creating account…' : 'Signing in…') : creating ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        {creating ? 'Already have an account?' : 'First time here?'}{' '}
        <button
          className="font-medium text-ink underline underline-offset-4"
          onClick={() => {
            setMode(creating ? 'signIn' : 'signUp');
            setError(null);
          }}
        >
          {creating ? 'Sign in' : 'Create your account'}
        </button>
      </p>
    </div>
  );
}
