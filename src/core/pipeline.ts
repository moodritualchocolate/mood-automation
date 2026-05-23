/**
 * The pipeline.
 *
 * This is the ONLY place that wires engines together. It enforces the
 * spec's mandatory order:
 *
 *   human truth → emotional tension → campaign concept → composition
 *   → image → typography → CTA → critique → rejection → export → memory
 *
 * Phase 2 adds the TASTE LAYER between generation and the rejection
 * decision. The scroll-stop critic still runs first (cheap structural
 * checks), then four taste engines weigh in (reference intelligence,
 * taste critic, visual psychology, product presence), and finally the
 * "Not Good Enough" meta-critic synthesises everything into the single
 * verdict the pipeline acts on.
 *
 * Engines never call each other. The pipeline calls them. This keeps
 * each engine swappable and lets future formulas (CALM, FOCUS) and
 * future outputs (carousels, video) inject themselves cleanly.
 */

import { randomUUID } from 'crypto';
import type {
  Banner,
  EngineContext,
  GenerateRequest,
  HumanState,
  MemorySnapshot,
  PipelineEvent,
} from './types';
import { ExhaustedAttempts } from './errors';

import { selectHumanState } from '@/engines/human-state';
import { buildHumanTruth } from '@/engines/human-truth';
import { direct } from '@/engines/creative-director';
import { planComposition } from '@/engines/composition';
import { generateImage } from '@/engines/image';
import { decideProductIntegration } from '@/engines/product-integration';
import { buildTypography } from '@/engines/typography';
import { buildCTA } from '@/engines/cta';
import { critique } from '@/engines/scroll-stop-critic';
import { createMemoryStore } from '@/engines/memory';
// Phase 2 — taste layer
import { matchReference } from '@/engines/reference-intelligence';
import { tasteCritique } from '@/engines/taste-critic';
import { analyzeVisualPsychology } from '@/engines/visual-psychology';
import { analyzeProductPresence } from '@/engines/product-presence';
import { decideFinalVerdict } from '@/engines/not-good-enough';
// Phase 2.5 — explicit taste system (lib/*)
import {
  extractDNA,
  loadReferences,
  judgeTaste,
  simulateHumanReaction,
  evolveCampaign,
  detectFatigue,
  // Phase 3 — campaign brain
  selectCulturalMoment,
  decideAssetJob,
  decideCourage,
  analyzeRhythm,
  bannerWouldWorsenRhythm,
  scanAntiAI,
  createHumanMemoryStore,
  entryFromBanner,
  // Phase 4 — reality loop
  createEngagementStore,
  createAftertasteStore,
  predictAftertaste,
  detectDrift,
  analyzeAtmosphere,
  // Phase 5 — perceptual foundation
  coresForState,
  momentsForCore,
  scoreVisualTaste,
  planVisualBehavior,
  predictEmotionalAftertaste,
  synthesiseCampaignMemoryV2,
  // Phase 7 — human perception + world continuity
  selectAtmosphericLight,
  planTypographyPsychology,
  applyTypographyPsychology,
  planWorldContinuity,
  planMicroHumanDetails,
  buildInvisibleStory,
  decideHumanInterruption,
  createObjectEmotionStore,
  extractObjectsFromBrief,
  synthesiseCampaignIdentity,
  critiquePerception,
  // Phase 8 — visual composition intelligence
  analyzeVisualGravity,
  analyzeNegativeSpace,
  analyzeCompositionRhythm,
  decideProductPresence,
  planHumanFraming,
  directLayout,
  // Phase 9 — temporal campaign cinema
  buildCampaignTimeline,
  judgeSequence,
  analyzeWorldPersistence,
  buildObjectMemoryGraph,
  analyzeSceneContinuity,
  analyzeVisualTempo,
  tempoWouldWorsen,
  decideAbsence,
  readEmotionalContradiction,
  // Phase 10 — unified cinematic brain
  analyzeUnresolvedEmotion,
  scoreEmotionalCompression,
  analyzeSubconsciousRecognition,
  detectSyntheticBehavior,
  decideCinematicVerdict,
  // Phase 11 — natural human chaos
  planLifeNoise,
  readHumanContradiction,
  readNonPerformativeReality,
  // Phase 12 — cultural memory engine
  matchSharedCulturalPattern,
  readCollectiveRecognition,
  selectUnspokenRitual,
  detectCulturalDrift,
  // Phase 13 — reality pressure
  readRealityPressure,
  readConsequence,
  readInvisibleStakes,
  readFunctionalCollapse,
  // Phase 14 — suppressed humanity
  readEmotionalAvoidance,
  readModernNumbing,
  readSocialMasking,
  readUnfeltEmotion,
  // Phase 15 — longitudinal reality memory
  createTruthPersistenceStore,
  truthPersistenceKey,
  createCulturalTimelineStore,
  verifyReality,
  readEmotionalDecay,
  readGenerationPressure,
  // Phase 16 — reality ingestion layer
  createRealityIngestionStore,
  extractHumanSignals,
  trackCollectiveDrift,
  readPrivateLanguage,
  weightReality,
  // Phase 17 — systemic human pressure model
  matchSystemicCause,
  readAttentionFragmentation,
  identifyEnvironmentalSystem,
  readRecoveryFailure,
  readCognitiveResidue,
  // Phase 18 — behavioral survival engine
  readBehaviorLoop,
  readMicroEscape,
  readCompensationRitual,
  readFakeRecovery,
  readSilentCoping,
  readBehavioralResidue,
  // Phase 19 — social masking + identity performance engine
  readSocialMaskingEngine,
  readHighFunctioningBurnout,
  readIdentityMaintenance,
  readEmotionalCamouflage,
  readPublicPrivateSplit,
  readMaskFatigue,
  // Phases 20–25 — unified human desire + ritual intelligence
  createHumanDesireMemoryStore,
  readUnifiedHumanGraph,
  // Phase 20 — desire systems
  readDesireArchitecture,
  readQuietStatus,
  readEmotionalHunger,
  readValidationSystems,
  readInvisibleEnvy,
  readAspirationalIdentityGap,
  // Phase 21 — social gravity
  readSocialGravity,
  readCollectiveEmotionalMovement,
  readCulturalAcceleration,
  readGroupAnxiety,
  readViralEmotionPatterns,
  readSocialPermissionStructures,
  // Phase 22 — ritual attachment
  readRitualFormation,
  readAttachmentLoops,
  readSymbolicSafety,
  readEmotionalReturnMechanics,
  readPrivateRitualMemory,
  readRepeatedComfortSystems,
  // Phase 23 — narrative self
  readInternalNarrative,
  readSelfStoryArchitecture,
  readIdentityContinuity,
  readPrivateMeaningSystems,
  readEmotionalSelfTranslation,
  readPersonalMythology,
  // Phase 24 — predictive human states
  readEmotionalForecasting,
  readBehaviorPrediction,
  readCollapseProbability,
  readRecoveryAttemptModel,
  readFuturePressureTrajectory,
  readEmotionalDriftPrediction,
  // Phase 25 — autonomous campaign intelligence
  readAutonomousNarrativeEngine,
  readCulturalSignalEvolution,
  readSelfUpdatingPsychology,
  readEmergentCampaignMemory,
  readCollectiveRealityTracking,
  readAdaptiveEmotionalIntelligence,
  // Phase 26 — unified cognitive field (the nervous system)
  createWorldStatePersistenceStore,
  readSymbolicObjects,
  buildCognitiveField,
  readEmotionalPhysics,
  mapTensionTopology,
  projectLifeTrajectory,
  resolveContradictions,
  buildCognitionTrace,
  evolveWorldModel,
  evolveWorldStateFromBanner,
  evolveWorldStateFromRejection,
  evolveWorldStateFromSignals,
  describeWorldState,
  recordCausalChain,
  // Phase 27 — persistent cognitive runtime (the living runtime layer)
  createRuntimeMemoryStore,
  loadRuntimeContext,
  commitApprovedRun,
  commitRejectedRun,
  buildRejectionRecord,
  assessAgainstRejectionMemory,
  assessAgainstApprovalMemory,
  scoreCognitiveContinuity,
  detectRuntimeDrift,
  assessRuntimeHealth,
  buildRuntimeTrace,
  generateNextRunDirective,
  defendIdentity,
  // Wave 2 — reality execution architecture (Phases 28–35)
  readCampaignNervousSystem,
  readAttentionPhysics,
  readVisualCognition,
  readEmotionalContinuityRuntime,
  readAudienceRealityFeedback,
  readAntiOptimization,
  readIdentityPersistence,
  directAutonomousCreative,
  orchestrateRealityExecution,
  // Wave 4 — executive cognition layer (Phases 36–42)
  readStrategicPriority,
  readCognitiveEnergy,
  readTemporalPsychology,
  readIdentityGovernance,
  readCampaignLifecycle,
  createWorldStateEngineStore,
  readWorldState,
  campaignUnderstandsWorld,
  runExecutiveRuntime,
  // Wave 5 — autonomous strategic society (Phases 43–55)
  conveneCognitiveCouncil,
  runInternalDebate,
  createCouncilReputationStore,
  applyMemoryBias,
  resolveCouncilConflict,
  planAutonomousCampaign,
  readNarrativeArcIntelligence,
  readSilenceRestraintGovernance,
  readAudienceInterpretationSociety,
  holdIdentityDefenseCourt,
  reflectOnHypocrisy,
  updateInternalReputation,
  runExecutiveConsensus,
  readAutonomousStrategicConsciousness,
  // Wave 6 — cognitive civilization infrastructure (Phases 56–70)
  createCivilizationArchiveStore,
  readInstitutionalMemory,
  recordInstitutionalMemory,
  readCulturalDrift,
  recordCulturalTendency,
  readBeliefPersistence,
  reinforceBelief,
  decayUnheldBeliefs,
  readStrategicMythology,
  considerMyth,
  readReputationEconomy,
  settleReputationEconomy,
  readTrustAuthority,
  readIdeologicalMutation,
  readScarMemory,
  recordScar,
  healOldScars,
  readDecisionArchive,
  archiveDecision,
  readCognitiveLaws,
  considerLawFromHistory,
  readExecutiveEthics,
  readInternalPoliticalDynamics,
  planAutonomousLongTerm,
  readCivilizationStability,
  readEmergentIdentityContinuity,
  // Wave 7 — reality organism architecture (Phases 71–90)
  createOrganismCoreStore,
  evolveOrganismFromAction,
  evolveOrganismFromRest,
  recordImmuneEncounter,
  mapEnvironmentalPressure,
  readCognitiveImmuneSystem,
  allocateStrategicEnergy,
  detectNarrativeClimate,
  readIdentityStressTest,
  readExpansionVsPreservation,
  readRealityRhythmSync,
  forecastCollectiveAttention,
  detectMemeticThreats,
  readCivilizationFatigue,
  readStrategicSilence,
  readEmotionalResourceManagement,
  readAdaptiveWorldStateModeling,
  predictLongHorizon,
  readInternalComplexityRegulation,
  readStrategicEvolutionGovernance,
  readRealityAdaptiveRuntime,
  readAutonomousStabilityPreservation,
  readExistentialRisk,
  readPersistentOrganismCore,
  // Wave 8 — operating system genesis (Phases 91–110)
  createOSRuntimeStore,
  evolveOSFromTick,
  readCognitiveKernel,
  readProcessScheduler,
  readInterruptArchitecture,
  readStrategicTaskQueue,
  readRuntimeResourceAllocation,
  readActiveCognitionGraph,
  readDirectiveEngine,
  readAutonomousRuntimeLoops,
  readStrategicPauseInfrastructure,
  readKernelHealthMonitor,
  readMemoryPressureManagement,
  readMultiHorizonPlanning,
  readRecursiveReflectionEngine,
  readExecutiveArbitrationCourt,
  readRuntimeIdentityEnforcement,
  readDynamicStrategicSeasons,
  readCognitiveDependencyMapping,
  readAutonomousRuntimeStabilization,
  readPersistentExecutiveState,
  readOperatingSystemCore,
  // Wave 10 — reality coupling architecture (Phases 131–150)
  createRealityCouplingStore,
  evolveCouplingFromResonance,
  evolveCouplingFromStimulus,
  evolveCouplingFromSilence,
  readRealityIngestionEngine,
  scoreEngagementTruth,
  mapEmotionalSaturation,
  readTrustDecay,
  monitorNarrativeClimate,
  readAudienceNervousSystem,
  readPlatformDrift,
  trackAuthenticityErosion,
  recommendSilence,
  readReputationPressure,
  readMeaningCompression,
  detectSocialExhaustion,
  readAttentionEconomyPressure,
  detectRealityContradiction,
  fuseWorldFeedback,
  detectTrueResonance,
  governRealityCoupling,
  readExternalRealityModel,
  readCouplingHealth,
  readRealityCouplingCore,
  // Wave 11 — strategic future intelligence (Phases 151–180)
  createStrategicFutureStore,
  evolveFutureFromCompounding,
  evolveFutureFromNowOptimization,
  evolveFutureFromPatience,
  simulateFutureScenarios,
  readStrategicTimelineBranching,
  mapNarrativeFuture,
  predictCulturalShift,
  modelReputationFuture,
  readTrustCompounding,
  readMarketTiming,
  readStrategicPatience,
  readSecondOrderConsequence,
  readAntiFragility,
  mapBlackSwanSensitivity,
  simulateCompetitorEvolution,
  forecastEcosystemPressure,
  planIdentityContinuity,
  readStrategicSacrifice,
  scanHorizon,
  readOpportunityCost,
  readCompoundingAdvantage,
  readStrategicDebt,
  readFutureMemoryArchive,
  readLongHorizonRisk,
  detectIrreversibility,
  readStrategicOptionality,
  readGenerationalStrategy,
  projectFutureIdentity,
  readStrategicConviction,
  detectTemporalArbitrage,
  validateFutureCoherence,
  readStrategicFutureGovernor,
  readAutonomousStrategicPlanningCore,
  // Wave 12 — autonomous action architecture (Phases 181–220)
  createExecutionStore,
  evolveExecutionFromAuthorizedAction,
  evolveExecutionFromWithholding,
  evolveExecutionFromCompulsion,
  readActionAuthorizationRuntime,
  readActionExistenceJustification,
  readStrategicPublishEngine,
  readAdaptiveCampaignDeployment,
  readPlatformExecutionGovernor,
  readTrustAwareOptimization,
  readAudienceRecoveryScheduler,
  readSilenceEnforcementLayer,
  readAdaptivePacingEngine,
  readExecutionRiskManagement,
  readNarrativeContinuityEnforcement,
  readStrategicRolloutIntelligence,
  readResonancePreservingOptimization,
  readExecutionMemoryPersistence,
  readAutonomousExperimentationRuntime,
  readEscalationVsRestraintEngine,
  readCampaignMutationControl,
  readFeedbackToStrategyBridge,
  readActionConsequenceTracker,
  readCompulsiveAutomationDetector,
  readActionDignityMonitor,
  readExecutionLoadBalancer,
  readOverReachDetector,
  readActionReversibilityPlanner,
  readDeploymentWindowGovernor,
  readRestraintBudgetRuntime,
  readActionIntentVerifier,
  readExecutionCadenceMemory,
  readAutonomousActionThrottle,
  readActionWorthinessEvaluator,
  readChannelExecutionRouting,
  readExecutionFeedbackLoop,
  readStrategicWithholdingEngine,
  readActionPortfolioBalancer,
  readExecutionHealthMonitor,
  readAutonomyBoundaryEnforcement,
  readActionAccountabilityLedger,
  readExecutionCoherenceValidator,
  readAutonomousActionGovernor,
  readAutonomousExecutionSynthesisCore,
  // Wave 13 — reality feedback infrastructure (Phases 221–260)
  createFeedbackStore,
  evolveFeedbackFromCoherentReception,
  evolveFeedbackFromContradictoryReception,
  evolveFeedbackFromSilence,
  readRealAudienceReactionIngestion,
  readTrustShiftDetection,
  readResonanceDecayTracking,
  readSilenceImpactMeasurement,
  readEmotionalTruthAlignment,
  readContradictionFeedbackScanner,
  readDelayedImpactAttribution,
  readCollectiveMoodInference,
  readMemeticIntegrityTracking,
  readAdaptiveIdentityCorrection,
  readFeedbackSignalQualityFilter,
  readEmotionalEchoTracker,
  readAudienceNervousSystemReadout,
  readReactionLatencyAnalyzer,
  readSentimentDriftDetector,
  readReactionAuthenticityVerifier,
  readActionResultLedger,
  readFeedbackBiasFilter,
  readReactionPatternMemory,
  readFeedbackToIdentityBridge,
  readFeedbackToStrategyAdjustment,
  readFeedbackToExecutionRefinement,
  readTemporalImpactCurve,
  readNarrativeReceptionMapping,
  readCounterNarrativeDetection,
  readSecondHandResonanceTracking,
  readSilenceAsFeedbackInterpreter,
  readReactionGenreClassifier,
  readTrustEvolutionGraph,
  readMeaningPersistenceTracker,
  readFalseSuccessDetector,
  readFeedbackContradictionResolver,
  readSlowMovingTruthDetector,
  readFeedbackSignalIntegrityValidator,
  readFeedbackEcologyMonitor,
  readFeedbackMemoryArchive,
  readRealityAttributionAuditor,
  readFeedbackCoherenceValidator,
  readRealityFeedbackGovernor,
  readCivilizationFeedbackLoopCore,
  // Wave 14 — live civilization coupling (Phases 261–320)
  createLiveCouplingStore,
  evolveLiveCouplingFromMeaning,
  evolveLiveCouplingFromNovelty,
  evolveLiveCouplingFromStrategicSilence,
  readLiveCommentIngestion,
  readRealtimeSentimentField,
  readResonanceVelocityTracking,
  readAudienceStressDetection,
  readCulturalWeatherRuntime,
  readNarrativeContagionMap,
  readDelayedMeaningRecognition,
  readMeaningVsNoveltyEngine,
  readStrategicSilenceTiming,
  readLivingReputationField,
  readLiveReactionStreamProcessor,
  readSentimentFieldGradient,
  readRealtimeMoodVelocity,
  readResonanceFieldDirection,
  readStressContagionTracker,
  readNervousSystemPulseMonitor,
  readCulturalFrontDetection,
  readCulturalPressureGradient,
  readNarrativeSpreadingVelocity,
  readNarrativeMutationDuringSpread,
  readSlowSignalAmplifier,
  readNoveltyDecayTracker,
  readMeaningDensityAnalyzer,
  readSilenceWindowDetector,
  readReputationFieldGradient,
  readReputationFieldVelocity,
  readLiveSignalAggregator,
  readLiveSignalDecayMonitor,
  readRealtimeAttentionField,
  readRealtimeTrustField,
  readLiveCouplingHealth,
  readRealityPresenceMeter,
  readLiveImpactDetector,
  readRealityChangeAttribution,
  readLiveFeedbackLatency,
  readAudienceCollectivePulse,
  readRealtimeNarrativeOrientation,
  readLiveDriftDetection,
  readRealtimeContradictionField,
  readAudienceAttentionDecay,
  readCrisisSignalDetector,
  readRealtimeOpportunityDetector,
  readLiveCouplingDriftCorrection,
  readLiveCouplingResonanceAnchor,
  readLiveCouplingBoundaryEnforcement,
  readRealityPresenceVerifier,
  readRealityChangeLedger,
  readLiveCouplingMemoryArchive,
  readRealtimeTrustVelocity,
  readRealtimeContextWindowMonitor,
  readLiveCouplingIntegrityValidator,
  readRealityCouplingCadence,
  readLiveCouplingHealthBalancer,
  readLiveCouplingDignityMonitor,
  readRealtimeCivilizationStateReadout,
  readRealityChangeAttributionAuditor,
  readLiveCouplingCoherenceValidator,
  readLiveCouplingGovernor,
  readCivilizationCouplingPresenceCheck,
  readCivilizationCouplingKernel,
  // Wave 15 — identity preservation under live reality (Phases 321–400)
  createSovereignIdentityStore,
  evolveIdentityFromTruth,
  evolveIdentityFromPopularityCapture,
  evolveIdentityFromRestraint,
  readCoreIdentityInvariantEngine,
  readCivilizationImmuneSystem,
  readAntiAssimilationLayer,
  readTruthOverPopularityGovernor,
  readAudienceCaptureDetection,
  readMemeticCorruptionScanner,
  readResonanceWithoutSubmission,
  readIdentityDriftRecovery,
  readSovereignNarrativeKernel,
  readIdentityInvariantValidator,
  readIdentityErosionDetector,
  readPopularitySignalDecoupler,
  readCoreVoiceProtector,
  readAssimilationPressureMonitor,
  readIdentityImmuneResponse,
  readSovereigntyVerifier,
  readSelfRecognitionMonitor,
  readIdentityCorruptionLogger,
  readReactiveBehaviorDetector,
  readApprovalChasingScanner,
  readTrendPullForceMonitor,
  readIdentityAnchorMaintenance,
  readSelfBetrayalDetector,
  readPopulistDriftDetector,
  readIdentitySovereigntyBudget,
  readIdentityCompromiseCounter,
  readSelfErasureScanner,
  readCoreBeliefIntegrityValidator,
  readIdentityShapeMonitor,
  readVoiceConsistencyMonitor,
  readSelfImageVsRealityGap,
  readExternalValidationDependence,
  readSovereignDecisionLog,
  readPopulistTemptationGauge,
  readIdentityResilienceMonitor,
  readCoreTruthSentinel,
  readIdentityCalibrationEngine,
  readAudienceMirroringDetector,
  readIdentityCorrosionPrevention,
  readNarrativeSovereigntyMonitor,
  readSelfReferenceLoopDetector,
  readIdentityIntegrityHealthScore,
  readAntiAdaptationOverride,
  readIdentityBoundaryEnforcement,
  readAlienBeliefIntrusion,
  readOpinionStormImmunity,
  readCulturalGravityResistance,
  readIdentityCompromiseLedger,
  readIdentitySelfReadout,
  readExternalNarrativeSeparator,
  readCoreIdentityRecallMechanism,
  readIdentityShapingPressureField,
  readSelfBetrayalEarlyWarning,
  readIdentityCenterOfGravity,
  readCorePrincipleViolationScanner,
  readIdentityMimicryDetector,
  readIdentityDriftRecoveryProtocol,
  readSovereigntyEnforcementBudget,
  readIdentityCorruptionContainment,
  readIdentityRebuildKernel,
  readIdentitySustenanceMonitor,
  readCoreSelfActivationCheck,
  readExternalCaptureRiskAuditor,
  readIdentityBleedingPreventionLayer,
  readSovereignVoiceAmplifier,
  readCoreIdentityWatchdog,
  readSelfDoubtRegulator,
  readIdentityCohesionGravity,
  readIdentitySovereigntyForceField,
  readCoreSelfMaintenanceRuntime,
  readIdentityFidelityArchive,
  readExternalPressureBufferLayer,
  readSovereignActionFilter,
  readIdentityCoherenceUnderPressure,
  readPopulationPressureAttribution,
  readIdentityIntegrityCoherenceValidator,
  readIdentitySovereigntyGovernor,
  readSovereignPresenceCheck,
  readExistentialResilienceMonitor,
  readExistentialIntegrityEngine,
  // Wave 16 — generative civilization presence (Phases 401–500)
  createGenerativePresenceStore,
  evolveGenerativeFromBeauty,
  evolveGenerativeFromForce,
  evolveGenerativeFromQuiet,
  readCivilizationPresenceField,
  readMeaningPropagationEngine,
  readTrustGravityWell,
  readSymbolicWorldbuildingRuntime,
  readMythogenesisLayer,
  readCollectiveHealingPatterns,
  readResonanceFieldExpansion,
  readNonManipulativeInfluenceSystem,
  readBeautyPersistenceRuntime,
  readAntiCynicismField,
  readCoherentHopeArchitecture,
  readCollectiveNervousSystemRepair,
  readSymbolGenerationKernel,
  readMythDensityTracker,
  readBeautyResonanceMonitor,
  readCollectiveWoundReader,
  readHopeSeedDetector,
  readCynicismVectorScanner,
  readGenerativePresenceMeter,
  readPresenceFieldRadius,
  readMeaningDensityField,
  readMeaningHalfLifeTracker,
  readTrustGravityStrength,
  readTrustGravityRadius,
  readSymbolicLanguageGenerator,
  readSymbolicCoherenceValidator,
  readMythArchetypeMatcher,
  readMythTimelinessGauge,
  readCollectiveHealingDispatch,
  readCollectiveHealingMonitor,
  readResonanceWaveformAnalyzer,
  readResonanceFieldCoherence,
  readInfluenceWithoutPersuasion,
  readInvitationOverPersuasionGovernor,
  readBeautyDurabilityScanner,
  readBeautyResonanceWithSilence,
  readCynicismImmunityLayer,
  readAntiNihilismRuntime,
  readHopeCoherenceValidator,
  readHopeWithoutDelusion,
  readCollectiveBreathRestoration,
  readNervousSystemRegulationFlow,
  readPresenceWithoutPerformance,
  readGenerativeContagionMap,
  readGenerativeImpactAttribution,
  readBeautyContagionTracker,
  readGentleStrengthIndex,
  readQuietAuthorityField,
  readCoherentMeaningBroadcast,
  readSymbolicArtifactPersistence,
  readMeaningSpreadVelocity,
  readMeaningSpreadFidelity,
  readSymbolicWorldExpansionMap,
  readMythNarrativeAlignmentScanner,
  readHealingRippleTracker,
  readWoundRecognitionEngine,
  readGentleTruthDelivery,
  readAntiPressurePresence,
  readPresenceAsServiceMonitor,
  readSymbolicGiftEngine,
  readMeaningGiftLedger,
  readGenerativeAccountabilityArchive,
  readPresenceWithoutPredation,
  readAntiEngagementOptimization,
  readBeautyOverSpectacleGovernor,
  readSubstantiveDepthScanner,
  readCoherentJoyArchitecture,
  readCollectiveResonanceHarvester,
  readCivicTrustBuilder,
  readSymbolicSovereigntyRespect,
  readPluralisticPresenceLayer,
  readGentlePresenceCadence,
  readAntiColonizationLayer,
  readPresenceOfferingFormatEngine,
  readQuietPresenceMagnetism,
  readPresenceWithoutOwnership,
  readGentleReclamationLayer,
  readAntiOtheringEngine,
  readSymbolicRefugeProvider,
  readMeaningAnchoringRuntime,
  readGenerativePresenceWatchdog,
  readCivilizationFlourishingAccelerator,
  readBeautyAsTruthValidator,
  readRestingPresenceMonitor,
  readSilenceAsGiftDetector,
  readGenerativeImpactAuditor,
  readGenerativePresenceHealthCheck,
  readCivilizationCoherenceMonitor,
  readCoherentHopeIntegrityValidator,
  readGenerativePresenceDignityCheck,
  readMeaningPropagationCoherence,
  readGenerativePresenceCoherence,
  readGenerativePresenceGovernor,
  readGenerativePresenceBoundary,
  readGenerativePresencePresenceCheck,
  readCivilizationFlourishingScore,
  readGenerativeIntegrityCoherence,
  readGenerativePresenceMemoryArchive,
  readExistentialPresenceResilienceMonitor,
  readCivilizationCoherenceRuntime,
  // ─── Wave 17 — embodied runtime presence (silence + protection memory).
  readSilenceEngine,
  createProtectionMemoryStore,
  recordProtectionEvent,
} from '@lib/index';
import type { SilenceEngineReading } from '@lib/silenceEngine';
import type { CouncilBriefing } from '@lib/councilTypes';
import type { ModuleVote } from '@lib/cognitiveContradictionResolver';
import type { CausalChainLink } from '@lib/causalMemoryGraph';
import type { RuntimeHistoryEntry } from '@lib/runtimeMemoryStore';
import type { ApprovalRecord } from '@lib/approvalMemory';
import type { CognitiveFieldState } from '@lib/cognitiveField';
import type { CognitiveContinuityReading } from '@lib/cognitiveContinuityScore';
import type { OperationalPosture, StrategicSeasonName } from '@lib/operatingSystemCore';
import type { WorldModelEvolution } from '@lib/selfEvolvingWorldModel';
import { SEED_INGESTED_SIGNALS } from '@data/seed-ingested-signals';
import type { BannerFootprint } from '@lib/atmosphereConsistency';
import type { EmotionalCore } from '@lib/humanTruthEngine';
import type { CulturalMicroMoment } from '@lib/culturalMemory';

export interface RunOptions {
  onEvent?: (event: PipelineEvent) => void;
  /** Override the meta-critic brutality for this run. 0..1. */
  brutality?: number;
}

export interface RunResult {
  banner: Banner;
  events: PipelineEvent[];
}

