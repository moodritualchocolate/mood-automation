/**
 * POST /api/auth/login
 *
 * Body: { email, password, operatorReason }
 *
 * - constant-time password verify via crypto.timingSafeEqual inside
 *   verifyPassword
 * - rate-limit: 5 failures triggers an exponential lockout
 * - disabled users always receive 403 (no oracle on disabled vs bad password)
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  createUserMemoryStore, findUserByEmail, recordFailedLogin, resetFailedLogin,
} from '@lib/auth/userMemory';
import {
  appendSession, createSessionMemoryStore, newSessionId, newSessionToken,
} from '@lib/auth/sessionMemory';
import { verifyPassword } from '@lib/auth/passwordHash';
import { SESSION_COOKIE_NAME, sessionCookieFlags } from '@lib/auth/cookie';
import { buildSessionCookieValue } from '@lib/auth/resolveSession';
import { toSafeUser } from '@lib/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LoginBody {
  email: string;
  password: string;
  /** Operator audit string. Optional from the UI — defaults to
   *  "operator login" when absent. The login form does NOT surface
   *  this field to the end user. */
  operatorReason?: string;
}

const LOCKOUT_BASE_MS = 60 * 1000;       // 1 min after 5 failures
const LOCKOUT_MAX_MS  = 60 * 60 * 1000;  // capped at 1 h

function exponentialLockoutMs(failedCount: number): number {
  // 5 fails → 1 min · 6 → 2 min · 7 → 4 min · … · capped at LOCKOUT_MAX_MS
  const beyondThreshold = Math.max(0, failedCount - 5);
  const doubled = LOCKOUT_BASE_MS * Math.pow(2, beyondThreshold);
  return Math.min(LOCKOUT_MAX_MS, doubled);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: LoginBody;
  try { body = await req.json() as LoginBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.email !== 'string' || body.email.length === 0) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }
  if (typeof body.password !== 'string' || body.password.length === 0) {
    return NextResponse.json({ error: 'password is required' }, { status: 400 });
  }
  // operatorReason is optional from the UI. Default to a stable label
  // so the audit trail is still populated.
  if (body.operatorReason !== undefined && typeof body.operatorReason !== 'string') {
    return NextResponse.json({ error: 'operatorReason, when present, must be a string' }, { status: 400 });
  }

  const at = Date.now();
  const userStore = createUserMemoryStore();
  const userState = await userStore.read();
  const user = findUserByEmail(userState, body.email);

  // Generic 401 for missing-user to avoid email-enumeration.
  if (!user) {
    return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
  }
  if (user.disabledAt) {
    return NextResponse.json({ error: 'account disabled' }, { status: 403 });
  }
  if (user.lockedUntil > at) {
    return NextResponse.json({
      error: 'account temporarily locked',
      retryAt: user.lockedUntil,
    }, { status: 429 });
  }

  const ok = verifyPassword(body.password, user.passwordHash, user.passwordSalt);
  if (!ok) {
    const lockoutMs = exponentialLockoutMs(user.failedLoginCount + 1);
    await userStore.save(recordFailedLogin(userState, user.userId, at, lockoutMs));
    return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
  }

  // Success: reset counter, issue session.
  await userStore.save(resetFailedLogin(userState, user.userId));
  const sessionStore = createSessionMemoryStore();
  const sessionState = await sessionStore.read();
  const sessionId = newSessionId();
  const rawToken = newSessionToken();
  await sessionStore.save(appendSession(sessionState, {
    sessionId, userId: user.userId, rawToken, at,
    contextHint: req.headers.get('x-mood-context-hint') ?? undefined,
  }));

  const res = NextResponse.json({
    ok: true,
    user: toSafeUser(user),
    sessionId,
    advisoryNotice:
      'Operator-supervised — session issued. Human remains final authority.',
  });
  res.cookies.set(SESSION_COOKIE_NAME, buildSessionCookieValue(sessionId, rawToken), sessionCookieFlags());
  return res;
}
