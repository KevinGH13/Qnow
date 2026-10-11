/** Reads auth settings from the environment once at startup. */
export interface AuthConfig {
  /** Neon Auth base URL, e.g. https://ep-xxx.neonauth.us-east-1.aws.neon.tech/neondb/auth */
  baseUrl: string;
  /** Token issuer: the origin of the base URL. */
  issuer: string;
  jwksUrl: URL;
  /** Neon Auth user ids allowed in (most robust: survives email changes). */
  allowedUserIds: Set<string>;
  /** Emails allowed in, only when Neon reports them as verified. */
  allowedEmails: Set<string>;
}

const list = (value?: string) =>
  new Set(
    (value ?? '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
  );

export function loadAuthConfig(env = process.env): AuthConfig {
  const baseUrl = env.NEON_AUTH_BASE_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('NEON_AUTH_BASE_URL is not set. Copy the Base URL from Neon Console → Auth → Configuration.');
  }
  const allowedUserIds = list(env.ALLOWED_USER_IDS);
  const allowedEmails = list(env.ALLOWED_EMAILS);
  if (allowedUserIds.size === 0 && allowedEmails.size === 0) {
    throw new Error('Set ALLOWED_EMAILS and/or ALLOWED_USER_IDS so only you can use the API.');
  }
  return {
    baseUrl,
    issuer: new URL(baseUrl).origin,
    jwksUrl: new URL(`${baseUrl}/.well-known/jwks.json`),
    allowedUserIds,
    allowedEmails,
  };
}
