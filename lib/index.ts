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
// Phase 9 — temporal campaign cinema
export * from './campaignTimeline';
export * from './emotionalSequence';
export * from './worldPersistence';
export * from './objectMemoryGraph';
export * from './sceneContinuity';
export * from './visualTempo';
export * from './absenceIntelligence';
export * from './emotionalContradiction';
// Phase 10 — unified cinematic brain
export * from './unresolvedEmotion';
export * from './emotionalCompression';
export * from './subconsciousRecognition';
export * from './antiSyntheticBehavior';
export * from './cinematicBrain';
// Phase 11 — natural human chaos
export * from './lifeNoise';
export * from './humanContradiction';
export * from './nonPerformativeReality';
// Phase 12 — cultural memory engine
export * from './sharedCulturalMemory';
export * from './collectiveRecognition';
export * from './unspokenRituals';
export * from './culturalDrift';
// Phase 13 — reality pressure
export * from './realityPressure';
export * from './consequenceEngine';
export * from './invisibleStakes';
export * from './functionalCollapse';
// Phase 14 — suppressed humanity
export * from './emotionalAvoidance';
export * from './modernNumbing';
export * from './socialMasking';
export * from './unfeltEmotion';
// Phase 15 — longitudinal reality memory
export { createTruthPersistenceStore, keyOfBanner as truthPersistenceKey } from './truthPersistence';
export type { TruthPersistenceEntry, TruthPersistenceReport, TruthPersistenceStore } from './truthPersistence';
export { createCulturalTimelineStore } from './culturalTimeline';
export type { TimelineBucket as CulturalTimelineBucket, CulturalTimelinePhase, CulturalTimelineReport, CulturalTimelineStore } from './culturalTimeline';
export * from './realityVerification';
export * from './emotionalDecay';
export * from './generationPressure';
// Phase 16 — reality ingestion layer
export * from './realityIngestion';
export * from './humanSignalExtraction';
export { trackCollectiveDrift } from './collectiveDriftTracker';
export type { CollectiveDriftReport as CollectiveDriftReportV16, DriftPeriod } from './collectiveDriftTracker';
export * from './privateLanguageMap';
export * from './realityWeighting';
// Phase 17 — systemic human pressure model
export * from './systemicPressureMap';
export * from './attentionFragmentation';
export * from './modernEnvironmentSystems';
export * from './recoveryFailure';
export * from './cognitiveResidue';
