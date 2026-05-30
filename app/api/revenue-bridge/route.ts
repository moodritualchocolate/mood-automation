/**
 * GET /api/revenue-bridge
 *
 * Pure revenue learning bridge. Connects revenue events → attribution
 * → performance → learning → story architect → campaign planner.
 * Read-only.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route never auto-modifies any upstream system
 *   - the route never auto-applies any signal
 *   - the route never fetches from analytics / ad-platform APIs
 */

import { NextResponse } from 'next/server';
import { composeRevenueLearningBridge } from '@lib/revenueLearningBridge';
import { analyzeCustomerJourneys } from '@lib/customerJourneyEngine';
import { analyzeAttribution } from '@lib/attributionEngine';
import { analyzePerformance } from '@lib/performanceAnalyzer';
import { composeLearningSignalBridge } from '@lib/learningSignalBridge';
import { buildCreativeDNAMap } from '@lib/creativeDNAMap';
import { computeSupervisedLearning } from '@lib/supervisedLearningLoop';

import { createCustomerJourneyMemoryStore } from '@lib/customerJourneyMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createCampaignPlanMemoryStore } from '@lib/campaignPlanMemory';
import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { createTrialOutcomeMemoryStore } from '@lib/trialOutcomeMemory';
import { createPatternReliabilityMemoryStore } from '@lib/patternReliabilityMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [journeyMem, pubMem, assetMem, planMem, perfMem,
         trialMem, outcomeMem, patternMem] = await Promise.all([
    createCustomerJourneyMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
    createCampaignPlanMemoryStore().read().catch(() => null),
    createPerformanceMemoryStore().read().catch(() => null),
    createOperatorTrialMemoryStore().read().catch(() => null),
    createTrialOutcomeMemoryStore().read().catch(() => null),
    createPatternReliabilityMemoryStore().read().catch(() => null),
  ]);
  const events = journeyMem?.events ?? [];
  const journey = analyzeCustomerJourneys({ events });
  const attribution = analyzeAttribution({
    events,
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
    campaignPlans: planMem?.plans ?? [],
  });
  const performance = analyzePerformance({
    performances: perfMem?.performances ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
  });
  const creativeDNA = buildCreativeDNAMap({
    performances: perfMem?.performances ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
  });
  const supervised = computeSupervisedLearning({
    trials: trialMem?.trials ?? [],
    outcomes: outcomeMem?.outcomes ?? [],
    priorPatterns: patternMem?.patterns ?? [],
  });
  const alignedMutations = supervised.mutationReliability
    .filter((m) => m.alignedCount > m.contradictedCount && m.evidenceCount >= 2)
    .slice(0, 5).map((m) => m.mutationType);
  const contradictedMutations = supervised.mutationReliability
    .filter((m) => m.contradictedCount > m.alignedCount && m.evidenceCount >= 2)
    .slice(0, 5).map((m) => m.mutationType);
  const learningBridge = composeLearningSignalBridge({
    performance,
    creativeDNA,
    supervised: { alignedMutations, contradictedMutations },
  });
  const revenueBridge = composeRevenueLearningBridge({
    journey,
    attribution,
    performance,
    learningBridge,
  });
  return NextResponse.json({
    revenueBridge,
    journey,
    attribution,
    performance,
    learningBridge,
    advisoryNotice:
      'Revenue learning bridge · composed observation only. The route never ' +
      'auto-modifies any upstream system. Human remains final authority.',
  });
}