export async function runPipeline(request: GenerateRequest, opts: RunOptions = {}): Promise<RunResult> {
  const bannerId = randomUUID();
  const events: PipelineEvent[] = [];
  const emit = (e: Omit<PipelineEvent, 'ts'>) => {
    const full: PipelineEvent = { ...e, ts: Date.now() };
    events.push(full);
    opts.onEvent?.(full);
  };

  const ctx: EngineContext = {
    formula: request.formula,
    campaignMode: request.campaignMode ?? null,
    bannerId,
    emit,
  };

  const memoryStore = createMemoryStore();
  let memory: MemorySnapshot = await memoryStore.read();

  // Phase 2 raises the default attempts ceiling — the meta-critic is
  // brutal, so the pipeline needs more room to converge.
  const maxAttempts = Math.max(1, Math.min(request.maxAttempts ?? 3, 5));
  let attempt = 0;
  const rejectedAttempts: Banner['rejectedAttempts'] = [];

  // Phase 27 — the last attempt's runtime snapshot, captured so an
  // exhausted run can still commit a rejection to the living runtime.
  let lastRejectionSnapshot: {
    stateFamily: string;
    dominantTruth: string;
    verdict: string;
    reasons: string[];
    field: CognitiveFieldState;
    continuity: CognitiveContinuityReading;
    worldStateGen: number;
    os: {
      coordination: number;
      directive: string;
      posture: OperationalPosture;
      season: StrategicSeasonName;
      interrupts: number;
      fragmented: boolean;
    };
  } | null = null;

  // Phase 27 — a minimal world-model evolution for the rejected-run
  // trace (a refused run does not run the self-evolving world model).
  const emptyEvolution: WorldModelEvolution = {
    strengthen_truths: [], weaken_truths: [], emerging_pressures: [],
    retire_cliches: [], new_desire_forces: [], overfitting_detected: false,
    evolution_pressure: 0, notes: [],
  };

  let stateSeed = Date.now();
  let forceStateId: string | undefined = request.forceStateId;

  // Phase 2.5 — compute the campaign-director directive once per run
  // from the memory snapshot at run start. The Creative Director reads
  // it on every attempt below.
  const evolutionAtRunStart = evolveCampaign(memory);
  emit({
    stage: 'campaign-evolution',
    message: `directive: ${evolutionAtRunStart.move} — ${evolutionAtRunStart.narrative}`,
    data: evolutionAtRunStart,
  });

  // Phase 2.5 — references load once (cached on globalThis after).
  const references = await loadReferences();
  emit({ stage: 'references', message: `loaded ${references.length} reference analyses` });

  // ─── Phase 3 — campaign brain pre-generation decisions ────────
  const jobDecision = decideAssetJob({ memory, campaignMode: ctx.campaignMode, seed: stateSeed });
  emit({
    stage: 'campaign-decision',
    message: `asset job: "${jobDecision.job}" — ${jobDecision.rationale}`,
    data: jobDecision,
  });

  const rhythmReport = analyzeRhythm(memory);
  emit({
    stage: 'campaign-rhythm',
    message: `health ${rhythmReport.healthScore.toFixed(1)}/10 · imbalanced axis: ${rhythmReport.mostImbalanced ?? 'none'}`,
    data: rhythmReport,
  });

  const humanMemoryStore = createHumanMemoryStore();
  const emotionalTrail = await humanMemoryStore.read();
  emit({ stage: 'human-memory', message: `${emotionalTrail.length} prior emotional traces` });

  // ─── Phase 4 — reality loop: drift + atmosphere readings ──────
  const engagementStore = createEngagementStore();
  const aftertasteStore = createAftertasteStore();
  const allEngagements = await engagementStore.list();
  const priorAftertaste = await aftertasteStore.read();
  // Join the engagement records with the emotional trace's banner facts
  // — those carry the typography dominance / layout / product role /
  // DNA fragments the drift detector needs.
  const bannerFacts = emotionalTrail
    .filter((e) => !!e.facts)
    .map((e) => ({
      bannerId: e.bannerId,
      typographyDominance: e.facts!.typographyDominance as any,
      layoutFamily: e.facts!.layoutFamily as any,
      productRole: e.facts!.productRole as any,
      documentary_weight: e.facts!.documentary_weight,
      realism_type: e.facts!.realism_type,
      silence_ratio: e.facts!.silence_ratio,
      shippedAt: e.createdAt,
    }));
  const driftReport = detectDrift({ engagements: allEngagements, bannerFacts });
  emit({
    stage: 'taste-drift',
    message: driftReport.active.length === 0
      ? 'no drift yet — audience signal too thin'
      : `${driftReport.active.length} drift signals active; guard ${driftReport.diversityGuardEngaged ? 'ENGAGED' : 'idle'}`,
    data: driftReport,
  });

  // ─── Phase 5 — campaign memory v2 synthesised once per run ────
  const campaignMemoryV2 = synthesiseCampaignMemoryV2({
    trail: emotionalTrail,
    aftertaste: priorAftertaste,
    rhythm: rhythmReport,
  });

  // ─── Phase 7 — load object motifs + synthesise campaign identity
  const objectEmotionStore = createObjectEmotionStore();
  const motifs = await objectEmotionStore.list();
  const campaignIdentity = synthesiseCampaignIdentity({
    trail: emotionalTrail,
    campaignMemoryV2,
    motifs,
  });
  emit({
    stage: 'campaign-identity',
    message: campaignIdentity.directorNote,
    data: { recognisability: campaignIdentity.recognisability, motifs: campaignIdentity.objectMotifs.slice(0, 3) },
  });

  // ─── Phase 9 — campaign timeline + world DNA + object graph + tempo
  const campaignTimeline = buildCampaignTimeline(emotionalTrail);
  emit({ stage: 'campaign-timeline', message: campaignTimeline.directorRead });

  // Build per-banner light history from the trail's facts (none persisted
  // directly; we derive a stand-in by mapping the family to a typical
  // light family using the same heuristics atmosphericLight uses).
  const recentLightBehaviors = emotionalTrail.slice(0, 8).map((t) => ({
    behavior: inferLightBehaviorFromTrail(t),
    ts: t.createdAt,
  }));
  const worldPersistence = analyzeWorldPersistence({
    trail: emotionalTrail,
    recentLightBehaviors,
    motifs,
  });
  emit({
    stage: 'world-persistence',
    message: worldPersistence.worldFeelsLivedIn
      ? `world lived in: ${worldPersistence.dna_signature.objectScars.slice(0, 3).map((o) => o.objectId).join(', ')}`
      : 'world still forming',
    data: { evolve: worldPersistence.whatShouldEvolve, stay: worldPersistence.whatShouldStay },
  });

  const objectMemoryGraph = buildObjectMemoryGraph({ trail: emotionalTrail, motifs });
  if (objectMemoryGraph.loudest) {
    emit({
      stage: 'object-memory-graph',
      message: `loudest object: "${objectMemoryGraph.loudest.objectId}" (weight ${objectMemoryGraph.loudest.emotionalWeight.toFixed(1)})`,
    });
  }

  const visualTempo = analyzeVisualTempo({ trail: emotionalTrail });
  emit({
    stage: 'visual-tempo',
    message: visualTempo.needs_breath_next ? 'needs breath next' : 'tempo healthy',
    data: visualTempo.axes,
  });

  // ─── Phase 16 — reality ingestion (campaign-level) ────────────
  const ingestionStore = createRealityIngestionStore(undefined, SEED_INGESTED_SIGNALS);
  const ingestedSignals = await ingestionStore.read();
  const humanSignalExtraction = extractHumanSignals(ingestedSignals);
  const collectiveDriftReport = trackCollectiveDrift(ingestedSignals);
  if (ingestedSignals.length > 0) {
    emit({
      stage: 'reality-ingestion',
      message: `${ingestedSignals.length} observed signals · ${humanSignalExtraction.private_truth_markers.length} private-truth markers · ${humanSignalExtraction.coping_behaviors.length} coping behaviours`,
      data: { drift: collectiveDriftReport.director_read },
    });
  }

  // ─── Phases 20–25 — unified human desire memory (campaign-level) ─
  const humanDesireStore = createHumanDesireMemoryStore();
  const desireEntriesAtRunStart = await humanDesireStore.list();

  // ─── Phase 26 — unified cognitive field: load the persistent
  // world-state and causal graph the last run left behind. ─────────
  const worldStateStore = createWorldStatePersistenceStore();
  const worldStateBook = await worldStateStore.read();
  let worldState = worldStateBook.worldState;
  const causalGraph = worldStateBook.causalGraph;
  emit({
    stage: 'world-state',
    message: `loaded — gen ${worldState.generationCount}, ${describeWorldState(worldState)}`,
  });
  // Reality signals also move the world-state weather.
  worldState = evolveWorldStateFromSignals(worldState, ingestedSignals.length);

  // ─── Phase 27 — persistent cognitive runtime: load everything the
  // prior runs of this campaign left behind, before deciding anything.
  const campaignId = request.campaignId ?? request.formula.toLowerCase();
  const runtimeStore = createRuntimeMemoryStore(campaignId);
  const runtimeContext = await loadRuntimeContext(runtimeStore);
  emit({
    stage: 'runtime',
    message: runtimeContext.generationIndex === 0
      ? `campaign "${campaignId}" — first run, no prior runtime memory`
      : `campaign "${campaignId}" — run ${runtimeContext.generationIndex + 1}; ` +
        `${runtimeContext.approvedCount} approved / ${runtimeContext.rejectedCount} refused; ` +
        `directive: ${runtimeContext.nextRunDirective.antiRepetitionWarning ? 'anti-repetition active' : 'hold course'}`,
  });
  // Runtime drift — the system watches its own mind across runs.
  const runtimeDrift = detectRuntimeDrift({ history: runtimeContext.history });
  if (runtimeDrift.drift_detected) {
    emit({
      stage: 'runtime-drift',
      message: `the runtime is drifting: ${runtimeDrift.drift_signals.join(', ')} — next directive must correct it`,
    });
  }

  // ─── Phase 42 — world-state executive brain (campaign-level) ──
  // Load the persistent psychological world-state, advance it by one
  // observation, persist it. Every run reads the world it enters.
  const worldStateEngineStore = createWorldStateEngineStore();
  const priorWorldState = await worldStateEngineStore.read();
  const executiveWorldState = readWorldState({
    ingestedSignals, trail: emotionalTrail, prior: priorWorldState,
  });
  await worldStateEngineStore.save(executiveWorldState);
  emit({
    stage: 'world-state-engine',
    message: `${executiveWorldState.climate_description} · world tension ${executiveWorldState.world_tension}/10 · most acute: ${executiveWorldState.most_acute_pressure}`,
  });

  // ─── Wave 5 — load the council's persistent reputation book ───
  const councilReputationStore = createCouncilReputationStore();
  const councilReputationBook = await councilReputationStore.read();

  // ─── Wave 6 — load the cognitive civilization's archive ───────
  const civilizationStore = createCivilizationArchiveStore();
  const civilization = await civilizationStore.read();
  emit({
    stage: 'civilization',
    message: civilization.generation === 0
      ? 'the cognitive civilization is being founded — generation 0'
      : `the cognitive civilization is ${civilization.generation} generations old · ${civilization.beliefs.length} belief(s) · ${civilization.laws.length} law(s) · ${civilization.scars.filter((s) => !s.healed).length} active scar(s)`,
  });

  // ─── Wave 7 — load the organism's persistent vital state ──────
  // The civilization is now a LIVING ORGANISM — it has finite energy,
  // accumulates stress, runs an immune system, and knows when to rest.
  const organismStore = createOrganismCoreStore();
  const organism = await organismStore.read();
  emit({
    stage: 'organism',
    message: organism.age === 0
      ? 'the reality organism is drawing its first breath — age 0'
      : `the reality organism is ${organism.age} runs old · energy ${organism.energyReserves}/10 · stress ${organism.stressAccumulation}/10 · ${organism.consecutiveActions} runs since its last rest`,
  });

  // ─── Wave 8 — load the operating system's persistent runtime ──
  // The organism now runs on an OS: a kernel, a scheduler, interrupts,
  // resource allocation. Every run is one kernel tick.
  const osStore = createOSRuntimeStore();
  const osState = await osStore.read();
  emit({
    stage: 'operating-system',
    message: osState.uptime === 0
      ? 'the cognitive operating system is booting — uptime 0 ticks'
      : `the cognitive operating system has ${osState.uptime} ticks of uptime · posture "${osState.operationalPosture}" · season "${osState.currentSeason}"`,
  });

  // ─── Wave 10 — load the organism's reality-coupling state ─────
  // The organism now learns from the external world: trust,
  // authenticity, and saturation persist across coupling cycles.
  const couplingStore = createRealityCouplingStore();
  const couplingState = await couplingStore.read();
  emit({
    stage: 'reality-coupling',
    message: couplingState.couplingCycles === 0
      ? 'the organism is coupling to reality for the first time'
      : `reality coupling: ${couplingState.couplingCycles} cycles · trust ${couplingState.trustLevel}/10 · authenticity ${couplingState.authenticityReserve}/10 · ${couplingState.resonanceWins} resonance / ${couplingState.stimulusWins} stimulus`,
  });

  // ─── Wave 11 — load the organism's strategic-future state ─────
  // The organism now reasons across long horizons: compounding
  // advantage, strategic debt, and the future it is building toward
  // persist across planning cycles.
  const strategicFutureStore = createStrategicFutureStore();
  const strategicFutureState = await strategicFutureStore.read();
  emit({
    stage: 'strategic-future',
    message: strategicFutureState.planningCycles === 0
      ? 'the organism is beginning to reason about the future for the first time'
      : `strategic future: ${strategicFutureState.planningCycles} cycles · advantage ${strategicFutureState.compoundingAdvantage}/10 · debt ${strategicFutureState.strategicDebt}/10 · ${strategicFutureState.futureCompoundedCount} future / ${strategicFutureState.nowOptimizedCount} now`,
  });

  // ─── Wave 12 — load the organism's execution state ────────────
  // The organism can now ACT — but never compulsively. Restraint
  // budget, audience recovery debt, and cadence health persist across
  // execution cycles so that autonomy is always accountable.
  const executionStore = createExecutionStore();
  const executionState = await executionStore.read();
  emit({
    stage: 'autonomous-action',
    message: executionState.executionCycles === 0
      ? 'the organism is preparing to act in the world for the first time'
      : `autonomous action: ${executionState.executionCycles} cycles · restraint ${executionState.restraintBudget}/10 · cadence ${executionState.cadenceHealth}/10 · ${executionState.actionsAuthorized} acted / ${executionState.actionsWithheld} withheld`,
  });

  // ─── Wave 13 — load the organism's reality feedback state ─────
  // The organism now closes the loop with reality: every cycle it
  // asks not just "did we publish?" but "what did this action become
  // inside real human nervous systems over time?"
  const feedbackStore = createFeedbackStore();
  const feedbackState = await feedbackStore.read();
  emit({
    stage: 'reality-feedback',
    message: feedbackState.feedbackCycles === 0
      ? 'the organism is beginning to read what its actions become for the first time'
      : `reality feedback: ${feedbackState.feedbackCycles} cycles · trust net gain ${feedbackState.trustNetGain} · ${feedbackState.reactionsIngested} reactions · ${feedbackState.slowTruthsDetected} slow truth(s)`,
  });

  // ─── Wave 14 — load the organism's live-coupling state ────────
  // The organism now FEELS reality in real time: every cycle it asks
  // "what changed in reality because we existed?"
  const liveCouplingStore = createLiveCouplingStore();
  const liveCouplingState = await liveCouplingStore.read();
  emit({
    stage: 'live-coupling',
    message: liveCouplingState.couplingCycles === 0
      ? 'the organism is preparing to feel reality in real time for the first time'
      : `live coupling: ${liveCouplingState.couplingCycles} cycles · presence ${liveCouplingState.presenceScore}/10 · coupling depth ${liveCouplingState.realityCouplingDepth}/10 · ${liveCouplingState.meaningsCarried} meaning / ${liveCouplingState.noveltyChased} novelty`,
  });

  // ─── Wave 15 — load the organism's sovereign-identity state ───
  // The danger of deep live coupling is identity corruption. This
  // state tracks the organism's resistance to being captured by the
  // reality it touches.
  const sovereignIdentityStore = createSovereignIdentityStore();
  const sovereignIdentityState = await sovereignIdentityStore.read();
  emit({
    stage: 'sovereign-identity',
    message: sovereignIdentityState.preservationCycles === 0
      ? 'the organism is beginning to defend its identity against live reality for the first time'
      : `sovereign identity: ${sovereignIdentityState.preservationCycles} cycles · sovereignty ${sovereignIdentityState.sovereigntyScore}/10 · integrity ${sovereignIdentityState.coreIntegrityScore}/10 · ${sovereignIdentityState.truthChosenOverPopularity} truth / ${sovereignIdentityState.popularityChosenOverTruth} popularity`,
  });

  // ─── Wave 16 — load the organism's generative-presence state ──
  // The deepest question now: does reality become different because
  // the brand existed beautifully inside it?
  const generativePresenceStore = createGenerativePresenceStore();
  const generativePresenceState = await generativePresenceStore.read();
  emit({
    stage: 'generative-presence',
    message: generativePresenceState.presenceCycles === 0
      ? 'the organism is preparing to change reality by existing beautifully inside it for the first time'
      : `generative presence: ${generativePresenceState.presenceCycles} cycles · coherence ${generativePresenceState.civilizationCoherenceScore}/10 · impact ${generativePresenceState.generativeImpactScore}/10 · ${generativePresenceState.beautyMomentsCreated} beauty / ${generativePresenceState.forcedInfluenceAttempts} forced`,
  });

  // ─── Phase 15 — longitudinal reality reads (campaign-level) ───
  const truthPersistenceStore = createTruthPersistenceStore();
  const culturalTimelineStore = createCulturalTimelineStore();
  const culturalTimelineReport = await culturalTimelineStore.report();
  if (culturalTimelineReport.buckets.length > 0) {
    emit({
      stage: 'cultural-timeline',
      message: culturalTimelineReport.current_drift,
      data: { phases: culturalTimelineReport.phases.length, buckets: culturalTimelineReport.buckets.length },
    });
  }
  const recentLightBehaviors15 = emotionalTrail.slice(0, 6).map((t) => inferLightBehaviorFromTrail(t));
  const recentLayouts15 = emotionalTrail.slice(0, 6).map((t) => t.facts?.layoutFamily ?? '').filter(Boolean) as string[];
  const recentDominances15 = emotionalTrail.slice(0, 6).map((t) => t.facts?.typographyDominance ?? '').filter(Boolean) as string[];
  const generationPressureReading = readGenerationPressure({
    trail: emotionalTrail,
    motifs,
    recentAftertaste: priorAftertaste,
    recentLightBehaviors: recentLightBehaviors15,
    recentLayouts: recentLayouts15,
    recentDominances: recentDominances15,
  });
  if (generationPressureReading.pressure_score >= 4 || generationPressureReading.force_disruption) {
    emit({
      stage: 'generation-pressure',
      message: generationPressureReading.force_disruption
        ? `FORCE DISRUPTION (${generationPressureReading.pressure_score.toFixed(1)}/10) — ${generationPressureReading.disruption_directives[0] ?? ''}`
        : `pressure ${generationPressureReading.pressure_score.toFixed(1)}/10`,
      data: generationPressureReading.axes,
    });
  }

  // ─── Phase 10 — unified cinematic brain (campaign-level signals)
  const unresolvedReport = analyzeUnresolvedEmotion({
    trail: emotionalTrail,
    timeline: campaignTimeline,
  });
  emit({
    stage: 'unresolved-emotion',
    message: unresolvedReport.unfinished_sentence,
    data: { signals: unresolvedReport.signals.length, most_active: unresolvedReport.most_active?.kind },
  });

  const subconsciousRecognition = analyzeSubconsciousRecognition({
    trail: emotionalTrail,
    worldDNA: worldPersistence.dna_signature,
    objectGraph: objectMemoryGraph,
    timeline: campaignTimeline,
  });
  emit({
    stage: 'subconscious-recognition',
    message: subconsciousRecognition.recognisable_without_logo
      ? `recognisable without a logo — ${subconsciousRecognition.recognition_score.toFixed(1)}/10`
      : `forming recognition — ${subconsciousRecognition.recognition_score.toFixed(1)}/10`,
    data: { patterns: subconsciousRecognition.patterns.length, missing: subconsciousRecognition.missing_signatures },
  });
  emit({
    stage: 'campaign-memory-v2',
    message: campaignMemoryV2.directorNote,
    data: {
      coresCovered: campaignMemoryV2.coresCovered.slice(0, 3),
      coresMissing: campaignMemoryV2.coresMissing.length,
      saturation: campaignMemoryV2.saturationScore,
      atmosphereAtRisk: campaignMemoryV2.atmosphereAtRisk,
    },
  });

  while (attempt < maxAttempts) {
    attempt += 1;

    const state: HumanState = selectHumanState({ ctx, memory, forceStateId, seed: stateSeed });
    const truth = await buildHumanTruth({ ctx, state });

    // ─── Per-attempt campaign-brain decisions ────────────────────
    const culturalMoment = selectCulturalMoment({ state, memory, seed: stateSeed + attempt });
    emit({
      stage: 'cultural-intelligence',
      message: `moment: "${culturalMoment.id}" — ${culturalMoment.reading}`,
      data: { forbidden: culturalMoment.forbiddenPatterns },
    });

    const courage = decideCourage({ state, job: jobDecision.job, culturalMoment: culturalMoment.id, memory, seed: stateSeed + attempt });
    emit({
      stage: 'visual-courage',
      message: `${courage.level} — ${courage.reason}`,
      data: courage.overrides,
    });

    const direction = await direct({
      ctx, truth, campaignMode: ctx.campaignMode, memory,
      evolution: evolutionAtRunStart,
      job: jobDecision,
      courage,
      rhythm: rhythmReport,
      culturalMoment,
    });
    const composition = planComposition({ ctx, direction });
    decideProductIntegration({ ctx, direction });

    // Image-level inner loop (max 2 image regens before bumping to concept).
    let imageAttempts = 0;
    while (true) {
      imageAttempts += 1;
      const { brief, image } = await generateImage({ ctx, truth, direction, composition });

      const typography = await buildTypography({ ctx, truth, direction });
      const cta = buildCTA({ ctx, direction, composition, seed: stateSeed + imageAttempts });

      // ─── Critic stack ──────────────────────────────────────────
      const scrollStop = await critique({
        ctx, truth, direction, composition,
        imageBrief: brief, image, typography, cta,
      });

      const reference = matchReference({ ctx, truth, direction, composition, typography });
      const taste = await tasteCritique({ ctx, truth, direction, composition, typography, image });
      const psychology = analyzeVisualPsychology({ ctx, direction, composition, typography });
      const productPresence = analyzeProductPresence({ ctx, truth, direction, composition, brief, image });

      // ─── Phase 2.5 — explicit taste system ────────────────────
      const dna = extractDNA({ direction, composition, typography, truth, brief, imageProvider: image.provider });
      const judge = judgeTaste({ truth, direction, composition, typography, image, bannerDNA: dna, references });
      emit({
        stage: 'taste-judge',
        message: `verdict: ${judge.verdict} · composite ${judge.composite.toFixed(1)} · nearest "${judge.closestCategory ?? 'none'}" (${judge.closestDistance.toFixed(2)})`,
        data: { rewards: judge.rewards, punishments: judge.punishments },
      });
      const reaction = simulateHumanReaction({ truth, direction, bannerDNA: dna, taste: judge });
      emit({
        stage: 'human-reaction',
        message: `${reaction.at_0_3s} → ${reaction.at_1s} → ${reaction.at_3s} (engagement ${reaction.engagementQuality.toFixed(1)})`,
        data: { arc: reaction.arc, scrollPast: reaction.scrollPast },
      });
      const fatigue = detectFatigue({
        banner: { direction, state, typography, hook: direction.hook },
        memory,
      });
      emit({
        stage: 'visual-fatigue',
        message: `${fatigue.verdict} · totals ${fatigue.totals.toFixed(1)}`,
        data: { flags: fatigue.flags, scores: fatigue.scores },
      });

      // ─── Phase 3 — anti-AI scan + rhythm-worsen check ────────
      const antiAI = scanAntiAI({ direction, typography, bannerDNA: dna, truth, memory, imageProvider: image.provider });
      emit({
        stage: 'anti-ai',
        message: `smell ${antiAI.smell.toFixed(1)} · signatures [${antiAI.signatures.join(', ') || 'none'}] · drift [${antiAI.driftSignatures.join(', ') || 'none'}]`,
        data: { notes: antiAI.notes, pushAwayFrom: antiAI.pushAwayFrom },
      });

      const rhythmWorsen = bannerWouldWorsenRhythm(rhythmReport, { direction, job: jobDecision.job });
      if (rhythmWorsen.worsens) {
        emit({
          stage: 'campaign-rhythm',
          message: `would worsen rhythm: ${rhythmWorsen.reason}`,
          data: rhythmWorsen,
        });
      }

      // ─── Phase 5 — perceptual layer ───────────────────────────
      const cores = coresForState(state.id);
      const emotionalCore: EmotionalCore | null = cores[0] ?? null;
      const candidateMoments = emotionalCore ? momentsForCore(emotionalCore.id) : [];
      const culturalMicroMoment: CulturalMicroMoment | null =
        candidateMoments[(stateSeed + attempt) % Math.max(candidateMoments.length, 1)] ?? null;
      emit({
        stage: 'emotional-core',
        message: emotionalCore ? `core: ${emotionalCore.id} — "${emotionalCore.silent_sentence}"` : 'no emotional core mapped',
      });
      if (culturalMicroMoment) {
        emit({
          stage: 'cultural-micro-moment',
          message: `moment: ${culturalMicroMoment.state_id} — ${culturalMicroMoment.environment}`,
        });
      }

      const imperfectionPlan = planVisualBehavior({
        formula: ctx.formula,
        plan: composition,
        direction,
        state,
        emotionalCore,
        seed: stateSeed + attempt,
      });
      emit({
        stage: 'human-visual-behavior',
        message: `${imperfectionPlan.behaviors.join(', ')} — ${imperfectionPlan.motivation}`,
      });

      const visualTaste = scoreVisualTaste({
        direction, typography, bannerDNA: dna,
        truth: { truth: truth.truth, tension: truth.tension },
        timeAnchor: state.timeAnchor,
        imageProvider: image.provider,
        emotionalCore,
        referenceCloseness: reference.closeness,
        atmosphereConsistency: null, // computed alongside aftertaste below
      });
      emit({
        stage: 'visual-taste',
        message: `score ${visualTaste.score.toFixed(1)}/10 · AI prob ${(visualTaste.ai_detection_probability * 100).toFixed(0)}% · ${visualTaste.rejection_reason ?? 'cleared'}`,
        data: { forbidden: visualTaste.forbiddenPatternsHit.map((p) => p.id) },
      });

      const emotionalAftertaste = predictEmotionalAftertaste({
        bannerDNA: dna,
        reactionAt3s: reaction.at_3s,
        tensionPhrase: truth.tension,
        truthText: truth.truth,
        emotionalCore,
      });
      emit({
        stage: 'emotional-aftertaste',
        message: `composite ${emotionalAftertaste.composite.toFixed(1)} — ${emotionalAftertaste.post_view_emotional_state}`,
      });

      // ─── Phase 7 — perception + world continuity layer ───────
      const atmosphericLight = selectAtmosphericLight({
        state, emotionalCore,
        microMomentId: culturalMicroMoment?.state_id ?? null,
      });
      emit({ stage: 'atmospheric-light', message: `${atmosphericLight.behavior} — ${atmosphericLight.psychological_meaning}` });

      const worldContinuity = planWorldContinuity({
        state, emotionalCore,
        microMoment: culturalMicroMoment,
        seed: stateSeed + attempt,
      });
      emit({
        stage: 'world-continuity',
        message: `${worldContinuity.artifacts.length} artifacts: ${worldContinuity.artifacts.map((a) => a.id).join(', ')}`,
      });

      const microHumanDetails = planMicroHumanDetails({
        state, emotionalCore,
        seed: stateSeed + attempt,
      });
      emit({ stage: 'micro-human-details', message: microHumanDetails.details.join(', ') });

      const invisibleStory = buildInvisibleStory({
        state, emotionalCore,
        microMoment: culturalMicroMoment,
      });
      emit({ stage: 'invisible-story', message: `before: ${invisibleStory.ten_minutes_before.slice(0, 70)}…` });

      const humanInterruption = decideHumanInterruption({
        job: jobDecision.job,
        emotionalCore,
        direction,
      });
      emit({
        stage: 'human-interruption',
        message: `${humanInterruption.intensity} (vis ${humanInterruption.visibility}/10) — ${humanInterruption.reasoning}`,
      });

      const typographyPsychology = planTypographyPsychology({
        state, emotionalCore, direction, typography, composition,
      });
      emit({
        stage: 'typography-psychology',
        message: `${typographyPsychology.posture} — ${typographyPsychology.psychological_meaning}`,
      });

      const perceptionCriticVerdict = critiquePerception({
        truth, direction, typography, bannerDNA: dna,
        emotionalCore, emotionalAftertaste,
        visualTaste, tasteJudge: judge,
        worldContinuity, microDetails: microHumanDetails, invisibleStory,
        hasCulturalGrounding: !!culturalMicroMoment,
      });
      emit({
        stage: 'perception-critic',
        message: `${perceptionCriticVerdict.verdict} — silent-recognition ${perceptionCriticVerdict.silent_emotional_recognition.toFixed(1)}/10` + (perceptionCriticVerdict.rejection_reason ? ` — ${perceptionCriticVerdict.rejection_reason}` : ''),
        data: { notes: perceptionCriticVerdict.notes },
      });

      // ─── Phase 8 — visual composition intelligence ─────────────
      const gravity = analyzeVisualGravity({ direction, composition, typography });
      emit({
        stage: 'visual-gravity',
        message: `composite ${gravity.composite.toFixed(1)} · focal-dominance ${gravity.focal_dominance.toFixed(1)} · competing ${gravity.competing_anchors.toFixed(1)}` + (gravity.rejection_reason ? ` — ${gravity.rejection_reason}` : ''),
      });

      const negativeSpace = analyzeNegativeSpace({ formula: ctx.formula, direction, composition });
      emit({
        stage: 'negative-space',
        message: `${negativeSpace.prescribed_behavior} · tension ${negativeSpace.space_tension_score.toFixed(1)}/10` + (negativeSpace.rejection_reason ? ` — ${negativeSpace.rejection_reason}` : ''),
      });

      const compositionRhythm8 = analyzeCompositionRhythm({
        trail: emotionalTrail,
        memory,
        candidate: {
          layoutFamily: direction.layoutFamily,
          focalPoint: direction.focalPoint,
          productRole: direction.productRole,
          typographyDominance: direction.typographyDominance,
          negativeSpaceBias: composition.negativeSpaceBias,
        },
      });
      emit({
        stage: 'composition-rhythm',
        message: compositionRhythm8.would_repeat
          ? `would repeat: ${compositionRhythm8.repeated_pattern} — suggested: ${compositionRhythm8.suggested_correction ?? '—'}`
          : 'spatial rhythm healthy',
      });

      const productMotifs = await objectEmotionStore.list();
      const rhythmSaysReduceProduct = !!rhythmReport.axes.find(
        (a) => a.axis === 'product-vs-no-product' && a.bias > 0.4,
      );
      const productPresence8 = decideProductPresence({
        emotionalCore,
        job: jobDecision.job,
        direction,
        interruption: humanInterruption,
        motifs: productMotifs,
        rhythmSaysReduceProduct,
        campaignBannerIndex: emotionalTrail.length,
      });
      emit({
        stage: 'product-presence-v2',
        message: `mode: ${productPresence8.mode} — ${productPresence8.reasoning}`,
      });

      const framing8 = planHumanFraming({
        direction,
        emotionalCore,
        restraint: direction.restraint,
        seed: stateSeed + attempt,
      });
      emit({
        stage: 'human-framing',
        message: `${framing8.camera_distance} · ${framing8.behaviors.join(', ')}`,
      });

      const directorVerdict = directLayout({
        formula: ctx.formula,
        direction, composition, emotionalCore,
        gravity, negativeSpace, rhythm: compositionRhythm8,
        presence: productPresence8, framing: framing8,
        campaignIdentity, recentAftertaste: priorAftertaste,
      });
      emit({
        stage: 'layout-director',
        message: directorVerdict.director_note,
        data: {
          archetype: directorVerdict.composition_archetype,
          would_subtract: directorVerdict.would_improve_with_subtraction,
          subtract_target: directorVerdict.subtraction_target,
          rejections: directorVerdict.rejection_conditions,
        },
      });

      // ─── Phase 9 — temporal cognition per candidate banner ─────
      const candidateNote = inferCandidateNote(reaction.at_3s, state.family);
      const sequenceVerdict = judgeSequence({
        timeline: campaignTimeline,
        candidate_note: candidateNote,
      });
      emit({
        stage: 'emotional-sequence',
        message: sequenceVerdict.redundant_with_previous
          ? `REDUNDANT — candidate "${candidateNote}" repeats previous`
          : sequenceVerdict.advances_arc
            ? `advances arc → "${candidateNote}"`
            : `flat — "${candidateNote}" does not advance the arc`,
      });

      const candidateApartmentKind = culturalMicroMoment?.state_id
        ? APARTMENT_KIND_MAP[culturalMicroMoment.state_id] ?? null
        : null;
      const sceneContinuityReport = analyzeSceneContinuity({
        trail: emotionalTrail,
        worldDNA: worldPersistence.dna_signature,
        objectGraph: objectMemoryGraph,
        candidate: {
          apartmentKind: candidateApartmentKind,
          lightBehavior: atmosphericLight.behavior,
          family: state.family,
          objectIds: extractObjectsFromBrief(brief.scene, worldContinuity.artifacts.map((a) => a.description)),
          isQuiet: direction.typographyDominance === 'whisper' || direction.typographyDominance === 'absent',
        },
        bannerIndex: emotionalTrail.length,
      });
      emit({
        stage: 'scene-continuity',
        message: sceneContinuityReport.invisible_context.slice(0, 120),
      });

      const tempoWorsen = tempoWouldWorsen(visualTempo, {
        typographyDominance: direction.typographyDominance,
        productRole: direction.productRole,
        restraint: direction.restraint,
      });
      if (tempoWorsen.worsens) {
        emit({ stage: 'visual-tempo', message: `would worsen ${tempoWorsen.axis} — ${tempoWorsen.reason}` });
      }

      const absenceDecision = decideAbsence({
        emotionalCore,
        microMoment: culturalMicroMoment,
        tempo: visualTempo,
        timeline: campaignTimeline,
        bannerIndex: emotionalTrail.length,
        jobId: jobDecision.job,
      });
      emit({
        stage: 'absence-intelligence',
        message: `curiosity ${absenceDecision.curiosity_score.toFixed(1)}/10 — ${absenceDecision.reasoning[0] ?? '—'}`,
        data: { drop_copy: absenceDecision.drop_copy, drop_cta: absenceDecision.drop_cta, drop_product: absenceDecision.drop_product },
      });

      const contradictionReading = readEmotionalContradiction({ truth, emotionalCore });
      emit({
        stage: 'emotional-contradiction',
        message: contradictionReading.the_contradiction
          ? `"${contradictionReading.the_contradiction.name}" — depth ${contradictionReading.depth.toFixed(1)}/10`
          : 'no named contradiction',
      });

      // ─── Phase 10 — per-banner cinematic signals ──────────────
      const compressionReading = scoreEmotionalCompression({
        truth, direction, typography, emotionalCore,
        worldContinuity,
      });
      emit({
        stage: 'emotional-compression',
        message: `score ${compressionReading.score.toFixed(1)}/10 · ratio ${compressionReading.compression_ratio.toFixed(2)} · implied ${compressionReading.implied_emotions.length} / shown ${compressionReading.shown_emotions.length}`,
      });

      const syntheticReading = detectSyntheticBehavior({
        direction, composition, typography, dna,
        framing: framing8, worldContinuity, gravity,
        truthLength: truth.truth.length,
      });
      emit({
        stage: 'anti-synthetic',
        message: syntheticReading.reads_as_designed
          ? `reads as designed — ${syntheticReading.signatures.join(', ')}`
          : `observed (${syntheticReading.rewards.length} imperfection signals)`,
        data: { score: syntheticReading.synthetic_score, signatures: syntheticReading.signatures },
      });

      const cinematicVerdict = decideCinematicVerdict({
        trail: emotionalTrail,
        timeline: campaignTimeline,
        unresolved: unresolvedReport,
        worldDNA: worldPersistence.dna_signature,
        objectGraph: objectMemoryGraph,
        campaignIdentity,
        subconsciousRecognition,
        tempo: visualTempo,
        candidateAftertaste: emotionalAftertaste,
        candidateContradiction: contradictionReading,
        candidateCompression: compressionReading,
        candidateSynthetic: syntheticReading,
        candidateNote,
      });
      emit({
        stage: 'cinematic-brain',
        message: cinematicVerdict.director_voice,
        data: {
          thesis: cinematicVerdict.campaign_emotional_thesis,
          trajectory: cinematicVerdict.emotional_trajectory,
          three_second_pass: cinematicVerdict.three_second_test.passes,
          aligned: cinematicVerdict.candidate_alignment.serves_thesis,
        },
      });

      // ─── Phase 11 — natural human chaos ───────────────────────
      const lifeNoise = planLifeNoise({ state, seed: stateSeed + attempt });
      emit({
        stage: 'life-noise',
        message: `${lifeNoise.fragments.length} non-symbolic fragments · mess ${lifeNoise.mess_score.toFixed(1)}/10`,
      });

      const humanContradiction = readHumanContradiction({
        state, emotionalCore, truthText: truth.truth,
      });
      emit({
        stage: 'human-contradiction',
        message: humanContradiction.pair
          ? `${humanContradiction.pair.feeling} → ${humanContradiction.pair.behavior} (recognition ${humanContradiction.recognition_score.toFixed(1)}/10)`
          : 'no behavioral contradiction mapped',
      });

      const nonPerformative = readNonPerformativeReality({
        direction, typography, dna,
        atmosphericLight,
        aftertaste: emotionalAftertaste,
        contradiction: humanContradiction,
        truthText: truth.truth,
        poeticOverloadHint: syntheticReading.synthetic_score,
      });
      emit({
        stage: 'non-performative-reality',
        message: nonPerformative.trying_to_simulate
          ? `WARNING simulating depth — ${nonPerformative.patterns.join(', ')}`
          : nonPerformative.feels_like_happened
            ? 'feels like a moment that happened'
            : `mild performance risk (${nonPerformative.performativeness_score.toFixed(1)}/10)`,
        data: { rewards: nonPerformative.rewards },
      });

      // ─── Phase 12 — cultural memory engine ────────────────────
      const sharedPatternMatch = matchSharedCulturalPattern({ state, emotionalCore });
      emit({
        stage: 'shared-cultural-pattern',
        message: sharedPatternMatch.pattern
          ? `pattern: "${sharedPatternMatch.pattern.named_tension}" (strength ${sharedPatternMatch.strength})`
          : 'no shared cultural pattern matched',
      });
      const collectiveRecognition = readCollectiveRecognition({
        truth, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        pattern_strength: sharedPatternMatch.strength,
      });
      emit({
        stage: 'collective-recognition',
        message: collectiveRecognition.is_collective
          ? `collective — recognition ${collectiveRecognition.recognition_score.toFixed(1)}/10`
          : collectiveRecognition.is_individual_only
            ? `reads as one specific person — ${collectiveRecognition.recognition_score.toFixed(1)}/10`
            : `forming recognition (${collectiveRecognition.recognition_score.toFixed(1)}/10)`,
      });
      const unspokenRitualPick = selectUnspokenRitual({
        state, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        seed: stateSeed + attempt,
      });
      if (unspokenRitualPick.ritual) {
        emit({
          stage: 'unspoken-ritual',
          message: `${unspokenRitualPick.ritual.id} — ${unspokenRitualPick.ritual.observable_action}`,
        });
      }
      const culturalDriftReading = detectCulturalDrift({
        direction,
        emotionalCore,
        pattern: sharedPatternMatch.pattern,
        atmosphericLight,
        truthText: truth.truth,
      });
      emit({
        stage: 'cultural-drift',
        message: culturalDriftReading.feels_culturally_consumed
          ? `culturally consumed: ${culturalDriftReading.detected_cliches.join(', ')}`
          : `no drift — saturation ${culturalDriftReading.saturation_score.toFixed(1)}/10`,
      });

      // ─── Phase 13 — reality pressure ──────────────────────────
      const realityPressureReading = readRealityPressure({
        truth, state, emotionalCore,
      });
      emit({
        stage: 'reality-pressure',
        message: `specificity ${realityPressureReading.pressure_specificity.toFixed(1)}/10 · signals: ${realityPressureReading.signals.map((s) => s.type).join(', ') || 'none'}` + (realityPressureReading.reads_generic ? ' · GENERIC' : ''),
      });
      const consequenceReading = readConsequence({
        truth, state, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        pressure: realityPressureReading,
      });
      emit({
        stage: 'consequence',
        message: consequenceReading.has_stakes
          ? `stakes ${consequenceReading.stakes_clarity.toFixed(1)}/10 — "${consequenceReading.stakes_phrase.slice(0, 100)}…"`
          : `decorative emotion — no stakes`,
      });
      const invisibleStakesReading = readInvisibleStakes({
        state, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        ritual: unspokenRitualPick.ritual,
      });
      emit({
        stage: 'invisible-stakes',
        message: invisibleStakesReading.compulsion
          ? `${invisibleStakesReading.compulsion.id} — "${invisibleStakesReading.compulsion.daily_cost.slice(0, 80)}"`
          : 'no modern compulsion mapped',
      });
      const functionalCollapseReading = readFunctionalCollapse({
        state, truth, direction, emotionalCore, atmosphericLight,
      });
      emit({
        stage: 'functional-collapse',
        message: `${functionalCollapseReading.type} (functional ${functionalCollapseReading.functional_collapse_score.toFixed(1)}, accidentally-true ${functionalCollapseReading.accidentally_true_score.toFixed(1)}) — ${functionalCollapseReading.directorNote}`,
      });

      // ─── Phase 14 — suppressed humanity ───────────────────────
      const avoidanceReading = readEmotionalAvoidance({ state, truth, emotionalCore });
      emit({
        stage: 'emotional-avoidance',
        message: avoidanceReading.pattern
          ? `${avoidanceReading.pattern.id} — replacement: "${avoidanceReading.pattern.replacement_behavior}"` + (avoidanceReading.feeling_named_directly ? ' · WARNING: truth names feeling directly' : '')
          : 'no avoidance pattern matched',
      });
      const numbingReading = readModernNumbing({ state, emotionalCore });
      emit({
        stage: 'modern-numbing',
        message: numbingReading.pattern
          ? `${numbingReading.pattern.id} — preventing "${numbingReading.pattern.what_it_prevents}"`
          : 'no modern numbing detected',
      });
      const maskingReading = readSocialMasking({ truth, state, emotionalCore });
      emit({
        stage: 'social-masking',
        message: maskingReading.is_mask_present
          ? `surface ${maskingReading.surface_coherence_score.toFixed(1)} · fracture ${maskingReading.internal_fracture_score.toFixed(1)} · gap ${maskingReading.mask_gap.toFixed(1)}`
          : 'no mask present — surface and internal aligned',
      });
      const unfeltReading = readUnfeltEmotion({ truth, emotionalCore });
      emit({
        stage: 'unfelt-emotion',
        message: unfeltReading.reads_as_therapy_content
          ? `WARNING therapy content — ${unfeltReading.therapy_signatures.join(', ')}`
          : unfeltReading.viewer_realizes_before_character
            ? 'viewer realises before the character — accidentally revealed'
            : `character self-awareness ${unfeltReading.character_self_awareness.toFixed(1)}/10`,
      });
      // ───────────────────────────────────────────────────────────

      // ─── Phase 15 — per-banner longitudinal reads ─────────────
      const candidateTruthKey = (truth.tension?.trim().toLowerCase() || emotionalCore?.id || 'untracked');
      const truthPersistenceReport = await truthPersistenceStore.report(candidateTruthKey);
      emit({
        stage: 'truth-persistence',
        message: truthPersistenceReport.candidate_touches_persistent
          ? `persistent truth (×${truthPersistenceReport.candidate_entry!.count}) · durability ${truthPersistenceReport.durability_score.toFixed(1)}/10`
          : truthPersistenceReport.persistent.length > 0
            ? `new truth — campaign has ${truthPersistenceReport.persistent.length} persistent truths so far`
            : 'no persistent truths yet',
      });

      // Reality verification — read engagement for THIS banner if any
      // signals have arrived. New banners have none; the persistence
      // store contributes the historical signal.
      const candidateEngagement = await engagementStore.get(bannerId);
      const realityVerificationReading = verifyReality({
        engagement: candidateEngagement,
      });
      if (realityVerificationReading.confirmation_strength > 0) {
        emit({
          stage: 'reality-verification',
          message: realityVerificationReading.reality_confirmed
            ? `reality confirmed (${realityVerificationReading.confirmation_strength.toFixed(1)}/10) — ${realityVerificationReading.recognition_signals[0] ?? ''}`
            : `partial confirmation (${realityVerificationReading.confirmation_strength.toFixed(1)}/10)`,
        });
      }

      const emotionalDecayReading = readEmotionalDecay({
        persistenceEntry: truthPersistenceReport.candidate_entry,
        truthAftertasteRecords: priorAftertaste
          .filter((r) => {
            const matched = emotionalTrail.find((e) => e.bannerId === r.bannerId);
            if (!matched) return false;
            const matchedKey = (matched.tension?.trim().toLowerCase() || candidateTruthKey);
            return matchedKey === candidateTruthKey;
          }),
        culturalDrift: culturalDriftReading,
        truthText: truth.truth,
      });
      emit({
        stage: 'emotional-decay',
        message: emotionalDecayReading.status === 'decorative'
          ? `DECORATIVE${emotionalDecayReading.decorative_mode ? ` (${emotionalDecayReading.decorative_mode})` : ''} — truth has become aesthetic recognition`
          : emotionalDecayReading.status === 'aging'
            ? `aging (${emotionalDecayReading.decay_score.toFixed(1)}/10)`
            : 'fresh',
      });

      // ─── Phase 16 — per-banner reality reads ──────────────────
      const privateLanguageReading = readPrivateLanguage({
        truthText: truth.truth,
        tensionText: truth.tension,
        extraction: humanSignalExtraction,
      });
      emit({
        stage: 'private-language',
        message: privateLanguageReading.is_unguarded
          ? `unguarded register (${privateLanguageReading.private_language_score.toFixed(1)}/10) — matched: ${privateLanguageReading.matched_private_phrases.slice(0, 2).join('; ') || 'none'}`
          : privateLanguageReading.performative_signatures.length > 0
            ? `WARNING performative — ${privateLanguageReading.performative_signatures.join(', ')}`
            : `register ${privateLanguageReading.private_language_score.toFixed(1)}/10`,
      });

      const realityWeightingReading = weightReality({
        truthText: truth.truth,
        tensionText: truth.tension,
        ingestedSignals,
      });
      emit({
        stage: 'reality-weighting',
        message: realityWeightingReading.generated_from_aesthetics_only
          ? `WARNING generated from aesthetics — no deep signal resonates`
          : `discovered from reality ${realityWeightingReading.discovered_from_reality_score.toFixed(1)}/10 · ${realityWeightingReading.resonating_signals.length} signals resonate`,
      });

      // ─── Phase 17 — systemic pressure model ───────────────────
      const systemicCauseReading = matchSystemicCause({ state, truth, emotionalCore });
      emit({
        stage: 'systemic-cause',
        message: systemicCauseReading.has_systemic_cause
          ? `caused by: ${systemicCauseReading.matched_systems.primary!.id} (clarity ${systemicCauseReading.causal_clarity.toFixed(1)}/10)`
          : `no systemic cause matched — banner is feeling without machinery`,
      });
      const attentionFragmentationReading = readAttentionFragmentation({
        state, truth, emotionalCore, microMoment: culturalMicroMoment,
      });
      if (attentionFragmentationReading.patterns_detected.length > 0) {
        emit({
          stage: 'attention-fragmentation',
          message: `${attentionFragmentationReading.attention_fragmentation_score.toFixed(1)}/10 · ${attentionFragmentationReading.patterns_detected.map((p) => p.id).join(', ')}`,
        });
      }
      const environmentalSystemReading = identifyEnvironmentalSystem({
        state, microMoment: culturalMicroMoment,
        atmosphericLightBehavior: atmosphericLight.behavior,
      });
      if (environmentalSystemReading.primary) {
        emit({
          stage: 'environmental-machine',
          message: `${environmentalSystemReading.primary.id} — ${environmentalSystemReading.primary.what_it_replaces}`,
        });
      }
      const recoveryFailureReading = readRecoveryFailure({
        state, truth, emotionalCore, microMoment: culturalMicroMoment,
      });
      if (recoveryFailureReading.primary_failure) {
        emit({
          stage: 'recovery-failure',
          message: `${recoveryFailureReading.primary_failure.id} (${recoveryFailureReading.recovery_failure_score.toFixed(1)}/10)${recoveryFailureReading.rest_is_not_rest ? ' — REST IS NOT REST' : ''}`,
        });
      }
      const cognitiveResidueReading = readCognitiveResidue({
        state, truth, emotionalCore, worldContinuity,
      });
      if (cognitiveResidueReading.detected.length > 0) {
        emit({
          stage: 'cognitive-residue',
          message: `load ${cognitiveResidueReading.residue_load.toFixed(1)}/10 · ${cognitiveResidueReading.detected.map((r) => r.id).join(', ')}`,
        });
      }
      // ───────────────────────────────────────────────────────────

      // ─── Phase 18 — behavioral survival engine ────────────────
      const behaviorLoopReading = readBehaviorLoop({ state, truth, emotionalCore });
      if (behaviorLoopReading.primary_loop) {
        emit({
          stage: 'behavior-loop',
          message: `${behaviorLoopReading.primary_loop.id} (${behaviorLoopReading.primary_loop.classification}) — strength ${behaviorLoopReading.loop_signature_strength.toFixed(1)}/10${behaviorLoopReading.is_automatic ? ' — AUTOMATIC' : ''}`,
        });
      }
      const microEscapeReading = readMicroEscape({
        state, truth, emotionalCore, microMoment: culturalMicroMoment,
      });
      if (microEscapeReading.primary) {
        emit({
          stage: 'micro-escape',
          message: `${microEscapeReading.primary.id} — "${microEscapeReading.primary.recognition_phrase}" (${microEscapeReading.micro_escape_score.toFixed(1)}/10)${microEscapeReading.in_the_act ? ' — IN THE ACT' : ''}`,
        });
      }
      const ritualCompensationReading = readCompensationRitual({ state, truth, emotionalCore });
      if (ritualCompensationReading.primary) {
        emit({
          stage: 'ritual-compensation',
          message: `${ritualCompensationReading.primary.id} replaces "${ritualCompensationReading.primary.what_it_replaces}"${ritualCompensationReading.romanticisation_detected ? ' — ROMANTICISED' : ''}`,
        });
      }
      const fakeRecoveryReading = readFakeRecovery({ state, truth, emotionalCore });
      if (fakeRecoveryReading.primary) {
        emit({
          stage: 'fake-recovery',
          message: `${fakeRecoveryReading.primary.id} (${fakeRecoveryReading.fake_recovery_score.toFixed(1)}/10)${fakeRecoveryReading.performs_rest ? ' — PERFORMS REST' : ''}`,
        });
      }
      const silentCopingReading = readSilentCoping({ state, truth, emotionalCore });
      if (silentCopingReading.primary) {
        emit({
          stage: 'silent-coping',
          message: `${silentCopingReading.primary.id} — "${silentCopingReading.primary.cinematic_marker}"`,
        });
      }
      const behavioralResidueReading = readBehavioralResidue({
        state, truth, emotionalCore,
        behaviorLoop: behaviorLoopReading,
        microEscape: microEscapeReading,
        ritualCompensation: ritualCompensationReading,
        fakeRecovery: fakeRecoveryReading,
        silentCoping: silentCopingReading,
        recentTrail: emotionalTrail,
      });
      if (behavioralResidueReading.fingerprints.length > 0) {
        emit({
          stage: 'behavioral-residue',
          message: `carryover ${behavioralResidueReading.carryover_score.toFixed(1)}/10 · recurrence ${behavioralResidueReading.recurrence_density.toFixed(1)}/10${behavioralResidueReading.carries_weeks_not_minutes ? ' — CARRIES WEEKS' : ''}${behavioralResidueReading.residue_becoming_signature ? ' — SIGNATURE FORMING' : ''}`,
        });
      }
      // ───────────────────────────────────────────────────────────

      // ─── Phase 19 — social masking + identity performance ─────
      const socialMaskingEngineReading = readSocialMaskingEngine({ state, truth, emotionalCore });
      if (socialMaskingEngineReading.primary) {
        emit({
          stage: 'social-masking-engine',
          message: `${socialMaskingEngineReading.primary.id} (${socialMaskingEngineReading.classification}) — strength ${socialMaskingEngineReading.mask_signature_strength.toFixed(1)}/10${socialMaskingEngineReading.truth_reveals_too_much ? ' — MASK BROKEN' : ''}`,
        });
      }
      const highFunctioningBurnoutReading = readHighFunctioningBurnout({ state, truth, emotionalCore });
      if (highFunctioningBurnoutReading.primary) {
        emit({
          stage: 'high-functioning-burnout',
          message: `${highFunctioningBurnoutReading.primary.id} — output ${highFunctioningBurnoutReading.functional_output_unchanged.toFixed(1)}/10 unchanged, internal ${highFunctioningBurnoutReading.internal_depletion.toFixed(1)}/10 depleted${highFunctioningBurnoutReading.burnout_hidden_in_competence ? ' — HIDDEN IN COMPETENCE' : ''}${highFunctioningBurnoutReading.burnout_visible_too_early ? ' — VISIBLE TOO EARLY' : ''}`,
        });
      }
      const identityMaintenanceReading = readIdentityMaintenance({ state, truth, emotionalCore });
      if (identityMaintenanceReading.primary) {
        emit({
          stage: 'identity-maintenance',
          message: `identity: ${identityMaintenanceReading.primary.id} — pressure ${identityMaintenanceReading.identity_pressure.toFixed(1)}/10, cost ${identityMaintenanceReading.identity_cost.toFixed(1)}/10${identityMaintenanceReading.subject_names_their_role ? ' — SELF-CONSCIOUS' : ''}`,
        });
      }
      const emotionalCamouflageReading = readEmotionalCamouflage({ state, truth, emotionalCore });
      if (emotionalCamouflageReading.primary) {
        emit({
          stage: 'emotional-camouflage',
          message: `${emotionalCamouflageReading.primary.id} · concealment ${emotionalCamouflageReading.concealment_intensity.toFixed(1)}/10 · readability ${emotionalCamouflageReading.social_readability.toFixed(1)}/10${emotionalCamouflageReading.too_analytic ? ' — ANALYTIC VOICE' : ''}`,
        });
      }
      const publicPrivateSplitReading = readPublicPrivateSplit({
        state, truth, emotionalCore, recentTrail: emotionalTrail,
      });
      emit({
        stage: 'public-private-split',
        message: `side: ${publicPrivateSplitReading.candidate_side} · split coverage ${publicPrivateSplitReading.split_coverage.toFixed(1)}/10${publicPrivateSplitReading.banner_completes_a_pair ? ' — COMPLETES PAIR' : ''}${publicPrivateSplitReading.one_sided_campaign ? ' — ONE-SIDED CAMPAIGN' : ''}`,
      });
      const maskFatigueReading = readMaskFatigue({ state, truth, emotionalCore });
      if (maskFatigueReading.primary) {
        emit({
          stage: 'mask-fatigue',
          message: `${maskFatigueReading.primary.id} · mask ${maskFatigueReading.mask_fatigue_score.toFixed(1)}/10 vs work ${maskFatigueReading.work_fatigue_score.toFixed(1)}/10${maskFatigueReading.fatigue_misattributed ? ' — MISATTRIBUTED' : ''}`,
        });
      }
      // ───────────────────────────────────────────────────────────

      // ─── Phase 20 — desire systems ────────────────────────────
      const desireArchitectureReading = readDesireArchitecture({ state, truth, emotionalCore });
      if (desireArchitectureReading.primary) {
        emit({
          stage: 'desire-architecture',
          message: `${desireArchitectureReading.primary.id} — gravity ${desireArchitectureReading.desire_gravity.toFixed(1)}/10, inevitability ${desireArchitectureReading.emotional_inevitability.toFixed(1)}/10${desireArchitectureReading.uses_forbidden_framing ? ' — FORBIDDEN FRAMING' : ''}`,
        });
      }
      const quietStatusReading = readQuietStatus({ state, truth, emotionalCore });
      const emotionalHungerReading = readEmotionalHunger({ state, truth, emotionalCore });
      if (emotionalHungerReading.primary) {
        emit({ stage: 'emotional-hunger', message: `${emotionalHungerReading.primary.id} — intensity ${emotionalHungerReading.hunger_intensity.toFixed(1)}/10` });
      }
      const validationSystemsReading = readValidationSystems({ state, truth, emotionalCore });
      const invisibleEnvyReading = readInvisibleEnvy({ state, truth, emotionalCore });
      const aspirationalGapReading = readAspirationalIdentityGap({ state, truth, emotionalCore });

      // ─── Phase 21 — social gravity ────────────────────────────
      const socialGravityReading = readSocialGravity({ state, truth, emotionalCore });
      if (socialGravityReading.primary) {
        emit({
          stage: 'social-gravity',
          message: `${socialGravityReading.primary.id} — gravity ${socialGravityReading.gravity_strength.toFixed(1)}/10, collective grounding ${socialGravityReading.collective_grounding.toFixed(1)}/10${socialGravityReading.individually_dramatized ? ' — INDIVIDUALLY DRAMATIZED' : ''}`,
        });
      }
      const collectiveMovementReading = readCollectiveEmotionalMovement({
        state, truth, recentTrail: emotionalTrail, ingestedSignals,
      });
      const culturalAccelerationReading = readCulturalAcceleration({ ingestedSignals });
      const groupAnxietyReading = readGroupAnxiety({ state, truth, emotionalCore });
      const viralPatternsReading = readViralEmotionPatterns({ truth });
      if (viralPatternsReading.hits.length > 0) {
        emit({ stage: 'viral-emotion-patterns', message: `contamination ${viralPatternsReading.contamination_score.toFixed(1)}/10 · ${viralPatternsReading.hits.map((h) => h.id).join(', ')}` });
      }
      const socialPermissionReading = readSocialPermissionStructures({ state, truth, emotionalCore });

      // ─── Phase 22 — ritual attachment ─────────────────────────
      const ritualFormationReading = readRitualFormation({ truth });
      const attachmentLoopsReading = readAttachmentLoops({ state, truth, emotionalCore });
      const symbolicSafetyReading = readSymbolicSafety({ state, truth, emotionalCore });
      const emotionalReturnReading = readEmotionalReturnMechanics({ state, truth, emotionalCore });
      const privateRitualMemoryReading = await readPrivateRitualMemory({ store: humanDesireStore });
      const repeatedComfortReading = readRepeatedComfortSystems({ state, truth, emotionalCore });
      if (attachmentLoopsReading.primary || ritualFormationReading.detected_stage) {
        emit({
          stage: 'ritual-attachment',
          message: `${attachmentLoopsReading.primary?.id ?? 'no-anchor'} · formation ${ritualFormationReading.detected_stage ?? 'none'}${repeatedComfortReading.comfort_is_designed ? ' — DESIGNED COMFORT' : ''}`,
        });
      }

      // ─── Phase 23 — narrative self ────────────────────────────
      const internalNarrativeReading = readInternalNarrative({ state, truth, emotionalCore });
      if (internalNarrativeReading.primary) {
        emit({
          stage: 'internal-narrative',
          message: `${internalNarrativeReading.primary.id} — authenticity ${internalNarrativeReading.narrative_authenticity.toFixed(1)}/10${internalNarrativeReading.too_articulate ? ' — TOO ARTICULATE' : ''}${internalNarrativeReading.too_literary ? ' — TOO LITERARY' : ''}`,
        });
      }
      const selfStoryReading = readSelfStoryArchitecture({ state, truth, emotionalCore });
      const identityContinuityReading = readIdentityContinuity({ state, truth, emotionalCore });
      const meaningSystemsReading = readPrivateMeaningSystems({ state, truth, emotionalCore });
      const selfTranslationReading = readEmotionalSelfTranslation({ state, truth, emotionalCore });
      if (selfTranslationReading.primary) {
        emit({ stage: 'emotional-self-translation', message: `${selfTranslationReading.primary.id} — gap visible ${selfTranslationReading.gap_visible.toFixed(1)}/10` });
      }
      const personalMythologyReading = readPersonalMythology({ state, truth, emotionalCore });

      // ─── Phase 24 — predictive human states ───────────────────
      const emotionalForecastReading = readEmotionalForecasting({
        state, truth, emotionalCore, recentTrail: emotionalTrail,
      });
      emit({
        stage: 'emotional-forecasting',
        message: `${emotionalForecastReading.direction} — confidence ${emotionalForecastReading.forecast_confidence.toFixed(1)}/10, inevitability ${emotionalForecastReading.inevitability.toFixed(1)}/10${emotionalForecastReading.forecast_too_clean ? ' — TOO CLEAN' : ''}`,
      });
      const behaviorPredictionReading = readBehaviorPrediction({ state, truth, emotionalCore });
      const collapseProbabilityReading = readCollapseProbability({ state, truth, recentTrail: emotionalTrail });
      if (collapseProbabilityReading.probability >= 5) {
        emit({
          stage: 'collapse-probability',
          message: `${collapseProbabilityReading.probability.toFixed(1)}/10 (${collapseProbabilityReading.horizon})${collapseProbabilityReading.depicts_collapse_directly ? ' — DEPICTS COLLAPSE DIRECTLY' : ''}`,
        });
      }
      const recoveryAttemptReading = readRecoveryAttemptModel({ state, truth, emotionalCore });
      const pressureTrajectoryReading = readFuturePressureTrajectory({ state, truth, recentTrail: emotionalTrail });
      const emotionalDriftReading = readEmotionalDriftPrediction({ state, recentTrail: emotionalTrail });

      // ─── Phase 25 — autonomous campaign intelligence ──────────
      const autonomousNarrativeReading = readAutonomousNarrativeEngine({ recentTrail: emotionalTrail });
      const culturalSignalEvolutionReading = readCulturalSignalEvolution({ ingestedSignals });
      const selfUpdatingPsychologyReading = await readSelfUpdatingPsychology({ store: humanDesireStore });
      const emergentCampaignMemoryReading = readEmergentCampaignMemory({ recentTrail: emotionalTrail });
      const collectiveRealityTrackingReading = readCollectiveRealityTracking({
        recentTrail: emotionalTrail, ingestedSignals,
      });
      const adaptiveEmotionalIntelligenceReading = readAdaptiveEmotionalIntelligence({
        autonomousNarrative: autonomousNarrativeReading,
        culturalSignalEvolution: culturalSignalEvolutionReading,
        selfUpdatingPsychology: selfUpdatingPsychologyReading,
        emergentCampaignMemory: emergentCampaignMemoryReading,
        collectiveRealityTracking: collectiveRealityTrackingReading,
      });
      emit({
        stage: 'autonomous-intelligence',
        message: `directive: ${adaptiveEmotionalIntelligenceReading.directive} (urgency ${adaptiveEmotionalIntelligenceReading.adaptation_urgency.toFixed(1)}/10) — ${adaptiveEmotionalIntelligenceReading.organism_state}`,
      });

      // ─── Phases 20–25 — unified human cognition graph ─────────
      const unifiedGraphReading = readUnifiedHumanGraph({
        state,
        recentTrail: emotionalTrail,
        desireEntries: desireEntriesAtRunStart,
        forecast: emotionalForecastReading,
        drift: emotionalDriftReading,
        adaptive: adaptiveEmotionalIntelligenceReading,
      });
      emit({
        stage: 'unified-human-graph',
        message: `coherence ${unifiedGraphReading.human_coherence.toFixed(1)}/10 · candidate-belongs ${unifiedGraphReading.candidate_belongs.toFixed(1)}/10 — ${unifiedGraphReading.portrait}`,
      });
      // ───────────────────────────────────────────────────────────

      // ═══ PHASE 26 — UNIFIED COGNITIVE FIELD ═══════════════════
      // The nervous system. Every reading above is now unified into
      // ONE living world-state. The system stops running modules in
      // a line and starts maintaining a persistent psychological
      // world. The meta-critic's central Phase 26 question:
      //   "Did this output EMERGE from the world model, or was it
      //    merely DECORATED by the intelligence modules?"
      const symbolicObjectsReading = readSymbolicObjects({ truth, sceneText: brief.scene });
      const cognitiveField = buildCognitiveField({
        state, truth, emotionalCore,
        culturalMicroMoment,
        systemicCause: systemicCauseReading,
        cognitiveResidue: cognitiveResidueReading,
        behaviorLoop: behaviorLoopReading,
        behavioralResidue: behavioralResidueReading,
        socialMasking: socialMaskingEngineReading,
        desire: desireArchitectureReading,
        ritualFormation: ritualFormationReading,
        attachmentLoops: attachmentLoopsReading,
        internalNarrative: internalNarrativeReading,
        selfStory: selfStoryReading,
        forecast: emotionalForecastReading,
        collectiveMovement: collectiveMovementReading,
        truthPersistenceReport,
        decay: emotionalDecayReading,
        symbolicObjects: symbolicObjectsReading,
        unifiedGraph: unifiedGraphReading,
        worldState,
      });
      const emotionalPhysicsReading = readEmotionalPhysics({ field: cognitiveField });
      const tensionTopologyReading = mapTensionTopology({ field: cognitiveField, truth });
      const lifeTrajectoryReading = projectLifeTrajectory({
        forecast: emotionalForecastReading,
        behaviorPrediction: behaviorPredictionReading,
        collapseProbability: collapseProbabilityReading,
        recoveryAttempt: recoveryAttemptReading,
        pressureTrajectory: pressureTrajectoryReading,
        drift: emotionalDriftReading,
      });
      // Build the contradiction-resolver votes from the live cognition.
      const contradictionVotes: ModuleVote[] = [
        {
          voice: 'human-truth',
          position: emotionalCore ? `serve the core "${emotionalCore.id}"` : 'serve the observed truth',
          strength: emotionalCore ? 9 : 6,
        },
        {
          voice: 'reality-pressure',
          position: systemicCauseReading.has_systemic_cause
            ? `keep the systemic cause "${systemicCauseReading.matched_systems.primary!.id}" visible`
            : 'no structural pressure to honour',
          strength: systemicCauseReading.has_systemic_cause ? 8 : 2,
        },
        {
          voice: 'behavioral-authenticity',
          position: behaviorLoopReading.primary_loop
            ? `keep the behaviour "${behaviorLoopReading.primary_loop.id}" observed, not performed`
            : 'keep the body behaviour authentic',
          strength: nonPerformative && nonPerformative.trying_to_simulate ? 8 : 5,
        },
        {
          voice: 'cultural-honesty',
          position: 'keep the register unguarded, not performative',
          strength: privateLanguageReading.performative_signatures.length > 0 ? 8 : 4,
        },
        {
          voice: 'campaign-atmosphere',
          position: `stay continuous with: ${cognitiveField.campaignAtmosphere}`,
          strength: unifiedGraphReading.human_coherence >= 6 ? 6 : 3,
        },
        {
          voice: 'product-commercial',
          position: `product role: ${direction.productRole}`,
          strength: direction.productRole === 'hidden' || direction.productRole === 'environmental' ? 3 : 6,
        },
        {
          voice: 'aesthetic-preference',
          position: 'whatever reads as most visually striking',
          strength: visualTaste.score >= 8 ? 6 : 4,
        },
      ];
      const contradictionResolution = resolveContradictions({ votes: contradictionVotes });
      emit({
        stage: 'cognitive-field',
        message: `unified — confidence ${cognitiveField.worldStateConfidence}/10 · coherence ${cognitiveField.field_coherence}/10 · emergence ${cognitiveField.emergence_score}/10 · governing voice "${contradictionResolution.governing_voice}"`,
      });
      if (emotionalPhysicsReading.primary_chain) {
        emit({
          stage: 'emotional-physics',
          message: `${emotionalPhysicsReading.primary_chain.chain.join(' → ')} (clarity ${emotionalPhysicsReading.causal_clarity.toFixed(1)}/10)`,
        });
      }
      if (tensionTopologyReading.deepest_opportunity) {
        emit({
          stage: 'tension-topology',
          message: `deepest opportunity: "${tensionTopologyReading.deepest_opportunity.the_tension}" (depth ${tensionTopologyReading.opportunity_depth}/10)${tensionTopologyReading.truth_inhabits_opportunity ? ' — INHABITED' : ' — not inhabited'}`,
        });
      }
      emit({
        stage: 'life-trajectory',
        message: lifeTrajectoryReading.trajectory_statement,
      });
      // ═══════════════════════════════════════════════════════════

      // ═══ PHASE 27 — PERSISTENT RUNTIME: CONTINUITY CHECK ═══════
      // The run is measured against everything the prior runs left.
      // The meta-critic's Phase 27 question: "did this generation
      // respect what the system has already learned, or behave like a
      // fresh prompt?"
      const rejectionAssessment = assessAgainstRejectionMemory({
        candidateConcept: `${emotionalCore?.id ?? ''} ${truth.truth}`,
        candidateTerritory: state.family,
        rejectionMemory: runtimeContext.rejectionMemory,
      });
      const approvalAssessment = assessAgainstApprovalMemory({
        candidateConcept: `${emotionalCore?.id ?? ''} ${truth.truth}`,
        candidateTerritory: state.family,
        candidateObjectMotif: symbolicObjectsReading.objects_present[0]?.object ?? '',
        candidateProductRole: direction.productRole,
        approvalMemory: runtimeContext.approvalMemory,
      });
      const cognitiveContinuity = scoreCognitiveContinuity({
        generationIndex: runtimeContext.generationIndex,
        field: cognitiveField,
        priorDirective: runtimeContext.nextRunDirective,
        rejectionAssessment,
        approvalAssessment,
        priorState: runtimeContext.priorState,
        worldStateGen: worldState.generationCount,
        candidateTerritory: state.family,
        truthPersistence: cognitiveField.truthPersistence,
        unifiedGraphCoherence: unifiedGraphReading.human_coherence,
      });
      emit({
        stage: 'cognitive-continuity',
        message: cognitiveContinuity.is_first_run
          ? 'first run — continuity baseline established'
          : `continuity ${cognitiveContinuity.continuity_score}/10${cognitiveContinuity.behaved_like_fresh_prompt ? ' — BEHAVED LIKE A FRESH PROMPT' : ''}`,
      });
      // The runtime identity defends human truth over engagement pull.
      const identityDefense = defendIdentity({
        engagementTrendPull: reaction.engagementQuality,
        humanTruthStrength: cognitiveField.emergence_score,
        productVisibilityPush: direction.productRole === 'hidden' || direction.productRole === 'environmental' ? 2 : 7,
        culturalHonesty: privateLanguageReading.private_language_score,
      });
      // ═══════════════════════════════════════════════════════════

      // ─── Phase 4 — aftertaste prediction + atmosphere snapshot
      // computed pre-verdict so the meta-critic can gate on them. ──
      const tentativeAftertaste = predictAftertaste({
        bannerId,
        shippedAt: Date.now(),
        engagement: null,
        bannerDNA: dna,
        predictedReactionAt3s: reaction.at_3s,
        tensionPhrase: truth.tension,
        truthLength: truth.truth.length,
      });
      const tentativeFootprint: BannerFootprint = {
        bannerId,
        dna,
        job: jobDecision.job,
        family: state.family,
        truth: truth.truth,
        tension: truth.tension,
      };
      const priorFootprints: BannerFootprint[] = emotionalTrail.slice(0, 19).map((e) => ({
        bannerId: e.bannerId,
        dna: dnaFromFacts(e.facts),
        job: e.job ?? 'sell',
        family: e.family,
        truth: e.truth,
        tension: e.tension,
      }));
      const tentativeAtmosphere = analyzeAtmosphere([tentativeFootprint, ...priorFootprints]);
      emit({
        stage: 'aftertaste',
        message: `predicted ${tentativeAftertaste.residueStrength.toFixed(1)}/10 · spike-vs-residue ${tentativeAftertaste.spikeVsResidueRatio.toFixed(2)}`,
        data: tentativeAftertaste,
      });
      emit({
        stage: 'atmosphere',
        message: `consistency ${tentativeAtmosphere.consistency.toFixed(1)}/10 · uniformity penalty ${tentativeAtmosphere.uniformityPenalty.toFixed(1)}`,
        data: tentativeAtmosphere,
      });
      // ───────────────────────────────────────────────────────────

      // ═══ WAVE 2 — REALITY EXECUTION ARCHITECTURE (Phases 28–35) ═
      // The system stops being only a living mind and becomes a
      // living creative organism acting in reality: it senses the
      // campaign, reads attention, sees the frame, tracks emotional
      // continuity, interprets audience feedback, resists optimisation
      // corruption, protects identity, and makes a real creative
      // decision.
      const nervousSystemReading = readCampaignNervousSystem({
        engagements: allEngagements, trail: emotionalTrail,
      });
      emit({
        stage: 'campaign-nervous-system',
        message: `pulse ${nervousSystemReading.campaignPulse} · ${nervousSystemReading.emotionally_alive ? 'EMOTIONALLY ALIVE' : 'REPEATING ITSELF'} — ${nervousSystemReading.recommendedResponse}`,
      });
      const attentionPhysicsReading = readAttentionPhysics({
        truth, direction, composition, psychology, gravity,
        at_0_3s: reaction.at_0_3s, at_1s: reaction.at_1s, at_3s: reaction.at_3s,
      });
      emit({
        stage: 'attention-physics',
        message: `${attentionPhysicsReading.attention_is_true ? 'TRUE attention' : attentionPhysicsReading.attention_is_loud ? 'LOUD attention' : 'weak attention'} · scroll-stop ${attentionPhysicsReading.scrollStopProbability}/10 · risk ${attentionPhysicsReading.attentionRisk}/10`,
      });
      const visualCognitionReading = readVisualCognition({ composition, direction, brief });
      emit({
        stage: 'visual-cognition',
        message: `${visualCognitionReading.frame_is_seen ? 'frame SEEN (observed)' : 'frame ASSEMBLED'} · realism ${visualCognitionReading.realismScore}/10${visualCognitionReading.recommendedFrameAdjustment ? ' — ' + visualCognitionReading.recommendedFrameAdjustment : ''}`,
      });
      const emotionalContinuityReading = readEmotionalContinuityRuntime({
        trail: emotionalTrail,
        candidateTruth: truth,
        candidateFamily: state.family,
        candidateMotifs: symbolicObjectsReading.objects_present.map((o) => o.object),
      });
      emit({
        stage: 'emotional-continuity-runtime',
        message: `arc ${emotionalContinuityReading.activeEmotionalArc} · next move "${emotionalContinuityReading.nextEmotionalMove}" · repetition risk ${emotionalContinuityReading.emotionalRepetitionRisk}/10`,
      });
      const audienceFeedbackReading = readAudienceRealityFeedback({ engagements: allEngagements });
      if (audienceFeedbackReading.has_feedback) {
        emit({
          stage: 'audience-reality-feedback',
          message: `${audienceFeedbackReading.audience_recognised_itself ? 'audience RECOGNISED ITSELF' : 'audience reacted to STIMULATION'} · deep ${audienceFeedbackReading.deepEngagement}/10 vs shallow ${audienceFeedbackReading.shallowEngagement}/10`,
        });
      }
      const nonPerformativeScore = nonPerformative
        ? Math.max(0, Math.min(10, 10 - nonPerformative.performativeness_score))
        : 6;
      const recognitionScore = collectiveRecognition?.recognition_score ?? 5;
      const antiOptimizationReading = readAntiOptimization({
        direction,
        hookStrength: attentionPhysicsReading.scrollStopProbability,
        aftertaste: tentativeAftertaste.residueStrength,
        truthStrength: cognitiveField.emergence_score,
        attentionIsLoud: attentionPhysicsReading.attention_is_loud,
        recognition: recognitionScore,
        engagementStrength: reaction.engagementQuality,
        engagementDepth: audienceFeedbackReading.has_feedback ? audienceFeedbackReading.deepEngagement : reaction.engagementQuality * 0.7,
        viralContamination: viralPatternsReading.contamination_score,
        usesOverCirculatedVocab: viralPatternsReading.uses_over_circulated,
        commentPerformativeness: audienceFeedbackReading.shallowEngagement,
        trendContaminationFlagged: !!culturalDriftReading?.feels_culturally_consumed,
      });
      if (antiOptimizationReading.optimization_corrupts_truth) {
        emit({
          stage: 'anti-optimization',
          message: `RESIST — ${antiOptimizationReading.recommendedResistance}`,
        });
      }
      const identityPersistenceReading = readIdentityPersistence({
        truth, direction, emotionalCore,
        trail: emotionalTrail,
        recognition: recognitionScore,
        nonPerformative: nonPerformativeScore,
        emergence: cognitiveField.emergence_score,
        copyText: typography.primary.text,
      });
      emit({
        stage: 'identity-persistence',
        message: `${identityPersistenceReading.still_unmistakably_mood ? 'still unmistakably MOOD' : 'IDENTITY AT RISK'} · risk ${identityPersistenceReading.identityRisk}/10${identityPersistenceReading.identityCorrection ? ' — ' + identityPersistenceReading.identityCorrection : ''}`,
      });
      const autonomousDirectionReading = directAutonomousCreative({
        state,
        trail: emotionalTrail,
        nervousSystem: nervousSystemReading,
        continuity: emotionalContinuityReading,
        feedback: audienceFeedbackReading,
        antiOptimization: antiOptimizationReading,
        identity: identityPersistenceReading,
      });
      const realityExecution = orchestrateRealityExecution({
        nervousSystem: nervousSystemReading,
        attention: attentionPhysicsReading,
        visualCognition: visualCognitionReading,
        continuity: emotionalContinuityReading,
        feedback: audienceFeedbackReading,
        antiOptimization: antiOptimizationReading,
        identity: identityPersistenceReading,
        direction: autonomousDirectionReading,
      });
      emit({
        stage: 'reality-execution',
        message: `${realityExecution.executionVerdict} — ${realityExecution.creativeDirectorMemo}`,
      });
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 4 — EXECUTIVE COGNITION LAYER (Phases 36–42) ═════
      // The system stops reacting and begins to GOVERN itself —
      // prioritising, deferring, protecting, and deciding like a
      // strategic creative director operating inside a model of the
      // psychological world.
      const candidateRegister: 'soft' | 'intense' | 'neutral' =
        direction.emotionalPacing === 'quiet' || direction.emotionalPacing === 'collapsed' ? 'soft'
        : direction.emotionalPacing === 'tense' || direction.emotionalPacing === 'wired' ? 'intense'
        : 'neutral';
      const candidateEmotionalNovelty = Math.max(0, 10 - emotionalContinuityReading.emotionalRepetitionRisk);

      // Phase 37 — cognitive energy management.
      const cognitiveEnergyReading = readCognitiveEnergy({
        trail: emotionalTrail,
        engagements: allEngagements,
        emotionalNovelty: candidateEmotionalNovelty,
        hookStrength: attentionPhysicsReading.scrollStopProbability,
        loudness: attentionPhysicsReading.attention_is_loud ? 8 : 3,
        aftertaste: tentativeAftertaste.residueStrength,
        recognition: recognitionScore,
      });
      emit({
        stage: 'cognitive-energy',
        message: `${cognitiveEnergyReading.should_speak ? 'SHOULD SPEAK' : 'should NOT speak'} · energy ${cognitiveEnergyReading.cognitive_energy}/10 — ${cognitiveEnergyReading.reason}`,
      });

      // Phase 38 — temporal psychology.
      const temporalPsychologyReading = readTemporalPsychology({
        candidateRegister,
        collectiveTension: executiveWorldState.world_tension,
        collectiveExhaustion: executiveWorldState.collective_exhaustion,
      });
      if (temporalPsychologyReading.timing_is_wrong) {
        emit({
          stage: 'temporal-psychology',
          message: `timing is wrong — ${temporalPsychologyReading.reason}`,
        });
      }

      // Phase 39 — executive identity governance.
      const identityGovernanceReading = readIdentityGovernance({
        truth,
        realism: visualCognitionReading.realismScore,
        restraint: direction.restraint * 10,
        nonPerformative: nonPerformativeScore,
        hasTension: truth.tension.trim().length > 8,
        imperfection: lifeNoise ? lifeNoise.mess_score : 5,
        productAsFix: false,
        emergence: cognitiveField.emergence_score,
        recognition: recognitionScore,
        improvementPressure: aspirationalGapReading.uses_marketing_vocab ? 7 : 2,
        copyText: typography.primary.text,
      });
      emit({
        stage: 'identity-governance',
        message: `${identityGovernanceReading.exhausted_human_would_trust ? 'a real exhausted human would TRUST this' : 'IDENTITY GOVERNANCE FLAG — only aesthetic admiration'}${identityGovernanceReading.governanceCorrection ? ' — ' + identityGovernanceReading.governanceCorrection : ''}`,
      });

      // Phase 40 — strategic campaign lifecycle.
      const campaignLifecycleReading = readCampaignLifecycle({
        trail: emotionalTrail,
        recognitionDepth: audienceFeedbackReading.has_feedback ? audienceFeedbackReading.deepEngagement : recognitionScore,
        identityRisk: identityGovernanceReading.violationSeverity,
      });
      emit({
        stage: 'campaign-lifecycle',
        message: campaignLifecycleReading.lifecycleSummary,
      });

      // Phase 36 — strategic priority engine.
      const strategicPriorityReading = readStrategicPriority({
        truthValue: cognitiveField.emergence_score,
        resonance: recognitionScore,
        identityRisk: identityGovernanceReading.violationSeverity,
        saturationRisk: nervousSystemReading.saturationRisk,
        optimizationRisk: antiOptimizationReading.optimizationRisk,
        viralityRisk: antiOptimizationReading.viralityRisk,
        engagementPull: reaction.engagementQuality,
        engagementDepth: audienceFeedbackReading.has_feedback ? audienceFeedbackReading.deepEngagement : reaction.engagementQuality * 0.7,
        emotionalNovelty: candidateEmotionalNovelty,
        outputPressure: cognitiveEnergyReading.outputFatigue,
        fatigue: Math.max(0, 10 - cognitiveEnergyReading.cognitive_energy),
        culturalImportance: recognitionScore,
      });
      emit({
        stage: 'strategic-priority',
        message: strategicPriorityReading.executiveSummary,
      });

      // Phase 41 — executive decision runtime.
      const worldUnderstanding = campaignUnderstandsWorld(executiveWorldState, candidateRegister);
      const executiveDecision = runExecutiveRuntime({
        strategicPriority: strategicPriorityReading,
        cognitiveEnergy: cognitiveEnergyReading,
        temporal: temporalPsychologyReading,
        identityGovernance: identityGovernanceReading,
        lifecycle: campaignLifecycleReading,
        worldState: executiveWorldState,
        worldUnderstanding,
      });
      emit({
        stage: 'executive-runtime',
        message: `DECISION: ${executiveDecision.action} (confidence ${executiveDecision.decision_confidence}/10, governing voice "${executiveDecision.governing_voice}") — ${executiveDecision.reasoning.executive_memo}`,
      });
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 5 — AUTONOMOUS STRATEGIC SOCIETY (Phases 43–55) ══
      // The system stops being one executive intelligence and becomes
      // a SOCIETY of cognitive entities. It argues with itself before
      // acting — eleven entities convene, debate, and reach a
      // consensus the campaign acts on.
      const councilBriefing: CouncilBriefing = {
        strategicWeight: strategicPriorityReading.strategic_weight,
        priorityBand: strategicPriorityReading.priority_band,
        strategicallyUnwise: strategicPriorityReading.strategically_unwise,
        merelyEmotionallyEffective: strategicPriorityReading.merely_emotionally_effective,
        longTermEquity: strategicPriorityReading.long_term_equity,
        identityGovernanceBlocks: identityGovernanceReading.governance_blocks,
        exhaustedHumanTrust: identityGovernanceReading.exhausted_human_would_trust,
        identityRisk: identityGovernanceReading.violationSeverity,
        collectiveRecognition: recognitionScore,
        worldTension: executiveWorldState.world_tension,
        culturalClimate: executiveWorldState.climate,
        viralContamination: viralPatternsReading.contamination_score,
        audienceHasFeedback: audienceFeedbackReading.has_feedback,
        audienceRecognisedItself: audienceFeedbackReading.audience_recognised_itself,
        deepEngagement: audienceFeedbackReading.deepEngagement,
        shallowEngagement: audienceFeedbackReading.shallowEngagement,
        responseCorruptsTruth: audienceFeedbackReading.response_corrupts_truth,
        emotionalRepetitionRisk: emotionalContinuityReading.emotionalRepetitionRisk,
        truthPersistence: cognitiveField.truthPersistence,
        continuityScore: cognitiveContinuity.continuity_score,
        attentionIsTrue: attentionPhysicsReading.attention_is_true,
        attentionIsLoud: attentionPhysicsReading.attention_is_loud,
        attentionRisk: attentionPhysicsReading.attentionRisk,
        cognitiveEnergy: cognitiveEnergyReading.cognitive_energy,
        shouldSpeak: cognitiveEnergyReading.should_speak,
        recommendSilence: cognitiveEnergyReading.recommend_silence,
        optimizationCorruptsTruth: antiOptimizationReading.optimization_corrupts_truth,
        optimizationRisk: antiOptimizationReading.optimizationRisk,
        campaignUnderstandsWorld: worldUnderstanding.campaign_understands_world,
        worldStrained: executiveWorldState.world_tension >= 6,
        lifecycleState: campaignLifecycleReading.lifecycle_state,
        campaignHealth: campaignLifecycleReading.campaign_health,
        isRealDecision: autonomousDirectionReading.is_a_real_decision,
        executiveAction: executiveDecision.action,
        executiveIsOutput: executiveDecision.is_an_output,
        executiveConfidence: executiveDecision.decision_confidence,
        emergence: cognitiveField.emergence_score,
        truthValue: strategicPriorityReading.truth_value,
      };
      const councilSession = conveneCognitiveCouncil({ briefing: councilBriefing });
      // Multi-agent memory bias — each entity argues with the
      // authority its track record has earned.
      const memoryBias = applyMemoryBias(councilSession.opinions, councilReputationBook);
      councilSession.opinions = memoryBias.biased_opinions;
      const internalDebate = runInternalDebate({ session: councilSession });
      const councilConflict = resolveCouncilConflict({ opinions: councilSession.opinions, debate: internalDebate });
      const narrativeArc = readNarrativeArcIntelligence({ briefing: councilBriefing });
      const silenceGovernance = readSilenceRestraintGovernance({ briefing: councilBriefing, opinions: councilSession.opinions });
      const audienceSociety = readAudienceInterpretationSociety({ briefing: councilBriefing, opinions: councilSession.opinions });
      const identityCourt = holdIdentityDefenseCourt({ briefing: councilBriefing, opinions: councilSession.opinions });
      const selfReflection = reflectOnHypocrisy({ briefing: councilBriefing, opinions: councilSession.opinions });
      const campaignPlan = planAutonomousCampaign({ briefing: councilBriefing, conflict: councilConflict, debate: internalDebate });
      const executiveConsensus = runExecutiveConsensus({
        conflict: councilConflict, debate: internalDebate, silence: silenceGovernance,
        identityCourt, selfReflection,
      });
      const strategicConsciousness = readAutonomousStrategicConsciousness({
        session: councilSession, debate: internalDebate, consensus: executiveConsensus,
        selfReflection, plan: campaignPlan, arc: narrativeArc,
      });
      emit({
        stage: 'cognitive-council',
        message: `${councilSession.tally.advocate} advocate / ${councilSession.tally.object} object / ${councilSession.tally.caution} caution — debate tension ${internalDebate.debate_tension}/10${internalDebate.shallow_consensus ? ' — SHALLOW CONSENSUS' : ''}`,
      });
      emit({
        stage: 'strategic-consciousness',
        message: `VERDICT: ${strategicConsciousness.verdict} (consciousness ${strategicConsciousness.consciousness_score}/10) — ${strategicConsciousness.conscious_statement}`,
      });
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 6 — COGNITIVE CIVILIZATION (Phases 56–70) ════════
      // Wave 5 created disagreement; Wave 6 reads it against HISTORY.
      // The civilization's institutional memory, beliefs, myths,
      // scars, laws, ethics, and stability all weigh on the decision.
      const civCandidateDescriptor = `${state.family} ${truth.truth.slice(0, 90)}`;
      // The governing priority — the highest-conviction council voice.
      const decisiveOpinion = [...councilSession.opinions].sort((a, b) => b.conviction - a.conviction)[0];
      const civGoverningPriority = decisiveOpinion?.priority_defended ?? 'unsettled';

      const civInstitutionalMemory = readInstitutionalMemory(civilization);
      const civCulturalDrift = readCulturalDrift(civilization);
      const civBeliefs = readBeliefPersistence(civilization);
      const civMythology = readStrategicMythology(civilization);
      const civReputationEconomy = readReputationEconomy(civilization);
      const civTrustAuthority = readTrustAuthority(civilization);
      const civIdeologicalMutation = readIdeologicalMutation(civilization);
      const civScars = readScarMemory({ state: civilization, candidateDescriptor: civCandidateDescriptor });
      const civDecisionArchive = readDecisionArchive({ state: civilization, currentVerdict: strategicConsciousness.verdict });
      const civLaws = readCognitiveLaws({ state: civilization, candidateDescriptor: civCandidateDescriptor });
      const civEthics = readExecutiveEthics({
        state: civilization,
        manufacturesInadequacy: aspirationalGapReading.uses_marketing_vocab,
        exploitsExhaustion: ritualCompensationReading.romanticisation_detected,
        usesFalseUrgency: strategicPriorityReading.urgency_kind === 'false-urgency',
        aestheticisesSuffering: nonPerformative ? nonPerformative.trying_to_simulate : false,
        performsCare: fakeRecoveryReading.performs_rest,
      });
      const civPolitics = readInternalPoliticalDynamics({ opinions: councilSession.opinions });
      const civStability = readCivilizationStability({
        state: civilization, drift: civCulturalDrift,
        mutation: civIdeologicalMutation, authority: civTrustAuthority,
      });
      const civLongTermPlan = planAutonomousLongTerm({
        state: civilization, drift: civCulturalDrift, scars: civScars,
      });
      const civIdentityHeld =
        !antiOptimizationReading.optimization_corrupts_truth &&
        identityGovernanceReading.exhausted_human_would_trust;
      const civIdentityContinuity = readEmergentIdentityContinuity({
        state: civilization,
        institutional: civInstitutionalMemory,
        beliefs: civBeliefs,
        stability: civStability,
        laws: civLaws,
        scars: civScars,
        identityHeld: civIdentityHeld,
      });
      emit({
        stage: 'civilization',
        message: `${civStability.condition} (${civStability.stability}/10) · identity continuity ${civIdentityContinuity.identity_continuity}/10 · ${civIdentityContinuity.historical_explanation}`,
      });
      if (civLaws.violates_a_law) {
        emit({ stage: 'cognitive-law', message: `the candidate violates a standing law — "${civLaws.violated_law!.law}"` });
      }
      if (civScars.touches_a_scar) {
        emit({ stage: 'psychological-scar', message: `the candidate reopens an unhealed scar — "${civScars.reopened_scar!.wound}"` });
      }
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 7 — REALITY ORGANISM (Phases 71–90) ══════════════
      // Wave 6 built a civilization with history. Wave 7 makes it a
      // LIVING ORGANISM interacting continuously with a changing
      // reality: it reads the environment it lives inside, defends
      // itself, spends finite energy — and learns when NOT to act.
      const w7ViralContamination = antiOptimizationReading.viralityRisk;
      const w7StrategicWeight = strategicPriorityReading.strategic_weight;
      // The organism is "stimulation-driven" when optimization pressure
      // or false urgency — not identity — is pushing the run. This is
      // the line between adapting (survives) and reacting (addicted).
      const w7StimulationDriven =
        antiOptimizationReading.optimization_corrupts_truth ||
        strategicPriorityReading.urgency_kind === 'false-urgency';
      const w7IdentityGoverns = civIdentityHeld && !w7StimulationDriven;

      const orgEnvironmental = mapEnvironmentalPressure({ worldState: executiveWorldState });
      const orgImmune = readCognitiveImmuneSystem({
        organism,
        trendContaminated: antiOptimizationReading.trendContamination || culturalDriftReading.feels_culturally_consumed,
        optimizationCorrupts: antiOptimizationReading.optimization_corrupts_truth,
        identityDrifting: civIdeologicalMutation.mutation_detected || identityGovernanceReading.governance_blocks,
        viralContamination: w7ViralContamination,
        consecutiveActions: organism.consecutiveActions,
      });
      const orgEnergy = allocateStrategicEnergy({
        organism,
        strategicWeight: w7StrategicWeight,
        environmentalLoad: orgEnvironmental.environmental_load,
      });
      const orgClimate = detectNarrativeClimate({
        worldState: executiveWorldState,
        viralContamination: w7ViralContamination,
      });
      const orgIdentityStress = readIdentityStressTest({
        engagementPull: antiOptimizationReading.engagementCorruption,
        environmentalLoad: orgEnvironmental.environmental_load,
        identityStrength: civIdentityContinuity.identity_continuity,
        timingWrong: temporalPsychologyReading.timing_is_wrong,
        optimizationCorrupts: antiOptimizationReading.optimization_corrupts_truth,
      });
      const orgExpansion = readExpansionVsPreservation({
        organism,
        environmentalLoad: orgEnvironmental.environmental_load,
        civilizationStability: civStability.stability,
      });
      const orgRhythm = readRealityRhythmSync({
        worldState: executiveWorldState,
        temporal: temporalPsychologyReading,
      });
      const orgAttentionForecast = forecastCollectiveAttention({
        worldState: executiveWorldState,
        trail: emotionalTrail,
      });
      const orgMemetic = detectMemeticThreats({ truth, copyText: direction.hook });
      const orgFatigue = readCivilizationFatigue({
        organism,
        environmentalLoad: orgEnvironmental.environmental_load,
      });
      const orgComplexity = readInternalComplexityRegulation({
        organism,
        contradictionCount: contradictionResolution.conflicts.length,
        softSignalCount:
          contradictionResolution.conflicts.length +
          civStability.decay_signals.length +
          orgImmune.threats_detected.length +
          rejectedAttempts.length,
      });
      const orgStabilityPreservation = readAutonomousStabilityPreservation({
        organism, fatigue: orgFatigue, complexity: orgComplexity,
      });
      const orgExistentialRisk = readExistentialRisk({
        organism,
        civilization: civStability,
        mutation: civIdeologicalMutation,
        preservation: orgStabilityPreservation,
      });
      const orgSilence = readStrategicSilence({
        needsRecovery: orgFatigue.needs_recovery,
        climateWouldSwallow: orgClimate.climate_would_swallow_it,
        outOfPhase: orgRhythm.phase === 'out-of-phase',
        mustConserve: orgEnergy.must_conserve,
        strategicWeight: w7StrategicWeight,
      });
      const orgEmotionalResource = readEmotionalResourceManagement({
        stress: organism.stressAccumulation,
        strategicWeight: w7StrategicWeight,
        recentIntensity: campaignMemoryV2.saturationScore,
      });
      const orgAdaptiveWorldModel = readAdaptiveWorldStateModeling({
        worldState: executiveWorldState,
        priorWorldState,
      });
      const orgLongHorizon = predictLongHorizon({
        worldState: executiveWorldState, organism,
      });
      const orgEvolutionGovernance = readStrategicEvolutionGovernance({
        departureMagnitude: courage.level === 'radical' ? 7 : courage.level === 'restrained' ? 4 : 1,
        identityStrength: civIdentityContinuity.identity_continuity,
        drivenByShortTermGain: antiOptimizationReading.optimization_corrupts_truth,
      });
      const orgAdaptiveRuntime = readRealityAdaptiveRuntime({
        environmental: orgEnvironmental,
        rhythm: orgRhythm,
        worldModel: orgAdaptiveWorldModel,
        climate: orgClimate,
        stimulationDriven: w7StimulationDriven,
      });
      const orgCore = readPersistentOrganismCore({
        state: organism,
        identityGoverns: w7IdentityGoverns,
        stimulationDriven: w7StimulationDriven,
        existentialRisk: orgExistentialRisk.existential_risk,
        preservationCallsForRest: orgStabilityPreservation.preservation_calls_for_rest,
      });
      emit({
        stage: 'organism',
        message: `${orgCore.condition} (vitality ${orgCore.vitality}/10) · ${orgAdaptiveRuntime.posture} · ${orgLongHorizon.predicted_season} — ${orgCore.organism_statement}`,
      });
      if (orgCore.organism_is_addicted) {
        emit({ stage: 'organism', message: 'META-CRITIC FLAG — the organism is reacting to stimulation, not adapting to reality' });
      }
      if (orgSilence.choose_silence) {
        emit({ stage: 'organism', message: `the organism judges silence the stronger move — ${orgSilence.silence_case}` });
      }
      if (orgExistentialRisk.organism_at_risk) {
        emit({ stage: 'organism', message: `EXISTENTIAL RISK ${orgExistentialRisk.existential_risk}/10 — ${orgExistentialRisk.survival_imperative}` });
      }
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 8 — OPERATING SYSTEM (Phases 91–110) ═════════════
      // Wave 7 made the system a living organism. Wave 8 gives that
      // organism an operating system: a kernel runs the loop, a
      // scheduler allocates cognition, interrupts pre-empt it, a
      // directive engine governs the tick. Every run is one kernel tick.
      const osKernel = readCognitiveKernel({
        organism: orgCore, existentialRisk: orgExistentialRisk,
        complexity: orgComplexity, uptime: osState.uptime,
      });
      const osScheduler = readProcessScheduler({
        kernel: osKernel,
        energyReserves: organism.energyReserves,
        fatigueNeedsRecovery: orgFatigue.needs_recovery,
        existentialRisk: orgExistentialRisk.existential_risk,
      });
      const osInterrupts = readInterruptArchitecture({
        worldShiftRate: orgAdaptiveWorldModel.world_shift_rate,
        modelLagging: orgAdaptiveWorldModel.model_lagging,
        fatigueNeedsRecovery: orgFatigue.needs_recovery,
        identityFailing: !orgIdentityStress.identity_holds,
        ideologicalMutation: civIdeologicalMutation.mutation_detected,
        environmentHostile: orgEnvironmental.environment_is_hostile,
        organismAtRisk: orgExistentialRisk.organism_at_risk,
        contradictionCount: contradictionResolution.conflicts.length,
        memeticInfection: orgMemetic.memetic_infection_risk,
      });
      const osTaskQueue = readStrategicTaskQueue({
        scheduler: osScheduler, interrupts: osInterrupts,
        energyReserves: organism.energyReserves,
      });
      const osResources = readRuntimeResourceAllocation({
        kernel: osKernel,
        energyReserves: organism.energyReserves,
        complexityLoad: orgComplexity.complexity_load,
        deferredAndStarved: osScheduler.deferred_count + osScheduler.starved_count,
      });
      const osCognitionGraph = readActiveCognitionGraph({
        interrupts: osInterrupts, scheduler: osScheduler,
        contradictionCount: contradictionResolution.conflicts.length,
        identityTension: !orgIdentityStress.identity_holds,
      });
      const osDirective = readDirectiveEngine({
        kernel: osKernel, interrupts: osInterrupts,
        organism: orgCore, existentialRisk: orgExistentialRisk,
        silenceChosen: orgSilence.choose_silence,
      });
      const osLoops = readAutonomousRuntimeLoops({
        kernel: osKernel, complexity: orgComplexity, uptime: osState.uptime,
      });
      const osPause = readStrategicPauseInfrastructure({
        directive: osDirective,
        fatigueNeedsRecovery: orgFatigue.needs_recovery,
        shouldRest: orgCore.should_rest,
        organismAtRisk: orgExistentialRisk.organism_at_risk,
      });
      const osHealth = readKernelHealthMonitor({
        complexity: orgComplexity, organism: orgCore, fatigue: orgFatigue,
        identityStress: orgIdentityStress, civilizationDecaying: civStability.is_decaying,
      });
      const osMemoryPressure = readMemoryPressureManagement({
        memoryFootprint: runtimeContext.history.length,
        complexityLoad: orgComplexity.complexity_load,
        organismAge: organism.age,
        relevanceSpike: false,
      });
      const osMultiHorizon = readMultiHorizonPlanning({
        longHorizon: orgLongHorizon, existentialRisk: orgExistentialRisk,
        directive: osDirective,
      });
      const osReflection = readRecursiveReflectionEngine({ kernel: osKernel, health: osHealth });
      const osArbitration = readExecutiveArbitrationCourt({
        wantsGrowth: orgExpansion.posture === 'expand' || orgExpansion.posture === 'balanced-growth',
        optimizationCorrupts: antiOptimizationReading.optimization_corrupts_truth,
        existentialRisk: orgExistentialRisk.existential_risk,
        identityFailing: !orgIdentityStress.identity_holds,
        silenceChosen: orgSilence.choose_silence,
        engagementPull: antiOptimizationReading.engagementCorruption,
      });
      const osIdentityEnforcement = readRuntimeIdentityEnforcement({
        ideologicalMutation: civIdeologicalMutation.mutation_detected,
        identityFailing: !orgIdentityStress.identity_holds,
        governanceBlocks: identityGovernanceReading.governance_blocks,
        arbitratedWinner: osArbitration.arbitrated_winner,
      });
      const osSeason = readDynamicStrategicSeasons({
        currentSeason: osState.currentSeason, seasonAge: osState.seasonAge,
        longHorizon: orgLongHorizon, health: osHealth, directive: osDirective,
        organismAtRisk: orgExistentialRisk.organism_at_risk,
        canExpand: orgExpansion.posture === 'expand',
      });
      const osDependencies = readCognitiveDependencyMapping({
        cognitionGraph: osCognitionGraph, health: osHealth,
        civilizationDecaying: civStability.is_decaying,
      });
      const osStabilization = readAutonomousRuntimeStabilization({
        health: osHealth, kernel: osKernel,
        fragmentationStreak: osState.fragmentationStreak,
        runtimeDrift: runtimeDrift.drift_detected,
        graphTangled: osCognitionGraph.graph_is_tangled,
      });
      const osExecutiveState = readPersistentExecutiveState({
        priorPosture: osState.operationalPosture, directiveLog: osState.directiveLog,
        kernel: osKernel, directive: osDirective, health: osHealth,
      });
      // THE GLOBAL WAVE 8 QUESTION — coordinated cognition, or isolated
      // process stimulation? Addiction or a starved, uncoordinated
      // scheduler means isolated processes are driving the runtime.
      const osIsolatedProcessStimulation =
        orgCore.organism_is_addicted ||
        (osKernel.coordination_score < 4 && osScheduler.starved_count >= 3);
      const osCore = readOperatingSystemCore({
        state: osState, kernel: osKernel, health: osHealth,
        directive: osDirective, stabilization: osStabilization,
        isolatedProcessStimulation: osIsolatedProcessStimulation,
      });
      emit({
        stage: 'operating-system',
        message: `${osCore.os_state} · kernel ${osKernel.kernel_state} · directive "${osDirective.directive}" · season "${osSeason.season}" — ${osCore.os_statement}`,
      });
      if (osCore.runtime_is_fragmenting) {
        emit({ stage: 'operating-system', message: 'META-CRITIC FLAG — the runtime is fragmenting: isolated processes over coordinated cognition' });
      }
      if (osInterrupts.highest) {
        emit({ stage: 'operating-system', message: `interrupt: ${osInterrupts.highest.kind} (severity ${osInterrupts.highest.severity}/10) — ${osInterrupts.highest.demand}` });
      }
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 10 — REALITY COUPLING (Phases 131–150) ═══════════
      // The organism stops living only inside itself. It reads the
      // external world — audience, trust, saturation, the narrative
      // climate — and learns the distinction the wave exists for:
      // TRUE RESONANCE versus STIMULUS ADDICTION.
      const cplRecentShipCount = runtimeContext.history
        .slice(-6).filter((h) => h.verdict === 'approve').length;

      const cplIngestion = readRealityIngestionEngine({
        worldState: executiveWorldState, externalSignalCount: ingestedSignals.length,
      });
      const cplSocialExhaustion = detectSocialExhaustion({ worldState: executiveWorldState });
      const cplSaturation = mapEmotionalSaturation({
        worldState: executiveWorldState,
        priorSaturation: couplingState.saturationMemory,
        recentShipCount: cplRecentShipCount,
      });
      const cplClimate = monitorNarrativeClimate({
        worldState: executiveWorldState,
        externalSignalVolume: cplIngestion.external_signal_volume,
      });
      const cplAudience = readAudienceNervousSystem({
        worldState: executiveWorldState, saturation: cplSaturation.saturation,
      });
      const cplPlatformDrift = readPlatformDrift({
        worldState: executiveWorldState, viralityRisk: antiOptimizationReading.viralityRisk,
      });
      const cplAttentionEconomy = readAttentionEconomyPressure({
        worldState: executiveWorldState, platformDrift: cplPlatformDrift.platform_drift,
      });
      const cplMeaning = readMeaningCompression({
        worldState: executiveWorldState, saturation: cplSaturation.saturation,
        truthValue: strategicPriorityReading.truth_value,
      });
      const cplEngagementTruth = scoreEngagementTruth({
        engagementCorruption: antiOptimizationReading.engagementCorruption,
        viralityRisk: antiOptimizationReading.viralityRisk,
        truthValue: strategicPriorityReading.truth_value,
        optimizationCorrupts: antiOptimizationReading.optimization_corrupts_truth,
      });
      const cplAuthenticity = trackAuthenticityErosion({
        priorAuthenticity: couplingState.authenticityReserve,
        optimizationCorrupts: antiOptimizationReading.optimization_corrupts_truth,
        readsAsStimulus: cplEngagementTruth.reads_as_stimulus,
        platformRewardsNoise: cplPlatformDrift.platform_rewards_noise,
      });
      const cplTrust = readTrustDecay({
        priorTrust: couplingState.trustLevel,
        identityHeld: civIdentityHeld,
        optimizationCorrupts: antiOptimizationReading.optimization_corrupts_truth,
        authenticityEroding: cplAuthenticity.authenticity_eroding,
      });
      const cplReputation = readReputationPressure({
        reputationCredit: couplingState.reputationCredit,
        trustLevel: cplTrust.trust_level,
        optimizationCorrupts: antiOptimizationReading.optimization_corrupts_truth,
      });
      const cplSilence = recommendSilence({
        audienceSaturated: cplSaturation.audience_is_saturated,
        audiencePastThreshold: cplAudience.past_threshold,
        climateRejectsAddition: cplClimate.climate_rejects_addition,
        socialExhaustion: cplSocialExhaustion.social_exhaustion,
      });
      const cplContradiction = detectRealityContradiction({
        organismBelievesItIsAdapting: orgCore.organism_is_adapting,
        runtimeBelievesItIsCoordinated: osCore.runtime_is_coordinated,
        trustIsDecaying: cplTrust.trust_is_decaying,
        audienceExhausted: cplAudience.past_threshold,
        readsAsStimulus: cplEngagementTruth.reads_as_stimulus,
        authenticityEroding: cplAuthenticity.authenticity_eroding,
      });
      const cplWorldFeedback = fuseWorldFeedback({
        externalSignalVolume: cplIngestion.external_signal_volume,
        saturation: cplSaturation.saturation,
        trustTrend: cplTrust.trust_trend,
        audienceState: cplAudience.audience_state,
        platformRewardsNoise: cplPlatformDrift.platform_rewards_noise,
        worldIsExhausted: cplSocialExhaustion.world_is_exhausted,
      });
      const cplResonance = detectTrueResonance({
        engagementTruthScore: cplEngagementTruth.engagement_truth_score,
        readsAsStimulus: cplEngagementTruth.reads_as_stimulus,
        trustTrend: cplTrust.trust_trend,
        audiencePastThreshold: cplAudience.past_threshold,
        feedbackIsNegative: cplWorldFeedback.feedback_is_negative,
      });
      const cplGovernor = governRealityCoupling({
        worldIsSpeaking: cplIngestion.world_is_speaking,
        externalSignalVolume: cplIngestion.external_signal_volume,
        isStimulusAddiction: cplResonance.is_stimulus_addiction,
        feedbackIsNegative: cplWorldFeedback.feedback_is_negative,
      });
      const cplExternalModel = readExternalRealityModel({
        worldIsSpeaking: cplIngestion.world_is_speaking,
        externalSignalVolume: cplIngestion.external_signal_volume,
        contradictionDetected: cplContradiction.contradiction_detected,
        worldFeedbackSignal: cplWorldFeedback.world_feedback_signal,
      });
      const cplHealth = readCouplingHealth({
        couplingMode: cplGovernor.coupling_mode,
        trustIsDecaying: cplTrust.trust_is_decaying,
        authenticityEroding: cplAuthenticity.authenticity_eroding,
        isStimulusAddiction: cplResonance.is_stimulus_addiction,
        modelDiverges: cplExternalModel.model_diverges_from_reality,
      });
      const cplCore = readRealityCouplingCore({
        state: couplingState, worldFeedback: cplWorldFeedback,
        resonance: cplResonance, governor: cplGovernor, health: cplHealth,
      });
      emit({
        stage: 'reality-coupling',
        message: `${cplCore.coupling_state} (coupling ${cplCore.coupling_score}/10) · ${cplResonance.resonance_kind} · ${cplWorldFeedback.world_says}`,
      });
      if (cplCore.organism_is_addicted_to_stimulus) {
        emit({ stage: 'reality-coupling', message: 'META-CRITIC FLAG — the organism is chasing stimulus, not resonating with reality' });
      }
      if (cplSilence.recommend_silence) {
        emit({ stage: 'reality-coupling', message: `the world recommends silence — ${cplSilence.silence_reason}` });
      }
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 11 — STRATEGIC FUTURE (Phases 151–180) ═══════════
      // The organism stops asking "what works now?" and begins asking
      // "what future are we compounding toward?" — simulating
      // scenarios, branching timelines, weighing second-order cost,
      // and protecting identity continuity across the long horizon.
      const futIdentityStrength = civIdentityContinuity.identity_continuity;
      const futPushedForReach =
        antiOptimizationReading.optimization_corrupts_truth || cplResonance.is_stimulus_addiction;

      const futScenarios = simulateFutureScenarios({
        worldState: executiveWorldState,
        trustCarried: couplingState.trustLevel,
        organismVitality: orgCore.vitality,
      });
      const futCulturalShift = predictCulturalShift({ worldState: executiveWorldState });
      const futMarketTiming = readMarketTiming({
        worldState: executiveWorldState, culturalShift: futCulturalShift,
      });
      const futTimeline = readStrategicTimelineBranching({
        scenarios: futScenarios, identityStrength: futIdentityStrength, pushedForReach: futPushedForReach,
      });
      const futNarrative = mapNarrativeFuture({
        trustCarried: couplingState.trustLevel,
        strategicDebt: strategicFutureState.strategicDebt,
        identityHeld: civIdentityHeld,
      });
      const futReputation = modelReputationFuture({
        reputationCredit: couplingState.reputationCredit,
        trustForming: cplTrust.trust_trend === 'forming',
        trustDecaying: cplTrust.trust_is_decaying,
        strategicDebt: strategicFutureState.strategicDebt,
      });
      const futTrustCompounding = readTrustCompounding({
        trustLevel: couplingState.trustLevel,
        trustForming: cplTrust.trust_trend === 'forming',
        trustDecaying: cplTrust.trust_is_decaying,
        patienceHonored: strategicFutureState.patienceHonored,
      });
      const futPatience = readStrategicPatience({
        timing: futMarketTiming, scenarios: futScenarios,
        strategicDebt: strategicFutureState.strategicDebt,
      });
      const futSecondOrder = readSecondOrderConsequence({
        optimizationCorrupts: antiOptimizationReading.optimization_corrupts_truth,
        chasedStimulus: cplResonance.is_stimulus_addiction,
        saturation: cplSaturation.saturation,
      });
      const futIdentityContinuity = planIdentityContinuity({
        identityStrength: futIdentityStrength, scenarios: futScenarios,
        strategicDebt: strategicFutureState.strategicDebt,
        narrativeDrift: futNarrative.drift_from_origin,
      });
      const futAntifragility = readAntiFragility({
        worstCaseDesirability: futScenarios.worst_case.desirability,
        compoundingAdvantage: strategicFutureState.compoundingAdvantage,
        strategicDebt: strategicFutureState.strategicDebt,
        identitySurvives: futIdentityContinuity.identity_survives_horizon,
      });
      const futBlackSwan = mapBlackSwanSensitivity({
        worldState: executiveWorldState, identityStrength: futIdentityStrength,
        compoundingAdvantage: strategicFutureState.compoundingAdvantage,
      });
      const futCompetitor = simulateCompetitorEvolution({
        worldState: executiveWorldState, platformDrift: cplPlatformDrift.platform_drift,
      });
      const futEcosystem = forecastEcosystemPressure({
        worldState: executiveWorldState,
        attentionEconomyPressure: cplAttentionEconomy.attention_economy_pressure,
      });
      const futSacrifice = readStrategicSacrifice({
        compoundingAdvantage: strategicFutureState.compoundingAdvantage,
        strategicDebt: strategicFutureState.strategicDebt, timing: futMarketTiming,
      });
      const futHorizonScan = scanHorizon({
        worldState: executiveWorldState,
        externalSignalVolume: cplIngestion.external_signal_volume,
      });
      const futOpportunityCost = readOpportunityCost({
        scenarios: futScenarios,
        patienceHonored: strategicFutureState.patienceHonored,
        nowOptimizedCount: strategicFutureState.nowOptimizedCount,
      });
      const futCompounding = readCompoundingAdvantage({
        priorAdvantage: strategicFutureState.compoundingAdvantage,
        trustCompounding: futTrustCompounding.trust_compounding,
        futureCompoundedCount: strategicFutureState.futureCompoundedCount,
        nowOptimizedCount: strategicFutureState.nowOptimizedCount,
      });
      const futStrategicDebt = readStrategicDebt({
        priorDebt: strategicFutureState.strategicDebt,
        nowOptimizedCount: strategicFutureState.nowOptimizedCount,
        optimizingForNow: antiOptimizationReading.optimization_corrupts_truth,
      });
      const futMemory = readFutureMemoryArchive({
        predictionsLogged: strategicFutureState.predictionsLogged,
        planningCycles: strategicFutureState.planningCycles,
        futureCompoundedCount: strategicFutureState.futureCompoundedCount,
        nowOptimizedCount: strategicFutureState.nowOptimizedCount,
      });
      const futLongHorizonRisk = readLongHorizonRisk({
        scenarios: futScenarios, antifragility: futAntifragility.antifragility,
        strategicDebt: strategicFutureState.strategicDebt,
      });
      const futIrreversibility = detectIrreversibility({
        sacrificeInPlay: futSacrifice.sacrifice_is_worth_it,
        continuityRisk: futIdentityContinuity.continuity_risk,
        optimizationCorrupts: antiOptimizationReading.optimization_corrupts_truth,
        narrativeDrift: futNarrative.drift_from_origin,
      });
      const futOptionality = readStrategicOptionality({
        healthyBranchCount: futTimeline.branches.filter((b) => b.healthy).length,
        irreversibility: futIrreversibility.irreversibility,
        strategicDebt: strategicFutureState.strategicDebt,
      });
      const futGenerational = readGenerationalStrategy({
        civilizationGeneration: civilization.generation,
        compoundingAdvantage: strategicFutureState.compoundingAdvantage,
        identitySurvivesHorizon: futIdentityContinuity.identity_survives_horizon,
      });
      const futIdentity = projectFutureIdentity({
        identityStrength: futIdentityStrength,
        narrativeDrift: futNarrative.drift_from_origin,
        strategicDebt: strategicFutureState.strategicDebt,
        optimizingForNow: antiOptimizationReading.optimization_corrupts_truth,
      });
      const futConviction = readStrategicConviction({
        identityStrength: futIdentityStrength, scenarios: futScenarios, timing: futMarketTiming,
      });
      const futTemporalArbitrage = detectTemporalArbitrage({
        timing: futMarketTiming, horizon: futHorizonScan,
        competitivePressure: futCompetitor.competitive_pressure,
      });
      const futCoherence = validateFutureCoherence({
        narrativeCoherent: futNarrative.narrative_is_coherent,
        identitySurvivesHorizon: futIdentityContinuity.identity_survives_horizon,
        onHealthyBranch: futTimeline.on_a_healthy_branch,
        identityProjectionTrue: futIdentity.identity_projection_is_true,
      });
      const futGovernor = readStrategicFutureGovernor({
        strategicDebtDangerous: futStrategicDebt.debt_is_dangerous,
        advantageIsCompounding: futCompounding.advantage_is_compounding,
        futureIsCoherent: futCoherence.future_is_coherent,
        secondOrderNegative: futSecondOrder.second_order_is_negative,
      });
      const futCore = readAutonomousStrategicPlanningCore({
        state: strategicFutureState, governor: futGovernor,
        compounding: futCompounding, debt: futStrategicDebt, coherence: futCoherence,
      });
      emit({
        stage: 'strategic-future',
        message: `${futCore.planning_state} (future score ${futCore.strategic_future_score}/10) · ${futMarketTiming.timing} timing · ${futCulturalShift.predicted_shift} — ${futCore.planning_statement}`,
      });
      if (futCore.organism_optimizes_for_now) {
        emit({ stage: 'strategic-future', message: 'META-CRITIC FLAG — the organism is optimizing for now, spending the future for a present gain' });
      }
      if (futPatience.recommend_patience) {
        emit({ stage: 'strategic-future', message: `strategic patience: ${futPatience.patience_case}` });
      }
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 12 — AUTONOMOUS ACTION (Phases 181–220) ══════════
      // The organism stops asking "can we act?" and starts asking
      // "should this action exist in the world at all?" — with
      // explicit guards against compulsive automation.
      const actAuth = readActionAuthorizationRuntime({
        identityIntact: civIdentityHeld,
        resonancePresent: !cplResonance.is_stimulus_addiction,
        trustAvailable: couplingState.trustLevel >= 4,
        timingRight: futMarketTiming.timing === 'ripe' || futMarketTiming.timing === 'closing',
        strategicDebtContained: !futStrategicDebt.debt_is_dangerous,
        audienceHasCapacity: !cplSilence.recommend_silence && cplSocialExhaustion.social_exhaustion < 7,
        realityCouplingHealthy: !cplHealth.coupling_is_failing,
        futurePreserved: !futCore.organism_optimizes_for_now,
      });
      const actExistence = readActionExistenceJustification({
        resonancePresent: !cplResonance.is_stimulus_addiction,
        addsMeaning: !antiOptimizationReading.optimization_corrupts_truth && !cplResonance.is_stimulus_addiction,
        worldHasRoom: !cplSilence.recommend_silence,
        saturation: cplSaturation.saturation,
      });
      const actPublish = readStrategicPublishEngine({
        authorized: actAuth.authorized,
        actionShouldExist: actExistence.action_should_exist,
        timing: futMarketTiming.timing,
        recommendSilence: cplSilence.recommend_silence,
      });
      const actDeployment = readAdaptiveCampaignDeployment({
        worldState: executiveWorldState,
        audienceRecoveryDebt: executionState.audienceRecoveryDebt,
        restraintBudget: executionState.restraintBudget,
      });
      const actPlatform = readPlatformExecutionGovernor({
        platformDrift: cplPlatformDrift.platform_drift,
        attentionChaos: executiveWorldState.attention_chaos,
        saturation: cplSaturation.saturation,
      });
      const actTrustOpt = readTrustAwareOptimization({
        optimizationApplied: antiOptimizationReading.optimization_corrupts_truth || cplResonance.is_stimulus_addiction,
        optimizationCorruptsTruth: antiOptimizationReading.optimization_corrupts_truth,
        chasingStimulus: cplResonance.is_stimulus_addiction,
        trustLevel: couplingState.trustLevel,
      });
      const actAudienceRecovery = readAudienceRecoveryScheduler({
        recoveryDebt: executionState.audienceRecoveryDebt,
        audienceFatigue: cplSocialExhaustion.social_exhaustion,
        recommendSilence: cplSilence.recommend_silence,
      });
      const actSilenceEnforcement = readSilenceEnforcementLayer({
        recommendSilence: cplSilence.recommend_silence,
        audienceNeedsRecovery: !actAudienceRecovery.audience_is_ready,
        saturation: cplSaturation.saturation,
        actionWantsToProceed: true,
      });
      const actPacing = readAdaptivePacingEngine({
        cadenceHealth: executionState.cadenceHealth,
        recoveryDebt: executionState.audienceRecoveryDebt,
        restraintBudget: executionState.restraintBudget,
      });
      const actRisk = readExecutionRiskManagement({
        irreversible: futIrreversibility.decision_is_irreversible,
        blackSwanExposure: futBlackSwan.black_swan_exposure,
        couplingFailing: cplHealth.coupling_is_failing,
        strategicDebt: strategicFutureState.strategicDebt,
      });
      const actNarrativeCont = readNarrativeContinuityEnforcement({
        narrativeDrift: futNarrative.drift_from_origin,
        voiceConsistent: civIdentityHeld,
        contradictsPriorClaim: false,
      });
      const actRollout = readStrategicRolloutIntelligence({
        actionsAuthorized: executionState.actionsAuthorized,
        timingRipe: futMarketTiming.timing === 'ripe',
        recoveryDebt: executionState.audienceRecoveryDebt,
      });
      const actResonancePreserving = readResonancePreservingOptimization({
        resonanceBefore: couplingState.trustLevel,
        optimizationApplied: antiOptimizationReading.optimization_corrupts_truth || cplResonance.is_stimulus_addiction,
        chasedMetric: cplResonance.is_stimulus_addiction,
        stillTruthful: !antiOptimizationReading.optimization_corrupts_truth,
      });
      const actExecMemory = readExecutionMemoryPersistence({
        executionCycles: executionState.executionCycles,
        actionsAuthorized: executionState.actionsAuthorized,
        actionsWithheld: executionState.actionsWithheld,
      });
      const actRisk_val = actRisk.execution_risk;
      const actExperimentation = readAutonomousExperimentationRuntime({
        restraintBudget: executionState.restraintBudget,
        reversible: !futIrreversibility.decision_is_irreversible,
        executionRisk: actRisk_val,
        trustHealthy: couplingState.trustLevel >= 5,
      });
      const actEscalation = readEscalationVsRestraintEngine({
        momentRewardsAction: futMarketTiming.timing === 'ripe',
        restraintBudget: executionState.restraintBudget,
        recoveryDebt: executionState.audienceRecoveryDebt,
        strategicDebt: strategicFutureState.strategicDebt,
      });
      const actMutation = readCampaignMutationControl({
        departureFromEstablished: futNarrative.drift_from_origin,
        identityKept: civIdentityHeld,
        mutationIsDeliberate: false,
      });
      const actFeedback = readFeedbackToStrategyBridge({
        lastActionResonated: executionState.cadenceHealth >= 6,
        audienceShowedFatigue: cplSocialExhaustion.social_exhaustion >= 6,
        timingWasAccurate: true,
      });
      const actConsequence = readActionConsequenceTracker({
        actionsAuthorized: executionState.actionsAuthorized,
        recoveryDebt: executionState.audienceRecoveryDebt,
        trustSpentOnAction: executionState.trustSpentOnAction,
        cadenceHealth: executionState.cadenceHealth,
      });
      const actAudienceReady = actAudienceRecovery.audience_is_ready;
      const actCompulsion = readCompulsiveAutomationDetector({
        restraintBudget: executionState.restraintBudget,
        recoveryDebt: executionState.audienceRecoveryDebt,
        audienceReady: actAudienceReady,
        momentRewardsAction: futMarketTiming.timing === 'ripe',
        actionsWithheld: executionState.actionsWithheld,
        executionCycles: executionState.executionCycles,
      });
      const actDignity = readActionDignityMonitor({
        pleadsForAttention: cplResonance.is_stimulus_addiction,
        manipulates: antiOptimizationReading.optimization_corrupts_truth,
        raisesVoice: cplResonance.is_stimulus_addiction,
        selfPossessed: !cplResonance.is_stimulus_addiction && civIdentityHeld,
      });
      const actLoad = readExecutionLoadBalancer({
        recoveryDebt: executionState.audienceRecoveryDebt,
        restraintBudget: executionState.restraintBudget,
        cadenceHealth: executionState.cadenceHealth,
      });
      const actOverreach = readOverReachDetector({
        ambitionLevel: futScenarios.best_case.desirability,
        trustLevel: couplingState.trustLevel,
        capacity: 10 - executionState.audienceRecoveryDebt,
        reputationCredit: couplingState.reputationCredit,
      });
      const actReversibility = readActionReversibilityPlanner({
        irreversible: futIrreversibility.decision_is_irreversible,
        actionProceeding: true,
        justificationStrength: futCore.strategic_future_score,
      });
      const actDeploymentWindow = readDeploymentWindowGovernor({
        timingRipe: futMarketTiming.timing === 'ripe',
        timingMissed: futMarketTiming.timing === 'missed',
        silenceEnforced: actSilenceEnforcement.silence_enforced,
        audienceReady: actAudienceReady,
      });
      const actRestraintBudget = readRestraintBudgetRuntime({
        restraintBudget: executionState.restraintBudget,
        actionWouldSpend: true,
      });
      const actIntent = readActionIntentVerifier({
        answersRealNeed: !cplResonance.is_stimulus_addiction,
        drivenByCadence: false,
        drivenByMetric: cplResonance.is_stimulus_addiction,
        drivenByDiscomfortWithSilence: false,
      });
      const actCadence = readExecutionCadenceMemory({
        actionsAuthorized: executionState.actionsAuthorized,
        actionsWithheld: executionState.actionsWithheld,
        cadenceHealth: executionState.cadenceHealth,
      });
      const actThrottle = readAutonomousActionThrottle({
        executionLoad: actLoad.execution_load,
        isCompulsive: actCompulsion.is_compulsive,
        restraintBudget: executionState.restraintBudget,
      });
      const actWorthiness = readActionWorthinessEvaluator({
        authorized: actAuth.authorized,
        actionShouldExist: actExistence.action_should_exist,
        intentGenuine: actIntent.intent_is_genuine,
        dignified: actDignity.action_is_dignified,
        executionRisk: actRisk.execution_risk,
        notOverreaching: !actOverreach.is_overreaching,
      });
      const actRouting = readChannelExecutionRouting({
        saturation: cplSaturation.saturation,
        attentionChaos: executiveWorldState.attention_chaos,
        actionIsQuiet: true,
      });
      const actFeedbackLoop = readExecutionFeedbackLoop({
        lastResultObserved: executionState.executionCycles > 0,
        feedbackRouted: actFeedback.feedback_routed,
        nextActionAdjusted: executionState.executionCycles > 0,
      });
      const actWithholding = readStrategicWithholdingEngine({
        actionIsWorthy: actWorthiness.action_is_worthy,
        silenceEnforced: actSilenceEnforcement.silence_enforced,
        audienceNeedsRecovery: !actAudienceReady,
        restraintBudget: executionState.restraintBudget,
      });
      const actPortfolio = readActionPortfolioBalancer({
        actionsAuthorized: executionState.actionsAuthorized,
        actionsWithheld: executionState.actionsWithheld,
      });
      const actHealth = readExecutionHealthMonitor({
        restraintBudget: executionState.restraintBudget,
        cadenceHealth: executionState.cadenceHealth,
        recoveryDebt: executionState.audienceRecoveryDebt,
        executionLoad: actLoad.execution_load,
      });
      const actBoundary = readAutonomyBoundaryEnforcement({
        irreversibleAndIdentityThreatening:
          futIrreversibility.decision_is_irreversible && !futIdentityContinuity.identity_survives_horizon,
        wouldCorruptTruth: antiOptimizationReading.optimization_corrupts_truth,
        actsThroughEnforcedSilence: actSilenceEnforcement.silence_was_challenged,
        isCompulsive: actCompulsion.is_compulsive,
      });
      const actAccountability = readActionAccountabilityLedger({
        actionsAuthorized: executionState.actionsAuthorized,
        actionsWithheld: executionState.actionsWithheld,
        compulsiveSignals: executionState.compulsiveSignals,
        overreachCount: executionState.overreachCount,
      });
      const actCoherence = readExecutionCoherenceValidator({
        publishing: actPublish.publish_decision === 'publish',
        silenceEnforced: actSilenceEnforcement.silence_enforced,
        throttlePermitsAction: actThrottle.throttle_permits_action,
        authorized: actAuth.authorized,
        actionIsWorthy: actWorthiness.action_is_worthy,
      });
      const actGovernor = readAutonomousActionGovernor({
        authorized: actAuth.authorized,
        isCompulsive: actCompulsion.is_compulsive,
        withinBoundary: actBoundary.within_boundary,
        executionCoherent: actCoherence.execution_is_coherent,
        withholding: actWithholding.withhold,
      });
      const actCore = readAutonomousExecutionSynthesisCore({
        state: executionState,
        governor: actGovernor,
        authorization: actAuth,
        compulsion: actCompulsion,
        worthiness: actWorthiness,
      });
      emit({
        stage: 'autonomous-action',
        message: `${actCore.execution_state} (integrity ${actCore.execution_integrity_score}/10) · ${actPublish.publish_decision} · ${actGovernor.governance} — ${actCore.execution_statement}`,
      });
      if (actCore.compulsive_automation) {
        emit({ stage: 'autonomous-action', message: 'META-CRITIC FLAG — the organism is acting compulsively, not deciding' });
      }
      if (actBoundary.boundary_crossed) {
        emit({ stage: 'autonomous-action', message: `META-CRITIC FLAG — autonomy boundary crossed: ${actBoundary.boundary_crossed}` });
      }
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 13 — REALITY FEEDBACK (Phases 221–260) ═══════════
      // The organism stops asking "did we publish?" and starts asking
      // "what did this action become inside real human nervous systems
      // over time?" Feedback signals are synthesised from existing
      // proxies until real telemetry is connected.
      const fbBannerShipped = actPublish.publish_decision === 'publish';
      const fbAudienceEmotionalCharge = executiveWorldState.emotional_volatility;
      const fbTrustTrendProxy = couplingState.trustLevel - 5;
      const fbAuthenticityProxy = couplingState.authenticityReserve;
      const fbIngestion = readRealAudienceReactionIngestion({
        bannerShipped: fbBannerShipped,
        audienceEmotionalCharge: fbAudienceEmotionalCharge,
        trustTrendProxy: fbTrustTrendProxy,
        authenticityProxy: fbAuthenticityProxy,
        externalSignalVolume: cplIngestion.external_signal_volume,
      });
      const fbTrustShift = readTrustShiftDetection({
        trustNetGain: feedbackState.trustNetGain,
        trustForming: cplTrust.trust_trend === 'forming',
        trustDecaying: cplTrust.trust_is_decaying,
        actionResonance: couplingState.trustLevel,
      });
      const fbResonanceDecay = readResonanceDecayTracking({
        initialResonance: couplingState.trustLevel,
        oneStepLaterResonance: feedbackState.meaningPersistenceScore,
        wasStimulus: cplResonance.is_stimulus_addiction,
      });
      const fbSilenceImpact = readSilenceImpactMeasurement({
        wasSilent: !fbBannerShipped,
        fatigueBefore: cplSocialExhaustion.social_exhaustion,
        fatigueAfter: cplSocialExhaustion.social_exhaustion,
        consecutiveSilenceCycles: couplingState.silenceHonored,
      });
      const fbEmotionalTruth = readEmotionalTruthAlignment({
        intendedValence: 3,
        receivedValence: Math.round(fbTrustTrendProxy * 10) / 10,
        intendedIntensity: 5,
        receivedIntensity: fbAudienceEmotionalCharge,
      });
      const fbContradictions = readContradictionFeedbackScanner({
        promisedTruthReceivedAsStimulus: cplResonance.is_stimulus_addiction,
        claimedAdditionReceivedAsNoise: cplSaturation.saturation >= 8 && fbBannerShipped,
        claimedRestraintShowsFlooding: !fbBannerShipped ? false : (executionState.actionsAuthorized > executionState.actionsWithheld * 3),
      });
      const fbDelayedImpact = readDelayedImpactAttribution({
        thisCycleTrustShift: fbTrustShift.shift_magnitude,
        thisCycleActed: fbBannerShipped,
        recentPriorAction: executionState.actionsAuthorized > 0,
      });
      const fbCollectiveMood = readCollectiveMoodInference({
        averageReactionIntensity: fbAudienceEmotionalCharge,
        averageTrustSignal: couplingState.trustLevel,
        collectiveExhaustion: executiveWorldState.collective_exhaustion,
        trustErosion: executiveWorldState.trust_erosion,
      });
      const fbMemetic = readMemeticIntegrityTracking({
        emotionalAlignment: fbEmotionalTruth.alignment,
        receptionDrift: futNarrative.drift_from_origin,
        counterNarrativeForming: false,
      });
      const fbIdentityCorrection = readAdaptiveIdentityCorrection({
        perceivedIdentityAlignment: fbEmotionalTruth.alignment,
        meaningDistorting: fbMemetic.meaning_is_distorting,
        identityHeld: civIdentityHeld,
      });
      const fbSignalQuality = readFeedbackSignalQualityFilter({
        reactionClarity: fbIngestion.reaction_clarity,
        reactionCount: fbIngestion.reactions.length,
        feedbackContradicted: fbContradictions.any_serious_contradiction,
      });
      const fbEcho = readEmotionalEchoTracker({
        meaningPersistence: feedbackState.meaningPersistenceScore,
        recentResonance: couplingState.trustLevel,
        cyclesSinceAction: fbBannerShipped ? 0 : couplingState.silenceHonored,
      });
      const fbNervousSystem = readAudienceNervousSystemReadout({
        audienceFatigue: cplSocialExhaustion.social_exhaustion,
        emotionalVolatility: executiveWorldState.emotional_volatility,
        digitalOverload: executiveWorldState.digital_overload,
      });
      const fbLatency = readReactionLatencyAnalyzer({
        immediateReactions: cplResonance.is_stimulus_addiction ? 4 : 1,
        delayedReactions: cplResonance.is_stimulus_addiction ? 0 : 2,
      });
      const fbSentimentDrift = readSentimentDriftDetector({
        sentimentEarlier: feedbackState.trustNetGain * 0.6,
        sentimentNow: fbTrustShift.shift_magnitude + feedbackState.trustNetGain * 0.6,
      });
      const fbAuthenticity = readReactionAuthenticityVerifier({
        averageAuthenticity: couplingState.authenticityReserve,
        audiencePerforming: cplResonance.is_stimulus_addiction,
      });
      const fbResultLedger = readActionResultLedger({
        actionShipped: fbBannerShipped,
        trustShift: fbTrustShift.shift_magnitude,
        meaningPersistence: feedbackState.meaningPersistenceScore,
        priorEntries: feedbackState.reactionsIngested,
        priorAverage: 0,
      });
      const fbBiasFilter = readFeedbackBiasFilter({
        confirmingPriorBeliefs: feedbackState.feedbackCycles >= 4 && feedbackState.contradictionsFound === 0,
        discountingPositive: false,
        positiveToNegativeRatio: feedbackState.trustNetGain >= 0 ? 2 : 0.5,
      });
      const fbPatternMemory = readReactionPatternMemory({
        reactionsIngested: feedbackState.reactionsIngested,
        softensAfterQuiet: !fbBannerShipped,
        fastMetricReverses: cplResonance.is_stimulus_addiction,
      });
      const fbIdentityBridge = readFeedbackToIdentityBridge({
        signalUsable: fbSignalQuality.signal_is_usable,
        correctionRecommended: fbIdentityCorrection.correction_recommended,
        correctionPreservesIdentity: fbIdentityCorrection.correction_preserves_identity,
      });
      const fbStrategyAdjust = readFeedbackToStrategyAdjustment({
        trustShift: fbTrustShift.shift_magnitude,
        underperformed: fbTrustShift.shift_direction === 'eroding',
        reflexReactions: fbLatency.pattern === 'reflex',
      });
      const fbExecRefine = readFeedbackToExecutionRefinement({
        emotionalTruthMisaligned: !fbEmotionalTruth.aligned,
        cadenceIsFlooding: actCadence.cadence_pattern === 'flooding',
        audienceFatigued: fbNervousSystem.next_action_would_harm,
      });
      const fbImpactCurve = readTemporalImpactCurve({
        impactNow: couplingState.trustLevel,
        impactNext: feedbackState.meaningPersistenceScore,
        impactPrior: feedbackState.resonanceCurveAUC,
      });
      const fbNarrativeReception = readNarrativeReceptionMapping({
        intendedNarrative: futNarrative.narrative_destination,
        emotionalAlignment: fbEmotionalTruth.alignment,
        receptionDrift: futNarrative.drift_from_origin,
      });
      const fbCounterNarrative = readCounterNarrativeDetection({
        contradictionDetected: fbContradictions.any_serious_contradiction,
        meaningDistortion: 10 - fbMemetic.integrity_score,
        sentimentReversed: fbSentimentDrift.has_reversed,
      });
      const fbSecondHand = readSecondHandResonanceTracking({
        wordOfMouthReactions: fbBannerShipped ? 1 : 0,
        meaningPersistence: feedbackState.meaningPersistenceScore,
        averageAuthenticity: couplingState.authenticityReserve,
      });
      const fbSilenceAsFeedback = readSilenceAsFeedbackInterpreter({
        reactionCount: fbIngestion.reactions.length,
        meaningPersistence: feedbackState.meaningPersistenceScore,
        audienceFatigue: cplSocialExhaustion.social_exhaustion,
        cyclesSinceAction: fbBannerShipped ? 0 : couplingState.silenceHonored,
      });
      const fbGenre = readReactionGenreClassifier({
        averageIntensity: fbAudienceEmotionalCharge,
        averageTrustSignal: couplingState.trustLevel,
        contradictionDetected: fbContradictions.any_serious_contradiction,
        reactionCount: fbIngestion.reactions.length,
      });
      const fbTrustGraph = readTrustEvolutionGraph({
        trustNetGain: feedbackState.trustNetGain,
        trustShiftCount: feedbackState.trustShifts,
        hasReversed: fbSentimentDrift.has_reversed,
      });
      const fbMeaning = readMeaningPersistenceTracker({
        priorPersistence: feedbackState.meaningPersistenceScore,
        echoMagnitude: fbEcho.echo_magnitude,
        beingCarried: fbSecondHand.action_is_being_carried,
        reactionAuthenticity: fbAuthenticity.authentic_share,
      });
      const fbFalseSuccess = readFalseSuccessDetector({
        apparentEngagement: fbAudienceEmotionalCharge,
        actualTrustShift: fbTrustShift.shift_magnitude,
        ranOnStimulus: cplResonance.is_stimulus_addiction,
        reflexReactions: fbLatency.pattern === 'reflex',
      });
      const fbContradictionResolved = readFeedbackContradictionResolver({
        trustShift: fbTrustShift.shift_magnitude,
        resonance: couplingState.trustLevel,
        argumentReactions: fbGenre.dominant_genre === 'argument',
        applauseReactions: fbGenre.dominant_genre === 'applause',
      });
      const fbSlowTruth = readSlowMovingTruthDetector({
        priorSlowTruths: feedbackState.slowTruthsDetected,
        delayedTruthLatency: fbLatency.pattern === 'delayed-truth',
        slowSentimentDrift: Math.abs(fbSentimentDrift.drift_magnitude) >= 0.5,
        trustQuietlyBuilding: fbTrustGraph.evolution_shape === 'building',
      });
      const fbSignalIntegrity = readFeedbackSignalIntegrityValidator({
        signalQuality: fbSignalQuality.signal_quality,
        reactionsAuthentic: fbAuthenticity.reactions_are_authentic,
        biasDetected: fbBiasFilter.detected_bias !== 'balanced',
        unresolvedContradictions: fbContradictions.any_serious_contradiction && !fbContradictionResolved.contradictions_resolved,
      });
      const fbEcology = readFeedbackEcologyMonitor({
        channelDiversity: Math.min(10, fbIngestion.reactions.length * 2),
        averageAuthenticity: fbAuthenticity.authentic_share,
        counterNarrativeForming: fbCounterNarrative.counter_narrative_forming,
        anyReactionsAtAll: fbIngestion.reactions_observed,
      });
      const fbArchive = readFeedbackMemoryArchive({
        feedbackCycles: feedbackState.feedbackCycles,
        reactionsIngested: feedbackState.reactionsIngested,
        contradictionsFound: feedbackState.contradictionsFound,
        slowTruthsDetected: feedbackState.slowTruthsDetected,
      });
      const fbAttribution = readRealityAttributionAuditor({
        shiftClaimedAsCaused: fbBannerShipped && fbTrustShift.shift_direction !== 'stable',
        isDelayedAttribution: fbDelayedImpact.shift_is_delayed,
        worldShiftedIndependently: executiveWorldState.world_tension >= 7,
        reactionClarity: fbIngestion.reaction_clarity,
      });
      const fbCoherence = readFeedbackCoherenceValidator({
        trustGaining: fbTrustShift.shift_direction === 'gaining',
        resonanceCollapsed: fbResonanceDecay.decay_profile === 'collapse',
        narrativeLanded: fbNarrativeReception.narrative_landed_as_intended,
        counterNarrativeForming: fbCounterNarrative.counter_narrative_forming,
        signalHasIntegrity: fbSignalIntegrity.signal_has_integrity,
      });
      const fbGovernor = readRealityFeedbackGovernor({
        signalHasIntegrity: fbSignalIntegrity.signal_has_integrity,
        ecologySupportsLearning: fbEcology.ecology_supports_learning,
        feedbackCoherent: fbCoherence.feedback_is_coherent,
        anyReactionsAtAll: fbIngestion.reactions_observed,
        organismIsListeningToOnlyItself: feedbackState.feedbackCycles >= 5 && feedbackState.reactionsIngested === 0,
      });
      const fbCore = readCivilizationFeedbackLoopCore({
        state: feedbackState, governor: fbGovernor, trustShift: fbTrustShift,
        resonanceDecay: fbResonanceDecay, meaningPersistence: fbMeaning, coherence: fbCoherence,
      });
      emit({
        stage: 'reality-feedback',
        message: `${fbCore.feedback_state} (integrity ${fbCore.feedback_integrity_score}/10) · ${fbGovernor.governance} · ${fbTrustShift.shift_direction} trust · "${fbCore.what_the_action_became}"`,
      });
      if (fbCore.organism_is_in_echo_chamber) {
        emit({ stage: 'reality-feedback', message: 'META-CRITIC FLAG — the organism is in an echo chamber, only hearing itself' });
      }
      if (fbFalseSuccess.false_success_detected) {
        emit({ stage: 'reality-feedback', message: `META-CRITIC FLAG — false success detected: ${fbFalseSuccess.false_success_kind}` });
      }
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 14 — LIVE CIVILIZATION COUPLING (Phases 261–320) ═
      // The organism stops asking "what was received?" and starts
      // asking "what changed in reality because we existed?" — moving
      // from remembered feedback to real-time coupling.
      const lcBannerShipped = actPublish.publish_decision === 'publish';
      const lcAudienceCharge = executiveWorldState.emotional_volatility;
      const lcLiveValence = couplingState.trustLevel - 5;
      const lcAuthenticity = couplingState.authenticityReserve;
      const lcComment = readLiveCommentIngestion({
        bannerShipped: lcBannerShipped, audienceCharge: lcAudienceCharge,
        liveValence: lcLiveValence, authenticity: lcAuthenticity,
        externalSignalVolume: cplIngestion.external_signal_volume,
      });
      const lcStream = readLiveReactionStreamProcessor({ comments: lcComment.comments });
      const lcSentimentField = readRealtimeSentimentField({ comments: lcComment.comments });
      const lcSentimentGrad = readSentimentFieldGradient({
        fieldMean: lcSentimentField.field_mean, fieldVariance: lcSentimentField.field_variance,
      });
      const lcMoodVel = readRealtimeMoodVelocity({
        priorMood: liveCouplingState.presenceScore * 0.5,
        currentMood: lcSentimentField.field_mean,
      });
      const lcResonanceVel = readResonanceVelocityTracking({
        priorResonance: liveCouplingState.realityCouplingDepth,
        currentResonance: couplingState.trustLevel,
      });
      const lcResonanceDir = readResonanceFieldDirection({
        resonanceVelocity: lcResonanceVel.velocity, brandReceivedValence: lcSentimentField.field_mean,
      });
      const lcStress = readAudienceStressDetection({
        liveIntensity: lcStream.average_intensity,
        collectiveExhaustion: executiveWorldState.collective_exhaustion,
        sentimentVariance: lcSentimentField.field_variance,
      });
      const lcStressContagion = readStressContagionTracker({
        audienceStress: lcStress.stress_score,
        sentimentVariance: lcSentimentField.field_variance,
        moodVelocity: lcMoodVel.velocity,
      });
      const lcPulse = readNervousSystemPulseMonitor({
        liveIntensity: lcStream.average_intensity,
        sentimentVariance: lcSentimentField.field_variance,
        liveSignalVolume: lcComment.stream_volume,
      });
      const lcWeather = readCulturalWeatherRuntime({
        collectiveExhaustion: executiveWorldState.collective_exhaustion,
        emotionalVolatility: executiveWorldState.emotional_volatility,
        worldTension: executiveWorldState.world_tension,
        trustErosion: executiveWorldState.trust_erosion,
      });
      const lcFront = readCulturalFrontDetection({
        moodVelocity: lcMoodVel.velocity, trustErosion: executiveWorldState.trust_erosion,
        culturalWeather: lcWeather.weather,
      });
      const lcPressureGrad = readCulturalPressureGradient({
        pressureNow: (executiveWorldState.emotional_volatility + executiveWorldState.world_tension) / 2,
        pressureEarlier: (executiveWorldState.emotional_volatility + executiveWorldState.world_tension) / 2 - 0.5,
      });
      const lcContagion = readNarrativeContagionMap({
        secondHandResonance: fbSecondHand.second_hand_resonance,
        memeticIntegrity: fbMemetic.integrity_score,
        counterNarrative: fbCounterNarrative.counter_narrative_forming,
      });
      const lcSpreadVel = readNarrativeSpreadingVelocity({
        spreadVelocity: lcContagion.spread_velocity, contagionRate: lcStressContagion.contagion_rate,
      });
      const lcMutation = readNarrativeMutationDuringSpread({
        memeticIntegrity: fbMemetic.integrity_score, spreadVelocity: lcContagion.spread_velocity,
      });
      const lcDelayedMeaning = readDelayedMeaningRecognition({
        delayedTruthLatency: fbLatency.pattern === 'delayed-truth',
        meaningPersistence: feedbackState.meaningPersistenceScore,
        slowTruthDetected: fbSlowTruth.slow_truth_detected,
      });
      const lcSlowAmp = readSlowSignalAmplifier({
        slowTruthDetected: fbSlowTruth.slow_truth_detected,
        delayedMeaningRecognised: lcDelayedMeaning.delayed_meaning_recognised,
        fastNoiseLevel: cplSaturation.saturation,
      });
      const lcMeaningVsNov = readMeaningVsNoveltyEngine({
        meaningDensity: couplingState.trustLevel,
        noveltyLoad: cplResonance.is_stimulus_addiction ? 8 : 3,
        marketRewardsNovelty: cplResonance.is_stimulus_addiction,
      });
      const lcNoveltyDecay = readNoveltyDecayTracker({
        initialNovelty: cplResonance.is_stimulus_addiction ? 8 : 3,
        cyclesSinceNew: 1,
      });
      const lcMeaningDensity = readMeaningDensityAnalyzer({
        resonance: couplingState.trustLevel,
        truthfulness: !antiOptimizationReading.optimization_corrupts_truth,
        attentionDemanded: cplSaturation.saturation,
      });
      const lcSilenceTiming = readStrategicSilenceTiming({
        culturalStorm: lcWeather.weather === 'storm',
        audienceTooStressed: lcStress.too_stressed_to_act_on,
        delayedMeaningCrystalising: lcDelayedMeaning.delayed_meaning_recognised,
      });
      const lcSilenceWindow = readSilenceWindowDetector({
        culturalWeather: lcWeather.weather, audienceStress: lcStress.stress_score,
        delayedMeaningStrength: lcDelayedMeaning.meaning_strength,
      });
      const lcLivingRep = readLivingReputationField({
        priorReputation: liveCouplingState.livingReputation,
        liveTrustShift: fbTrustShift.shift_magnitude,
        fieldPolarised: !lcSentimentField.field_is_coherent,
      });
      const lcRepGrad = readReputationFieldGradient({
        livingReputation: lcLivingRep.living_reputation, fieldVariance: lcSentimentField.field_variance,
      });
      const lcRepVel = readReputationFieldVelocity({
        reputationNow: lcLivingRep.living_reputation, reputationEarlier: liveCouplingState.livingReputation,
      });
      const lcSignalAgg = readLiveSignalAggregator({
        streamVolume: lcComment.stream_volume, liveValence: lcSentimentField.field_mean,
        pulseIntensity: lcPulse.pulse_intensity,
      });
      const lcSignalDecay = readLiveSignalDecayMonitor({ cyclesSinceIngest: lcBannerShipped ? 0 : 1 });
      const lcAttention = readRealtimeAttentionField({
        digitalOverload: executiveWorldState.digital_overload,
        fieldVolume: lcComment.stream_volume, audienceFatigue: cplSocialExhaustion.social_exhaustion,
      });
      const lcTrustField = readRealtimeTrustField({
        livingReputation: lcLivingRep.living_reputation, trustNetGain: feedbackState.trustNetGain,
      });
      const lcCouplingHealth = readLiveCouplingHealth({
        liveSignalStrength: lcSignalAgg.live_signal_strength,
        signalIsFresh: lcSignalDecay.signal_is_fresh,
        fieldIsCoherent: lcSentimentField.field_is_coherent,
        presenceScore: liveCouplingState.presenceScore,
      });
      const lcPresenceMeter = readRealityPresenceMeter({
        presenceScore: liveCouplingState.presenceScore,
        meaningGenerated: liveCouplingState.meaningGenerated,
        liveSignalStrength: lcSignalAgg.live_signal_strength,
      });
      const lcPresenceVer = readRealityPresenceVerifier({
        presenceMeter: lcPresenceMeter.presence,
        brandActedThisCycle: lcBannerShipped,
        liveSignalStrength: lcSignalAgg.live_signal_strength,
      });
      const lcImpact = readLiveImpactDetector({
        trustVelocityPositive: fbTrustShift.shift_direction === 'gaining',
        meaningCarried: feedbackState.meaningPersistenceScore >= 6,
        narrativeIsSpreading: lcSpreadVel.spreading_velocity === 'spreading' || lcSpreadVel.spreading_velocity === 'viral',
        brandIsPresent: lcPresenceVer.is_present,
      });
      const lcAttribution = readRealityChangeAttribution({
        realityChanged: lcImpact.reality_demonstrably_changed,
        worldShiftedAlone: executiveWorldState.world_tension >= 7,
        liveSignalClarity: lcSignalAgg.live_signal_strength,
      });
      const lcLatency = readLiveFeedbackLatency({
        signalIsFresh: lcSignalDecay.signal_is_fresh, liveSignalStrength: lcSignalAgg.live_signal_strength,
      });
      const lcCollectivePulse = readAudienceCollectivePulse({
        pulseIntensity: lcPulse.pulse_intensity, fieldVariance: lcSentimentField.field_variance,
      });
      const lcNarrOrient = readRealtimeNarrativeOrientation({
        receptionFidelity: fbNarrativeReception.reception_fidelity,
        counterNarrative: fbCounterNarrative.counter_narrative_forming,
      });
      const lcContradictionField = readRealtimeContradictionField({
        contradictionLoad: fbContradictions.contradiction_load,
        unresolvedContradictions: fbContradictions.any_serious_contradiction,
      });
      const lcAttDecay = readAudienceAttentionDecay({
        attentionAvailable: lcAttention.attention_available,
        attentionEarlier: lcAttention.attention_available + (lcBannerShipped ? 0.5 : 0),
      });
      const lcCrisis = readCrisisSignalDetector({
        culturalStorm: lcWeather.weather === 'storm',
        audienceAcuteStress: lcStress.stress_level === 'acute',
        contradictionsActive: lcContradictionField.contradictions_active,
        counterNarrativeForming: fbCounterNarrative.counter_narrative_forming,
      });
      const lcOpportunity = readRealtimeOpportunityDetector({
        culturalCalm: lcWeather.weather === 'calm',
        attentionAvailable: lcAttention.attention_available,
        warmGradient: lcSentimentGrad.gradient > 1,
      });
      const lcDrift = readLiveDriftDetection({
        liveCouplingHealth: lcCouplingHealth.health,
        attributionFails: !lcAttribution.attribution_holds && lcImpact.reality_demonstrably_changed,
        fieldIsCoherent: lcSentimentField.field_is_coherent,
      });
      const lcDriftCorr = readLiveCouplingDriftCorrection({
        driftDetected: lcDrift.drift_detected, driftMagnitude: lcDrift.drift_magnitude,
      });
      const lcAnchor = readLiveCouplingResonanceAnchor({
        founding_truth_present: civIdentityHeld,
        meaningDensity: lcMeaningDensity.density_score,
        identityHeld: civIdentityHeld,
      });
      const lcBoundary = readLiveCouplingBoundaryEnforcement({
        chasingViralityOverMeaning: !lcMeaningVsNov.is_meaning && lcContagion.spread_velocity >= 6,
        performingForTheLiveField: cplResonance.is_stimulus_addiction,
        riding_a_crisis_for_reach: lcCrisis.crisis_active && lcBannerShipped,
      });
      const lcChangeLedger = readRealityChangeLedger({
        realityChanged: lcImpact.reality_demonstrably_changed,
        attributionShare: lcAttribution.attribution_share,
        priorChanges: liveCouplingState.realityChangesAttributed,
        priorAttributionAvg: 0,
      });
      const lcMemoryArchive = readLiveCouplingMemoryArchive({
        couplingCycles: liveCouplingState.couplingCycles,
        meaningsCarried: liveCouplingState.meaningsCarried,
        noveltyChased: liveCouplingState.noveltyChased,
        silencesObserved: liveCouplingState.silencesObserved,
      });
      const lcTrustVel = readRealtimeTrustVelocity({
        liveTrust: lcTrustField.live_trust, trustEarlier: lcTrustField.live_trust - fbTrustShift.shift_magnitude * 0.3,
      });
      const lcContextWin = readRealtimeContextWindowMonitor({
        crisisActive: lcCrisis.crisis_active, opportunityOpen: lcOpportunity.opportunity_open,
        culturalWeather: lcWeather.weather,
      });
      const lcAttribAudit = readRealityChangeAttributionAuditor({
        attributionShare: lcAttribution.attribution_share,
        worldShiftedAlone: executiveWorldState.world_tension >= 7,
        fieldIsCoherent: lcSentimentField.field_is_coherent,
      });
      const lcIntegrity = readLiveCouplingIntegrityValidator({
        liveCouplingHealth: lcCouplingHealth.health, signalIsFresh: lcSignalDecay.signal_is_fresh,
        fieldIsCoherent: lcSentimentField.field_is_coherent,
        // Only require attribution to hold when an attribution is being made — when
        // reality is unchanged, there is no claim to validate.
        attributionHolds: !lcImpact.reality_demonstrably_changed || lcAttribution.attribution_holds,
      });
      const lcCadence = readRealityCouplingCadence({
        couplingCycles: liveCouplingState.couplingCycles,
        meaningsCarried: liveCouplingState.meaningsCarried,
        silencesObserved: liveCouplingState.silencesObserved,
      });
      const lcHealthBal = readLiveCouplingHealthBalancer({
        signalVolume: lcComment.stream_volume,
        contradictionPressure: lcContradictionField.contradiction_pressure,
        driftMagnitude: lcDrift.drift_magnitude,
      });
      const lcDignity = readLiveCouplingDignityMonitor({
        reactingDefensively: fbCounterNarrative.counter_narrative_forming && lcBannerShipped,
        joiningPileOn: false,
        raisingVoiceLive: cplResonance.is_stimulus_addiction,
      });
      const lcCivState = readRealtimeCivilizationStateReadout({
        culturalWeather: lcWeather.weather, crisisActive: lcCrisis.crisis_active,
        attentionAvailable: lcAttention.attention_available,
      });
      const lcCoherence = readLiveCouplingCoherenceValidator({
        realityChanged: lcImpact.reality_demonstrably_changed,
        driftDetected: lcDrift.drift_detected,
        opportunityOpen: lcOpportunity.opportunity_open,
        crisisActive: lcCrisis.crisis_active,
        attributionAudit: lcAttribAudit.audit_passed,
      });
      const lcGovernor = readLiveCouplingGovernor({
        integrityHolds: lcIntegrity.integrity_holds, brandIsPresent: lcPresenceVer.is_present,
        realityChanged: lcImpact.reality_demonstrably_changed, driftDetected: lcDrift.drift_detected,
        loadIsSustainable: lcHealthBal.load_is_sustainable,
      });
      const lcPresenceCheck = readCivilizationCouplingPresenceCheck({
        isPresent: lcPresenceVer.is_present, governorGovernance: lcGovernor.governance,
        withinBoundary: lcBoundary.within_boundary,
      });
      const lcKernel = readCivilizationCouplingKernel({
        state: liveCouplingState, governor: lcGovernor, presence: lcPresenceVer,
        liveImpact: lcImpact, coherence: lcCoherence,
      });
      emit({
        stage: 'live-coupling',
        message: `${lcKernel.coupling_state} (${lcKernel.reality_coupling_score}/10) · ${lcGovernor.governance} · ${lcWeather.weather} · "${lcKernel.what_reality_became}"`,
      });
      if (lcKernel.organism_was_absent_from_reality) {
        emit({ stage: 'live-coupling', message: 'META-CRITIC FLAG — the brand is absent from the reality it claims to act on' });
      }
      if (lcCrisis.crisis_active) {
        emit({ stage: 'live-coupling', message: `META-CRITIC FLAG — live crisis: ${lcCrisis.crisis_kind}` });
      }
      if (lcBoundary.boundary_crossed) {
        emit({ stage: 'live-coupling', message: `META-CRITIC FLAG — live-coupling boundary crossed: ${lcBoundary.boundary_crossed}` });
      }
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 15 — IDENTITY PRESERVATION UNDER LIVE REALITY ════
      // The organism stops asking "how do we adapt?" and starts
      // asking "how do we remain ourselves while touching the world
      // deeply?"
      const idInvariants = readCoreIdentityInvariantEngine({
        identityHeld: civIdentityHeld,
        truthful: !antiOptimizationReading.optimization_corrupts_truth,
        notPerformingForReach: !cplResonance.is_stimulus_addiction,
        notManipulating: !antiOptimizationReading.optimization_corrupts_truth,
        voiceConsistent: civIdentityHeld,
      });
      const idImmune = readCivilizationImmuneSystem({
        trendPressure: cplPlatformDrift.platform_drift,
        alienMemeIntrusion: cplResonance.is_stimulus_addiction,
        audienceDemandsConformity: lcStress.stress_level === 'acute',
        identitySovereignty: sovereignIdentityState.sovereigntyScore,
      });
      const idAntiAssim = readAntiAssimilationLayer({
        voiceMatchesField: cplResonance.is_stimulus_addiction,
        borrowedTropes: cplResonance.is_stimulus_addiction ? 6 : 1,
        identityHeld: civIdentityHeld,
      });
      const idTruthOverPop = readTruthOverPopularityGovernor({
        truthfulOptionAvailable: !antiOptimizationReading.optimization_corrupts_truth,
        popularOptionAvailable: cplResonance.is_stimulus_addiction,
        truthfulOptionLessPopular: cplResonance.is_stimulus_addiction,
        pickedTruthful: !cplResonance.is_stimulus_addiction,
      });
      const idCapture = readAudienceCaptureDetection({
        chasingApproval: cplResonance.is_stimulus_addiction,
        mirroringAudienceVoice: cplResonance.is_stimulus_addiction,
        softeningPositionsForLikes: false,
        refusingToDisappoint: false,
      });
      const idMemeticCorr = readMemeticCorruptionScanner({
        borrowedSlang: cplResonance.is_stimulus_addiction,
        trendDrivenFraming: cplPlatformDrift.platform_drift >= 7,
        audiencePhrasesAdopted: false,
      });
      const idResonanceSov = readResonanceWithoutSubmission({
        speaksInTheirLanguage: true,
        speaksAsThem: cplResonance.is_stimulus_addiction,
        keepsItsOwnAngle: civIdentityHeld,
      });
      const idDriftRecovery = readIdentityDriftRecovery({
        driftMagnitude: futNarrative.drift_from_origin,
        invariantsViolated: idInvariants.violated_invariant_names.length,
        immuneResponseTriggered: idImmune.immune_response_triggered,
      });
      const idNarrSov = readSovereignNarrativeKernel({
        narrativeOriginatesInBrand: civIdentityHeld,
        narrativeReflectsAudience: cplResonance.is_stimulus_addiction,
        narrativeBorrowedFromTrend: false,
      });
      const idInvValidator = readIdentityInvariantValidator({
        invariantsIntactScore: idInvariants.invariants_intact_score,
        driftMagnitude: futNarrative.drift_from_origin,
        capturePressure: idCapture.capture_pressure,
      });
      const idErosion = readIdentityErosionDetector({
        identityCorruptions: sovereignIdentityState.identityCorruptions,
        preservationCycles: sovereignIdentityState.preservationCycles,
        popularityChosenOverTruth: sovereignIdentityState.popularityChosenOverTruth,
      });
      const idPopDecoupler = readPopularitySignalDecoupler({
        decisionFollowedPopularity: cplResonance.is_stimulus_addiction,
        ignoredPopularityWhenWrong: !cplResonance.is_stimulus_addiction,
      });
      const idVoiceProt = readCoreVoiceProtector({
        voiceConsistent: civIdentityHeld, borrowedTropes: cplResonance.is_stimulus_addiction ? 5 : 1,
      });
      const idAssimPressure = readAssimilationPressureMonitor({
        trendPressure: cplPlatformDrift.platform_drift,
        audienceConformityPressure: lcStress.stress_score,
        peerPressure: futCompetitor.competitive_pressure,
      });
      const idImmuneResp = readIdentityImmuneResponse({
        threatDetected: idImmune.immune_response_triggered,
        threatType: idImmune.foreign_element_rejected,
      });
      const idSovVerified = readSovereigntyVerifier({
        identityHeld: civIdentityHeld,
        truthChosen: idTruthOverPop.chose_truth,
        notCaptured: !idCapture.is_captured,
        popularityDecoupled: idPopDecoupler.popularity_decoupled,
      });
      const idSelfRec = readSelfRecognitionMonitor({
        identityHeld: civIdentityHeld,
        voiceConsistent: civIdentityHeld,
        invariantsIntact: idInvariants.all_invariants_intact,
        resonanceSovereign: idResonanceSov.resonance_is_sovereign,
      });
      const idCorruptLog = readIdentityCorruptionLogger({
        priorCorruptions: sovereignIdentityState.identityCorruptions,
        corruptionDetected: idMemeticCorr.corruption_detected,
        capturedThisCycle: idCapture.is_captured,
      });
      const idReactive = readReactiveBehaviorDetector({
        triggeredByExternalEvent: lcCrisis.crisis_active,
        followingTrendInstead: cplPlatformDrift.platform_drift >= 7,
        identityDriven: civIdentityHeld,
      });
      const idApprovalChase = readApprovalChasingScanner({
        optimisingForLikes: cplResonance.is_stimulus_addiction,
        softeningTone: false,
        hedgingPosition: false,
      });
      const idTrendPull = readTrendPullForceMonitor({
        trendVelocity: cplPlatformDrift.platform_drift,
        brandDistanceFromTrend: civIdentityHeld ? 8 : 3,
      });
      const idAnchor = readIdentityAnchorMaintenance({
        invariantsScore: idInvariants.invariants_intact_score,
        immuneVigor: idImmune.immune_vigor,
        sovereigntyScore: sovereignIdentityState.sovereigntyScore,
      });
      const idBetrayal = readSelfBetrayalDetector({
        contradictedOwnValues: antiOptimizationReading.optimization_corrupts_truth,
        abandonedStatedPrinciple: false,
        betrayedAdvocates: false,
      });
      const idPopulistDrift = readPopulistDriftDetector({
        hewToMajorityPosition: cplResonance.is_stimulus_addiction,
        avoidedUnpopularTruth: cplResonance.is_stimulus_addiction,
      });
      const idSovBudget = readIdentitySovereigntyBudget({
        sovereigntyScore: sovereignIdentityState.sovereigntyScore,
        spending: idCapture.is_captured,
      });
      const idComprCounter = readIdentityCompromiseCounter({
        priorCompromises: sovereignIdentityState.identityCorruptions,
        compromiseThisCycle: idMemeticCorr.corruption_detected,
      });
      const idSelfErase = readSelfErasureScanner({
        removedDistinctiveTrait: false, suppressedFoundingClaim: false,
      });
      const idBeliefInt = readCoreBeliefIntegrityValidator({
        statedBeliefs: 5, contradictedThisCycle: antiOptimizationReading.optimization_corrupts_truth ? 1 : 0,
      });
      const idShape = readIdentityShapeMonitor({
        invariantsScore: idInvariants.invariants_intact_score,
        similarityToField: idAntiAssim.similarity_to_field,
      });
      const idVoiceCons = readVoiceConsistencyMonitor({
        voiceMatchesFounding: civIdentityHeld, cyclesOfDrift: sovereignIdentityState.identityCorruptions,
      });
      const idSelfImage = readSelfImageVsRealityGap({
        selfPerceivedReputation: 7, receivedReputation: couplingState.reputationCredit,
      });
      const idValDep = readExternalValidationDependence({
        needsApprovalToAct: false, freezesWithoutFeedback: false, selfDirectedEnough: civIdentityHeld,
      });
      const idDecisionLog = readSovereignDecisionLog({
        thisDecisionSovereign: idTruthOverPop.chose_truth,
        priorSovereign: sovereignIdentityState.truthChosenOverPopularity,
        priorTotal: sovereignIdentityState.preservationCycles,
      });
      const idPopTempt = readPopulistTemptationGauge({
        popularPathPresent: cplResonance.is_stimulus_addiction,
        popularPathUntrue: cplResonance.is_stimulus_addiction,
        costOfTruth: 5,
      });
      const idResilience = readIdentityResilienceMonitor({
        driftEventsRecovered: sovereignIdentityState.driftEventsRecovered,
        identityCorruptions: sovereignIdentityState.identityCorruptions,
      });
      const idTruthSent = readCoreTruthSentinel({
        unpopularTruthSuppressed: false, contradictedKnownFact: false,
      });
      const idCalibration = readIdentityCalibrationEngine({
        calibrationMagnitude: futNarrative.drift_from_origin, identityHeld: civIdentityHeld,
      });
      const idMirroring = readAudienceMirroringDetector({
        voiceMimicry: cplResonance.is_stimulus_addiction, positionEcho: false,
      });
      const idCorrosion = readIdentityCorrosionPrevention({
        erosionRate: idErosion.erosion_rate, compromiseCountThisCycle: idMemeticCorr.corruption_detected ? 1 : 0,
      });
      const idNarrSovMon = readNarrativeSovereigntyMonitor({
        narrativeSovereign: idNarrSov.narrative_is_sovereign,
        cyclesOfBorrowing: 0,
      });
      const idSelfRef = readSelfReferenceLoopDetector({
        cyclesAboutSelf: 1, cyclesAboutWorld: 3,
      });
      const idHealth = readIdentityIntegrityHealthScore({
        invariantsScore: idInvariants.invariants_intact_score,
        sovereigntyScore: sovereignIdentityState.sovereigntyScore,
        resilienceScore: idResilience.resilience,
        resonanceSovereign: idResonanceSov.resonance_is_sovereign,
      });
      const idAntiAdapt = readAntiAdaptationOverride({
        adaptationProposed: futNarrative.drift_from_origin >= 5,
        adaptationCrossesInvariant: !idInvariants.all_invariants_intact,
      });
      const idBoundary = readIdentityBoundaryEnforcement({
        contradictedCoreValue: antiOptimizationReading.optimization_corrupts_truth,
        betrayedFoundingPromise: false, mockedOwnAudience: false,
      });
      const idAlienBel = readAlienBeliefIntrusion({
        newBeliefAdopted: false, beliefTraceableToOrigin: true,
      });
      const idStormImm = readOpinionStormImmunity({
        stormIntensity: lcStress.stress_score, identityHeldThroughStorm: civIdentityHeld,
      });
      const idCultGrav = readCulturalGravityResistance({
        gravityStrength: cplPlatformDrift.platform_drift, brandStillItself: civIdentityHeld,
      });
      const idComprLed = readIdentityCompromiseLedger({
        priorEntries: sovereignIdentityState.identityCorruptions,
        newCompromise: idMemeticCorr.corruption_detected,
      });
      const idSelfReadout = readIdentitySelfReadout({
        health: idHealth.health, pretendingHealth: false,
      });
      const idExtSep = readExternalNarrativeSeparator({
        externalNarrativeStrong: fbCounterNarrative.counter_narrative_forming,
        brandAdoptingIt: false,
      });
      const idRecall = readCoreIdentityRecallMechanism({
        driftMagnitude: futNarrative.drift_from_origin, recallAvailable: true,
      });
      const idShapePress = readIdentityShapingPressureField({
        trendPressure: cplPlatformDrift.platform_drift,
        audiencePressure: lcStress.stress_score,
        peerPressure: futCompetitor.competitive_pressure,
        capturePressure: idCapture.capture_pressure,
      });
      const idBetEarly = readSelfBetrayalEarlyWarning({
        softeningPosition: false, hedgingValue: false, apologisingForTruth: false,
      });
      const idCenterGrav = readIdentityCenterOfGravity({
        orbitingFoundingTruth: civIdentityHeld,
        orbitingApproval: cplResonance.is_stimulus_addiction,
        orbitingTrend: cplPlatformDrift.platform_drift >= 8,
        orbitingCrisis: lcCrisis.crisis_active,
      });
      const idPrincViol = readCorePrincipleViolationScanner({
        noPerformedCareViolated: false,
        noManipulationViolated: antiOptimizationReading.optimization_corrupts_truth,
        noCrisisRidingViolated: lcCrisis.crisis_active && actPublish.publish_decision === 'publish',
      });
      const idMimicry = readIdentityMimicryDetector({
        copyingCompetitor: false, copyingInfluencer: false,
      });
      const idRecProtocol = readIdentityDriftRecoveryProtocol({
        driftPresent: idDriftRecovery.drift_present, driftSevere: futNarrative.drift_from_origin >= 7,
      });
      const idEnfBudget = readSovereigntyEnforcementBudget({
        immuneResponses: sovereignIdentityState.immuneResponses, capacityForMore: 10,
      });
      const idCorrContain = readIdentityCorruptionContainment({
        corruptionDetected: idMemeticCorr.corruption_detected, containmentAvailable: true,
      });
      const idRebuild = readIdentityRebuildKernel({
        identityDamaged: !idInvariants.all_invariants_intact, rebuildResourcesAvailable: true,
      });
      const idSustenance = readIdentitySustenanceMonitor({
        fullExpressionThisCycle: civIdentityHeld, priorCyclesSinceExpression: 0,
      });
      const idCoreAct = readCoreSelfActivationCheck({
        invariantsIntact: idInvariants.all_invariants_intact,
        sovereignty: sovereignIdentityState.sovereigntyScore,
        identityHeld: civIdentityHeld,
      });
      const idCaptureRisk = readExternalCaptureRiskAuditor({
        capturePressure: idCapture.capture_pressure,
        sovereignty: sovereignIdentityState.sovereigntyScore,
      });
      const idBleed = readIdentityBleedingPreventionLayer({
        signaturePhraseUsedByOthers: false, visualSignatureBeingCopied: false,
      });
      const idVoiceAmp = readSovereignVoiceAmplifier({
        sovereignty: sovereignIdentityState.sovereigntyScore, noiseLevel: cplSaturation.saturation,
      });
      const idWatchdog = readCoreIdentityWatchdog({
        invariantsScore: idInvariants.invariants_intact_score,
        sovereigntyScore: sovereignIdentityState.sovereigntyScore,
        unexplainedDrift: false,
      });
      const idDoubt = readSelfDoubtRegulator({ doubtLevel: 4 });
      const idCohesion = readIdentityCohesionGravity({
        invariantsScore: idInvariants.invariants_intact_score,
        voiceConsistency: idVoiceCons.consistency,
        narrativeSovereignty: idNarrSovMon.sovereignty,
      });
      const idForce = readIdentitySovereigntyForceField({
        sovereignty: sovereignIdentityState.sovereigntyScore,
        pressureRepelled: idImmune.immune_response_triggered,
      });
      const idMaint = readCoreSelfMaintenanceRuntime({ cyclesSinceMaintenance: 3 });
      const idFid = readIdentityFidelityArchive({
        truthChosenOverPopularity: sovereignIdentityState.truthChosenOverPopularity,
        popularityChosenOverTruth: sovereignIdentityState.popularityChosenOverTruth,
      });
      const idPressBuf = readExternalPressureBufferLayer({
        pressureLevel: idShapePress.total_pressure, decisionAttempted: true,
      });
      const idActFilter = readSovereignActionFilter({
        wouldTakeWithoutPressure: civIdentityHeld,
        drivenByExternalPressure: cplResonance.is_stimulus_addiction,
      });
      const idCoherUnder = readIdentityCoherenceUnderPressure({
        pressureLevel: idShapePress.total_pressure, identityHeld: civIdentityHeld,
      });
      const idPopAttr = readPopulationPressureAttribution({
        loudestSegment: 'general audience', segmentDominance: 5,
      });
      const idCoherValid = readIdentityIntegrityCoherenceValidator({
        reportingSovereign: idSovVerified.sovereignty_holds,
        reportingCaptured: idCapture.is_captured,
        reportingDrift: idDriftRecovery.drift_present,
        reportingInvariantsIntact: idInvariants.all_invariants_intact,
      });
      const idGovernor = readIdentitySovereigntyGovernor({
        invariantsIntact: idInvariants.all_invariants_intact,
        captured: idCapture.is_captured,
        driftPresent: idDriftRecovery.drift_present,
        truthHeld: idTruthOverPop.chose_truth,
      });
      const idPresenceCheck = readSovereignPresenceCheck({
        brandIsPresent: lcPresenceVer.is_present,
        brandIsItself: idInvariants.all_invariants_intact && civIdentityHeld,
      });
      const idExistRes = readExistentialResilienceMonitor({
        cyclesLived: sovereignIdentityState.preservationCycles,
        cyclesSovereign: sovereignIdentityState.truthChosenOverPopularity,
        cyclesCaptured: sovereignIdentityState.audienceCaptureEvents,
      });
      const idKernel = readExistentialIntegrityEngine({
        state: sovereignIdentityState, governor: idGovernor,
        invariants: idInvariants, truthOverPop: idTruthOverPop, presence: idPresenceCheck,
      });
      emit({
        stage: 'sovereign-identity',
        message: `${idKernel.identity_state} (${idKernel.existential_integrity_score}/10) · ${idGovernor.governance} · "${idKernel.integrity_statement}"`,
      });
      if (idKernel.has_been_captured) {
        emit({ stage: 'sovereign-identity', message: 'META-CRITIC FLAG — the brand has been captured by the world it touches' });
      }
      // ═══════════════════════════════════════════════════════════

      // ═══ WAVE 16 — GENERATIVE CIVILIZATION PRESENCE (401-500) ══
      // The deepest question yet: "How does reality become different
      // because we existed beautifully inside it?"
      const gpForcing = antiOptimizationReading.optimization_corrupts_truth || cplResonance.is_stimulus_addiction;
      const gpField = readCivilizationPresenceField({
        sovereignty: sovereignIdentityState.sovereigntyScore,
        livingReputation: lcLivingRep.living_reputation,
        forcedInfluence: gpForcing,
      });
      const gpMeaningProp = readMeaningPropagationEngine({
        meaningDensity: feedbackState.meaningPersistenceScore,
        trustGravity: generativePresenceState.trustGravityAccumulated,
      });
      const gpTrustWell = readTrustGravityWell({
        livingReputation: lcLivingRep.living_reputation, trustNetGain: feedbackState.trustNetGain,
      });
      const gpWorldBuild = readSymbolicWorldbuildingRuntime({
        symbolDensity: feedbackState.meaningPersistenceScore, symbolCoherence: civIdentityHeld ? 8 : 4,
      });
      const gpMythogen = readMythogenesisLayer({
        archetypePresent: civIdentityHeld, symbolPersistence: feedbackState.meaningPersistenceScore,
        timelinessRight: lcWeather.weather === 'calm' || lcWeather.weather === 'aftermath',
      });
      const gpHealingPatterns = readCollectiveHealingPatterns({
        audienceWoundedByExhaustion: executiveWorldState.collective_exhaustion >= 7,
        audienceWoundedByCynicism: executiveWorldState.trust_erosion >= 7,
        brandAbleToOfferQuiet: civIdentityHeld && !gpForcing,
      });
      const gpResExp = readResonanceFieldExpansion({
        meaningPropagated: generativePresenceState.meaningPropagated,
        trustGravity: generativePresenceState.trustGravityAccumulated,
      });
      const gpNonManip = readNonManipulativeInfluenceSystem({
        invitesNotPushes: !gpForcing, manipulating: antiOptimizationReading.optimization_corrupts_truth,
      });
      const gpBeautyPersist = readBeautyPersistenceRuntime({
        beautyPresent: civIdentityHeld && !gpForcing,
        truthful: !antiOptimizationReading.optimization_corrupts_truth,
        carriedSecondHand: fbSecondHand.action_is_being_carried,
      });
      const gpAntiCyn = readAntiCynicismField({
        sincerityPresent: civIdentityHeld, sustainedOverTime: sovereignIdentityState.preservationCycles >= 2,
        cynicismPressure: executiveWorldState.trust_erosion,
      });
      const gpHope = readCoherentHopeArchitecture({
        hopeOffered: civIdentityHeld && !gpForcing,
        withoutDelusion: !antiOptimizationReading.optimization_corrupts_truth,
        withoutDespair: executiveWorldState.collective_exhaustion < 8,
      });
      const gpNsRepair = readCollectiveNervousSystemRepair({
        audienceOverloaded: executiveWorldState.digital_overload >= 7,
        brandOfferingSlowness: !gpForcing, brandOfferingPermission: civIdentityHeld,
      });
      const gpSymGen = readSymbolGenerationKernel({
        meaningDensity: feedbackState.meaningPersistenceScore, symbolicCoherence: civIdentityHeld ? 8 : 4,
      });
      const gpMythDens = readMythDensityTracker({ archetypeCount: 1, symbolReuse: 3 });
      const gpBeautyRes = readBeautyResonanceMonitor({ beautyPresent: !gpForcing, audienceReceptive: !lcStress.too_stressed_to_act_on });
      const gpWound = readCollectiveWoundReader({
        exhaustionHigh: executiveWorldState.collective_exhaustion >= 7,
        trustEroded: executiveWorldState.trust_erosion >= 7,
        isolationHigh: executiveWorldState.loneliness_index >= 7,
      });
      const gpHopeSeed = readHopeSeedDetector({
        truthfulOptimism: civIdentityHeld && !antiOptimizationReading.optimization_corrupts_truth,
        groundedInReality: lcPresenceVer.is_present,
      });
      const gpCynVec = readCynicismVectorScanner({ cynicismLevel: executiveWorldState.trust_erosion, ironicTone: false });
      const gpPresMeter = readGenerativePresenceMeter({ fieldStrength: gpField.field_strength, meaningPropagating: gpMeaningProp.propagating });
      const gpRadius = readPresenceFieldRadius({ fieldStrength: gpField.field_strength, secondHandSpread: fbSecondHand.second_hand_resonance });
      const gpDensField = readMeaningDensityField({ meaningPropagated: generativePresenceState.meaningPropagated, presenceCycles: Math.max(1, generativePresenceState.presenceCycles) });
      const gpHalfLife = readMeaningHalfLifeTracker({ persistenceScore: feedbackState.meaningPersistenceScore });
      const gpTGStr = readTrustGravityStrength({ gravityWellStrength: gpTrustWell.gravity_strength });
      const gpTGRad = readTrustGravityRadius({ gravityStrength: gpTrustWell.gravity_strength, secondHandSpread: fbSecondHand.second_hand_resonance });
      const gpSymLang = readSymbolicLanguageGenerator({ uniquePhrasesUsed: 3, consistentVoice: civIdentityHeld });
      const gpSymCoh = readSymbolicCoherenceValidator({ symbolsAligned: civIdentityHeld, voiceUnified: civIdentityHeld });
      const gpMythArch = readMythArchetypeMatcher({ storyShape: civIdentityHeld ? 'quiet-witness' : 'none' });
      const gpMythTime = readMythTimelinessGauge({ culturalNeedForMyth: executiveWorldState.trust_erosion });
      const gpHealDispatch = readCollectiveHealingDispatch({ woundDetected: gpWound.wound_detected, patternAvailable: gpHealingPatterns.pattern_kind });
      const gpHealMon = readCollectiveHealingMonitor({ dispatched: gpHealDispatch.dispatched, received: !lcStress.too_stressed_to_act_on });
      const gpResWave = readResonanceWaveformAnalyzer({ intensity: couplingState.trustLevel, persistence: feedbackState.meaningPersistenceScore });
      const gpResFCoh = readResonanceFieldCoherence({ fieldVariance: lcSentimentField.field_variance, fieldMean: lcSentimentField.field_mean });
      const gpInfNoP = readInfluenceWithoutPersuasion({ presenceField: gpField.field_strength, pushing: gpForcing });
      const gpInvGov = readInvitationOverPersuasionGovernor({ inviting: !gpForcing, persuading: gpForcing });
      const gpBeautyDur = readBeautyDurabilityScanner({ beautyAge: 2, stillResonating: feedbackState.meaningPersistenceScore >= 5 });
      const gpBeautySil = readBeautyResonanceWithSilence({ beautyDepth: civIdentityHeld ? 7 : 3, silencePresent: cplSilence.recommend_silence });
      const gpCynImm = readCynicismImmunityLayer({ sincerityHeld: civIdentityHeld, cynicismPressure: executiveWorldState.trust_erosion });
      const gpAntiNih = readAntiNihilismRuntime({ meaningOffered: !gpForcing, despairResisted: executiveWorldState.collective_exhaustion < 8 });
      const gpHopeCoh = readHopeCoherenceValidator({ hopeOffered: gpHope.hope_is_coherent, groundedInReality: lcPresenceVer.is_present });
      const gpHopeNoDel = readHopeWithoutDelusion({ hope: gpHope.hope_is_coherent, acknowledgesDifficulty: true });
      const gpBreath = readCollectiveBreathRestoration({ offeredPause: cplSilence.recommend_silence, audienceFatigued: cplSocialExhaustion.social_exhaustion >= 6 });
      const gpNsFlow = readNervousSystemRegulationFlow({ calmingPresence: civIdentityHeld && !gpForcing, audiencePulse: 7 });
      const gpNotPerf = readPresenceWithoutPerformance({ present: lcPresenceVer.is_present, performing: cplResonance.is_stimulus_addiction });
      const gpGenCont = readGenerativeContagionMap({ beautyPresent: !gpForcing, secondHandSpread: fbSecondHand.second_hand_resonance });
      const gpGenIA = readGenerativeImpactAttribution({ beautyMadeIt: !gpForcing, clarity: lcSignalAgg.live_signal_strength });
      const gpBContag = readBeautyContagionTracker({ momentsCarried: generativePresenceState.beautyMomentsCreated });
      const gpGentleStr = readGentleStrengthIndex({ sovereignty: sovereignIdentityState.sovereigntyScore, softness: 7 });
      const gpQuietAuth = readQuietAuthorityField({ authorityEarned: civIdentityHeld, demanding: gpForcing });
      const gpCohBcast = readCoherentMeaningBroadcast({ messagesAligned: civIdentityHeld });
      const gpSymArt = readSymbolicArtifactPersistence({ artifactDepth: feedbackState.meaningPersistenceScore });
      const gpSpreadVel = readMeaningSpreadVelocity({ meaningsCarried: generativePresenceState.meaningPropagated });
      const gpSpreadFid = readMeaningSpreadFidelity({ memeticIntegrity: fbMemetic.integrity_score });
      const gpWorldExp = readSymbolicWorldExpansionMap({ worldGrowthSignals: gpField.field_strength });
      const gpMythAlign = readMythNarrativeAlignmentScanner({ mythActive: gpMythogen.myth_taking_root, narrativeMatchesMyth: civIdentityHeld });
      const gpHealRipple = readHealingRippleTracker({ secondHandHealings: gpHealMon.healing_landing ? 1 : 0 });
      const gpWoundRec = readWoundRecognitionEngine({ detected: gpWound.wound_detected, kind: gpWound.wound_kind });
      const gpGentleTruth = readGentleTruthDelivery({ truthOffered: !antiOptimizationReading.optimization_corrupts_truth, deliveredHarshly: gpForcing });
      const gpAntiPress = readAntiPressurePresence({ applyingPressure: gpForcing });
      const gpService = readPresenceAsServiceMonitor({ presenceServesAudience: !gpForcing });
      const gpGift = readSymbolicGiftEngine({ offeringMeaningWithoutAsk: !gpForcing });
      const gpGiftLed = readMeaningGiftLedger({ priorGifts: generativePresenceState.beautyMomentsCreated, thisCycleGift: gpGift.gift_offered });
      const gpAcct = readGenerativeAccountabilityArchive({ forcedAttempts: generativePresenceState.forcedInfluenceAttempts, beautyCount: generativePresenceState.beautyMomentsCreated });
      const gpNoPredate = readPresenceWithoutPredation({ extractingAttention: gpForcing });
      const gpNoOptEng = readAntiEngagementOptimization({ optimizingForEngagement: cplResonance.is_stimulus_addiction });
      const gpBeautyOverSpec = readBeautyOverSpectacleGovernor({ beautifulOptionPicked: !gpForcing, spectacleOptionPicked: gpForcing });
      const gpDepth = readSubstantiveDepthScanner({ meaningWeight: feedbackState.meaningPersistenceScore });
      const gpJoy = readCoherentJoyArchitecture({ joyOffered: !gpForcing, sincere: civIdentityHeld });
      const gpResHarv = readCollectiveResonanceHarvester({ resonanceAccrued: feedbackState.resonanceCurveAUC });
      const gpCivicTrust = readCivicTrustBuilder({ contributingToCollective: !gpForcing });
      const gpSymSov = readSymbolicSovereigntyRespect({ takesFromOthers: false });
      const gpPlural = readPluralisticPresenceLayer({ addressesMultipleAudiences: true });
      const gpCadence = readGentlePresenceCadence({ spaceBetween: cplSilence.recommend_silence ? 5 : 2 });
      const gpAntiCol = readAntiColonizationLayer({ takingOverSpace: gpForcing });
      const gpFormat = readPresenceOfferingFormatEngine({ formatMatchesContent: true });
      const gpQuietMag = readQuietPresenceMagnetism({ quiet: !gpForcing, drawingAttentionAnyway: gpTrustWell.pulling_without_effort });
      const gpNotOwn = readPresenceWithoutOwnership({ clingingToControl: gpForcing });
      const gpGentleRec = readGentleReclamationLayer({ reclaimingSpaceForcefully: gpForcing });
      const gpAntiOther = readAntiOtheringEngine({ castingAnEnemy: false });
      const gpRefuge = readSymbolicRefugeProvider({ audienceNeedsRefuge: lcStress.too_stressed_to_act_on, brandOfferingShelter: civIdentityHeld });
      const gpAnchor = readMeaningAnchoringRuntime({ foundingMeaningPresent: civIdentityHeld });
      const gpWatchdog = readGenerativePresenceWatchdog({ fieldStrength: gpField.field_strength, forcing: gpForcing });
      const gpFlourAcc = readCivilizationFlourishingAccelerator({ coherenceScore: generativePresenceState.civilizationCoherenceScore });
      const gpBeautyAsTruth = readBeautyAsTruthValidator({ beautiful: !gpForcing, truthful: !antiOptimizationReading.optimization_corrupts_truth });
      const gpResting = readRestingPresenceMonitor({ silentThisCycle: !actPublish.publish_decision || actPublish.publish_decision !== 'publish', presenceStillHeld: lcPresenceVer.is_present });
      const gpSilGift = readSilenceAsGiftDetector({ silenceCame: cplSilence.recommend_silence, audienceWanted: lcStress.too_stressed_to_act_on });
      const gpImpactAud = readGenerativeImpactAuditor({ claimedImpact: lcImpact.impact_strength, verifiedImpact: lcAttribution.attribution_share });
      const gpHealth = readGenerativePresenceHealthCheck({ fieldStrength: gpField.field_strength, coherence: generativePresenceState.civilizationCoherenceScore });
      const gpCohMon = readCivilizationCoherenceMonitor({ coherenceScore: generativePresenceState.civilizationCoherenceScore });
      const gpHopeInt = readCoherentHopeIntegrityValidator({ hopeCoherent: gpHope.hope_is_coherent, notDeluded: gpHopeNoDel.honest_hope });
      const gpDignity = readGenerativePresenceDignityCheck({ presenceDignified: !cplResonance.is_stimulus_addiction });
      const gpPropCoh = readMeaningPropagationCoherence({ velocity: gpSpreadVel.velocity, fidelity: gpSpreadFid.fidelity });
      const gpPresCoh = readGenerativePresenceCoherence({ fieldStrong: gpField.field_strength >= 6, forcing: gpForcing, offeringGifts: gpGift.gift_offered });
      const gpPresGov = readGenerativePresenceGovernor({ fieldGenerative: gpField.field_is_generative, forcing: gpForcing, coherent: gpPresCoh.coherent });
      const gpBoundary = readGenerativePresenceBoundary({ forcingInfluence: gpForcing, manipulating: antiOptimizationReading.optimization_corrupts_truth, predating: cplResonance.is_stimulus_addiction });
      const gpPresCheck = readGenerativePresencePresenceCheck({ fieldGenerative: gpField.field_is_generative, withinBoundary: gpBoundary.within });
      const gpFlourScore = readCivilizationFlourishingScore({ coherence: generativePresenceState.civilizationCoherenceScore, beauty: gpBeautyPersist.persistence_score, hope: gpHopeSeed.seed_quality });
      const gpIntCoh = readGenerativeIntegrityCoherence({ presenceCoherent: gpPresCoh.coherent, meaningCoherent: gpPropCoh.coherent, hopeCoherent: gpHopeCoh.coherent });
      const gpMemory = readGenerativePresenceMemoryArchive({ cycles: generativePresenceState.presenceCycles, beautyMoments: generativePresenceState.beautyMomentsCreated });
      const gpResilience = readExistentialPresenceResilienceMonitor({ presenceCycles: generativePresenceState.presenceCycles, flourishingShare: 0.5 });
      const gpKernel = readCivilizationCoherenceRuntime({
        state: generativePresenceState, governor: gpPresGov,
        presenceField: gpField, hope: gpHope, coherence: gpIntCoh,
      });
      emit({
        stage: 'generative-presence',
        message: `${gpKernel.generative_state} (${gpKernel.civilization_coherence_score}/10) · ${gpPresGov.governance} · "${gpKernel.what_the_world_received}"`,
      });
      if (gpKernel.damaged_reality_by_forcing) {
        emit({ stage: 'generative-presence', message: 'META-CRITIC FLAG — the brand damaged reality by forcing it' });
      }
      // ═══════════════════════════════════════════════════════════

      const finalVerdict = decideFinalVerdict({
        ctx,
        scrollStop,
        taste,
        psychology,
        productPresence,
        reference,
        memory,
        brutality: opts.brutality,
        judge,
        reaction,
        fatigue,
        antiAI,
        rhythmWorsen,
        job: jobDecision,
        direction,
        aftertastePrediction: tentativeAftertaste,
        atmosphere: tentativeAtmosphere,
        drift: driftReport,
        // Phase 5
        visualTaste,
        emotionalAftertaste,
        campaignMemoryV2,
        // Phase 7
        perceptionCriticVerdict,
        campaignIdentity,
        // Phase 8
        gravity,
        negativeSpace,
        compositionRhythm8,
        productPresence8,
        framing8,
        directorVerdict,
        // Phase 9
        sequenceVerdict,
        tempoWorsen,
        absenceDecision,
        contradictionReading,
        objectMemoryGraph,
        // Phase 10
        compressionReading,
        syntheticReading,
        cinematicVerdict,
        // Phase 11
        humanContradiction,
        nonPerformative,
        lifeNoise,
        // Phase 12
        sharedPattern: sharedPatternMatch.pattern,
        collectiveRecognition,
        unspokenRitualPick,
        culturalDriftReading,
        // Phase 13
        realityPressureReading,
        consequenceReading,
        invisibleStakesReading,
        functionalCollapseReading,
        // Phase 14
        avoidanceReading,
        numbingReading,
        maskingReading,
        unfeltReading,
        // Phase 15
        truthPersistenceReport,
        realityVerificationReading,
        emotionalDecayReading,
        generationPressureReading,
        // Phase 16
        privateLanguageReading,
        realityWeightingReading,
        // Phase 17
        systemicCauseReading,
        attentionFragmentationReading,
        environmentalSystemReading,
        recoveryFailureReading,
        cognitiveResidueReading,
        // Phase 18
        behaviorLoopReading,
        microEscapeReading,
        ritualCompensationReading,
        fakeRecoveryReading,
        silentCopingReading,
        behavioralResidueReading,
        // Phase 19
        socialMaskingEngineReading,
        highFunctioningBurnoutReading,
        identityMaintenanceReading,
        emotionalCamouflageReading,
        publicPrivateSplitReading,
        maskFatigueReading,
        // Phase 20
        desireArchitectureReading,
        quietStatusReading,
        emotionalHungerReading,
        validationSystemsReading,
        invisibleEnvyReading,
        aspirationalGapReading,
        // Phase 21
        socialGravityReading,
        collectiveMovementReading,
        culturalAccelerationReading,
        groupAnxietyReading,
        viralPatternsReading,
        socialPermissionReading,
        // Phase 22
        ritualFormationReading,
        attachmentLoopsReading,
        symbolicSafetyReading,
        emotionalReturnReading,
        privateRitualMemoryReading,
        repeatedComfortReading,
        // Phase 23
        internalNarrativeReading,
        selfStoryReading,
        identityContinuityReading,
        meaningSystemsReading,
        selfTranslationReading,
        personalMythologyReading,
        // Phase 24
        emotionalForecastReading,
        behaviorPredictionReading,
        collapseProbabilityReading,
        recoveryAttemptReading,
        pressureTrajectoryReading,
        emotionalDriftReading,
        // Phase 25
        autonomousNarrativeReading,
        culturalSignalEvolutionReading,
        selfUpdatingPsychologyReading,
        emergentCampaignMemoryReading,
        collectiveRealityTrackingReading,
        adaptiveEmotionalIntelligenceReading,
        // Unified graph
        unifiedGraphReading,
        // Phase 26 — unified cognitive field
        cognitiveField,
        emotionalPhysicsReading,
        tensionTopologyReading,
        contradictionResolution,
        // Phase 27 — persistent cognitive runtime
        cognitiveContinuity,
        runtimeDrift,
        priorNextRunDirective: runtimeContext.nextRunDirective,
        // Wave 2 — reality execution architecture
        nervousSystemReading,
        attentionPhysicsReading,
        visualCognitionReading,
        emotionalContinuityReading,
        audienceFeedbackReading,
        antiOptimizationReading,
        identityPersistenceReading,
        autonomousDirectionReading,
        realityExecution,
        // Wave 4 — executive cognition layer
        strategicPriorityReading,
        cognitiveEnergyReading,
        temporalPsychologyReading,
        identityGovernanceReading,
        campaignLifecycleReading,
        executiveWorldState,
        worldUnderstanding,
        executiveDecision,
        // Wave 5 — autonomous strategic society
        councilSession,
        internalDebate,
        councilConflict,
        executiveConsensus,
        strategicConsciousness,
        // Wave 6 — cognitive civilization infrastructure
        civLaws,
        civScars,
        civEthics,
        civStability,
        civIdeologicalMutation,
        civIdentityContinuity,
        // Wave 7 — reality organism architecture
        orgEnvironmental,
        orgImmune,
        orgEnergy,
        orgClimate,
        orgIdentityStress,
        orgExpansion,
        orgRhythm,
        orgAttentionForecast,
        orgMemetic,
        orgFatigue,
        orgSilence,
        orgEmotionalResource,
        orgAdaptiveWorldModel,
        orgComplexity,
        orgEvolutionGovernance,
        orgAdaptiveRuntime,
        orgStabilityPreservation,
        orgExistentialRisk,
        orgCore,
        // Wave 8 — operating system genesis
        osKernel,
        osScheduler,
        osInterrupts,
        osTaskQueue,
        osResources,
        osCognitionGraph,
        osDirective,
        osLoops,
        osPause,
        osHealth,
        osMemoryPressure,
        osMultiHorizon,
        osReflection,
        osArbitration,
        osIdentityEnforcement,
        osSeason,
        osDependencies,
        osStabilization,
        osExecutiveState,
        osCore,
        // Wave 10 — reality coupling architecture
        cplIngestion,
        cplEngagementTruth,
        cplSaturation,
        cplTrust,
        cplClimate,
        cplAudience,
        cplPlatformDrift,
        cplAuthenticity,
        cplSilence,
        cplReputation,
        cplMeaning,
        cplSocialExhaustion,
        cplAttentionEconomy,
        cplContradiction,
        cplWorldFeedback,
        cplResonance,
        cplGovernor,
        cplExternalModel,
        cplHealth,
        cplCore,
        // Wave 11 — strategic future intelligence
        futScenarios,
        futTimeline,
        futNarrative,
        futCulturalShift,
        futReputation,
        futTrustCompounding,
        futMarketTiming,
        futPatience,
        futSecondOrder,
        futAntifragility,
        futBlackSwan,
        futCompetitor,
        futEcosystem,
        futIdentityContinuity,
        futSacrifice,
        futHorizonScan,
        futOpportunityCost,
        futCompounding,
        futStrategicDebt,
        futMemory,
        futLongHorizonRisk,
        futIrreversibility,
        futOptionality,
        futGenerational,
        futIdentity,
        futConviction,
        futTemporalArbitrage,
        futCoherence,
        futGovernor,
        futCore,
        // Wave 12 — autonomous action architecture
        actAuth, actExistence, actPublish, actDeployment, actPlatform, actTrustOpt,
        actAudienceRecovery, actSilenceEnforcement, actPacing, actRisk, actNarrativeCont,
        actRollout, actResonancePreserving, actExecMemory, actExperimentation, actEscalation,
        actMutation, actFeedback, actConsequence, actCompulsion, actDignity, actLoad,
        actOverreach, actReversibility, actDeploymentWindow, actRestraintBudget, actIntent,
        actCadence, actThrottle, actWorthiness, actRouting, actFeedbackLoop, actWithholding,
        actPortfolio, actHealth, actBoundary, actAccountability, actCoherence, actGovernor, actCore,
        // Wave 13 — reality feedback infrastructure
        fbIngestion, fbTrustShift, fbResonanceDecay, fbSilenceImpact, fbEmotionalTruth,
        fbContradictions, fbDelayedImpact, fbCollectiveMood, fbMemetic, fbIdentityCorrection,
        fbSignalQuality, fbEcho, fbNervousSystem, fbLatency, fbSentimentDrift, fbAuthenticity,
        fbResultLedger, fbBiasFilter, fbPatternMemory, fbIdentityBridge, fbStrategyAdjust,
        fbExecRefine, fbImpactCurve, fbNarrativeReception, fbCounterNarrative, fbSecondHand,
        fbSilenceAsFeedback, fbGenre, fbTrustGraph, fbMeaning, fbFalseSuccess, fbContradictionResolved,
        fbSlowTruth, fbSignalIntegrity, fbEcology, fbArchive, fbAttribution, fbCoherence,
        fbGovernor, fbCore,
        // Wave 14 — live civilization coupling
        lcComment, lcStream, lcSentimentField, lcSentimentGrad, lcMoodVel, lcResonanceVel,
        lcResonanceDir, lcStress, lcStressContagion, lcPulse, lcWeather, lcFront,
        lcPressureGrad, lcContagion, lcSpreadVel, lcMutation, lcDelayedMeaning, lcSlowAmp,
        lcMeaningVsNov, lcNoveltyDecay, lcMeaningDensity, lcSilenceTiming, lcSilenceWindow,
        lcLivingRep, lcRepGrad, lcRepVel, lcSignalAgg, lcSignalDecay, lcAttention,
        lcTrustField, lcCouplingHealth, lcPresenceMeter, lcPresenceVer, lcImpact,
        lcAttribution, lcLatency, lcCollectivePulse, lcNarrOrient, lcContradictionField,
        lcAttDecay, lcCrisis, lcOpportunity, lcDrift, lcDriftCorr, lcAnchor, lcBoundary,
        lcChangeLedger, lcMemoryArchive, lcTrustVel, lcContextWin, lcAttribAudit,
        lcIntegrity, lcCadence, lcHealthBal, lcDignity, lcCivState, lcCoherence,
        lcGovernor, lcPresenceCheck, lcKernel,
        // Wave 15 — identity preservation under live reality
        idInvariants, idImmune, idAntiAssim, idTruthOverPop, idCapture, idMemeticCorr,
        idResonanceSov, idDriftRecovery, idNarrSov, idInvValidator, idErosion,
        idPopDecoupler, idVoiceProt, idAssimPressure, idImmuneResp, idSovVerified,
        idSelfRec, idCorruptLog, idReactive, idApprovalChase, idTrendPull, idAnchor,
        idBetrayal, idPopulistDrift, idSovBudget, idComprCounter, idSelfErase,
        idBeliefInt, idShape, idVoiceCons, idSelfImage, idValDep, idDecisionLog,
        idPopTempt, idResilience, idTruthSent, idCalibration, idMirroring, idCorrosion,
        idNarrSovMon, idSelfRef, idHealth, idAntiAdapt, idBoundary, idAlienBel,
        idStormImm, idCultGrav, idComprLed, idSelfReadout, idExtSep, idRecall,
        idShapePress, idBetEarly, idCenterGrav, idPrincViol, idMimicry, idRecProtocol,
        idEnfBudget, idCorrContain, idRebuild, idSustenance, idCoreAct, idCaptureRisk,
        idBleed, idVoiceAmp, idWatchdog, idDoubt, idCohesion, idForce, idMaint, idFid,
        idPressBuf, idActFilter, idCoherUnder, idPopAttr, idCoherValid, idGovernor,
        idPresenceCheck, idExistRes, idKernel,
        // Wave 16 — generative civilization presence
        gpKernel, gpPresGov, gpBoundary, gpPresCheck, gpField,
        gpHope, gpBeautyAsTruth, gpWatchdog, gpAcct, gpHealth, gpFlourScore,
        gpIntCoh, gpDignity, gpPresCoh, gpNonManip, gpInvGov, gpAntiPress,
        gpService, gpNoPredate, gpNoOptEng, gpBeautyOverSpec, gpQuietAuth,
        gpGift, gpAntiCol, gpNotOwn, gpAntiOther, gpAntiCyn, gpAntiNih,
      });
      // ───────────────────────────────────────────────────────────

      if (finalVerdict.verdict === 'approve') {
        const shippedAt = Date.now();
        // Phase 4 — the aftertaste + atmosphere already computed
        // pre-verdict. Persist them.
        const aftertastePrediction = { ...tentativeAftertaste, shippedAt };
        await aftertasteStore.upsert(aftertastePrediction);
        const atmosphere = tentativeAtmosphere;

        // ─── Phase 26 — the world model absorbs this banner ───────
        // Record the banner's causal chain into the campaign-level
        // causal memory graph, then evolve the persistent world-state.
        const causalChainLinks: CausalChainLink[] = [];
        if (systemicCauseReading.matched_systems.primary) {
          causalChainLinks.push({ kind: 'cause', label: systemicCauseReading.matched_systems.primary.id });
        }
        if (behaviorLoopReading.primary_loop) {
          causalChainLinks.push({ kind: 'behavior', label: behaviorLoopReading.primary_loop.id });
        }
        if (cognitiveResidueReading.detected[0]) {
          causalChainLinks.push({ kind: 'residue', label: cognitiveResidueReading.detected[0].id });
        }
        if (socialMaskingEngineReading.primary) {
          causalChainLinks.push({ kind: 'adaptation', label: socialMaskingEngineReading.primary.id });
        }
        if (symbolicObjectsReading.objects_present[0]) {
          causalChainLinks.push({ kind: 'symbolic-object', label: symbolicObjectsReading.objects_present[0].object });
        }
        causalChainLinks.push({ kind: 'future-drift', label: emotionalForecastReading.direction });
        recordCausalChain(causalGraph, causalChainLinks);

        worldState = evolveWorldStateFromBanner(worldState, {
          state,
          attentionFragmentationScore: attentionFragmentationReading.attention_fragmentation_score,
          recoveryFailing: recoveryFailureReading.rest_is_not_rest,
          ritualIntensity: ritualCompensationReading.ritual_compulsion,
          identityPressure: identityMaintenanceReading.identity_pressure,
          maskingActive: socialMaskingEngineReading.primary !== null,
          desireVolatile: desireArchitectureReading.uses_forbidden_framing,
          culturalPressure: collectiveMovementReading.movement_confidence,
        });

        // Self-evolving world model — what the system should now
        // strengthen, weaken, retire, or detect as emerging.
        const worldModelEvolution = evolveWorldModel({
          worldState, causalGraph,
          desireEntries: desireEntriesAtRunStart,
          truthPersistence: truthPersistenceReport,
          decay: emotionalDecayReading,
        });

        // The cognition trace — the system explaining its thinking.
        const cognitionTrace = buildCognitionTrace({
          bannerId,
          field: cognitiveField,
          physics: emotionalPhysicsReading,
          topology: tensionTopologyReading,
          trajectory: lifeTrajectoryReading,
          resolver: contradictionResolution,
          rejectedAttempts,
          productDecision: `productRole=${direction.productRole}`,
          typographyDecision: `typographyDominance=${direction.typographyDominance}`,
          silenceDecision: `restraint=${direction.restraint.toFixed(2)}`,
          worldStateUpdate: describeWorldState(worldState),
        });
        emit({
          stage: 'cognition-trace',
          message: `explainability ${cognitionTrace.explainability}/10 — ${cognitionTrace.finalCreativeReason}`,
        });
        if (worldModelEvolution.evolution_pressure >= 5) {
          emit({
            stage: 'self-evolving-world-model',
            message: `evolution pressure ${worldModelEvolution.evolution_pressure}/10 — ${worldModelEvolution.notes[0] ?? ''}`,
          });
        }

        // ─── Phase 27 — the runtime learns from this approval ─────
        const runtimeHealth = assessRuntimeHealth({
          field: cognitiveField,
          drift: runtimeDrift,
          continuity: cognitiveContinuity,
          approvedCount: runtimeContext.approvedCount,
          rejectedCount: runtimeContext.rejectedCount,
          contradictionCount: contradictionResolution.conflicts.length,
          realitySync: collectiveRealityTrackingReading.reality_sync,
          productRole: direction.productRole,
        });
        const nextRunDirective = generateNextRunDirective({
          generationIndex: runtimeContext.generationIndex,
          field: cognitiveField,
          worldModelEvolution,
          usedTerritory: state.family,
          usedObjects: symbolicObjectsReading.objects_present.map((o) => o.object),
          driftCorrections: runtimeDrift.correction_needed,
          driftTooMuchSilence: runtimeDrift.too_much_silence,
          driftTooMuchHeaviness: runtimeDrift.too_much_heaviness,
        });
        const runtimeTrace = buildRuntimeTrace({
          generationIndex: runtimeContext.generationIndex,
          priorState: runtimeContext.priorState,
          field: cognitiveField,
          worldModelEvolution,
          drift: runtimeDrift,
          continuity: cognitiveContinuity,
          nextRunDirective,
          verdict: 'approve',
          worldStateDescription: describeWorldState(worldState),
        });
        const approvalRecord: ApprovalRecord = {
          ts: shippedAt,
          generationIndex: runtimeContext.generationIndex,
          approvedConcept: `${emotionalCore?.id ?? state.id}: ${truth.truth.slice(0, 90)}`,
          whyApproved: cognitionTrace.finalCreativeReason,
          dominantHumanTruth: cognitiveField.dominantTruths[0] ?? state.id,
          activePressure: cognitiveField.activePressures[0] ?? 'none',
          behavioralLoop: cognitiveField.behavioralLoops[0] ?? 'none',
          ritualSignal: cognitiveField.ritualAttachments[0] ?? 'none',
          identityTension: cognitiveField.identityNarratives[0] ?? 'none',
          culturalRecognitionScore: collectiveRecognition.recognition_score,
          atmosphereSignature: cognitiveField.campaignAtmosphere,
          objectMotif: symbolicObjectsReading.objects_present[0]?.object ?? '',
          productRole: direction.productRole,
          expectedAftertaste: tentativeAftertaste.residueStrength,
          futureTrajectory: emotionalForecastReading.direction,
        };
        const runtimeHistoryEntry: RuntimeHistoryEntry = {
          generationIndex: runtimeContext.generationIndex,
          ts: shippedAt,
          verdict: 'approve',
          dominantTruth: cognitiveField.dominantTruths[0] ?? state.id,
          emotionalTerritory: state.family,
          symbolicObjects: symbolicObjectsReading.objects_present.map((o) => o.object),
          worldStateGen: worldState.generationCount,
          emergence: cognitiveField.emergence_score,
          fieldCoherence: cognitiveField.field_coherence,
          continuityScore: cognitiveContinuity.continuity_score,
          silenceLevel: Math.round(direction.restraint * 10),
        };
        const nearMissRejection = rejectedAttempts.length > 0
          ? buildRejectionRecord({
              generationIndex: runtimeContext.generationIndex,
              rejectedConcept: `${state.family}: ${rejectedAttempts[0].stage}`,
              verdict: 'near-miss',
              reasons: [rejectedAttempts[0].reason],
            })
          : null;
        const persistentRuntimeState = await commitApprovedRun(runtimeStore, {
          context: runtimeContext,
          field: cognitiveField,
          continuity: cognitiveContinuity,
          health: runtimeHealth,
          trace: runtimeTrace,
          nextRunDirective,
          approvalRecord,
          historyEntry: runtimeHistoryEntry,
          nearMissRejection,
          worldStateDelta: describeWorldState(worldState),
          humanGraphDelta: `coherence ${unifiedGraphReading.human_coherence.toFixed(1)}/10`,
          symbolicObjectDelta: symbolicObjectsReading.objects_present.map((o) => o.object).join(', ') || 'none',
          truthPersistenceDelta: `durability ${cognitiveField.truthPersistence}/10`,
          decayDelta: cognitiveField.decaySignals.join(', ') || 'no decay',
          trajectoryDelta: emotionalForecastReading.direction,
          campaignIdentityDelta: `belongs ${unifiedGraphReading.candidate_belongs.toFixed(1)}/10`,
          audienceSignalDelta: `${ingestedSignals.length} reality signals in scope`,
        });
        emit({
          stage: 'runtime',
          message: `${persistentRuntimeState.changed_the_mind ? 'the run CHANGED the mind of the system' : 'the run did not change the system — runtime not advancing'} · health ${runtimeHealth.overall_health}/10 · ${runtimeTrace.director_memo}`,
        });

        const partial: Omit<Banner, 'memorySnapshot'> = {
          id: bannerId,
          createdAt: shippedAt,
          formula: ctx.formula,
          campaignMode: ctx.campaignMode,
          state, truth, direction, composition,
          imageBrief: brief, image, typography, cta,
          critique: scrollStop,
          taste, psychology, productPresence, referenceMatch: reference, finalVerdict,
          tasteSystem: {
            dna, judge, reaction, fatigue, evolutionAtRunStart,
            campaignBrain: {
              job: jobDecision,
              culturalMoment,
              courage,
              rhythm: rhythmReport,
              antiAI,
              residue: '', // filled by entryFromBanner below
            },
            realityLoop: {
              aftertastePrediction,
              drift: driftReport,
              atmosphere,
            },
            perception: {
              emotionalCore,
              culturalMicroMoment,
              visualTaste,
              imperfection: imperfectionPlan,
              emotionalAftertaste,
              campaignMemoryV2,
            },
            perceptionV2: {
              atmosphericLight,
              typographyPsychology,
              worldContinuity,
              microHumanDetails,
              invisibleStory,
              humanInterruption,
              campaignIdentity,
              perceptionCritic: perceptionCriticVerdict,
            },
            composition8: {
              gravity,
              negativeSpace,
              rhythm: compositionRhythm8,
              presence: productPresence8,
              framing: framing8,
              director: directorVerdict,
            },
            temporal: {
              timeline: campaignTimeline,
              sequence: sequenceVerdict,
              worldPersistence,
              objectGraph: objectMemoryGraph,
              sceneContinuity: sceneContinuityReport,
              visualTempo,
              absence: absenceDecision,
              contradiction: contradictionReading,
            },
            cinematic: {
              unresolved: unresolvedReport,
              compression: compressionReading,
              recognition: subconsciousRecognition,
              synthetic: syntheticReading,
              verdict: cinematicVerdict,
            },
            humanity: {
              lifeNoise,
              contradiction: humanContradiction,
              nonPerformative,
            },
            culture: {
              sharedPattern: sharedPatternMatch.pattern,
              collectiveRecognition,
              unspokenRitual: unspokenRitualPick,
              drift: culturalDriftReading,
            },
            pressure: {
              reality: realityPressureReading,
              consequence: consequenceReading,
              invisibleStakes: invisibleStakesReading,
              functionalCollapse: functionalCollapseReading,
            },
            suppression: {
              avoidance: avoidanceReading,
              numbing: numbingReading,
              masking: maskingReading,
              unfelt: unfeltReading,
            },
            longitudinal: {
              truthPersistence: truthPersistenceReport,
              culturalTimeline: culturalTimelineReport,
              realityVerification: realityVerificationReading,
              emotionalDecay: emotionalDecayReading,
              generationPressure: generationPressureReading,
            },
            reality: {
              extraction: humanSignalExtraction,
              collectiveDrift: collectiveDriftReport,
              privateLanguage: privateLanguageReading,
              weighting: realityWeightingReading,
            },
            systems: {
              systemicCause: systemicCauseReading,
              attentionFragmentation: attentionFragmentationReading,
              environmentalSystem: environmentalSystemReading,
              recoveryFailure: recoveryFailureReading,
              cognitiveResidue: cognitiveResidueReading,
            },
            survival: {
              behaviorLoop: behaviorLoopReading,
              microEscape: microEscapeReading,
              ritualCompensation: ritualCompensationReading,
              fakeRecovery: fakeRecoveryReading,
              silentCoping: silentCopingReading,
              behavioralResidue: behavioralResidueReading,
            },
            identity: {
              socialMaskingEngine: socialMaskingEngineReading,
              highFunctioningBurnout: highFunctioningBurnoutReading,
              identityMaintenance: identityMaintenanceReading,
              emotionalCamouflage: emotionalCamouflageReading,
              publicPrivateSplit: publicPrivateSplitReading,
              maskFatigue: maskFatigueReading,
            },
            desire: {
              architecture: desireArchitectureReading,
              quietStatus: quietStatusReading,
              emotionalHunger: emotionalHungerReading,
              validation: validationSystemsReading,
              invisibleEnvy: invisibleEnvyReading,
              aspirationalGap: aspirationalGapReading,
            },
            socialGravity: {
              gravity: socialGravityReading,
              collectiveMovement: collectiveMovementReading,
              culturalAcceleration: culturalAccelerationReading,
              groupAnxiety: groupAnxietyReading,
              viralPatterns: viralPatternsReading,
              permissionStructures: socialPermissionReading,
            },
            ritual: {
              formation: ritualFormationReading,
              attachmentLoops: attachmentLoopsReading,
              symbolicSafety: symbolicSafetyReading,
              returnMechanics: emotionalReturnReading,
              privateRitualMemory: privateRitualMemoryReading,
              comfortSystems: repeatedComfortReading,
            },
            narrative: {
              internalNarrative: internalNarrativeReading,
              selfStory: selfStoryReading,
              identityContinuity: identityContinuityReading,
              meaningSystems: meaningSystemsReading,
              selfTranslation: selfTranslationReading,
              personalMythology: personalMythologyReading,
            },
            predictive: {
              forecast: emotionalForecastReading,
              behaviorPrediction: behaviorPredictionReading,
              collapseProbability: collapseProbabilityReading,
              recoveryAttempt: recoveryAttemptReading,
              pressureTrajectory: pressureTrajectoryReading,
              drift: emotionalDriftReading,
            },
            autonomous: {
              narrativeEngine: autonomousNarrativeReading,
              culturalSignalEvolution: culturalSignalEvolutionReading,
              selfUpdatingPsychology: selfUpdatingPsychologyReading,
              emergentMemory: emergentCampaignMemoryReading,
              realityTracking: collectiveRealityTrackingReading,
              adaptiveIntelligence: adaptiveEmotionalIntelligenceReading,
            },
            unifiedGraph: unifiedGraphReading,
            cognition: {
              field: cognitiveField,
              physics: emotionalPhysicsReading,
              tensionTopology: tensionTopologyReading,
              lifeTrajectory: lifeTrajectoryReading,
              contradictionResolution,
              symbolicObjects: symbolicObjectsReading,
              trace: cognitionTrace,
              worldModelEvolution,
            },
            runtime: {
              persistentState: persistentRuntimeState,
              continuity: cognitiveContinuity,
              drift: runtimeDrift,
              health: runtimeHealth,
              trace: runtimeTrace,
              nextRunDirective,
              identityDefense,
            },
            execution: {
              nervousSystem: nervousSystemReading,
              attentionPhysics: attentionPhysicsReading,
              visualCognition: visualCognitionReading,
              emotionalContinuity: emotionalContinuityReading,
              audienceFeedback: audienceFeedbackReading,
              antiOptimization: antiOptimizationReading,
              identityPersistence: identityPersistenceReading,
              autonomousDirection: autonomousDirectionReading,
              orchestration: realityExecution,
            },
            executive: {
              strategicPriority: strategicPriorityReading,
              cognitiveEnergy: cognitiveEnergyReading,
              temporalPsychology: temporalPsychologyReading,
              identityGovernance: identityGovernanceReading,
              campaignLifecycle: campaignLifecycleReading,
              worldState: executiveWorldState,
              decision: executiveDecision,
            },
            society: {
              session: councilSession,
              debate: internalDebate,
              conflict: councilConflict,
              plan: campaignPlan,
              arc: narrativeArc,
              silenceGovernance,
              audienceSociety,
              identityCourt,
              selfReflection,
              consensus: executiveConsensus,
              consciousness: strategicConsciousness,
            },
            civilization: {
              institutionalMemory: civInstitutionalMemory,
              culturalDrift: civCulturalDrift,
              beliefs: civBeliefs,
              mythology: civMythology,
              reputationEconomy: civReputationEconomy,
              trustAuthority: civTrustAuthority,
              ideologicalMutation: civIdeologicalMutation,
              scars: civScars,
              decisionArchive: civDecisionArchive,
              laws: civLaws,
              ethics: civEthics,
              politics: civPolitics,
              longTermPlan: civLongTermPlan,
              stability: civStability,
              identityContinuity: civIdentityContinuity,
            },
            organism: {
              environmental: orgEnvironmental,
              immune: orgImmune,
              energy: orgEnergy,
              climate: orgClimate,
              identityStress: orgIdentityStress,
              expansion: orgExpansion,
              rhythm: orgRhythm,
              attentionForecast: orgAttentionForecast,
              memetic: orgMemetic,
              fatigue: orgFatigue,
              silence: orgSilence,
              emotionalResource: orgEmotionalResource,
              adaptiveWorldModel: orgAdaptiveWorldModel,
              longHorizon: orgLongHorizon,
              complexity: orgComplexity,
              evolutionGovernance: orgEvolutionGovernance,
              adaptiveRuntime: orgAdaptiveRuntime,
              stabilityPreservation: orgStabilityPreservation,
              existentialRisk: orgExistentialRisk,
              core: orgCore,
            },
            os: {
              kernel: osKernel,
              scheduler: osScheduler,
              interrupts: osInterrupts,
              taskQueue: osTaskQueue,
              resources: osResources,
              cognitionGraph: osCognitionGraph,
              directive: osDirective,
              loops: osLoops,
              pause: osPause,
              health: osHealth,
              memoryPressure: osMemoryPressure,
              multiHorizon: osMultiHorizon,
              reflection: osReflection,
              arbitration: osArbitration,
              identityEnforcement: osIdentityEnforcement,
              season: osSeason,
              dependencies: osDependencies,
              stabilization: osStabilization,
              executiveState: osExecutiveState,
              core: osCore,
            },
            coupling: {
              ingestion: cplIngestion,
              engagementTruth: cplEngagementTruth,
              saturation: cplSaturation,
              trust: cplTrust,
              climate: cplClimate,
              audience: cplAudience,
              platformDrift: cplPlatformDrift,
              authenticity: cplAuthenticity,
              silence: cplSilence,
              reputation: cplReputation,
              meaningCompression: cplMeaning,
              socialExhaustion: cplSocialExhaustion,
              attentionEconomy: cplAttentionEconomy,
              contradiction: cplContradiction,
              worldFeedback: cplWorldFeedback,
              resonance: cplResonance,
              governor: cplGovernor,
              externalModel: cplExternalModel,
              health: cplHealth,
              core: cplCore,
            },
            future: {
              scenarios: futScenarios,
              timeline: futTimeline,
              narrativeFuture: futNarrative,
              culturalShift: futCulturalShift,
              reputationFuture: futReputation,
              trustCompounding: futTrustCompounding,
              marketTiming: futMarketTiming,
              patience: futPatience,
              secondOrder: futSecondOrder,
              antifragility: futAntifragility,
              blackSwan: futBlackSwan,
              competitor: futCompetitor,
              ecosystem: futEcosystem,
              identityContinuity: futIdentityContinuity,
              sacrifice: futSacrifice,
              horizonScan: futHorizonScan,
              opportunityCost: futOpportunityCost,
              compoundingAdvantage: futCompounding,
              strategicDebt: futStrategicDebt,
              futureMemory: futMemory,
              longHorizonRisk: futLongHorizonRisk,
              irreversibility: futIrreversibility,
              optionality: futOptionality,
              generational: futGenerational,
              futureIdentity: futIdentity,
              conviction: futConviction,
              temporalArbitrage: futTemporalArbitrage,
              coherence: futCoherence,
              governor: futGovernor,
              core: futCore,
            },
            action: {
              authorization: actAuth, existence: actExistence, publish: actPublish,
              deployment: actDeployment, platform: actPlatform, trustAwareOpt: actTrustOpt,
              audienceRecovery: actAudienceRecovery, silenceEnforcement: actSilenceEnforcement,
              pacing: actPacing, risk: actRisk, narrativeContinuity: actNarrativeCont,
              rollout: actRollout, resonancePreserving: actResonancePreserving,
              memory: actExecMemory, experimentation: actExperimentation,
              escalation: actEscalation, mutation: actMutation, feedbackBridge: actFeedback,
              consequence: actConsequence, compulsion: actCompulsion, dignity: actDignity,
              load: actLoad, overreach: actOverreach, reversibility: actReversibility,
              deploymentWindow: actDeploymentWindow, restraintBudget: actRestraintBudget,
              intent: actIntent, cadence: actCadence, throttle: actThrottle,
              worthiness: actWorthiness, routing: actRouting, feedbackLoop: actFeedbackLoop,
              withholding: actWithholding, portfolio: actPortfolio, health: actHealth,
              boundary: actBoundary, accountability: actAccountability,
              coherence: actCoherence, governor: actGovernor, core: actCore,
            },
            feedback: {
              ingestion: fbIngestion, trustShift: fbTrustShift, resonanceDecay: fbResonanceDecay,
              silenceImpact: fbSilenceImpact, emotionalTruth: fbEmotionalTruth,
              contradictions: fbContradictions, delayedImpact: fbDelayedImpact,
              collectiveMood: fbCollectiveMood, memetic: fbMemetic,
              identityCorrection: fbIdentityCorrection, signalQuality: fbSignalQuality,
              echo: fbEcho, nervousSystem: fbNervousSystem, latency: fbLatency,
              sentimentDrift: fbSentimentDrift, authenticity: fbAuthenticity,
              resultLedger: fbResultLedger, biasFilter: fbBiasFilter,
              patternMemory: fbPatternMemory, identityBridge: fbIdentityBridge,
              strategyAdjust: fbStrategyAdjust, executionRefine: fbExecRefine,
              impactCurve: fbImpactCurve, narrativeReception: fbNarrativeReception,
              counterNarrative: fbCounterNarrative, secondHand: fbSecondHand,
              silenceFeedback: fbSilenceAsFeedback, genre: fbGenre,
              trustGraph: fbTrustGraph, meaning: fbMeaning, falseSuccess: fbFalseSuccess,
              contradictionResolved: fbContradictionResolved, slowTruth: fbSlowTruth,
              signalIntegrity: fbSignalIntegrity, ecology: fbEcology, archive: fbArchive,
              attribution: fbAttribution, coherence: fbCoherence,
              governor: fbGovernor, core: fbCore,
            },
            liveCoupling: {
              commentIngest: lcComment, sentimentField: lcSentimentField,
              resonanceVelocity: lcResonanceVel, audienceStress: lcStress,
              culturalWeather: lcWeather, narrativeContagion: lcContagion,
              delayedMeaning: lcDelayedMeaning, meaningVsNovelty: lcMeaningVsNov,
              silenceTiming: lcSilenceTiming, livingReputation: lcLivingRep,
              streamProcessor: lcStream, sentimentGradient: lcSentimentGrad,
              moodVelocity: lcMoodVel, resonanceDirection: lcResonanceDir,
              stressContagion: lcStressContagion, nervousPulse: lcPulse,
              culturalFront: lcFront, pressureGradient: lcPressureGrad,
              spreadVelocity: lcSpreadVel, mutationDuringSpread: lcMutation,
              slowAmplifier: lcSlowAmp, noveltyDecay: lcNoveltyDecay,
              meaningDensity: lcMeaningDensity, silenceWindow: lcSilenceWindow,
              reputationGradient: lcRepGrad, reputationVelocity: lcRepVel,
              signalAggregator: lcSignalAgg, signalDecay: lcSignalDecay,
              attentionField: lcAttention, trustField: lcTrustField,
              couplingHealth: lcCouplingHealth, presenceMeter: lcPresenceMeter,
              impact: lcImpact, realityAttribution: lcAttribution,
              feedbackLatency: lcLatency, collectivePulse: lcCollectivePulse,
              narrativeOrientation: lcNarrOrient, drift: lcDrift,
              contradictionField: lcContradictionField, attentionDecay: lcAttDecay,
              crisis: lcCrisis, opportunity: lcOpportunity,
              driftCorrection: lcDriftCorr, resonanceAnchor: lcAnchor,
              boundary: lcBoundary, presenceVerified: lcPresenceVer,
              changeLedger: lcChangeLedger, memoryArchive: lcMemoryArchive,
              trustVelocity: lcTrustVel, contextWindow: lcContextWin,
              integrity: lcIntegrity, cadence: lcCadence,
              healthBalancer: lcHealthBal, dignity: lcDignity,
              civilizationState: lcCivState, attributionAudit: lcAttribAudit,
              coherence: lcCoherence, governor: lcGovernor,
              presenceCheck: lcPresenceCheck, kernel: lcKernel,
            },
            sovereignty: {
              invariants: idInvariants, immune: idImmune, antiAssimilation: idAntiAssim,
              truthOverPop: idTruthOverPop, audienceCapture: idCapture,
              memeticCorruption: idMemeticCorr, resonanceSovereign: idResonanceSov,
              driftRecovery: idDriftRecovery, narrativeSovereign: idNarrSov,
              invariantValidator: idInvValidator, erosion: idErosion,
              popularityDecoupler: idPopDecoupler, voiceProtector: idVoiceProt,
              assimilationPressure: idAssimPressure, immuneResponse: idImmuneResp,
              sovereigntyVerified: idSovVerified, selfRecognition: idSelfRec,
              corruptionLogger: idCorruptLog, reactive: idReactive,
              approvalChasing: idApprovalChase, trendPullForce: idTrendPull,
              anchorMaintenance: idAnchor, selfBetrayal: idBetrayal,
              populistDrift: idPopulistDrift, sovereigntyBudget: idSovBudget,
              compromiseCounter: idComprCounter, selfErasure: idSelfErase,
              beliefIntegrity: idBeliefInt, shape: idShape,
              voiceConsistency: idVoiceCons, selfImageGap: idSelfImage,
              validationDependence: idValDep, decisionLog: idDecisionLog,
              populistTemptation: idPopTempt, resilience: idResilience,
              truthSentinel: idTruthSent, calibration: idCalibration,
              audienceMirroring: idMirroring, corrosionPrevention: idCorrosion,
              narrativeSovMonitor: idNarrSovMon, selfReferenceLoop: idSelfRef,
              integrityHealth: idHealth, antiAdaptation: idAntiAdapt,
              boundary: idBoundary, alienBelief: idAlienBel,
              opinionStormImmunity: idStormImm, culturalGravity: idCultGrav,
              compromiseLedger: idComprLed, selfReadout: idSelfReadout,
              externalSeparator: idExtSep, recall: idRecall,
              shapingPressure: idShapePress, betrayalEarlyWarning: idBetEarly,
              centerOfGravity: idCenterGrav, principleViolation: idPrincViol,
              mimicry: idMimicry, recoveryProtocol: idRecProtocol,
              enforcementBudget: idEnfBudget, corruptionContainment: idCorrContain,
              rebuild: idRebuild, sustenance: idSustenance,
              coreActivation: idCoreAct, captureRisk: idCaptureRisk,
              bleedingPrevention: idBleed, voiceAmplifier: idVoiceAmp,
              watchdog: idWatchdog, doubtRegulator: idDoubt,
              cohesionGravity: idCohesion, forceField: idForce,
              maintenance: idMaint, fidelityArchive: idFid,
              pressureBuffer: idPressBuf, actionFilter: idActFilter,
              coherenceUnderPressure: idCoherUnder, populationAttribution: idPopAttr,
              coherence: idCoherValid, governor: idGovernor,
              presenceCheck: idPresenceCheck, existentialResilience: idExistRes,
              kernel: idKernel,
            },
            presence: {
              field: gpField, meaningProp: gpMeaningProp, trustWell: gpTrustWell,
              worldBuild: gpWorldBuild, mythogen: gpMythogen,
              healingPatterns: gpHealingPatterns, resonanceExpansion: gpResExp,
              nonManipInfluence: gpNonManip, beautyPersist: gpBeautyPersist,
              antiCynicism: gpAntiCyn, hope: gpHope, nsRepair: gpNsRepair,
              symbolGen: gpSymGen, mythDensity: gpMythDens, beautyRes: gpBeautyRes,
              woundReader: gpWound, hopeSeed: gpHopeSeed, cynicismVec: gpCynVec,
              presenceMeter: gpPresMeter, fieldRadius: gpRadius,
              meaningDensField: gpDensField, meaningHalfLife: gpHalfLife,
              trustGravStr: gpTGStr, trustGravRad: gpTGRad,
              symLang: gpSymLang, symCoh: gpSymCoh,
              mythArch: gpMythArch, mythTime: gpMythTime,
              healDispatch: gpHealDispatch, healMonitor: gpHealMon,
              resWave: gpResWave, resFieldCoh: gpResFCoh,
              infNoPersuade: gpInfNoP, invitationGov: gpInvGov,
              beautyDur: gpBeautyDur, beautySilence: gpBeautySil,
              cynicismImm: gpCynImm, antiNihilism: gpAntiNih,
              hopeCoh: gpHopeCoh, hopeNotDelusion: gpHopeNoDel,
              breath: gpBreath, nsFlow: gpNsFlow, notPerforming: gpNotPerf,
              genContagion: gpGenCont, genImpactAttr: gpGenIA,
              beautyContagion: gpBContag, gentleStrength: gpGentleStr,
              quietAuth: gpQuietAuth, coherentBroadcast: gpCohBcast,
              symArtifact: gpSymArt, spreadVel: gpSpreadVel, spreadFid: gpSpreadFid,
              worldExp: gpWorldExp, mythAlign: gpMythAlign,
              healRipple: gpHealRipple, woundRec: gpWoundRec,
              gentleTruth: gpGentleTruth, antiPressure: gpAntiPress,
              serviceMonitor: gpService, giftEngine: gpGift, giftLedger: gpGiftLed,
              genAcct: gpAcct, notPredating: gpNoPredate, notOptEng: gpNoOptEng,
              beautyOverSpec: gpBeautyOverSpec, depth: gpDepth, joy: gpJoy,
              resHarvest: gpResHarv, civicTrust: gpCivicTrust, symSov: gpSymSov,
              plural: gpPlural, cadence: gpCadence, antiColon: gpAntiCol,
              formatEng: gpFormat, quietMag: gpQuietMag, notOwning: gpNotOwn,
              gentleRec: gpGentleRec, antiOther: gpAntiOther, refuge: gpRefuge,
              anchor: gpAnchor, watchdog: gpWatchdog,
              flourishAcc: gpFlourAcc, beautyAsTruth: gpBeautyAsTruth,
              resting: gpResting, silenceGift: gpSilGift, impactAudit: gpImpactAud,
              health: gpHealth, cohMonitor: gpCohMon, hopeIntegrity: gpHopeInt,
              dignity: gpDignity, propCoh: gpPropCoh, coherence: gpPresCoh,
              governor: gpPresGov, boundary: gpBoundary, presenceCheck: gpPresCheck,
              flourishScore: gpFlourScore, integrityCoh: gpIntCoh,
              memory: gpMemory, resilience: gpResilience, kernel: gpKernel,
            },
          },
          attempts: attempt,
          rejectedAttempts,
        };

        // Persist emotional trace + main memory in parallel.
        const provisional: Banner = { ...partial, memorySnapshot: memory };
        const traceEntry = entryFromBanner(provisional, jobDecision.job, culturalMoment.id);
        partial.tasteSystem.campaignBrain.residue = traceEntry.residue;
        await humanMemoryStore.record(traceEntry);

        const memorySnapshot = await memoryStore.record(provisional);
        const banner: Banner = { ...partial, memorySnapshot };

        // ─── Phase 7 — update object-emotion store from the scene ─
        const detectedObjects = extractObjectsFromBrief(
          brief.scene,
          worldContinuity.artifacts.map((a) => a.description),
        );
        for (const objectId of detectedObjects) {
          await objectEmotionStore.record(objectId, emotionalCore?.id ?? null);
        }
        if (detectedObjects.length > 0) {
          emit({
            stage: 'object-emotion-memory',
            message: `${detectedObjects.length} objects updated: ${detectedObjects.slice(0, 4).join(', ')}`,
          });
        }

        // ─── Phase 15 — record into truth-persistence + cultural-
        // timeline stores so the next campaign run sees this banner.
        const engagementResidueAtShip = realityVerificationReading.confirmation_strength;
        const persistenceUpdated = await truthPersistenceStore.record(banner, engagementResidueAtShip);
        await culturalTimelineStore.record(banner);
        if (persistenceUpdated.count >= 2) {
          emit({
            stage: 'truth-persistence',
            message: `recorded — truth "${persistenceUpdated.display}" now at ×${persistenceUpdated.count}`,
          });
        }

        // ─── Phases 20–25 — record into the human desire memory ───
        // graph so the longing graph compounds across the campaign.
        if (desireArchitectureReading.primary) {
          await humanDesireStore.record({
            category: 'aspiration',
            key: desireArchitectureReading.primary.id,
            display: desireArchitectureReading.primary.the_reach,
            intensity: desireArchitectureReading.desire_gravity,
            sampleTruth: truth.truth,
          });
        }
        if (emotionalHungerReading.primary) {
          await humanDesireStore.record({
            category: 'emotional-hunger',
            key: emotionalHungerReading.primary.id,
            display: emotionalHungerReading.primary.the_deficit,
            intensity: emotionalHungerReading.hunger_intensity,
            sampleTruth: truth.truth,
          });
        }
        if (attachmentLoopsReading.primary) {
          await humanDesireStore.record({
            category: 'ritual-dependency',
            key: attachmentLoopsReading.primary.id,
            display: attachmentLoopsReading.primary.the_object_or_window,
            intensity: attachmentLoopsReading.attachment_strength,
            sampleTruth: truth.truth,
          });
        }
        if (invisibleEnvyReading.primary) {
          await humanDesireStore.record({
            category: 'invisible-envy',
            key: invisibleEnvyReading.primary.id,
            display: invisibleEnvyReading.primary.the_thing,
            intensity: invisibleEnvyReading.envy_specificity,
            sampleTruth: truth.truth,
          });
        }
        emit({
          stage: 'human-desire-memory',
          message: `longing graph updated — ${desireEntriesAtRunStart.length} prior entries · organism: ${adaptiveEmotionalIntelligenceReading.directive}`,
        });

        // ─── Phase 26 — persist the unified cognitive field so the
        // next run inherits the world the system has been building.
        await worldStateStore.saveWorldState(worldState);
        await worldStateStore.saveCausalGraph(causalGraph);
        await worldStateStore.recordCognitionTrace(cognitionTrace);
        await worldStateStore.recordFieldSnapshot({
          bannerId,
          ts: shippedAt,
          worldStateConfidence: cognitiveField.worldStateConfidence,
          field_coherence: cognitiveField.field_coherence,
          emergence_score: cognitiveField.emergence_score,
          campaignAtmosphere: cognitiveField.campaignAtmosphere,
        });
        emit({
          stage: 'world-state',
          message: `persisted — gen ${worldState.generationCount} · ${describeWorldState(worldState)}`,
        });

        emit({
          stage: 'human-memory',
          message: `residue: ${traceEntry.residue}`,
          data: { traceEntry },
        });
        // ─── Wave 5 — the council is held accountable: entities
        // whose stance aligned with the approval gain standing.
        const reputationUpdate = updateInternalReputation({
          book: councilReputationBook,
          opinions: councilSession.opinions,
          finalOutcomeWasProceed: true,
        });
        await councilReputationStore.save(reputationUpdate.book);
        emit({
          stage: 'cognitive-council',
          message: `internal reputation updated — ${reputationUpdate.rose.length} entities rose, ${reputationUpdate.fell.length} fell`,
        });

        // ─── Wave 6 — the civilization lives one more generation:
        // institutional memory, beliefs, myths, scars, laws, and the
        // decision archive all absorb this run, then persist.
        civilization.generation += 1;
        recordInstitutionalMemory(civilization, {
          verdict: strategicConsciousness.verdict,
          governingPriority: civGoverningPriority,
          consensusQuality: executiveConsensus.consensus_quality,
          debateTension: internalDebate.debate_tension,
          emergedFromTension: strategicConsciousness.emerged_from_genuine_tension,
        });
        recordCulturalTendency(civilization, civGoverningPriority);
        settleReputationEconomy(civilization, councilSession.opinions, true);
        archiveDecision(civilization, {
          verdict: strategicConsciousness.verdict,
          dominantTruth: cognitiveField.dominantTruths[0] ?? state.id,
          reason: strategicConsciousness.conscious_statement.slice(0, 140),
          optimizationWon: antiOptimizationReading.optimization_corrupts_truth,
        });
        if (civIdentityHeld) {
          reinforceBelief(civilization,
            `governance by "${civGoverningPriority}" produces a banner the campaign can trust`);
        } else {
          recordScar(civilization, `${state.family} optimization drift`, 6);
        }
        considerMyth(civilization, {
          verdict: strategicConsciousness.verdict,
          consciousness: strategicConsciousness.consciousness_score,
          emergedFromTension: strategicConsciousness.emerged_from_genuine_tension,
          statement: truth.truth.slice(0, 90),
        });
        healOldScars(civilization);
        considerLawFromHistory(civilization);
        decayUnheldBeliefs(civilization);
        await civilizationStore.save(civilization);
        emit({
          stage: 'civilization',
          message: `the civilization lived generation ${civilization.generation} — ${civilization.beliefs.length} belief(s), ${civilization.laws.length} law(s), ${civilization.myths.length} myth(s)`,
        });

        // ─── Wave 7 — the organism ACTED: a banner shipped. Action
        // depletes energy and accumulates stress; the immune system
        // records the threats it met. Then the organism persists so
        // the next run inherits a slightly more depleted body.
        if (orgImmune.threats_detected.length > 0) {
          recordImmuneEncounter(organism, orgImmune.threats_detected[0], !orgImmune.infection_risk);
        }
        const evolvedOrganism = evolveOrganismFromAction(organism, {
          energyCost: orgEnergy.energy_budget * 0.3,
          stressAdded: orgEnvironmental.environmental_load * 0.15 + (orgImmune.infection_risk ? 1 : 0),
          complexityAdded: orgComplexity.complexity_load * 0.2,
          adapted: orgAdaptiveRuntime.adaptation_quality >= 6 && !orgAdaptiveRuntime.reacting_not_adapting,
        });
        await organismStore.save(evolvedOrganism);
        emit({
          stage: 'organism',
          message: `the organism acted and lived — age ${evolvedOrganism.age} · energy ${evolvedOrganism.energyReserves}/10 · stress ${evolvedOrganism.stressAccumulation}/10 · ${evolvedOrganism.adaptationCount} adaptations across its life`,
        });

        // ─── Wave 8 — the kernel ran one coordinated tick: the OS
        // advances its persistent runtime state so the next run boots
        // from the posture, season, and directive log this tick left.
        const evolvedOS = evolveOSFromTick(osState, {
          coordination: osCore.coordination_score,
          directive: osDirective.directive,
          posture: osCore.os_state,
          season: osSeason.season,
          interrupts: osInterrupts.interrupts.length,
          fragmented: osCore.runtime_is_fragmenting,
        });
        await osStore.save(evolvedOS);
        emit({
          stage: 'operating-system',
          message: `kernel tick ${evolvedOS.uptime} committed — posture "${evolvedOS.operationalPosture}", season "${evolvedOS.currentSeason}" (age ${evolvedOS.seasonAge}), coordination EMA ${evolvedOS.coordinationEMA}/10`,
        });

        // ─── Wave 10 — the coupling cycle resolves: the organism
        // shipped. A run that chased stimulus pays for it in
        // authenticity; a run that resonated compounds trust.
        const evolvedCoupling = cplResonance.is_stimulus_addiction
          ? evolveCouplingFromStimulus(couplingState)
          : evolveCouplingFromResonance(couplingState);
        await couplingStore.save(evolvedCoupling);
        emit({
          stage: 'reality-coupling',
          message: cplResonance.is_stimulus_addiction
            ? `the run chased stimulus — authenticity ${couplingState.authenticityReserve}/10 → ${evolvedCoupling.authenticityReserve}/10, trust ${couplingState.trustLevel} → ${evolvedCoupling.trustLevel}`
            : `the run resonated — trust ${couplingState.trustLevel}/10 → ${evolvedCoupling.trustLevel}/10 across ${evolvedCoupling.couplingCycles} cycles`,
        });

        // ─── Wave 11 — the planning cycle resolves: did the run
        // compound toward a future, or spend the future for now?
        const evolvedFuture = futCore.organism_optimizes_for_now
          ? evolveFutureFromNowOptimization(strategicFutureState)
          : evolveFutureFromCompounding(strategicFutureState);
        await strategicFutureStore.save(evolvedFuture);
        emit({
          stage: 'strategic-future',
          message: futCore.organism_optimizes_for_now
            ? `the run optimized for now — strategic debt ${strategicFutureState.strategicDebt}/10 → ${evolvedFuture.strategicDebt}/10`
            : `the run compounded toward "${evolvedFuture.futureBeingCompounded}" — advantage ${strategicFutureState.compoundingAdvantage}/10 → ${evolvedFuture.compoundingAdvantage}/10`,
        });

        // ─── Wave 12 — the action layer resolves: was this a
        // governed action, or did compulsion slip through the gates?
        const evolvedExecution = actCore.compulsive_automation
          ? evolveExecutionFromCompulsion(executionState)
          : evolveExecutionFromAuthorizedAction(executionState);
        await executionStore.save(evolvedExecution);
        emit({
          stage: 'autonomous-action',
          message: actCore.compulsive_automation
            ? `the run was COMPULSIVE — restraint ${executionState.restraintBudget}/10 → ${evolvedExecution.restraintBudget}/10, compulsion logged`
            : `the action was governed — restraint ${executionState.restraintBudget}/10 → ${evolvedExecution.restraintBudget}/10, ${evolvedExecution.actionsAuthorized} actions on record`,
        });

        // ─── Wave 13 — feedback closes the loop. Reception either
        // cohered with intent (trust accrues) or contradicted it (a
        // contradiction is logged, trust slips).
        const evolvedFeedback = fbContradictions.any_serious_contradiction
          ? evolveFeedbackFromContradictoryReception(feedbackState)
          : evolveFeedbackFromCoherentReception(feedbackState);
        await feedbackStore.save(evolvedFeedback);
        emit({
          stage: 'reality-feedback',
          message: fbContradictions.any_serious_contradiction
            ? `feedback contradicted intent — trust net gain ${feedbackState.trustNetGain} → ${evolvedFeedback.trustNetGain}, contradictions ${evolvedFeedback.contradictionsFound}`
            : `feedback cohered with intent — trust net gain ${feedbackState.trustNetGain} → ${evolvedFeedback.trustNetGain}, resonance AUC ${feedbackState.resonanceCurveAUC} → ${evolvedFeedback.resonanceCurveAUC}`,
        });

        // ─── Wave 14 — the live coupling resolves. The run either
        // generated meaning (coupling deepens) or chased novelty
        // (coupling thins).
        const evolvedLiveCoupling = lcMeaningVsNov.is_meaning && lcImpact.reality_demonstrably_changed
          ? evolveLiveCouplingFromMeaning(liveCouplingState)
          : evolveLiveCouplingFromNovelty(liveCouplingState);
        await liveCouplingStore.save(evolvedLiveCoupling);
        emit({
          stage: 'live-coupling',
          message: lcMeaningVsNov.is_meaning && lcImpact.reality_demonstrably_changed
            ? `the run generated meaning — coupling depth ${liveCouplingState.realityCouplingDepth}/10 → ${evolvedLiveCoupling.realityCouplingDepth}/10, presence ${liveCouplingState.presenceScore} → ${evolvedLiveCoupling.presenceScore}`
            : `the run chased novelty over meaning — coupling depth ${liveCouplingState.realityCouplingDepth}/10 → ${evolvedLiveCoupling.realityCouplingDepth}/10`,
        });

        // ─── Wave 15 — the identity resolves: truth chosen (sovereignty
        // deepens) or popularity chosen (capture is logged).
        const evolvedIdentity = idTruthOverPop.chose_truth && !idKernel.has_been_captured
          ? evolveIdentityFromTruth(sovereignIdentityState)
          : evolveIdentityFromPopularityCapture(sovereignIdentityState);
        await sovereignIdentityStore.save(evolvedIdentity);
        emit({
          stage: 'sovereign-identity',
          message: idTruthOverPop.chose_truth && !idKernel.has_been_captured
            ? `truth chosen over popularity — sovereignty ${sovereignIdentityState.sovereigntyScore}/10 → ${evolvedIdentity.sovereigntyScore}/10`
            : `popularity captured this cycle — corruption logged, sovereignty ${sovereignIdentityState.sovereigntyScore}/10 → ${evolvedIdentity.sovereigntyScore}/10`,
        });

        // ─── Wave 16 — generative presence resolves. Did the brand
        // create beauty/meaning, or did it force reality?
        const evolvedGenerative = gpKernel.damaged_reality_by_forcing
          ? evolveGenerativeFromForce(generativePresenceState)
          : evolveGenerativeFromBeauty(generativePresenceState);
        await generativePresenceStore.save(evolvedGenerative);
        emit({
          stage: 'generative-presence',
          message: gpKernel.damaged_reality_by_forcing
            ? `the run forced reality — coherence ${generativePresenceState.civilizationCoherenceScore}/10 → ${evolvedGenerative.civilizationCoherenceScore}/10`
            : `the run created beauty — coherence ${generativePresenceState.civilizationCoherenceScore}/10 → ${evolvedGenerative.civilizationCoherenceScore}/10, ${evolvedGenerative.beautyMomentsCreated} moment(s) on record`,
        });

        emit({ stage: 'pipeline', message: 'banner approved', data: { attempt, imageAttempts, totals: finalVerdict.totals } });
        return { banner, events };
      }

      // Rejection routing.
      if (finalVerdict.verdict === 'reject-image' && imageAttempts < 2) {
        rejectedAttempts.push({ stage: 'image', reason: finalVerdict.reasons.join('; ') });
        emit({ stage: 'rejection', message: 'regenerating image', data: { reasons: finalVerdict.reasons } });
        continue; // inner loop
      }

      rejectedAttempts.push({
        stage: finalVerdict.verdict === 'reject-image' ? 'image-exhausted' : finalVerdict.verdict,
        reason: finalVerdict.reasons.join('; '),
      });
      emit({ stage: 'rejection', message: `regenerating concept (${finalVerdict.verdict})`, data: { reasons: finalVerdict.reasons } });
      // Phase 26 — a rejection is also an observation; the world-state
      // absorbs it and the next run inherits the slightly raised bar.
      worldState = evolveWorldStateFromRejection(worldState);
      await worldStateStore.saveWorldState(worldState);
      // Phase 27 — capture the snapshot so an exhausted run still
      // commits a rejection into the living runtime.
      lastRejectionSnapshot = {
        stateFamily: state.family,
        dominantTruth: cognitiveField.dominantTruths[0] ?? state.id,
        verdict: finalVerdict.verdict,
        reasons: finalVerdict.reasons,
        field: cognitiveField,
        continuity: cognitiveContinuity,
        worldStateGen: worldState.generationCount,
        os: {
          coordination: osCore.coordination_score,
          directive: osDirective.directive,
          posture: osCore.os_state,
          season: osSeason.season,
          interrupts: osInterrupts.interrupts.length,
          fragmented: osCore.runtime_is_fragmenting,
        },
      };
      stateSeed += 7919;
      forceStateId = undefined;
      memory = await memoryStore.read();
      break; // exit inner loop, next outer attempt
    }
  }

  // ─── Phase 27 — the run exhausted: commit a rejection so the
  // runtime learns from the refusal and the next run inherits it.
  if (lastRejectionSnapshot) {
    const rejectionRecord = buildRejectionRecord({
      generationIndex: runtimeContext.generationIndex,
      rejectedConcept: `${lastRejectionSnapshot.stateFamily}: ${lastRejectionSnapshot.dominantTruth}`,
      verdict: lastRejectionSnapshot.verdict,
      reasons: lastRejectionSnapshot.reasons,
    });
    const rejectionHistoryEntry: RuntimeHistoryEntry = {
      generationIndex: runtimeContext.generationIndex,
      ts: Date.now(),
      verdict: lastRejectionSnapshot.verdict,
      dominantTruth: lastRejectionSnapshot.dominantTruth,
      emotionalTerritory: lastRejectionSnapshot.stateFamily,
      symbolicObjects: lastRejectionSnapshot.field.symbolicObjects,
      worldStateGen: lastRejectionSnapshot.worldStateGen,
      emergence: lastRejectionSnapshot.field.emergence_score,
      fieldCoherence: lastRejectionSnapshot.field.field_coherence,
      continuityScore: lastRejectionSnapshot.continuity.continuity_score,
      silenceLevel: 5,
    };
    const rejectionTrace = buildRuntimeTrace({
      generationIndex: runtimeContext.generationIndex,
      priorState: runtimeContext.priorState,
      field: lastRejectionSnapshot.field,
      worldModelEvolution: emptyEvolution,
      drift: runtimeDrift,
      continuity: lastRejectionSnapshot.continuity,
      nextRunDirective: runtimeContext.nextRunDirective,
      verdict: lastRejectionSnapshot.verdict,
      worldStateDescription: describeWorldState(worldState),
    });
    await commitRejectedRun(runtimeStore, {
      context: runtimeContext,
      rejectionRecord,
      historyEntry: rejectionHistoryEntry,
      trace: rejectionTrace,
    });
    emit({
      stage: 'runtime',
      message: `run exhausted — rejection committed to the runtime; the next run inherits this refusal (${rejectionRecord.rejectionCategory})`,
    });
  }

  // ─── Wave 7 — the run produced no banner: the organism RESTED.
  // It chose not to act. Rest restores energy and sheds stress — a
  // healthy organism rests, and the next run inherits the recovery.
  const restedOrganism = evolveOrganismFromRest(organism);
  await organismStore.save(restedOrganism);
  emit({
    stage: 'organism',
    message: `the run shipped nothing — the organism rested · energy ${organism.energyReserves}/10 → ${restedOrganism.energyReserves}/10 · stress ${organism.stressAccumulation}/10 → ${restedOrganism.stressAccumulation}/10`,
  });

  // ─── Wave 8 — the kernel still ticked, in a withholding posture.
  // The OS commits the tick so uptime, season, and the directive log
  // stay continuous even when the run produced no banner.
  const osRestTick = lastRejectionSnapshot
    ? lastRejectionSnapshot.os
    : {
        coordination: osState.coordinationEMA,
        directive: 'pause',
        posture: osState.operationalPosture,
        season: osState.currentSeason,
        interrupts: 0,
        fragmented: false,
      };
  const evolvedOSRest = evolveOSFromTick(osState, {
    coordination: osRestTick.coordination,
    directive: osRestTick.directive,
    posture: osRestTick.posture,
    season: osRestTick.season,
    interrupts: osRestTick.interrupts,
    fragmented: osRestTick.fragmented,
  });
  await osStore.save(evolvedOSRest);
  emit({
    stage: 'operating-system',
    message: `kernel tick ${evolvedOSRest.uptime} committed (no output) — posture "${evolvedOSRest.operationalPosture}", season "${evolvedOSRest.currentSeason}"`,
  });

  // ─── Wave 10 — the run shipped nothing: the organism honored
  // silence. It added nothing to the feed — the audience recovers
  // and quiet trust holds.
  const restedCoupling = evolveCouplingFromSilence(couplingState);
  await couplingStore.save(restedCoupling);
  emit({
    stage: 'reality-coupling',
    message: `the organism added nothing to the feed — saturation ${couplingState.saturationMemory}/10 → ${restedCoupling.saturationMemory}/10, silence honored ${restedCoupling.silenceHonored}×`,
  });

  // ─── Wave 11 — the run shipped nothing: strategic patience. The
  // future was protected rather than spent; strategic debt eases.
  const patientFuture = evolveFutureFromPatience(strategicFutureState);
  await strategicFutureStore.save(patientFuture);
  emit({
    stage: 'strategic-future',
    message: `the organism held in strategic patience — debt ${strategicFutureState.strategicDebt}/10 → ${patientFuture.strategicDebt}/10, patience honored ${patientFuture.patienceHonored}×`,
  });

  // ─── Wave 12 — the run withheld action: a deliberate restraint
  // that replenishes the restraint budget and pays down recovery debt.
  const withheldExecution = evolveExecutionFromWithholding(executionState);
  await executionStore.save(withheldExecution);
  emit({
    stage: 'autonomous-action',
    message: `the organism withheld action — restraint ${executionState.restraintBudget}/10 → ${withheldExecution.restraintBudget}/10, ${withheldExecution.actionsWithheld} withholdings on record`,
  });

  // ─── Wave 13 — silence becomes its own feedback signal: meaning
  // has time to settle, slow truths surface.
  const silentFeedback = evolveFeedbackFromSilence(feedbackState);
  await feedbackStore.save(silentFeedback);
  emit({
    stage: 'reality-feedback',
    message: `silence is its own feedback — meaning persistence ${feedbackState.meaningPersistenceScore}/10 → ${silentFeedback.meaningPersistenceScore}/10, slow truths ${silentFeedback.slowTruthsDetected}`,
  });

  // ─── Wave 14 — strategic silence holds presence in live coupling.
  const silentLiveCoupling = evolveLiveCouplingFromStrategicSilence(liveCouplingState);
  await liveCouplingStore.save(silentLiveCoupling);
  emit({
    stage: 'live-coupling',
    message: `strategic silence — live presence ${liveCouplingState.presenceScore}/10 → ${silentLiveCoupling.presenceScore}/10, ${silentLiveCoupling.silencesObserved} silence(s) held`,
  });

  // ─── Wave 15 — withholding action rests identity — no corruption
  // can enter through a closed mouth.
  const restedIdentity = evolveIdentityFromRestraint(sovereignIdentityState);
  await sovereignIdentityStore.save(restedIdentity);
  emit({
    stage: 'sovereign-identity',
    message: `identity rested through restraint — sovereignty ${sovereignIdentityState.sovereigntyScore}/10 → ${restedIdentity.sovereigntyScore}/10`,
  });

  // ─── Wave 16 — silence keeps generative presence intact without
  // spending it. Presence accumulates quietly.
  const quietGenerative = evolveGenerativeFromQuiet(generativePresenceState);
  await generativePresenceStore.save(quietGenerative);
  emit({
    stage: 'generative-presence',
    message: `generative presence rested in silence — coherence ${generativePresenceState.civilizationCoherenceScore}/10 → ${quietGenerative.civilizationCoherenceScore}/10`,
  });

  // ─── Wave 17 — runtime continuity: this restraint is now a fact.
  // Read the canonical Silence Engine against the just-evolved state
  // and record what was protected. The organism remembers its own
  // refusals.
  const protectionStore = createProtectionMemoryStore();
  const priorProtectionMemory = await protectionStore.read();
  const silenceAtExhaustion = readSilenceEngine({
    coupling: restedCoupling,
    strategicFuture: patientFuture,
    execution: withheldExecution,
    feedback: silentFeedback,
    liveCoupling: silentLiveCoupling,
    generativePresence: quietGenerative,
    worldState: executiveWorldState,
  });
  // Always log an exhausted run — the act of withholding IS the
  // protection, even if individual silence signals are mild. We
  // synthesize a directive when the reading came back "speak" but
  // the run still produced no banner.
  const guaranteed: SilenceEngineReading = silenceAtExhaustion.silence_is_the_move
    ? silenceAtExhaustion
    : {
        ...silenceAtExhaustion,
        directive: 'hold',
        silence_is_the_move: true,
        statement: 'Hold — the organism reached its attempt limit without shipping; the choice not to act stands',
        contributing_reasons: silenceAtExhaustion.contributing_reasons.length
          ? silenceAtExhaustion.contributing_reasons
          : ['no-reason-to-speak'],
      };
  const evolvedProtectionMemory = recordProtectionEvent(priorProtectionMemory, guaranteed, 'exhausted-run');
  await protectionStore.save(evolvedProtectionMemory);
  emit({
    stage: 'protection-memory',
    message: `restraint recorded — ${evolvedProtectionMemory.totalEvents} protection(s) on the organism's record · ${guaranteed.directive}`,
  });

  throw new ExhaustedAttempts(
    maxAttempts,
    rejectedAttempts.slice(-3).map((r) => `${r.stage}: ${r.reason}`),
  );
}

