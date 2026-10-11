import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { SignInPage } from '../pages/SignInPage';
import { AuthSetupPage, NotAllowedPage } from '../pages/AuthStatePages';

/** Renders the app only for an allowed, signed-in account. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  switch (state.status) {
    case 'misconfigured':
      return <AuthSetupPage />;
    case 'loading':
      return <div className="px-6 py-24 text-ink-faint" aria-busy="true">Loading…</div>;
    case 'signedOut':
      return <SignInPage notice={state.notice} />;
    case 'notAllowed':
      return <NotAllowedPage message={state.message} userId={state.userId} email={state.email} />;
    case 'signedIn':
      return <>{children}</>;
  }
}
