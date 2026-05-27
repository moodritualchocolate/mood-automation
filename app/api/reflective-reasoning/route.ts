/**
 * GET /api/reflective-reasoning
 *
 * Read-only observatory composing the reflective-reasoning analyzers.
 * Reflection generates QUESTIONS. Hypotheses are POSSIBILITIES.
 * Assumptions are NAMED, never refuted. Tensions are PRESERVED.
 * Explanations are CO-ACTIVE. The recursive loop EXPANDS uncertainty.
 *
 * The endpoint never resolves anything. The operator interprets.
 */

import { NextResponse } from 'next/server';
import { computeReflections } from '@lib/reflectionEngine';
import { computeHypotheses } from '@lib/hypothesisEngine';
import { computeAssumptionAudit } from '@lib/assumptionAudit';
import { computeTensions } from '@lib/tensionReasoningEngine';
import { computeExplanationVariance } from '@lib/explanationVarianceEngine';
import { computeRecursiveLoop } from '@lib/recursiveObservationLoop';
import { computeConfidence } from '@lib/confidenceModel';
import { computeContradictions } from '@lib/contradictionDetector';
import { computeAmbiguities } from '@lib/ambiguityLayer';
import { computeCognitiveBoundaries } from '@lib/cognitiveBoundaryEngine';
import { computeHumanTruth } from '@lib/humanTruthIntelligence';
import { computeManipulationPressure } from '@lib/manipulationPressureAnalyzer';
import { computeCreativeFatigue } from '@lib/creativeFatigueEngine';
import { computeRitualBehaviors } from '@lib/ritualBehaviorEngine';
import { computeSymbolicResonance } from '@lib/symbolicResonanceEngine';
import { computeArchetypeRecognition } from '@lib/archetypeRecognition';
import { computeCulturalMemory } from '@lib/culturalMemoryEngine';
import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createConsequenceMemoryStore } from '@lib/consequenceIntelligenceMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [outcomeMem, driftMem, visualMem, narrativeMem, consequenceMem, copywriterMem, strategyMem] = await Promise.all([
    createOutcomeMemoryStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createConsequenceMemoryStore().read().catch(() => null),
    createCopywriterMemoryStore().read().catch(() => null),
    createAdStrategyMemoryStore().read().catch(() => null),
  ]);

  // Upstream signals.
  const humanTruth = computeHumanTruth({
    outcomes: outcomeMem as never, visualDNA: visualMem as never,
    narrativeDNA: narrativeMem as never, drift: driftMem as never,
    copywriter: copywriterMem as never, strategy: strategyMem as never,
  });
  const manipulationPressure = computeManipulationPressure({
    outcomes: outcomeMem as never, visualDNA: visualMem as never,
    narrativeDNA: narrativeMem as never, drift: driftMem as never,
    copywriter: copywriterMem as never, strategy: strategyMem as never,
  });
  const fatigue = computeCreativeFatigue({
    visualDNA:    visualMem ? { fingerprints: visualMem.fingerprints } : null,
    narrativeDNA: narrativeMem ? { fingerprints: narrativeMem.fingerprints } : null,
  });
  const rituals = computeRitualBehaviors({ outcomes: outcomeMem as never });
  const symbols = computeSymbolicResonance({ outcomes: outcomeMem as never });
  const archetypes = computeArchetypeRecognition({ outcomes: outcomeMem as never });
  const cultural = computeCulturalMemory({ outcomes: outcomeMem as never });

  const confidence = computeConfidence({
    outcomes: outcomeMem as never, drift: driftMem as never,
    cultural: {
      segments: cultural.segments,
      collectiveMemory: cultural.collectiveMemory,
    },
  });
  const contradictions = computeContradictions({
    outcomes: outcomeMem as never, drift: driftMem as never,
    humanTruth, manipulationPressure, fatigue, rituals,
  });
  const ambiguities = computeAmbiguities({
    outcomes: outcomeMem as never, archetypes, symbolicResonance: symbols,
    cultural: { segments: cultural.segments.map((s) => ({
      segment: s.segment,
      signature: s.signature as unknown as Record<string, number>,
    })) },
  });
  const boundaries = computeCognitiveBoundaries({
    outcomes: outcomeMem as never, drift: driftMem as never,
    consequences: consequenceMem as never,
    confidence: { axes: confidence.axes.map((a) => ({ axis: a.axis, level: a.level, sampleSize: a.sampleSize })) },
    recoveryEvents: driftMem?.recoveryEvents ?? [],
  });

  // Reflective layer.
  const reflections = computeReflections({
    outcomes: outcomeMem as never, drift: driftMem as never,
    contradictions, ambiguities, humanTruth,
  });
  const hypotheses = computeHypotheses({
    outcomes: outcomeMem as never, humanTruth, rituals,
    symbolicResonance: symbols,
  });
  const assumptions = computeAssumptionAudit({
    outcomes: outcomeMem as never, humanTruth, manipulationPressure,
  });
  const tensions = computeTensions({
    outcomes: outcomeMem as never, humanTruth, manipulationPressure,
    rituals, fatigue,
  });
  const variance = computeExplanationVariance({
    outcomes: outcomeMem as never, rituals,
    symbolicResonance: symbols,
  });
  const loop = computeRecursiveLoop({
    reflection: { outcomes: outcomeMem as never, drift: driftMem as never, contradictions, ambiguities, humanTruth },
    hypothesis: { outcomes: outcomeMem as never, humanTruth, rituals, symbolicResonance: symbols },
    assumption: { outcomes: outcomeMem as never, humanTruth, manipulationPressure },
    tension: { outcomes: outcomeMem as never, humanTruth, manipulationPressure, rituals, fatigue },
    variance: { outcomes: outcomeMem as never, rituals, symbolicResonance: symbols },
    initialConfidence: { overallLevel: confidence.overallLevel, overallScore: confidence.overallScore },
    contradictions, ambiguities,
    boundaries: { boundaries: boundaries.boundaries },
  });

  return NextResponse.json({
    reflections,
    hypotheses,
    assumptions,
    tensions,
    explanationVariance: variance,
    recursivePasses: loop,
    confidenceAdjustments: {
      initial: confidence.overallScore,
      final: loop.finalConfidenceScore,
      netDelta: loop.netConfidenceDelta,
    },
    reflectiveBoundaries: boundaries.boundaries,
    ambiguityPersistence: ambiguities.interpretationVariance,
    unresolvedDynamics: [
      ...contradictions.contradictions.map((c) => `contradiction:${c.key}`),
      ...ambiguities.ambiguities.map((a) => `ambiguity:${a.zone}`),
      ...tensions.tensions.map((t) => `tension:${t.key}`),
    ],
    advisoryNotice:
      'Observatory only — reflection expands uncertainty, never suppresses it. ' +
      'Hypotheses are possibilities. Assumptions are named. Tensions are preserved. ' +
      'Explanations are co-active. No conclusion is autonomously drawn.',
    reasonCodes: [
      ...reflections.reasonCodes.slice(0, 3),
      ...hypotheses.reasonCodes.slice(0, 2),
      ...assumptions.reasonCodes.slice(0, 2),
      ...tensions.reasonCodes.slice(0, 2),
      ...variance.reasonCodes.slice(0, 2),
      ...loop.reasonCodes.slice(0, 2),
    ],
  });
}
