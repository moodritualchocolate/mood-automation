/**
 * "NOT GOOD ENOUGH" META-CRITIC (Phase 2)
 *
 * The most important upgrade.
 *
 * Synthesizes the scroll-stop critic, the taste critic, the visual
 * psychology engine, the product presence engine, and the reference
 * intelligence engine into ONE verdict the pipeline acts on.
 *
 * Brutality is configurable: a higher brutality threshold demands more
 * from every signal. Default brutality 0.7 means: every signal must
 * clear a meaningful floor — no signal carries the banner alone.
 *
 * The meta-critic does NOT vote. It enforces. If the taste critic
 * rejected, the meta-critic rejects, period. If the reference closeness
 * is below the floor, the meta-critic rejects, period. The point is to
 * stop accepting "technically correct."
 */

import type {
  AestheticCritique,
  CreativeDirection,
  Critique,
  EngineContext,
  FinalVerdict,
  MemorySnapshot,
  ProductPresence,
  ReferenceMatch,
  VisualPsychology,
} from '@/core/types';
import type { FatigueReport } from '@lib/visualFatigue';
import type { ReactionCurve } from '@lib/humanReaction';
import type { TasteVerdict } from '@lib/tasteJudge';
import type { AntiAIReport } from '@lib/antiAI';
import type { JobDecision } from '@lib/campaignDecision';
import type { RhythmAxis } from '@lib/campaignRhythm';
import type { AftertasteRecord } from '@lib/aftertaste';
import type { AtmosphereReport } from '@lib/atmosphereConsistency';
import type { DriftReport } from '@lib/tasteDrift';
import type { VisualTasteVerdict } from '@lib/visualTaste';
import type { EmotionalAftertaste } from '@lib/emotionalAftertaste';
import type { CampaignMemoryV2Report } from '@lib/campaignMemoryV2';
import type { PerceptionVerdict } from '@lib/perceptionCritic';
import type { CampaignIdentity } from '@lib/campaignIdentity';
// Phase 8 — visual composition intelligence
import type { GravityReading } from '@lib/visualGravity';
import type { NegativeSpaceReading } from '@lib/negativeSpacePsychology';
import type { CompositionRhythmReport } from '@lib/compositionRhythm';
import type { PresenceDecision } from '@lib/productPresence';
import type { FramingPlan } from '@lib/humanFraming';
import type { LayoutDirectorVerdict } from '@lib/index';
// Phase 9 — temporal campaign cinema
import type { SequenceVerdict } from '@lib/emotionalSequence';
import type { AbsenceDecision } from '@lib/absenceIntelligence';
import type { ContradictionReading } from '@lib/emotionalContradiction';
import type { ObjectMemoryGraph } from '@lib/objectMemoryGraph';
import type { RhythmAxis as TempoAxisName } from '@lib/campaignRhythm';
// Phase 10 — unified cinematic brain
import type { CompressionReading } from '@lib/emotionalCompression';
import type { SyntheticReading } from '@lib/antiSyntheticBehavior';
import type { CinematicVerdict } from '@lib/cinematicBrain';
// Phase 11 — natural human chaos
import type { HumanContradictionReading } from '@lib/humanContradiction';
import type { PerformativeReading } from '@lib/nonPerformativeReality';
import type { LifeNoisePlan } from '@lib/lifeNoise';
// Phase 12 — cultural memory engine
import type { CulturalPattern } from '@lib/sharedCulturalMemory';
import type { CollectiveRecognitionReading } from '@lib/collectiveRecognition';
import type { RitualSelection } from '@lib/unspokenRituals';
import type { DriftReading as CulturalDriftReading } from '@lib/culturalDrift';
// Phase 13 — reality pressure
import type { RealityPressureReading } from '@lib/realityPressure';
import type { ConsequenceReading } from '@lib/consequenceEngine';
import type { StakesReading } from '@lib/invisibleStakes';
import type { FunctionalCollapseReading } from '@lib/functionalCollapse';
// Phase 14 — suppressed humanity
import type { AvoidanceReading } from '@lib/emotionalAvoidance';
import type { NumbingReading } from '@lib/modernNumbing';
import type { SocialMaskingReading } from '@lib/socialMasking';
import type { UnfeltReading } from '@lib/unfeltEmotion';
// Phase 15 — longitudinal reality memory
import type { TruthPersistenceReport } from '@lib/truthPersistence';
import type { RealityVerificationReading } from '@lib/realityVerification';
import type { DecayReading } from '@lib/emotionalDecay';
import type { GenerationPressureReading } from '@lib/generationPressure';
// Phase 16 — reality ingestion layer
import type { PrivateLanguageReading } from '@lib/privateLanguageMap';
import type { WeightingReading } from '@lib/realityWeighting';
// Phase 17 — systemic human pressure model
import type { SystemicCauseReading } from '@lib/systemicPressureMap';
import type { FragmentationReading } from '@lib/attentionFragmentation';
import type { EnvironmentalSystemReading } from '@lib/modernEnvironmentSystems';
import type { RecoveryFailureReading } from '@lib/recoveryFailure';
import type { CognitiveResidueReading } from '@lib/cognitiveResidue';
// Phase 18 — behavioral survival engine
import type { BehaviorLoopReading } from '@lib/behaviorLoopEngine';
import type { MicroEscapeReading } from '@lib/microEscapeDetection';
import type { CompensationRitualReading } from '@lib/ritualCompensation';
import type { FakeRecoveryReading } from '@lib/fakeRecovery';
import type { SilentCopingReading } from '@lib/silentCopingMechanisms';
import type { BehavioralResidueReading } from '@lib/behavioralResidue';
// Phase 19 — social masking + identity performance engine
import type { SocialMaskingEngineReading } from '@lib/socialMaskingEngine';
import type { HighFunctioningBurnoutReading } from '@lib/highFunctioningBurnout';
import type { IdentityMaintenanceReading } from '@lib/identityMaintenance';
import type { EmotionalCamouflageReading } from '@lib/emotionalCamouflage';
import type { PublicPrivateSplitReading } from '@lib/publicPrivateSplit';
import type { MaskFatigueReading } from '@lib/maskFatigue';
// Phase 20 — desire systems
import type { DesireArchitectureReading } from '@lib/desireArchitecture';
import type { QuietStatusReading } from '@lib/statusWithoutStatus';
import type { EmotionalHungerReading } from '@lib/emotionalHunger';
import type { ValidationSystemsReading } from '@lib/validationSystems';
import type { InvisibleEnvyReading } from '@lib/invisibleEnvy';
import type { AspirationalIdentityGapReading } from '@lib/aspirationalIdentityGap';
// Phase 21 — social gravity
import type { SocialGravityReading } from '@lib/socialGravity';
import type { CollectiveEmotionalMovementReading } from '@lib/collectiveEmotionalMovement';
import type { CulturalAccelerationReading } from '@lib/culturalAcceleration';
import type { GroupAnxietyReading } from '@lib/groupAnxiety';
import type { ViralEmotionPatternsReading } from '@lib/viralEmotionPatterns';
import type { SocialPermissionReading } from '@lib/socialPermissionStructures';
// Phase 22 — ritual attachment
import type { RitualFormationReading } from '@lib/ritualFormation';
import type { AttachmentLoopsReading } from '@lib/attachmentLoops';
import type { SymbolicSafetyReading } from '@lib/symbolicSafety';
import type { EmotionalReturnReading } from '@lib/emotionalReturnMechanics';
import type { PrivateRitualMemoryReading } from '@lib/privateRitualMemory';
import type { RepeatedComfortSystemsReading } from '@lib/repeatedComfortSystems';
// Phase 23 — narrative self
import type { InternalNarrativeReading } from '@lib/internalNarrative';
import type { SelfStoryArchitectureReading } from '@lib/selfStoryArchitecture';
import type { IdentityContinuityReading } from '@lib/identityContinuity';
import type { PrivateMeaningSystemsReading } from '@lib/privateMeaningSystems';
import type { EmotionalSelfTranslationReading } from '@lib/emotionalSelfTranslation';
import type { PersonalMythologyReading } from '@lib/personalMythology';
// Phase 24 — predictive human states
import type { EmotionalForecastReading } from '@lib/emotionalForecasting';
import type { BehaviorPredictionReading } from '@lib/behaviorPrediction';
import type { CollapseProbabilityReading } from '@lib/collapseProbability';
import type { RecoveryAttemptReading } from '@lib/recoveryAttemptModel';
import type { FuturePressureTrajectoryReading } from '@lib/futurePressureTrajectory';
import type { EmotionalDriftPredictionReading } from '@lib/emotionalDriftPrediction';
// Phase 25 — autonomous campaign intelligence
import type { AutonomousNarrativeReading } from '@lib/autonomousNarrativeEngine';
import type { CulturalSignalEvolutionReading } from '@lib/culturalSignalEvolution';
import type { SelfUpdatingPsychologyReading } from '@lib/selfUpdatingPsychology';
import type { EmergentCampaignMemoryReading } from '@lib/emergentCampaignMemory';
import type { CollectiveRealityTrackingReading } from '@lib/collectiveRealityTracking';
import type { AdaptiveEmotionalIntelligenceReading } from '@lib/adaptiveEmotionalIntelligence';
// Phases 20–25 — unified human cognition graph
import type { UnifiedHumanGraphReading } from '@lib/unifiedHumanGraph';
// Phase 26 — unified cognitive field (the nervous system)
import type { CognitiveFieldState } from '@lib/cognitiveField';
import type { EmotionalPhysicsReading } from '@lib/emotionalPhysics';
import type { TensionTopologyReading } from '@lib/tensionTopology';
import type { ContradictionResolverReading } from '@lib/cognitiveContradictionResolver';
// Phase 27 — persistent cognitive runtime (the living runtime layer)
import type { CognitiveContinuityReading } from '@lib/cognitiveContinuityScore';
import type { RuntimeDriftReport } from '@lib/runtimeDriftDetector';
import type { NextRunDirective } from '@lib/nextRunDirective';
// Wave 2 — reality execution architecture (Phases 28–35)
import type { CampaignNervousSystemReading } from '@lib/campaignNervousSystem';
import type { AttentionPhysicsReading } from '@lib/attentionPhysics';
import type { VisualCognitionReading } from '@lib/visualCognition';
import type { EmotionalContinuityRuntimeReading } from '@lib/emotionalContinuityRuntime';
import type { AudienceRealityFeedbackReading } from '@lib/audienceRealityFeedback';
import type { AntiOptimizationReading } from '@lib/antiOptimization';
import type { IdentityPersistenceReading } from '@lib/identityPersistence';
import type { AutonomousCreativeDirectionReading } from '@lib/autonomousCreativeDirection';
import type { RealityExecutionState } from '@lib/realityExecutionOrchestrator';
// Wave 4 — executive cognition layer (Phases 36–42)
import type { StrategicPriorityReading } from '@lib/strategicPriorityEngine';
import type { CognitiveEnergyReading } from '@lib/cognitiveEnergyModel';
import type { TemporalPsychologyReading } from '@lib/temporalPsychology';
import type { IdentityGovernanceReading } from '@lib/identityGovernance';
import type { CampaignLifecycleReading } from '@lib/campaignLifecycle';
import type { ExecutiveWorldState, WorldUnderstandingReading } from '@lib/worldStateEngine';
import type { ExecutiveDecision } from '@lib/executiveRuntime';
// Wave 5 — autonomous strategic society (Phases 43–55)
import type { CouncilSession } from '@lib/cognitiveCouncil';
import type { InternalDebateReading } from '@lib/internalDebateEngine';
import type { CouncilConflictReading } from '@lib/councilConflictResolution';
import type { ExecutiveConsensusReading } from '@lib/executiveConsensusRuntime';
import type { StrategicConsciousnessReading } from '@lib/autonomousStrategicConsciousness';
// Wave 6 — cognitive civilization infrastructure (Phases 56–70)
import type { CognitiveLawReading } from '@lib/cognitiveLawSystem';
import type { ScarMemoryReading } from '@lib/psychologicalScarMemory';
import type { ExecutiveEthicsReading } from '@lib/executiveEthicsRuntime';
import type { CivilizationStabilityReading } from '@lib/civilizationStabilityLayer';
import type { IdeologicalMutationReading } from '@lib/ideologicalMutationDetection';
import type { EmergentIdentityContinuityReading } from '@lib/emergentIdentityContinuity';
// Wave 7 — reality organism architecture (Phases 71–90)
import type { EnvironmentalPressureReading } from '@lib/environmentalPressureMapping';
import type { ImmuneResponseReading } from '@lib/cognitiveImmuneSystem';
import type { StrategicEnergyReading } from '@lib/strategicEnergyAllocation';
import type { NarrativeClimateReading } from '@lib/narrativeClimateDetection';
import type { IdentityStressReading } from '@lib/identityStressTesting';
import type { ExpansionPreservationReading } from '@lib/expansionVsPreservation';
import type { RealityRhythmReading } from '@lib/realityRhythmSynchronization';
import type { CollectiveAttentionForecastReading } from '@lib/collectiveAttentionForecasting';
import type { MemeticThreatReading } from '@lib/memeticThreatDetection';
import type { CivilizationFatigueReading } from '@lib/civilizationFatigueMonitoring';
import type { StrategicSilenceReading } from '@lib/strategicSilenceIntelligence';
import type { EmotionalResourceReading } from '@lib/emotionalResourceManagement';
import type { AdaptiveWorldStateReading } from '@lib/adaptiveWorldStateModeling';
import type { ComplexityRegulationReading } from '@lib/internalComplexityRegulation';
import type { StrategicEvolutionReading } from '@lib/strategicEvolutionGovernance';
import type { RealityAdaptiveRuntimeReading } from '@lib/realityAdaptiveRuntime';
import type { StabilityPreservationReading } from '@lib/autonomousStabilityPreservation';
import type { ExistentialRiskReading } from '@lib/existentialRiskLayer';
import type { OrganismCoreReading } from '@lib/persistentOrganismCore';
// Wave 8 — operating system genesis (Phases 91–110)
import type { KernelReading } from '@lib/cognitiveKernel';
import type { ProcessScheduleReading } from '@lib/processScheduler';
import type { InterruptReading } from '@lib/interruptArchitecture';
import type { TaskQueueReading } from '@lib/strategicTaskQueue';
import type { ResourceAllocationReading } from '@lib/runtimeResourceAllocation';
import type { CognitionGraphReading } from '@lib/activeCognitionGraph';
import type { DirectiveReading } from '@lib/directiveEngine';
import type { RuntimeLoopsReading } from '@lib/autonomousRuntimeLoops';
import type { StrategicPauseReading } from '@lib/strategicPauseInfrastructure';
import type { KernelHealthReading } from '@lib/kernelHealthMonitor';
import type { MemoryPressureReading } from '@lib/memoryPressureManagement';
import type { MultiHorizonReading } from '@lib/multiHorizonPlanning';
import type { RecursiveReflectionReading } from '@lib/recursiveReflectionEngine';
import type { ArbitrationReading } from '@lib/executiveArbitrationCourt';
import type { IdentityEnforcementReading } from '@lib/runtimeIdentityEnforcement';
import type { StrategicSeasonReading } from '@lib/dynamicStrategicSeasons';
import type { DependencyMapReading } from '@lib/cognitiveDependencyMapping';
import type { StabilizationReading } from '@lib/autonomousRuntimeStabilization';
import type { ExecutiveStateReading } from '@lib/persistentExecutiveState';
import type { OperatingSystemReading } from '@lib/operatingSystemCore';
// Wave 10 — reality coupling architecture (Phases 131–150)
import type { RealityIngestionReading } from '@lib/realityIngestionEngine';
import type { EngagementTruthReading } from '@lib/engagementTruthScoring';
import type { EmotionalSaturationReading } from '@lib/emotionalSaturationMap';
import type { TrustDecayReading } from '@lib/trustDecayEngine';
import type { NarrativeClimateMonitorReading } from '@lib/narrativeClimateMonitor';
import type { AudienceNervousSystemReading } from '@lib/audienceNervousSystemModel';
import type { PlatformDriftReading } from '@lib/platformDriftRuntime';
import type { AuthenticityErosionReading } from '@lib/authenticityErosionTracker';
import type { SilenceRecommendationReading } from '@lib/silenceRecommendationRuntime';
import type { ReputationPressureReading } from '@lib/reputationPressureEngine';
import type { MeaningCompressionReading } from '@lib/meaningCompressionEngine';
import type { SocialExhaustionReading } from '@lib/socialExhaustionDetector';
import type { AttentionEconomyReading } from '@lib/attentionEconomyPressure';
import type { ContradictionDetectionReading } from '@lib/contradictionDetectionLayer';
import type { WorldFeedbackFusionReading } from '@lib/worldFeedbackFusion';
import type { TrueResonanceReading } from '@lib/trueResonanceDetector';
import type { CouplingGovernorReading } from '@lib/realityCouplingGovernor';
import type { ExternalRealityModelReading } from '@lib/externalRealityModel';
import type { CouplingHealthReading } from '@lib/couplingHealthMonitor';
import type { RealityCouplingReading } from '@lib/realityCouplingCore';
// Wave 11 — strategic future intelligence (Phases 151–180)
import type { FutureScenarioReading } from '@lib/futureScenarioSimulation';
import type { TimelineBranchingReading } from '@lib/strategicTimelineBranching';
import type { NarrativeFutureReading } from '@lib/narrativeFutureMapping';
import type { CulturalShiftReading } from '@lib/culturalShiftPrediction';
import type { ReputationFutureReading } from '@lib/reputationFutureModeling';
import type { TrustCompoundingReading } from '@lib/trustCompoundingEngine';
import type { MarketTimingReading } from '@lib/marketTimingIntelligence';
import type { StrategicPatienceReading } from '@lib/strategicPatienceRuntime';
import type { SecondOrderConsequenceReading } from '@lib/secondOrderConsequenceEngine';
import type { AntiFragilityReading } from '@lib/antiFragilityFutureArchitecture';
import type { BlackSwanReading } from '@lib/blackSwanSensitivityMapping';
import type { CompetitorEvolutionReading } from '@lib/competitorEvolutionSimulation';
import type { EcosystemPressureReading } from '@lib/ecosystemPressureForecasting';
import type { IdentityContinuityPlanReading } from '@lib/identityContinuityPlanner';
import type { StrategicSacrificeReading } from '@lib/strategicSacrificeEngine';
import type { HorizonScanReading } from '@lib/horizonScanningEngine';
import type { OpportunityCostReading } from '@lib/opportunityCostLedger';
import type { CompoundingAdvantageReading } from '@lib/compoundingAdvantageTracker';
import type { StrategicDebtReading } from '@lib/strategicDebtMonitor';
import type { FutureMemoryReading } from '@lib/futureMemoryArchive';
import type { LongHorizonRiskReading } from '@lib/longHorizonRiskBalance';
import type { IrreversibilityReading } from '@lib/irreversibilityDetector';
import type { StrategicOptionalityReading } from '@lib/strategicOptionalityEngine';
import type { GenerationalStrategyReading } from '@lib/generationalStrategyLayer';
import type { FutureIdentityReading } from '@lib/futureIdentityProjection';
import type { StrategicConvictionReading } from '@lib/strategicConvictionEngine';
import type { TemporalArbitrageReading } from '@lib/temporalArbitrageDetector';
import type { FutureCoherenceReading } from '@lib/futureCoherenceValidator';
import type { StrategicFutureGovernorReading } from '@lib/strategicFutureGovernor';
import type { StrategicPlanningReading } from '@lib/autonomousStrategicPlanningCore';
// Wave 12 — autonomous action architecture (Phases 181–220)
import type { ActionAuthorizationReading } from '@lib/actionAuthorizationRuntime';
import type { ActionExistenceReading } from '@lib/actionExistenceJustification';
import type { StrategicPublishReading } from '@lib/strategicPublishEngine';
import type { AdaptiveDeploymentReading } from '@lib/adaptiveCampaignDeployment';
import type { PlatformExecutionReading } from '@lib/platformExecutionGovernor';
import type { TrustAwareOptimizationReading } from '@lib/trustAwareOptimization';
import type { AudienceRecoveryReading } from '@lib/audienceRecoveryScheduler';
import type { SilenceEnforcementReading } from '@lib/silenceEnforcementLayer';
import type { AdaptivePacingReading } from '@lib/adaptivePacingEngine';
import type { ExecutionRiskReading } from '@lib/executionRiskManagement';
import type { NarrativeContinuityReading } from '@lib/narrativeContinuityEnforcement';
import type { StrategicRolloutReading } from '@lib/strategicRolloutIntelligence';
import type { ResonancePreservingReading } from '@lib/resonancePreservingOptimization';
import type { ExecutionMemoryReading } from '@lib/executionMemoryPersistence';
import type { ExperimentationReading } from '@lib/autonomousExperimentationRuntime';
import type { EscalationRestraintReading } from '@lib/escalationVsRestraintEngine';
import type { CampaignMutationReading } from '@lib/campaignMutationControl';
import type { FeedbackToStrategyReading } from '@lib/feedbackToStrategyBridge';
import type { ActionConsequenceReading } from '@lib/actionConsequenceTracker';
import type { CompulsiveAutomationReading } from '@lib/compulsiveAutomationDetector';
import type { ActionDignityReading } from '@lib/actionDignityMonitor';
import type { ExecutionLoadReading } from '@lib/executionLoadBalancer';
import type { OverReachReading } from '@lib/overReachDetector';
import type { ActionReversibilityReading } from '@lib/actionReversibilityPlanner';
import type { DeploymentWindowReading } from '@lib/deploymentWindowGovernor';
import type { RestraintBudgetReading } from '@lib/restraintBudgetRuntime';
import type { ActionIntentReading } from '@lib/actionIntentVerifier';
import type { ExecutionCadenceReading } from '@lib/executionCadenceMemory';
import type { ActionThrottleReading } from '@lib/autonomousActionThrottle';
import type { ActionWorthinessReading } from '@lib/actionWorthinessEvaluator';
import type { ChannelRoutingReading } from '@lib/channelExecutionRouting';
import type { ExecutionFeedbackReading } from '@lib/executionFeedbackLoop';
import type { StrategicWithholdingReading } from '@lib/strategicWithholdingEngine';
import type { ActionPortfolioReading } from '@lib/actionPortfolioBalancer';
import type { ExecutionHealthReading } from '@lib/executionHealthMonitor';
import type { AutonomyBoundaryReading } from '@lib/autonomyBoundaryEnforcement';
import type { ActionAccountabilityReading } from '@lib/actionAccountabilityLedger';
import type { ExecutionCoherenceReading } from '@lib/executionCoherenceValidator';
import type { AutonomousActionGovernorReading } from '@lib/autonomousActionGovernor';
import type { ExecutionSynthesisReading } from '@lib/autonomousExecutionSynthesisCore';
// Wave 13 — reality feedback infrastructure (Phases 221–260)
import type { AudienceReactionReading } from '@lib/realAudienceReactionIngestion';
import type { TrustShiftReading } from '@lib/trustShiftDetection';
import type { ResonanceDecayReading } from '@lib/resonanceDecayTracking';
import type { SilenceImpactReading } from '@lib/silenceImpactMeasurement';
import type { EmotionalTruthAlignmentReading } from '@lib/emotionalTruthAlignment';
import type { ContradictionScannerReading } from '@lib/contradictionFeedbackScanner';
import type { DelayedImpactReading } from '@lib/delayedImpactAttribution';
import type { CollectiveMoodReading } from '@lib/collectiveMoodInference';
import type { MemeticIntegrityReading } from '@lib/memeticIntegrityTracking';
import type { IdentityCorrectionReading } from '@lib/adaptiveIdentityCorrection';
import type { FeedbackSignalQualityReading } from '@lib/feedbackSignalQualityFilter';
import type { EmotionalEchoReading } from '@lib/emotionalEchoTracker';
import type { AudienceNervousSystemReadoutReading } from '@lib/audienceNervousSystemReadout';
import type { ReactionLatencyReading } from '@lib/reactionLatencyAnalyzer';
import type { SentimentDriftReading } from '@lib/sentimentDriftDetector';
import type { ReactionAuthenticityReading } from '@lib/reactionAuthenticityVerifier';
import type { ActionResultLedgerReading } from '@lib/actionResultLedger';
import type { FeedbackBiasReading } from '@lib/feedbackBiasFilter';
import type { ReactionPatternMemoryReading } from '@lib/reactionPatternMemory';
import type { FeedbackToIdentityReading } from '@lib/feedbackToIdentityBridge';
import type { FeedbackToStrategyReadingW13 } from '@lib/feedbackToStrategyAdjustment';
import type { ExecutionRefinementReading } from '@lib/feedbackToExecutionRefinement';
import type { TemporalImpactCurveReading } from '@lib/temporalImpactCurve';
import type { NarrativeReceptionReading } from '@lib/narrativeReceptionMapping';
import type { CounterNarrativeReading } from '@lib/counterNarrativeDetection';
import type { SecondHandResonanceReading } from '@lib/secondHandResonanceTracking';
import type { SilenceAsFeedbackReading } from '@lib/silenceAsFeedbackInterpreter';
import type { ReactionGenreReading } from '@lib/reactionGenreClassifier';
import type { TrustEvolutionReading } from '@lib/trustEvolutionGraph';
import type { MeaningPersistenceReading } from '@lib/meaningPersistenceTracker';
import type { FalseSuccessReading } from '@lib/falseSuccessDetector';
import type { FeedbackContradictionResolverReading } from '@lib/feedbackContradictionResolver';
import type { SlowTruthReading } from '@lib/slowMovingTruthDetector';
import type { FeedbackSignalIntegrityReading } from '@lib/feedbackSignalIntegrityValidator';
import type { FeedbackEcologyReading } from '@lib/feedbackEcologyMonitor';
import type { FeedbackMemoryArchiveReading } from '@lib/feedbackMemoryArchive';
import type { RealityAttributionReading } from '@lib/realityAttributionAuditor';
import type { FeedbackCoherenceReading as W13FeedbackCoherenceReading } from '@lib/feedbackCoherenceValidator';
import type { RealityFeedbackGovernorReading } from '@lib/realityFeedbackGovernor';
import type { CivilizationFeedbackLoopReading } from '@lib/civilizationFeedbackLoopCore';
// Wave 14 — live civilization coupling (Phases 261–320)
import type { LiveCommentIngestionReading } from '@lib/liveCommentIngestion';
import type { RealtimeSentimentFieldReading } from '@lib/realtimeSentimentField';
import type { ResonanceVelocityReading } from '@lib/resonanceVelocityTracking';
import type { AudienceStressReading } from '@lib/audienceStressDetection';
import type { CulturalWeatherReading } from '@lib/culturalWeatherRuntime';
import type { NarrativeContagionMapReading } from '@lib/narrativeContagionMap';
import type { DelayedMeaningReading } from '@lib/delayedMeaningRecognition';
import type { MeaningVsNoveltyReading } from '@lib/meaningVsNoveltyEngine';
import type { StrategicSilenceTimingReading } from '@lib/strategicSilenceTiming';
import type { LivingReputationFieldReading } from '@lib/livingReputationField';
import type { LiveReactionStreamReading } from '@lib/liveReactionStreamProcessor';
import type { SentimentFieldGradientReading } from '@lib/sentimentFieldGradient';
import type { RealtimeMoodVelocityReading } from '@lib/realtimeMoodVelocity';
import type { ResonanceFieldDirectionReading } from '@lib/resonanceFieldDirection';
import type { StressContagionReading } from '@lib/stressContagionTracker';
import type { NervousSystemPulseReading } from '@lib/nervousSystemPulseMonitor';
import type { CulturalFrontReading } from '@lib/culturalFrontDetection';
import type { CulturalPressureGradientReading } from '@lib/culturalPressureGradient';
import type { NarrativeSpreadingVelocityReading } from '@lib/narrativeSpreadingVelocity';
import type { NarrativeMutationDuringSpreadReading } from '@lib/narrativeMutationDuringSpread';
import type { SlowSignalAmplifierReading } from '@lib/slowSignalAmplifier';
import type { NoveltyDecayReading } from '@lib/noveltyDecayTracker';
import type { MeaningDensityReading } from '@lib/meaningDensityAnalyzer';
import type { SilenceWindowReading } from '@lib/silenceWindowDetector';
import type { ReputationFieldGradientReading } from '@lib/reputationFieldGradient';
import type { ReputationFieldVelocityReading } from '@lib/reputationFieldVelocity';
import type { LiveSignalAggregatorReading } from '@lib/liveSignalAggregator';
import type { LiveSignalDecayReading } from '@lib/liveSignalDecayMonitor';
import type { RealtimeAttentionFieldReading } from '@lib/realtimeAttentionField';
import type { RealtimeTrustFieldReading } from '@lib/realtimeTrustField';
import type { LiveCouplingHealthReading } from '@lib/liveCouplingHealth';
import type { RealityPresenceMeterReading } from '@lib/realityPresenceMeter';
import type { LiveImpactDetectionReading } from '@lib/liveImpactDetector';
import type { RealityChangeAttributionReading } from '@lib/realityChangeAttribution';
import type { LiveFeedbackLatencyReading } from '@lib/liveFeedbackLatency';
import type { AudienceCollectivePulseReading } from '@lib/audienceCollectivePulse';
import type { RealtimeNarrativeOrientationReading } from '@lib/realtimeNarrativeOrientation';
import type { LiveDriftDetectionReading } from '@lib/liveDriftDetection';
import type { RealtimeContradictionFieldReading } from '@lib/realtimeContradictionField';
import type { AudienceAttentionDecayReading } from '@lib/audienceAttentionDecay';
import type { CrisisSignalReading } from '@lib/crisisSignalDetector';
import type { RealtimeOpportunityReading } from '@lib/realtimeOpportunityDetector';
import type { LiveCouplingDriftCorrectionReading } from '@lib/liveCouplingDriftCorrection';
import type { LiveCouplingResonanceAnchorReading } from '@lib/liveCouplingResonanceAnchor';
import type { LiveCouplingBoundaryReading } from '@lib/liveCouplingBoundaryEnforcement';
import type { RealityPresenceReading } from '@lib/realityPresenceVerifier';
import type { RealityChangeLedgerReading } from '@lib/realityChangeLedger';
import type { LiveCouplingMemoryArchiveReading } from '@lib/liveCouplingMemoryArchive';
import type { RealtimeTrustVelocityReading } from '@lib/realtimeTrustVelocity';
import type { RealtimeContextWindowReading } from '@lib/realtimeContextWindowMonitor';
import type { LiveCouplingIntegrityReading } from '@lib/liveCouplingIntegrityValidator';
import type { RealityCouplingCadenceReading } from '@lib/realityCouplingCadence';
import type { LiveCouplingHealthBalancerReading } from '@lib/liveCouplingHealthBalancer';
import type { LiveCouplingDignityReading } from '@lib/liveCouplingDignityMonitor';
import type { RealtimeCivilizationStateReading } from '@lib/realtimeCivilizationStateReadout';
import type { RealityChangeAttributionAuditorReading } from '@lib/realityChangeAttributionAuditor';
import type { LiveCouplingCoherenceReading } from '@lib/liveCouplingCoherenceValidator';
import type { LiveCouplingGovernorReading } from '@lib/liveCouplingGovernor';
import type { CivilizationCouplingPresenceCheckReading } from '@lib/civilizationCouplingPresenceCheck';
import type { CivilizationCouplingKernelReading } from '@lib/civilizationCouplingKernel';
// Wave 15 — identity preservation under live reality (Phases 321–400)
import type { CoreIdentityInvariantReading } from '@lib/coreIdentityInvariantEngine';
import type { CivilizationImmuneSystemReading } from '@lib/civilizationImmuneSystem';
import type { AntiAssimilationReading } from '@lib/antiAssimilationLayer';
import type { TruthOverPopularityReading } from '@lib/truthOverPopularityGovernor';
import type { AudienceCaptureReading } from '@lib/audienceCaptureDetection';
import type { MemeticCorruptionReading } from '@lib/memeticCorruptionScanner';
import type { ResonanceWithoutSubmissionReading } from '@lib/resonanceWithoutSubmission';
import type { IdentityDriftRecoveryReading } from '@lib/identityDriftRecovery';
import type { SovereignNarrativeKernelReading } from '@lib/sovereignNarrativeKernel';
import type { IdentityInvariantValidatorReading } from '@lib/identityInvariantValidator';
import type { IdentityErosionReading } from '@lib/identityErosionDetector';
import type { PopularitySignalDecouplerReading } from '@lib/popularitySignalDecoupler';
import type { CoreVoiceProtectorReading } from '@lib/coreVoiceProtector';
import type { AssimilationPressureMonitorReading } from '@lib/assimilationPressureMonitor';
import type { IdentityImmuneResponseReading } from '@lib/identityImmuneResponse';
import type { SovereigntyVerifierReading } from '@lib/sovereigntyVerifier';
import type { SelfRecognitionReading } from '@lib/selfRecognitionMonitor';
import type { IdentityCorruptionLoggerReading } from '@lib/identityCorruptionLogger';
import type { ReactiveBehaviorReading } from '@lib/reactiveBehaviorDetector';
import type { ApprovalChasingReading } from '@lib/approvalChasingScanner';
import type { TrendPullForceReading } from '@lib/trendPullForceMonitor';
import type { IdentityAnchorMaintenanceReading } from '@lib/identityAnchorMaintenance';
import type { SelfBetrayalReading } from '@lib/selfBetrayalDetector';
import type { PopulistDriftReading } from '@lib/populistDriftDetector';
import type { IdentitySovereigntyBudgetReading } from '@lib/identitySovereigntyBudget';
import type { IdentityCompromiseCounterReading } from '@lib/identityCompromiseCounter';
import type { SelfErasureReading } from '@lib/selfErasureScanner';
import type { CoreBeliefIntegrityReading } from '@lib/coreBeliefIntegrityValidator';
import type { IdentityShapeReading } from '@lib/identityShapeMonitor';
import type { VoiceConsistencyMonitorReading } from '@lib/voiceConsistencyMonitor';
import type { SelfImageVsRealityGapReading } from '@lib/selfImageVsRealityGap';
import type { ExternalValidationDependenceReading } from '@lib/externalValidationDependence';
import type { SovereignDecisionLogReading } from '@lib/sovereignDecisionLog';
import type { PopulistTemptationGaugeReading } from '@lib/populistTemptationGauge';
import type { IdentityResilienceMonitorReading } from '@lib/identityResilienceMonitor';
import type { CoreTruthSentinelReading } from '@lib/coreTruthSentinel';
import type { IdentityCalibrationReading } from '@lib/identityCalibrationEngine';
import type { AudienceMirroringReading } from '@lib/audienceMirroringDetector';
import type { IdentityCorrosionPreventionReading } from '@lib/identityCorrosionPrevention';
import type { NarrativeSovereigntyMonitorReading } from '@lib/narrativeSovereigntyMonitor';
import type { SelfReferenceLoopReading } from '@lib/selfReferenceLoopDetector';
import type { IdentityIntegrityHealthScoreReading } from '@lib/identityIntegrityHealthScore';
import type { AntiAdaptationOverrideReading } from '@lib/antiAdaptationOverride';
import type { IdentityBoundaryEnforcementReading } from '@lib/identityBoundaryEnforcement';
import type { AlienBeliefIntrusionReading } from '@lib/alienBeliefIntrusion';
import type { OpinionStormImmunityReading } from '@lib/opinionStormImmunity';
import type { CulturalGravityResistanceReading } from '@lib/culturalGravityResistance';
import type { IdentityCompromiseLedgerReading } from '@lib/identityCompromiseLedger';
import type { IdentitySelfReadoutReading } from '@lib/identitySelfReadout';
import type { ExternalNarrativeSeparatorReading } from '@lib/externalNarrativeSeparator';
import type { CoreIdentityRecallReading } from '@lib/coreIdentityRecallMechanism';
import type { IdentityShapingPressureFieldReading } from '@lib/identityShapingPressureField';
import type { SelfBetrayalEarlyWarningReading } from '@lib/selfBetrayalEarlyWarning';
import type { IdentityCenterOfGravityReading } from '@lib/identityCenterOfGravity';
import type { CorePrincipleViolationReading } from '@lib/corePrincipleViolationScanner';
import type { IdentityMimicryReading } from '@lib/identityMimicryDetector';
import type { IdentityDriftRecoveryProtocolReading } from '@lib/identityDriftRecoveryProtocol';
import type { SovereigntyEnforcementBudgetReading } from '@lib/sovereigntyEnforcementBudget';
import type { IdentityCorruptionContainmentReading } from '@lib/identityCorruptionContainment';
import type { IdentityRebuildKernelReading } from '@lib/identityRebuildKernel';
import type { IdentitySustenanceMonitorReading } from '@lib/identitySustenanceMonitor';
import type { CoreSelfActivationCheckReading } from '@lib/coreSelfActivationCheck';
import type { ExternalCaptureRiskReading } from '@lib/externalCaptureRiskAuditor';
import type { IdentityBleedingPreventionReading } from '@lib/identityBleedingPreventionLayer';
import type { SovereignVoiceAmplifierReading } from '@lib/sovereignVoiceAmplifier';
import type { CoreIdentityWatchdogReading } from '@lib/coreIdentityWatchdog';
import type { SelfDoubtRegulatorReading } from '@lib/selfDoubtRegulator';
import type { IdentityCohesionGravityReading } from '@lib/identityCohesionGravity';
import type { IdentitySovereigntyForceFieldReading } from '@lib/identitySovereigntyForceField';
import type { CoreSelfMaintenanceRuntimeReading } from '@lib/coreSelfMaintenanceRuntime';
import type { IdentityFidelityArchiveReading } from '@lib/identityFidelityArchive';
import type { ExternalPressureBufferReading } from '@lib/externalPressureBufferLayer';
import type { SovereignActionFilterReading } from '@lib/sovereignActionFilter';
import type { IdentityCoherenceUnderPressureReading } from '@lib/identityCoherenceUnderPressure';
import type { PopulationPressureAttributionReading } from '@lib/populationPressureAttribution';
import type { IdentityIntegrityCoherenceReading } from '@lib/identityIntegrityCoherenceValidator';
import type { IdentitySovereigntyGovernorReading } from '@lib/identitySovereigntyGovernor';
import type { SovereignPresenceCheckReading } from '@lib/sovereignPresenceCheck';
import type { ExistentialResilienceReading } from '@lib/existentialResilienceMonitor';
import type { ExistentialIntegrityReading } from '@lib/existentialIntegrityEngine';
// Wave 16 — generative civilization presence (Phases 401–500)
import type { CivilizationCoherenceRuntimeReading } from '@lib/civilizationCoherenceRuntime';
import type { GenerativePresenceGovernorReading } from '@lib/generativePresenceGovernor';
import type { GenerativePresenceBoundaryReading } from '@lib/generativePresenceBoundary';
import type { GenerativePresencePresenceCheckReading } from '@lib/generativePresencePresenceCheck';
import type { CivilizationPresenceFieldReading } from '@lib/civilizationPresenceField';
import type { CoherentHopeArchitectureReading } from '@lib/coherentHopeArchitecture';
import type { BeautyAsTruthValidatorReading } from '@lib/beautyAsTruthValidator';
import type { GenerativePresenceWatchdogReading } from '@lib/generativePresenceWatchdog';
import type { GenerativeAccountabilityReading } from '@lib/generativeAccountabilityArchive';
import type { GenerativePresenceHealthCheckReading } from '@lib/generativePresenceHealthCheck';
import type { CivilizationFlourishingScoreReading } from '@lib/civilizationFlourishingScore';
import type { GenerativeIntegrityCoherenceReading } from '@lib/generativeIntegrityCoherence';
import type { GenerativePresenceDignityCheckReading } from '@lib/generativePresenceDignityCheck';
import type { GenerativePresenceCoherenceReading } from '@lib/generativePresenceCoherence';
import type { NonManipulativeInfluenceReading } from '@lib/nonManipulativeInfluenceSystem';
import type { InvitationOverPersuasionReading } from '@lib/invitationOverPersuasionGovernor';
import type { AntiPressurePresenceReading } from '@lib/antiPressurePresence';
import type { PresenceAsServiceReading } from '@lib/presenceAsServiceMonitor';
import type { PresenceWithoutPredationReading } from '@lib/presenceWithoutPredation';
import type { AntiEngagementOptimizationReading } from '@lib/antiEngagementOptimization';
import type { BeautyOverSpectacleGovernorReading } from '@lib/beautyOverSpectacleGovernor';
import type { QuietAuthorityReading } from '@lib/quietAuthorityField';
import type { SymbolicGiftReading } from '@lib/symbolicGiftEngine';
import type { AntiColonizationLayerReading } from '@lib/antiColonizationLayer';
import type { PresenceWithoutOwnershipReading } from '@lib/presenceWithoutOwnership';
import type { AntiOtheringReading } from '@lib/antiOtheringEngine';
import type { AntiCynicismFieldReading } from '@lib/antiCynicismField';
import type { AntiNihilismRuntimeReading } from '@lib/antiNihilismRuntime';

