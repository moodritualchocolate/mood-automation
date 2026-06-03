/**
 * GET /api/creative-director
 *
 * Creative direction observatory. Composes prior observatory layers
 * (world model + memory imprint + cultural memory + self-reflection
 * + human truth + human presence + supervised learning + trial
 * outcomes) into CREATIVE DIRECTIONS + STORY ARCHITECTURES.
 *
 * STRICT CONTRACT:
 *   - GET only — no POST, no execution, no publishing
 *   - this layer NEVER generates content
 *   - this layer NEVER selects a candidate
 *   - the operator remains the only authority
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { computeCreativeDirections } from '@lib/creativeDirectorEngine';
import { computeStoryArchitecture } from '@lib/storyArchitectureEngine';

// Upstream observatory engines — pure functions over memory state.
import { computeWorldModel } from '@lib/worldModelEngine';
import { computeHumanMemoryImprint } from '@lib/humanMemoryImprintEngine';
import { computeRitualPersistence } from '@lib/ritualPersistenceEngine';
import { computeMythicNarrative } from '@lib/mythicNarrativeEngine';
import { computeCulturalMemory } from '@lib/culturalMemoryEngine';
import { computeMetaCognition } from '@lib/metaCognitionEngine';
import { computeHumanTruth } from '@lib/humanTruthIntelligence';
import { computeHumanPresence } from '@lib/humanPresenceEngine';
import { computeSupervisedLearning } from '@lib/supervisedLearningLoop';

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
  const ritualPersistence = computeRitualPersistence({
    outcomes: { outcomes: outcomesArr },
  });
  const mythicNarrative = computeMythicNarrative({
    outcomes: { outcomes: outcomesArr },
  });
  const cultural = computeCulturalMemory({
    outcomes: { outcomes: outcomesArr },
  });
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

  // Build supervised learning input for the director.
  const alignedMutations = supervised.mutationReliability
    .filter((m) => m.alignedCount > m.contradictedCount && m.evidenceCount >= 2)
    .slice(0, 5)
    .map((m) => m.mutationType);
  const contradictedMutations = supervised.mutationReliability
    .filter((m) => m.contradictedCount > m.alignedCount && m.evidenceCount >= 2)
    .slice(0, 5)
    .map((m) => m.mutationType);

  // Trial outcome shares.
  const totalTrialOutcomes = outcomeAttachArr.length;
  const labelShare = (label: string): number => {
    if (totalTrialOutcomes === 0) return 0;
    let count = 0;
    for (const o of outcomeAttachArr) {
      if ((o.outcomeLabels ?? []).includes(label as never)) count += 1;
    }
    return count / totalTrialOutcomes;
  };

  // Cultural memory composite.
  const culturalSaturation = cultural.collapsedSymbols.length > 0
    ? Math.min(10, cultural.collapsedSymbols.length * 2)
    : 0;

  // Map mythic / ritual outputs into Record<string, number>.
  const mythicWeights: Record<string, number> = {};
  for (const [k, v] of Object.entries(mythicNarrative.archetypes)) {
    mythicWeights[k] = v.mythicWeight;
  }
  const ritualPersistenceMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(ritualPersistence.rituals)) {
    ritualPersistenceMap[k] = v.persistence;
  }

  // Compute creative directions.
  const directions = computeCreativeDirections({
    world: world.signals,
    memoryImprint: {
      imprintStrength: imprint.imprintStrength,
      scenePermanence: imprint.scenePermanence,
      emotionalAftertaste: imprint.emotionalAftertaste,
      identityAttachment: imprint.identityAttachment,
      memoryRisk: imprint.memoryRisk,
      dominantImprintSignals: imprint.dominantImprintSignals,
    },
    culturalMemory: {
      saturation: culturalSaturation,
      recovery: 0,
      dominantSignals: cultural.collectiveMemory.slice(0, 5).map((c) => c.theme),
    },
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
    supervised: {
      alignedMutations,
      contradictedMutations,
    },
    trialOutcomes: {
      trustFormationShare: labelShare('trust-formation'),
      emotionalResonanceShare: labelShare('emotional-resonance'),
      authenticityRejectionShare: labelShare('authenticity-rejection'),
      fatigueShare: labelShare('fatigue-acceleration'),
      totalOutcomes: totalTrialOutcomes,
    },
  });

  // Compute story architecture.
  const story = computeStoryArchitecture({
    world: world.signals,
    imprint: {
      imprintStrength: imprint.imprintStrength,
      scenePermanence: imprint.scenePermanence,
      identityAttachment: imprint.identityAttachment,
      mythicWeights,
      ritualPersistence: ritualPersistenceMap,
    },
    presence: {
      presenceScore: presence.presenceScore,
      stillnessWeight: presence.stillnessWeight,
      authenticityWeight: presence.authenticityWeight,
    },
  });

  return NextResponse.json({
    // Upstream observatory snapshots for the panel.
    worldSignals: world.signals,
    humanSignals: humanTruth.signals,
    presenceSignals: presence.signals,
    memorySignals: imprint.rememberedMomentSignals,
    // Creative directions per the directive.
    directions,
    storyArchitecture: story,
    // Panel-aligned top-level convenience fields.
    storyDirections: directions.narrativeDirections,
    emotionalDirections: directions.emotionalDirections,
    silenceDirections: directions.silenceDirections,
    realismDirections: directions.realismDirections,
    riskZones: directions.riskZones,
    explorationZones: directions.experimentationZones,
    advisoryNotice:
      'Creative directions are observations. ' +
      'The operator remains the only authority.',
  });
}
