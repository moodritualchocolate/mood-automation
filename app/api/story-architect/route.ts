/**
 * GET /api/story-architect
 *
 * Story Architect observatory. Composes prior observatory layers
 * into exploratory STORY BLUEPRINTS.
 *
 * STRICT CONTRACT:
 *   - GET only — no POST, no execution, no publishing
 *   - this layer NEVER generates content
 *   - this layer NEVER selects a candidate
 *   - the operator remains the creative authority
 */

import { NextResponse } from 'next/server';
import { computeStoryArchitect } from '@lib/storyArchitectEngine';

// Upstream observatory engines.
import { computeWorldModel } from '@lib/worldModelEngine';
import { computeHumanMemoryImprint } from '@lib/humanMemoryImprintEngine';
import { computeRitualPersistence } from '@lib/ritualPersistenceEngine';
import { computeMythicNarrative } from '@lib/mythicNarrativeEngine';
import { computeEmotionalScar } from '@lib/emotionalScarEngine';
import { computeCulturalMemory } from '@lib/culturalMemoryEngine';
import { computeMetaCognition } from '@lib/metaCognitionEngine';
import { computeHumanTruth } from '@lib/humanTruthIntelligence';
import { computeHumanPresence } from '@lib/humanPresenceEngine';
import { computeCreativeDirections } from '@lib/creativeDirectorEngine';
import { computeSupervisedLearning } from '@lib/supervisedLearningLoop';

