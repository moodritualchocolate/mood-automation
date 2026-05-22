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
          cognitiveContinuity, runtimeDrift, priorNextRunDirective } = input;

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
  // the cognition stack. After 27 phases of judgement every banner
  // produces 15-24 soft signals routinely. Threshold band:
  //   lenient (0.50)   → 21 soft reasons required to reject
  //   default (0.65)   → 18 soft reasons required
  //   brutal  (0.90)   → 14 soft reasons required
  const softFloorThreshold = brutality >= 0.85 ? 14 : brutality >= 0.6 ? 18 : 21;
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
