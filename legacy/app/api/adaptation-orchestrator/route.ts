/**
 * GET /api/adaptation-orchestrator
 *
 * Read-only. Composes orchestrator + energy model + cadence engine
 * from the existing read-only memory + analyzer endpoints' data.
 *
 * Returns:
 *   {
 *     orchestration: AdaptationOrchestration,
 *     energy: SystemEnergyModel,
 *     cadence: AdaptiveCadence,
 *   }
 *
 * The endpoint never runs generation, never mutates memory, never
 * applies any adaptation strategy.
 */

import { NextResponse } from 'next/server';

import { computeAdaptationOrchestration } from '@lib/adaptationOrchestrator';
import { computeSystemEnergyModel } from '@lib/systemEnergyModel';
import { computeAdaptiveCadence } from '@lib/adaptiveCadenceEngine';
import { computeCreativeFatigue } from '@lib/creativeFatigueEngine';

import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [dmem, vmem, nmem, strategy, copywriter] = await Promise.all([
    createCreativeDriftMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createAdStrategyMemoryStore().read().catch(() => null),
    createCopywriterMemoryStore().read().catch(() => null),
  ]);

  const lastDrift = dmem?.observations[dmem.observations.length - 1] ?? null;

  // Compute fatigue locally so the orchestrator sees the freshest reading.
  const fatigue = computeCreativeFatigue({
    visualDNA:    vmem ? { fingerprints: vmem.fingerprints } : null,
    narrativeDNA: nmem ? { fingerprints: nmem.fingerprints } : null,
    driftEntropy:             lastDrift?.entropyLevel,
    driftOriginalityPressure: lastDrift?.originalityPressure,
  });
  const visualVector = fatigue.fatigueVectors.find((v) => v.vector === 'visual');

  // Headline scalars used across all three engines.
  const trustDebt = strategy?.trustDebt ?? (lastDrift
    ? Math.min(10, Math.max(0, 5 + lastDrift.trustErosionDrift))
    : 0);
  const identityErosion = lastDrift ? Math.max(0, 10 - lastDrift.narrativeStability) : 0;
  // Use copywriter dignity erosion when available.
  const dignityErosion = copywriter?.dignityErosionScore ?? 0;

  const orchestration = computeAdaptationOrchestration({
    trustDebt,
    originalityPressure:  lastDrift?.originalityPressure,
    fatigueLevel:         fatigue.fatigueLevel,
    identityErosion,
    dignityErosion,
    visualConvergence:    visualVector?.fatigue ?? 0,
    emotionalFlattening:  lastDrift ? Math.max(0, 10 - lastDrift.emotionalDiversity) : 0,
    persuasionCollapse:   lastDrift ? Math.max(0, 10 - lastDrift.persuasionVariance) : 0,
    narrativeInstability: lastDrift ? Math.max(0, 10 - lastDrift.narrativeStability) : 0,
    campaignDrift:        lastDrift?.driftSeverity,
    longitudinalHealth:   lastDrift?.overallCreativeHealth ?? 7,
    entropy:              lastDrift?.entropyLevel,
    collapseRisk:         fatigue.collapseRisk,
    freshnessScore:       fatigue.freshnessScore,
  });

  const energy = computeSystemEnergyModel({
    // We do not currently persist a "mutations applied" counter; the
    // operator-driven counter would be wired here when available.
    // For now, fatigue-pressure x recent observations is our best proxy.
    recentMutationCount: 0,
    recentStabilizationEvents: dmem?.recoveryEvents.length ?? 0,
    collapseEvents: dmem?.collapseEvents.length ?? 0,
    recoveryEvents: dmem?.recoveryEvents.length ?? 0,
    fatigueLevel: fatigue.fatigueLevel,
    trustDebt,
    originalityPressure: lastDrift?.originalityPressure,
    entropy: lastDrift?.entropyLevel,
    mutationsPerWindow: 0,
    windowSize: dmem?.observations.length ?? 0,
  });

  // Fatigue trajectory delta: compare halves of the visual saturation history.
  const fingerprintsSlice = (vmem?.fingerprints ?? []).slice(-12);
  const fatigueTrajectoryDelta = fingerprintsSlice.length < 4 ? 0 : (() => {
    // Use simple diversity-collapse proxy on framing fingerprints.
    const half = Math.floor(fingerprintsSlice.length / 2);
    const earlyDistinct = new Set(fingerprintsSlice.slice(0, half).map((f) => f.framingFingerprint)).size;
    const lateDistinct  = new Set(fingerprintsSlice.slice(half).map((f) => f.framingFingerprint)).size;
    // Lower late-half diversity = positive trajectory delta (worsening).
    return earlyDistinct - lateDistinct;
  })();

  const cadence = computeAdaptiveCadence({
    recentMutationCount: 0,                    // no persisted counter yet
    windowSize: 10,
    visualFatigue: visualVector?.fatigue ?? 0,
    fatigueTrajectoryDelta,
    collapseDetected: (lastDrift?.overallCreativeHealth ?? 10) < 4,
    trustDebt,
    identityErosion,
    availableBandwidth: energy.availableBandwidth,
    overloadRisk: energy.overloadRisk,
  });

  return NextResponse.json({ orchestration, energy, cadence });
}
