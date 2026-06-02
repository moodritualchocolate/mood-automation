/**
 * POST /api/auth/logout
 *
 * Revokes the matching session record (idempotent — already-revoked
 * or missing returns 200). Clears the cookie.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSessionMemoryStore, revokeSession } from '@lib/auth/sessionMemory';
import { SESSION_COOKIE_NAME, clearedCookieFlags } from '@lib/auth/cookie';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const raw = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const dot = raw ? raw.indexOf('.') : -1;
  const sessionId = raw && dot > 0 ? raw.slice(0, dot) : null;

  if (sessionId) {
    try {
      const store = createSessionMemoryStore();
      const state = await store.read();
      if (state.sessions.some((s) => s.sessionId === sessionId)) {
        await store.save(revokeSession(state, sessionId, Date.now(), 'logout'));
      }
    } catch {
      // idempotent — never block logout on a store glitch
    }
  }

  const res = NextResponse.json({
    ok: true,
    advisoryNotice: 'Operator-supervised — session revoked. Cookie cleared.',
  });
  res.cookies.set(SESSION_COOKIE_NAME, '', clearedCookieFlags());
  return res;
}
