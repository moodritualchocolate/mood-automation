/**
 * GET /api/auth/me
 *
 * Returns the resolved user + memberships, or 401 if no live session.
 * The route extends the sliding-expiry via resolveSession.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { resolveSession } from '@lib/auth/resolveSession';
import { createOrganizationMemoryStore } from '@lib/tenancy/organizationMemory';
import { toSafeUser } from '@lib/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ctx = await resolveSession(req);
  if (!ctx) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  // Resolve active memberships for the user (not revoked).
  const orgStore = createOrganizationMemoryStore();
  const orgState = await orgStore.read().catch(() => null);
  const memberships = (orgState?.memberships ?? []).filter(
    (m) => m.memberId === ctx.user.userId && !m.revokedAt,
  );
  return NextResponse.json({
    user: toSafeUser(ctx.user),
    sessionId: ctx.session.sessionId,
    sessionExpiresAt: ctx.session.expiresAt,
    memberships,
    advisoryNotice:
      'Auth context · read-only. The route NEVER auto-grants roles. ' +
      'Human remains final authority.',
  });
}
