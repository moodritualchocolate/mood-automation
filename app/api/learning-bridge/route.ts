/**
 * GET /api/learning-bridge
 *
 * Pure bridge that composes performance + creative DNA + supervised
 * learning + story architect + asset composer into learning signals.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route never auto-modifies upstream systems
 *   - the route never auto-applies any signal
 *   - learning only · operator review required
 */

import { NextResponse } from 'next/server';
import { composeLearningSignalBridge } from '@lib/learningSignalBridge';
import { analyzePerformance } from '@lib/performanceAnalyzer';
import { buildCreativeDNAMap } from '@lib/creativeDNAMap';

import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { createTrialOutcomeMemoryStore } from '@lib/trialOutcomeMemory';
import { createPatternReliabilityMemoryStore } from '@lib/patternReliabilityMemory';
import { computeSupervisedLearning } from '@lib/supervisedLearningLoop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [perfMem, pubMem, assetMem, trialMem, outcomeMem, patternMem] = await Promise.all([
    createPerformanceMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
    createOperatorTrialMemoryStore().read().catch(() => null),
    createTrialOutcomeMemoryStore().read().catch(() => null),
    createPatternReliabilityMemoryStore().read().catch(() => null),
  ]);

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
    .slice(0, 5)
    .map((m) => m.mutationType);
  const contradictedMutations = supervised.mutationReliability
    .filter((m) => m.contradictedCount > m.alignedCount && m.evidenceCount >= 2)
    .slice(0, 5)
    .map((m) => m.mutationType);

  const reading = composeLearningSignalBridge({
    performance,
    creativeDNA,
    supervised: { alignedMutations, contradictedMutations },
  });

  return NextResponse.json({
    bridge: reading,
    performance,
    creativeDNA,
    advisoryNotice:
      'Learning signal bridge composed performance + creative DNA + supervised learning. ' +
      'The route never auto-modifies any upstream system. ' +
      'Operator review required. Human remains final authority.',
  });
}
