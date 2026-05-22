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
// Phase 18 — behavioral survival engine
export * from './behaviorLoopEngine';
export * from './microEscapeDetection';
export * from './ritualCompensation';
export * from './fakeRecovery';
export * from './silentCopingMechanisms';
export * from './behavioralResidue';
// Phase 19 — social masking + identity performance engine
export * from './socialMaskingEngine';
export * from './highFunctioningBurnout';
export * from './identityMaintenance';
export * from './emotionalCamouflage';
export * from './publicPrivateSplit';
export * from './maskFatigue';
// Phases 20–25 — unified human desire + ritual intelligence architecture
export * from './humanDesireMemory';
export * from './unifiedHumanGraph';
// Phase 20 — desire systems
export * from './desireArchitecture';
export * from './statusWithoutStatus';
export * from './emotionalHunger';
export * from './validationSystems';
export * from './invisibleEnvy';
export * from './aspirationalIdentityGap';
// Phase 21 — social gravity
export * from './socialGravity';
export * from './collectiveEmotionalMovement';
export * from './culturalAcceleration';
export * from './groupAnxiety';
export * from './viralEmotionPatterns';
export * from './socialPermissionStructures';
// Phase 22 — ritual attachment
export * from './ritualFormation';
export * from './attachmentLoops';
export * from './symbolicSafety';
export * from './emotionalReturnMechanics';
export * from './privateRitualMemory';
export * from './repeatedComfortSystems';
// Phase 23 — narrative self
export * from './internalNarrative';
export * from './selfStoryArchitecture';
export * from './identityContinuity';
export * from './privateMeaningSystems';
export * from './emotionalSelfTranslation';
export * from './personalMythology';
// Phase 24 — predictive human states
export * from './emotionalForecasting';
export * from './behaviorPrediction';
export * from './collapseProbability';
export * from './recoveryAttemptModel';
export * from './futurePressureTrajectory';
export * from './emotionalDriftPrediction';
// Phase 25 — autonomous campaign intelligence
export * from './autonomousNarrativeEngine';
export * from './culturalSignalEvolution';
export * from './selfUpdatingPsychology';
export * from './emergentCampaignMemory';
export * from './collectiveRealityTracking';
export * from './adaptiveEmotionalIntelligence';
// Phase 26 — unified cognitive field (the nervous system)
export * from './symbolicObjects';
export * from './worldStateSimulation';
export * from './causalMemoryGraph';
export * from './cognitiveField';
export * from './emotionalPhysics';
export * from './tensionTopology';
export * from './lifeTrajectory';
export * from './cognitiveContradictionResolver';
export * from './cognitionTrace';
export * from './selfEvolvingWorldModel';
export * from './worldStatePersistence';
// Phase 27 — persistent cognitive runtime (the living runtime layer)
export * from './runtimeIdentity';
export * from './nextRunDirective';
export * from './rejectionMemory';
export * from './approvalMemory';
export * from './runtimeMemoryStore';
export * from './runtimeDriftDetector';
export * from './cognitiveContinuityScore';
export * from './runtimeHealthMonitor';
export * from './runtimeTrace';
export * from './persistentCognitiveRuntime';
// ─── WAVE 2 — Reality Execution Architecture (Phases 28–35) ───
// Phase 28 — campaign nervous system
export * from './performancePulse';
export * from './audienceSignalState';
export * from './campaignSaturation';
export * from './emotionalFatigueMonitor';
export * from './campaignNervousSystem';
// Phase 29 — attention physics engine
export * from './scrollStopMechanics';
export * from './firstSecondRecognition';
export * from './visualInterruptionMap';
export * from './cognitiveEntryPoint';
export * from './attentionPhysics';
// Phase 30 — visual cognition layer
export * from './frameIntelligence';
export * from './emotionalGeometry';
export * from './productGravity';
export * from './visualSilence';
export * from './humanEyeFlow';
export * from './visualCognition';
// Phase 31 — emotional continuity runtime
export * from './truthFatigue';
export * from './motifDecay';
export * from './atmosphereContinuity';
export * from './emotionalArcMemory';
export * from './emotionalContinuityRuntime';
// Phase 32 — audience reality feedback loop
export * from './silentEngagementSignals';
export * from './commentRecognitionParser';
export * from './saveShareMeaning';
export * from './realityFeedbackWeighting';
export * from './audienceRealityFeedback';
// Phase 33 — anti-optimization layer
export * from './performanceCorruptionDetector';
export * from './truthVsEngagement';
export * from './algorithmicPressureShield';
export * from './viralityImmuneSystem';
export * from './antiOptimization';
// Phase 34 — identity persistence engine
export * from './brandTruthCore';
export * from './toneIntegrity';
export * from './visualIdentityMemory';
export * from './emotionalSignature';
export * from './identityPersistence';
// Phase 35 — autonomous creative direction
export * from './campaignHypothesisEngine';
export * from './emotionalStrategyPlanner';
export * from './creativeDecisionMemory';
export * from './doNotDoMemory';
export * from './autonomousCreativeDirection';
// Wave 2 — unified orchestration
export * from './realityExecutionOrchestrator';
// ─── WAVE 4 — Executive Cognition Layer (Phases 36–42) ───────
// Phase 36 — strategic priority engine
export * from './campaignPriorityScore';
export * from './realityImportanceWeight';
export * from './longTermVsShortTerm';
export * from './executiveTradeoffEngine';
export * from './cognitiveUrgencyMap';
export * from './strategicPriorityEngine';
// Phase 37 — cognitive energy management
export * from './outputFatigue';
export * from './audienceExhaustionTracker';
export * from './creativeRecoveryCycles';
export * from './emotionalOverexposure';
export * from './attentionDepletionEngine';
export * from './cognitiveEnergyModel';
// Phase 38 — temporal intelligence
export * from './attentionWindows';
export * from './psychologicalSeasonality';
export * from './culturalTimingEngine';
export * from './momentReadiness';
export * from './contextSensitivity';
export * from './temporalPsychology';
// Phase 39 — executive identity governance
export * from './brandTruthConstitution';
export * from './aestheticCorruptionMap';
export * from './identityViolationDetector';
export * from './voiceIntegrityEngine';
export * from './psychologicalBrandAnchor';
export * from './identityGovernance';
// Phase 40 — strategic campaign lifecycles
export * from './narrativeMomentum';
export * from './emotionalArcPersistence';
export * from './campaignEvolutionEngine';
export * from './campaignRetirement';
export * from './reawakeningTriggers';
export * from './campaignLifecycle';
// Phase 41 — executive decision runtime
export * from './actionSelection';
export * from './strategicConflictResolution';
export * from './cognitiveDecisionEngine';
export * from './executiveReasoningTrace';
export * from './selfGovernanceLoop';
export * from './executiveRuntime';
// Phase 42 — world-state executive brain
export * from './collectivePsychologyState';
export * from './environmentalStressMap';
export * from './socialPressureSystems';
export * from './culturalClimateModel';
export * from './worldTensionIndex';
export * from './worldStateEngine';
// ─── WAVE 5 — Autonomous Strategic Society (Phases 43–55) ─────
export * from './councilTypes';
// the eleven cognitive entities
export * from './councilStrategist';
export * from './councilIdentityGuardian';
export * from './councilCulturalAnalyst';
export * from './councilAudienceInterpreter';
export * from './councilEmotionalHistorian';
export * from './councilAttentionPhysicist';
export * from './councilRecoveryDirector';
export * from './councilAntiHypeDefender';
export * from './councilWorldStateObserver';
export * from './councilNarrativeArchitect';
export * from './councilExecutiveSynthesizer';
// Phase 43–55 — the council process
export * from './cognitiveCouncil';
export * from './internalDebateEngine';
export * from './multiAgentMemoryBias';
export * from './councilConflictResolution';
export * from './autonomousCampaignPlanning';
export * from './narrativeArcIntelligence';
export * from './silenceRestraintGovernance';
export * from './audienceInterpretationSociety';
export * from './identityDefenseCourt';
export * from './selfReflectionHypocrisy';
export * from './internalReputationSystem';
export * from './executiveConsensusRuntime';
export * from './autonomousStrategicConsciousness';
// ─── WAVE 6 — Cognitive Civilization Infrastructure (Phases 56–70) ─
export * from './civilizationArchive';
export * from './institutionalMemory';
export * from './culturalDriftEngine';
export * from './beliefPersistence';
export * from './strategicMythology';
export * from './internalReputationEconomy';
export * from './trustAuthorityGraph';
export * from './ideologicalMutationDetection';
export * from './psychologicalScarMemory';
export * from './historicalDecisionArchive';
export * from './cognitiveLawSystem';
export * from './executiveEthicsRuntime';
export * from './internalPoliticalDynamics';
export * from './autonomousLongTermPlanning';
export * from './civilizationStabilityLayer';
export * from './emergentIdentityContinuity';
// ─── WAVE 7 — Reality Organism Architecture (Phases 71–90) ────
export * from './environmentalPressureMapping';
export * from './cognitiveImmuneSystem';
export * from './strategicEnergyAllocation';
export * from './narrativeClimateDetection';
export * from './identityStressTesting';
export * from './expansionVsPreservation';
export * from './realityRhythmSynchronization';
export * from './collectiveAttentionForecasting';
export * from './memeticThreatDetection';
export * from './civilizationFatigueMonitoring';
export * from './strategicSilenceIntelligence';
export * from './emotionalResourceManagement';
export * from './adaptiveWorldStateModeling';
export * from './longHorizonPrediction';
export * from './internalComplexityRegulation';
export * from './strategicEvolutionGovernance';
export * from './realityAdaptiveRuntime';
export * from './autonomousStabilityPreservation';
export * from './existentialRiskLayer';
export * from './persistentOrganismCore';
// ─── WAVE 8 — Operating System Genesis (Phases 91–110) ────────
export * from './cognitiveKernel';
export * from './processScheduler';
export * from './interruptArchitecture';
export * from './strategicTaskQueue';
export * from './runtimeResourceAllocation';
export * from './activeCognitionGraph';
export * from './directiveEngine';
export * from './autonomousRuntimeLoops';
export * from './strategicPauseInfrastructure';
export * from './kernelHealthMonitor';
export * from './memoryPressureManagement';
export * from './multiHorizonPlanning';
export * from './recursiveReflectionEngine';
export * from './executiveArbitrationCourt';
export * from './runtimeIdentityEnforcement';
export * from './dynamicStrategicSeasons';
export * from './cognitiveDependencyMapping';
export * from './autonomousRuntimeStabilization';
export * from './persistentExecutiveState';
export * from './operatingSystemCore';
