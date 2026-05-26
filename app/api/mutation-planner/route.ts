/**
 * GET /api/mutation-planner
 *
 * Read-only. Composes a deterministic mutation plan from current
 * drift + fatigue signals. ADVISORY ONLY — the planner never applies
 * mutations.
 */
import { NextResponse } from 'next/server';
import { computeGenerationMutationPlan } from '@lib/generationMutationPlanner';
import { computeCreativeFatigue } from '@lib/creativeFatigueEngine';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [dmem, vmem, nmem] = await Promise.all([
    createCreativeDriftMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
  ]);
  const last = dmem?.observations[dmem.observations.length - 1] ?? null;
  const fatigue = computeCreativeFatigue({
    visualDNA:    vmem ? { fingerprints: vmem.fingerprints } : null,
    narrativeDNA: nmem ? { fingerprints: nmem.fingerprints } : null,
    driftEntropy:             last?.entropyLevel,
    driftOriginalityPressure: last?.originalityPressure,
  });
  // Saturation of the dominant visual token (for AI-convergence read).
  const visualVector = fatigue.fatigueVectors.find((v) => v.vector === 'visual');
  const plan = computeGenerationMutationPlan({
    entropy:              last?.entropyLevel,
    originalityPressure:  last?.originalityPressure,
    trustDebt:            last
      ? (last.trustErosionDrift > 0 ? Math.min(10, 5 + last.trustErosionDrift) : 5 + last.trustErosionDrift)
      : undefined,
    persuasionCollapse:   last ? Math.max(0, 10 - last.persuasionVariance) : undefined,
    emotionalFlattening:  last ? Math.max(0, 10 - last.emotionalDiversity) : undefined,
    repetitionCycles:     dmem?.repetitionCycles.length ?? 0,
    fatigueIndicators:    fatigue.fatigueLevel,
    visualConvergence:    visualVector?.fatigue ?? 0,
    campaignDrift:        last?.driftSeverity,
    narrativeInstability: last ? Math.max(0, 10 - last.narrativeStability) : undefined,
    formulaConvergence:   last ? Math.max(0, 10 - last.formulaDistinctiveness) : undefined,
    longitudinalDecline:  dmem?.collapseEvents.length ?? 0,
  });
  return NextResponse.json({
    plan,
    fatigueSummary: {
      fatigueLevel: fatigue.fatigueLevel,
      freshnessScore: fatigue.freshnessScore,
      predictabilityScore: fatigue.predictabilityScore,
      collapseRisk: fatigue.collapseRisk,
    },
  });
}
