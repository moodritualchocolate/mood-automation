/**
 * COOKIE CONSTANTS
 *
 * One cookie only. httpOnly · Secure in prod · SameSite=Lax.
 * No client-readable session metadata. The /api/auth/me route is
 * the single source of truth for the resolved user.
 */

export const SESSION_COOKIE_NAME = 'mood_session';

/** Sliding-expiry default for the cookie's Max-Age, in seconds.
 *  Refreshed every successful /api/auth/me. */
export const SESSION_COOKIE_MAX_AGE_S = 60 * 60 * 24;  // 24 h

/** Absolute upper bound on a session's lifetime, in milliseconds.
 *  After this, even a fresh /me cannot extend the session — the
 *  user must log in again. */
export const SESSION_ABSOLUTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;  // 7 d

/** Sliding-expiry half-life: only extend `expiresAt` after this
 *  much time has elapsed since the last extension. Avoids touching
 *  the store on every single `me` hit. */
export const SESSION_SLIDING_HALFLIFE_MS = 60 * 60 * 1000;  // 1 h

export interface CookieFlags {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
}

export function sessionCookieFlags(): CookieFlags {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_S,
  };
}

/** Flags for the cookie-clearing response on logout. */
export function clearedCookieFlags(): CookieFlags {
  return { ...sessionCookieFlags(), maxAge: 0 };
}