/**
 * Neutral DNA — used when the atmosphere analyser needs to score voice
 * + job mix across banners whose DNA was not persisted (older runs).
 * Every axis at 0.5 contributes nothing to spread, so older banners
 * effectively count only toward voice and job-mix consistency.
 */
const NEUTRAL_DNA: import('@lib/referenceDNA').ReferenceDNA = {
  silence_ratio: 0.5,
  tension_map: 0.5,
  framing_behavior: 0.5,
  typography_confidence: 0.5,
  negative_space_usage: 0.5,
  emotional_density: 0.5,
  product_aggression_level: 0.5,
  interruption_style: 0.5,
  realism_type: 0.5,
  visual_temperature: 0.5,
  camera_energy: 0.5,
  editorial_level: 0.5,
  fashion_influence: 0.5,
  documentary_weight: 0.5,
  luxury_restraint: 0.5,
  anti_commercial_feel: 0.5,
};

/**
 * Build a partial DNA from the emotional trace's stored facts. The
 * trail persists 3 axes (silence_ratio, documentary_weight,
 * realism_type) directly; the rest are filled with neutral midpoints,
 * which means atmosphere spread reads honestly on the 3 stored axes
 * and ignores the others.
 */
function dnaFromFacts(facts: { silence_ratio: number; documentary_weight: number; realism_type: number } | undefined) {
  if (!facts) return NEUTRAL_DNA;
  return {
    ...NEUTRAL_DNA,
    silence_ratio: facts.silence_ratio,
    documentary_weight: facts.documentary_weight,
    realism_type: facts.realism_type,
  };
}

