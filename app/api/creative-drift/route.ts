/**
 * GET /api/creative-drift
 *
 * Read-only observatory. Computes a current CreativeDrift snapshot
 * from existing memory stores, builds the longitudinal view from
 * creative-drift memory, and returns both. The endpoint NEVER mutates
 * any other memory. The route does not run generation.
 *
 * Returns:
 *   {
 *     current: CreativeDrift,
 *     longitudinal: CreativeDriftLongitudinalView,
 *   }
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';

import {
  computeCreativeDrift,
  type CopywriterMemorySubset,
  type CopyQualityMemorySubset,
  type IdentityContinuityMemorySubset,
  type CampaignLifecycleMemorySubset,
  type StrategicOutcomeMemorySubset,
  type AdStrategyMemorySubset,
  type PolicyAuditMemorySubset,
} from '@lib/creativeDriftEngine';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { buildCreativeDriftLongitudinalView } from '@lib/creativeDriftLongitudinalView';

import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createCopyQualityMemoryStore } from '@lib/copyQualityMemory';
import { createIdentityContinuityMemoryStore } from '@lib/identityContinuityMemory';
import { createCampaignLifecycleMemoryStore } from '@lib/campaignLifecycleMemory';
import { createStrategicOutcomeMemoryStore } from '@lib/strategicOutcomeMemory';
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const [
    copywriter, copyQuality, identity, campaign, outcomes, strategy, policy, driftMem,
  ] = await Promise.all([
    createCopywriterMemoryStore().read().catch(() => null),
    createCopyQualityMemoryStore().read().catch(() => null),
    createIdentityContinuityMemoryStore().read().catch(() => null),
    createCampaignLifecycleMemoryStore().read().catch(() => null),
    createStrategicOutcomeMemoryStore().read().catch(() => null),
    createAdStrategyMemoryStore().read().catch(() => null),
    createPolicyAuditStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
  ]);

  // Each subset is a STRUCTURAL minimum that the engine reads
  // defensively. The real memory types include richer fields than
  // the subsets declare; TypeScript accepts the wider types because
  // the subsets use HistoryItem = string | record and tolerant
  // optional fields throughout.
  const current = computeCreativeDrift({
    copywriter:  copywriter as CopywriterMemorySubset | null,
    copyQuality: copyQuality as CopyQualityMemorySubset | null,
    identity:    identity as IdentityContinuityMemorySubset | null,
    campaign:    campaign as CampaignLifecycleMemorySubset | null,
    outcomes:    outcomes as StrategicOutcomeMemorySubset | null,
    strategy:    strategy as AdStrategyMemorySubset | null,
    policy:      policy as PolicyAuditMemorySubset | null,
  });

  const longitudinal = buildCreativeDriftLongitudinalView({ memory: driftMem });

  return NextResponse.json({ current, longitudinal });
}
