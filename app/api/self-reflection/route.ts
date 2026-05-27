/**
 * GET /api/self-reflection
 *
 * Self-reflection observatory. Composes outcomes + drift + visual DNA +
 * narrative DNA + pattern reliability memory into:
 *   - 15 meta-cognition degradation signals
 *   - 9 identity-drift signals + drift verdict
 *   - 8 aesthetic-collapse signals + collapse verdict
 *   - 9 humanity-retention signals + felt-human verdict
 *
 * Each GET also appends ONE snapshot to the self-reflection memory.
 *
 * STRICT CONTRACT:
 *   - GET only — no POST, no execution, no publishing
 *   - the system observes itself, never rewrites itself
 *   - never auto-corrects, never auto-heals, never auto-optimizes
 *   - never blocks generation
 */

import { NextResponse } from 'next/server';
import { computeMetaCognition } from '@lib/metaCognitionEngine';
import { computeIdentityDrift } from '@lib/identityDriftEngine';
import { computeAestheticCollapse } from '@lib/aestheticCollapseEngine';
import { computeHumanityRetention } from '@lib/humanityRetentionEngine';
import { createSelfReflectionMemoryStore } from '@lib/selfReflectionMemory';
import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createPatternReliabilityMemoryStore } from '@lib/patternReliabilityMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [outcomeMem, driftMem, visualMem, narrativeMem, patternMem, priorReflectionMem] = await Promise.all([
    createOutcomeMemoryStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createPatternReliabilityMemoryStore().read().catch(() => null),
    createSelfReflectionMemoryStore().read().catch(() => null),
  ]);

  const outcomesArr = outcomeMem?.outcomes ?? [];
  const driftArr = driftMem?.observations ?? [];
  const visualArr = visualMem?.fingerprints ?? [];
  const narrativeArr = narrativeMem?.fingerprints ?? [];
  const patternsArr = patternMem?.patterns ?? [];

  const selfReflection = computeMetaCognition({
    outcomes: { outcomes: outcomesArr },
    drift: { observations: driftArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
    learning: { patterns: patternsArr },
  });

  const identityDrift = computeIdentityDrift({
    outcomes: { outcomes: outcomesArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });

  const aestheticCollapse = computeAestheticCollapse({
    outcomes: { outcomes: outcomesArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });

  const humanityRetention = computeHumanityRetention({
    outcomes: { outcomes: outcomesArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });

  let totalSnapshots = priorReflectionMem?.totalSnapshots ?? 0;
  try {
    const store = createSelfReflectionMemoryStore();
    const next = await store.append({
      at: Date.now(),
      metaSignals: selfReflection.signals,
      dominantDegradations: selfReflection.dominantDegradations,
      identitySignals: identityDrift.signals,
      identityVerdict: identityDrift.verdict,
      identityDriftIndex: identityDrift.overallDriftIndex,
      aestheticCollapseLevels: {
        repeatedPacing: aestheticCollapse.signals.repeatedPacing.level,
        repeatedEmotionalCadence: aestheticCollapse.signals.repeatedEmotionalCadence.level,
        repeatedVisualRhythm: aestheticCollapse.signals.repeatedVisualRhythm.level,
        repeatedTypographyEnergy: aestheticCollapse.signals.repeatedTypographyEnergy.level,
        repeatedCinematicFraming: aestheticCollapse.signals.repeatedCinematicFraming.level,
        aiFeelingSignature: aestheticCollapse.signals.aiFeelingSignature.level,
        emotionalFlattening: aestheticCollapse.signals.emotionalFlattening.level,
        overstimulationFatigue: aestheticCollapse.signals.overstimulationFatigue.level,
      },
      aestheticVerdict: aestheticCollapse.verdict,
      aestheticCollapseIndex: aestheticCollapse.overallCollapseIndex,
      humanitySignals: humanityRetention.signals,
      humanityVerdict: humanityRetention.verdict,
      humanityIndex: humanityRetention.humanityIndex,
      observationCount: outcomesArr.length + visualArr.length + narrativeArr.length,
    });
    totalSnapshots = next.totalSnapshots;
  } catch {
    // non-fatal — self-reflection persistence never blocks the read view
  }

  // Composed derived top-level fields (per the directive):
  // syntheticPressure, emotionalCompression, trustIntegrity,
  // authenticityIntegrity, symbolicIntegrity.
  const m = selfReflection.signals;
  const syntheticPressure = Math.round(((m.syntheticDrift + (10 - m.humanityRetention) + (10 - m.realismIntegrity)) / 3) * 10) / 10;
  const emotionalCompression = Math.round(((m.emotionalDensity + (10 - m.emotionalBreathingRoom)) / 2) * 10) / 10;
  const trustIntegrity = Math.round(((10 - m.trustFragility) * 0.5 + m.authenticityStability * 0.3 + (10 - m.manipulationCreep) * 0.2) * 10) / 10;
  const authenticityIntegrity = Math.round((m.authenticityStability * 0.6 + (10 - m.syntheticDrift) * 0.4) * 10) / 10;
  const symbolicIntegrity = Math.round(m.symbolismIntegrity * 10) / 10;

  return NextResponse.json({
    selfReflection,
    identityDrift,
    aestheticCollapse,
    humanityRetention,
    syntheticPressure,
    emotionalCompression,
    trustIntegrity,
    authenticityIntegrity,
    symbolicIntegrity,
    totalSnapshots,
    advisoryNotice:
      'Observatory only — the system reflects on its own behavioral patterns. ' +
      'It never autonomously modifies itself. ' +
      'The system may observe itself. Never rewrite itself.',
  });
}
