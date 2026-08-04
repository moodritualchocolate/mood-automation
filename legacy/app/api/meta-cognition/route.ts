/**
 * GET /api/meta-cognition
 *
 * Read-only observatory composing all meta-cognitive analyzers.
 * Surfaces uncertainty, contradiction, ambiguity, cognitive
 * boundaries, and competing interpretations. NEVER resolves them,
 * NEVER collapses ambiguity, NEVER claims certainty.
 */

import { NextResponse } from 'next/server';
import { computeConfidence, type ConfidenceInput } from '@lib/confidenceModel';
import { computeContradictions } from '@lib/contradictionDetector';
import { computeAmbiguities } from '@lib/ambiguityLayer';
import { computeCognitiveBoundaries } from '@lib/cognitiveBoundaryEngine';
import { computeMultiPerspective } from '@lib/multiPerspectiveEngine';
import { computeHumanTruth, type HumanTruthInput } from '@lib/humanTruthIntelligence';
import { computeManipulationPressure } from '@lib/manipulationPressureAnalyzer';
import { computeCulturalMemory, type CulturalInput } from '@lib/culturalMemoryEngine';
import { computeSymbolicResonance } from '@lib/symbolicResonanceEngine';
import { computeArchetypeRecognition } from '@lib/archetypeRecognition';
import { computeRitualBehaviors } from '@lib/ritualBehaviorEngine';
import { computeCreativeFatigue } from '@lib/creativeFatigueEngine';
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

  const outcomes = (outcomeMem as unknown as ConfidenceInput['outcomes']) ?? null;
  const drift = (driftMem as unknown as ConfidenceInput['drift']) ?? null;

  // Compute upstream signals.
  const culturalInput: CulturalInput = { outcomes: outcomeMem as unknown as CulturalInput['outcomes'] };
  const cultural = computeCulturalMemory(culturalInput);
  const symbols = computeSymbolicResonance(culturalInput);
  const archetypes = computeArchetypeRecognition(culturalInput);
  const rituals = computeRitualBehaviors(culturalInput);
  const humanTruthInput: HumanTruthInput = {
    outcomes: outcomeMem as never,
    visualDNA: visualMem as never,
    narrativeDNA: narrativeMem as never,
    drift: driftMem as never,
    copywriter: copywriterMem as never,
    strategy: strategyMem as never,
  };
  const humanTruth = computeHumanTruth(humanTruthInput);
  const manipulationPressure = computeManipulationPressure(humanTruthInput);
  const fatigue = computeCreativeFatigue({
    visualDNA:    visualMem ? { fingerprints: visualMem.fingerprints } : null,
    narrativeDNA: narrativeMem ? { fingerprints: narrativeMem.fingerprints } : null,
  });

  // Meta-cognitive readings.
  const confidence = computeConfidence({
    outcomes,
    drift,
    cultural: {
      segments: cultural.segments,
      collectiveMemory: cultural.collectiveMemory,
    },
  });
  const contradictions = computeContradictions({
    outcomes: outcomeMem as never,
    drift: driftMem as never,
    humanTruth,
    manipulationPressure,
    fatigue,
    rituals,
  });
  const ambiguities = computeAmbiguities({
    outcomes: outcomeMem as never,
    archetypes,
    symbolicResonance: symbols,
    cultural: { segments: cultural.segments.map((s) => ({
      segment: s.segment,
      signature: s.signature as unknown as Record<string, number>,
    })) },
  });
  const boundaries = computeCognitiveBoundaries({
    outcomes: outcomeMem as never,
    drift: driftMem as never,
    consequences: consequenceMem as never,
    confidence: { axes: confidence.axes.map((a) => ({ axis: a.axis, level: a.level, sampleSize: a.sampleSize })) },
    recoveryEvents: driftMem?.recoveryEvents ?? [],
  });
  const perspectives = computeMultiPerspective({
    outcomes: outcomeMem as never,
    fatigue,
    humanTruth,
    rituals,
  });

  return NextResponse.json({
    confidence,
    contradictions,
    ambiguities,
    cognitiveBoundaries: boundaries,
    competingInterpretations: perspectives,
    uncertaintyZones: ambiguities.ambiguities.map((a) => a.zone),
    confidenceBoundaries: boundaries.boundaries.map((b) => b.zone),
    unresolvedSignals: contradictions.contradictions.map((c) => c.key),
    interpretiveStability: ambiguities.interpretationVariance,
    advisoryNotice:
      'Observatory only — uncertainty is preserved, never suppressed. ' +
      'The system never resolves contradictions, never collapses ambiguities, ' +
      'never claims certainty it does not have.',
    reasonCodes: [
      ...confidence.reasonCodes.slice(0, 3),
      ...contradictions.reasonCodes.slice(0, 3),
      ...ambiguities.reasonCodes.slice(0, 3),
      ...boundaries.reasonCodes.slice(0, 3),
      ...perspectives.reasonCodes.slice(0, 2),
    ],
  });
}
