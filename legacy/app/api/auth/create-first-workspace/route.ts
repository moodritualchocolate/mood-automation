/**
 * POST /api/auth/create-first-workspace
 *
 * Self-service "first workspace" onboarding for newly registered
 * users. The route deliberately exists alongside `/api/organization`
 * (which is platform-owner-only) so that an anonymous self-signup
 * has a clear, narrow path to create their tenant.
 *
 * Strict contract:
 *   - requires a session (registered user)
 *   - REFUSES if the user already has any non-revoked membership
 *     (single-shot · never grants a second tenant via this route)
 *   - creates org + workspace + organization-owner membership
 *     stamped for the calling user
 *   - never charges, never calls billing, never sends email
 *
 * Body:
 *   {
 *     organizationName: string,
 *     workspaceName?: string,        // defaults to "Default Workspace"
 *     organizationSlug?: string,     // generated from name if absent
 *     operatorReason?: string,       // optional · defaults to "first-workspace onboarding"
 *   }
 *
 * Response (200):
 *   { ok: true, organizationId, workspaceId, membershipId, advisoryNotice }
 *
 * Response (409): user already has a membership
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import {
  appendMembership, appendOrganization, appendWorkspace,
  createOrganizationMemoryStore, newMembershipId, newOrganizationId, newWorkspaceId,
} from '@lib/tenancy/organizationMemory';
import type {
  OrganizationRecord, WorkspaceRecord, MembershipRecord,
} from '@lib/tenancy/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  organizationName: string;
  workspaceName?: string;
  organizationSlug?: string;
  operatorReason?: string;
}

const SLUG_RE = /^[a-z0-9-]+$/;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'workspace';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;

  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.organizationName !== 'string' || body.organizationName.trim().length === 0) {
    return NextResponse.json({ error: 'organizationName is required' }, { status: 400 });
  }
  const orgName = body.organizationName.trim();
  const wspName = (body.workspaceName ?? 'Default Workspace').trim() || 'Default Workspace';
  const orgSlug = (body.organizationSlug && SLUG_RE.test(body.organizationSlug))
    ? body.organizationSlug
    : slugify(orgName);
  const operatorReason = body.operatorReason ?? 'first-workspace onboarding';

  const store = createOrganizationMemoryStore();
  let state = await store.read();
  const userId = auth.ctx.user.userId;

  // Refuse if the user already belongs to ANY org.
  const existingMembership = state.memberships.find(
    (m) => m.memberId === userId && !m.revokedAt,
  );
  if (existingMembership) {
    return NextResponse.json({
      error: 'user already has a workspace · this onboarding route is single-shot',
      organizationId: existingMembership.organizationId,
    }, { status: 409 });
  }

  // Idempotent slug check inside the active org set.
  const slugTaken = state.organizations.some(
    (o) => o.slug === orgSlug && !o.archivedAt,
  );
  if (slugTaken) {
    return NextResponse.json({
      error: `organization slug "${orgSlug}" is already taken — pick another`,
    }, { status: 409 });
  }

  const at = Date.now();

  const organizationId = newOrganizationId();
  const workspaceId = newWorkspaceId();
  const membershipId = newMembershipId();

  const org: OrganizationRecord = {
    organizationId,
    name: orgName, slug: orgSlug,
    billingTier: 'unbilled',
    createdAt: at, createdBy: userId,
    operatorNote: `self-served by ${auth.ctx.user.email} via /api/auth/create-first-workspace`,
  };
  const wsp: WorkspaceRecord = {
    workspaceId, organizationId,
    name: wspName, slug: 'default',
    createdAt: at, createdBy: userId,
    operatorNote: `default workspace · created alongside ${organizationId}`,
  };
  const mem: MembershipRecord = {
    membershipId, organizationId,
    memberId: userId,
    displayName: auth.ctx.user.displayName,
    roles: ['organization-owner'],
    createdAt: at, grantedBy: userId,
    operatorNote: `self-served owner via ${operatorReason}`,
  };

  state = appendOrganization(state, org);
  state = appendWorkspace(state, wsp);
  state = appendMembership(state, mem);
  await store.save(state);

  return NextResponse.json({
    ok: true,
    organizationId, workspaceId, membershipId,
    advisoryNotice:
      'Operator-supervised — first workspace created. ' +
      'The route NEVER auto-creates a second workspace via this path. ' +
      'Human remains final authority.',
  });
}
