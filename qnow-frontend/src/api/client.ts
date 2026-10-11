import { getAccessToken, UNAUTHORIZED_EVENT } from '../lib/authClient';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: Record<string, unknown>,
  ) {
    super(message);
  }
}

async function send(method: string, path: string, body: unknown, token: string | null) {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res = await send(method, path, body, await getAccessToken());

  // The cached token may have just expired or been revoked: refresh once and retry.
  if (res.status === 401) {
    res = await send(method, path, body, await getAccessToken({ force: true }));
    if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    let data: Record<string, unknown> | undefined;
    try {
      data = await res.json();
      const m = data?.message;
      if (m) message = Array.isArray(m) ? m.join(', ') : String(m);
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message, data);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/** Builds a query string, skipping empty values. */
export function qs(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v) as [string, string][];
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
}
