/**
 * GET /api/production-studio
 *
 * Production Studio observatory. Composes asset composer packages +
 * story architect + scene architect + emotional rhythm into:
 *   - Creative Briefs (Banner / Carousel / Image / Video / Landing)
 *   - Production Prompts (image / video / banner / carousel / landing)
 *   - Brand Guardian validation reports
 *
 * STRICT CONTRACT:
 *   - GET only — no POST, no execution, no publishing
 *   - never publishes
 *   - never auto-posts
 *   - never auto-approves
 *   - human remains final authority
 */

import { NextResponse } from 'next/server';

import { computeCreativeBriefs } from '@lib/creativeBriefGenerator';
import { computeProductionPrompts } from '@lib/promptArchitect';
import { computeBrandGuardian, briefToScanText } from '@lib/brandGuardian';
import { composeImageExecutionPackage } from '@lib/imageExecutionEngine';
import { composeVideoExecutionPackage } from '@lib/videoExecutionEngine';
import { composeCarouselExecutionPackage } from '@lib/carouselExecutionEngine';
import { composeLandingExecutionPackage } from '@lib/landingExecutionEngine';

// Upstream observatory + creative layers.
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
import { computeAssetPackages } from '@lib/assetComposerEngine';

import { createOutcomeMemoryStore } from '@lib/outcomeMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { createTrialOutcomeMemoryStore } from '@lib/trialOutcomeMemory';
import { createPatternReliabilityMemoryStore } from '@lib/patternReliabilityMemory';

import type { Formula } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_FORMULAS: Formula[] = ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'];

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const formulaParam = (url.searchParams.get('formula') ?? 'ENERGY').toUpperCase() as Formula;
  const formula: Formula = VALID_FORMULAS.includes(formulaParam) ? formulaParam : 'ENERGY';
  const marketParam = (url.searchParams.get('market') ?? 'israel').toLowerCase();
  const market: 'israel' | 'global' = marketParam === 'global' ? 'global' : 'israel';
  const langParam = (url.searchParams.get('lang') ?? 'hebrew').toLowerCase();
  const brandLanguage: 'hebrew' | 'mixed' | 'english' =
    langParam === 'english' ? 'english' : langParam === 'mixed' ? 'mixed' : 'hebrew';

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
    .slice(0, 5).map((m) => m.mutationType);
  const contradictedMutations = supervised.mutationReliability
    .filter((m) => m.contradictedCount > m.alignedCount && m.evidenceCount >= 2)
    .slice(0, 5).map((m) => m.mutationType);
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
  const packages = computeAssetPackages({
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

  // ── Phase 1 — Briefs ───────────────────────────────────────
  const briefs = computeCreativeBriefs({
    stories: story.storyBlueprints,
    scenes: scene.scenes,
    rhythm: {
      pacingProfile: rhythm.pacingProfile,
      restraintProfile: rhythm.restraintProfile,
      rhythmProfile: rhythm.rhythmProfile as unknown as Record<string, number>,
      silenceMoments: rhythm.silenceMoments,
      breathingMoments: rhythm.breathingMoments,
    },
    packages,
    formula,
    brandLanguage,
    audienceMarket: market,
  });

  // ── Phase 2 — Prompts ──────────────────────────────────────
  const prompts = computeProductionPrompts({
    banners: briefs.banners,
    carousels: briefs.carousels,
    images: briefs.images,
    videos: briefs.videos,
    landings: briefs.landings,
    formula,
    brandLanguage,
    audienceMarket: market,
  });

  // ── Phase 3 — Brand Guardian ───────────────────────────────
  const guardianInput = {
    briefs: [
      ...briefs.banners.map((b) => ({ briefId: b.briefId, briefType: b.briefType, formula: b.formula,
        sourceStoryName: b.sourceStoryName, audienceMarket: b.audienceMarket, briefText: briefToScanText(b as unknown as Record<string, unknown>) })),
      ...briefs.carousels.map((b) => ({ briefId: b.briefId, briefType: b.briefType, formula: b.formula,
        sourceStoryName: b.sourceStoryName, audienceMarket: b.audienceMarket, briefText: briefToScanText(b as unknown as Record<string, unknown>) })),
      ...briefs.images.map((b) => ({ briefId: b.briefId, briefType: b.briefType, formula: b.formula,
        sourceStoryName: b.sourceStoryName, audienceMarket: b.audienceMarket, briefText: briefToScanText(b as unknown as Record<string, unknown>) })),
      ...briefs.videos.map((b) => ({ briefId: b.briefId, briefType: b.briefType, formula: b.formula,
        sourceStoryName: b.sourceStoryName, audienceMarket: b.audienceMarket, briefText: briefToScanText(b as unknown as Record<string, unknown>) })),
      ...briefs.landings.map((b) => ({ briefId: b.briefId, briefType: b.briefType, formula: b.formula,
        sourceStoryName: b.sourceStoryName, audienceMarket: b.audienceMarket, briefText: briefToScanText(b as unknown as Record<string, unknown>) })),
    ],
    prompts: [
      ...prompts.imagePrompts, ...prompts.videoPrompts,
      ...prompts.bannerPrompts, ...prompts.landingPrompts, ...prompts.carouselPrompts,
    ].map((p) => ({ promptId: p.promptId, promptType: p.promptType, formula: p.formula,
      sourceStoryName: p.sourceStoryName, promptText: p.promptText })),
    audienceMarket: market,
  };
  const guardian = computeBrandGuardian(guardianInput);

  // ── Execution packages (image / video / carousel / landing) ──
  const imagePromptById = new Map(prompts.imagePrompts.map((p) => [p.promptId, p] as const));
  const videoPromptById = new Map(prompts.videoPrompts.map((p) => [p.promptId, p] as const));
  const carouselPromptById = new Map(prompts.carouselPrompts.map((p) => [p.promptId, p] as const));
  const landingPromptById = new Map(prompts.landingPrompts.map((p) => [p.promptId, p] as const));

  const imagePackages = briefs.images
    .map((b) => {
      const p = imagePromptById.get(`prompt-image-${b.briefId.replace('brief-image-', '')}`);
      return p ? composeImageExecutionPackage({ brief: b, prompt: p }) : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const videoPackages = briefs.videos
    .map((b) => {
      const p = videoPromptById.get(`prompt-video-${b.briefId.replace('brief-video-', '')}`);
      return p ? composeVideoExecutionPackage({ brief: b, prompt: p }) : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const carouselPackages = briefs.carousels
    .map((b) => {
      const p = carouselPromptById.get(`prompt-carousel-${b.briefId.replace('brief-carousel-', '')}`);
      return p ? composeCarouselExecutionPackage({ brief: b, prompt: p }) : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const landingPackages = briefs.landings
    .map((b) => {
      const p = landingPromptById.get(`prompt-landing-${b.briefId.replace('brief-landing-', '')}`);
      return p ? composeLandingExecutionPackage({ brief: b, prompt: p }) : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return NextResponse.json({
    formula, market, brandLanguage,
    briefs,
    prompts,
    guardian,
    executionPackages: {
      images: imagePackages,
      videos: videoPackages,
      carousels: carouselPackages,
      landings: landingPackages,
    },
    advisoryNotice:
      'Production studio · briefs + prompts + brand guardian + execution packages are specifications only. ' +
      'No publishing. No autonomous posting. No social execution. No auto-approval. ' +
      'Operator approval required. Human remains final authority.',
  });
}
