/**
 * GET /api/business-dashboard
 *
 * Pure descriptive business dashboard composer. Read-only.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - all metrics are descriptive only
 *   - never predicts
 *   - never recommends
 *   - never fetches from analytics / ad-platform APIs
 */

import { NextResponse } from 'next/server';
import { buildBusinessDashboard } from '@lib/businessDashboardEngine';
import { analyzeCustomerJourneys } from '@lib/customerJourneyEngine';
import { analyzeAttribution } from '@lib/attributionEngine';
import { analyzeProductIntelligence } from '@lib/productIntelligenceEngine';

import { createCustomerJourneyMemoryStore } from '@lib/customerJourneyMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createCampaignPlanMemoryStore } from '@lib/campaignPlanMemory';
import { createPerformanceMemoryStore } from '@lib/performanceMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [journeyMem, pubMem, assetMem, planMem, perfMem] = await Promise.all([
    createCustomerJourneyMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
    createCampaignPlanMemoryStore().read().catch(() => null),
    createPerformanceMemoryStore().read().catch(() => null),
  ]);
  const events = journeyMem?.events ?? [];
  const journey = analyzeCustomerJourneys({ events });
  const attribution = analyzeAttribution({
    events,
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
    campaignPlans: planMem?.plans ?? [],
  });
  const productIntelligence = analyzeProductIntelligence({ attribution, journey });
  const reading = buildBusinessDashboard({
    journey,
    attribution,
    productIntelligence,
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
    campaignPlans: planMem?.plans ?? [],
    performances: perfMem?.performances ?? [],
  });
  return NextResponse.json(reading);
}
