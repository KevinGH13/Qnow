import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthVanillaAdapter } from '@neondatabase/auth/vanilla/adapters';

/** Neon Auth base URL (Neon Console → Auth → Configuration). */
export const AUTH_URL = (import.meta.env.VITE_NEON_AUTH_URL as string | undefined)?.trim() || undefined;

/**
 * Neon Managed Better Auth client. The auth service lives on another origin, so cookies
 * must be sent cross-origin (`credentials: 'include'`), otherwise `token()` comes back empty.
 */
export const authClient = AUTH_URL
  ? createAuthClient(AUTH_URL, {
      adapter: BetterAuthVanillaAdapter({ fetchOptions: { credentials: 'include' } }),
    })
  : null;

// ─── Access token for our API ─────────────────────────────
// Neon issues short-lived JWTs (15 min) and returns them with the session (`set-auth-jwt`
// header → `session.token`). The SDK caches the session until that JWT expires, so asking
// for the session is cheap; `force` skips the cache when our API says the token is stale.

const FORCE_FETCH_HEADER = 'X-Force-Fetch'; // honoured by @neondatabase/auth's fetch wrapper

let inFlight: Promise<string | null> | null = null;

type SessionLike = { session?: { token?: unknown } | null; token?: unknown } | null | undefined;

function tokenFrom(data: SessionLike): string | null {
  const t = data?.session?.token ?? data?.token;
  // A JWT has three dot-separated parts; anything else is an opaque session id.
  return typeof t === 'string' && t.split('.').length === 3 ? t : null;
}

export async function getAccessToken({ force = false } = {}): Promise<string | null> {
  if (!authClient) return null;
  if (inFlight && !force) return inFlight;

  inFlight = (async () => {
    try {
      const { data } = await authClient.getSession(
        force ? { fetchOptions: { headers: { [FORCE_FETCH_HEADER]: '1' } } } : undefined,
      );
      return tokenFrom(data as SessionLike);
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Kept for call sites that reset auth state; the SDK owns the token cache. */
export function clearAccessToken() {
  inFlight = null;
}

/** Fired when the API rejects our session even after a token refresh. */
export const UNAUTHORIZED_EVENT = 'qnow:unauthorized';
