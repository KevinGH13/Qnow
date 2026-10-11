import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../api/client';
import { authClient, clearAccessToken, UNAUTHORIZED_EVENT } from './authClient';

export interface SignedInUser {
  id: string;
  email: string | null;
  name: string | null;
}

export type AuthState =
  | { status: 'misconfigured' }
  | { status: 'loading' }
  | { status: 'signedOut'; notice?: string }
  | { status: 'notAllowed'; message: string; userId?: string; email?: string | null }
  | { status: 'signedIn'; user: SignedInUser };

interface AuthValue {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Better Auth returns `{ data, error }`, but the Neon adapter may also throw: normalise both. */
async function call<T>(fn: () => Promise<{ data: T | null; error: { message?: string } | null }>) {
  try {
    const { data, error } = await fn();
    if (error) throw new Error(error.message || 'Something went wrong. Try again.');
    return data;
  } catch (e) {
    throw new Error((e as Error).message || 'Something went wrong. Try again.');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(authClient ? { status: 'loading' } : { status: 'misconfigured' });
  const queryClient = useQueryClient();

  /** Asks our API who we are: confirms the session works and the account is allowed. */
  const resolve = useCallback(async (email?: string | null) => {
    clearAccessToken();
    try {
      const user = await api.get<SignedInUser>('/me');
      setState({ status: 'signedIn', user });
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setState({
          status: 'notAllowed',
          message: e.message,
          userId: typeof e.body?.userId === 'string' ? e.body.userId : undefined,
          email,
        });
      } else if (e instanceof ApiError && e.status === 401) {
        setState({ status: 'signedOut' });
      } else {
        // API down: keep the session, the app shows its own "can't reach the API" screen.
        setState({ status: 'signedIn', user: { id: '', email: email ?? null, name: null } });
      }
    }
  }, []);

  // Restore the session on load.
  useEffect(() => {
    if (!authClient) return;
    (async () => {
      try {
        const { data } = await authClient.getSession();
        if (data?.session) await resolve(data.user?.email);
        else setState({ status: 'signedOut' });
      } catch {
        setState({ status: 'signedOut' });
      }
    })();
  }, [resolve]);

  // The API rejected us after a refresh: the session is gone.
  useEffect(() => {
    const onUnauthorized = () => {
      clearAccessToken();
      setState({ status: 'signedOut', notice: 'Your session ended. Sign in again.' });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const signIn = async (email: string, password: string) => {
    await call(() => authClient!.signIn.email({ email, password }));
    await resolve(email);
  };

  const signUp = async (name: string, email: string, password: string) => {
    await call(() => authClient!.signUp.email({ name, email, password }));
    const { data } = await authClient!.getSession();
    if (data?.session) await resolve(email);
    else setState({ status: 'signedOut', notice: 'Account created. Check your email to verify it, then sign in.' });
  };

  const signOut = async () => {
    try {
      await authClient?.signOut();
    } finally {
      clearAccessToken();
      queryClient.clear();
      setState({ status: 'signedOut' });
    }
  };

  return <AuthContext.Provider value={{ state, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