import { createStoryBlueprintMemoryStore } from '@lib/storyBlueprintMemory';
import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { createTrialOutcomeMemoryStore } from '@lib/trialOutcomeMemory';
import { createPatternReliabilityMemoryStore } from '@lib/patternReliabilityMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [outcomeMem, driftMem, visualMem, narrativeMem, trialMem, outcomeAttachMem, patternMem, priorBlueprintMem] = await Promise.all([
    createOutcomeMemoryStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createOperatorTrialMemoryStore().read().catch(() => null),
    createTrialOutcomeMemoryStore().read().catch(() => null),
    createPatternReliabilityMemoryStore().read().catch(() => null),
    createStoryBlueprintMemoryStore().read().catch(() => null),
  ]);

  const outcomesArr = outcomeMem?.outcomes ?? [];
  const driftArr = driftMem?.observations ?? [];
  const visualArr = visualMem?.fingerprints ?? [];
  const narrativeArr = narrativeMem?.fingerprints ?? [];
  const trialsArr = trialMem?.trials ?? [];
  const outcomeAttachArr = outcomeAttachMem?.outcomes ?? [];
  const patternsArr = patternMem?.patterns ?? [];

  // Recompose upstream observatory readings.
  const world = computeWorldModel({
    outcomes: { outcomes: outcomesArr },
    drift: { observations: driftArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });
  const imprint = computeHumanMemoryImprint({
    outcomes: { outcomes: outcomesArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });
  const ritualPersistence = computeRitualPersistence({ outcomes: { outcomes: outcomesArr } });
  const mythicNarrative = computeMythicNarrative({ outcomes: { outcomes: outcomesArr } });
  const scar = computeEmotionalScar({
    outcomes: { outcomes: outcomesArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });
  const cultural = computeCulturalMemory({ outcomes: { outcomes: outcomesArr } });
  const selfReflection = computeMetaCognition({
    outcomes: { outcomes: outcomesArr },
    drift: { observations: driftArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
    learning: { patterns: patternsArr },
  });
  const humanTruth = computeHumanTruth({
    outcomes: { outcomes: outcomesArr },
    drift: { observations: driftArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });
  const presence = computeHumanPresence({
    outcomes: { outcomes: outcomesArr },
    visualDNA: { fingerprints: visualArr },
    narrativeDNA: { fingerprints: narrativeArr },
  });
  const supervised = computeSupervisedLearning({
    trials: trialsArr,
    outcomes: outcomeAttachArr,
    priorPatterns: patternsArr,
  });

  // Build director input (we re-compute on this route for self-containment).
  const alignedMutations = supervised.mutationReliability
    .filter((m) => m.alignedCount > m.contradictedCount && m.evidenceCount >= 2)
    .slice(0, 5)
    .map((m) => m.mutationType);
  const contradictedMutations = supervised.mutationReliability
    .filter((m) => m.contradictedCount > m.alignedCount && m.evidenceCount >= 2)
    .slice(0, 5)
    .map((m) => m.mutationType);
  const totalTrialOutcomes = outcomeAttachArr.length;
  const labelShare = (label: string): number => {
    if (totalTrialOutcomes === 0) return 0;
    let count = 0;
    for (const o of outcomeAttachArr) {
      if ((o.outcomeLabels ?? []).includes(label as never)) count += 1;
    }
    return count / totalTrialOutcomes;
  };
  const director = computeCreativeDirections({
    world: world.signals,
    memoryImprint: {
      imprintStrength: imprint.imprintStrength,
      scenePermanence: imprint.scenePermanence,
      emotionalAftertaste: imprint.emotionalAftertaste,
      identityAttachment: imprint.identityAttachment,
      memoryRisk: imprint.memoryRisk,
      dominantImprintSignals: imprint.dominantImprintSignals,
    },
    culturalMemory: { saturation: 0, recovery: 0 },
    selfReflection: {
      syntheticDrift: selfReflection.signals.syntheticDrift,
      humanityRetention: selfReflection.signals.humanityRetention,
      manipulationCreep: selfReflection.signals.manipulationCreep,
      aestheticExhaustion: selfReflection.signals.aestheticExhaustion,
      restraintIntegrity: selfReflection.signals.restraintIntegrity,
      identityCoherence: selfReflection.signals.identityCoherence,
    },
    humanTruth: {
      truthIndex: humanTruth.authenticityScore,
      honesty: humanTruth.signals.observationalHonesty,
      dignityIntegrity: humanTruth.signals.dignity,
    },
    presence: {
      presenceScore: presence.presenceScore,
      stillnessWeight: presence.stillnessWeight,
      authenticityWeight: presence.authenticityWeight,
      imperfectionSignature: presence.imperfectionSignature,
      syntheticPressure: presence.syntheticPressure,
      dignityProtection: presence.dignityProtection,
    },
    supervised: { alignedMutations, contradictedMutations },
    trialOutcomes: {
      trustFormationShare: labelShare('trust-formation'),
      emotionalResonanceShare: labelShare('emotional-resonance'),
      authenticityRejectionShare: labelShare('authenticity-rejection'),
      fatigueShare: labelShare('fatigue-acceleration'),
      totalOutcomes: totalTrialOutcomes,
    },
  });

  // Build the maps story architect needs.
  const ritualPersistenceMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(ritualPersistence.rituals)) {
    ritualPersistenceMap[k] = v.persistence;
  }
  const mythicWeightsMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(mythicNarrative.archetypes)) {
    mythicWeightsMap[k] = v.mythicWeight;
  }

  // Compute the story architect reading.
  const reading = computeStoryArchitect({
    director: { dominantDirections: director.dominantDirections, notes: director.notes },
    presence: {
      presenceScore: presence.presenceScore,
      stillnessWeight: presence.stillnessWeight,
      authenticityWeight: presence.authenticityWeight,
      imperfectionSignature: presence.imperfectionSignature,
      vulnerabilitySignals: presence.vulnerabilitySignals,
      emotionalBreathing: presence.emotionalBreathing,
      listeningSignals: presence.listeningSignals,
      syntheticPressure: presence.syntheticPressure,
      signals: presence.signals as unknown as Record<string, number>,
    },
    imprint: {
      imprintStrength: imprint.imprintStrength,
      scenePermanence: imprint.scenePermanence,
      emotionalAftertaste: imprint.emotionalAftertaste,
      identityAttachment: imprint.identityAttachment,
      memoryRisk: imprint.memoryRisk,
      ritualPersistence: ritualPersistenceMap,
      mythicWeights: mythicWeightsMap,
    },
    humanTruth: {
      authenticityScore: humanTruth.authenticityScore,
      feltHumanScore: humanTruth.feltHumanScore,
      signals: humanTruth.signals as unknown as Record<string, number>,
    },
    culturalMemory: {
      emotionalPersistence: cultural.emotionalPersistence,
      collapsedSymbols: cultural.collapsedSymbols.length,
      dominantSignals: cultural.collectiveMemory.slice(0, 5).map((c) => c.theme),
    },
    world: world.signals,
    selfReflection: {
      syntheticDrift: selfReflection.signals.syntheticDrift,
      humanityRetention: selfReflection.signals.humanityRetention,
      manipulationCreep: selfReflection.signals.manipulationCreep,
      aestheticExhaustion: selfReflection.signals.aestheticExhaustion,
      restraintIntegrity: selfReflection.signals.restraintIntegrity,
      identityCoherence: selfReflection.signals.identityCoherence,
    },
    supervised: { alignedMutations, contradictedMutations },
    trialOutcomes: {
      trustFormationShare: labelShare('trust-formation'),
      emotionalResonanceShare: labelShare('emotional-resonance'),
      authenticityRejectionShare: labelShare('authenticity-rejection'),
      fatigueShare: labelShare('fatigue-acceleration'),
      totalOutcomes: totalTrialOutcomes,
    },
    scar: { verdict: scar.verdict, signals: scar.signals },
  });

  // Persist one snapshot — non-fatal.
  let totalSnapshots = priorBlueprintMem?.totalSnapshots ?? 0;
  try {
    const store = createStoryBlueprintMemoryStore();
    const next = await store.append({
      at: Date.now(),
      blueprintObservations: reading.storyBlueprints.map((b) => ({
        blueprintId: b.blueprintId,
        storyName: b.storyName,
        alignment: b.alignment,
        riskLevel: b.riskLevel,
        dignityProtection: b.dignityProtection,
        manipulationRisk: b.manipulationRisk,
      })),
      dominantHumanTensions: reading.dominantHumanTensions,
      dominantArcs: reading.emotionalArcOptions.dominantArcs,
      dominantMemoryAnchors: reading.memoryAnchorOptions.dominantAnchors,
      dominantPresenceAnchors: reading.presenceAnchorOptions.dominantAnchors,
      riskWarningCount: reading.riskWarnings.length,
      unresolvedQuestionCount: reading.unresolvedQuestions.length,
      observationCount: outcomesArr.length + visualArr.length + narrativeArr.length,
    });
    totalSnapshots = next.totalSnapshots;
  } catch {
    // non-fatal — persistence never blocks the read view
  }

  return NextResponse.json({
    storyBlueprints: reading.storyBlueprints,
    dominantHumanTensions: reading.dominantHumanTensions,
    emotionalArcs: reading.emotionalArcOptions,
    memoryAnchors: reading.memoryAnchorOptions,
    presenceAnchors: reading.presenceAnchorOptions,
    silenceMoments: reading.silenceMoments,
    mythicFrames: reading.mythicFrames,
    realismAnchors: reading.realismAnchors,
    riskWarnings: reading.riskWarnings,
    unresolvedQuestions: reading.unresolvedQuestions,
    notes: reading.notes,
    totalSnapshots,
    advisoryNotice:
      'Story blueprints are exploratory structures only. ' +
      'The system does not generate, publish, or choose. ' +
      'The operator remains the creative authority.',
  });
}
