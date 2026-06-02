/**
 * POST /api/auth/register
 *
 * Public · self-service registration. Body:
 *   { email, displayName, password, operatorReason }
 *
 * Idempotent on email · returns 409 if duplicate. On success
 * creates a session, sets the cookie, returns the safe user shape.
 *
 * The route NEVER auto-grants a membership in any organization.
 * Platform-owner grants memberships via /api/organization.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  appendUser, createUserMemoryStore, findUserByEmail, newUserId,
  normalizeEmail,
} from '@lib/auth/userMemory';
import {
  appendSession, createSessionMemoryStore, newSessionId, newSessionToken,
} from '@lib/auth/sessionMemory';
import { hashPassword } from '@lib/auth/passwordHash';
import { SESSION_COOKIE_NAME, sessionCookieFlags } from '@lib/auth/cookie';
import { buildSessionCookieValue } from '@lib/auth/resolveSession';
import { toSafeUser, type UserRecord } from '@lib/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RegisterBody {
  email: string;
  displayName: string;
  password: string;
  operatorReason: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RegisterBody;
  try { body = await req.json() as RegisterBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email.trim())) {
    return NextResponse.json({ error: 'valid email is required' }, { status: 400 });
  }
  if (typeof body.displayName !== 'string' || body.displayName.trim().length === 0) {
    return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
  }
  if (typeof body.password !== 'string' || body.password.length < 12) {
    return NextResponse.json({ error: 'password must be at least 12 characters' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const at = Date.now();

  const userStore = createUserMemoryStore();
  const userState = await userStore.read();
  if (findUserByEmail(userState, email)) {
    return NextResponse.json({ error: 'email already in use' }, { status: 409 });
  }

  const { passwordHash, passwordSalt } = hashPassword(body.password);
  const userId = newUserId();
  const record: UserRecord = {
    userId, email, displayName: body.displayName.trim(),
    passwordHash, passwordSalt,
    createdBy: userId, createdAt: at,
    failedLoginCount: 0, lockedUntil: 0,
  };
  await userStore.save(appendUser(userState, record));

  // Issue session.
  const sessionStore = createSessionMemoryStore();
  const sessionState = await sessionStore.read();
  const sessionId = newSessionId();
  const rawToken = newSessionToken();
  await sessionStore.save(appendSession(sessionState, {
    sessionId, userId, rawToken, at,
    contextHint: req.headers.get('x-mood-context-hint') ?? undefined,
  }));

  const res = NextResponse.json({
    ok: true,
    user: toSafeUser(record),
    sessionId,
    advisoryNotice:
      'Operator-supervised — user registered. The route NEVER grants a ' +
      'membership in any organization. Human remains final authority.',
  });
  res.cookies.set(SESSION_COOKIE_NAME, buildSessionCookieValue(sessionId, rawToken), sessionCookieFlags());
  return res;
}
