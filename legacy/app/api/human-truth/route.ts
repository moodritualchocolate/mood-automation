/**
 * GET /api/human-truth
 *
 * Read-only observatory composing all human-truth analyzers. Never
 * auto-applies, never optimizes against the signals, never amplifies
 * manipulation patterns. The endpoint surfaces signals so the
 * operator can preserve humanity.
 */

import { NextResponse } from 'next/server';
import {
  computeHumanTruth,
  type HumanTruthInput,
  type OutcomeSubset,
  type VisualDNASubset,
  type NarrativeDNASubset,
  type DriftSubset,
  type CopywriterSubset,
  type AdStrategySubset,
} from '@lib/humanTruthIntelligence';
import { computeManipulationPressure } from '@lib/manipulationPressureAnalyzer';
import { computeAuthenticityContinuity } from '@lib/authenticityContinuity';
import { computeSoulPreservation } from '@lib/soulPreservationLayer';
import { computeAntiOptimization } from '@lib/antiOptimizationDetector';
import { computeEmotionalDignity } from '@lib/emotionalDignityModel';

import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [outcomeMem, visualMem, narrativeMem, driftMem, copywriterMem, strategyMem] = await Promise.all([
    createOutcomeMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
    createCopywriterMemoryStore().read().catch(() => null),
    createAdStrategyMemoryStore().read().catch(() => null),
  ]);

  const input: HumanTruthInput = {
    outcomes:    outcomeMem    as OutcomeSubset | null,
    visualDNA:   visualMem     as VisualDNASubset | null,
    narrativeDNA: narrativeMem as NarrativeDNASubset | null,
    drift:       driftMem      as DriftSubset | null,
    copywriter:  copywriterMem as unknown as CopywriterSubset | null,
    strategy:    strategyMem   as unknown as AdStrategySubset | null,
  };

  const authenticity = computeHumanTruth(input);
  const manipulationPressure = computeManipulationPressure(input);
  const humanContinuity = computeAuthenticityContinuity(input);
  const soulPreservation = computeSoulPreservation(input);
  const antiOptimization = computeAntiOptimization(input);
  const dignity = computeEmotionalDignity(input);

  return NextResponse.json({
    authenticity,
    manipulationPressure,
    humanContinuity,
    soulPreservation,
    antiOptimizationSignals: antiOptimization,
    dignitySignals: dignity,
    realismIntegrity: authenticity.signals.realism,
    emotionalHonesty: dignity.signals.emotionalHonesty,
    trustVsPerformance: {
      gap: dignity.trustVsPerformanceGap,
      highPerformingThreat: dignity.highPerformingDignityThreat,
      performanceWithoutTrustCount: antiOptimization.performanceWithoutTrustCount,
    },
    advisoryNotice:
      'Observatory only — human-truth intelligence is HUMAN-PROTECTIVE. ' +
      'The system never optimizes against any of these signals; the operator ' +
      'interprets them in service of preserving humanity.',
    reasonCodes: [
      ...authenticity.reasonCodes.slice(0, 5),
      ...manipulationPressure.reasonCodes.slice(0, 3),
      ...humanContinuity.reasonCodes.slice(0, 3),
      ...soulPreservation.reasonCodes.slice(0, 3),
      ...antiOptimization.reasonCodes.slice(0, 3),
      ...dignity.reasonCodes.slice(0, 3),
    ],
  });
}