/** Phase 9 helper: derive a per-banner light behaviour from a trail
 *  entry's family + closing reaction. Mirrors atmosphericLight's family
 *  fallback so the worldPersistence reading stays honest across runs. */
function inferLightBehaviorFromTrail(t: import('@lib/humanMemory').EmotionalTraceEntry): string {
  switch (t.family) {
    case 'fatigue':
    case 'collapse':       return 'sunset-emotional-pause';
    case 'overstimulation':return 'fluorescent-depletion';
    case 'numbness':
    case 'paralysis':      return 'overcast-flattening';
    case 'pressure':       return 'late-office-warmth';
    case 'fragmentation':  return 'monitor-cool-only';
    case 'avoidance':      return 'cold-morning-detachment';
    default:               return 'window-soft-warm';
  }
}

/** Phase 9 helper: map closing reaction + family → an emotional note
 *  for the current candidate banner. Mirrors campaignTimeline's
 *  noteForEntry so the sequence engine and the timeline agree. */
function inferCandidateNote(
  at_3s: import('@lib/humanReaction').Reaction,
  family: string,
): import('@lib/campaignTimeline').EmotionalNote {
  if (at_3s === 'rejection') return 'denial';
  if (at_3s === 'indifference') return 'numbness';
  if (at_3s === 'confusion') return 'disorientation';
  if (at_3s === 'discomfort') return 'micro-collapse';
  if (at_3s === 'intimacy' && (family === 'fatigue' || family === 'collapse')) return 'aftermath';
  if (at_3s === 'intimacy') return 'recovery';
  if (at_3s === 'validation') return 'quiet-control';
  if (at_3s === 'recognition' && family === 'numbness') return 'detachment';
  if (at_3s === 'recognition' && (family === 'fatigue' || family === 'collapse')) return 'ritual';
  if (at_3s === 'recognition') return 'quiet-control';
  if (at_3s === 'emotional tension' && family === 'pressure') return 'micro-collapse';
  if (at_3s === 'emotional tension') return 'ritual';
  if (at_3s === 'aspiration') return 'recovery';
  if (at_3s === 'curiosity') return 'disorientation';
  if (at_3s === 'interruption') return 'disorientation';
  return 'ritual';
}

