/**
 * REQUIRE TENANT SESSION (route-layer guard for tenant-scoped GETs)
 *
 * Combines `requireSession` with a membership check. The query
 * params `organizationId` + `workspaceId` are passed in by the
 * caller — they specify *what* the operator is trying to read. The
 * resolver then asks: does the session user have an active
 * membership in that tenant?
 *
 * Returns:
 *   - 401 when no live session
 *   - 403 when session exists but no membership in (org, wsp)
 *   - { ok: true, ctx, memberships, isPlatformOwner } otherwise
 *
 * Platform-owners (members of the MOOD_PLATFORM_OWNERS roster)
 * bypass the membership check; this matches the existing tenancy
 * layer's `enforceTenantBoundary` behaviour.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { resolveSession } from './resolveSession';
import { createOrganizationMemoryStore } from '@lib/tenancy/organizationMemory';
import type { AuthContext } from './types';
import type { MembershipRecord } from '@lib/tenancy/types';

const g = globalThis as unknown as { __moodPlatformOwners?: Set<string> };
function platformOwners(): Set<string> {
  if (!g.__moodPlatformOwners) {
    const seed = (process.env.MOOD_PLATFORM_OWNERS ?? '')
      .split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    g.__moodPlatformOwners = new Set(seed);
  }
  return g.__moodPlatformOwners;
}

export interface RequireTenantSessionOk {
  ok: true;
  ctx: AuthContext;
  isPlatformOwner: boolean;
  memberships: MembershipRecord[];
}
export interface RequireTenantSessionFail {
  ok: false;
  response: NextResponse;
}

export async function requireTenantSession(
  req: NextRequest,
  organizationId: string,
  workspaceId: string,
): Promise<RequireTenantSessionOk | RequireTenantSessionFail> {
  const ctx = await resolveSession(req);
  if (!ctx) {
    return {
      ok: false,
      response: NextResponse.json({
        error: 'authentication required',
        advisoryNotice:
          'Tenant-scoped read · session required. Operator approval required. ' +
          'Human remains final authority.',
      }, { status: 401 }),
    };
  }

  // Platform-owner bypass — global read access for platform admins.
  const isPlatformOwner = platformOwners().has(ctx.user.userId);

  const orgStore = createOrganizationMemoryStore();
  const orgState = await orgStore.read().catch(() => null);
  const orgMemberships = (orgState?.memberships ?? []).filter(
    (m) =>
      m.memberId === ctx.user.userId &&
      m.organizationId === organizationId &&
      !m.revokedAt,
  );
  // Workspace scope: a membership with no `workspaceIds` (or empty)
  // covers every workspace in the organization; otherwise the requested
  // workspaceId must be in the explicit allow-list.
  const validForWorkspace = orgMemberships.filter(
    (m) =>
      !m.workspaceIds ||
      m.workspaceIds.length === 0 ||
      m.workspaceIds.includes(workspaceId),
  );

  if (!isPlatformOwner && validForWorkspace.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({
        error: 'no membership in this tenant',
        advisoryNotice:
          'Tenant-scoped read · membership in (organizationId, workspaceId) ' +
          'required. Operator approval required. Human remains final authority.',
      }, { status: 403 }),
    };
  }

  return { ok: true, ctx, isPlatformOwner, memberships: validForWorkspace };
}