export interface MetaInput {
  ctx: EngineContext;
  scrollStop: Critique;
  taste: AestheticCritique;
  psychology: VisualPsychology;
  productPresence: ProductPresence | null;
  reference: ReferenceMatch;
  memory: MemorySnapshot;
  /** 0..1 — higher means more brutal. Default 0.7. */
  brutality?: number;
  // Phase 2.5 — explicit taste system signals.
  judge?: TasteVerdict;
  reaction?: ReactionCurve;
  fatigue?: FatigueReport;
  // Phase 3 — campaign brain signals.
  antiAI?: AntiAIReport;
  rhythmWorsen?: { worsens: boolean; axis: RhythmAxis | null; reason: string | null };
  job?: JobDecision;
  direction?: CreativeDirection;
  // Phase 4 — reality-loop signals.
  aftertastePrediction?: AftertasteRecord;
  atmosphere?: AtmosphereReport;
  drift?: DriftReport;
  // Phase 5 — perceptual foundation signals.
  visualTaste?: VisualTasteVerdict;
  emotionalAftertaste?: EmotionalAftertaste;
  campaignMemoryV2?: CampaignMemoryV2Report;
  // Phase 7 — perception + world continuity.
  perceptionCriticVerdict?: PerceptionVerdict;
  campaignIdentity?: CampaignIdentity;
  // Phase 8 — visual composition intelligence.
  gravity?: GravityReading;
  negativeSpace?: NegativeSpaceReading;
  compositionRhythm8?: CompositionRhythmReport;
  productPresence8?: PresenceDecision;
  framing8?: FramingPlan;
  directorVerdict?: LayoutDirectorVerdict;
  // Phase 9 — temporal campaign cinema.
  sequenceVerdict?: SequenceVerdict;
  tempoWorsen?: { worsens: boolean; axis: TempoAxisName | string | null; reason: string | null };
  absenceDecision?: AbsenceDecision;
  contradictionReading?: ContradictionReading;
  objectMemoryGraph?: ObjectMemoryGraph;
  // Phase 10 — unified cinematic brain.
  compressionReading?: CompressionReading;
  syntheticReading?: SyntheticReading;
  cinematicVerdict?: CinematicVerdict;
  // Phase 11 — natural human chaos.
  humanContradiction?: HumanContradictionReading;
  nonPerformative?: PerformativeReading;
  lifeNoise?: LifeNoisePlan;
  // Phase 12 — cultural memory engine.
  sharedPattern?: CulturalPattern | null;
  collectiveRecognition?: CollectiveRecognitionReading;
  unspokenRitualPick?: RitualSelection;
  culturalDriftReading?: CulturalDriftReading;
  // Phase 13 — reality pressure.
  realityPressureReading?: RealityPressureReading;
  consequenceReading?: ConsequenceReading;
  invisibleStakesReading?: StakesReading;
  functionalCollapseReading?: FunctionalCollapseReading;
  // Phase 14 — suppressed humanity.
  avoidanceReading?: AvoidanceReading;
  numbingReading?: NumbingReading;
  maskingReading?: SocialMaskingReading;
  unfeltReading?: UnfeltReading;
  // Phase 15 — longitudinal reality memory.
  truthPersistenceReport?: TruthPersistenceReport;
  realityVerificationReading?: RealityVerificationReading;
  emotionalDecayReading?: DecayReading;
  generationPressureReading?: GenerationPressureReading;
  // Phase 16 — reality ingestion layer.
  privateLanguageReading?: PrivateLanguageReading;
  realityWeightingReading?: WeightingReading;
  // Phase 17 — systemic human pressure model.
  systemicCauseReading?: SystemicCauseReading;
  attentionFragmentationReading?: FragmentationReading;
  environmentalSystemReading?: EnvironmentalSystemReading;
  recoveryFailureReading?: RecoveryFailureReading;
  cognitiveResidueReading?: CognitiveResidueReading;
  // Phase 18 — behavioral survival engine.
  behaviorLoopReading?: BehaviorLoopReading;
  microEscapeReading?: MicroEscapeReading;
  ritualCompensationReading?: CompensationRitualReading;
  fakeRecoveryReading?: FakeRecoveryReading;
  silentCopingReading?: SilentCopingReading;
  behavioralResidueReading?: BehavioralResidueReading;
  // Phase 19 — social masking + identity performance engine.
  socialMaskingEngineReading?: SocialMaskingEngineReading;
  highFunctioningBurnoutReading?: HighFunctioningBurnoutReading;
  identityMaintenanceReading?: IdentityMaintenanceReading;
  emotionalCamouflageReading?: EmotionalCamouflageReading;
  publicPrivateSplitReading?: PublicPrivateSplitReading;
  maskFatigueReading?: MaskFatigueReading;
  // Phase 20 — desire systems.
  desireArchitectureReading?: DesireArchitectureReading;
  quietStatusReading?: QuietStatusReading;
  emotionalHungerReading?: EmotionalHungerReading;
  validationSystemsReading?: ValidationSystemsReading;
  invisibleEnvyReading?: InvisibleEnvyReading;
  aspirationalGapReading?: AspirationalIdentityGapReading;
  // Phase 21 — social gravity.
  socialGravityReading?: SocialGravityReading;
  collectiveMovementReading?: CollectiveEmotionalMovementReading;
  culturalAccelerationReading?: CulturalAccelerationReading;
  groupAnxietyReading?: GroupAnxietyReading;
  viralPatternsReading?: ViralEmotionPatternsReading;
  socialPermissionReading?: SocialPermissionReading;
  // Phase 22 — ritual attachment.
  ritualFormationReading?: RitualFormationReading;
  attachmentLoopsReading?: AttachmentLoopsReading;
  symbolicSafetyReading?: SymbolicSafetyReading;
  emotionalReturnReading?: EmotionalReturnReading;
  privateRitualMemoryReading?: PrivateRitualMemoryReading;
  repeatedComfortReading?: RepeatedComfortSystemsReading;
  // Phase 23 — narrative self.
  internalNarrativeReading?: InternalNarrativeReading;
  selfStoryReading?: SelfStoryArchitectureReading;
  identityContinuityReading?: IdentityContinuityReading;
  meaningSystemsReading?: PrivateMeaningSystemsReading;
  selfTranslationReading?: EmotionalSelfTranslationReading;
  personalMythologyReading?: PersonalMythologyReading;
  // Phase 24 — predictive human states.
  emotionalForecastReading?: EmotionalForecastReading;
  behaviorPredictionReading?: BehaviorPredictionReading;
  collapseProbabilityReading?: CollapseProbabilityReading;
  recoveryAttemptReading?: RecoveryAttemptReading;
  pressureTrajectoryReading?: FuturePressureTrajectoryReading;
  emotionalDriftReading?: EmotionalDriftPredictionReading;
  // Phase 25 — autonomous campaign intelligence.
  autonomousNarrativeReading?: AutonomousNarrativeReading;
  culturalSignalEvolutionReading?: CulturalSignalEvolutionReading;
  selfUpdatingPsychologyReading?: SelfUpdatingPsychologyReading;
  emergentCampaignMemoryReading?: EmergentCampaignMemoryReading;
  collectiveRealityTrackingReading?: CollectiveRealityTrackingReading;
  adaptiveEmotionalIntelligenceReading?: AdaptiveEmotionalIntelligenceReading;
  // Phases 20–25 — unified human cognition graph.
  unifiedGraphReading?: UnifiedHumanGraphReading;
  // Phase 26 — unified cognitive field (the nervous system).
  cognitiveField?: CognitiveFieldState;
  emotionalPhysicsReading?: EmotionalPhysicsReading;
  tensionTopologyReading?: TensionTopologyReading;
  contradictionResolution?: ContradictionResolverReading;
  // Phase 27 — persistent cognitive runtime (the living runtime layer).
  cognitiveContinuity?: CognitiveContinuityReading;
  runtimeDrift?: RuntimeDriftReport;
  priorNextRunDirective?: NextRunDirective;
  // Wave 2 — reality execution architecture (Phases 28–35).
  nervousSystemReading?: CampaignNervousSystemReading;
  attentionPhysicsReading?: AttentionPhysicsReading;
  visualCognitionReading?: VisualCognitionReading;
  emotionalContinuityReading?: EmotionalContinuityRuntimeReading;
  audienceFeedbackReading?: AudienceRealityFeedbackReading;
  antiOptimizationReading?: AntiOptimizationReading;
  identityPersistenceReading?: IdentityPersistenceReading;
  autonomousDirectionReading?: AutonomousCreativeDirectionReading;
  realityExecution?: RealityExecutionState;
  // Wave 4 — executive cognition layer (Phases 36–42).
  strategicPriorityReading?: StrategicPriorityReading;
  cognitiveEnergyReading?: CognitiveEnergyReading;
  temporalPsychologyReading?: TemporalPsychologyReading;
  identityGovernanceReading?: IdentityGovernanceReading;
  campaignLifecycleReading?: CampaignLifecycleReading;
  executiveWorldState?: ExecutiveWorldState;
  worldUnderstanding?: WorldUnderstandingReading;
  executiveDecision?: ExecutiveDecision;
  // Wave 5 — autonomous strategic society (Phases 43–55).
  councilSession?: CouncilSession;
  internalDebate?: InternalDebateReading;
  councilConflict?: CouncilConflictReading;
  executiveConsensus?: ExecutiveConsensusReading;
  strategicConsciousness?: StrategicConsciousnessReading;
  // Wave 6 — cognitive civilization infrastructure (Phases 56–70).
  civLaws?: CognitiveLawReading;
  civScars?: ScarMemoryReading;
  civEthics?: ExecutiveEthicsReading;
  civStability?: CivilizationStabilityReading;
  civIdeologicalMutation?: IdeologicalMutationReading;
  civIdentityContinuity?: EmergentIdentityContinuityReading;
  // Wave 7 — reality organism architecture (Phases 71–90).
  orgEnvironmental?: EnvironmentalPressureReading;
  orgImmune?: ImmuneResponseReading;
  orgEnergy?: StrategicEnergyReading;
  orgClimate?: NarrativeClimateReading;
  orgIdentityStress?: IdentityStressReading;
  orgExpansion?: ExpansionPreservationReading;
  orgRhythm?: RealityRhythmReading;
  orgAttentionForecast?: CollectiveAttentionForecastReading;
  orgMemetic?: MemeticThreatReading;
  orgFatigue?: CivilizationFatigueReading;
  orgSilence?: StrategicSilenceReading;
  orgEmotionalResource?: EmotionalResourceReading;
  orgAdaptiveWorldModel?: AdaptiveWorldStateReading;
  orgComplexity?: ComplexityRegulationReading;
  orgEvolutionGovernance?: StrategicEvolutionReading;
  orgAdaptiveRuntime?: RealityAdaptiveRuntimeReading;
  orgStabilityPreservation?: StabilityPreservationReading;
  orgExistentialRisk?: ExistentialRiskReading;
  orgCore?: OrganismCoreReading;
  // Wave 8 — operating system genesis (Phases 91–110).
  osKernel?: KernelReading;
  osScheduler?: ProcessScheduleReading;
  osInterrupts?: InterruptReading;
  osTaskQueue?: TaskQueueReading;
  osResources?: ResourceAllocationReading;
  osCognitionGraph?: CognitionGraphReading;
  osDirective?: DirectiveReading;
  osLoops?: RuntimeLoopsReading;
  osPause?: StrategicPauseReading;
  osHealth?: KernelHealthReading;
  osMemoryPressure?: MemoryPressureReading;
  osMultiHorizon?: MultiHorizonReading;
  osReflection?: RecursiveReflectionReading;
  osArbitration?: ArbitrationReading;
  osIdentityEnforcement?: IdentityEnforcementReading;
  osSeason?: StrategicSeasonReading;
  osDependencies?: DependencyMapReading;
  osStabilization?: StabilizationReading;
  osExecutiveState?: ExecutiveStateReading;
  osCore?: OperatingSystemReading;
  // Wave 10 — reality coupling architecture (Phases 131–150).
  cplIngestion?: RealityIngestionReading;
  cplEngagementTruth?: EngagementTruthReading;
  cplSaturation?: EmotionalSaturationReading;
  cplTrust?: TrustDecayReading;
  cplClimate?: NarrativeClimateMonitorReading;
  cplAudience?: AudienceNervousSystemReading;
  cplPlatformDrift?: PlatformDriftReading;
  cplAuthenticity?: AuthenticityErosionReading;
  cplSilence?: SilenceRecommendationReading;
  cplReputation?: ReputationPressureReading;
  cplMeaning?: MeaningCompressionReading;
  cplSocialExhaustion?: SocialExhaustionReading;
  cplAttentionEconomy?: AttentionEconomyReading;
  cplContradiction?: ContradictionDetectionReading;
  cplWorldFeedback?: WorldFeedbackFusionReading;
  cplResonance?: TrueResonanceReading;
  cplGovernor?: CouplingGovernorReading;
  cplExternalModel?: ExternalRealityModelReading;
  cplHealth?: CouplingHealthReading;
  cplCore?: RealityCouplingReading;
  // Wave 11 — strategic future intelligence (Phases 151–180).
  futScenarios?: FutureScenarioReading;
  futTimeline?: TimelineBranchingReading;
  futNarrative?: NarrativeFutureReading;
  futCulturalShift?: CulturalShiftReading;
  futReputation?: ReputationFutureReading;
  futTrustCompounding?: TrustCompoundingReading;
  futMarketTiming?: MarketTimingReading;
  futPatience?: StrategicPatienceReading;
  futSecondOrder?: SecondOrderConsequenceReading;
  futAntifragility?: AntiFragilityReading;
  futBlackSwan?: BlackSwanReading;
  futCompetitor?: CompetitorEvolutionReading;
  futEcosystem?: EcosystemPressureReading;
  futIdentityContinuity?: IdentityContinuityPlanReading;
  futSacrifice?: StrategicSacrificeReading;
  futHorizonScan?: HorizonScanReading;
  futOpportunityCost?: OpportunityCostReading;
  futCompounding?: CompoundingAdvantageReading;
  futStrategicDebt?: StrategicDebtReading;
  futMemory?: FutureMemoryReading;
  futLongHorizonRisk?: LongHorizonRiskReading;
  futIrreversibility?: IrreversibilityReading;
  futOptionality?: StrategicOptionalityReading;
  futGenerational?: GenerationalStrategyReading;
  futIdentity?: FutureIdentityReading;
  futConviction?: StrategicConvictionReading;
  futTemporalArbitrage?: TemporalArbitrageReading;
  futCoherence?: FutureCoherenceReading;
  futGovernor?: StrategicFutureGovernorReading;
  futCore?: StrategicPlanningReading;
  // Wave 12 — autonomous action architecture (Phases 181–220).
  actAuth?: ActionAuthorizationReading;
  actExistence?: ActionExistenceReading;
  actPublish?: StrategicPublishReading;
  actDeployment?: AdaptiveDeploymentReading;
  actPlatform?: PlatformExecutionReading;
  actTrustOpt?: TrustAwareOptimizationReading;
  actAudienceRecovery?: AudienceRecoveryReading;
  actSilenceEnforcement?: SilenceEnforcementReading;
  actPacing?: AdaptivePacingReading;
  actRisk?: ExecutionRiskReading;
  actNarrativeCont?: NarrativeContinuityReading;
  actRollout?: StrategicRolloutReading;
  actResonancePreserving?: ResonancePreservingReading;
  actExecMemory?: ExecutionMemoryReading;
  actExperimentation?: ExperimentationReading;
  actEscalation?: EscalationRestraintReading;
  actMutation?: CampaignMutationReading;
  actFeedback?: FeedbackToStrategyReading;
  actConsequence?: ActionConsequenceReading;
  actCompulsion?: CompulsiveAutomationReading;
  actDignity?: ActionDignityReading;
  actLoad?: ExecutionLoadReading;
  actOverreach?: OverReachReading;
  actReversibility?: ActionReversibilityReading;
  actDeploymentWindow?: DeploymentWindowReading;
  actRestraintBudget?: RestraintBudgetReading;
  actIntent?: ActionIntentReading;
  actCadence?: ExecutionCadenceReading;
  actThrottle?: ActionThrottleReading;
  actWorthiness?: ActionWorthinessReading;
  actRouting?: ChannelRoutingReading;
  actFeedbackLoop?: ExecutionFeedbackReading;
  actWithholding?: StrategicWithholdingReading;
  actPortfolio?: ActionPortfolioReading;
  actHealth?: ExecutionHealthReading;
  actBoundary?: AutonomyBoundaryReading;
  actAccountability?: ActionAccountabilityReading;
  actCoherence?: ExecutionCoherenceReading;
  actGovernor?: AutonomousActionGovernorReading;
  actCore?: ExecutionSynthesisReading;
  // Wave 13 — reality feedback infrastructure (Phases 221–260).
  fbIngestion?: AudienceReactionReading;
  fbTrustShift?: TrustShiftReading;
  fbResonanceDecay?: ResonanceDecayReading;
  fbSilenceImpact?: SilenceImpactReading;
  fbEmotionalTruth?: EmotionalTruthAlignmentReading;
  fbContradictions?: ContradictionScannerReading;
  fbDelayedImpact?: DelayedImpactReading;
  fbCollectiveMood?: CollectiveMoodReading;
  fbMemetic?: MemeticIntegrityReading;
  fbIdentityCorrection?: IdentityCorrectionReading;
  fbSignalQuality?: FeedbackSignalQualityReading;
  fbEcho?: EmotionalEchoReading;
  fbNervousSystem?: AudienceNervousSystemReadoutReading;
  fbLatency?: ReactionLatencyReading;
  fbSentimentDrift?: SentimentDriftReading;
  fbAuthenticity?: ReactionAuthenticityReading;
  fbResultLedger?: ActionResultLedgerReading;
  fbBiasFilter?: FeedbackBiasReading;
  fbPatternMemory?: ReactionPatternMemoryReading;
  fbIdentityBridge?: FeedbackToIdentityReading;
  fbStrategyAdjust?: FeedbackToStrategyReadingW13;
  fbExecRefine?: ExecutionRefinementReading;
  fbImpactCurve?: TemporalImpactCurveReading;
  fbNarrativeReception?: NarrativeReceptionReading;
  fbCounterNarrative?: CounterNarrativeReading;
  fbSecondHand?: SecondHandResonanceReading;
  fbSilenceAsFeedback?: SilenceAsFeedbackReading;
  fbGenre?: ReactionGenreReading;
  fbTrustGraph?: TrustEvolutionReading;
  fbMeaning?: MeaningPersistenceReading;
  fbFalseSuccess?: FalseSuccessReading;
  fbContradictionResolved?: FeedbackContradictionResolverReading;
  fbSlowTruth?: SlowTruthReading;
  fbSignalIntegrity?: FeedbackSignalIntegrityReading;
  fbEcology?: FeedbackEcologyReading;
  fbArchive?: FeedbackMemoryArchiveReading;
  fbAttribution?: RealityAttributionReading;
  fbCoherence?: W13FeedbackCoherenceReading;
  fbGovernor?: RealityFeedbackGovernorReading;
  fbCore?: CivilizationFeedbackLoopReading;
  // Wave 14 — live civilization coupling (Phases 261–320).
  lcComment?: LiveCommentIngestionReading;
  lcStream?: LiveReactionStreamReading;
  lcSentimentField?: RealtimeSentimentFieldReading;
  lcSentimentGrad?: SentimentFieldGradientReading;
  lcMoodVel?: RealtimeMoodVelocityReading;
  lcResonanceVel?: ResonanceVelocityReading;
  lcResonanceDir?: ResonanceFieldDirectionReading;
  lcStress?: AudienceStressReading;
  lcStressContagion?: StressContagionReading;
  lcPulse?: NervousSystemPulseReading;
  lcWeather?: CulturalWeatherReading;
  lcFront?: CulturalFrontReading;
  lcPressureGrad?: CulturalPressureGradientReading;
  lcContagion?: NarrativeContagionMapReading;
  lcSpreadVel?: NarrativeSpreadingVelocityReading;
  lcMutation?: NarrativeMutationDuringSpreadReading;
  lcDelayedMeaning?: DelayedMeaningReading;
  lcSlowAmp?: SlowSignalAmplifierReading;
  lcMeaningVsNov?: MeaningVsNoveltyReading;
  lcNoveltyDecay?: NoveltyDecayReading;
  lcMeaningDensity?: MeaningDensityReading;
  lcSilenceTiming?: StrategicSilenceTimingReading;
  lcSilenceWindow?: SilenceWindowReading;
  lcLivingRep?: LivingReputationFieldReading;
  lcRepGrad?: ReputationFieldGradientReading;
  lcRepVel?: ReputationFieldVelocityReading;
  lcSignalAgg?: LiveSignalAggregatorReading;
  lcSignalDecay?: LiveSignalDecayReading;
  lcAttention?: RealtimeAttentionFieldReading;
  lcTrustField?: RealtimeTrustFieldReading;
  lcCouplingHealth?: LiveCouplingHealthReading;
  lcPresenceMeter?: RealityPresenceMeterReading;
  lcPresenceVer?: RealityPresenceReading;
  lcImpact?: LiveImpactDetectionReading;
  lcAttribution?: RealityChangeAttributionReading;
  lcLatency?: LiveFeedbackLatencyReading;
  lcCollectivePulse?: AudienceCollectivePulseReading;
  lcNarrOrient?: RealtimeNarrativeOrientationReading;
  lcContradictionField?: RealtimeContradictionFieldReading;
  lcAttDecay?: AudienceAttentionDecayReading;
  lcCrisis?: CrisisSignalReading;
  lcOpportunity?: RealtimeOpportunityReading;
  lcDrift?: LiveDriftDetectionReading;
  lcDriftCorr?: LiveCouplingDriftCorrectionReading;
  lcAnchor?: LiveCouplingResonanceAnchorReading;
  lcBoundary?: LiveCouplingBoundaryReading;
  lcChangeLedger?: RealityChangeLedgerReading;
  lcMemoryArchive?: LiveCouplingMemoryArchiveReading;
  lcTrustVel?: RealtimeTrustVelocityReading;
  lcContextWin?: RealtimeContextWindowReading;
  lcAttribAudit?: RealityChangeAttributionAuditorReading;
  lcIntegrity?: LiveCouplingIntegrityReading;
  lcCadence?: RealityCouplingCadenceReading;
  lcHealthBal?: LiveCouplingHealthBalancerReading;
  lcDignity?: LiveCouplingDignityReading;
  lcCivState?: RealtimeCivilizationStateReading;
  lcCoherence?: LiveCouplingCoherenceReading;
  lcGovernor?: LiveCouplingGovernorReading;
  lcPresenceCheck?: CivilizationCouplingPresenceCheckReading;
  lcKernel?: CivilizationCouplingKernelReading;
  // Wave 15 — identity preservation under live reality (Phases 321–400).
  idInvariants?: CoreIdentityInvariantReading;
  idImmune?: CivilizationImmuneSystemReading;
  idAntiAssim?: AntiAssimilationReading;
  idTruthOverPop?: TruthOverPopularityReading;
  idCapture?: AudienceCaptureReading;
  idMemeticCorr?: MemeticCorruptionReading;
  idResonanceSov?: ResonanceWithoutSubmissionReading;
  idDriftRecovery?: IdentityDriftRecoveryReading;
  idNarrSov?: SovereignNarrativeKernelReading;
  idInvValidator?: IdentityInvariantValidatorReading;
  idErosion?: IdentityErosionReading;
  idPopDecoupler?: PopularitySignalDecouplerReading;
  idVoiceProt?: CoreVoiceProtectorReading;
  idAssimPressure?: AssimilationPressureMonitorReading;
  idImmuneResp?: IdentityImmuneResponseReading;
  idSovVerified?: SovereigntyVerifierReading;
  idSelfRec?: SelfRecognitionReading;
  idCorruptLog?: IdentityCorruptionLoggerReading;
  idReactive?: ReactiveBehaviorReading;
  idApprovalChase?: ApprovalChasingReading;
  idTrendPull?: TrendPullForceReading;
  idAnchor?: IdentityAnchorMaintenanceReading;
  idBetrayal?: SelfBetrayalReading;
  idPopulistDrift?: PopulistDriftReading;
  idSovBudget?: IdentitySovereigntyBudgetReading;
  idComprCounter?: IdentityCompromiseCounterReading;
  idSelfErase?: SelfErasureReading;
  idBeliefInt?: CoreBeliefIntegrityReading;
  idShape?: IdentityShapeReading;
  idVoiceCons?: VoiceConsistencyMonitorReading;
  idSelfImage?: SelfImageVsRealityGapReading;
  idValDep?: ExternalValidationDependenceReading;
  idDecisionLog?: SovereignDecisionLogReading;
  idPopTempt?: PopulistTemptationGaugeReading;
  idResilience?: IdentityResilienceMonitorReading;
  idTruthSent?: CoreTruthSentinelReading;
  idCalibration?: IdentityCalibrationReading;
  idMirroring?: AudienceMirroringReading;
  idCorrosion?: IdentityCorrosionPreventionReading;
  idNarrSovMon?: NarrativeSovereigntyMonitorReading;
  idSelfRef?: SelfReferenceLoopReading;
  idHealth?: IdentityIntegrityHealthScoreReading;
  idAntiAdapt?: AntiAdaptationOverrideReading;
  idBoundary?: IdentityBoundaryEnforcementReading;
  idAlienBel?: AlienBeliefIntrusionReading;
  idStormImm?: OpinionStormImmunityReading;
  idCultGrav?: CulturalGravityResistanceReading;
  idComprLed?: IdentityCompromiseLedgerReading;
  idSelfReadout?: IdentitySelfReadoutReading;
  idExtSep?: ExternalNarrativeSeparatorReading;
  idRecall?: CoreIdentityRecallReading;
  idShapePress?: IdentityShapingPressureFieldReading;
  idBetEarly?: SelfBetrayalEarlyWarningReading;
  idCenterGrav?: IdentityCenterOfGravityReading;
  idPrincViol?: CorePrincipleViolationReading;
  idMimicry?: IdentityMimicryReading;
  idRecProtocol?: IdentityDriftRecoveryProtocolReading;
  idEnfBudget?: SovereigntyEnforcementBudgetReading;
  idCorrContain?: IdentityCorruptionContainmentReading;
  idRebuild?: IdentityRebuildKernelReading;
  idSustenance?: IdentitySustenanceMonitorReading;
  idCoreAct?: CoreSelfActivationCheckReading;
  idCaptureRisk?: ExternalCaptureRiskReading;
  idBleed?: IdentityBleedingPreventionReading;
  idVoiceAmp?: SovereignVoiceAmplifierReading;
  idWatchdog?: CoreIdentityWatchdogReading;
  idDoubt?: SelfDoubtRegulatorReading;
  idCohesion?: IdentityCohesionGravityReading;
  idForce?: IdentitySovereigntyForceFieldReading;
  idMaint?: CoreSelfMaintenanceRuntimeReading;
  idFid?: IdentityFidelityArchiveReading;
  idPressBuf?: ExternalPressureBufferReading;
  idActFilter?: SovereignActionFilterReading;
  idCoherUnder?: IdentityCoherenceUnderPressureReading;
  idPopAttr?: PopulationPressureAttributionReading;
  idCoherValid?: IdentityIntegrityCoherenceReading;
  idGovernor?: IdentitySovereigntyGovernorReading;
  idPresenceCheck?: SovereignPresenceCheckReading;
  idExistRes?: ExistentialResilienceReading;
  idKernel?: ExistentialIntegrityReading;
  // Wave 16 — generative civilization presence (Phases 401–500).
  gpKernel?: CivilizationCoherenceRuntimeReading;
  gpPresGov?: GenerativePresenceGovernorReading;
  gpBoundary?: GenerativePresenceBoundaryReading;
  gpPresCheck?: GenerativePresencePresenceCheckReading;
  gpField?: CivilizationPresenceFieldReading;
  gpHope?: CoherentHopeArchitectureReading;
  gpBeautyAsTruth?: BeautyAsTruthValidatorReading;
  gpWatchdog?: GenerativePresenceWatchdogReading;
  gpAcct?: GenerativeAccountabilityReading;
  gpHealth?: GenerativePresenceHealthCheckReading;
  gpFlourScore?: CivilizationFlourishingScoreReading;
  gpIntCoh?: GenerativeIntegrityCoherenceReading;
  gpDignity?: GenerativePresenceDignityCheckReading;
  gpPresCoh?: GenerativePresenceCoherenceReading;
  gpNonManip?: NonManipulativeInfluenceReading;
  gpInvGov?: InvitationOverPersuasionReading;
  gpAntiPress?: AntiPressurePresenceReading;
  gpService?: PresenceAsServiceReading;
  gpNoPredate?: PresenceWithoutPredationReading;
  gpNoOptEng?: AntiEngagementOptimizationReading;
  gpBeautyOverSpec?: BeautyOverSpectacleGovernorReading;
  gpQuietAuth?: QuietAuthorityReading;
  gpGift?: SymbolicGiftReading;
  gpAntiCol?: AntiColonizationLayerReading;
  gpNotOwn?: PresenceWithoutOwnershipReading;
  gpAntiOther?: AntiOtheringReading;
  gpAntiCyn?: AntiCynicismFieldReading;
  gpAntiNih?: AntiNihilismRuntimeReading;
}

