/**
 * GET /api/product-intelligence
 *
 * Pure cross-formula / cross-audience / cross-angle analyzer.
 * Read-only.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route never recommends
 *   - the route never makes an automatic decision
 */

import { NextResponse } from 'next/server';
import { analyzeProductIntelligence } from '@lib/productIntelligenceEngine';
import { analyzeAttribution } from '@lib/attributionEngine';
import { analyzeCustomerJourneys } from '@lib/customerJourneyEngine';

import { createCustomerJourneyMemoryStore } from '@lib/customerJourneyMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createCampaignPlanMemoryStore } from '@lib/campaignPlanMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [journeyMem, pubMem, assetMem, planMem] = await Promise.all([
    createCustomerJourneyMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
    createCampaignPlanMemoryStore().read().catch(() => null),
  ]);
  const events = journeyMem?.events ?? [];
  const journey = analyzeCustomerJourneys({ events });
  const attribution = analyzeAttribution({
    events,
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
    campaignPlans: planMem?.plans ?? [],
  });
  const reading = analyzeProductIntelligence({ attribution, journey });
  return NextResponse.json(reading);
}
