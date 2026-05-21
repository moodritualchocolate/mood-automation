/**
 * Public taste-system entry point. Engines in src/engines/* import
 * from here so that future re-organisations stay local.
 */

export * from './referenceDNA';
export * from './referenceLoader';
export * from './tasteJudge';
export * from './humanReaction';
export * from './campaignEvolution';
export * from './visualFatigue';
// Phase 3 — campaign brain
export * from './culturalIntelligence';
export * from './campaignDecision';
export * from './campaignRhythm';
export * from './visualCourage';
export * from './antiAI';
export * from './humanMemory';
// Phase 4 — reality loop
export * from './engagementMemory';
export * from './hookSurvival';
export * from './emotionalOutcome';
export * from './aftertaste';
export * from './tasteDrift';
export * from './atmosphereConsistency';
// Phase 5 — human truth foundation
export * from './humanTruthEngine';
export * from './culturalMemory';
export * from './visualTaste';
export * from './humanVisualBehavior';
export * from './emotionalAftertaste';
export * from './campaignMemoryV2';
// Phase 7 — human perception + world continuity
export * from './atmosphericLight';
export * from './typographyPsychology';
export * from './worldContinuity';
export * from './microHumanDetails';
export * from './invisibleStory';
export * from './humanInterruption';
export * from './objectEmotionMemory';
export * from './campaignIdentity';
export * from './perceptionCritic';
// Phase 8 — visual composition intelligence
export * from './visualGravity';
export * from './negativeSpacePsychology';
export { analyzeCompositionRhythm } from './compositionRhythm';
export type { CompositionRhythmReport, RhythmInput as CompositionRhythmInput } from './compositionRhythm';
export * from './productPresence';
export * from './humanFraming';
export { direct as directLayout } from './layoutDirector';
export type {
  DirectorVerdict as LayoutDirectorVerdict,
  CompositionArchetype as LayoutCompositionArchetype,
  DirectorInput as LayoutDirectorInput,
} from './layoutDirector';
