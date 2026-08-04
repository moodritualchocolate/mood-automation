/**
 * GET /api/asset-composer
 *
 * Asset Composer observatory. Composes story + scene + rhythm +
 * presence + memory + world into IMAGE / VIDEO / BANNER / LANDING
 * SECTION specification packages.
 *
 * IMPORTANT: this engine does NOT create assets. It creates
 * structured creative packages.
 *
 * STRICT CONTRACT:
 *   - GET only — no POST, no execution, no publishing
 *   - the operator remains the creative authority
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { computeAssetPackages } from '@lib/assetComposerEngine';

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
import { computeStoryArchitect } from '@lib/storyArchitectEngine';
import { computeSceneArchitect } from '@lib/sceneArchitectEngine';
import { computeEmotionalRhythm } from '@lib/emotionalRhythmEngine';

import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { createTrialOutcomeMemoryStore } from '@lib/trialOutcomeMemory';
import { createPatternReliabilityMemoryStore } from '@lib/patternReliabilityMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const [outcomeMem, driftMem, visualMem, narrativeMem, trialMem, outcomeAttachMem, patternMem] = await Promise.all([
    createOutcomeMemoryStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createOperatorTrialMemoryStore().read().catch(() => null),
    createTrialOutcomeMemoryStore().read().catch(() => null),
    createPatternReliabilityMemoryStore().read().catch(() => null),
  ]);

  const outcomesArr = outcomeMem?.outcomes ?? [];
  const driftArr = driftMem?.observations ?? [];
  const visualArr = visualMem?.fingerprints ?? [];
  const narrativeArr = narrativeMem?.fingerprints ?? [];
  const trialsArr = trialMem?.trials ?? [];
  const outcomeAttachArr = outcomeAttachMem?.outcomes ?? [];
  const patternsArr = patternMem?.patterns ?? [];

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
  const ritualPersistenceMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(ritualPersistence.rituals)) {
    ritualPersistenceMap[k] = v.persistence;
  }
  const mythicWeightsMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(mythicNarrative.archetypes)) {
    mythicWeightsMap[k] = v.mythicWeight;
  }
  const story = computeStoryArchitect({
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
  const scene = computeSceneArchitect({
    storyBlueprints: story.storyBlueprints,
    imprint: {
      dominantImprintSignals: imprint.dominantImprintSignals,
      mythicWeights: mythicWeightsMap,
      ritualPersistence: ritualPersistenceMap,
    },
    presence: {
      presenceScore: presence.presenceScore,
      stillnessWeight: presence.stillnessWeight,
      authenticityWeight: presence.authenticityWeight,
      imperfectionSignature: presence.imperfectionSignature,
      signals: presence.signals as unknown as Record<string, number>,
    },
    world: world.signals,
    director: { dominantDirections: director.dominantDirections },
  });
  const rhythm = computeEmotionalRhythm({
    scenes: scene.scenes,
    stories: story.storyBlueprints,
    world: world.signals,
    presence: {
      stillnessWeight: presence.stillnessWeight,
      emotionalBreathing: presence.emotionalBreathing,
      syntheticPressure: presence.syntheticPressure,
      signals: presence.signals as unknown as Record<string, number>,
    },
    imprint: {
      imprintStrength: imprint.imprintStrength,
      scenePermanence: imprint.scenePermanence,
    },
  });

  const reading = computeAssetPackages({
    stories: story.storyBlueprints,
    scenes: scene.scenes,
    rhythm: {
      pacingProfile: rhythm.pacingProfile,
      restraintProfile: rhythm.restraintProfile,
      rhythmProfile: rhythm.rhythmProfile as unknown as Record<string, number>,
      silenceMoments: rhythm.silenceMoments,
      breathingMoments: rhythm.breathingMoments,
      emotionalDensity: rhythm.emotionalDensity,
    },
    presence: {
      presenceScore: presence.presenceScore,
      authenticityWeight: presence.authenticityWeight,
      stillnessWeight: presence.stillnessWeight,
      imperfectionSignature: presence.imperfectionSignature,
      syntheticPressure: presence.syntheticPressure,
      signals: presence.signals as unknown as Record<string, number>,
    },
    memory: {
      imprintStrength: imprint.imprintStrength,
      scenePermanence: imprint.scenePermanence,
      dominantImprintSignals: imprint.dominantImprintSignals,
      mythicWeights: mythicWeightsMap,
      ritualPersistence: ritualPersistenceMap,
    },
    world: world.signals,
    director: { dominantDirections: director.dominantDirections },
  });

  return NextResponse.json({
    packages: reading,
    storyBlueprints: story.storyBlueprints,
    scenes: scene.scenes,
    rhythm,
    advisoryNotice:
      'Creative packages are specifications only. No asset generation occurs here. ' +
      'The operator remains the only authority.',
  });
}
