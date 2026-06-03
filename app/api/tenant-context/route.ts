/**
 * /api/tenant-context · pure resolver (read-only).
 *
 * GET ?operatorId=…&organizationId=…[&workspaceId=…]
 *     Returns the resolved TenantContext for the operator/org pair.
 *
 * The resolver NEVER auto-grants roles, NEVER fabricates memberships,
 * NEVER reaches into another organization. The route is read-only.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { createOrganizationMemoryStore } from '@lib/tenancy/organizationMemory';
import {
  listOperatorOrganizations, resolveTenantContext,
} from '@lib/tenancy/tenantContext';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory platform-owner registry shared with /api/organization.
const g = globalThis as unknown as { __moodPlatformOwners?: Set<string> };
function platformOwners(): string[] {
  if (!g.__moodPlatformOwners) {
    const seed = (process.env.MOOD_PLATFORM_OWNERS ?? '')
      .split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    g.__moodPlatformOwners = new Set(seed);
  }
  return [...g.__moodPlatformOwners];
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const _url0 = new URL(req.url);
  const _orgId0 = _url0.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const _wspId0 = _url0.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, _orgId0, _wspId0);
  if (!tenantAuth.ok) return tenantAuth.response;

  const url = new URL(req.url);
  const operatorId = url.searchParams.get('operatorId') ?? '';
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId = url.searchParams.get('workspaceId');

  if (!operatorId) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }

  const mem = await createOrganizationMemoryStore().read().catch(() => null);
  const organizations = mem?.organizations ?? [];
  const workspaces = mem?.workspaces ?? [];
  const memberships = mem?.memberships ?? [];
  const owners = platformOwners();
  const nowMs = Date.now();

  const context = resolveTenantContext({
    operatorId,
    targetOrganizationId: organizationId,
    targetWorkspaceId: workspaceId ?? null,
    platformOwnerOperatorIds: owners,
    organizations, workspaces, memberships, nowMs,
  });

  const operatorOrganizations = listOperatorOrganizations(
    operatorId, organizations, memberships, owners,
  );

  return NextResponse.json({
    context,
    operatorOrganizations,
    advisoryNotice:
      'Tenant context · pure resolver. The route NEVER auto-grants roles, ' +
      'NEVER fabricates memberships, NEVER reaches into another organization. ' +
      'Human remains final authority.',
  });
}