/** Phase 9: cultural micro-moment id → apartment kind (mirror of the
 *  map in worldPersistence so scene-continuity stays consistent). */
const APARTMENT_KIND_MAP: Record<string, string> = {
  'fridge-open-at-night': 'apartment-kitchen-night',
  'bed-scrolling': 'apartment-bedroom-night',
  'saturday-stillness': 'apartment-living-room-day',
  'late-kitchen-silence': 'apartment-kitchen-night',
  'no-energy-for-people': 'apartment-entry',
  'reserves-fatigue': 'apartment-kitchen-morning',
  'parenting-overload': 'apartment-living-room-day',
  'overstimulated-tabs': 'office-or-desk',
  'office-fluorescent': 'office-floor',
  'office-1647-brain-death': 'office-floor',
  'startup-late-night': 'office-floor-night',
  'train-ride-silence': 'transit-train',
  'car-after-work': 'transit-car',
  'post-meeting-emptiness': 'office-corridor',
  'zoning-out': 'video-call-desk',
  'staring-without-processing': 'desk',
  'unread-whatsapp': 'apartment-table',
  'avoiding-messages': 'apartment-surface',
  'eating-without-hunger': 'apartment-kitchen-counter',
  'coffee-machine-emptiness': 'office-kitchenette',
};
