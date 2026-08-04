/**
 * /api/entity-page · entity page descriptor.
 *
 * GET ?operatorId=…&organizationId=…[&workspaceId=…]&entityKind=…
 *     Returns the static panel/action descriptor for an entity kind,
 *     annotated with whether the resolved operator may perform each
 *     primary action. Read-only.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createOrganizationMemoryStore } from '@lib/tenancy/organizationMemory';
import { PLATFORM_TENANT_ID_MOOD } from '@lib/tenancy/types';
import { resolveTenantContext } from '@lib/tenancy/tenantContext';
import {
  describeEntityPage, listEntityPageDescriptors,
} from '@lib/productization/entityPageDescriptor';
import type { EntityKind } from '@lib/productization/navigation';

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

const VALID_KINDS: ReadonlySet<EntityKind> = new Set([
  'organization', 'workspace', 'brand', 'product', 'campaign',
  'asset', 'publication', 'performance', 'agent-run', 'task',
  'knowledge-entry', 'membership',
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const operatorId = url.searchParams.get('operatorId') ?? '';
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId = url.searchParams.get('workspaceId');
  const entityKind = url.searchParams.get('entityKind') as EntityKind | null;

  if (!operatorId) return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  if (!entityKind) {
    // Return the full catalog of entity-page descriptors (still annotated
    // by the operator's roles).
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
    const descriptors = listEntityPageDescriptors().map((d) => describeEntityPage(d.entityKind, roles));
    return NextResponse.json({
      context, descriptors,
      advisoryNotice:
        'Entity page descriptors · read-only. The route never auto-routes the operator. ' +
        'Human remains final authority.',
    });
  }
  if (!VALID_KINDS.has(entityKind)) {
    return NextResponse.json({ error: 'unknown entityKind' }, { status: 400 });
  }
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
  const reading = describeEntityPage(entityKind, roles);
  return NextResponse.json({
    context, reading,
    advisoryNotice:
      'Entity page descriptor · read-only. The route never auto-acts on a primary ' +
      'action. Human remains final authority.',
  });
}
