/**
 * GET /api/creative-dna-map
 *
 * Pure DNA aggregator over performance + publication + asset data.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route never names a winner
 *   - the route never recommends
 *   - the route never auto-applies
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { buildCreativeDNAMap } from '@lib/creativeDNAMap';
import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const [perfMem, pubMem, assetMem] = await Promise.all([
    createPerformanceMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
  ]);
  const reading = buildCreativeDNAMap({
    performances: perfMem?.performances ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
  });
  return NextResponse.json(reading);
}
