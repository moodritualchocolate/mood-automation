/**
 * RESOLVE SESSION (shared middleware helper)
 *
 * Reads the session cookie, looks up the session record, verifies
 * the token, touches the sliding-expiry, and returns the resolved
 * {session, user} or null. The route layer uses the result as the
 * SINGLE source of truth for the operator id — never the body.
 *
 * Read-only: writes only the sliding-expiry timestamp on success.
 */

import type { NextRequest } from 'next/server';
import type { AuthContext } from './types';
import { SESSION_COOKIE_NAME } from './cookie';
import {
  createSessionMemoryStore, findLiveSession, touchSession,
} from './sessionMemory';
import { createUserMemoryStore, findUserById } from './userMemory';

/** Parse the cookie payload `<sessionId>.<rawToken>`. */
function parseSessionCookie(cookieValue: string | undefined): { sessionId: string; rawToken: string } | null {
  if (!cookieValue) return null;
  const dot = cookieValue.indexOf('.');
  if (dot <= 0 || dot === cookieValue.length - 1) return null;
  const sessionId = cookieValue.slice(0, dot);
  const rawToken = cookieValue.slice(dot + 1);
  if (!sessionId || !rawToken) return null;
  return { sessionId, rawToken };
}

export function buildSessionCookieValue(sessionId: string, rawToken: string): string {
  return `${sessionId}.${rawToken}`;
}

export async function resolveSession(req: NextRequest): Promise<AuthContext | null> {
  const raw = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const parsed = parseSessionCookie(raw);
  if (!parsed) return null;

  const at = Date.now();
  const sessionStore = createSessionMemoryStore();
  const sessionState = await sessionStore.read();
  const live = findLiveSession(sessionState, parsed.sessionId, parsed.rawToken, at);
  if (!live) return null;

  const userStore = createUserMemoryStore();
  const userState = await userStore.read();
  const user = findUserById(userState, live.userId);
  if (!user) return null;
  if (user.disabledAt) return null;

  // Sliding-expiry · cheap when no extension is due.
  const elapsed = at - live.lastSeenAt;
  if (elapsed > 0) {
    const next = touchSession(sessionState, live.sessionId, at);
    await sessionStore.save(next);
  }

  return { session: live, user };
}
