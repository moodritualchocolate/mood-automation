/**
 * REQUIRE SESSION (route-layer guard)
 *
 * Wraps `resolveSession` for protected writes. Returns either:
 *   - { ok: true, ctx: AuthContext } when a live session is present
 *   - { ok: false, response: NextResponse(401) } otherwise
 *
 * The route layer overrides any body-supplied `operatorId` with
 * `ctx.user.userId`. The body's `operatorId` is no longer trusted.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { resolveSession } from './resolveSession';
import type { AuthContext } from './types';

export interface RequireSessionOk { ok: true; ctx: AuthContext; }
export interface RequireSessionFail { ok: false; response: NextResponse; }

export async function requireSession(
  req: NextRequest,
): Promise<RequireSessionOk | RequireSessionFail> {
  const ctx = await resolveSession(req);
  if (!ctx) {
    return {
      ok: false,
      response: NextResponse.json({
        error: 'authentication required',
        advisoryNotice:
          'Protected write · session required. Operator approval required. ' +
          'Human remains final authority.',
      }, { status: 401 }),
    };
  }
  return { ok: true, ctx };
}
