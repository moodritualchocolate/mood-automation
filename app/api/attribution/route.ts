/**
 * GET /api/attribution
 *
 * Pure attribution analyzer over journey + publication + asset +
 * campaign-plan data. Read-only.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route never names a winner
 *   - the route never auto-applies
 *   - the route never fetches from analytics / ad-platform APIs
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { analyzeAttribution } from '@lib/attributionEngine';
import { createCustomerJourneyMemoryStore } from '@lib/customerJourneyMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createCampaignPlanMemoryStore } from '@lib/campaignPlanMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const [journeyMem, pubMem, assetMem, planMem] = await Promise.all([
    createCustomerJourneyMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
    createCampaignPlanMemoryStore().read().catch(() => null),
  ]);
  const reading = analyzeAttribution({
    events: journeyMem?.events ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
    campaignPlans: planMem?.plans ?? [],
  });
  return NextResponse.json(reading);
}