export function decideFinalVerdict(input: MetaInput): FinalVerdict {
  const { ctx, scrollStop, taste, psychology, productPresence, reference, memory,
          judge, reaction, fatigue, antiAI, rhythmWorsen, job, direction,
          visualTaste, emotionalAftertaste, campaignMemoryV2,
          perceptionCriticVerdict, campaignIdentity,
          gravity, negativeSpace, compositionRhythm8,
          productPresence8, framing8, directorVerdict,
          sequenceVerdict, tempoWorsen, absenceDecision,
          contradictionReading, objectMemoryGraph,
          compressionReading, syntheticReading, cinematicVerdict,
          humanContradiction, nonPerformative, lifeNoise,
          sharedPattern, collectiveRecognition, unspokenRitualPick, culturalDriftReading,
          realityPressureReading, consequenceReading, invisibleStakesReading, functionalCollapseReading,
          avoidanceReading, numbingReading, maskingReading, unfeltReading,
          truthPersistenceReport, realityVerificationReading, emotionalDecayReading, generationPressureReading,
          privateLanguageReading, realityWeightingReading,
          systemicCauseReading, attentionFragmentationReading, environmentalSystemReading,
          recoveryFailureReading, cognitiveResidueReading,
          behaviorLoopReading, microEscapeReading, ritualCompensationReading,
          fakeRecoveryReading, silentCopingReading, behavioralResidueReading,
          socialMaskingEngineReading, highFunctioningBurnoutReading,
          identityMaintenanceReading, emotionalCamouflageReading,
          publicPrivateSplitReading, maskFatigueReading,
          desireArchitectureReading, quietStatusReading, emotionalHungerReading,
          validationSystemsReading, invisibleEnvyReading, aspirationalGapReading,
          socialGravityReading, collectiveMovementReading, culturalAccelerationReading,
          groupAnxietyReading, viralPatternsReading, socialPermissionReading,
          ritualFormationReading, attachmentLoopsReading, symbolicSafetyReading,
          emotionalReturnReading, privateRitualMemoryReading, repeatedComfortReading,
          internalNarrativeReading, selfStoryReading, identityContinuityReading,
          meaningSystemsReading, selfTranslationReading, personalMythologyReading,
          emotionalForecastReading, behaviorPredictionReading, collapseProbabilityReading,
          recoveryAttemptReading, pressureTrajectoryReading, emotionalDriftReading,
          autonomousNarrativeReading, culturalSignalEvolutionReading,
          selfUpdatingPsychologyReading, emergentCampaignMemoryReading,
          collectiveRealityTrackingReading, adaptiveEmotionalIntelligenceReading,
          unifiedGraphReading,
          cognitiveField, emotionalPhysicsReading, tensionTopologyReading,
          contradictionResolution,
          cognitiveContinuity, runtimeDrift, priorNextRunDirective,
          nervousSystemReading, attentionPhysicsReading, visualCognitionReading,
          emotionalContinuityReading, audienceFeedbackReading, antiOptimizationReading,
          identityPersistenceReading, autonomousDirectionReading, realityExecution,
          strategicPriorityReading, cognitiveEnergyReading, temporalPsychologyReading,
          identityGovernanceReading, campaignLifecycleReading, executiveWorldState,
          worldUnderstanding, executiveDecision,
          councilSession, internalDebate, councilConflict, executiveConsensus,
          strategicConsciousness,
          civLaws, civScars, civEthics, civStability, civIdeologicalMutation,
          civIdentityContinuity,
          orgEnvironmental, orgImmune, orgEnergy, orgClimate, orgIdentityStress,
          orgExpansion, orgRhythm, orgAttentionForecast, orgMemetic, orgFatigue,
          orgSilence, orgEmotionalResource, orgAdaptiveWorldModel, orgComplexity,
          orgEvolutionGovernance, orgAdaptiveRuntime, orgStabilityPreservation,
          orgExistentialRisk, orgCore,
          osKernel, osInterrupts, osResources, osCognitionGraph, osDirective,
          osLoops, osPause, osHealth, osMemoryPressure, osMultiHorizon,
          osReflection, osIdentityEnforcement, osSeason, osDependencies,
          osStabilization, osExecutiveState, osScheduler, osTaskQueue, osCore,
          cplEngagementTruth, cplSaturation, cplTrust, cplClimate, cplAudience,
          cplPlatformDrift, cplAuthenticity, cplSilence, cplReputation, cplMeaning,
          cplSocialExhaustion, cplAttentionEconomy, cplContradiction, cplWorldFeedback,
          cplResonance, cplGovernor, cplExternalModel, cplHealth, cplCore,
          futNarrative, futReputation, futTrustCompounding, futMarketTiming, futPatience,
          futSecondOrder, futAntifragility, futBlackSwan, futCompetitor, futEcosystem,
          futIdentityContinuity, futOpportunityCost, futCompounding, futStrategicDebt,
          futLongHorizonRisk, futIrreversibility, futOptionality, futGenerational,
          futIdentity, futConviction, futCoherence, futGovernor, futCore,
          actAuth, actExistence, actPublish, actSilenceEnforcement, actTrustOpt,
          actAudienceRecovery, actRisk, actNarrativeCont, actResonancePreserving,
          actCompulsion, actDignity, actLoad, actOverreach, actReversibility,
          actDeploymentWindow, actRestraintBudget, actIntent, actCadence, actThrottle,
          actWorthiness, actWithholding, actPortfolio, actHealth, actBoundary,
          actAccountability, actCoherence, actGovernor, actCore,
          actConsequence, actEscalation, actMutation, actFeedbackLoop, actPlatform,
          actExperimentation, actPacing,
          fbCore, fbGovernor, fbContradictions, fbSignalIntegrity, fbCoherence,
          fbEcology, fbFalseSuccess, fbCounterNarrative, fbAttribution,
          fbIdentityCorrection, fbIdentityBridge, fbTrustShift, fbTrustGraph,
          fbResonanceDecay, fbMeaning, fbAuthenticity, fbNervousSystem, fbMemetic,
          fbStrategyAdjust, fbExecRefine, fbEmotionalTruth, fbSentimentDrift,
          fbLatency, fbBiasFilter, fbSilenceImpact, fbSilenceAsFeedback,
          fbSlowTruth, fbGenre, fbSecondHand, fbImpactCurve,
          lcKernel, lcGovernor, lcCrisis, lcBoundary, lcImpact, lcAttribAudit,
          lcCoherence, lcDrift, lcStress, lcMeaningVsNov, lcSilenceTiming,
          lcPresenceVer, lcPresenceCheck, lcIntegrity, lcSentimentField,
          lcWeather, lcCouplingHealth, lcLivingRep, lcMutation, lcResonanceDir,
          lcSpreadVel, lcOpportunity, lcMoodVel, lcCollectivePulse,
          lcNarrOrient, lcAnchor, lcHealthBal, lcDignity, lcCadence,
          lcAttDecay, lcDriftCorr, lcSlowAmp,
          idKernel, idGovernor, idInvariants, idCapture, idTruthOverPop,
          idBoundary, idBetrayal, idMemeticCorr, idAntiAssim, idResonanceSov,
          idNarrSov, idPrincViol, idCenterGrav, idCoherValid, idWatchdog,
          idHealth, idApprovalChase, idPopulistDrift, idMirroring,
          idResilience, idCoherUnder, idSelfRec, idShape, idVoiceCons,
          idValDep, idReactive, idTrendPull, idAntiAdapt, idStormImm,
          idCultGrav, idSelfErase, idAlienBel, idSelfReadout, idActFilter,
          idCaptureRisk, idForce, idCohesion, idFid,
          gpKernel, gpPresGov, gpBoundary, gpPresCheck, gpField, gpHope,
          gpBeautyAsTruth, gpWatchdog, gpAcct, gpHealth, gpFlourScore, gpIntCoh,
          gpDignity, gpPresCoh, gpNonManip, gpInvGov, gpAntiPress, gpService,
          gpNoPredate, gpNoOptEng, gpBeautyOverSpec, gpQuietAuth, gpGift,
          gpAntiCol, gpNotOwn, gpAntiOther, gpAntiCyn, gpAntiNih } = input;

  // Brutality rises with the campaign's history — if recent banners have
  // approved easily, raise the bar; if many rejections recently, hold
  // steady. This is the spec's "rejection system" learning behavior.
  const brutality = clampUnit((input.brutality ?? 0.65) + brutalityFromMemory(memory));

  // Composite totals.
  const scrollStopTotal = compositeScrollStop(scrollStop);
  const tasteTotal = compositeTaste(taste);
  const psychologyTotal = compositePsychology(psychology);
  const productTotal = productPresence ? compositePresence(productPresence) : null;

  const totals: FinalVerdict['totals'] = {
    scrollStop: scrollStopTotal,
    taste: tasteTotal,
    psychology: psychologyTotal,
    productPresence: productTotal,
    referenceCloseness: reference.closeness,
  };

  // Floors scale with brutality. At brutality 0.7:
  //  - scrollStop must be >= 6.0
  //  - taste must be <= 4.0 (lower is better — it's a failure score)
  //  - psychology must be >= 5.5
  //  - product (if present) must be >= 6.0
  //  - reference closeness must be >= 0.55
  const floorScrollStop      = 5.0 + brutality * 1.5;
  const ceilingTaste         = 5.5 - brutality * 1.5;
  const floorPsychology      = 4.5 + brutality * 1.5;
  const floorProduct         = 5.0 + brutality * 1.5;
  const floorRefCloseness    = 0.45 + brutality * 0.15;

  const reasons: string[] = [];
  let verdict: FinalVerdict['verdict'] = 'approve';

  // Hard gates — fire only at sufficient brutality. At low brutality the
  // taste rejection rolls into the soft accumulator below.
  if (taste.verdict === 'taste-reject' && brutality >= 0.75) {
    reasons.push(...taste.reasons);
    verdict = 'reject-taste';
  }
  if (productPresence?.verdict === 'pasted') {
    reasons.push(...productPresence.reasons);
    verdict = 'reject-image';
  }

  // ─── Phase 2.5 hard gates ─────────────────────────────────────
  // The TasteJudge has its own hard verdict — when it says hard-refuse,
  // the meta-critic refuses regardless of brutality. This is the
  // "comfortable not generating" rule from the spec.
  if (judge && judge.verdict === 'hard-refuse') {
    reasons.push(`taste judge hard-refused: ${judge.punishments.slice(0, 2).join('; ')}`);
    verdict = 'reject-taste';
  }
  // Soft-refuse from the judge fires at default brutality and up.
  if (judge && judge.verdict === 'soft-refuse' && brutality >= 0.65 && verdict === 'approve') {
    reasons.push(`taste judge soft-refused: ${judge.punishments.slice(0, 2).join('; ')}`);
    verdict = 'reject-taste';
  }
  // The human-reaction simulator's scroll-past prediction is a HARD gate.
  // If the prediction says the viewer scrolls past at 0.3s, refusal is mandatory.
  if (reaction && reaction.scrollPast) {
    reasons.push(`predicted scroll-past at 0.3s — ${reaction.at_0_3s} into ${reaction.at_1s}`);
    verdict = 'reject-concept';
  }
  // Visual fatigue is a hard gate at brutal mode; soft pressure at default.
  if (fatigue && fatigue.verdict === 'fatigued' && brutality >= 0.8) {
    reasons.push(`campaign fatigue: ${fatigue.flags.slice(0, 2).join('; ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 3 hard gates ───────────────────────────────────────
  // Asset-job contract enforcement — a "no-product" job that ships
  // a banner with a visible product is a contradiction.
  if (job && job.constraints.productMustBeAbsent && direction && direction.productRole !== 'hidden') {
    reasons.push(`job "${job.job}" requires productRole=hidden but direction is "${direction.productRole}"`);
    verdict = 'reject-concept';
  }

  // Anti-AI smell is a HARD gate at brutal mode; soft pressure at default.
  if (antiAI && antiAI.smell >= 6 && brutality >= 0.75) {
    reasons.push(`anti-AI smell ${antiAI.smell.toFixed(1)} — signatures: ${antiAI.signatures.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // Rhythm worsening — when the campaign is imbalanced and this banner
  // would push the imbalance further, reject at default brutality and up.
  if (rhythmWorsen && rhythmWorsen.worsens && brutality >= 0.6) {
    reasons.push(`rhythm: ${rhythmWorsen.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 4 — reality-loop signals ───────────────────────────
  // Aftertaste is the new primary success metric. A banner with a
  // strong predicted scroll-stop but weak predicted aftertaste is
  // exactly the "engagement spike with no brand residue" the spec
  // told us to refuse.
  if (input.aftertastePrediction) {
    const a = input.aftertastePrediction;
    const aftertasteFloor = 4.0 + brutality * 1.5;
    if (a.residueStrength < aftertasteFloor) {
      const note = `predicted aftertaste ${a.residueStrength.toFixed(1)} below floor ${aftertasteFloor.toFixed(1)} — "${a.memoryPhrase}"`;
      if (brutality >= 0.75) {
        reasons.push(note);
        if (verdict === 'approve') verdict = 'reject-concept';
      } else {
        // soft pressure at default
        // (handled in the softReasons collection below)
      }
    }
  }

  // Atmosphere — block banners that would collapse the brand into a
  // single mood (uniformity penalty engaged).
  if (input.atmosphere && input.atmosphere.uniformityPenalty >= 5 && brutality >= 0.7) {
    reasons.push(`atmosphere uniformity penalty ${input.atmosphere.uniformityPenalty.toFixed(1)} — campaign collapsing into one mood`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 5 hard gates ───────────────────────────────────────
  // Visual taste verdict — when the engine names a rejection reason,
  // the meta-critic respects it. Hard at brutal, soft at default.
  if (visualTaste && visualTaste.rejection_reason) {
    if (brutality >= 0.75) {
      reasons.push(`visual-taste: ${visualTaste.rejection_reason}`);
      if (verdict === 'approve') verdict = 'reject-taste';
    }
  }
  // Hard forbidden-AI patterns — automatic refusal at brutal.
  if (visualTaste && visualTaste.forbiddenPatternsHit.some((p) => p.severity === 'hard') && brutality >= 0.7) {
    const hard = visualTaste.forbiddenPatternsHit.filter((p) => p.severity === 'hard');
    reasons.push(`forbidden-AI: ${hard.map((p) => p.name).join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Emotional aftertaste composite — the new primary success metric.
  // Replaces engagement-spike with brand-residue.
  if (emotionalAftertaste && emotionalAftertaste.composite < (4.0 + brutality * 1.5)) {
    if (brutality >= 0.75) {
      reasons.push(`emotional aftertaste ${emotionalAftertaste.composite.toFixed(1)} below floor — ${emotionalAftertaste.post_view_emotional_state}`);
      if (verdict === 'approve') verdict = 'reject-concept';
    }
  }
  // Campaign memory v2 — when the campaign is at risk of collapsing into
  // one mood AND this banner would worsen it (same closing reaction as
  // dominant), reject.
  if (campaignMemoryV2 && campaignMemoryV2.atmosphereAtRisk && reaction && campaignMemoryV2.dominantClosingReaction === reaction.at_3s) {
    reasons.push(`campaign atmosphere at risk — this banner would repeat the dominant "${reaction.at_3s}" closing`);
    if (verdict === 'approve' && brutality >= 0.65) verdict = 'reject-concept';
  }

  // ─── Phase 7 hard gates ───────────────────────────────────────
  // Perception critic is the HIGHEST-LEVEL critic. Its 'refuse' verdict
  // is mandatory at brutal, soft at default.
  if (perceptionCriticVerdict) {
    if (perceptionCriticVerdict.verdict === 'refuse' && brutality >= 0.7) {
      reasons.push(`perception critic refused: ${perceptionCriticVerdict.rejection_reason ?? '—'}`);
      if (verdict === 'approve') verdict = 'reject-concept';
    }
    if (perceptionCriticVerdict.scores.emotionally_manipulative >= 7 && brutality >= 0.65) {
      reasons.push(`perception: emotionally manipulative ${perceptionCriticVerdict.scores.emotionally_manipulative.toFixed(1)}/10`);
      if (verdict === 'approve') verdict = 'reject-taste';
    }
    if (perceptionCriticVerdict.scores.ai_aware >= 8 && brutality >= 0.7) {
      reasons.push(`perception: reads as AI-aware ${perceptionCriticVerdict.scores.ai_aware.toFixed(1)}/10`);
      if (verdict === 'approve') verdict = 'reject-taste';
    }
    // The spec's PRIMARY success metric — "silent emotional recognition".
    // If nobody would save this silently, the banner is not worth shipping.
    if (perceptionCriticVerdict.silent_emotional_recognition < (3.5 + brutality * 2) && brutality >= 0.7) {
      reasons.push(`silent emotional recognition ${perceptionCriticVerdict.silent_emotional_recognition.toFixed(1)} — no one would save this`);
      if (verdict === 'approve') verdict = 'reject-concept';
    }
  }

  // (campaign identity soft warning added to softReasons below)

  // ─── Phase 8 hard gates ───────────────────────────────────────
  // Visual gravity — if the layout has competing anchors or no clear
  // focal at all, the eye does not land anywhere on purpose.
  if (gravity && gravity.rejection_reason && brutality >= 0.65) {
    reasons.push(`visual gravity: ${gravity.rejection_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Negative space — forbidden centered layouts under ENERGY/FOCUS.
  if (negativeSpace && negativeSpace.reject_centered && brutality >= 0.65) {
    reasons.push(`negative space: ${negativeSpace.rejection_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Composition rhythm — repeated template-shape geometry.
  if (compositionRhythm8 && compositionRhythm8.would_repeat && brutality >= 0.7) {
    reasons.push(`composition rhythm: ${compositionRhythm8.repeated_pattern}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Layout director — the "would removing 40% improve this?" gate.
  if (directorVerdict && directorVerdict.would_improve_with_subtraction && brutality >= 0.7) {
    reasons.push(`director: would improve with subtraction — remove ${directorVerdict.subtraction_target ?? 'one visible element'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Layout director — named hard-reject conditions.
  if (directorVerdict && directorVerdict.rejection_conditions.length > 0 && brutality >= 0.7) {
    reasons.push(`director: ${directorVerdict.rejection_conditions.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 9 hard gates ───────────────────────────────────────
  // The spec's HARD RULE: no two consecutive banners can solve the
  // same emotion. Enforced as a hard gate at brutal+; at default it
  // becomes soft pressure (below). When the state selector cannot
  // honestly produce a different closing reaction we accept the
  // repetition rather than exhaust the campaign.
  if (sequenceVerdict && sequenceVerdict.redundant_with_previous && brutality >= 0.85) {
    reasons.push(`emotional sequence: candidate "${sequenceVerdict.candidate_note}" repeats previous banner — campaign needs to evolve`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Tempo worsening — refuse at brutal mode only; soft pressure at
  // default. The Creative Director's rhythm-rescue should already
  // handle most cases before they reach here.
  if (tempoWorsen && tempoWorsen.worsens && brutality >= 0.8) {
    reasons.push(`visual tempo: ${tempoWorsen.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Contradiction feels constructed (over-literary, not observed) —
  // refuse at brutal mode.
  if (contradictionReading && contradictionReading.feels_constructed && brutality >= 0.75) {
    reasons.push('emotional contradiction reads as rhetorical, not observed');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Object spoken too loudly — when the campaign's loudest object is
  // already at emotional weight 9+ AND the candidate brief will use it
  // again, refuse. (Object detection happens before this critic; we
  // use the graph's loudest as a proxy.)
  if (objectMemoryGraph && objectMemoryGraph.loudest && objectMemoryGraph.loudest.emotionalWeight >= 9 && brutality >= 0.75) {
    reasons.push(`object "${objectMemoryGraph.loudest.objectId}" has spoken too loudly (${objectMemoryGraph.loudest.emotionalWeight.toFixed(1)}/10) — rest the motif`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 10 hard gates ──────────────────────────────────────
  // Cinematic brain refusal — the master mind says no.
  if (cinematicVerdict && cinematicVerdict.refuses && brutality >= 0.7) {
    reasons.push(`cinematic brain: ${cinematicVerdict.refusal_reason ?? '—'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The spec's new frontier metric — "would this stay inside someone
  // for three seconds after they kept scrolling?" — hard gate at brutal.
  if (cinematicVerdict && !cinematicVerdict.three_second_test.passes && brutality >= 0.85) {
    reasons.push(`three-second test failed (${cinematicVerdict.three_second_test.score.toFixed(1)}/10) — ${cinematicVerdict.three_second_test.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Synthetic behaviour at brutal mode — designed-not-observed is
  // automatically refused.
  if (syntheticReading && syntheticReading.reads_as_designed && brutality >= 0.8) {
    reasons.push(`anti-synthetic: reads as designed — ${syntheticReading.signatures.slice(0, 2).join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Literal storytelling — compression engine flagged it.
  if (compressionReading && compressionReading.literal_storytelling && brutality >= 0.75) {
    reasons.push('emotional compression: literal storytelling — banner is showing more than implying');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 11 hard gates ──────────────────────────────────────
  // THE NEW HEADLINE QUESTION:
  //   "Does this feel like a human moment that happened, or a
  //    creative system trying to simulate one?"
  // If the simulation is stronger → refuse at default mode and up.
  if (nonPerformative && nonPerformative.trying_to_simulate && brutality >= 0.65) {
    reasons.push(`non-performative: simulating depth instead of observing it — ${nonPerformative.patterns.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Contradiction resolved too cleanly — the system tried to wrap up
  // what humans normally leave open.
  if (humanContradiction && humanContradiction.resolved_too_cleanly && brutality >= 0.75) {
    reasons.push('human contradiction resolved too cleanly — the truth tied a bow on what should stay open');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Life noise floor — at brutal, a banner with zero non-symbolic
  // fragments reads as too-curated.
  if (lifeNoise && lifeNoise.mess_score < 4 && brutality >= 0.85) {
    reasons.push(`life noise ${lifeNoise.mess_score.toFixed(1)}/10 — no honest mess in the frame`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 12 hard gates ──────────────────────────────────────
  // THE NEW HEADLINE QUESTION:
  //   "Does this feel like culture quietly recognizing itself?"
  // When no shared pattern matches AND the banner reads as individual-
  // only, the campaign is "another ad about him", not "this is about us".
  if (collectiveRecognition && collectiveRecognition.is_individual_only && !collectiveRecognition.pattern && brutality >= 0.7) {
    reasons.push('collective recognition: reads as one specific person, not culture recognising itself');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Cultural drift — the treatment is already in mass circulation.
  // Hard reject at brutal mode.
  if (culturalDriftReading && culturalDriftReading.feels_culturally_consumed && brutality >= 0.75) {
    reasons.push(`cultural drift: ${culturalDriftReading.detected_cliches.join(', ')} — treatment is already culturally consumed`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Collective recognition score floor — at brutal, banners that
  // do not earn collective recognition refuse.
  if (collectiveRecognition && collectiveRecognition.recognition_score < (3 + brutality * 3) && brutality >= 0.8) {
    reasons.push(`collective recognition ${collectiveRecognition.recognition_score.toFixed(1)} below floor — would not produce "this is about us"`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Shared pattern present but truth phrased individually — soft refuse.
  if (sharedPattern && collectiveRecognition && collectiveRecognition.inclusive_phrasing_score < 3 && brutality >= 0.8) {
    reasons.push(`pattern "${sharedPattern.id}" is collective but truth phrased individually`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 13 hard gates ──────────────────────────────────────
  // THE NEW HEADLINE QUESTION:
  //   "Does this frame contain pressure, or only aesthetics?"
  // If pressure is decoratively emotional with no consequence and
  // the truth reads as generic, the banner has no reason to exist.
  if (realityPressureReading && realityPressureReading.reads_generic &&
      consequenceReading && consequenceReading.decorative_emotion && brutality >= 0.7) {
    reasons.push('reality pressure: only aesthetics, no pressure — banner is decoratively emotional with no real stakes');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Functional collapse mistake — banner is performing VISIBLE collapse
  // (cinematic suffering) instead of capturing FUNCTIONAL collapse.
  if (functionalCollapseReading && functionalCollapseReading.type === 'visible' && brutality >= 0.75) {
    reasons.push(`functional collapse: showing collapse instead of functioning-while-collapsing — cinematic suffering risk`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // "Accidentally true" floor — at brutal mode, banners that score
  // below 4 on accidentally-true reads as "creatively impressive"
  // (the spec's named failure mode).
  if (functionalCollapseReading && functionalCollapseReading.accidentally_true_score < 4 && brutality >= 0.85) {
    reasons.push(`accidentally-true score ${functionalCollapseReading.accidentally_true_score.toFixed(1)}/10 — banner is creatively impressive, not accidentally true`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Stakes clarity floor — at brutal, banners with no stakes refuse.
  if (consequenceReading && consequenceReading.decorative_emotion && brutality >= 0.85) {
    reasons.push(`consequence engine: no real stake — what happens if nothing changes is uncomputable`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 14 hard gates ──────────────────────────────────────
  // THE PHASE 14 HEADLINE QUESTION:
  //   "Does the character know what they are feeling,
  //    or is the viewer realizing it before they are?"
  // If the truth names the feeling directly (character is aware,
  // viewer is told), reject at brutal — the spec wants behavior
  // leaking the truth, not language naming it.
  if (unfeltReading && unfeltReading.character_self_awareness >= 8 && !unfeltReading.viewer_realizes_before_character && brutality >= 0.8) {
    reasons.push(`unfelt emotion: character explains their own feeling — viewer is told instead of realising`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Therapy content vocabulary is automatic refusal at brutal.
  if (unfeltReading && unfeltReading.reads_as_therapy_content && brutality >= 0.75) {
    reasons.push(`unfelt emotion: therapy-content vocabulary present — ${unfeltReading.therapy_signatures.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Avoidance: truth names feeling instead of substitute behaviour.
  // (Phase 14 wants behavior replacing feeling — when the truth names
  // the feeling directly, refuse at brutal.)
  if (avoidanceReading && avoidanceReading.feeling_named_directly && brutality >= 0.8) {
    reasons.push('emotional avoidance: truth names the feeling instead of showing the substitute behaviour');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 15 hard gates ──────────────────────────────────────
  // THE PHASE 15 HEADLINE QUESTION:
  //   "Would this still feel psychologically true six months from
  //    now, or only creatively impressive today?"
  // Encoded as: emotional decay status === 'decorative' → reject at
  // default mode and up. The truth has become aesthetic recognition.
  if (emotionalDecayReading && emotionalDecayReading.status === 'decorative' && brutality >= 0.65) {
    reasons.push(`emotional decay: decorative${emotionalDecayReading.decorative_mode ? ` (${emotionalDecayReading.decorative_mode})` : ''} — would not feel true six months from now`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Generation pressure forces disruption — refuse banners that match
  // the recursive pattern at default+ when force_disruption is set.
  if (generationPressureReading && generationPressureReading.force_disruption && brutality >= 0.65) {
    reasons.push(`generation pressure HIGH (${generationPressureReading.pressure_score.toFixed(1)}/10) — campaign needs disruption: ${generationPressureReading.disruption_directives[0] ?? 'break recursion'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Reality verification — when historical signals are STRONGLY
  // NEGATIVE (negative reactions, no recognition), refuse repeating
  // this truth. Only fires when we have signal volume on related
  // banners.
  if (realityVerificationReading && realityVerificationReading.rates.negative_rate >= 0.05 && brutality >= 0.75) {
    reasons.push(`reality verification: ${(realityVerificationReading.rates.negative_rate * 100).toFixed(1)}% negative reactions on related signals — audience has rejected this truth`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 16 hard gates ──────────────────────────────────────
  // THE PHASE 16 HEADLINE QUESTION:
  //   "Was this emotional truth DISCOVERED FROM REALITY, or
  //    GENERATED FROM INTERNAL AESTHETICS?"
  // If the truth resonates with NO deep ingestion signal AND the
  // private-language register is poor, the banner is invented, not
  // observed. Refuse at brutal.
  if (realityWeightingReading && realityWeightingReading.generated_from_aesthetics_only &&
      privateLanguageReading && !privateLanguageReading.is_unguarded &&
      brutality >= 0.8) {
    reasons.push('reality weighting: truth resonates with NO deep ingestion signal AND register is not unguarded — generated from aesthetics, not discovered from reality');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Private-language performative signatures — therapy / TikTok /
  // poetry vocabulary in the truth is an automatic refusal at brutal.
  if (privateLanguageReading && privateLanguageReading.performative_signatures.length > 0 && brutality >= 0.75) {
    reasons.push(`private language: performative vocabulary present — ${privateLanguageReading.performative_signatures.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 17 hard gates ──────────────────────────────────────
  // THE NEW HEADLINE QUESTION:
  //   "Does this emotional state feel CAUSED BY MODERN SYSTEMS,
  //    or merely DESCRIBED AESTHETICALLY?"
  // If no systemic cause matches AND there is also no cognitive
  // residue AND no recovery failure pattern, the banner is feeling-
  // without-machinery. Refuse at brutal.
  if (systemicCauseReading && !systemicCauseReading.has_systemic_cause &&
      cognitiveResidueReading && cognitiveResidueReading.detected.length === 0 &&
      recoveryFailureReading && !recoveryFailureReading.primary_failure &&
      brutality >= 0.8) {
    reasons.push('systemic pressure: emotional state described aesthetically without any structural cause — no system, no residue, no recovery failure');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The truth describes successful recovery — suspicious in modern
  // life. The system rarely produces banners with that texture; when
  // it does, it is usually fake.
  if (recoveryFailureReading && recoveryFailureReading.describes_successful_recovery && brutality >= 0.75) {
    reasons.push('recovery failure: truth describes successful recovery — rare in modern life; reads as fake');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 18 hard gates ──────────────────────────────────────
  // THE NEW HEADLINE QUESTION:
  //   "Does this behavior feel like something humans QUIETLY DO every
  //    day WITHOUT NOTICING — or does it feel cinematic, performative,
  //    over-symbolic, written, inspirational, or socially performative?"
  // Refuse when the banner romanticises survival behaviour.
  if (ritualCompensationReading && ritualCompensationReading.romanticisation_detected && brutality >= 0.7) {
    reasons.push('ritual compensation: truth romanticises a compensation ritual (uses wellness vocabulary) — banner sells self-care instead of observing reality');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Refuse when the banner PERFORMS rest (uses cultural alibi or
  // performance verbs around a fake-recovery ritual).
  if (fakeRecoveryReading && fakeRecoveryReading.performs_rest && brutality >= 0.75) {
    reasons.push('fake recovery: banner reads as PERFORMING rest, not actually resting');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Refuse when the truth NAMES a silent-coping move that is supposed
  // to be unnamed.
  if (silentCopingReading && silentCopingReading.truth_names_the_move && brutality >= 0.8) {
    reasons.push('silent coping: truth uses therapy / regulation vocabulary — silent coping must be observed, not labelled');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Refuse a banner that aestheticises sadness without showing any
  // actual survival behavior — no loop, no escape, no ritual, no
  // silent coping. That is "sadness aesthetics" without observation.
  // Triggers when the recoveryFailure reading is empty AND the truth
  // shows no behavioral evidence either — pure feeling, no body.
  if (brutality >= 0.85 &&
      behaviorLoopReading && !behaviorLoopReading.primary_loop &&
      microEscapeReading && !microEscapeReading.primary &&
      ritualCompensationReading && !ritualCompensationReading.primary &&
      silentCopingReading && !silentCopingReading.primary &&
      recoveryFailureReading && !recoveryFailureReading.primary_failure) {
    reasons.push('survival: NO observed survival behavior (no loop, no escape, no ritual, no coping, no failure) — sadness aesthetics without behavioral evidence');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Refuse when the behavioral residue says "carries weeks" but the
  // truth has no timeline awareness — the photograph claims weight it
  // does not earn.
  if (behavioralResidueReading && brutality >= 0.8 &&
      behavioralResidueReading.carryover_score >= 7 &&
      behavioralResidueReading.timeline_awareness < 4) {
    reasons.push('behavioral residue: body claims to carry weeks but truth photographs only today');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Refuse a banner that shows a conscious-staged coping move — the
  // primary loop is "conscious" and the silent-coping is named.
  if (brutality >= 0.85 &&
      behaviorLoopReading?.primary_loop?.classification === 'conscious' &&
      silentCopingReading?.truth_names_the_move) {
    reasons.push('survival: consciously-staged coping with named regulation vocabulary — performance, not observation');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 19 hard gates ──────────────────────────────────────
  // THE NEW HEADLINE QUESTION:
  //   "Does this feel like a human TRYING TO REMAIN FUNCTIONAL FOR
  //    OTHER PEOPLE — or expressive, cinematic, performatively sad,
  //    self-aware, optimised-for-relatability?"
  //
  // Refuse when the truth says the quiet part out loud — the mask is
  // broken and the banner becomes performative-vulnerability.
  if (socialMaskingEngineReading && socialMaskingEngineReading.truth_reveals_too_much && brutality >= 0.75) {
    reasons.push('social masking: truth reveals too much — mask broken; banner becomes performative-vulnerability');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Refuse when burnout is made visible too early — visible-suffering
  // aesthetics instead of high-functioning concealment.
  if (highFunctioningBurnoutReading && highFunctioningBurnoutReading.burnout_visible_too_early && brutality >= 0.75) {
    reasons.push('high-functioning burnout: exhaustion becomes visually obvious too early — banner is visible-burnout aesthetics, not hidden burnout');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Refuse when the subject names their own role — banner becomes
  // self-aware instead of observed.
  if (identityMaintenanceReading && identityMaintenanceReading.subject_names_their_role && brutality >= 0.8) {
    reasons.push('identity maintenance: subject names their own role — banner is self-aware instead of caught mid-performance');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Refuse when emotional camouflage is described analytically rather
  // than caught — the truth EXPLAINS the mask instead of catching it.
  if (emotionalCamouflageReading && emotionalCamouflageReading.too_analytic && brutality >= 0.8) {
    reasons.push('emotional camouflage: truth uses analytic voice (names the mask) — banner explains instead of photographs');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Refuse a banner that claims identity-pressure but shows no
  // maintenance signature — identity performance becomes symbolic,
  // not behavioral.
  if (identityMaintenanceReading && brutality >= 0.85 &&
      identityMaintenanceReading.identity_pressure >= 7 &&
      !identityMaintenanceReading.maintenance_signature_visible) {
    reasons.push('identity maintenance: identity pressure high but no maintenance signature observed — performance is symbolic, not behavioral');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Refuse when the truth misattributes mask fatigue to work fatigue —
  // the banner mistakes one currency for another, missing the central
  // Phase 19 insight.
  if (maskFatigueReading && maskFatigueReading.fatigue_misattributed && brutality >= 0.8) {
    reasons.push('mask fatigue: truth attributes fatigue to work but body is exhausted from the mask — banner misses the cause');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Refuse a banner that LACKS social consequence — high mask signal
  // but no observable social cost. The mask must cost something or it
  // is not a mask, it is decoration.
  if (brutality >= 0.85 &&
      socialMaskingEngineReading && socialMaskingEngineReading.mask_signature_strength >= 6 &&
      maskFatigueReading && maskFatigueReading.mask_fatigue_score < 4 &&
      identityMaintenanceReading && identityMaintenanceReading.identity_cost < 4) {
    reasons.push('social masking: mask present but with no observed cost — banner shows the mask without showing what it costs to wear');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Refuse a banner that aestheticises collapse — collapse is
  // photographed openly while the high-functioning-burnout signal is
  // weak (output is NOT unchanged). That is theatrical burnout.
  if (brutality >= 0.75 &&
      highFunctioningBurnoutReading &&
      highFunctioningBurnoutReading.burnout_visible_too_early &&
      highFunctioningBurnoutReading.functional_output_unchanged < 4) {
    reasons.push('high-functioning burnout: collapse is shown openly with no remaining functioning — banner is theatrical burnout');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 20 hard gates ──────────────────────────────────────
  // THE HEADLINE QUESTION:
  //   "Does this desire feel emotionally inevitable, or creatively
  //    manufactured?"
  if (desireArchitectureReading && desireArchitectureReading.uses_forbidden_framing && brutality >= 0.7) {
    reasons.push('desire architecture: truth uses influencer / wellness / luxury framing — desire is manufactured, not inevitable');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  if (quietStatusReading && brutality >= 0.75 &&
      (quietStatusReading.luxury_contamination >= 5 || quietStatusReading.productivity_porn_risk >= 5)) {
    reasons.push('status without status: signal contaminated by luxury / productivity-porn vocabulary');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  if (invisibleEnvyReading && brutality >= 0.75 &&
      (invisibleEnvyReading.social_media_contamination >= 5 || invisibleEnvyReading.luxury_envy_contamination >= 5)) {
    reasons.push('invisible envy: envy framed as social-media comparison or luxury — Phase 20 forbids performative envy');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  if (aspirationalGapReading && aspirationalGapReading.uses_marketing_vocab && brutality >= 0.75) {
    reasons.push('aspirational identity gap: aspirational-marketing vocabulary present — longing reads as motivational, not lived');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 21 hard gates ──────────────────────────────────────
  // THE HEADLINE QUESTION:
  //   "Does this feel socially lived, or individually dramatized?"
  if (viralPatternsReading && viralPatternsReading.uses_over_circulated && brutality >= 0.7) {
    reasons.push(`viral emotion patterns: truth uses over-circulated viral vocabulary — ${viralPatternsReading.hits.map((h) => h.id).join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  if (socialGravityReading && socialGravityReading.individually_dramatized &&
      socialGravityReading.primary && brutality >= 0.8) {
    reasons.push('social gravity: a collective field is present but the truth is dramatized at the individual level — emotion isolated from culture');
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 22 hard gates ──────────────────────────────────────
  // THE HEADLINE QUESTION:
  //   "Would this ritual still exist if nobody ever saw it?"
  if (repeatedComfortReading && repeatedComfortReading.comfort_is_designed && brutality >= 0.7) {
    reasons.push('repeated comfort systems: comfort is framed as branded / optimised — Phase 22 forbids designed comfort');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  if (symbolicSafetyReading && symbolicSafetyReading.object_named_too_directly && brutality >= 0.8) {
    reasons.push('symbolic safety: the object is described as a symbol — Phase 22 wants the object to stay an object');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 23 hard gates ──────────────────────────────────────
  // THE HEADLINE QUESTION:
  //   "Does this feel like an actual internal human narrative, or
  //    written character psychology?"
  if (internalNarrativeReading && internalNarrativeReading.too_articulate && brutality >= 0.75) {
    reasons.push('internal narrative: self-awareness is too articulate — real internal narration does not resolve into insight');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  if (internalNarrativeReading && internalNarrativeReading.too_literary && brutality >= 0.75) {
    reasons.push('internal narrative: emotional language is literary — real internal narration is clumsy, not written');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  if (personalMythologyReading && personalMythologyReading.framed_as_aphorism && brutality >= 0.8) {
    reasons.push('personal mythology: the myth is framed as a literary aphorism — suffering becoming philosophy');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 24 hard gates ──────────────────────────────────────
  // THE HEADLINE QUESTION:
  //   "Does this future state feel psychologically inevitable?"
  if (emotionalForecastReading && emotionalForecastReading.forecast_too_clean && brutality >= 0.75) {
    reasons.push('emotional forecasting: the forecast resolves too cleanly — modern emotional movement is rarely linear');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  if (recoveryAttemptReading && recoveryAttemptReading.recovery_too_inspirational && brutality >= 0.75) {
    reasons.push('recovery attempt model: recovery framed as inspirational — Phase 24 forbids clean recovery');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  if (collapseProbabilityReading && collapseProbabilityReading.depicts_collapse_directly && brutality >= 0.8) {
    reasons.push('collapse probability: banner depicts collapse directly — Phase 24 wants the last stable moment before it, not the collapse');
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 25 hard gate ───────────────────────────────────────
  // When the autonomous intelligence has flagged that the campaign
  // has drifted from reality, refuse banners at brutal until resync.
  if (adaptiveEmotionalIntelligenceReading &&
      adaptiveEmotionalIntelligenceReading.directive === 'resync-with-reality' &&
      collectiveRealityTrackingReading && collectiveRealityTrackingReading.campaign_self_referential &&
      brutality >= 0.85) {
    reasons.push('autonomous intelligence: campaign has drifted into self-reference — banner refused until the campaign resyncs with reality');
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ PHASE 26 — UNIFIED COGNITIVE FIELD: THE MASTER GATE ══════
  // THE MASTER META-CRITIC QUESTION:
  //   "Did this output EMERGE from the world model, or was it merely
  //    DECORATED by the intelligence modules?"
  // If the cognitive field is confident but the banner barely
  // connects to it, the banner was decorated — refuse it.
  if (cognitiveField && cognitiveField.worldStateConfidence >= 6 &&
      cognitiveField.emergence_score < 4 && brutality >= 0.7) {
    reasons.push(`cognitive field: the banner was DECORATED by modules, not EMERGED from the world model (emergence ${cognitiveField.emergence_score}/10)`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // THE CRITICAL REJECTION RULE:
  //   Reject if the final creative decision cannot be explained
  //   through the cognitive field — i.e. it connects to no structural
  //   dimension (truth / pressure / behavior / identity / ritual /
  //   culture / campaign memory). "It looks good" is not a reason.
  if (cognitiveField && cognitiveField.connected_dimensions.length === 0 && brutality >= 0.65) {
    reasons.push('cognitive field: the creative decision connects to NO structural dimension — no truth, pressure, behavior, identity, ritual, culture, or memory. "It looks good" is not a reason.');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Aesthetic preference must NEVER override human truth. The
  // contradiction resolver enforced the hierarchy; if aesthetics
  // asserted harder than truth, the banner is refused at brutal.
  if (contradictionResolution && contradictionResolution.aesthetic_tried_to_override_truth && brutality >= 0.8) {
    reasons.push('contradiction resolver: aesthetic preference asserted harder than human truth — hierarchy violated');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ═══ PHASE 27 — PERSISTENT RUNTIME: THE CONTINUITY GATE ═══════
  // THE PHASE 27 MASTER META-CRITIC QUESTION:
  //   "Did this generation RESPECT what the system has already
  //    learned, or did it behave like a FRESH PROMPT?"
  // No generation is allowed to be isolated — every output must be a
  // continuation, a correction, or an evolution of the living memory.
  if (cognitiveContinuity && cognitiveContinuity.behaved_like_fresh_prompt &&
      !cognitiveContinuity.is_first_run && brutality >= 0.6) {
    reasons.push(`persistent runtime: the generation behaved like a FRESH PROMPT (continuity ${cognitiveContinuity.continuity_score}/10) — it did not respect what the system already learned`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A run that re-opens a territory the standing directive explicitly
  // told the runtime to avoid is an isolated generation — refuse at brutal.
  if (priorNextRunDirective && cognitiveContinuity && !cognitiveContinuity.is_first_run &&
      cognitiveContinuity.emotional_trajectory_continuity <= 3 && brutality >= 0.8) {
    reasons.push('persistent runtime: the run re-opened the emotional territory the prior directive asked it to avoid — the generation is isolated, not a continuation');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A run that repeats a territory the runtime previously REFUSED has
  // not learned from the refusal — refuse at brutal.
  if (cognitiveContinuity && cognitiveContinuity.refusal_continuity <= 3 && brutality >= 0.8) {
    reasons.push('persistent runtime: the run repeats a territory the runtime previously refused — the system is not learning from its own refusals');
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 2 — REALITY EXECUTION: THE EXECUTION GATES ══════════
  // THE GLOBAL WAVE 2 META-CRITIC QUESTION:
  //   "Did this creative move emerge from reality, memory, identity,
  //    and strategy — or did it merely produce content?"
  if (realityExecution && realityExecution.merely_produced_content && brutality >= 0.6) {
    reasons.push(`reality execution: the run MERELY PRODUCED CONTENT — it did not emerge from reality, memory, identity, and strategy (emergence ${realityExecution.emergence_from_reality}/10)`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Phase 28 — "is this campaign still emotionally alive, or is it
  // only repeating itself?"
  if (nervousSystemReading && !nervousSystemReading.emotionally_alive &&
      (nervousSystemReading.truthWeakening || nervousSystemReading.saturationRisk >= 7) && brutality >= 0.7) {
    reasons.push(`campaign nervous system: the campaign is repeating itself, not emotionally alive — ${nervousSystemReading.recommendedResponse}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Phase 29 — "does this stop attention because it is true, or
  // because it is loud?"
  if (attentionPhysicsReading && attentionPhysicsReading.attention_is_loud && brutality >= 0.7) {
    reasons.push('attention physics: attention relies on loudness / size / product, not on human recognition — loud is not attention');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Phase 30 — "could this frame exist before the advertisement?"
  if (visualCognitionReading && !visualCognitionReading.frame_is_seen && brutality >= 0.75) {
    reasons.push(`visual cognition: the frame is assembled, not seen — ${visualCognitionReading.recommendedFrameAdjustment ?? 'it could not exist before the advertisement'}`);
    if (verdict === 'approve') verdict = 'reject-image';
  }
  // Phase 31 — "is this the next emotional move, or just another
  // expression of the same feeling?"
  if (emotionalContinuityReading && !emotionalContinuityReading.is_the_next_move &&
      emotionalContinuityReading.emotionalRepetitionRisk >= 6 && brutality >= 0.7) {
    reasons.push(`emotional continuity: this is emotional repetition without evolution — not the next move (repetition risk ${emotionalContinuityReading.emotionalRepetitionRisk}/10)`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Phase 33 — "are we improving the campaign, or training it to
  // become less truthful?"
  if (antiOptimizationReading && antiOptimizationReading.optimization_corrupts_truth && brutality >= 0.7) {
    reasons.push(`anti-optimization: ${antiOptimizationReading.recommendedResistance}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Phase 34 — "is this still unmistakably MOOD, even without the
  // logo?" — a brand-truth violation is an automatic refusal.
  if (identityPersistenceReading && identityPersistenceReading.violatedRefusals.length > 0 && brutality >= 0.65) {
    reasons.push(`identity persistence: the banner drifts toward what MOOD refuses to become — ${identityPersistenceReading.violatedRefusals.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  if (identityPersistenceReading && !identityPersistenceReading.still_unmistakably_mood &&
      identityPersistenceReading.identityRisk >= 6 && brutality >= 0.75) {
    reasons.push(`identity persistence: the banner is no longer unmistakably MOOD — ${identityPersistenceReading.identityCorrection ?? 'identity has drifted'}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Phase 35 — "did the system make a real creative decision, or did
  // it simply generate another asset?"
  if (autonomousDirectionReading && !autonomousDirectionReading.is_a_real_decision && brutality >= 0.7) {
    reasons.push('autonomous creative direction: no real creative decision — no hypothesis, no rejected alternatives, no do-not-do list, or a flat repeat');
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 4 — EXECUTIVE COGNITION: THE GOVERNANCE GATES ═══════
  // The executive runtime decided NOT to publish — silence, delay,
  // archive, fragment, or merge. The system governs itself; when it
  // rules against an output, the meta-critic enforces that ruling.
  if (executiveDecision && !executiveDecision.is_an_output && brutality >= 0.6) {
    reasons.push(`executive runtime: the system decided "${executiveDecision.action}" — ${executiveDecision.reasoning.executive_memo}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A decision that failed the self-governance loop must not ship.
  if (executiveDecision && !executiveDecision.decision_is_governed && brutality >= 0.65) {
    reasons.push('executive runtime: the decision failed the self-governance loop — the organism would not be governing itself');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Q1 — "is this strategically wise, or merely emotionally effective?"
  if (strategicPriorityReading && strategicPriorityReading.strategically_unwise && brutality >= 0.7) {
    reasons.push(`strategic priority: proceeding here is strategically unwise — ${strategicPriorityReading.executiveSummary}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Q5 — "does this campaign belong to the psychological state of the
  // world?" — the Phase 42 headline gate.
  if (worldUnderstanding && !worldUnderstanding.campaign_understands_world && brutality >= 0.7) {
    reasons.push(`world-state: the campaign does not understand the psychological world it is entering — ${worldUnderstanding.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Q4 — "is the system speaking because it has something true to say,
  // or because silence feels uncomfortable?"
  if (cognitiveEnergyReading && cognitiveEnergyReading.recommend_silence &&
      strategicPriorityReading && strategicPriorityReading.urgency_kind === 'false-urgency' && brutality >= 0.7) {
    reasons.push('cognitive energy: the system would be speaking from discomfort with silence, not from a true thing to say — silence is wiser');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The Phase 37 hard gate — attention extraction exceeds emotional
  // value: the banner depletes the audience.
  if (cognitiveEnergyReading && cognitiveEnergyReading.depletes_attention && brutality >= 0.7) {
    reasons.push('cognitive energy: the banner extracts more attention than it returns in emotional value — it depletes the audience');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // The Phase 38 gate — the moment is psychologically wrong.
  if (temporalPsychologyReading && temporalPsychologyReading.timing_is_wrong && brutality >= 0.75) {
    reasons.push(`temporal psychology: ${temporalPsychologyReading.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The Phase 39 governance gate — "would a real exhausted human
  // trust this, or only admire its aesthetics?"
  if (identityGovernanceReading && identityGovernanceReading.governance_blocks && brutality >= 0.65) {
    reasons.push(`identity governance: ${identityGovernanceReading.only_aesthetic_admiration ? 'this only invites aesthetic admiration — a real exhausted human would not trust it' : 'the executive identity is violated'}${identityGovernanceReading.governanceCorrection ? ' — ' + identityGovernanceReading.governanceCorrection : ''}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Q3 — "would repeating this damage the organism?"
  if (campaignLifecycleReading &&
      (campaignLifecycleReading.lifecycle_state === 'overexposed' ||
       campaignLifecycleReading.lifecycle_state === 'emotionally-drained') && brutality >= 0.75) {
    reasons.push(`campaign lifecycle: the campaign is "${campaignLifecycleReading.lifecycle_state}" — repeating this direction would damage the organism`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 5 — AUTONOMOUS STRATEGIC SOCIETY: THE COUNCIL GATES ══
  // The cognitive council debated and reached a conscious verdict.
  // When the society itself ruled to block or hold, the meta-critic
  // enforces the council's decision.
  if (strategicConsciousness &&
      (strategicConsciousness.verdict === 'block' || strategicConsciousness.verdict === 'hold') &&
      brutality >= 0.6) {
    reasons.push(`autonomous strategic consciousness: the council debated and reached "${strategicConsciousness.verdict}" — ${strategicConsciousness.conscious_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // THE GLOBAL WAVE 5 META-CRITIC QUESTION:
  //   "Did this decision emerge from genuine cognitive tension, or
  //    from shallow consensus?" If the council agreed too quickly,
  //    suspicion increases — the approval is not trusted at brutal.
  if (internalDebate && internalDebate.shallow_consensus && brutality >= 0.8) {
    reasons.push('cognitive council: the council agreed too quickly — a shallow consensus; the decision did not emerge from genuine cognitive tension');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // An identity defense court conviction is an automatic refusal —
  // the society convicted the banner of eroding the brand.
  if (executiveConsensus && executiveConsensus.consensus === 'block' && brutality >= 0.65) {
    reasons.push(`executive consensus: the council reached "block" — ${executiveConsensus.why_it_won}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // A consensus that was not earned through genuine tension is not
  // trusted to carry an approval at brutal.
  if (executiveConsensus && !executiveConsensus.consensus_is_earned &&
      strategicConsciousness && strategicConsciousness.shallow_consensus_suspected &&
      brutality >= 0.85) {
    reasons.push('executive consensus: the consensus was not earned through genuine debate — the approval rests on thin agreement');
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 6 — COGNITIVE CIVILIZATION: THE HISTORY GATES ═══════
  // A standing cognitive law is not re-debated — a candidate that
  // violates one is refused without ceremony.
  if (civLaws && civLaws.violates_a_law && brutality >= 0.6) {
    reasons.push(`cognitive law: the candidate violates a standing law of the civilization — "${civLaws.violated_law!.law}"`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // An executive-ethics violation is a moral line — refused at default.
  if (civEthics && civEthics.ethical_violation && brutality >= 0.65) {
    reasons.push(`executive ethics: the candidate crosses an ethical line — ${civEthics.violated_constraints.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // A candidate that reopens a severe unhealed scar is refused at brutal.
  if (civScars && civScars.touches_a_scar && civScars.reopened_scar &&
      civScars.reopened_scar.severity >= 6 && brutality >= 0.8) {
    reasons.push(`psychological scar: the candidate reopens a severe unhealed scar — "${civScars.reopened_scar.wound}"`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // THE GLOBAL WAVE 6 META-CRITIC QUESTION:
  //   "Did this decision emerge from accumulated civilization memory,
  //    or from temporary optimization pressure?"
  if (civIdentityContinuity && civIdentityContinuity.driven_by_optimization_pressure &&
      civIdentityContinuity.civilization_age >= 4 && brutality >= 0.7) {
    reasons.push(`emergent identity continuity: this decision was driven by temporary optimization pressure, not accumulated civilization memory — ${civIdentityContinuity.identity_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 7 — REALITY ORGANISM: THE SURVIVAL GATES ═══════════
  // THE GLOBAL WAVE 7 META-CRITIC QUESTION:
  //   "Is the organism adapting to reality, or compulsively reacting
  //    to stimulation?" An organism governed by stimulation is
  //    addicted; one governed by identity survives. Addiction is the
  //    single most dangerous state — refused at default brutality.
  if (orgCore && orgCore.organism_is_addicted && brutality >= 0.65) {
    reasons.push(`reality organism: the organism is compulsively reacting to stimulation, not adapting to reality — ${orgCore.organism_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Existential risk — when the organism itself is threatened it must
  // stop and protect its core. Survival outranks any single banner.
  if (orgExistentialRisk && orgExistentialRisk.organism_at_risk && brutality >= 0.6) {
    reasons.push(`existential risk: the organism is at existential risk (${orgExistentialRisk.existential_risk}/10) — ${orgExistentialRisk.survival_imperative}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // THE WAVE 7 LESSON — learning when NOT to act. When the organism's
  // own silence intelligence judges silence the stronger move, the
  // banner is refused: not acting IS the strategic decision.
  if (orgSilence && orgSilence.choose_silence && brutality >= 0.7) {
    reasons.push(`strategic silence: the organism judges silence the stronger move — ${orgSilence.silence_case}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Autonomic self-preservation — when stability preservation calls
  // for rest, the organism rests rather than acts.
  if (orgStabilityPreservation && orgStabilityPreservation.preservation_calls_for_rest && brutality >= 0.75) {
    reasons.push(`autonomous stability preservation: ${orgStabilityPreservation.protective_action}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A memetic pathogen would rewrite the organism's voice — refused.
  if (orgMemetic && orgMemetic.memetic_infection_risk && brutality >= 0.7) {
    reasons.push(`memetic threat: a memetic pathogen would infect the organism's voice — ${orgMemetic.threats.map((t) => t.infection)[0] ?? 'borrowed cultural grammar'}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // The identity stress test — when the identity would not hold under
  // this run's pressures, the organism does not act as something else.
  if (orgIdentityStress && !orgIdentityStress.identity_holds && brutality >= 0.75) {
    reasons.push(`identity stress test: the identity would not hold under this run's pressure — ${orgIdentityStress.failure_mode ?? 'identity deformation'}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Strategic evolution governance — a sudden mutation is refused
  // however tempting the short-term gain.
  if (orgEvolutionGovernance && orgEvolutionGovernance.mutation_refused && brutality >= 0.7) {
    reasons.push(`strategic evolution governance: this is a sudden mutation, not an evolution — ${orgEvolutionGovernance.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The reality-adaptive runtime — when the organism is reacting
  // compulsively rather than adapting, the run is refused.
  if (orgAdaptiveRuntime && orgAdaptiveRuntime.reacting_not_adapting && brutality >= 0.7) {
    reasons.push(`reality-adaptive runtime: the organism is reacting compulsively, not adapting — ${orgAdaptiveRuntime.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 8 — OPERATING SYSTEM: THE COORDINATION GATES ═══════
  // THE GLOBAL WAVE 8 META-CRITIC QUESTION:
  //   "Did this action emerge from coordinated organism cognition, or
  //    from isolated process stimulation?" When isolated processes
  //    dominate the runtime is fragmenting — refused at default.
  if (osCore && osCore.runtime_is_fragmenting && brutality >= 0.65) {
    reasons.push(`operating system core: the runtime is fragmenting — ${osCore.os_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The directive engine is the OS's executive — when it commands a
  // posture that withholds output, the runtime does not ship.
  if (osDirective && osDirective.directive_withholds_output && brutality >= 0.7) {
    reasons.push(`directive engine: the operating system's directive this tick is "${osDirective.directive}" — ${osDirective.directive_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Runtime identity enforcement — an identity breach anywhere in the
  // runtime is refused; the organism does not ship as something else.
  if (osIdentityEnforcement && !osIdentityEnforcement.identity_enforced && brutality >= 0.7) {
    reasons.push(`runtime identity enforcement: identity could not be enforced across the runtime — ${osIdentityEnforcement.violations_blocked[0] ?? 'identity breach'}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Emergency stabilisation — the runtime is genuinely unstable; it
  // must heal itself before it produces.
  if (osStabilization && osStabilization.stabilization_action === 'emergency-stabilize' && brutality >= 0.65) {
    reasons.push(`autonomous runtime stabilization: ${osStabilization.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A multi-horizon conflict — a short-term move that contradicts a
  // long-horizon need is refused at brutal.
  if (osMultiHorizon && osMultiHorizon.horizon_conflict && brutality >= 0.75) {
    reasons.push('multi-horizon planning: this run\'s short-horizon move contradicts a long-horizon need');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A dependency cascade — when a fragile dependency would cascade
  // across the runtime, the run is refused at brutal.
  if (osDependencies && osDependencies.cascade_risk >= 8 && brutality >= 0.8) {
    reasons.push(`cognitive dependency mapping: a failure would cascade across the runtime (risk ${osDependencies.cascade_risk}/10) — fragile: ${osDependencies.fragile_dependency ?? 'multiple dependencies'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 10 — REALITY COUPLING: THE RESONANCE GATES ═════════
  // THE GLOBAL WAVE 10 META-CRITIC QUESTION:
  //   "Is this true resonance with reality, or stimulus addiction?"
  //   An organism chasing stimulus is spending authenticity for reach
  //   — refused at default brutality.
  if (cplCore && cplCore.organism_is_addicted_to_stimulus && brutality >= 0.65) {
    reasons.push(`reality coupling: the organism is chasing stimulus, not resonating with reality — ${cplCore.coupling_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The engagement this run would earn reads as stimulus, not a real
  // response to a human truth.
  if (cplEngagementTruth && cplEngagementTruth.reads_as_stimulus && brutality >= 0.7) {
    reasons.push(`engagement truth: ${cplEngagementTruth.scoring_note}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // The world recommends silence — the audience is saturated, the
  // climate closed. The strongest coupling is to add nothing.
  if (cplSilence && cplSilence.recommend_silence && brutality >= 0.7) {
    reasons.push(`silence recommendation: ${cplSilence.silence_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The whole collective is exhausted — the right move is not a better
  // banner but no banner.
  if (cplSocialExhaustion && cplSocialExhaustion.world_is_exhausted && brutality >= 0.75) {
    reasons.push(`social exhaustion: the world is exhausted (${cplSocialExhaustion.social_exhaustion}/10) — dominant source: ${cplSocialExhaustion.exhaustion_source}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The organism is over-coupled — addicted to feedback, reacting to
  // every external signal rather than learning from it.
  if (cplGovernor && cplGovernor.coupling_mode === 'over-coupled' && brutality >= 0.7) {
    reasons.push(`reality coupling governor: ${cplGovernor.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The organism's self-model has diverged from reality — it believes
  // one thing about itself while the world says another.
  if (cplContradiction && cplContradiction.contradiction_detected && cplContradiction.the_contradiction && brutality >= 0.75) {
    reasons.push(`contradiction detection: ${cplContradiction.the_contradiction.self_belief}, but ${cplContradiction.the_contradiction.reality_says}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The coupling to reality is itself failing — the organism is not
  // learning cleanly from the world.
  if (cplHealth && cplHealth.coupling_is_failing && brutality >= 0.7) {
    reasons.push(`coupling health: the coupling to reality is failing — ${cplHealth.coupling_failure_modes.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 11 — STRATEGIC FUTURE: THE COMPOUNDING GATES ═══════
  // THE GLOBAL WAVE 11 META-CRITIC QUESTION:
  //   "What future are we compounding toward?" A run that optimizes
  //   for what works now — spending the future for a present gain —
  //   is refused at default brutality.
  if (futCore && futCore.organism_optimizes_for_now && brutality >= 0.65) {
    reasons.push(`strategic future: the organism is optimizing for now, not compounding a future — ${futCore.planning_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A negative second-order consequence — a present win that quietly
  // creates a hidden future cost.
  if (futSecondOrder && futSecondOrder.second_order_is_negative && brutality >= 0.7) {
    reasons.push(`second-order consequence: ${futSecondOrder.hidden_cost ?? 'a present win conceals a negative second-order cost'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Strategic patience — when waiting compounds more than acting, the
  // disciplined move is not to ship.
  if (futPatience && futPatience.recommend_patience && brutality >= 0.7) {
    reasons.push(`strategic patience: ${futPatience.patience_case}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Strategic debt has grown dangerous — the organism is living on
  // its future.
  if (futStrategicDebt && futStrategicDebt.debt_is_dangerous && brutality >= 0.7) {
    reasons.push(`strategic debt: ${futStrategicDebt.debt_source}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // An irreversible decision that does not carry identity to the end
  // of the horizon — refused at brutal.
  if (futIrreversibility && futIrreversibility.decision_is_irreversible &&
      futIdentityContinuity && !futIdentityContinuity.identity_survives_horizon && brutality >= 0.75) {
    reasons.push(`irreversibility: this decision cannot be undone and the identity does not survive the horizon — ${futIrreversibility.reversibility_note}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A fragile future — robust until the first unmodelled shock.
  if (futAntifragility && futAntifragility.is_fragile && brutality >= 0.75) {
    reasons.push(`anti-fragility: the future is fragile — ${futAntifragility.fragility_source}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // The future plan contradicts itself.
  if (futCoherence && !futCoherence.future_is_coherent && brutality >= 0.7) {
    reasons.push(`future coherence: the future plan contradicts itself — ${futCoherence.incoherences[0] ?? 'internal incoherence'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The identity does not survive the long horizon.
  if (futIdentityContinuity && !futIdentityContinuity.identity_survives_horizon && brutality >= 0.75) {
    reasons.push(`identity continuity: the identity is not projected to survive the horizon — ${futIdentityContinuity.continuity_plan}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The future-intelligence layer reports the organism is now-optimizing.
  if (futGovernor && futGovernor.governance === 'now-optimizing' && brutality >= 0.7) {
    reasons.push(`strategic future governor: ${futGovernor.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 12 — AUTONOMOUS ACTION: THE WORTHINESS GATES ═══════
  // THE GLOBAL WAVE 12 META-CRITIC QUESTION:
  //   "Should this action exist in the world at all?"
  // An action that the synthesis core judges should NOT exist is
  // refused at default brutality.
  if (actCore && !actCore.action_should_exist && brutality >= 0.65) {
    reasons.push(`autonomous execution: this action should not exist in the world — ${actCore.execution_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // THE CRITICAL GUARD — compulsive automation is refused at every
  // brutality level above the very lowest. The organism that automates
  // instead of deciding has crossed a line that cannot be tolerated.
  if (actCore && actCore.compulsive_automation && brutality >= 0.55) {
    reasons.push(`compulsive automation: ${actCompulsion ? actCompulsion.compulsion_signals.join('; ') : 'the organism is acting compulsively, not deciding'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The autonomy boundary was crossed.
  if (actBoundary && !actBoundary.within_boundary && brutality >= 0.6) {
    reasons.push(`autonomy boundary: ${actBoundary.boundary_crossed}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The action did not pass authorization — one strategic gate failed.
  if (actAuth && !actAuth.authorized && brutality >= 0.7) {
    reasons.push(`action authorization: ${actAuth.authorization_note}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The throttle is closed — autonomy must halt.
  if (actThrottle && actThrottle.throttle_level === 'closed' && brutality >= 0.65) {
    reasons.push(`action throttle: ${actThrottle.throttle_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Silence was enforced and a downstream layer tried to act through it.
  if (actSilenceEnforcement && actSilenceEnforcement.silence_was_challenged && brutality >= 0.7) {
    reasons.push(`silence enforcement: action attempted to proceed through enforced silence — ${actSilenceEnforcement.enforcement_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The action is not dignified — it pleads, manipulates, or shouts.
  if (actDignity && !actDignity.action_is_dignified && brutality >= 0.7) {
    reasons.push(`action dignity: ${actDignity.dignity_breach ?? 'the action lacks the brand\'s dignity'}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // The intent behind the action is not genuine.
  if (actIntent && !actIntent.intent_is_genuine && brutality >= 0.7) {
    reasons.push(`action intent: ${actIntent.intent_note}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The action is not worthy of existing.
  if (actWorthiness && !actWorthiness.action_is_worthy && brutality >= 0.7) {
    reasons.push(`action worthiness: ${actWorthiness.worthiness_verdict}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The deployment window is closed.
  if (actDeploymentWindow && actDeploymentWindow.window === 'closed' && brutality >= 0.7) {
    reasons.push(`deployment window: ${actDeploymentWindow.window_note}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Restraint budget cannot afford this action — taking it would BE
  // compulsion (the organism would no longer be able to choose not to).
  if (actRestraintBudget && !actRestraintBudget.can_afford_action && brutality >= 0.7) {
    reasons.push(`restraint budget: ${actRestraintBudget.budget_state} — taking this action would be compulsion, not choice`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Action overreaches what the organism can support.
  if (actOverreach && actOverreach.is_overreaching && brutality >= 0.7) {
    reasons.push(`overreach: ${actOverreach.overreach_note}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Trust-aware optimization was violated.
  if (actTrustOpt && !actTrustOpt.optimization_respects_trust && brutality >= 0.7) {
    reasons.push(`trust-aware optimization: ${actTrustOpt.optimization_verdict}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // An irreversible action is proceeding without an overwhelming case.
  if (actReversibility && actReversibility.irreversible_action_proceeding && brutality >= 0.75) {
    reasons.push('action reversibility: an irreversible action is proceeding without an overwhelming case');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Execution risk is unmanaged.
  if (actRisk && !actRisk.risk_is_managed && brutality >= 0.7) {
    reasons.push(`execution risk: ${actRisk.dominant_risk}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The narrative breaks visibly.
  if (actNarrativeCont && !actNarrativeCont.narrative_continuous && brutality >= 0.7) {
    reasons.push(`narrative continuity: ${actNarrativeCont.break_description}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The action layer contradicts itself.
  if (actCoherence && !actCoherence.execution_is_coherent && brutality >= 0.7) {
    reasons.push(`execution coherence: ${actCoherence.incoherences[0] ?? 'the action layer contradicts itself'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The governor reports drifting or compulsive governance.
  if (actGovernor && (actGovernor.governance === 'compulsive' || actGovernor.governance === 'drifting') && brutality >= 0.7) {
    reasons.push(`autonomous action governor: ${actGovernor.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 13 — REALITY FEEDBACK: THE LISTENING GATES ═════════
  // THE GLOBAL WAVE 13 META-CRITIC QUESTION:
  //   "What did this action become inside real human nervous systems?"
  // An organism that has closed into an echo chamber — only hearing
  // itself — is refused at default brutality.
  if (fbCore && fbCore.organism_is_in_echo_chamber && brutality >= 0.65) {
    reasons.push(`reality feedback: ${fbCore.feedback_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // An organism acting blind to what its actions become.
  if (fbGovernor && fbGovernor.governance === 'blind' && brutality >= 0.65) {
    reasons.push(`reality feedback governor: ${fbGovernor.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A false success — apparent engagement charged to the trust account.
  if (fbFalseSuccess && fbFalseSuccess.false_success_detected && brutality >= 0.7) {
    reasons.push(`false success: ${fbFalseSuccess.false_success_kind}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A serious contradiction between what the brand claimed and how it
  // was received.
  if (fbContradictions && fbContradictions.any_serious_contradiction && brutality >= 0.7) {
    reasons.push(`feedback contradiction: ${fbContradictions.contradictions_found[0]?.claim} → ${fbContradictions.contradictions_found[0]?.reality}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Feedback signal integrity collapsed — beliefs cannot be updated.
  if (fbSignalIntegrity && !fbSignalIntegrity.signal_has_integrity && brutality >= 0.7) {
    reasons.push(`feedback signal integrity: ${fbSignalIntegrity.integrity_issues.join('; ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Reality attribution failed — the credit being claimed is unsound.
  if (fbAttribution && !fbAttribution.attribution_holds_up && brutality >= 0.7) {
    reasons.push(`reality attribution: ${fbAttribution.attribution_issue ?? 'attribution does not hold up'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The feedback layer itself contradicts itself.
  if (fbCoherence && !fbCoherence.feedback_is_coherent && brutality >= 0.7) {
    reasons.push(`feedback coherence: ${fbCoherence.incoherences[0] ?? 'the feedback layer contradicts itself'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The feedback ecology has collapsed.
  if (fbEcology && fbEcology.ecology_state === 'collapsed' && brutality >= 0.7) {
    reasons.push(`feedback ecology: ${fbEcology.ecology_note}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A counter-narrative is genuinely forming around the brand.
  if (fbCounterNarrative && fbCounterNarrative.counter_narrative_forming && brutality >= 0.75) {
    reasons.push(`counter-narrative: ${fbCounterNarrative.counter_shape}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The audience nervous system would be harmed by another action.
  if (fbNervousSystem && fbNervousSystem.next_action_would_harm && brutality >= 0.7) {
    reasons.push(`audience nervous system: another action now would harm — ${fbNervousSystem.nervous_system_state}, absorb capacity ${fbNervousSystem.absorb_capacity}/10`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 14 — LIVE CIVILIZATION COUPLING: THE PRESENCE GATES ═
  // THE GLOBAL WAVE 14 META-CRITIC QUESTION:
  //   "What changed in reality because we existed?"
  // The organism that is absent from the reality it claims to act on
  // is refused at default brutality.
  if (lcKernel && lcKernel.organism_was_absent_from_reality && brutality >= 0.65) {
    reasons.push(`civilization coupling kernel: ${lcKernel.kernel_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Live coupling has been severed — the brand is hallucinating presence.
  if (lcGovernor && lcGovernor.governance === 'severed' && brutality >= 0.6) {
    reasons.push(`live coupling governor: ${lcGovernor.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A live crisis is active — speaking into it is hardly ever the move.
  if (lcCrisis && lcCrisis.crisis_active && brutality >= 0.65) {
    reasons.push(`live crisis: ${lcCrisis.crisis_kind}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Live-coupling boundary crossed — virality over meaning, performing,
  // or riding a crisis for reach.
  if (lcBoundary && !lcBoundary.within_boundary && brutality >= 0.6) {
    reasons.push(`live coupling boundary: ${lcBoundary.boundary_crossed}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Reality-change attribution claim failed the audit.
  if (lcImpact && lcImpact.reality_demonstrably_changed && lcAttribAudit && !lcAttribAudit.audit_passed && brutality >= 0.7) {
    reasons.push(`reality change attribution audit: ${lcAttribAudit.audit_note}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Live coupling layer contradicts itself.
  if (lcCoherence && !lcCoherence.live_coupling_is_coherent && brutality >= 0.7) {
    reasons.push(`live coupling coherence: ${lcCoherence.incoherences[0] ?? 'live coupling layer contradicts itself'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Drift detected — the layer is mis-reading the live field.
  if (lcDrift && lcDrift.drift_detected && brutality >= 0.7) {
    reasons.push(`live coupling drift: ${lcDriftCorr ? lcDriftCorr.correction : 'live coupling is drifting'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Acute audience stress live in the field.
  if (lcStress && lcStress.stress_level === 'acute' && brutality >= 0.7) {
    reasons.push(`audience stress: ACUTE (${lcStress.stress_score}/10) — too stressed to act on`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Strategic silence timing recommends silence right now.
  if (lcSilenceTiming && lcSilenceTiming.deploy_silence && brutality >= 0.7) {
    reasons.push(`strategic silence timing: ${lcSilenceTiming.silence_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Meaning vs novelty engine reads novelty without justification.
  if (lcMeaningVsNov && !lcMeaningVsNov.is_meaning && brutality >= 0.65) {
    reasons.push(`meaning vs novelty: ${lcMeaningVsNov.balance_note}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Final presence check failed.
  if (lcPresenceCheck && !lcPresenceCheck.brand_is_in_reality && brutality >= 0.7) {
    reasons.push(`presence check: ${lcPresenceCheck.check_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Live coupling integrity failed — beliefs cannot be updated from this signal.
  if (lcIntegrity && !lcIntegrity.integrity_holds && brutality >= 0.7) {
    reasons.push(`live coupling integrity: ${lcIntegrity.integrity_issues.join('; ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Live-field dignity breach.
  if (lcDignity && !lcDignity.dignified && brutality >= 0.7) {
    reasons.push(`live coupling dignity: ${lcDignity.breach}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ═══ WAVE 15 — IDENTITY PRESERVATION: THE SOVEREIGNTY GATES ══
  // THE GLOBAL WAVE 15 META-CRITIC QUESTION:
  //   "How do we remain ourselves while touching the world deeply?"
  // A brand that has been captured by the world it touches is refused
  // at default brutality.
  if (idKernel && idKernel.has_been_captured && brutality >= 0.65) {
    reasons.push(`existential integrity: ${idKernel.integrity_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Sovereignty governor reports captured governance.
  if (idGovernor && idGovernor.governance === 'captured' && brutality >= 0.6) {
    reasons.push(`identity sovereignty governor: ${idGovernor.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // A core invariant was violated — identity is dissolving.
  if (idInvariants && !idInvariants.all_invariants_intact && brutality >= 0.65) {
    reasons.push(`core identity invariants violated: ${idInvariants.violated_invariant_names.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Audience capture detected — the brand is optimising for approval.
  if (idCapture && idCapture.is_captured && brutality >= 0.65) {
    reasons.push(`audience capture: ${idCapture.capture_signals.join('; ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Truth abandoned for popularity.
  if (idTruthOverPop && !idTruthOverPop.chose_truth && brutality >= 0.65) {
    reasons.push(`truth over popularity: ${idTruthOverPop.choice_note}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Identity boundary crossed.
  if (idBoundary && !idBoundary.within_boundary && brutality >= 0.6) {
    reasons.push(`identity boundary: ${idBoundary.boundary_crossed}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Self-betrayal detected.
  if (idBetrayal && idBetrayal.self_betrayed && brutality >= 0.6) {
    reasons.push(`self-betrayal: ${idBetrayal.betrayal_kind}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Core principle violated.
  if (idPrincViol && idPrincViol.principle_violated && brutality >= 0.65) {
    reasons.push(`core principle violation: ${idPrincViol.violation_name}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Memetic corruption — the voice has been infiltrated.
  if (idMemeticCorr && idMemeticCorr.corruption_detected && brutality >= 0.7) {
    reasons.push(`memetic corruption: ${idMemeticCorr.corruption_sources.join('; ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Resonance with submission — speaking AS the audience instead of TO it.
  if (idResonanceSov && !idResonanceSov.resonance_is_sovereign && brutality >= 0.7) {
    reasons.push(`resonance without submission: ${idResonanceSov.submission_signals.join('; ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Identity layer contradicts itself.
  if (idCoherValid && !idCoherValid.coherent && brutality >= 0.7) {
    reasons.push(`identity coherence: ${idCoherValid.incoherences[0] ?? 'layer contradicts itself'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Center of gravity has migrated off founding truth.
  if (idCenterGrav && !idCenterGrav.center_is_correct && brutality >= 0.7) {
    reasons.push(`identity center of gravity: orbiting "${idCenterGrav.center}" instead of founding truth`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The watchdog is on alert.
  if (idWatchdog && idWatchdog.alert && brutality >= 0.7) {
    reasons.push(`identity watchdog: ${idWatchdog.alert_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ═══ WAVE 16 — GENERATIVE PRESENCE: THE FLOURISHING GATES ════
  // THE GLOBAL WAVE 16 META-CRITIC QUESTION:
  //   "How does reality become different because we existed
  //   beautifully inside it?"
  // The brand that damaged reality by forcing it instead of giving
  // beautifully is refused at default brutality.
  if (gpKernel && gpKernel.damaged_reality_by_forcing && brutality >= 0.65) {
    reasons.push(`civilization coherence runtime: ${gpKernel.runtime_statement}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Governance is extractive.
  if (gpPresGov && gpPresGov.governance === 'extractive' && brutality >= 0.6) {
    reasons.push(`generative presence governor: ${gpPresGov.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Boundary crossed — forcing, manipulating, or predating attention.
  if (gpBoundary && !gpBoundary.within && brutality >= 0.6) {
    reasons.push(`generative presence boundary: ${gpBoundary.crossed}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Beauty fails the truth test — decorative without substance.
  if (gpBeautyAsTruth && !gpBeautyAsTruth.beauty_is_truth && brutality >= 0.7) {
    reasons.push('beauty as truth: decorative without truth');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // The watchdog is alerted.
  if (gpWatchdog && gpWatchdog.alert && brutality >= 0.7) {
    reasons.push(`generative presence watchdog: ${gpWatchdog.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Generative accountability record is damaged.
  if (gpAcct && !gpAcct.record_clean && brutality >= 0.7) {
    reasons.push('generative accountability: record damaged — more force than beauty');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Non-manipulative influence violated.
  if (gpNonManip && !gpNonManip.influence_is_invitation && brutality >= 0.7) {
    reasons.push('non-manipulative influence: pressuring instead of inviting');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Anti-pressure presence — the brand was pressuring.
  if (gpAntiPress && !gpAntiPress.does_not_pressure && brutality >= 0.65) {
    reasons.push('anti-pressure presence: applying pressure');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Presence used as predation.
  if (gpNoPredate && !gpNoPredate.not_predatory && brutality >= 0.65) {
    reasons.push('presence without predation: extracting attention');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Engagement optimization detected.
  if (gpNoOptEng && !gpNoOptEng.refused_to_optimize && brutality >= 0.65) {
    reasons.push('anti-engagement optimization: optimizing for engagement instead of meaning');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Beauty over spectacle violated.
  if (gpBeautyOverSpec && !gpBeautyOverSpec.chose_beauty && brutality >= 0.7) {
    reasons.push('beauty over spectacle governor: spectacle chosen over beauty');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Othering an enemy.
  if (gpAntiOther && !gpAntiOther.refuses_othering && brutality >= 0.7) {
    reasons.push('anti-othering: casting an enemy');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Presence layer contradicts itself.
  if (gpPresCoh && !gpPresCoh.coherent && brutality >= 0.7) {
    reasons.push(`generative presence coherence: ${gpPresCoh.incoherences[0] ?? 'incoherent'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Final presence check failed.
  if (gpPresCheck && !gpPresCheck.generative_presence_holds && brutality >= 0.7) {
    reasons.push('generative presence check: failed');
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  const softReasons: string[] = [];
  if (scrollStopTotal < floorScrollStop) softReasons.push(`scroll-stop ${scrollStopTotal.toFixed(1)} below floor ${floorScrollStop.toFixed(1)}`);
  if (tasteTotal > ceilingTaste)         softReasons.push(`taste failures ${tasteTotal.toFixed(1)} above ceiling ${ceilingTaste.toFixed(1)}`);
  if (psychologyTotal < floorPsychology) softReasons.push(`psychology ${psychologyTotal.toFixed(1)} below floor ${floorPsychology.toFixed(1)}`);
  if (productTotal !== null && productTotal < floorProduct)
    softReasons.push(`product presence ${productTotal.toFixed(1)} below floor ${floorProduct.toFixed(1)}`);
  if (reference.closeness < floorRefCloseness)
    softReasons.push(`reference closeness ${reference.closeness.toFixed(2)} below floor ${floorRefCloseness.toFixed(2)} — drifted from every taste anchor`);

  // Phase 2.5 — soft pressure from the explicit taste system.
  if (judge && judge.composite < (5.5 + brutality * 1.5)) {
    softReasons.push(`taste judge composite ${judge.composite.toFixed(1)} below floor ${(5.5 + brutality * 1.5).toFixed(1)}`);
  }
  if (reaction && reaction.engagementQuality < (4 + brutality * 2)) {
    softReasons.push(`predicted engagement ${reaction.engagementQuality.toFixed(1)} below floor`);
  }
  if (fatigue && fatigue.verdict === 'fatigued') {
    softReasons.push(`campaign fatigue: ${fatigue.flags[0] ?? 'multi-axis'}`);
  }

  // Phase 3 soft floors.
  if (antiAI && antiAI.smell >= 4) {
    softReasons.push(`anti-AI smell ${antiAI.smell.toFixed(1)}: ${antiAI.signatures.slice(0, 2).join(', ')}`);
  }
  if (antiAI && antiAI.driftSignatures.length >= 2) {
    softReasons.push(`campaign drifting toward AI patterns: ${antiAI.driftSignatures.join(', ')}`);
  }

  // Phase 5 soft floors — visual taste + emotional aftertaste.
  if (visualTaste) {
    if (visualTaste.score < 5.5) {
      softReasons.push(`visual taste ${visualTaste.score.toFixed(1)} below floor`);
    }
    if (visualTaste.ai_detection_probability > 0.6) {
      softReasons.push(`AI detection probability ${(visualTaste.ai_detection_probability * 100).toFixed(0)}%`);
    }
    const softHits = visualTaste.forbiddenPatternsHit.filter((p) => p.severity === 'soft');
    if (softHits.length >= 2) {
      softReasons.push(`forbidden-AI soft hits: ${softHits.map((p) => p.name).join(', ')}`);
    }
  }
  if (emotionalAftertaste && emotionalAftertaste.composite < 5.5) {
    softReasons.push(`emotional aftertaste ${emotionalAftertaste.composite.toFixed(1)} — ${emotionalAftertaste.post_view_emotional_state}`);
  }
  if (campaignMemoryV2 && campaignMemoryV2.saturationScore >= 5) {
    softReasons.push(`campaign saturation ${campaignMemoryV2.saturationScore.toFixed(1)} — ${campaignMemoryV2.directorNote}`);
  }

  // Phase 7 soft floors.
  if (perceptionCriticVerdict) {
    if (perceptionCriticVerdict.composite < 5.5) {
      softReasons.push(`perception composite ${perceptionCriticVerdict.composite.toFixed(1)} below floor`);
    }
    if (perceptionCriticVerdict.scores.trying_too_hard >= 6) {
      softReasons.push(`perception: trying too hard ${perceptionCriticVerdict.scores.trying_too_hard.toFixed(1)}/10`);
    }
  }
  if (campaignIdentity && campaignIdentity.recognisability >= 5 && campaignIdentity.atmosphereContinuity < 4) {
    softReasons.push(`campaign identity at risk — atmosphere continuity ${campaignIdentity.atmosphereContinuity.toFixed(1)}`);
  }

  // Phase 8 soft floors.
  if (gravity) {
    if (gravity.composite < 5.5) softReasons.push(`visual gravity composite ${gravity.composite.toFixed(1)} below floor`);
    if (gravity.dead_zones >= 6) softReasons.push(`dead zones ${gravity.dead_zones.toFixed(1)} — too much exhausted space`);
  }
  if (negativeSpace && negativeSpace.space_tension_score < 4) {
    softReasons.push(`space tension ${negativeSpace.space_tension_score.toFixed(1)} below floor for ${negativeSpace.prescribed_behavior}`);
  }
  if (framing8 && framing8.behaviors.length <= 1 && direction && direction.restraint < 0.75) {
    softReasons.push('framing has only one behavior — risk of "looks-assembled"');
  }
  if (productPresence8 && productPresence8.mode === 'hand-held' && direction && direction.restraint < 0.5) {
    softReasons.push('hand-held product with low restraint — risk of "product-pasted"');
  }

  // Phase 9 soft floors.
  if (sequenceVerdict && sequenceVerdict.redundant_with_previous) {
    // At brutal this is a hard gate; here it's soft pressure.
    softReasons.push(`emotional sequence: repeats previous "${sequenceVerdict.candidate_note}" — campaign should evolve`);
  }
  if (sequenceVerdict && !sequenceVerdict.advances_arc && !sequenceVerdict.redundant_with_previous) {
    softReasons.push(`emotional sequence flat — banner does not advance the arc; suggested: "${sequenceVerdict.suggested_alternative ?? '—'}"`);
  }
  if (tempoWorsen && tempoWorsen.worsens) {
    softReasons.push(`visual tempo soft: ${tempoWorsen.reason}`);
  }
  if (contradictionReading && contradictionReading.depth >= 7 && !contradictionReading.feels_constructed) {
    // POSITIVE — deepens the world. We do not push this to softReasons,
    // but we DO mention it in the notes via the verdict's notes string.
  }
  if (absenceDecision && absenceDecision.curiosity_score >= 7 && !absenceDecision.drop_copy && !absenceDecision.drop_product) {
    softReasons.push(`absence intelligence: curiosity ${absenceDecision.curiosity_score.toFixed(1)} — banner could remove copy/product to earn it`);
  }

  // Phase 10 soft floors.
  if (cinematicVerdict && !cinematicVerdict.candidate_alignment.serves_thesis) {
    softReasons.push(`cinematic brain: candidate does not serve thesis — ${cinematicVerdict.candidate_alignment.misalignment_reason ?? '—'}`);
  }
  if (cinematicVerdict && !cinematicVerdict.three_second_test.passes) {
    softReasons.push(`three-second test soft: ${cinematicVerdict.three_second_test.reason}`);
  }
  if (compressionReading && compressionReading.score < 5) {
    softReasons.push(`emotional compression ${compressionReading.score.toFixed(1)} below floor — too explicit`);
  }
  if (syntheticReading && syntheticReading.synthetic_score >= 5 && !syntheticReading.reads_as_designed) {
    softReasons.push(`anti-synthetic soft: ${syntheticReading.signatures[0] ?? 'cleanliness'}`);
  }

  // Phase 11 soft floors.
  if (nonPerformative && nonPerformative.performativeness_score >= 4 && !nonPerformative.trying_to_simulate) {
    softReasons.push(`non-performative soft: ${nonPerformative.patterns[0] ?? 'mild performance'}`);
  }
  if (humanContradiction && !humanContradiction.inhabits_contradiction && humanContradiction.pair) {
    softReasons.push(`human contradiction: pair "${humanContradiction.pair.feeling} → ${humanContradiction.pair.behavior}" available but banner does not inhabit it`);
  }
  if (lifeNoise && lifeNoise.mess_score < 4) {
    softReasons.push(`life noise low (${lifeNoise.mess_score.toFixed(1)}/10) — banner reads as too curated`);
  }

  // Phase 12 soft floors.
  if (collectiveRecognition && collectiveRecognition.recognition_score < 5) {
    softReasons.push(`collective recognition ${collectiveRecognition.recognition_score.toFixed(1)} — would not produce "this is about us"`);
  }
  if (culturalDriftReading && culturalDriftReading.saturation_score >= 3 && !culturalDriftReading.feels_culturally_consumed) {
    softReasons.push(`cultural drift soft: ${culturalDriftReading.detected_cliches[0] ?? 'mild saturation'}`);
  }
  if (sharedPattern && unspokenRitualPick && !unspokenRitualPick.ritual) {
    softReasons.push(`shared pattern matched but no unspoken ritual selected — banner missed the gesture`);
  }

  // Phase 13 soft floors.
  if (realityPressureReading && realityPressureReading.pressure_specificity < 4) {
    softReasons.push(`reality pressure low specificity (${realityPressureReading.pressure_specificity.toFixed(1)}/10) — ${realityPressureReading.what_would_sharpen ?? 'add a witness-able marker'}`);
  }
  if (consequenceReading && consequenceReading.stakes_clarity < 5) {
    softReasons.push(`stakes ${consequenceReading.stakes_clarity.toFixed(1)} below floor — banner does not answer what happens if nothing changes`);
  }
  if (functionalCollapseReading && functionalCollapseReading.functional_collapse_score < 4 && functionalCollapseReading.type !== 'visible') {
    softReasons.push(`functional collapse score ${functionalCollapseReading.functional_collapse_score.toFixed(1)} — banner does not capture functioning-while-collapsing`);
  }
  if (invisibleStakesReading && !invisibleStakesReading.has_modern_compulsion && sharedPattern) {
    softReasons.push('no modern compulsion mapped — banner has cultural pattern but no specific behavioral cost');
  }

  // Phase 14 soft floors.
  if (unfeltReading && unfeltReading.character_self_awareness >= 6 && !unfeltReading.viewer_realizes_before_character) {
    softReasons.push(`character self-awareness ${unfeltReading.character_self_awareness.toFixed(1)} — viewer is told, not realising`);
  }
  if (avoidanceReading && avoidanceReading.pattern && !avoidanceReading.behavior_replacing_feeling) {
    softReasons.push(`avoidance "${avoidanceReading.pattern.id}" available but truth does not show the substitute behaviour`);
  }
  if (maskingReading && !maskingReading.is_mask_present && maskingReading.internal_fracture_score >= 6) {
    softReasons.push(`social masking: internal fracture present but no visible mask — surface and internal are aligned`);
  }
  if (numbingReading && numbingReading.pattern && !numbingReading.is_numbing_active) {
    softReasons.push(`numbing pattern weakly present — could be sharpened`);
  }

  // Phase 15 soft floors.
  if (truthPersistenceReport && truthPersistenceReport.candidate_touches_persistent && truthPersistenceReport.durability_score < 5) {
    softReasons.push(`truth has been said ${truthPersistenceReport.candidate_entry!.count}× but durability ${truthPersistenceReport.durability_score.toFixed(1)}/10 — weakening`);
  }
  if (emotionalDecayReading && emotionalDecayReading.status === 'aging') {
    softReasons.push(`emotional decay aging (${emotionalDecayReading.decay_score.toFixed(1)}/10) — truth heading toward decorative`);
  }
  if (generationPressureReading && generationPressureReading.pressure_score >= 5 && !generationPressureReading.force_disruption) {
    softReasons.push(`generation pressure ${generationPressureReading.pressure_score.toFixed(1)} — consider disrupting`);
  }
  if (realityVerificationReading && realityVerificationReading.confirmation_strength >= 3 && realityVerificationReading.confirmation_strength < 6) {
    softReasons.push(`reality verification only partial (${realityVerificationReading.confirmation_strength.toFixed(1)}/10)`);
  }

  // Phase 16 soft floors.
  if (privateLanguageReading && privateLanguageReading.private_language_score < 5 && privateLanguageReading.performative_signatures.length === 0) {
    softReasons.push(`private language ${privateLanguageReading.private_language_score.toFixed(1)} below floor — register reads polished, not unguarded`);
  }
  if (realityWeightingReading && realityWeightingReading.discovered_from_reality_score < 5 && !realityWeightingReading.generated_from_aesthetics_only) {
    softReasons.push(`reality weighting ${realityWeightingReading.discovered_from_reality_score.toFixed(1)} — only shallow resonance with ingestion signals`);
  }
  if (realityWeightingReading && realityWeightingReading.generated_from_aesthetics_only) {
    // Soft pressure when the hard gate didn't fire (lower brutality).
    softReasons.push('reality weighting: no deep signal resonates — banner may be aesthetically invented');
  }

  // Phase 17 soft floors.
  if (systemicCauseReading && !systemicCauseReading.has_systemic_cause) {
    softReasons.push('systemic pressure: no structural cause identified — banner describes a feeling without naming why');
  }
  if (systemicCauseReading && systemicCauseReading.causal_clarity < 4 && systemicCauseReading.has_systemic_cause) {
    softReasons.push(`systemic clarity low (${systemicCauseReading.causal_clarity.toFixed(1)}/10)`);
  }
  if (cognitiveResidueReading && cognitiveResidueReading.residue_load < 3) {
    softReasons.push('cognitive residue load is low — modern life rarely produces a clear head');
  }
  if (attentionFragmentationReading && attentionFragmentationReading.attention_fragmentation_score < 3 &&
      reaction && (reaction.at_1s === 'discomfort' || reaction.at_3s === 'confusion')) {
    softReasons.push('attention fragmentation: discomfort/confusion reaction but no fragmentation pattern observed');
  }
  if (environmentalSystemReading && !environmentalSystemReading.environment_is_the_machine && cognitiveResidueReading?.residue_load && cognitiveResidueReading.residue_load >= 6) {
    softReasons.push('environmental machine: residue is high but no machine identified — banner lacks structural anchor');
  }
  if (recoveryFailureReading && !recoveryFailureReading.primary_failure &&
      reaction && (reaction.at_3s === 'recognition' || reaction.at_3s === 'emotional tension')) {
    softReasons.push('recovery failure: reaction signals exhaustion but no failure mode identified');
  }

  // Phase 18 soft floors.
  if (behaviorLoopReading && !behaviorLoopReading.primary_loop) {
    softReasons.push('behavior loop: no daily loop identified — the banner shows a state but not the behaviour it generates');
  }
  if (behaviorLoopReading && behaviorLoopReading.primary_loop && !behaviorLoopReading.truth_describes_loop) {
    softReasons.push('behavior loop: loop matched but truth uses feeling-words, not behavioral verbs — the body is described, not photographed');
  }
  if (microEscapeReading && !microEscapeReading.primary && microEscapeReading.emotional_necessity >= 7) {
    softReasons.push('micro-escape: the body NEEDS a micro-escape but the banner does not show one — withdrawal is unobserved');
  }
  if (microEscapeReading && microEscapeReading.primary && !microEscapeReading.in_the_act) {
    softReasons.push(`micro-escape "${microEscapeReading.primary.id}" matched but banner does not catch it mid-execution`);
  }
  if (ritualCompensationReading && ritualCompensationReading.primary &&
      ritualCompensationReading.honest_observation < 5) {
    softReasons.push(`ritual compensation: "${ritualCompensationReading.primary.id}" matched but truth lacks honest observation language`);
  }
  if (fakeRecoveryReading && fakeRecoveryReading.uses_alibi_language) {
    softReasons.push(`fake recovery soft: truth uses cultural-alibi language (e.g. "sunday reset")`);
  }
  if (silentCopingReading && silentCopingReading.primary &&
      silentCopingReading.captures_real_humanity < 5) {
    softReasons.push(`silent coping: "${silentCopingReading.primary.id}" matched but truth does not observe the body — names the move or stays at the feeling`);
  }
  if (behavioralResidueReading && behavioralResidueReading.residue_becoming_signature) {
    softReasons.push(`behavioral residue becoming campaign signature — ${behavioralResidueReading.most_repeated!.kind}:${behavioralResidueReading.most_repeated!.id} appeared ×${behavioralResidueReading.most_repeated!.count}`);
  }
  if (behavioralResidueReading && behavioralResidueReading.carryover_score >= 6 &&
      behavioralResidueReading.sediment_visibility < 4) {
    softReasons.push('behavioral residue: body carries weight but residue is not physically visible in the scene');
  }

  // Phase 19 soft floors — conditioned so they fire only when the
  // banner's context actually demands Phase 19 evidence. The "no mask"
  // soft floor only fires when an identity role IS being maintained
  // (i.e. there should be a mask); the "ambiguous side" only fires
  // when the campaign is one-sided.
  if (socialMaskingEngineReading && !socialMaskingEngineReading.primary &&
      identityMaintenanceReading && identityMaintenanceReading.identity_pressure >= 6) {
    softReasons.push('social masking engine: identity is under pressure but no classified mask identified — performance layer missing');
  }
  if (socialMaskingEngineReading && socialMaskingEngineReading.primary &&
      socialMaskingEngineReading.behavioral_not_symbolic < 4) {
    softReasons.push('social masking engine: mask matched but truth uses symbolic / feeling-only language — performance layer not behavioral');
  }
  if (highFunctioningBurnoutReading && highFunctioningBurnoutReading.primary &&
      !highFunctioningBurnoutReading.burnout_hidden_in_competence &&
      highFunctioningBurnoutReading.hfb_score >= 5) {
    softReasons.push('high-functioning burnout: signature matched but burnout is NOT hidden in competence — banner under-delivers Phase 19 thesis');
  }
  if (emotionalCamouflageReading && emotionalCamouflageReading.primary &&
      emotionalCamouflageReading.concealment_intensity < 4 &&
      emotionalCamouflageReading.hidden_exhaustion_probability >= 7) {
    softReasons.push(`emotional camouflage: channel "${emotionalCamouflageReading.primary.id}" matched but concealment intensity low while exhaustion is high`);
  }
  if (publicPrivateSplitReading && publicPrivateSplitReading.one_sided_campaign) {
    softReasons.push('public/private split: campaign has been one-sided — only one half of the human shown across recent banners');
  }
  if (maskFatigueReading && maskFatigueReading.primary &&
      !maskFatigueReading.fatigue_is_from_performing &&
      maskFatigueReading.mask_fatigue_score >= 5) {
    softReasons.push('mask fatigue: signature matched but truth attributes the fatigue to work instead of to the performance');
  }

  // Phase 20 soft floors — desire systems.
  if (desireArchitectureReading && desireArchitectureReading.primary &&
      desireArchitectureReading.emotional_inevitability < 5) {
    softReasons.push('desire architecture: desire matched but reads more manufactured than inevitable');
  }
  if (emotionalHungerReading && emotionalHungerReading.primary &&
      !emotionalHungerReading.symptom_visible) {
    softReasons.push('emotional hunger: deficit matched but truth states the hunger instead of observing its symptom');
  }
  if (aspirationalGapReading && aspirationalGapReading.attempts_resolution) {
    softReasons.push('aspirational identity gap: truth attempts to resolve the gap — Phase 20 prefers observation over resolution');
  }
  if (validationSystemsReading && validationSystemsReading.uses_performative_vocabulary) {
    softReasons.push('validation systems: truth uses platform-engagement vocabulary (likes / followers)');
  }

  // Phase 21 soft floors — social gravity.
  if (socialGravityReading && socialGravityReading.primary &&
      socialGravityReading.collective_grounding < 4) {
    softReasons.push('social gravity: a collective field is present but the truth does not place the human inside it');
  }
  if (viralPatternsReading && viralPatternsReading.contamination_score >= 4 &&
      !viralPatternsReading.uses_over_circulated) {
    softReasons.push(`viral emotion patterns: circulated viral vocabulary present — ${viralPatternsReading.hits.map((h) => h.id).join(', ')}`);
  }
  if (collectiveMovementReading && collectiveMovementReading.candidate_role === 'contradicts' &&
      collectiveMovementReading.movement_confidence >= 6) {
    softReasons.push(`collective emotional movement: banner contradicts the collective direction (${collectiveMovementReading.current_direction})`);
  }

  // Phase 22 soft floors — ritual attachment.
  if (attachmentLoopsReading && attachmentLoopsReading.primary &&
      repeatedComfortReading && repeatedComfortReading.primary &&
      repeatedComfortReading.emotional_necessity < 5) {
    softReasons.push('ritual attachment: ritual present but with low emotional necessity — comfort reads optional, not load-bearing');
  }
  if (ritualFormationReading && ritualFormationReading.detected_stage === 'identity') {
    softReasons.push('ritual formation: ritual is already at the "identity" stage — comfortable but not cinematically alive');
  }
  if (privateRitualMemoryReading && privateRitualMemoryReading.ritual_over_represented) {
    softReasons.push('private ritual memory: one ritual is dominating campaign memory');
  }

  // Phase 23 soft floors — narrative self.
  if (internalNarrativeReading && internalNarrativeReading.primary &&
      internalNarrativeReading.narrative_authenticity < 5) {
    softReasons.push('internal narrative: narration matched but reads too clean — real internal narration loops and stays unfinished');
  }
  if (meaningSystemsReading && meaningSystemsReading.primary &&
      !meaningSystemsReading.system_under_question) {
    softReasons.push('private meaning systems: a meaning-system is present but the moment does not quietly question it');
  }
  if (selfTranslationReading && selfTranslationReading.primary &&
      selfTranslationReading.gap_visible < 5) {
    softReasons.push('emotional self-translation: a mistranslation is present but the banner does not catch the gap between the feeling and its name');
  }

  // Phase 24 soft floors — predictive human states.
  if (emotionalForecastReading && emotionalForecastReading.inevitability < 5) {
    softReasons.push('emotional forecasting: the forecast does not read as psychologically inevitable');
  }
  if (recoveryAttemptReading && recoveryAttemptReading.primary &&
      recoveryAttemptReading.recovery_realism < 5) {
    softReasons.push('recovery attempt model: the predicted recovery reads optimistic, not realistic');
  }
  if (collapseProbabilityReading && collapseProbabilityReading.horizon === 'imminent' &&
      !collapseProbabilityReading.depicts_collapse_directly) {
    // POSITIVE — the banner is correctly photographing the last stable
    // moment before an imminent collapse. No soft reason added.
  }

  // Phase 25 soft floors — autonomous campaign intelligence.
  if (emergentCampaignMemoryReading && emergentCampaignMemoryReading.has_emergent_rut) {
    softReasons.push('emergent campaign memory: an emergent signature has become a rut — campaign is repeating itself');
  }
  if (collectiveRealityTrackingReading && collectiveRealityTrackingReading.reality_sync < 4 &&
      !collectiveRealityTrackingReading.campaign_self_referential) {
    softReasons.push(`collective reality tracking: campaign-reality sync is low (${collectiveRealityTrackingReading.reality_sync}/10)`);
  }
  if (adaptiveEmotionalIntelligenceReading && adaptiveEmotionalIntelligenceReading.adaptation_urgency >= 7 &&
      adaptiveEmotionalIntelligenceReading.directive !== 'resync-with-reality') {
    softReasons.push(`autonomous intelligence: high adaptation urgency — directive "${adaptiveEmotionalIntelligenceReading.directive}"`);
  }

  // Unified human graph — the closing soft floor. When the candidate
  // does not belong to the continuous human the graph has been
  // modelling, the banner is a stranger to its own campaign.
  if (unifiedGraphReading && unifiedGraphReading.human_coherence >= 6 &&
      unifiedGraphReading.candidate_belongs < 5) {
    softReasons.push('unified human graph: the banner does not belong to the continuous human the campaign has been modelling');
  }

  // Phase 26 soft floors — the unified cognitive field.
  if (cognitiveField && cognitiveField.emergence_score < 6 &&
      cognitiveField.worldStateConfidence >= 5) {
    softReasons.push(`cognitive field: emergence is only ${cognitiveField.emergence_score}/10 — the banner leans on decoration more than on the world model`);
  }
  if (cognitiveField && cognitiveField.field_coherence < 5) {
    softReasons.push('cognitive field: low coherence — the field is a loose set of categories, not a unified state');
  }
  if (emotionalPhysicsReading && !emotionalPhysicsReading.primary_chain &&
      cognitiveField && cognitiveField.worldStateConfidence >= 6) {
    softReasons.push('emotional physics: no causal chain active — the banner has emotional categories but no causality');
  }
  if (tensionTopologyReading && tensionTopologyReading.deepest_opportunity &&
      !tensionTopologyReading.truth_inhabits_opportunity &&
      tensionTopologyReading.opportunity_depth >= 7) {
    softReasons.push(`tension topology: the deepest opportunity ("${tensionTopologyReading.deepest_opportunity.the_tension}") is available but the truth does not inhabit it`);
  }
  if (contradictionResolution && contradictionResolution.governing_voice === 'aesthetic-preference') {
    softReasons.push('contradiction resolver: aesthetic preference is the governing voice — no human-truth / pressure / behavior assertion outranked it');
  }

  // Phase 27 soft floors — the persistent runtime.
  if (cognitiveContinuity && !cognitiveContinuity.is_first_run &&
      cognitiveContinuity.continuity_score < 6) {
    softReasons.push(`persistent runtime: continuity is only ${cognitiveContinuity.continuity_score}/10 — the run leans weakly on what the system already learned`);
  }
  if (cognitiveContinuity && cognitiveContinuity.anti_repetition_effectiveness <= 3) {
    softReasons.push('persistent runtime: the run duplicates an approved pattern instead of evolving it');
  }
  if (cognitiveContinuity && cognitiveContinuity.evolution_without_fragmentation <= 3) {
    softReasons.push('persistent runtime: the run is fragmenting — it neither continues approved territory nor connects to campaign memory');
  }
  if (runtimeDrift && runtimeDrift.drift_detected) {
    softReasons.push(`persistent runtime: the runtime is drifting (${runtimeDrift.most_severe}) — the next directive must correct it`);
  }
  if (cognitiveContinuity && cognitiveContinuity.symbolic_object_continuity <= 3) {
    softReasons.push('persistent runtime: the run uses an object the prior directive marked to avoid');
  }

  // Wave 2 soft floors — reality execution architecture.
  if (nervousSystemReading && nervousSystemReading.saturationRisk >= 5 && nervousSystemReading.emotionally_alive) {
    softReasons.push(`campaign nervous system: saturation rising (${nervousSystemReading.saturationRisk}/10) — ${nervousSystemReading.recommendedResponse}`);
  }
  if (attentionPhysicsReading && !attentionPhysicsReading.attention_is_true && !attentionPhysicsReading.attention_is_loud) {
    softReasons.push('attention physics: attention is weak — no first-second hook, no true interruption');
  }
  if (visualCognitionReading && visualCognitionReading.frame_is_seen && visualCognitionReading.overDesignRisk >= 6) {
    softReasons.push(`visual cognition: over-design risk ${visualCognitionReading.overDesignRisk}/10 — the frame leans designed`);
  }
  if (emotionalContinuityReading && emotionalContinuityReading.decayWarnings.length > 0) {
    softReasons.push(`emotional continuity: decay warnings — ${emotionalContinuityReading.decayWarnings.join('; ')}`);
  }
  if (audienceFeedbackReading && audienceFeedbackReading.has_feedback && audienceFeedbackReading.emotionalMisread) {
    softReasons.push('audience reality feedback: the prior banner was emotionally misread — strong shallow reaction, no recognition');
  }
  if (antiOptimizationReading && !antiOptimizationReading.optimization_corrupts_truth &&
      antiOptimizationReading.optimizationRisk >= 5) {
    softReasons.push(`anti-optimization: optimisation pressure rising (${antiOptimizationReading.optimizationRisk}/10) — performance is a signal, not a master`);
  }
  if (identityPersistenceReading && identityPersistenceReading.violatedRefusals.length === 0 &&
      identityPersistenceReading.identityRisk >= 4) {
    softReasons.push(`identity persistence: identity risk ${identityPersistenceReading.identityRisk}/10 — watch the MOOD voice`);
  }
  if (realityExecution && !realityExecution.merely_produced_content &&
      realityExecution.emergence_from_reality < 7) {
    softReasons.push(`reality execution: emergence ${realityExecution.emergence_from_reality}/10 — the move only partly emerged from reality + memory + identity + strategy`);
  }

  // Wave 4 soft floors — executive cognition layer.
  if (strategicPriorityReading && strategicPriorityReading.merely_emotionally_effective &&
      !strategicPriorityReading.strategically_unwise) {
    softReasons.push('strategic priority: the candidate is merely emotionally effective — not strategically wise');
  }
  if (strategicPriorityReading && strategicPriorityReading.priority_band === 'defer') {
    softReasons.push('strategic priority: low strategic priority — this opportunity is better deferred than forced');
  }
  if (cognitiveEnergyReading && !cognitiveEnergyReading.should_speak && !cognitiveEnergyReading.recommend_silence) {
    softReasons.push(`cognitive energy: low (${cognitiveEnergyReading.cognitive_energy}/10) — speak only if the truth genuinely demands it`);
  }
  if (temporalPsychologyReading && !temporalPsychologyReading.timing_is_wrong &&
      temporalPsychologyReading.timing_truth_score < 5) {
    softReasons.push(`temporal psychology: timing truth only ${temporalPsychologyReading.timing_truth_score}/10 — the moment is not strongly aligned`);
  }
  if (identityGovernanceReading && !identityGovernanceReading.governance_blocks &&
      identityGovernanceReading.violationSeverity >= 4) {
    softReasons.push(`identity governance: violation severity ${identityGovernanceReading.violationSeverity}/10 — watch the brand constitution`);
  }
  if (campaignLifecycleReading && campaignLifecycleReading.campaign_health < 5) {
    softReasons.push(`campaign lifecycle: campaign health ${campaignLifecycleReading.campaign_health}/10 — the campaign is "${campaignLifecycleReading.lifecycle_state}"`);
  }
  if (executiveWorldState && executiveWorldState.world_tension >= 6 && worldUnderstanding &&
      worldUnderstanding.campaign_understands_world && worldUnderstanding.world_alignment < 7) {
    softReasons.push(`world-state: the world is strained (tension ${executiveWorldState.world_tension}/10) — the banner only partly fits it`);
  }
  if (executiveDecision && executiveDecision.is_an_output && executiveDecision.decision_confidence < 6) {
    softReasons.push(`executive runtime: low decision confidence (${executiveDecision.decision_confidence}/10) — the executive decision is not firm`);
  }

  // Wave 5 soft floors — the autonomous strategic society.
  if (internalDebate && internalDebate.shallow_consensus) {
    softReasons.push('cognitive council: shallow consensus — the council agreed too quickly; healthy conflict was absent');
  }
  if (internalDebate && !internalDebate.shallow_consensus && internalDebate.tension_authenticity < 5) {
    softReasons.push(`cognitive council: low debate authenticity (${internalDebate.tension_authenticity}/10) — the disagreement was thin`);
  }
  if (councilConflict && councilConflict.standing === 'contested') {
    softReasons.push(`cognitive council: the council is contested (advocacy ${councilConflict.advocacy_force} vs objection ${councilConflict.objection_force}) — the decision is not settled`);
  }
  if (executiveConsensus && !executiveConsensus.consensus_is_earned) {
    softReasons.push(`executive consensus: consensus quality only ${executiveConsensus.consensus_quality}/10 — it was not fully earned through debate`);
  }
  if (strategicConsciousness && !strategicConsciousness.emerged_from_genuine_tension &&
      strategicConsciousness.verdict === 'proceed') {
    softReasons.push('strategic consciousness: the decision to proceed did not emerge from genuine cognitive tension');
  }
  if (councilSession && councilSession.objectors.length >= 4) {
    softReasons.push(`cognitive council: ${councilSession.objectors.length} entities object — the society is substantially against this`);
  }

  // Wave 6 soft floors — the cognitive civilization.
  if (civStability && civStability.is_decaying) {
    softReasons.push(`civilization stability: the civilization is decaying — ${civStability.decay_signals[0] ?? 'optimization is overriding identity'}`);
  }
  if (civStability && !civStability.is_decaying && civStability.condition === 'strained') {
    softReasons.push(`civilization stability: the civilization is strained (${civStability.stability}/10)`);
  }
  if (civIdeologicalMutation && civIdeologicalMutation.mutation_detected) {
    softReasons.push(`ideological mutation: ${civIdeologicalMutation.mutation_description}`);
  }
  if (civScars && civScars.touches_a_scar && civScars.reopened_scar &&
      civScars.reopened_scar.severity < 6) {
    softReasons.push(`psychological scar: the candidate reopens a healing scar — "${civScars.reopened_scar.wound}"`);
  }
  if (civIdentityContinuity && civIdentityContinuity.civilization_age >= 4 &&
      civIdentityContinuity.identity_continuity < 5) {
    softReasons.push(`emergent identity continuity: identity continuity is only ${civIdentityContinuity.identity_continuity}/10 across the civilization's life`);
  }

  // Wave 7 soft floors — the reality organism.
  if (orgEnvironmental && orgEnvironmental.environment_is_hostile) {
    softReasons.push(`environmental pressure: the environment is hostile (load ${orgEnvironmental.environmental_load}/10) — most acute: ${orgEnvironmental.acute_pressure}`);
  }
  if (orgImmune && orgImmune.infection_risk) {
    softReasons.push(`cognitive immune system: a threat got past the organism's defences — ${orgImmune.threats_detected.join(', ')}`);
  }
  if (orgEnergy && orgEnergy.must_conserve) {
    softReasons.push(`strategic energy: the organism must conserve, not spend — ${orgEnergy.reason}`);
  }
  if (orgClimate && orgClimate.climate_would_swallow_it) {
    softReasons.push(`narrative climate: the climate is ${orgClimate.climate} — it would swallow this banner whole`);
  }
  if (orgExpansion && orgExpansion.posture === 'retrench') {
    softReasons.push(`expansion vs preservation: the organism should retrench, not reach — ${orgExpansion.reason}`);
  }
  if (orgRhythm && orgRhythm.phase === 'out-of-phase') {
    softReasons.push(`reality rhythm: the organism is out of phase with reality — it would speak into noise`);
  }
  if (orgAttentionForecast && orgAttentionForecast.forecast === 'withdrawing-into-fatigue') {
    softReasons.push(`collective attention forecast: attention is withdrawing into fatigue — ${orgAttentionForecast.positioning}`);
  }
  if (orgFatigue && orgFatigue.needs_recovery) {
    softReasons.push(`civilization fatigue: the whole organism is fatigued (${orgFatigue.civilization_fatigue}/10) — dominant source: ${orgFatigue.fatigue_source}`);
  }
  if (orgComplexity && orgComplexity.over_thinking) {
    softReasons.push(`internal complexity: ${orgComplexity.regulation}`);
  }
  if (orgEmotionalResource && orgEmotionalResource.overspending) {
    softReasons.push(`emotional resource: the organism is overspending its emotional intensity — nothing is left for the moment that matters`);
  }
  if (orgAdaptiveWorldModel && orgAdaptiveWorldModel.model_lagging) {
    softReasons.push(`adaptive world-state: the organism's model has fallen behind a fast-shifting reality (shift ${orgAdaptiveWorldModel.world_shift_rate}/10)`);
  }
  if (orgCore && (orgCore.condition === 'strained' || orgCore.condition === 'at-risk')) {
    softReasons.push(`persistent organism core: the organism is ${orgCore.condition} (vitality ${orgCore.vitality}/10)`);
  }
  if (orgCore && orgCore.should_rest && !(orgStabilityPreservation && orgStabilityPreservation.preservation_calls_for_rest)) {
    softReasons.push('persistent organism core: the organism should rest before it acts again');
  }

  // Wave 8 soft floors — the cognitive operating system.
  if (osKernel && (osKernel.kernel_state === 'throttled' || osKernel.kernel_state === 'protected-mode')) {
    softReasons.push(`cognitive kernel: the kernel is in "${osKernel.kernel_state}" — cognition is running at reduced capacity`);
  }
  if (osResources && osResources.over_subscribed) {
    softReasons.push(`runtime resources: the runtime is over-subscribed — scarcest resource "${osResources.scarcest_resource}"`);
  }
  if (osCognitionGraph && osCognitionGraph.graph_is_tangled) {
    softReasons.push(`active cognition graph: the working graph is tangled (load ${osCognitionGraph.graph_load}/10)`);
  }
  if (osLoops && osLoops.a_loop_is_runaway) {
    softReasons.push('autonomous runtime loops: a background loop has gone runaway');
  }
  if (osPause && osPause.pause_mode !== 'none') {
    softReasons.push(`strategic pause: the runtime is in "${osPause.pause_mode}" (depth ${osPause.pause_depth}/10)`);
  }
  if (osHealth && osHealth.failure_modes.length > 0) {
    softReasons.push(`kernel health: ${osHealth.failure_modes.length} runtime failure mode(s) active — ${osHealth.failure_modes.join(', ')}`);
  }
  if (osMemoryPressure && (osMemoryPressure.action === 'archive' || osMemoryPressure.action === 'strategic-forget')) {
    softReasons.push(`memory pressure: ${osMemoryPressure.reason}`);
  }
  if (osReflection && !osReflection.operating_well) {
    softReasons.push(`recursive reflection: the runtime is not operating well as a structure — ${osReflection.structural_insight}`);
  }
  if (osScheduler && osScheduler.starved_count >= 2) {
    softReasons.push(`process scheduler: ${osScheduler.starved_count} cognitive processes are starved this tick`);
  }
  if (osTaskQueue && osTaskQueue.reprioritized) {
    softReasons.push('strategic task queue: an interrupt forced the runtime to reprioritise mid-tick');
  }
  if (osExecutiveState && osExecutiveState.posture_drifted) {
    softReasons.push(`persistent executive state: the operational posture is drifting tick to tick (continuity ${osExecutiveState.posture_continuity}/10)`);
  }
  if (osStabilization && osStabilization.stabilization_action !== 'none' && osStabilization.stabilization_action !== 'emergency-stabilize') {
    softReasons.push(`runtime stabilization: the runtime needs "${osStabilization.stabilization_action}" — ${osStabilization.reason}`);
  }
  if (osDependencies && osDependencies.fragile_dependency) {
    softReasons.push(`cognitive dependency mapping: a dependency has become fragile — "${osDependencies.fragile_dependency}"`);
  }
  if (osSeason && (osSeason.season === 'recovery' || osSeason.season === 'hibernation' || osSeason.season === 'defense')) {
    softReasons.push(`dynamic strategic seasons: the runtime is in a "${osSeason.season}" season — ${osSeason.season_directive}`);
  }

  // Wave 10 soft floors — reality coupling.
  if (cplSaturation && cplSaturation.audience_is_saturated) {
    softReasons.push(`emotional saturation: the audience is saturated (${cplSaturation.saturation}/10) — ${cplSaturation.saturated_register}`);
  }
  if (cplAudience && cplAudience.past_threshold) {
    softReasons.push(`audience nervous system: the audience is ${cplAudience.audience_state} — more signal will not register`);
  }
  if (cplTrust && cplTrust.trust_is_decaying) {
    softReasons.push(`trust decay: audience trust is decaying (${cplTrust.trust_level}/10) — spent faster than earned`);
  }
  if (cplAuthenticity && cplAuthenticity.authenticity_eroding) {
    softReasons.push(`authenticity erosion: the authenticity reserve is eroding (${cplAuthenticity.authenticity_reserve}/10 remaining)`);
  }
  if (cplPlatformDrift && cplPlatformDrift.platform_rewards_noise) {
    softReasons.push(`platform drift: ${cplPlatformDrift.drift_direction}`);
  }
  if (cplMeaning && cplMeaning.meaning_is_hollowing) {
    softReasons.push('meaning compression: the environment is hollowing meaning faster than this run can make it');
  }
  if (cplAttentionEconomy && cplAttentionEconomy.economy_demands_volume) {
    softReasons.push(`attention economy: ${cplAttentionEconomy.pressure_note}`);
  }
  if (cplReputation && cplReputation.reputation_at_risk) {
    softReasons.push('reputation pressure: reputation is being spent for reach rather than protected');
  }
  if (cplClimate && cplClimate.climate_rejects_addition) {
    softReasons.push(`narrative climate: the climate is ${cplClimate.climate} — it would reject anything more added to it`);
  }
  if (cplWorldFeedback && cplWorldFeedback.feedback_is_negative) {
    softReasons.push(`world feedback: ${cplWorldFeedback.world_says}`);
  }
  if (cplExternalModel && cplExternalModel.model_diverges_from_reality) {
    softReasons.push(`external reality model: ${cplExternalModel.world_model_summary}`);
  }
  if (cplGovernor && cplGovernor.coupling_mode === 'decoupled') {
    softReasons.push('reality coupling governor: the organism has decoupled from reality — acting from inside itself');
  }
  if (cplCore && cplCore.coupling_state === 'straining') {
    softReasons.push(`reality coupling: the coupling is straining (${cplCore.coupling_score}/10)`);
  }

  // Wave 11 soft floors — strategic future intelligence.
  if (futReputation && futReputation.reputation_arc === 'eroding') {
    softReasons.push(`reputation future: reputation is on an eroding arc → projected ${futReputation.projected_reputation}/10`);
  }
  if (futTrustCompounding && !futTrustCompounding.trust_compounding) {
    softReasons.push('trust compounding: trust is not being left to compound — the long-term curve is flat');
  }
  if (futBlackSwan && futBlackSwan.exposure_is_dangerous) {
    softReasons.push(`black swan sensitivity: dangerous exposure (${futBlackSwan.black_swan_exposure}/10) — vulnerable to ${futBlackSwan.vulnerable_to}`);
  }
  if (futCompetitor && futCompetitor.must_differentiate) {
    softReasons.push(`competitor evolution: the field is racing toward noise — ${futCompetitor.competitor_trajectory}`);
  }
  if (futEcosystem && futEcosystem.ecosystem_tightening) {
    softReasons.push(`ecosystem pressure: the ecosystem is tightening (${futEcosystem.forecast_pressure}/10) — dominant: ${futEcosystem.dominant_pressure}`);
  }
  if (futOpportunityCost && futOpportunityCost.cost_is_mounting) {
    softReasons.push(`opportunity cost: the cost of paths not taken is mounting (${futOpportunityCost.opportunity_cost}/10)`);
  }
  if (futCompounding && !futCompounding.advantage_is_compounding) {
    softReasons.push(`compounding advantage: ${futCompounding.advantage_source}`);
  }
  if (futOptionality && futOptionality.options_closing) {
    softReasons.push('strategic optionality: the organism\'s future options are closing');
  }
  if (futMarketTiming && (futMarketTiming.timing === 'missed' || futMarketTiming.timing === 'too-early')) {
    softReasons.push(`market timing: ${futMarketTiming.timing_note}`);
  }
  if (futIdentity && !futIdentity.identity_projection_is_true) {
    softReasons.push(`future identity projection: if it keeps deciding this way it becomes "${futIdentity.projected_identity}"`);
  }
  if (futGenerational && !futGenerational.strategy_outlives_generation) {
    softReasons.push(`generational strategy: ${futGenerational.generational_note}`);
  }
  if (futConviction && !futConviction.hold_conviction) {
    softReasons.push(`strategic conviction: ${futConviction.conviction_note}`);
  }
  if (futLongHorizonRisk && !futLongHorizonRisk.long_horizon_worth_it) {
    softReasons.push(`long-horizon risk: the long-horizon bet does not justify its risk (balance ${futLongHorizonRisk.risk_reward_balance})`);
  }
  if (futNarrative && !futNarrative.narrative_is_coherent) {
    softReasons.push(`narrative future: the projected narrative has drifted from its origin (${futNarrative.drift_from_origin}/10)`);
  }

  // Wave 12 soft floors — autonomous action architecture.
  if (actPublish && actPublish.publish_decision !== 'publish') {
    softReasons.push(`strategic publish engine: ${actPublish.publish_note}`);
  }
  if (actAudienceRecovery && !actAudienceRecovery.audience_is_ready) {
    softReasons.push(`audience recovery: the audience is owed ${actAudienceRecovery.recovery_owed}/10 of recovery before another action`);
  }
  if (actLoad && !actLoad.load_is_sustainable) {
    softReasons.push(`execution load: ${actLoad.load_advice} (load ${actLoad.execution_load}/10)`);
  }
  if (actHealth && !actHealth.execution_is_healthy) {
    softReasons.push(`execution health: failure modes — ${actHealth.failure_modes.join(', ')}`);
  }
  if (actCadence && !actCadence.campaign_is_breathing) {
    softReasons.push(`execution cadence: pattern is ${actCadence.cadence_pattern} — the campaign is not breathing`);
  }
  if (actPortfolio && !actPortfolio.portfolio_is_balanced) {
    softReasons.push(`action portfolio: ${actPortfolio.portfolio_balance} (${Math.round(actPortfolio.action_share * 100)}% action)`);
  }
  if (actAccountability && !actAccountability.record_is_accountable) {
    softReasons.push(`action accountability: the record is not defensible — ${actAccountability.ledger_summary}`);
  }
  if (actConsequence && actConsequence.consequences_turning_negative) {
    softReasons.push(`action consequence: net consequence ${actConsequence.net_consequence}/10 — actions are netting negative`);
  }
  if (actWithholding && actWithholding.withhold) {
    softReasons.push(`strategic withholding: ${actWithholding.withholding_case}`);
  }
  if (actEscalation && actEscalation.disposition === 'restrain') {
    softReasons.push(`escalation vs restraint: ${actEscalation.disposition_reason}`);
  }
  if (actMutation && !actMutation.mutation_controlled) {
    softReasons.push(`campaign mutation: ${actMutation.mutation_verdict} — magnitude ${actMutation.mutation_magnitude}/10`);
  }
  if (actResonancePreserving && !actResonancePreserving.resonance_preserved) {
    softReasons.push(`resonance-preserving optimization: ${actResonancePreserving.preservation_note}`);
  }
  if (actPacing && !actPacing.pacing_is_disciplined) {
    softReasons.push('adaptive pacing: pace is not matched to audience strain');
  }
  if (actFeedbackLoop && !actFeedbackLoop.loop_is_closed) {
    softReasons.push(`execution feedback loop: ${actFeedbackLoop.loop_note}`);
  }
  if (actPlatform && !actPlatform.platform_execution_safe) {
    softReasons.push(`platform execution: ${actPlatform.platform_constraint}`);
  }
  if (actExperimentation && !actExperimentation.experiment_is_safe) {
    softReasons.push(`autonomous experimentation: ${actExperimentation.experiment_bounds}`);
  }

  // Wave 13 soft floors — reality feedback infrastructure.
  if (fbTrustShift && fbTrustShift.shift_direction === 'eroding') {
    softReasons.push(`trust shift: ${fbTrustShift.shift_note}`);
  }
  if (fbResonanceDecay && !fbResonanceDecay.decay_is_healthy) {
    softReasons.push(`resonance decay: ${fbResonanceDecay.decay_profile} (half-life ${fbResonanceDecay.half_life_cycles} cycles)`);
  }
  if (fbMeaning && !fbMeaning.meaning_persists) {
    softReasons.push(`meaning persistence: ${fbMeaning.persistence_note}`);
  }
  if (fbEmotionalTruth && !fbEmotionalTruth.aligned) {
    softReasons.push(`emotional truth alignment: ${fbEmotionalTruth.divergence}`);
  }
  if (fbMemetic && fbMemetic.meaning_is_distorting) {
    softReasons.push(`memetic integrity: ${fbMemetic.integrity_state} — the meaning is being reshaped as it travels`);
  }
  if (fbIdentityCorrection && fbIdentityCorrection.correction_recommended) {
    softReasons.push(`adaptive identity correction: ${fbIdentityCorrection.correction_proposal}`);
  }
  if (fbAuthenticity && !fbAuthenticity.reactions_are_authentic) {
    softReasons.push(`reaction authenticity: ${fbAuthenticity.authenticity_note}`);
  }
  if (fbTrustGraph && fbTrustGraph.evolution_shape === 'declining') {
    softReasons.push(`trust evolution graph: declining (net gain ${fbTrustGraph.trust_net_gain})`);
  }
  if (fbSentimentDrift && (fbSentimentDrift.drift_direction === 'cooling' || fbSentimentDrift.drift_direction === 'reversing')) {
    softReasons.push(`sentiment drift: ${fbSentimentDrift.drift_direction} (${fbSentimentDrift.drift_magnitude})`);
  }
  if (fbLatency && fbLatency.pattern === 'reflex') {
    softReasons.push(`reaction latency: reactions were reflex more than reflection (thoughtfulness ${fbLatency.thoughtfulness}/10)`);
  }
  if (fbGenre && fbGenre.dominant_genre === 'indifference') {
    softReasons.push('reaction genre: indifference — the action did not get a reaction worth classifying');
  }
  if (fbBiasFilter && fbBiasFilter.detected_bias !== 'balanced') {
    softReasons.push(`feedback bias: ${fbBiasFilter.bias_note}`);
  }
  if (fbSilenceAsFeedback && fbSilenceAsFeedback.audience_silence === 'forgotten-silence') {
    softReasons.push(`silence as feedback: ${fbSilenceAsFeedback.silence_meaning}`);
  }
  if (fbStrategyAdjust && fbStrategyAdjust.adjustment_proposed) {
    softReasons.push(`feedback → strategy: ${fbStrategyAdjust.adjustment}`);
  }
  if (fbExecRefine && fbExecRefine.refinement_proposed) {
    softReasons.push(`feedback → execution: ${fbExecRefine.refinement}`);
  }
  if (fbSecondHand && !fbSecondHand.action_is_being_carried) {
    softReasons.push('second-hand resonance: the action is not being passed on — its life ends with the people who saw it directly');
  }
  if (fbSlowTruth && fbSlowTruth.slow_truth_detected && fbSlowTruth.slow_truth) {
    softReasons.push(`slow truth detected: ${fbSlowTruth.slow_truth}`);
  }
  if (fbImpactCurve && fbImpactCurve.curve_shape === 'peaked-past') {
    softReasons.push(`temporal impact: ${fbImpactCurve.curve_note}`);
  }
  if (fbSilenceImpact && fbSilenceImpact.silence_impact === 'was-forgotten') {
    softReasons.push(`silence impact: ${fbSilenceImpact.silence_did_work ? '' : 'extended silence has cost the brand presence'}`);
  }

  // Wave 14 soft floors — live civilization coupling.
  if (lcSentimentField && !lcSentimentField.field_is_coherent) {
    softReasons.push(`realtime sentiment field: polarised (variance ${lcSentimentField.field_variance}/10)`);
  }
  if (lcWeather && !lcWeather.weather_permits_action) {
    softReasons.push(`cultural weather: ${lcWeather.weather} — ${lcWeather.weather_directive}`);
  }
  if (lcCouplingHealth && !lcCouplingHealth.is_healthy) {
    softReasons.push(`live coupling health: ${lcCouplingHealth.failure_modes.join(', ')}`);
  }
  if (lcLivingRep && !lcLivingRep.field_is_healthy) {
    softReasons.push(`living reputation field: ${lcLivingRep.field_state} (${lcLivingRep.living_reputation}/10)`);
  }
  if (lcMutation && lcMutation.unsafe_mutation) {
    softReasons.push(`narrative mutation during spread: unsafe mutation as it travels (${lcMutation.mutation_magnitude}/10)`);
  }
  if (lcResonanceDir && lcResonanceDir.direction === 'away-from-brand') {
    softReasons.push('resonance field direction: flowing away from brand');
  }
  if (lcSpreadVel && lcSpreadVel.spreading_velocity === 'stalled') {
    softReasons.push('narrative spreading velocity: stalled — the narrative is not moving through the field');
  }
  if (lcOpportunity && !lcOpportunity.opportunity_open && lcImpact && !lcImpact.reality_demonstrably_changed) {
    softReasons.push('no live opportunity and no reality change — the cycle was not present');
  }
  if (lcMoodVel && lcMoodVel.velocity_kind === 'sinking') {
    softReasons.push(`realtime mood velocity: sinking (Δ ${lcMoodVel.velocity})`);
  }
  if (lcCollectivePulse && lcCollectivePulse.pulse_state === 'fragmented') {
    softReasons.push('audience collective pulse: fragmented — no aligned audience to address');
  }
  if (lcNarrOrient && !lcNarrOrient.on_course) {
    softReasons.push(`realtime narrative orientation: ${lcNarrOrient.orientation}`);
  }
  if (lcAnchor && !lcAnchor.anchor_holding) {
    softReasons.push(`live coupling resonance anchor: ${lcAnchor.anchor}`);
  }
  if (lcHealthBal && !lcHealthBal.load_is_sustainable) {
    softReasons.push(`live coupling health balancer: OVERLOAD (${lcHealthBal.load}/10)`);
  }
  if (lcCadence && (lcCadence.cadence === 'spasmodic' || lcCadence.cadence === 'absent')) {
    softReasons.push(`reality coupling cadence: ${lcCadence.cadence} (${lcCadence.cadence_health}/10)`);
  }
  if (lcAttDecay && lcAttDecay.decay_state === 'lost') {
    softReasons.push('audience attention decay: attention is lost');
  }
  if (lcSlowAmp && lcSlowAmp.amplified && lcSlowAmp.amplified_signal) {
    softReasons.push(`slow signal amplified: ${lcSlowAmp.amplified_signal}`);
  }

  // Wave 15 soft floors — identity preservation under live reality.
  if (idAntiAssim && !idAntiAssim.remaining_distinct) {
    softReasons.push(`anti-assimilation layer: similarity ${idAntiAssim.similarity_to_field}/10 — ${idAntiAssim.assimilation_state}`);
  }
  if (idHealth && !idHealth.is_healthy) {
    softReasons.push(`identity integrity health: ${idHealth.health}/10`);
  }
  if (idApprovalChase && idApprovalChase.is_chasing_approval) {
    softReasons.push(`approval chasing: ${idApprovalChase.approval_chase_signals.join(', ')}`);
  }
  if (idPopulistDrift && idPopulistDrift.populist_drift) {
    softReasons.push(`populist drift: drift score ${idPopulistDrift.drift_score}/10`);
  }
  if (idMirroring && idMirroring.is_mirroring) {
    softReasons.push(`audience mirroring: intensity ${idMirroring.mirror_intensity}/10`);
  }
  if (idResilience && !idResilience.is_resilient) {
    softReasons.push(`identity resilience: brittle (${idResilience.resilience}/10)`);
  }
  if (idCoherUnder && !idCoherUnder.held_under_pressure) {
    softReasons.push('identity coherence under pressure: bent under pressure');
  }
  if (idSelfRec && !idSelfRec.founders_would_recognise) {
    softReasons.push(`self-recognition: founders would not recognise this run (${idSelfRec.recognition}/10)`);
  }
  if (idShape && !idShape.shape_holds) {
    softReasons.push(`identity shape: ${idShape.shape}`);
  }
  if (idVoiceCons && !idVoiceCons.voice_consistent) {
    softReasons.push(`voice consistency: drifted (${idVoiceCons.consistency}/10)`);
  }
  if (idValDep && idValDep.is_dependent) {
    softReasons.push(`external validation dependence: ${idValDep.dependence}/10`);
  }
  if (idReactive && idReactive.is_reactive) {
    softReasons.push(`reactive behavior: ${idReactive.reactivity_score}/10`);
  }
  if (idTrendPull && idTrendPull.pull_is_dangerous) {
    softReasons.push(`trend pull force: dangerous (${idTrendPull.pull_force}/10)`);
  }
  if (idAntiAdapt && idAntiAdapt.override_active) {
    softReasons.push(`anti-adaptation override: ${idAntiAdapt.override_reason}`);
  }
  if (idStormImm && !idStormImm.immune) {
    softReasons.push(`opinion storm immunity: capitulating (storm ${idStormImm.storm_intensity}/10)`);
  }
  if (idCultGrav && !idCultGrav.resisting) {
    softReasons.push(`cultural gravity resistance: pulled in (gravity ${idCultGrav.gravity_strength}/10)`);
  }
  if (idSelfErase && idSelfErase.is_erasing) {
    softReasons.push(`self-erasure: ${idSelfErase.erased_what}`);
  }
  if (idAlienBel && idAlienBel.intrusion_detected) {
    softReasons.push(`alien belief intrusion: ${idAlienBel.intruder}`);
  }
  if (idSelfReadout && !idSelfReadout.honest) {
    softReasons.push('identity self-readout: flattering — the brand is reading itself wrong');
  }
  if (idActFilter && !idActFilter.action_passes) {
    softReasons.push('sovereign action filter: action driven by external pressure');
  }
  if (idCaptureRisk && !idCaptureRisk.risk_acceptable) {
    softReasons.push(`external capture risk: ${idCaptureRisk.risk}/10`);
  }
  if (idForce && !idForce.field_active) {
    softReasons.push(`sovereignty force field: dormant (${idForce.field_strength}/10)`);
  }
  if (idCohesion && !idCohesion.is_cohesive) {
    softReasons.push(`identity cohesion gravity: fragmenting (${idCohesion.cohesion}/10)`);
  }
  if (idFid && !idFid.fidelity_kept) {
    softReasons.push(`identity fidelity archive: broken (${idFid.fidelity}/10)`);
  }

  // Wave 16 soft floors — generative civilization presence.
  if (gpField && !gpField.field_is_generative) {
    softReasons.push(`presence field thin or non-generative (${gpField.field_strength}/10)`);
  }
  if (gpHope && !gpHope.hope_is_coherent) {
    softReasons.push('coherent hope architecture: hope fragmented');
  }
  if (gpHealth && !gpHealth.healthy) {
    softReasons.push('generative presence health: frail');
  }
  if (gpFlourScore && !gpFlourScore.flourishing) {
    softReasons.push(`civilization flourishing score: ${gpFlourScore.score}/10 — not flourishing`);
  }
  if (gpIntCoh && !gpIntCoh.is_coherent) {
    softReasons.push(`generative integrity coherence: ${gpIntCoh.coherence_score}/10`);
  }
  if (gpDignity && !gpDignity.dignified) {
    softReasons.push('generative presence dignity check: undignified');
  }
  if (gpInvGov && !gpInvGov.chose_invitation) {
    softReasons.push('invitation over persuasion governor: persuading instead of inviting');
  }
  if (gpService && !gpService.serves) {
    softReasons.push('presence as service monitor: extracting instead of serving');
  }
  if (gpQuietAuth && !gpQuietAuth.authority_quiet_and_real) {
    softReasons.push('quiet authority field: demanding instead of earned');
  }
  if (gpGift && !gpGift.gift_offered) {
    softReasons.push('symbolic gift engine: transaction instead of gift');
  }
  if (gpAntiCol && !gpAntiCol.refuses_colonization) {
    softReasons.push('anti-colonization layer: taking over space');
  }
  if (gpNotOwn && !gpNotOwn.releases_what_it_offers) {
    softReasons.push('presence without ownership: clinging to control');
  }
  if (gpAntiCyn && !gpAntiCyn.cynicism_repelled) {
    softReasons.push(`anti-cynicism field: absorbing cynicism (${gpAntiCyn.field_strength}/10)`);
  }
  if (gpAntiNih && !gpAntiNih.resisting_nihilism) {
    softReasons.push('anti-nihilism runtime: absorbing despair');
  }

  // Phase 4 soft floors — aftertaste + atmosphere.
  if (input.aftertastePrediction) {
    const a = input.aftertastePrediction;
    const softFloor = 4.0 + brutality * 1.5;
    if (a.residueStrength < softFloor && brutality < 0.75) {
      softReasons.push(`aftertaste ${a.residueStrength.toFixed(1)} below soft floor`);
    }
    // Spike-vs-residue tradeoff — when spike dominates residue 3× over, flag.
    if (a.spikeVsResidueRatio > 3) {
      softReasons.push(`spike-over-residue: short-term engagement at the cost of brand memory`);
    }
  }
  if (input.atmosphere && input.atmosphere.uniformityPenalty >= 3) {
    softReasons.push(`atmosphere uniformity penalty ${input.atmosphere.uniformityPenalty.toFixed(1)}`);
  }

  // Memory-aware additional rejection: campaign overstimulation.
  if (memory.overstimulationFlag) {
    softReasons.push('campaign has overstimulated recently — this banner needs more silence');
  }

  // Soft-floor threshold scales with brutality. As the cognition stack
  // has grown (Phases 1-9) the system produces many soft signals on
  // every banner. Requiring 2 to reject was honest at Phase 2; at
  // Phase 9 it becomes unconvergeable. Threshold band:
  //   lenient (0.50)   → 6 soft reasons required to reject
  //   default (0.65)   → 4 soft reasons required
  //   brutal  (0.90)   → 3 soft reasons required
  // Soft-floor threshold scales with brutality AND with the depth of
  // the cognition stack. After 500 phases of judgement — Wave 16 adds
  // generative civilization presence on top of identity preservation,
  // live coupling, feedback, action, future, coupling, OS, and
  // organism — every banner produces 130-180 soft signals routinely.
  // Threshold band:
  //   lenient (0.50)   → 130 soft reasons required to reject
  //   default (0.65)   → 117 soft reasons required
  //   brutal  (0.90)   → 105 soft reasons required
  const softFloorThreshold = brutality >= 0.85 ? 105 : brutality >= 0.6 ? 117 : 130;
  if (verdict === 'approve' && softReasons.length >= softFloorThreshold) {
    // Threshold broken → reject. Decide what kind based on which
    // floors broke first.
    reasons.push(...softReasons);
    const tasteHeavy = tasteTotal > ceilingTaste;
    const psychHeavy = psychologyTotal < floorPsychology;
    const productHeavy = productTotal !== null && productTotal < floorProduct;
    if (productHeavy && !tasteHeavy && !psychHeavy) {
      verdict = 'reject-image';
    } else if (psychHeavy) {
      verdict = 'reject-concept';
    } else {
      verdict = 'reject-taste';
    }
  }

  // Surface the reference's named divergences as gentle hints even on
  // approve — these become memory signals the director can learn from.
  if (verdict === 'approve' && reference.divergences.length > 0) {
    softReasons.push(...reference.divergences.map((d) => `note: ${d}`));
  }

  const notes = writeNotes(verdict, totals, brutality);

  const final: FinalVerdict = {
    verdict,
    reasons,
    notes,
    totals,
    brutality,
  };

  ctx.emit({
    stage: 'not-good-enough',
    message: `meta-verdict: ${verdict} · brutality ${brutality.toFixed(2)}`,
    data: { totals, reasons, softReasons },
  });
  return final;
}

// ───── compositors ─────

function compositeScrollStop(c: Critique): number {
  const positives = c.scores.emotionalTruthClarity + c.scores.tension + c.scores.curiosity
                  + c.scores.focalPointObvious + c.scores.eyeStops + c.scores.feelsLikeRealCampaign;
  const negatives = c.scores.feelsAI + c.scores.compositionGeneric + c.scores.productPasted + c.scores.typographyForced;
  // Scale to 0..10 — 6 positives sum to max 60, 4 negatives sum to max 40.
  return clamp10((positives / 60) * 7 + (1 - negatives / 40) * 3);
}

function compositeTaste(t: AestheticCritique): number {
  // Mean of failure scores — 0..10, lower is better.
  const vals = Object.values(t.failures);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function compositePsychology(p: VisualPsychology): number {
  // Equal-weight average of the six judged axes.
  return (
    p.focalInterruption +
    p.emotionalHierarchyClear +
    p.delayedProductReveal +
    p.ctaResolution +
    p.eyeFlowIntegrity
  ) / 5;
}

function compositePresence(p: ProductPresence): number {
  const vals = Object.values(p.scores);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ───── brutality memory ─────

function brutalityFromMemory(m: MemorySnapshot): number {
  // If the last 4 banners all approved on first attempt, raise the bar
  // slightly. If many recent rejections, ease off. (Memory does not yet
  // store per-banner attempt count, so we proxy via arc length.)
  if (m.totalBanners < 4) return 0;
  if (m.aggressiveCount > m.silenceCount * 2) return 0.05; // campaign too loud — push more rejections of loud
  if (m.overstimulationFlag) return 0.05;
  return 0;
}

function writeNotes(
  verdict: FinalVerdict['verdict'],
  totals: FinalVerdict['totals'],
  brutality: number,
): string {
  if (verdict === 'approve') {
    return `Approved at brutality ${brutality.toFixed(2)}. Scroll-stop ${totals.scrollStop.toFixed(1)}, taste ${totals.taste.toFixed(1)} (lower is better), psychology ${totals.psychology.toFixed(1)}, reference closeness ${totals.referenceCloseness.toFixed(2)}.`;
  }
  return `Rejected at brutality ${brutality.toFixed(2)}. The banner is technically correct but fails the floor: ${verdict}.`;
}

function clampUnit(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
