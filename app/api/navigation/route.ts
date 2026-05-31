/**
 * /api/navigation · operator-facing navigation descriptor.
 *
 * GET ?operatorId=…&organizationId=…[&workspaceId=…]
 *     Returns the navigation tree + mobile bottom-nav slice for the
 *     resolved operator roles. Read-only.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createOrganizationMemoryStore } from '@lib/tenancy/organizationMemory';
import { PLATFORM_TENANT_ID_MOOD } from '@lib/tenancy/types';
import { resolveTenantContext } from '@lib/tenancy/tenantContext';
import { buildNavigation, actionPermissionStatusForSection } from '@lib/productization/navigation';
import { describeMobileExperience } from '@lib/productization/mobileExperience';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const url = new URL(req.url);
  const operatorId = url.searchParams.get('operatorId') ?? '';
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId = url.searchParams.get('workspaceId');
  if (!operatorId) return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });

  const mem = await createOrganizationMemoryStore().read().catch(() => null);
  const context = resolveTenantContext({
    operatorId, targetOrganizationId: organizationId,
    targetWorkspaceId: workspaceId ?? null,
    platformOwnerOperatorIds: platformOwners(),
    organizations: mem?.organizations ?? [],
    workspaces: mem?.workspaces ?? [],
    memberships: mem?.memberships ?? [],
    nowMs: Date.now(),
  });
  const roles = [...context.platformRoles, ...context.organizationRoles];
  const nav = buildNavigation({ operatorRoles: roles });
  const mobile = describeMobileExperience(nav.mobileBottomNav);
  const annotatedVisibleSections = nav.visibleSections.map((s) => ({
    ...s, actions: actionPermissionStatusForSection(s, roles),
  }));
  return NextResponse.json({
    context,
    navigation: { ...nav, visibleSections: annotatedVisibleSections },
    mobileExperience: mobile,
    advisoryNotice:
      'Navigation descriptor — read-only. The route never auto-routes the operator. ' +
      'Operator approval required at every section action. Human remains final authority.',
  });
}
