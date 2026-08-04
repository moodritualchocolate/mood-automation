/**
 * GET /api/creative-fatigue
 *
 * Read-only. Composes the creative-fatigue reading from visual + narrative
 * DNA memories + creative-drift snapshot (optional).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { computeCreativeFatigue } from '@lib/creativeFatigueEngine';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const [vmem, nmem, dmem] = await Promise.all([
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
  ]);
  const lastDrift = dmem?.observations[dmem.observations.length - 1];
  const fatigue = computeCreativeFatigue({
    visualDNA:    vmem ? { fingerprints: vmem.fingerprints } : null,
    narrativeDNA: nmem ? { fingerprints: nmem.fingerprints } : null,
    driftEntropy:             lastDrift?.entropyLevel,
    driftOriginalityPressure: lastDrift?.originalityPressure,
  });
  return NextResponse.json(fatigue);
}
